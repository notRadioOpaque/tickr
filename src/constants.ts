import { PomodoroSession } from "./types";

/**
 * Unicode characters for the progress bar (minimalist line style)
 */
export const FILLED_BLOCK = "▰"; // \u25b0
export const EMPTY_BLOCK = "▱"; // \u25b1

/**
 * Number of blocks in the progress bar
 */
export const PROGRESS_BAR_LENGTH = 10;

/**
 * Update interval in milliseconds
 * Using 500ms for snappy UI updates
 */
export const UPDATE_INTERVAL_MS = 500;

/**
 * Status bar priority (higher = further right when using Right alignment)
 */
export const STATUS_BAR_PRIORITY = 1000;

/**
 * Separator characters for visual boundary
 */
export const SEPARATOR_LEFT = "│";
export const SEPARATOR_RIGHT = "│";

/**
 * Storage key for persisted session data
 */
export const STORAGE_KEY = "pomodoroSession";

/**
 * Default durations in minutes
 */
export const DEFAULT_WORK_DURATION = 45;
export const DEFAULT_SHORT_BREAK_DURATION = 5;
export const DEFAULT_LONG_BREAK_DURATION = 15;
export const DEFAULT_SESSIONS_BEFORE_LONG_BREAK = 4;

/**
 * Default session state
 */
export const DEFAULT_SESSION: PomodoroSession = {
  state: "idle",
  expectedEndTime: null,
  remainingTimeOnPause: null,
  totalDuration: 25 * 60 * 1000, // 25 minutes in ms
  sessionType: "work",
  completedSessions: 0,
};
