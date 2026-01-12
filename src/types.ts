/**
 * Configuration for notification events
 */
export interface EventsConfig {
  /** Notify when generation completes (session.idle) */
  complete: boolean
  /** Notify when an error occurs (session.error) */
  error: boolean
  /** Notify when permission is needed (permission.asked) */
  permission: boolean
  /** Notify when a question is asked (question.asked) */
  question: boolean
}

/**
 * Sound configuration
 */
export interface SoundConfig {
  /** Enable sound effects for notifications */
  enabled: boolean
}

/**
 * Plugin configuration
 */
export interface NotificationConfig {
  events: EventsConfig
  sound: SoundConfig
}

/**
 * Event types that trigger notifications
 */
export type EventType = "complete" | "error" | "permission" | "question"

/**
 * Notification content
 */
export interface NotificationContent {
  title: string
  body: string
  icon: string
}

/**
 * Focus detector interface for different display servers
 */
export interface FocusDetector {
  /** Get the name of the display server/compositor */
  readonly name: string

  /**
   * Initialize the detector and capture the terminal window ID
   * @returns The terminal window/container ID, or null if detection is not supported
   */
  init(): Promise<string | null>

  /**
   * Check if the terminal window is currently focused
   * @param terminalId The terminal ID captured during init
   * @returns true if the terminal is focused, false otherwise
   */
  isTerminalFocused(terminalId: string): Promise<boolean>
}

/**
 * Result of running a shell command
 */
export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
}
