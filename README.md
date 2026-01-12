# opencode-notifications

Smart desktop notifications for [OpenCode](https://opencode.ai) - **only notifies when the terminal is not in focus**.

This is the key differentiator from other notification plugins: if you're already looking at OpenCode, you won't be bothered with redundant notifications.

## Features

- **Smart focus detection** - Only sends notifications when you're NOT looking at the terminal
- **X11 support** - Focus detection via `xdotool`
- **Tmux support** - Detects active tmux window/pane, works with multiple sessions
- **Configurable events** - Enable/disable notifications for specific event types
- **Lightweight** - No sound files, no complex dependencies

## Installation

Add the plugin to your `opencode.json` or `opencode.jsonc`:

```json
{
  "plugin": ["opencode-notifications"]
}
```

Restart OpenCode. The plugin will be automatically installed and loaded.

## Requirements

### X11

- `xdotool` - For window focus detection
- `notify-send` - For desktop notifications (usually from `libnotify-bin`)

```bash
# Debian/Ubuntu
sudo apt install xdotool libnotify-bin

# Fedora
sudo dnf install xdotool libnotify

# Arch
sudo pacman -S xdotool libnotify
```

### Tmux

Tmux support works automatically when running OpenCode inside a tmux session. No additional setup is required.

When running inside tmux, notifications are suppressed only when **both**:
1. The terminal window is focused (X11 level)
2. The tmux window containing the OpenCode pane is active

This means you'll still receive notifications if:
- You switch to a different tmux window
- You're in a different tmux session
- The terminal itself is not focused

## Platform Support

Focus detection is supported on:
- Linux with X11
- Tmux (works with X11 for window and pane-level detection)

## Events

The plugin notifies on these OpenCode events:

| Event | Description |
|-------|-------------|
| `complete` | Generation/task completed (`session.idle`) |
| `error` | An error occurred (`session.error`) |
| `permission` | Permission needed (`permission.asked`) |

## Configuration

Create `~/.config/opencode/opencode-notifications.json` to customize:

```json
{
  "events": {
    "complete": true,
    "error": true,
    "permission": true
  }
}
```

### Disable specific events

```json
{
  "events": {
    "complete": true,
    "error": false,
    "permission": true
  }
}
```

## How It Works

1. When the plugin loads, it captures the window ID of the terminal running OpenCode
2. Before sending any notification, it checks if that window is still focused
3. If the terminal IS focused, the notification is skipped (you're already looking at it!)
4. If the terminal is NOT focused, the notification is sent

This simple approach ensures you're only notified when you need to be.

## Troubleshooting

### Notifications not appearing

1. **Check if `notify-send` is installed:**
   ```bash
   notify-send "Test" "Hello"
   ```

2. **Check your notification daemon:**
    - GNOME: Notifications should work out of the box
    - KDE: Notifications should work out of the box

### Focus detection not working

**X11 - Check if `xdotool` works:**
```bash
xdotool getactivewindow
```

If this returns an error, make sure `xdotool` is installed.

### Notifications always showing (even when terminal is focused)

Make sure `xdotool` is installed and working on X11.

### Tmux: Notifications showing when pane is visible

If you're getting notifications even when the tmux pane running OpenCode is visible:
- Make sure the tmux window is **active** (not just visible in a split)
- Check that `TMUX_PANE` environment variable is set (it should be automatic)

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
