"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SESSION = exports.DEFAULT_SESSIONS_BEFORE_LONG_BREAK = exports.DEFAULT_LONG_BREAK_DURATION = exports.DEFAULT_SHORT_BREAK_DURATION = exports.DEFAULT_WORK_DURATION = exports.STORAGE_KEY = exports.SEPARATOR_RIGHT = exports.SEPARATOR_LEFT = exports.STATUS_BAR_PRIORITY = exports.UPDATE_INTERVAL_MS = exports.PROGRESS_BAR_LENGTH = exports.EMPTY_BLOCK = exports.FILLED_BLOCK = void 0;
/**
 * Unicode characters for the progress bar (minimalist line style)
 */
exports.FILLED_BLOCK = "▰"; // \u25b0
exports.EMPTY_BLOCK = "▱"; // \u25b1
/**
 * Number of blocks in the progress bar
 */
exports.PROGRESS_BAR_LENGTH = 10;
/**
 * Update interval in milliseconds
 * Using 500ms for snappy UI updates
 */
exports.UPDATE_INTERVAL_MS = 500;
/**
 * Status bar priority (higher = further right when using Right alignment)
 */
exports.STATUS_BAR_PRIORITY = 1000;
/**
 * Separator characters for visual boundary
 */
exports.SEPARATOR_LEFT = "│";
exports.SEPARATOR_RIGHT = "│";
/**
 * Storage key for persisted session data
 */
exports.STORAGE_KEY = "pomodoroSession";
/**
 * Default durations in minutes
 */
exports.DEFAULT_WORK_DURATION = 45;
exports.DEFAULT_SHORT_BREAK_DURATION = 5;
exports.DEFAULT_LONG_BREAK_DURATION = 15;
exports.DEFAULT_SESSIONS_BEFORE_LONG_BREAK = 4;
/**
 * Default session state
 */
exports.DEFAULT_SESSION = {
    state: "idle",
    expectedEndTime: null,
    remainingTimeOnPause: null,
    totalDuration: 25 * 60 * 1000, // 25 minutes in ms
    sessionType: "work",
    completedSessions: 0,
};
//# sourceMappingURL=constants.js.map