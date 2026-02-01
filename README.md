# pi-plugins

[pi](https://github.com/badlogic/pi-mono) extensions and skills, installed via symlinks into `~/.pi/agent/`.

## Install

```bash
./install
```

Use `--force` to overwrite existing symlinks or directories.

Respects `PI_CODING_AGENT_DIR` environment variable (defaults to `~/.pi/agent`).

## Contents

- `extensions/` — pi extensions (TypeScript modules loaded by the agent)
- `prompts/` — pi prompt templates (markdown snippets that expand via `/name`)
- `skills/` — pi skills (markdown instructions for specific tasks)
