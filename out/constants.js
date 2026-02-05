"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SESSIONS_BEFORE_LONG_BREAK = exports.DEFAULT_LONG_BREAK_DURATION = exports.DEFAULT_SHORT_BREAK_DURATION = exports.DEFAULT_WORK_DURATION = exports.STORAGE_KEY = exports.SEPARATOR_RIGHT = exports.SEPARATOR_LEFT = exports.STATUS_BAR_PRIORITY = exports.UPDATE_INTERVAL_MS = exports.PROGRESS_BAR_LENGTH = exports.EMPTY_BLOCK = exports.FILLED_BLOCK = void 0;
exports.minutesToMs = minutesToMs;
exports.formatTime = formatTime;
exports.generateProgressBar = generateProgressBar;
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
exports.DEFAULT_WORK_DURATION = 25;
exports.DEFAULT_SHORT_BREAK_DURATION = 5;
exports.DEFAULT_LONG_BREAK_DURATION = 10;
exports.DEFAULT_SESSIONS_BEFORE_LONG_BREAK = 4;
/**
 * Convert minutes to milliseconds
 */
function minutesToMs(minutes) {
    return minutes * 60 * 1000;
}
/**
 * Format milliseconds as MM:SS
 */
function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
/**
 * Generate a progress bar string
 * @param progress - Value between 0 and 1
 */
function generateProgressBar(progress) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const filledCount = Math.round(clampedProgress * exports.PROGRESS_BAR_LENGTH);
    const emptyCount = exports.PROGRESS_BAR_LENGTH - filledCount;
    return exports.FILLED_BLOCK.repeat(filledCount) + exports.EMPTY_BLOCK.repeat(emptyCount);
}
//# sourceMappingURL=constants.js.map