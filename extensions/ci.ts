import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("ci", {
    description: "Check CI status and debug failures",
    handler: async (args, ctx) => {
      const prompt = args?.trim()
        ? `/skill:debug-ci ${args}`
        : `/skill:debug-ci Check the CI status for the current branch. If there are failures, investigate the logs and explain what went wrong and how to fix it.`;

      pi.sendUserMessage(prompt);
    },
  });
}
