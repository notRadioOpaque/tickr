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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const StatusBarUI_1 = require("./StatusBarUI");
const TimerEngine_1 = require("./TimerEngine");
let engine;
/**
 * Extension activation
 * Called when VS Code starts (onStartupFinished)
 */
function activate(context) {
    console.log('Pomodoro Timer extension activating...');
    // Create UI and engine
    const statusBarUI = new StatusBarUI_1.StatusBarUI();
    engine = new TimerEngine_1.TimerEngine(context, statusBarUI);
    // Restore any saved session (handles reload/sleep scenarios)
    engine.restore();
    // Register commands
    const toggleCommand = vscode.commands.registerCommand('pomodoro.toggle', () => {
        engine?.toggle();
    });
    const skipCommand = vscode.commands.registerCommand('pomodoro.skip', () => {
        engine?.skip();
    });
    const resetCommand = vscode.commands.registerCommand('pomodoro.reset', () => {
        engine?.reset();
    });
    const stopCommand = vscode.commands.registerCommand('pomodoro.stop', () => {
        engine?.stop();
    });
    const startCustomCommand = vscode.commands.registerCommand('pomodoro.startCustom', () => {
        engine?.startCustom();
    });
    const showMenuCommand = vscode.commands.registerCommand('pomodoro.showMenu', () => {
        engine?.showMenu();
    });
    // Add to subscriptions for proper disposal
    context.subscriptions.push(toggleCommand, skipCommand, resetCommand, stopCommand, startCustomCommand, showMenuCommand, { dispose: () => engine?.dispose() });
    console.log('Pomodoro Timer extension activated');
}
/**
 * Extension deactivation
 * Called when VS Code is closing or the extension is disabled
 */
function deactivate() {
    // Engine disposal is handled via subscriptions
    // globalState persistence ensures data survives
    console.log('Pomodoro Timer extension deactivated');
}
//# sourceMappingURL=extension.js.map