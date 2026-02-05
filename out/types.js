"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SESSION = void 0;
/**
 * Default session state
 */
exports.DEFAULT_SESSION = {
    state: 'idle',
    expectedEndTime: null,
    remainingTimeOnPause: null,
    totalDuration: 25 * 60 * 1000, // 25 minutes in ms
    sessionType: 'work',
    completedSessions: 0,
};
//# sourceMappingURL=types.js.map