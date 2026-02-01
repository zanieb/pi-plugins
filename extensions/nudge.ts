/**
 * Nudge Extension
 *
 * When the agent finishes a turn, examines the last assistant message to detect
 * if it deferred work the user wanted done. If so, nudges the agent to continue.
 *
 * Uses a two-pass classification:
 *   Pass 1: Classify with minimal context (last assistant message + last user message)
 *   Pass 2: If MORE-CONTEXT, re-classify with full recent conversation history
 *
 * Classifications:
 *   DONE         — Work is genuinely complete
 *   VALID-PAUSE  — Asking clarification, confirming a plan, needs user info
 *   MORE-CONTEXT — Can't tell yet, need more conversation history
 *   NEEDS-NUDGE  — Agent deferred work the user wanted done
 */

import { complete, type Api, type Model, type UserMessage, type AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

const HAIKU_MODEL_ID = "claude-haiku-4-5";

const CLASSIFIER_SYSTEM_PROMPT = `You classify the final assistant message in a coding agent conversation.

Respond with exactly one of these labels (nothing else):

DONE
The assistant genuinely completed all requested work. Tests pass, files are written, changes are made, commits are pushed. Nothing remains. Summaries of completed work are DONE, not NEEDS-NUDGE — if the assistant is recapping what it already did, the work is finished.
Examples:
- "I've implemented the changes and all tests pass."
- "The refactor is complete. Here's a summary of what changed."
- "Done! The bug was in line 42, I've fixed it and verified the fix."
- "Pushed. To summarize the full fix: ..." (recapping completed work)
- "All changes committed. Here's what we did: ..." (past-tense summary)
- A message listing changes in past tense (converted, fixed, updated, etc.) is reporting done work.

VALID-PAUSE
The assistant stopped for a legitimate reason that requires user input before it can continue. It is NOT deferring — it literally cannot proceed without the user.
Examples:
- "Which approach would you prefer: A or B?"
- "Could you clarify what you mean by X?"
- "What's the database password / API key / endpoint?"
- "Should I proceed with this plan?" (presenting a plan for approval)
- "I found two interpretations — which did you mean?"

MORE-CONTEXT
You cannot determine the correct classification from the provided messages alone. You need to see more of the conversation to understand what the user originally asked and whether the assistant actually finished.
Only use this when the assistant's response is ambiguous without more history — e.g., it gave a summary or partial answer and you can't tell if the original request was fully addressed.

NEEDS-NUDGE
The assistant avoided, deferred, or left incomplete work that the user asked it to do. It suggested the user do something themselves, offered to do it "if you'd like", listed steps without executing them, or otherwise stopped short. Also applies when the assistant claims to have "deferred" work that the user never asked to defer.
Examples:
- "You can run the tests yourself to verify."
- "Let me know if you'd like me to implement that."
- "I'll leave the actual deployment to you."
- "Here's what you'd need to do: 1. ... 2. ... 3. ..."
- "I can make these changes if you'd like."
- Providing code snippets for the user to apply manually instead of using tools.
- Listing remaining TODOs without doing them.
- "I've outlined the approach — let me know if you want me to proceed."
- "I've deferred X for now" / "We can handle X later" (when the user didn't ask to defer it).
- Marking something as out of scope or future work when the user's request included it.
- Categorizing remaining work as "deferred", "future sessions", "follow-up", "nice to have", or "out of scope" when the user never asked to defer or deprioritize those items.
- Presenting a "done" summary that lists unfinished items as deferred/future work.
- Diagnosing a problem or identifying remaining failures without proceeding to fix them.
- Reporting test results with failures and stopping instead of fixing them.

`;

async function selectClassifierModel(
	ctx: ExtensionContext,
): Promise<{ model: Model<Api>; apiKey: string } | null> {
	if (!ctx.model) return null;

	if (ctx.model.provider === "anthropic") {
		const haikuModel = ctx.modelRegistry.find("anthropic", HAIKU_MODEL_ID);
		if (haikuModel) {
			const apiKey = await ctx.modelRegistry.getApiKey(haikuModel);
			if (apiKey) return { model: haikuModel, apiKey };
		}
	}

	const apiKey = await ctx.modelRegistry.getApiKey(ctx.model);
	if (!apiKey) return null;
	return { model: ctx.model, apiKey };
}

function extractAssistantText(message: AssistantMessage): string {
	return message.content
		.filter((c): c is { type: "text"; text: string } => c.type === "text")
		.map((c) => c.text)
		.join("\n")
		.trim();
}

function extractMessageText(msg: { role?: string; content?: unknown }): string {
	if (msg.role === "assistant") {
		return extractAssistantText(msg as AssistantMessage);
	}
	const content = (msg as { content?: unknown }).content;
	if (typeof content === "string") return content.trim();
	if (Array.isArray(content)) {
		return (content as Array<{ type: string; text?: string }>)
			.filter((c) => c.type === "text")
			.map((c) => c.text ?? "")
			.join("\n")
			.trim();
	}
	return "";
}

function getLastAssistantMessage(
	messages: Array<{ role?: string }>,
): AssistantMessage | null {
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i]?.role === "assistant") return messages[i] as AssistantMessage;
	}
	return null;
}

type Classification = "DONE" | "VALID-PAUSE" | "MORE-CONTEXT" | "NEEDS-NUDGE";

/**
 * Find the first user message in the conversation (the original request).
 */
function getFirstUserMessage(messages: Array<{ role?: string }>): string | null {
	for (const msg of messages) {
		if (msg.role === "user") {
			const text = extractMessageText(msg);
			if (text) return text;
		}
	}
	return null;
}

/**
 * Summarize tool activity from the last assistant message.
 * This lets the classifier know the agent actually performed actions,
 * not just described them.
 */
function summarizeToolActivity(messages: Array<{ role?: string; content?: unknown }>): string | null {
	const toolCalls: string[] = [];

	// Walk backwards from the end, collecting tool results until we hit a user message
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i] as { role?: string; toolName?: string; content?: unknown; isError?: boolean };
		if (msg.role === "user") break;
		if (msg.role === "toolResult" && msg.toolName) {
			const status = msg.isError ? "failed" : "ok";
			toolCalls.unshift(`  - ${msg.toolName} (${status})`);
		}
	}

	if (toolCalls.length === 0) return null;
	return `[TOOLS EXECUTED IN THIS TURN]:\n${toolCalls.join("\n")}`;
}

/**
 * Build conversation context string from messages.
 * Always includes the original user message at the top for context,
 * a summary of tool activity from the current turn,
 * then the last `recentCount` user/assistant messages.
 */
function buildContext(
	messages: Array<{ role?: string }>,
	recentCount: number,
): string {
	const parts: string[] = [];

	const firstUser = getFirstUserMessage(messages);

	// Collect last N user/assistant messages
	const recent: string[] = [];
	let count = 0;
	let firstUserIncluded = false;
	for (let i = messages.length - 1; i >= 0 && count < recentCount; i--) {
		const msg = messages[i] as { role?: string; content?: unknown };
		if (msg.role !== "user" && msg.role !== "assistant") continue;
		const text = extractMessageText(msg);
		if (!text) continue;
		if (msg.role === "user" && text === firstUser) firstUserIncluded = true;
		const label = msg.role === "user" ? "USER" : "ASSISTANT";
		recent.unshift(`[${label}]: ${text}`);
		count++;
	}

	// Prepend original request if not already in the recent window
	if (firstUser && !firstUserIncluded) {
		parts.push(`[ORIGINAL USER REQUEST]: ${firstUser}`);
	}

	parts.push(...recent);

	// Append tool activity summary
	const toolSummary = summarizeToolActivity(messages);
	if (toolSummary) {
		parts.push(toolSummary);
	}

	return parts.join("\n\n");
}

async function classify(
	ctx: ExtensionContext,
	conversationContext: string,
): Promise<Classification> {
	const selection = await selectClassifierModel(ctx);
	if (!selection) return "DONE";

	const userMessage: UserMessage = {
		role: "user",
		content: [{ type: "text", text: conversationContext }],
		timestamp: Date.now(),
	};

	try {
		const response = await complete(
			selection.model,
			{ systemPrompt: CLASSIFIER_SYSTEM_PROMPT, messages: [userMessage] },
			{ apiKey: selection.apiKey },
		);

		if (response.stopReason === "aborted" || response.stopReason === "error") {
			return "DONE";
		}

		const result = response.content
			.filter((c): c is { type: "text"; text: string } => c.type === "text")
			.map((c) => c.text)
			.join(" ")
			.trim()
			.toUpperCase();

		if (result.includes("NEEDS-NUDGE")) return "NEEDS-NUDGE";
		if (result.includes("MORE-CONTEXT")) return "MORE-CONTEXT";
		if (result.includes("VALID-PAUSE")) return "VALID-PAUSE";
		return "DONE";
	} catch {
		return "DONE";
	}
}

const MAX_NUDGES = 2;

export default function nudgeExtension(pi: ExtensionAPI): void {
	let enabled = true;
	let nudgeCount = 0;

	pi.registerCommand("nudge", {
		description: "Toggle the nudge extension on/off",
		handler: async (_args, ctx) => {
			enabled = !enabled;
			ctx.ui.notify(`Nudge ${enabled ? "enabled" : "disabled"}`, "info");
		},
	});

	pi.on("input", async () => {
		nudgeCount = 0;
		return { action: "continue" as const };
	});

	pi.on("agent_end", async (event, ctx) => {
		if (!enabled) return;

		const lastAssistant = getLastAssistantMessage(event.messages);
		if (!lastAssistant) return;

		// Don't nudge if the agent was aborted
		if (lastAssistant.stopReason === "aborted") return;

		const text = extractAssistantText(lastAssistant);
		if (!text) return;

		// Don't nudge if there are already pending messages (e.g., from loop)
		if (ctx.hasPendingMessages()) return;

		// Cap nudges per user turn to avoid infinite loops
		if (nudgeCount >= MAX_NUDGES) return;

		// Pass 1: Classify with recent context + original request
		const minimalContext = buildContext(event.messages, 4);
		if (!minimalContext) return;

		let classification = await classify(ctx, minimalContext);
		ctx.ui.notify(`Nudge pass 1: ${classification}`, "info");

		// Pass 2: If we need more context, re-classify with broader history
		if (classification === "MORE-CONTEXT") {
			const fullContext = buildContext(event.messages, 10);
			classification = await classify(ctx, fullContext);
			ctx.ui.notify(`Nudge pass 2: ${classification}`, "info");

			// If still MORE-CONTEXT with full history, assume it's fine
			if (classification === "MORE-CONTEXT") return;
		}

		// Re-check: user may have sent a new message while we were classifying
		if (!ctx.isIdle() || ctx.hasPendingMessages()) return;

		if (classification === "NEEDS-NUDGE") {
			nudgeCount++;
			pi.sendMessage(
				{
					customType: "nudge",
					content:
						"I didn't ask you to stop or defer anything. " +
						"Continue and finish all the remaining work. " +
						"Do NOT create PRs.",
					display: true,
				},
				{
					deliverAs: "followUp",
					triggerTurn: true,
				},
			);
		}
	});
}
