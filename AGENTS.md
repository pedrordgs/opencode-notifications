# AGENTS.md

This file provides instructions for AI agents working on this codebase.

## Project Overview

`opencode-notifications` is an OpenCode plugin that sends desktop notifications for meaningful events, but **only when the terminal running OpenCode is not in focus**. This is the key differentiator from other notification plugins.

## Project Structure

```
opencode-notifications/
├── src/
│   ├── index.ts      # Main plugin entry point, event handling
│   ├── types.ts      # TypeScript interfaces and types
│   ├── config.ts     # Configuration loading from JSON file
│   ├── focus.ts      # Focus detection for X11 and tmux
│   └── notify.ts     # Desktop notification via notify-send
├── .github/
│   └── workflows/
│       └── publish.yml   # npm publish on version tags
├── package.json      # Package manifest
├── tsconfig.json     # TypeScript configuration
├── .gitignore        # Git ignore patterns
├── README.md         # User documentation
├── CHANGELOG.md      # Version history
└── LICENSE           # MIT license
```

## Key Components

### Focus Detection (`src/focus.ts`)

The core feature. Implements `FocusDetector` interface for multiple display servers:

- **X11FocusDetector**: Uses `xdotool getactivewindow`
- **TmuxFocusDetector**: Wraps another detector and adds tmux window/pane-level checking
- **AlwaysNotifyDetector**: Fallback that always allows notifications

The factory function `createFocusDetector()` automatically selects the right detector based on environment variables:
- `XDG_SESSION_TYPE` - Distinguishes X11 from Wayland
- `DISPLAY` - Indicates X11 session
- `TMUX_PANE` - Indicates running inside tmux (wraps base detector with tmux support)

### Configuration (`src/config.ts`)

Loads `~/.config/opencode/opencode-notifications.json` with defaults:

```json
{
  "events": {
    "complete": true,
    "error": true,
    "permission": true
  }
}
```

### Notifications (`src/notify.ts`)

Uses `notify-send` (libnotify) for desktop notifications. Silently fails if not available.

### Plugin Entry (`src/index.ts`)

Exports `NotificationsPlugin` as the default export. Handles these OpenCode events:
- `session.idle` - Generation completed
- `session.error` - Error occurred
- `permission.updated` / `permission.asked` - Permission needed

## Build System

Uses Bun for building and package management:

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Build (outputs to dist/)
bun run build
```

## Testing Locally

1. Build the plugin:
   ```bash
   bun run build
   ```

2. Copy to OpenCode plugin directory:
   ```bash
   cp -r dist/* ~/.config/opencode/plugin/
   ```

3. Or add to `opencode.json`:
   ```json
   {
     "plugin": ["./path/to/opencode-notifications"]
   }
   ```

## Publishing

Publishing is automated via GitHub Actions:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create and push a version tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

The workflow will build and publish to npm automatically.

## Code Style

- TypeScript with strict mode
- ESM modules
- No external runtime dependencies (only Node.js built-ins)
- Async/await for all asynchronous operations
- Graceful error handling (silent failures for missing tools)
