import * as vscode from 'vscode';
import { StatusBarUI } from './StatusBarUI';
import { TimerEngine } from './TimerEngine';

let engine: TimerEngine | undefined;

/**
 * Extension activation
 * Called when VS Code starts (onStartupFinished)
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Pomodoro Timer extension activating...');

  // Create UI and engine
  const statusBarUI = new StatusBarUI();
  engine = new TimerEngine(context, statusBarUI);

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
  context.subscriptions.push(
    toggleCommand,
    skipCommand,
    resetCommand,
    stopCommand,
    startCustomCommand,
    showMenuCommand,
    { dispose: () => engine?.dispose() }
  );

  console.log('Pomodoro Timer extension activated');
}

/**
 * Extension deactivation
 * Called when VS Code is closing or the extension is disabled
 */
export function deactivate(): void {
  // Engine disposal is handled via subscriptions
  // globalState persistence ensures data survives
  console.log('Pomodoro Timer extension deactivated');
}
