import { exec } from "child_process"
import { promisify } from "util"
import type { FocusDetector } from "./types"

const execAsync = promisify(exec)

/**
 * Run a shell command and return the stdout
 * Returns null if the command fails
 */
async function runCommand(command: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(command, { timeout: 5000 })
    return stdout.trim()
  } catch {
    return null
  }
}

/**
 * Check if a command exists in PATH
 */
async function commandExists(cmd: string): Promise<boolean> {
  const result = await runCommand(`which ${cmd}`)
  return result !== null && result.length > 0
}

/**
 * X11 Focus Detector using xdotool
 */
class X11FocusDetector implements FocusDetector {
  readonly name = "X11 (xdotool)"

  async init(): Promise<string | null> {
    if (!(await commandExists("xdotool"))) {
      return null
    }
    return runCommand("xdotool getactivewindow")
  }

  async isTerminalFocused(terminalId: string): Promise<boolean> {
    const currentWindow = await runCommand("xdotool getactivewindow")
    return currentWindow === terminalId
  }
}

/**
 * Tmux Focus Detector
 * Wraps another detector and adds tmux window-level focus checking.
 * Notifications are suppressed only when BOTH:
 * 1. The terminal window is focused (checked by inner detector)
 * 2. The tmux window containing this pane is active
 */
class TmuxFocusDetector implements FocusDetector {
  readonly name = "Tmux"
  private innerDetector: FocusDetector
  private paneId: string

  constructor(paneId: string, innerDetector: FocusDetector) {
    this.paneId = paneId
    this.innerDetector = innerDetector
  }

  async init(): Promise<string | null> {
    // Check if tmux command exists
    if (!(await commandExists("tmux"))) {
      // Fall back to inner detector only
      return this.innerDetector.init()
    }
    // Initialize the inner detector to get terminal window ID
    return this.innerDetector.init()
  }

  async isTerminalFocused(terminalId: string): Promise<boolean> {
    // First check: Is the terminal window focused? (X11/Wayland level)
    const terminalFocused =
      await this.innerDetector.isTerminalFocused(terminalId)
    if (!terminalFocused) {
      return false // Terminal not focused, notification should be sent
    }

    // Second check: Is the tmux session containing this pane currently attached
    // and the active client session? (handles multiple tmux sessions)
    const sessionAttached = await runCommand(
      `tmux display-message -t ${this.paneId} -p '#{session_attached}'`
    )
    if (sessionAttached !== "1") {
      return false // Session is not attached, notification should be sent
    }

    // Third check: Is the tmux window containing this pane active within the session?
    const windowActive = await runCommand(
      `tmux display-message -t ${this.paneId} -p '#{window_active}'`
    )
    return windowActive === "1"
  }
}

/**
 * Fallback detector that always returns false (terminal not focused)
 * This means notifications will always be shown on unsupported platforms
 */
class AlwaysNotifyDetector implements FocusDetector {
  readonly name = "Fallback (always notify)"

  async init(): Promise<string | null> {
    // Return a dummy ID since we'll always show notifications
    return "unsupported"
  }

  async isTerminalFocused(_terminalId: string): Promise<boolean> {
    // Always return false so notifications are always shown
    return false
  }
}

/**
 * Detect the display server and return the appropriate focus detector
 * If running inside tmux, wraps the detector with tmux window-level checking
 */
export function createFocusDetector(): FocusDetector {
  const sessionType = process.env.XDG_SESSION_TYPE
  const tmuxPane = process.env.TMUX_PANE

  // Determine the base detector (X11 or fallback)
  let baseDetector: FocusDetector
  if (sessionType === "x11" || process.env.DISPLAY) {
    baseDetector = new X11FocusDetector()
  } else {
    baseDetector = new AlwaysNotifyDetector()
  }

  // Wrap with tmux detection if running inside tmux
  if (tmuxPane) {
    return new TmuxFocusDetector(tmuxPane, baseDetector)
  }

  return baseDetector
}

/**
 * Initialize focus detection and return a function to check if terminal is focused
 * Returns null if focus detection is not available
 */
export async function initFocusDetection(): Promise<{
  detector: FocusDetector
  terminalId: string | null
}> {
  const detector = createFocusDetector()
  const terminalId = await detector.init()

  return { detector, terminalId }
}
