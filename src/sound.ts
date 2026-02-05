import { exec } from "child_process";
import * as vscode from "vscode";

/**
 * Sound types for different events
 */
export type SoundType = "complete" | "cancel" | "start";

/**
 * Play a system sound based on the event type
 * Uses platform-specific commands to play sounds
 */
export function playSound(type: SoundType): void {
  const config = vscode.workspace.getConfiguration("pomodoro");
  const enableSounds = config.get<boolean>("enableSounds", true);

  if (!enableSounds) {
    return;
  }

  const platform = process.platform;

  try {
    if (platform === "darwin") {
      // macOS - use system sounds
      const soundMap: Record<SoundType, string> = {
        complete: "Glass",
        cancel: "Basso",
        start: "Pop",
      };
      const sound = soundMap[type];
      exec(`afplay /System/Library/Sounds/${sound}.aiff`);
    } else if (platform === "linux") {
      // Linux - use paplay with freedesktop sounds
      const soundMap: Record<SoundType, string> = {
        complete: "complete",
        cancel: "dialog-warning",
        start: "message",
      };
      const sound = soundMap[type];
      // Try common sound locations
      exec(
        `paplay /usr/share/sounds/freedesktop/stereo/${sound}.oga 2>/dev/null || aplay /usr/share/sounds/freedesktop/stereo/${sound}.wav 2>/dev/null || true`,
      );
    } else if (platform === "win32") {
      // Windows - use PowerShell to play system sounds
      const soundMap: Record<SoundType, string> = {
        complete: "Asterisk",
        cancel: "Exclamation",
        start: "Beep",
      };
      const sound = soundMap[type];
      exec(
        `powershell -c "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows ${sound}.wav').PlaySync()"`,
      );
    }
  } catch (error) {
    // Silently fail if sound can't be played
    console.log("Failed to play sound:", error);
  }
}

/**
 * Play completion sound (session finished)
 */
export function playCompletionSound(): void {
  playSound("complete");
}

/**
 * Play cancellation sound (session stopped)
 */
export function playCancelSound(): void {
  playSound("cancel");
}

/**
 * Play start sound (session began)
 */
export function playStartSound(): void {
  playSound("start");
}
