import { useState, useCallback } from "react";
import { Monitor, AlertTriangle } from "lucide-react";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { TimerDisplay } from "./TimerDisplay";
import { RecorderControls } from "./RecorderControls";
import { SettingsPanel } from "./SettingsPanel";
import { VideoPreview } from "./VideoPreview";
import { useToast } from "@/hooks/use-toast";

export function ScreenRecorder() {
  const [includeMic, setIncludeMic] = useState(false);
  const [maxDuration, setMaxDuration] = useState(180); // 3 min default
  const [isConverting, setIsConverting] = useState(false);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    state,
    elapsedSeconds,
    remainingSeconds,
    recordedBlob,
    previewUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    error,
    warningActive,
  } = useScreenRecorder({
    maxDurationSeconds: maxDuration,
    warningBeforeEndSeconds: 30,
    includeMic,
  });

  // Show warning toast
  if (warningActive) {
    // This is fine in render since toast deduplicates
  }

  const handleDiscard = useCallback(() => {
    if (mp4Url) URL.revokeObjectURL(mp4Url);
    setMp4Url(null);
    setIsConverting(false);
    discardRecording();
  }, [mp4Url, discardRecording]);

  const handleConvertToMp4 = useCallback(async () => {
    if (!recordedBlob) return;
    setIsConverting(true);

    try {
      // Dynamic import of ffmpeg
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      const inputData = await fetchFile(recordedBlob);
      await ffmpeg.writeFile("input.webm", inputData);
      await ffmpeg.exec(["-i", "input.webm", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "output.mp4"]);
      const data = await ffmpeg.readFile("output.mp4");
      const uint8 = data as Uint8Array;
      const mp4Blob = new Blob([new Uint8Array(uint8.buffer, uint8.byteOffset, uint8.byteLength)], { type: "video/mp4" });
      const url = URL.createObjectURL(mp4Blob);
      setMp4Url(url);

      toast({
        title: "MP4 ready!",
        description: "Your recording has been converted. Ready to download.",
      });
    } catch (err: any) {
      console.error("FFmpeg conversion error:", err);
      toast({
        title: "Conversion failed",
        description: "Could not convert to MP4. Try downloading the .webm instead.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  }, [recordedBlob, toast]);

  const isRecording = state === "recording" || state === "paused";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header area */}
      <div className="text-center space-y-2 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-heading font-medium text-muted-foreground">
          <Monitor className="h-3.5 w-3.5" />
          Browser-native recording
        </div>
      </div>

      {/* Timer */}
      {(isRecording || state === "preview") && (
        <div className="flex justify-center animate-fade-up-delay-1">
          <TimerDisplay
            elapsedSeconds={elapsedSeconds}
            remainingSeconds={isRecording ? remainingSeconds : null}
            state={state}
            warningActive={warningActive}
          />
        </div>
      )}

      {/* Warning banner */}
      {warningActive && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 animate-fade-up">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span className="text-sm text-warning">
            {remainingSeconds}s remaining — recording will auto-stop
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center animate-fade-up-delay-2">
        <RecorderControls
          state={state}
          onStart={startRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
          onStop={stopRecording}
          onDiscard={handleDiscard}
        />
      </div>

      {/* Preview */}
      {state === "preview" && previewUrl && recordedBlob && (
        <VideoPreview
          previewUrl={previewUrl}
          recordedBlob={recordedBlob}
          onConvertToMp4={handleConvertToMp4}
          isConverting={isConverting}
          mp4Url={mp4Url}
        />
      )}

      {/* Settings — only when idle */}
      {state === "idle" && (
        <div className="animate-fade-up-delay-3">
          <SettingsPanel
            includeMic={includeMic}
            onMicChange={setIncludeMic}
            maxDuration={maxDuration}
            onMaxDurationChange={setMaxDuration}
            disabled={isRecording}
          />
        </div>
      )}
    </div>
  );
}
