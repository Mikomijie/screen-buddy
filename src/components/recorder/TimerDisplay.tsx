import { RecordingState } from "@/hooks/useScreenRecorder";

interface TimerDisplayProps {
  elapsedSeconds: number;
  remainingSeconds: number | null;
  state: RecordingState;
  warningActive: boolean;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function TimerDisplay({ elapsedSeconds, remainingSeconds, state, warningActive }: TimerDisplayProps) {
  return (
    <div className="flex items-center gap-4 font-heading">
      {/* Recording indicator */}
      {state === "recording" && (
        <div className="flex items-center gap-2">
          <span className="recording-pulse inline-block h-3 w-3 rounded-full bg-destructive" />
          <span className="text-xs font-medium uppercase tracking-widest text-destructive">REC</span>
        </div>
      )}
      {state === "paused" && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-warning" />
          <span className="text-xs font-medium uppercase tracking-widest text-warning">Paused</span>
        </div>
      )}

      {/* Elapsed */}
      <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
        {formatTime(elapsedSeconds)}
      </span>

      {/* Remaining */}
      {remainingSeconds !== null && (
        <span
          className={`text-sm tabular-nums transition-colors ${
            warningActive ? "text-warning font-semibold animate-pulse" : "text-muted-foreground"
          }`}
        >
          {formatTime(remainingSeconds)} left
        </span>
      )}
    </div>
  );
}
