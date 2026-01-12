import type { Plugin } from "@opencode-ai/plugin"
import { loadConfig, isEventEnabled } from "./config"
import { initFocusDetection } from "./focus"
import {
  sendNotification,
  getNotificationContent,
  getEventSound,
  type EventContext,
} from "./notify"
import type { EventType } from "./types"

/**
 * OpenCode Notifications Plugin
 *
 * Sends desktop notifications for meaningful events, but ONLY when the
 * terminal running OpenCode is not in focus. This prevents unnecessary
 * notifications when you're already looking at the terminal.
 *
 * Supports:
 * - X11 (via xdotool)
 * - Sway (via swaymsg)
 * - Hyprland (via hyprctl)
 * - Fallback for other Wayland compositors (always notify)
 */
export const NotificationsPlugin: Plugin = async () => {
  const config = loadConfig()
  const { detector, terminalId } = await initFocusDetection()

  /**
   * Send a notification if the terminal is not focused and the event is enabled
   */
  async function maybeNotify(
    eventType: EventType,
    context?: EventContext
  ): Promise<void> {
    // Check if event type is enabled in config
    if (!isEventEnabled(config, eventType)) {
      return
    }

    // Check if terminal is focused (skip notification if it is)
    if (terminalId && (await detector.isTerminalFocused(terminalId))) {
      return
    }

    // Send the notification
    const { title, body, icon } = getNotificationContent(eventType, context)
    await sendNotification(title, body, {
      icon,
      playSound: config.sound.enabled,
      soundId: getEventSound(eventType),
    })
  }

  return {
    /**
     * Handle OpenCode events
     */
    event: async ({ event }) => {
      // Generation completed
      if (event.type === "session.idle") {
        await maybeNotify("complete")
      }

      // Error occurred
      if (event.type === "session.error") {
        const props = event.properties as {
          error?: { data?: { message?: string }; name?: string }
        }
        const errorMessage =
          props.error?.data?.message || props.error?.name || undefined
        await maybeNotify("error", { errorMessage })
      }

      // Legacy permission event (OpenCode v1.0.223 and earlier)
      if (event.type === "permission.updated") {
        await maybeNotify("permission")
      }

      // New permission event (OpenCode v1.0.224+)
      if ((event as { type: string }).type === "permission.asked") {
        const props = event.properties as {
          permission?: string
          patterns?: string[]
        }
        await maybeNotify("permission", {
          permissionName: props.permission,
          permissionPatterns: props.patterns,
        })
      }

      // Question event - user input needed via selection prompt
      if ((event as { type: string }).type === "question.asked") {
        const props = event.properties as {
          questions?: Array<{ question?: string; header?: string }>
        }
        const firstQuestion = props.questions?.[0]
        await maybeNotify("question", {
          questionText: firstQuestion?.question,
          questionHeader: firstQuestion?.header,
        })
      }
    },

    /**
     * Handle permission.ask hook (OpenCode v1.0.224+)
     * This is called when OpenCode needs permission to perform an action
     */
    "permission.ask": async (input) => {
      const props = input as {
        permission?: string
        patterns?: string[]
      }
      await maybeNotify("permission", {
        permissionName: props.permission,
        permissionPatterns: props.patterns,
      })
    },
  }
}

// Export as default for OpenCode plugin loading
export default NotificationsPlugin

// Re-export types for consumers
export type { NotificationConfig, EventType } from "./types"
