/**
 * Possible states for the Pomodoro timer
 */
export type TimerState = "idle" | "running" | "paused" | "break";

/**
 * Type of session (work or break)
 */
export type SessionType = "work" | "shortBreak" | "longBreak";

/**
 * Persisted session data stored in globalState
 * This is the source of truth that survives reloads
 */
export interface PomodoroSession {
  /** Current state of the timer */
  state: TimerState;
  /** Unix timestamp (ms) when the current session will end */
  expectedEndTime: number | null;
  /** Milliseconds remaining when paused (used to resume) */
  remainingTimeOnPause: number | null;
  /** Total duration of the current session in milliseconds */
  totalDuration: number;
  /** Type of the current session */
  sessionType: SessionType;
  /** Number of completed work sessions */
  completedSessions: number;
}

/**
 * Configuration options for the Pomodoro timer
 */
export interface PomodoroConfig {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}
