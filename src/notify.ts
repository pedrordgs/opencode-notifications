import { exec } from "child_process"
import { promisify } from "util"
import type { EventType, NotificationContent } from "./types"

const execAsync = promisify(exec)

/**
 * Default notification messages for each event type
 */
const NOTIFICATION_DEFAULTS: Record<EventType, NotificationContent> = {
  complete: {
    title: "OpenCode Ready",
    body: "Task completed",
    icon: "dialog-information",
  },
  error: {
    title: "OpenCode Error",
    body: "An error occurred",
    icon: "dialog-error",
  },
  permission: {
    title: "OpenCode Permission",
    body: "Action requires approval",
    icon: "dialog-password",
  },
  question: {
    title: "OpenCode Question",
    body: "Your input is needed",
    icon: "dialog-question",
  },
}

/**
 * Sound IDs from freedesktop sound theme for each event type
 * See: https://specifications.freedesktop.org/sound-naming-spec/latest/
 */
const EVENT_SOUNDS: Record<EventType, string> = {
  complete: "dialog-information",
  error: "dialog-error",
  permission: "dialog-warning",
  question: "dialog-question",
}

/**
 * Event context passed from OpenCode events
 */
export interface EventContext {
  /** Error message for error events */
  errorMessage?: string
  /** Permission name for permission events */
  permissionName?: string
  /** File patterns for permission events */
  permissionPatterns?: string[]
  /** Question text for question events */
  questionText?: string
  /** Question header for question events */
  questionHeader?: string
}

/**
 * Get the notification content for an event type, optionally enhanced with context
 */
export function getNotificationContent(
  eventType: EventType,
  context?: EventContext
): NotificationContent {
  const defaults = NOTIFICATION_DEFAULTS[eventType]

  // Return defaults if no context provided
  if (!context) {
    return defaults
  }

  // Build dynamic body based on event type and context
  let body = defaults.body

  switch (eventType) {
    case "error":
      if (context.errorMessage) {
        body = truncate(context.errorMessage, 100)
      }
      break

    case "permission":
      if (context.permissionName) {
        const pattern = context.permissionPatterns?.[0]
        body = pattern
          ? `${context.permissionName}: ${truncate(pattern, 60)}`
          : `${context.permissionName} requested`
      }
      break

    case "question":
      if (context.questionText) {
        body = truncate(context.questionText, 100)
      } else if (context.questionHeader) {
        body = truncate(context.questionHeader, 100)
      }
      break
  }

  return {
    ...defaults,
    body,
  }
}

/**
 * Get the sound ID for an event type
 */
export function getEventSound(eventType: EventType): string {
  return EVENT_SOUNDS[eventType]
}

/**
 * Play a sound using canberra-gtk-play (freedesktop sound theme)
 *
 * @param soundId - The freedesktop sound theme ID
 */
async function playSound(soundId: string): Promise<void> {
  try {
    // Try canberra-gtk-play first (supports sound themes)
    await execAsync(`canberra-gtk-play -i "${soundId}"`, { timeout: 5000 })
  } catch {
    // Silently fail if sound cannot be played
  }
}

/**
 * Send a desktop notification using notify-send
 *
 * @param title - Notification title
 * @param body - Notification body text
 * @param options - Additional options
 * @param options.icon - Icon name (freedesktop icon theme)
 * @param options.playSound - Whether to play a sound effect
 * @param options.soundId - The freedesktop sound theme ID to play
 */
export async function sendNotification(
  title: string,
  body: string,
  options?: { icon?: string; playSound?: boolean; soundId?: string }
): Promise<void> {
  const promises: Promise<void>[] = []

  // Build notify-send command with icon
  const iconArg = options?.icon ? `-i "${escapeShellArg(options.icon)}"` : ""
  const cmd = `notify-send -a "OpenCode" -u normal ${iconArg} "${escapeShellArg(title)}" "${escapeShellArg(body)}"`

  // Send visual notification
  promises.push(
    execAsync(cmd, { timeout: 5000 })
      .then(() => {})
      .catch(() => {})
  )

  // Play sound if enabled
  if (options?.playSound && options?.soundId) {
    promises.push(playSound(options.soundId))
  }

  await Promise.all(promises)
}

/**
 * Escape special characters for shell arguments
 */
function escapeShellArg(arg: string): string {
  // Escape double quotes and backslashes
  return arg.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

/**
 * Truncate a string to a maximum length, adding ellipsis if needed
 */
function truncate(str: string, maxLength: number): string {
  // Remove newlines and collapse whitespace
  const cleaned = str.replace(/\s+/g, " ").trim()
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return cleaned.slice(0, maxLength - 1) + "…"
}
