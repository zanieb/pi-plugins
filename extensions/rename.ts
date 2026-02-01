/**
 * Auto-rename session via LLM.
 *
 * Usage: /rename
 *
 * Sends the conversation to the current model and asks for a short session name,
 * then applies it with pi.setSessionName().
 */

import { complete, getModel } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { convertToLlm, serializeConversation } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("rename", {
		description: "Auto-generate a session name from conversation context",
		handler: async (_args, ctx) => {
			const model = getModel("anthropic", "claude-haiku-4-5");
			if (!model) {
				ctx.ui.notify("Could not find claude-haiku-4-5", "error");
				return;
			}

			const { messages } = ctx.sessionManager.buildSessionContext();
			const llmMessages = convertToLlm(messages);
			const conversationText = serializeConversation(llmMessages);

			if (!conversationText.trim()) {
				ctx.ui.notify("No conversation to summarize", "warning");
				return;
			}

			const apiKey = await ctx.modelRegistry.getApiKey(model);
			if (!apiKey) {
				ctx.ui.notify(`No API key for anthropic`, "error");
				return;
			}

			const currentName = pi.getSessionName();

			ctx.ui.notify("Generating session name...", "info");

			try {
				const response = await complete(
					model,
					{
						messages: [
							{
								role: "user",
								content: [
									{
										type: "text",
										text: `Write a very short sentence (5-15 words, no quotes) summarizing the user's goal in this conversation. This will be used as the display name for the session. Be brief, direct, and accurate — don't start with "Help user" or similar phrasing. Focus on user-facing changes and desired outcomes, not implementation details or back-and-forth discussion.${currentName ? ` The current session name is "${currentName}" — improve on it if needed.` : ""} Just output the sentence, nothing else.

<conversation>
${conversationText}
</conversation>`,
									},
								],
								timestamp: Date.now(),
							},
						],
					},
					{ apiKey, maxTokens: 50 },
				);

				const name = response.content
					.filter((c): c is { type: "text"; text: string } => c.type === "text")
					.map((c) => c.text)
					.join("")
					.trim()
					.replace(/\.+$/, "");

				if (!name) {
					ctx.ui.notify("LLM returned empty name", "warning");
					return;
				}

				pi.setSessionName(name);
				ctx.ui.notify(`Renamed session to "${name}"`, "info");
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`Failed to generate name: ${message}`, "error");
			}
		},
	});
}
