"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerEngine = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("./constants");
const sound_1 = require("./sound");
const utils_1 = require("./utils");
/**
 * Core timer engine managing state, persistence, and the update loop
 * Uses timestamp-based timing to prevent drift and survive reloads
 */
class TimerEngine {
    context;
    session;
    intervalId = null;
    statusBarUI;
    constructor(context, statusBarUI) {
        this.context = context;
        this.statusBarUI = statusBarUI;
        this.session = { ...constants_1.DEFAULT_SESSION };
    }
    /**
     * Get current timer state
     */
    get state() {
        return this.session.state;
    }
    /**
     * Get current session type
     */
    get sessionType() {
        return this.session.sessionType;
    }
    /**
     * Get completed sessions count
     */
    get completedSessions() {
        return this.session.completedSessions;
    }
    /**
     * Get configuration from VS Code settings
     */
    getConfig() {
        const config = vscode.workspace.getConfiguration("pomodoro");
        return {
            workDuration: config.get("workDuration", constants_1.DEFAULT_WORK_DURATION),
            shortBreakDuration: config.get("shortBreakDuration", constants_1.DEFAULT_SHORT_BREAK_DURATION),
            longBreakDuration: config.get("longBreakDuration", constants_1.DEFAULT_LONG_BREAK_DURATION),
            sessionsBeforeLongBreak: config.get("sessionsBeforeLongBreak", constants_1.DEFAULT_SESSIONS_BEFORE_LONG_BREAK),
        };
    }
    /**
     * Persist current session to globalState
     * This is the source of truth that survives reloads
     */
    persist() {
        this.context.globalState.update(constants_1.STORAGE_KEY, this.session);
    }
    /**
     * Restore session from globalState on activation
     * Handles the "reload" and "sleep" edge cases
     */
    restore() {
        const saved = this.context.globalState.get(constants_1.STORAGE_KEY);
        if (!saved) {
            // No saved session, start fresh
            this.session = { ...constants_1.DEFAULT_SESSION };
            this.statusBarUI.showIdle();
            return;
        }
        this.session = { ...saved };
        if (this.session.state === "running" && this.session.expectedEndTime) {
            const now = Date.now();
            if (now >= this.session.expectedEndTime) {
                // Sleep scenario: expected end time has passed
                // Trigger completion immediately
                this.handleSessionComplete();
            }
            else {
                // Resume running session
                this.startUpdateLoop();
                this.updateUI();
            }
        }
        else if (this.session.state === "paused") {
            // Paused session - just update UI
            this.updateUI();
        }
        else if (this.session.state === "break" && this.session.expectedEndTime) {
            const now = Date.now();
            if (now >= this.session.expectedEndTime) {
                // Break ended while away
                this.handleBreakComplete();
            }
            else {
                // Resume break timer
                this.startUpdateLoop();
                this.updateUI();
            }
        }
        else {
            // Idle state
            this.statusBarUI.showIdle();
        }
    }
    /**
     * Start a new work session with default duration
     */
    start() {
        const config = this.getConfig();
        this.startWithDuration(config.workDuration);
    }
    /**
     * Start a new work session with custom duration
     * @param minutes - Duration in minutes
     */
    startWithDuration(minutes) {
        const duration = (0, utils_1.minutesToMs)(minutes);
        this.session = {
            state: "running",
            expectedEndTime: Date.now() + duration,
            remainingTimeOnPause: null,
            totalDuration: duration,
            sessionType: "work",
            completedSessions: this.session.completedSessions,
        };
        this.persist();
        this.startUpdateLoop();
        this.updateUI();
        (0, sound_1.playStartSound)();
    }
    /**
     * Prompt user for custom duration and start
     */
    async startCustom() {
        const config = this.getConfig();
        const input = await vscode.window.showInputBox({
            prompt: "Enter Pomodoro duration in minutes",
            value: config.workDuration.toString(),
            validateInput: (value) => {
                const num = parseInt(value, 10);
                if (isNaN(num) || num <= 0 || num > 180) {
                    return "Please enter a number between 1 and 180";
                }
                return null;
            },
        });
        if (input) {
            const minutes = parseInt(input, 10);
            this.startWithDuration(minutes);
        }
    }
    /**
     * Pause the current session
     */
    pause() {
        if (this.session.state !== "running" || !this.session.expectedEndTime) {
            return;
        }
        const remaining = this.session.expectedEndTime - Date.now();
        this.session.state = "paused";
        this.session.remainingTimeOnPause = Math.max(0, remaining);
        this.session.expectedEndTime = null;
        this.persist();
        this.stopUpdateLoop();
        this.updateUI();
    }
    /**
     * Resume a paused session
     */
    resume() {
        if (this.session.state !== "paused" || !this.session.remainingTimeOnPause) {
            return;
        }
        this.session.state = "running";
        this.session.expectedEndTime =
            Date.now() + this.session.remainingTimeOnPause;
        this.session.remainingTimeOnPause = null;
        this.persist();
        this.startUpdateLoop();
        this.updateUI();
    }
    /**
     * Toggle between start/pause/resume
     */
    toggle() {
        switch (this.session.state) {
            case "idle":
                this.start();
                break;
            case "running":
                this.pause();
                break;
            case "paused":
                this.resume();
                break;
            case "break":
                // During break, toggle skips to next work session
                this.skip();
                break;
        }
    }
    /**
     * Show quick pick menu for starting a session
     * Used when clicking the idle status bar
     */
    async showMenu() {
        if (this.session.state !== "idle") {
            // If not idle, just toggle
            this.toggle();
            return;
        }
        const config = this.getConfig();
        const defaultDuration = config.workDuration;
        const selection = await vscode.window.showQuickPick([
            {
                label: `$(play) Start (${defaultDuration} min)`,
                description: "Start with default duration",
                action: "default",
            },
            {
                label: "$(edit) Custom duration...",
                description: "Choose your own duration",
                action: "custom",
            },
        ], {
            placeHolder: "Start a Pomodoro session",
        });
        if (selection) {
            if (selection.action === "default") {
                this.start();
            }
            else if (selection.action === "custom") {
                await this.startCustom();
            }
        }
    }
    /**
     * Skip the current session (work or break)
     */
    skip() {
        if (this.session.state === "break") {
            // Skip break, go to idle
            this.reset();
        }
        else if (this.session.state === "running" ||
            this.session.state === "paused") {
            // Skip work session, start break
            this.handleSessionComplete();
        }
    }
    /**
     * Stop and completely end the current session
     * Does not trigger break or count as completed
     */
    stop() {
        if (this.session.state === "idle") {
            return;
        }
        this.stopUpdateLoop();
        (0, sound_1.playCancelSound)();
        this.session = {
            ...constants_1.DEFAULT_SESSION,
            completedSessions: this.session.completedSessions,
        };
        this.persist();
        this.statusBarUI.showIdle();
        vscode.window.showInformationMessage("Pomodoro session stopped.");
    }
    /**
     * Reset to idle state
     */
    reset() {
        this.stopUpdateLoop();
        this.session = {
            ...constants_1.DEFAULT_SESSION,
            completedSessions: this.session.completedSessions,
        };
        this.persist();
        this.statusBarUI.showIdle();
    }
    /**
     * Handle work session completion
     */
    handleSessionComplete() {
        this.stopUpdateLoop();
        (0, sound_1.playCompletionSound)();
        const config = this.getConfig();
        const newCompletedSessions = this.session.completedSessions + 1;
        // Determine break type
        const isLongBreak = newCompletedSessions % config.sessionsBeforeLongBreak === 0;
        const breakType = isLongBreak ? "longBreak" : "shortBreak";
        const breakDuration = isLongBreak
            ? (0, utils_1.minutesToMs)(config.longBreakDuration)
            : (0, utils_1.minutesToMs)(config.shortBreakDuration);
        // Show notification
        const breakLabel = isLongBreak ? "long break" : "short break";
        vscode.window
            .showInformationMessage(`Pomodoro complete! Time for a ${breakLabel} (${isLongBreak ? config.longBreakDuration : config.shortBreakDuration} min).`, "Start Break", "Skip Break")
            .then((selection) => {
            if (selection === "Start Break") {
                this.startBreak(breakType, breakDuration, newCompletedSessions);
            }
            else if (selection === "Skip Break") {
                this.session.completedSessions = newCompletedSessions;
                this.reset();
            }
            // If dismissed, stay in current state (idle-ish but with notification pending)
        });
        // Update session to idle while waiting for user response
        this.session = {
            ...constants_1.DEFAULT_SESSION,
            completedSessions: newCompletedSessions,
        };
        this.persist();
        this.statusBarUI.showIdle();
    }
    /**
     * Start a break session
     */
    startBreak(breakType, duration, completedSessions) {
        this.session = {
            state: "break",
            expectedEndTime: Date.now() + duration,
            remainingTimeOnPause: null,
            totalDuration: duration,
            sessionType: breakType,
            completedSessions: completedSessions,
        };
        this.persist();
        this.startUpdateLoop();
        this.updateUI();
    }
    /**
     * Handle break completion
     */
    handleBreakComplete() {
        this.stopUpdateLoop();
        (0, sound_1.playCompletionSound)();
        vscode.window
            .showInformationMessage("Break complete! Ready to start another Pomodoro?", "Start Work", "Not Now")
            .then((selection) => {
            if (selection === "Start Work") {
                this.start();
            }
        });
        this.session = {
            ...constants_1.DEFAULT_SESSION,
            completedSessions: this.session.completedSessions,
        };
        this.persist();
        this.statusBarUI.showIdle();
    }
    /**
     * Start the update loop (runs every 500ms)
     */
    startUpdateLoop() {
        this.stopUpdateLoop(); // Clear any existing interval
        this.intervalId = setInterval(() => {
            this.tick();
        }, constants_1.UPDATE_INTERVAL_MS);
    }
    /**
     * Stop the update loop
     */
    stopUpdateLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    /**
     * Called on each tick of the update loop
     * Uses timestamp-based calculation to prevent drift
     */
    tick() {
        if (!this.session.expectedEndTime) {
            return;
        }
        const now = Date.now();
        const remaining = this.session.expectedEndTime - now;
        if (remaining <= 0) {
            // Session complete
            if (this.session.state === "running" &&
                this.session.sessionType === "work") {
                this.handleSessionComplete();
            }
            else if (this.session.state === "break") {
                this.handleBreakComplete();
            }
        }
        else {
            // Update UI
            this.updateUI();
        }
    }
    /**
     * Update the status bar UI
     */
    updateUI() {
        let remaining;
        if (this.session.state === "paused" && this.session.remainingTimeOnPause) {
            remaining = this.session.remainingTimeOnPause;
        }
        else if (this.session.expectedEndTime) {
            remaining = Math.max(0, this.session.expectedEndTime - Date.now());
        }
        else {
            remaining = this.session.totalDuration;
        }
        this.statusBarUI.update(this.session.state, remaining, this.session.totalDuration, this.session.sessionType);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this.stopUpdateLoop();
        this.statusBarUI.dispose();
    }
}
exports.TimerEngine = TimerEngine;
//# sourceMappingURL=TimerEngine.js.map