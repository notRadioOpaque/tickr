import { EMPTY_BLOCK, FILLED_BLOCK, PROGRESS_BAR_LENGTH } from "./constants";

/**
 * Convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

/**
 * Format milliseconds as MM:SS
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Generate a progress bar string
 * @param progress - Value between 0 and 1
 */
export function generateProgressBar(progress: number): string {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const filledCount = Math.round(clampedProgress * PROGRESS_BAR_LENGTH);
  const emptyCount = PROGRESS_BAR_LENGTH - filledCount;
  return FILLED_BLOCK.repeat(filledCount) + EMPTY_BLOCK.repeat(emptyCount);
}
