import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import type { NotificationConfig } from "./types"

/**
 * Default configuration - all events enabled, sound enabled
 */
const DEFAULT_CONFIG: NotificationConfig = {
  events: {
    complete: true,
    error: true,
    permission: true,
    question: true,
  },
  sound: {
    enabled: true,
  },
}

/**
 * Config file name
 */
const CONFIG_FILENAME = "opencode-notifications.json"

/**
 * Get the path to the config file
 */
function getConfigPath(): string {
  return join(homedir(), ".config", "opencode", CONFIG_FILENAME)
}

/**
 * Load and parse the configuration file
 * Falls back to default config if file doesn't exist or is invalid
 */
export function loadConfig(): NotificationConfig {
  const configPath = getConfigPath()

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    const parsed = JSON.parse(content)

    // Merge with defaults to ensure all fields exist
    return {
      events: {
        complete: parsed?.events?.complete ?? DEFAULT_CONFIG.events.complete,
        error: parsed?.events?.error ?? DEFAULT_CONFIG.events.error,
        permission: parsed?.events?.permission ?? DEFAULT_CONFIG.events.permission,
        question: parsed?.events?.question ?? DEFAULT_CONFIG.events.question,
      },
      sound: {
        enabled: parsed?.sound?.enabled ?? DEFAULT_CONFIG.sound.enabled,
      },
    }
  } catch {
    // If file is invalid JSON, use defaults
    return DEFAULT_CONFIG
  }
}

/**
 * Check if a specific event type is enabled
 */
export function isEventEnabled(
  config: NotificationConfig,
  eventType: "complete" | "error" | "permission" | "question"
): boolean {
  return config.events[eventType]
}
