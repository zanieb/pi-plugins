---
description: Manage and connect to virtual machines via exe.dev.
---

```
exe.dev provides a CLI for managing exe.dev VMs and related resources.
Invoke it via SSH: `ssh exe.dev <command>` (no local `exe.dev` binary).
Run `ssh exe.dev help` or `ssh exe.dev help <command>` for details.

USAGE:
  ssh exe.dev <command> [args]

COMMANDS:
  help                 Show help information
  doc                  Browse documentation
  ls                   List your VMs
  new                  Create a new VM
  rm                   Delete a VM
  restart              Restart a VM
  rename               Rename a VM
  cp                   Copy an existing VM
  share                Share HTTPS VM access with others
    share show           Show current shares for a VM
    share port           Set the HTTP proxy port for a VM
    share set-public     Make the HTTP proxy publicly accessible
    share set-private    Restrict the HTTP proxy to authenticated users
    share add            Share VM with a user via email
    share remove         Revoke a user's access to a VM
    share add-link       Create a shareable link for a VM
    share remove-link    Revoke a shareable link
  whoami               Show your user information including email and all SSH keys
  ssh-key              Manage SSH keys for your account
    ssh-key list         List all SSH keys associated with your account
    ssh-key add          Add a new SSH key to your account
    ssh-key remove       Remove an SSH key from your account
    ssh-key rename       Rename an SSH key
  shelley              Manage Shelley agent on VMs
    shelley install      Install or upgrade Shelley to the current version
  browser              Generate a magic link to log in to the website
  ssh                  SSH into a VM
  exit                 Exit
```
