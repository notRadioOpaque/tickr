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
exports.StatusBarUI = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("./constants");
const utils_1 = require("./utils");
/**
 * Manages the status bar items for the Pomodoro timer
 * Layout: │  ▰▰▰▱▱▱▱▱▱▱  •  24:59  ▶/⏸/■  │
 *
 * Items are separated for independent hover highlighting:
 * - leftBorder: not clickable
 * - progressItem: not clickable (just visual)
 * - dotItem: not clickable (separator)
 * - timerItem: clickable (toggle pause/resume)
 * - buttonItem: clickable (play/pause/stop)
 * - rightBorder: not clickable
 */
class StatusBarUI {
    leftBorder;
    progressItem;
    dotItem;
    timerItem;
    buttonItem; // Play/Pause
    stopItem; // Stop (only when active)
    rightBorder;
    constructor() {
        // Right alignment - higher priority = further right
        // Create items in order from left to right
        this.leftBorder = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY + 6);
        this.progressItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY + 5);
        this.dotItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY + 4);
        this.timerItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY + 3);
        this.buttonItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY + 2);
        this.stopItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY + 1);
        this.rightBorder = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, constants_1.STATUS_BAR_PRIORITY);
        // Non-clickable items have no command
        this.leftBorder.command = undefined;
        this.progressItem.command = undefined;
        this.dotItem.command = undefined;
        this.rightBorder.command = undefined;
        // Clickable items
        this.timerItem.command = "pomodoro.toggle";
        this.buttonItem.command = "pomodoro.showMenu";
        this.stopItem.command = "pomodoro.stop";
        // Initialize with idle state
        this.showIdle();
    }
    /**
     * Update the status bar display
     */
    update(state, remainingMs, totalMs, sessionType) {
        if (state === "idle") {
            this.showIdle();
            return;
        }
        // Calculate progress (0 = just started, 1 = complete)
        const elapsed = totalMs - remainingMs;
        const progress = totalMs > 0 ? elapsed / totalMs : 0;
        const progressBar = (0, utils_1.generateProgressBar)(progress);
        const timeText = (0, utils_1.formatTime)(remainingMs);
        // Set text for each item
        this.leftBorder.text = constants_1.SEPARATOR_LEFT;
        this.progressItem.text = ` ${progressBar} `;
        this.dotItem.text = "•";
        this.timerItem.text = ` ${timeText} `;
        // Button shows pause when running, play when paused
        if (state === "paused") {
            this.buttonItem.text = " ▶ "; // Play to resume
            this.buttonItem.tooltip = "Resume grind";
            this.buttonItem.command = "pomodoro.toggle";
        }
        else {
            this.buttonItem.text = " ⏸ "; // Pause when running
            this.buttonItem.tooltip = "Pause grind";
            this.buttonItem.command = "pomodoro.toggle";
        }
        // Stop button always visible when timer is active
        this.stopItem.text = " ■ ";
        this.stopItem.tooltip = "Stop grind";
        this.stopItem.command = "pomodoro.stop";
        this.rightBorder.text = constants_1.SEPARATOR_RIGHT;
        // Apply theming based on state
        this.applyTheme(state, sessionType);
        // Set tooltips
        this.progressItem.tooltip = this.getTooltip(state, sessionType);
        this.timerItem.tooltip = `${timeText} remaining - Click to ${state === "running" ? "pause" : "resume"}`;
        this.show();
    }
    /**
     * Show idle state - displays empty progress bar for consistent sizing
     */
    showIdle() {
        const emptyBar = constants_1.EMPTY_BLOCK.repeat(constants_1.PROGRESS_BAR_LENGTH);
        this.leftBorder.text = constants_1.SEPARATOR_LEFT;
        this.leftBorder.backgroundColor = undefined;
        this.progressItem.text = ` ${emptyBar} `;
        this.progressItem.tooltip = "Pomodoro Timer";
        this.progressItem.backgroundColor = undefined;
        this.dotItem.text = "•";
        this.dotItem.backgroundColor = undefined;
        this.timerItem.text = " --:-- ";
        this.timerItem.tooltip = "Click to start";
        this.timerItem.backgroundColor = undefined;
        this.timerItem.command = "pomodoro.showMenu";
        this.buttonItem.text = " ▶ ";
        this.buttonItem.tooltip = "Start Pomodoro";
        this.buttonItem.command = "pomodoro.showMenu";
        this.buttonItem.backgroundColor = undefined;
        // Hide stop button in idle state
        this.stopItem.hide();
        this.stopItem.backgroundColor = undefined;
        this.rightBorder.text = constants_1.SEPARATOR_RIGHT;
        this.rightBorder.backgroundColor = undefined;
        // Show all except stop button
        this.leftBorder.show();
        this.progressItem.show();
        this.dotItem.show();
        this.timerItem.show();
        this.buttonItem.show();
        this.rightBorder.show();
    }
    /**
     * Get tooltip text
     */
    getTooltip(state, sessionType) {
        const sessionLabel = this.getSessionLabel(sessionType);
        switch (state) {
            case "running":
                return `${sessionLabel} in progress`;
            case "paused":
                return `${sessionLabel} paused`;
            case "break":
                return `${sessionLabel}`;
            default:
                return "Pomodoro Timer";
        }
    }
    /**
     * Get human-readable session label
     */
    getSessionLabel(sessionType) {
        switch (sessionType) {
            case "work":
                return "Work session";
            case "shortBreak":
                return "Short break";
            case "longBreak":
                return "Long break";
            default:
                return "Session";
        }
    }
    /**
     * Apply theme colors based on state
     * - color (remote background) for active work sessions
     * - Warning/prominent background for breaks
     * - No background when paused or idle
     */
    applyTheme(state, sessionType) {
        // Reset backgrounds first
        this.leftBorder.backgroundColor = undefined;
        this.progressItem.backgroundColor = undefined;
        this.dotItem.backgroundColor = undefined;
        this.timerItem.backgroundColor = undefined;
        this.buttonItem.backgroundColor = undefined;
        this.stopItem.backgroundColor = undefined;
        this.rightBorder.backgroundColor = undefined;
        // Only apply background to the timer text
        if (state === "running") {
            if (sessionType === "work") {
                // color for active work session
                this.timerItem.backgroundColor = new vscode.ThemeColor("statusBarItem.remoteBackground");
            }
            else {
                // Break session (short or long) - warning/orange color
                this.timerItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
            }
        }
        else if (state === "break") {
            // Break state - warning/orange color
            this.timerItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
        }
        // Paused and idle states have no background
    }
    /**
     * Show all status bar items (including stop when active)
     */
    show() {
        this.leftBorder.show();
        this.progressItem.show();
        this.dotItem.show();
        this.timerItem.show();
        this.buttonItem.show();
        this.stopItem.show();
        this.rightBorder.show();
    }
    /**
     * Hide all status bar items
     */
    hide() {
        this.leftBorder.hide();
        this.progressItem.hide();
        this.dotItem.hide();
        this.timerItem.hide();
        this.buttonItem.hide();
        this.stopItem.hide();
        this.rightBorder.hide();
    }
    /**
     * Dispose of status bar items
     */
    dispose() {
        this.leftBorder.dispose();
        this.progressItem.dispose();
        this.dotItem.dispose();
        this.timerItem.dispose();
        this.buttonItem.dispose();
        this.stopItem.dispose();
        this.rightBorder.dispose();
    }
}
exports.StatusBarUI = StatusBarUI;
//# sourceMappingURL=StatusBarUI.js.map