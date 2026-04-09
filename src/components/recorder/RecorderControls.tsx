import { Circle, Pause, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordingState } from "@/hooks/useScreenRecorder";

interface RecorderControlsProps {
  state: RecordingState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

export function RecorderControls({ state, onStart, onPause, onResume, onStop, onDiscard }: RecorderControlsProps) {
  if (state === "idle") {
    return (
      <Button
        size="lg"
        onClick={onStart}
        className="gap-3 px-8 py-6 text-base font-heading font-semibold glow-ember transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Circle className="h-5 w-5 fill-current" />
        Start Recording
      </Button>
    );
  }

  if (state === "recording" || state === "paused") {
    return (
      <div className="flex items-center gap-3">
        {state === "recording" ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={onPause}
            className="gap-2 font-heading"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            onClick={onResume}
            className="gap-2 font-heading"
          >
            <Play className="h-4 w-4" />
            Resume
          </Button>
        )}

        <Button
          size="lg"
          variant="destructive"
          onClick={onStop}
          className="gap-2 font-heading"
        >
          <Square className="h-4 w-4 fill-current" />
          Stop
        </Button>
      </div>
    );
  }

  if (state === "preview") {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={onDiscard}
        className="gap-2 font-heading text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Discard & Re-record
      </Button>
    );
  }

  return null;
}
