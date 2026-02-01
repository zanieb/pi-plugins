---
description: Manage Sprites environments and run commands with the sprite CLI.
---

```
USAGE:
  sprite [global options] <command> [command options] [arguments]

KEY COMMANDS:
  login | logout             Authenticate or remove config
  create <name>              Create a new sprite
  use [sprite]               Activate a sprite for the current directory
  list (ls)                  List sprites
  exec (x) <cmd>             Run a command in the sprite
  console (c)                Open an interactive shell
  checkpoint create|list     Manage checkpoints
  restore <id>               Restore from a checkpoint
  destroy                    Destroy the current sprite
  proxy <port...>            Forward local ports
  url                        Show sprite URL
  url update --auth <type>   Update URL auth settings
  upgrade                    Upgrade the sprite client

GLOBAL OPTIONS:
  --debug[=<file>]           Enable debug logging
  -o, --org <name>           Specify organization
  -s, --sprite <name>        Specify sprite
  -h, --help                 Show help message

EXAMPLES:
  sprite login
  sprite create my-sprite
  sprite use my-sprite
  sprite exec ls -la
  sprite console
  sprite checkpoint create
  sprite restore my-checkpoint-id
  sprite proxy 8080 3000
  sprite url update --auth public

API REFERENCE:
  https://docs.sprites.dev/api/v001-rc30/
```
