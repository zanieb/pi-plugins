import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("tool_result", async (event, ctx) => {
    if (!["edit", "write"].includes(event.toolName)) return;

    const filePath = event.input?.path;
    if (!filePath || !filePath.endsWith(".rs")) return;

    await pi.exec("cargo", ["fmt", "--", filePath], { timeout: 10000 });
  });
}
