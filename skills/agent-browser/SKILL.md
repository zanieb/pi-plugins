---
name: agent-browser
description: Browser automation via agent-browser CLI. Use for visually inspecting websites, verifying UI/layout changes, taking screenshots, and interacting with web UIs. Do NOT use for GitHub — use the `gh` CLI instead. Do NOT use for API data — use `curl` instead. Only use the browser when you need to SEE the page or interact with a web UI that has no CLI/API alternative.
---

# agent-browser — Full Command Reference

Headless browser automation CLI for AI agents. Uses a client-daemon architecture
(Rust CLI → Node.js daemon → Playwright/Chromium).

## When NOT to Use the Browser

- **GitHub** (issues, PRs, repos, code, actions, discussions): use the `gh` CLI
- **REST/GraphQL APIs**: use `curl` or a domain-specific CLI
- **Package registries, documentation sites with APIs**: use `curl`
- **Any site with a CLI or structured API**: prefer that over the browser

The browser is for **visual inspection** (screenshots, UI verification, layout checks)
and **interactive web UIs** that have no CLI or API alternative.

## Core Workflow

```bash
agent-browser open <url>              # Navigate
agent-browser snapshot -i             # Get interactive elements with refs
agent-browser click @e2               # Interact using refs from snapshot
agent-browser fill @e3 "text"         # Fill input using ref
agent-browser screenshot              # Take screenshot
agent-browser close                   # Close browser
```

## All Commands

### Navigation

```bash
open <url>                    # Navigate to URL (aliases: goto, navigate)
back                          # Go back
forward                       # Go forward
reload                        # Reload page
```

### Interaction

```bash
click <sel>                   # Click element (--new-tab to open in new tab)
dblclick <sel>                # Double-click element
focus <sel>                   # Focus element
type <sel> <text>             # Type into element
fill <sel> <text>             # Clear and fill
press <key>                   # Press key (Enter, Tab, Control+a) (alias: key)
keyboard type <text>          # Type with real keystrokes (current focus)
keyboard inserttext <text>    # Insert text without key events
keydown <key>                 # Hold key down
keyup <key>                   # Release key
hover <sel>                   # Hover element
select <sel> <val>            # Select dropdown option
check <sel>                   # Check checkbox
uncheck <sel>                 # Uncheck checkbox
scroll <dir> [px]             # Scroll (up/down/left/right, --selector <sel>)
scrollintoview <sel>          # Scroll element into view (alias: scrollinto)
drag <src> <tgt>              # Drag and drop
upload <sel> <files>          # Upload files
```

### Snapshot & Screenshot

```bash
snapshot                      # Full accessibility tree with refs
snapshot -i                   # Interactive elements only (buttons, inputs, links)
snapshot -i -C                # Include cursor-interactive elements (onclick divs)
snapshot -c                   # Compact (remove empty structural elements)
snapshot -d 3                 # Limit depth to 3 levels
snapshot -s "#main"           # Scope to CSS selector
snapshot -i -c -d 5           # Combine options

screenshot [path]             # Take screenshot (temp dir if no path)
screenshot --full             # Full page screenshot
screenshot --annotate         # Numbered labels on interactive elements
pdf <path>                    # Save as PDF
```

### Get Info

```bash
get text <sel>                # Get text content
get html <sel>                # Get innerHTML
get value <sel>               # Get input value
get attr <sel> <attr>         # Get attribute
get title                     # Get page title
get url                       # Get current URL
get count <sel>               # Count matching elements
get box <sel>                 # Get bounding box
get styles <sel>              # Get computed styles
```

### Check State

```bash
is visible <sel>              # Check if visible
is enabled <sel>              # Check if enabled
is checked <sel>              # Check if checked
```

### Find Elements (Semantic Locators)

```bash
find role <role> <action> [value]       # By ARIA role
find text <text> <action>               # By text content
find label <label> <action> [value]     # By label
find placeholder <ph> <action> [value]  # By placeholder
find alt <text> <action>                # By alt text
find title <text> <action>              # By title attr
find testid <id> <action> [value]       # By data-testid
find first <sel> <action> [value]       # First match
find last <sel> <action> [value]        # Last match
find nth <n> <sel> <action> [value]     # Nth match
```

Actions: `click`, `fill`, `type`, `hover`, `focus`, `check`, `uncheck`, `text`
Options: `--name <name>` (filter role by accessible name), `--exact` (exact text match)

### Wait

```bash
wait <selector>               # Wait for element to be visible
wait <ms>                     # Wait for time (milliseconds)
wait --text "Welcome"         # Wait for text to appear
wait --url "**/dash"          # Wait for URL pattern
wait --load networkidle       # Wait for load state (load, domcontentloaded, networkidle)
wait --fn "window.ready"      # Wait for JS condition
```

### Browser Settings

```bash
set viewport <w> <h>          # Set viewport size
set device <name>             # Emulate device (e.g. "iPhone 15 Pro", "iPad Pro")
set geo <lat> <lng>           # Set geolocation
set offline [on|off]          # Toggle offline mode
set headers <json>            # Extra HTTP headers
set credentials <u> <p>       # HTTP basic auth
set media [dark|light]        # Emulate color scheme (dark/light/no-preference)
```

### Mouse Control

```bash
mouse move <x> <y>            # Move mouse
mouse down [button]           # Press button (left/right/middle)
mouse up [button]             # Release button
mouse wheel <dy> [dx]         # Scroll wheel
```

### Cookies & Storage

```bash
cookies                       # Get all cookies
cookies set <name> <val>      # Set cookie
cookies clear                 # Clear cookies

storage local                 # Get all localStorage
storage local <key>           # Get specific key
storage local set <k> <v>     # Set value
storage local clear           # Clear all

storage session               # Same for sessionStorage
```

### Network

```bash
network route <url>                    # Intercept requests
network route <url> --abort            # Block requests
network route <url> --body <json>      # Mock response
network unroute [url]                  # Remove routes
network requests                       # View tracked requests
network requests --filter api          # Filter requests
```

### Tabs & Windows

```bash
tab                           # List tabs
tab new [url]                 # New tab (optionally with URL)
tab <n>                       # Switch to tab n
tab close [n]                 # Close tab
window new                    # New window
```

### Frames & Dialogs

```bash
frame <sel>                   # Switch to iframe
frame main                    # Back to main frame
dialog accept [text]          # Accept dialog (with optional prompt text)
dialog dismiss                # Dismiss dialog
```

### Diff (Comparing States)

```bash
diff snapshot                                    # Compare current vs last snapshot
diff snapshot --baseline before.txt              # Compare vs saved snapshot file
diff snapshot --selector "#main" --compact       # Scoped snapshot diff
diff screenshot --baseline before.png            # Visual pixel diff against baseline
diff screenshot --baseline b.png -o d.png        # Save diff image to custom path
diff screenshot --baseline b.png -t 0.2          # Adjust color threshold (0-1)
diff url https://v1.com https://v2.com           # Compare two URLs (snapshot diff)
diff url <url1> <url2> --screenshot              # Also visual diff
diff url <url1> <url2> --selector "#main"        # Scope to element
```

### Debug & Tracing

```bash
eval <js>                     # Run JavaScript (-b for base64, --stdin for piped)
trace start [path]            # Start recording trace
trace stop [path]             # Stop and save trace
profiler start                # Start Chrome DevTools profiling
profiler stop [path]          # Stop and save profile (.json)
console                       # View console messages
console --clear               # Clear console
errors                        # View page errors (uncaught exceptions)
errors --clear                # Clear errors
highlight <sel>               # Highlight element
```

### Sessions

```bash
agent-browser --session agent1 open site-a.com   # Isolated session
agent-browser --session agent2 open site-b.com
session list                                      # List active sessions
session                                           # Show current session
```

### Auth State

```bash
state save <path>             # Save auth state
state load <path>             # Load auth state
state list                    # List saved state files
state show <file>             # Show state summary
state rename <old> <new>      # Rename state file
state clear [name]            # Clear states for session
state clear --all             # Clear all saved states
state clean --older-than <d>  # Delete old states
```

### Connect to Existing Browser

```bash
connect <port>                # Connect via CDP port
agent-browser --cdp 9222 snapshot               # Via flag
agent-browser --auto-connect snapshot           # Auto-discover running Chrome
```

## Selectors

**Refs (recommended for AI):** Use `@e1`, `@e2` etc. from snapshot output.

**CSS:** `"#id"`, `".class"`, `"div > button"`

**Text/XPath:** `"text=Submit"`, `"xpath=//button"`

**Semantic:** `find role button click --name "Submit"`

## iOS Simulator (Mobile Testing)

Test on real Mobile Safari in iOS Simulator (requires macOS + Xcode + Appium):

```bash
# Setup (one-time)
npm install -g appium
appium driver install xcuitest

# List available simulators
agent-browser device list

# Use iOS provider
agent-browser -p ios --device "iPhone 16 Pro" open https://example.com
agent-browser -p ios snapshot -i
agent-browser -p ios tap @e1
agent-browser -p ios fill @e2 "text"
agent-browser -p ios screenshot mobile.png
agent-browser -p ios swipe up
agent-browser -p ios swipe down 500
agent-browser -p ios close

# Or via env vars
export AGENT_BROWSER_PROVIDER=ios
export AGENT_BROWSER_IOS_DEVICE="iPhone 16 Pro"
```

## Cloud Providers

```bash
# Browserbase
BROWSERBASE_API_KEY=... BROWSERBASE_PROJECT_ID=... agent-browser -p browserbase open <url>

# Browser Use
BROWSER_USE_API_KEY=... agent-browser -p browseruse open <url>

# Kernel
KERNEL_API_KEY=... agent-browser -p kernel open <url>
```

## Key Options

| Option | Description |
|--------|-------------|
| `--session <name>` | Isolated browser session |
| `--session-name <name>` | Auto-save/restore session state |
| `--profile <path>` | Persistent browser profile directory |
| `--headed` | Show browser window (not headless) |
| `--json` | JSON output (for agents) |
| `--full, -f` | Full page screenshot |
| `--annotate` | Annotated screenshot with numbered labels |
| `--cdp <port\|url>` | Connect via Chrome DevTools Protocol |
| `--auto-connect` | Auto-discover running Chrome |
| `--color-scheme <scheme>` | dark, light, no-preference |
| `--allowed-domains <list>` | Restrict navigation to domains |
| `--max-output <chars>` | Truncate page output |
| `-p, --provider <name>` | Cloud browser provider (ios, browserbase, browseruse, kernel) |
| `--device <name>` | iOS device name |

## Tips

- **Always re-snapshot after page changes** — refs become stale after navigation or interaction.
- **Use `snapshot -i`** for AI workflows — it filters to only interactive elements, reducing output.
- **Use `--annotate` screenshots** for multimodal models that reason visually.
- **Chain commands** with `&&` when you don't need intermediate output.
- **Default timeout is 25s** — override with `AGENT_BROWSER_DEFAULT_TIMEOUT` env var.
