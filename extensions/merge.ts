import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("merge", {
    description: "Fix merge conflicts in the current repository",
    handler: async (args, ctx) => {
      const prompt = args?.trim()
        ? `Fix the merge conflicts in this repository. ${args}

Steps:
1. Run \`git diff --name-only --diff-filter=U\` to find files with conflicts.
2. For each conflicted file, use \`git log --merge -p -- <file>\` to review the history of both sides. Understand the original intent of each change so the resolution preserves both goals.
3. Read the conflicted file and resolve the conflict markers (<<<<<<< / ======= / >>>>>>>), keeping the correct combined result that honors the intent of both sides.
4. When all conflicts are resolved, report what you did and the reasoning behind each resolution. Do NOT stage or commit the files.
5. After finishing, run the relevant checks and tests for the changes you made, and report the results.`
        : `Fix the merge conflicts in this repository.

Steps:
1. Run \`git diff --name-only --diff-filter=U\` to find files with conflicts.
2. For each conflicted file, use \`git log --merge -p -- <file>\` to review the history of both sides. Understand the original intent of each change so the resolution preserves both goals.
3. Read the conflicted file and resolve the conflict markers (<<<<<<< / ======= / >>>>>>>), keeping the correct combined result that honors the intent of both sides.
4. When all conflicts are resolved, report what you did and the reasoning behind each resolution. Do NOT stage or commit the files.
5. After finishing, run the relevant checks and tests for the changes you made, and report the results.`;

      pi.sendUserMessage(prompt);
    },
  });
}
