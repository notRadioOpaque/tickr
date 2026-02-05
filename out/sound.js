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
exports.playSound = playSound;
exports.playCompletionSound = playCompletionSound;
exports.playCancelSound = playCancelSound;
exports.playStartSound = playStartSound;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
/**
 * Play a system sound based on the event type
 * Uses platform-specific commands to play sounds
 */
function playSound(type) {
    const config = vscode.workspace.getConfiguration("pomodoro");
    const enableSounds = config.get("enableSounds", true);
    if (!enableSounds) {
        return;
    }
    const platform = process.platform;
    try {
        if (platform === "darwin") {
            // macOS - use system sounds
            const soundMap = {
                complete: "Glass",
                cancel: "Basso",
                start: "Pop",
            };
            const sound = soundMap[type];
            (0, child_process_1.exec)(`afplay /System/Library/Sounds/${sound}.aiff`);
        }
        else if (platform === "linux") {
            // Linux - use paplay with freedesktop sounds
            const soundMap = {
                complete: "complete",
                cancel: "dialog-warning",
                start: "message",
            };
            const sound = soundMap[type];
            // Try common sound locations
            (0, child_process_1.exec)(`paplay /usr/share/sounds/freedesktop/stereo/${sound}.oga 2>/dev/null || aplay /usr/share/sounds/freedesktop/stereo/${sound}.wav 2>/dev/null || true`);
        }
        else if (platform === "win32") {
            // Windows - use PowerShell to play system sounds
            const soundMap = {
                complete: "Asterisk",
                cancel: "Exclamation",
                start: "Beep",
            };
            const sound = soundMap[type];
            (0, child_process_1.exec)(`powershell -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows ${sound}.wav').PlaySync()"`);
        }
    }
    catch (error) {
        // Silently fail if sound can't be played
        console.log("Failed to play sound:", error);
    }
}
/**
 * Play completion sound (session finished)
 */
function playCompletionSound() {
    playSound("complete");
}
/**
 * Play cancellation sound (session stopped)
 */
function playCancelSound() {
    playSound("cancel");
}
/**
 * Play start sound (session began)
 */
function playStartSound() {
    playSound("start");
}
//# sourceMappingURL=sound.js.map