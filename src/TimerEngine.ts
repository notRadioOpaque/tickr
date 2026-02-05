import * as vscode from "vscode";
import {
  PomodoroSession,
  PomodoroConfig,
  TimerState,
  SessionType,
} from "./types";
import {
  STORAGE_KEY,
  UPDATE_INTERVAL_MS,
  DEFAULT_WORK_DURATION,
  DEFAULT_SHORT_BREAK_DURATION,
  DEFAULT_LONG_BREAK_DURATION,
  DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
  DEFAULT_SESSION,
} from "./constants";
import { StatusBarUI } from "./StatusBarUI";
import { playCompletionSound, playCancelSound, playStartSound } from "./sound";
import { minutesToMs } from "./utils";

/**
 * Core timer engine managing state, persistence, and the update loop
 * Uses timestamp-based timing to prevent drift and survive reloads
 */
export class TimerEngine {
  private session: PomodoroSession;
  private intervalId: NodeJS.Timeout | null = null;
  private statusBarUI: StatusBarUI;

  constructor(
    private context: vscode.ExtensionContext,
    statusBarUI: StatusBarUI,
  ) {
    this.statusBarUI = statusBarUI;
    this.session = { ...DEFAULT_SESSION };
  }

  /**
   * Get current timer state
   */
  public get state(): TimerState {
    return this.session.state;
  }

  /**
   * Get current session type
   */
  public get sessionType(): SessionType {
    return this.session.sessionType;
  }

  /**
   * Get completed sessions count
   */
  public get completedSessions(): number {
    return this.session.completedSessions;
  }

  /**
   * Get configuration from VS Code settings
   */
  private getConfig(): PomodoroConfig {
    const config = vscode.workspace.getConfiguration("pomodoro");
    return {
      workDuration: config.get<number>("workDuration", DEFAULT_WORK_DURATION),
      shortBreakDuration: config.get<number>(
        "shortBreakDuration",
        DEFAULT_SHORT_BREAK_DURATION,
      ),
      longBreakDuration: config.get<number>(
        "longBreakDuration",
        DEFAULT_LONG_BREAK_DURATION,
      ),
      sessionsBeforeLongBreak: config.get<number>(
        "sessionsBeforeLongBreak",
        DEFAULT_SESSIONS_BEFORE_LONG_BREAK,
      ),
    };
  }

  /**
   * Persist current session to globalState
   * This is the source of truth that survives reloads
   */
  private persist(): void {
    this.context.globalState.update(STORAGE_KEY, this.session);
  }

  /**
   * Restore session from globalState on activation
   * Handles the "reload" and "sleep" edge cases
   */
  public restore(): void {
    const saved = this.context.globalState.get<PomodoroSession>(STORAGE_KEY);

    if (!saved) {
      // No saved session, start fresh
      this.session = { ...DEFAULT_SESSION };
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
      } else {
        // Resume running session
        this.startUpdateLoop();
        this.updateUI();
      }
    } else if (this.session.state === "paused") {
      // Paused session - just update UI
      this.updateUI();
    } else if (this.session.state === "break" && this.session.expectedEndTime) {
      const now = Date.now();

      if (now >= this.session.expectedEndTime) {
        // Break ended while away
        this.handleBreakComplete();
      } else {
        // Resume break timer
        this.startUpdateLoop();
        this.updateUI();
      }
    } else {
      // Idle state
      this.statusBarUI.showIdle();
    }
  }

  /**
   * Start a new work session with default duration
   */
  public start(): void {
    const config = this.getConfig();
    this.startWithDuration(config.workDuration);
  }

  /**
   * Start a new work session with custom duration
   * @param minutes - Duration in minutes
   */
  public startWithDuration(minutes: number): void {
    const duration = minutesToMs(minutes);

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
    playStartSound();
  }

  /**
   * Prompt user for custom duration and start
   */
  public async startCustom(): Promise<void> {
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
  public pause(): void {
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
  public resume(): void {
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
  public toggle(): void {
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
  public async showMenu(): Promise<void> {
    if (this.session.state !== "idle") {
      // If not idle, just toggle
      this.toggle();
      return;
    }

    const config = this.getConfig();
    const defaultDuration = config.workDuration;

    const selection = await vscode.window.showQuickPick(
      [
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
      ],
      {
        placeHolder: "Start a Pomodoro session",
      },
    );

    if (selection) {
      if (selection.action === "default") {
        this.start();
      } else if (selection.action === "custom") {
        await this.startCustom();
      }
    }
  }

  /**
   * Skip the current session (work or break)
   */
  public skip(): void {
    if (this.session.state === "break") {
      // Skip break, go to idle
      this.reset();
    } else if (
      this.session.state === "running" ||
      this.session.state === "paused"
    ) {
      // Skip work session, start break
      this.handleSessionComplete();
    }
  }

  /**
   * Stop and completely end the current session
   * Does not trigger break or count as completed
   */
  public stop(): void {
    if (this.session.state === "idle") {
      return;
    }

    this.stopUpdateLoop();
    playCancelSound();

    this.session = {
      ...DEFAULT_SESSION,
      completedSessions: this.session.completedSessions,
    };

    this.persist();
    this.statusBarUI.showIdle();

    vscode.window.showInformationMessage("Pomodoro session stopped.");
  }

  /**
   * Reset to idle state
   */
  public reset(): void {
    this.stopUpdateLoop();

    this.session = {
      ...DEFAULT_SESSION,
      completedSessions: this.session.completedSessions,
    };

    this.persist();
    this.statusBarUI.showIdle();
  }

  /**
   * Handle work session completion
   */
  private handleSessionComplete(): void {
    this.stopUpdateLoop();
    playCompletionSound();

    const config = this.getConfig();
    const newCompletedSessions = this.session.completedSessions + 1;

    // Determine break type
    const isLongBreak =
      newCompletedSessions % config.sessionsBeforeLongBreak === 0;
    const breakType: SessionType = isLongBreak ? "longBreak" : "shortBreak";
    const breakDuration = isLongBreak
      ? minutesToMs(config.longBreakDuration)
      : minutesToMs(config.shortBreakDuration);

    // Show notification
    const breakLabel = isLongBreak ? "long break" : "short break";
    vscode.window
      .showInformationMessage(
        `Pomodoro complete! Time for a ${breakLabel} (${isLongBreak ? config.longBreakDuration : config.shortBreakDuration} min).`,
        "Start Break",
        "Skip Break",
      )
      .then((selection) => {
        if (selection === "Start Break") {
          this.startBreak(breakType, breakDuration, newCompletedSessions);
        } else if (selection === "Skip Break") {
          this.session.completedSessions = newCompletedSessions;
          this.reset();
        }
        // If dismissed, stay in current state (idle-ish but with notification pending)
      });

    // Update session to idle while waiting for user response
    this.session = {
      ...DEFAULT_SESSION,
      completedSessions: newCompletedSessions,
    };
    this.persist();
    this.statusBarUI.showIdle();
  }

  /**
   * Start a break session
   */
  private startBreak(
    breakType: SessionType,
    duration: number,
    completedSessions: number,
  ): void {
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
  private handleBreakComplete(): void {
    this.stopUpdateLoop();
    playCompletionSound();

    vscode.window
      .showInformationMessage(
        "Break complete! Ready to start another Pomodoro?",
        "Start Work",
        "Not Now",
      )
      .then((selection) => {
        if (selection === "Start Work") {
          this.start();
        }
      });

    this.session = {
      ...DEFAULT_SESSION,
      completedSessions: this.session.completedSessions,
    };
    this.persist();
    this.statusBarUI.showIdle();
  }

  /**
   * Start the update loop (runs every 500ms)
   */
  private startUpdateLoop(): void {
    this.stopUpdateLoop(); // Clear any existing interval

    this.intervalId = setInterval(() => {
      this.tick();
    }, UPDATE_INTERVAL_MS);
  }

  /**
   * Stop the update loop
   */
  private stopUpdateLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Called on each tick of the update loop
   * Uses timestamp-based calculation to prevent drift
   */
  private tick(): void {
    if (!this.session.expectedEndTime) {
      return;
    }

    const now = Date.now();
    const remaining = this.session.expectedEndTime - now;

    if (remaining <= 0) {
      // Session complete
      if (
        this.session.state === "running" &&
        this.session.sessionType === "work"
      ) {
        this.handleSessionComplete();
      } else if (this.session.state === "break") {
        this.handleBreakComplete();
      }
    } else {
      // Update UI
      this.updateUI();
    }
  }

  /**
   * Update the status bar UI
   */
  private updateUI(): void {
    let remaining: number;

    if (this.session.state === "paused" && this.session.remainingTimeOnPause) {
      remaining = this.session.remainingTimeOnPause;
    } else if (this.session.expectedEndTime) {
      remaining = Math.max(0, this.session.expectedEndTime - Date.now());
    } else {
      remaining = this.session.totalDuration;
    }

    this.statusBarUI.update(
      this.session.state,
      remaining,
      this.session.totalDuration,
      this.session.sessionType,
    );
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.stopUpdateLoop();
    this.statusBarUI.dispose();
  }
}
