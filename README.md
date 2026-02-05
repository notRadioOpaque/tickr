# Tickr

## Pomodoro Timer for VS Code

A state-first Pomodoro timer extension with visual progress bar in the status bar.

## Features

- **Visual Progress Bar**: Minimalist line-based progress indicator (`▰▰▰▱▱`)
- **Custom Duration**: Start with default or specify your own duration
- **Stop Button**: Dedicated stop icon to end sessions
- **Sound Notifications**: Audio feedback on completion/cancellation
- **Reload Resilient**: Timer survives VS Code reloads using timestamp-based persistence
- **Sleep Aware**: Detects when laptop wakes from sleep and handles elapsed time correctly
- **Theme Adaptive**: Subtle styling that blends with your theme
- **Multi-Window Sync**: All VS Code windows show the same timer state

## Usage

Click the status bar item to start/pause/resume the timer, or use the command palette:

- **Pomodoro: Toggle Timer** - Start, pause, or resume
- **Pomodoro: Start with Custom Duration** - Specify duration in minutes
- **Pomodoro: Skip** - Skip current session (work or break)
- **Pomodoro: Stop Session** - End session immediately
- **Pomodoro: Reset** - Reset to idle state

## Configuration

| Setting                            | Default | Description                       |
| ---------------------------------- | ------- | --------------------------------- |
| `pomodoro.workDuration`            | 45      | Work session duration (minutes)   |
| `pomodoro.shortBreakDuration`      | 5       | Short break duration (minutes)    |
| `pomodoro.longBreakDuration`       | 15      | Long break duration (minutes)     |
| `pomodoro.sessionsBeforeLongBreak` | 4       | Work sessions before a long break |
| `pomodoro.enableSounds`            | true    | Play sound on session completion  |

## Architecture

This extension uses a **state-first design** with timestamps to prevent timer drift:

```
Remaining = ExpectedEndTime - CurrentTimestamp
```

Session state is persisted to `globalState` on every state change, ensuring the timer:

- Survives VS Code reloads
- Handles laptop sleep correctly
- Syncs across multiple windows

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Package extension
npx vsce package
```

## License

MIT
