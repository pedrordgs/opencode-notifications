# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-12

### Added

- Initial release
- Smart focus detection - only notifies when terminal is not focused
- X11 support via `xdotool`
- Tmux support - detects active tmux window/pane for focus detection
- Works with multiple tmux sessions (notifications sent when session is detached)
- Combines with X11 detection for full window + pane-level focus tracking
- Fallback mode for Wayland and unsupported display servers (always notify)
- Desktop notifications via `notify-send`
- Configuration file support (`~/.config/opencode/opencode-notifications.json`)
- Enable/disable specific event types (complete, error, permission)
- GitHub Actions workflow for automated npm publishing
