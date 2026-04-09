import { useState, useCallback } from "react";
import { Monitor, AlertTriangle, Camera } from "lucide-react";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";
import { useScreenshot } from "@/hooks/useScreenshot";
import { useWebcam } from "@/hooks/useWebcam";
import { TimerDisplay } from "./TimerDisplay";
import { RecorderControls } from "./RecorderControls";
import { SettingsPanel } from "./SettingsPanel";
import { VideoPreview } from "./VideoPreview";
import { ScreenshotPreview } from "./ScreenshotPreview";
import { WebcamBubble } from "./WebcamBubble";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supportsScreenCapture } from "@/lib/mobileUtils";

export function ScreenRecorder() {
  const [includeMic, setIncludeMic] = useState(false);
  const [maxDuration, setMaxDuration] = useState(180);
  const [isConverting, setIsConverting] = useState(false);
  const [mp4Url, setMp4Url] = useState<string | null>(null);
  const { toast } = useToast();
  const webcam = useWebcam();

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
    webcamStream: webcam.stream,
  });

  const {
    takeScreenshot,
    screenshotUrl,
    screenshotBlob,
    isTaking,
    error: screenshotError,
    discardScreenshot,
  } = useScreenshot();

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
      const mp4Blob = new Blob([data as any], { type: "video/mp4" });
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

  const canCapture = supportsScreenCapture();
  const isRecording = state === "recording" || state === "paused";
  const showScreenshot = screenshotUrl && screenshotBlob && state === "idle";
  const displayError = error || screenshotError || webcam.error;

  // Show webcam bubble whenever enabled and stream is active
  const showWebcamBubble = webcam.isEnabled && webcam.stream;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header area */}
      <div className="text-center space-y-2 animate-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-heading font-medium text-muted-foreground">
          <Monitor className="h-3.5 w-3.5" />
          Browser-native recording
        </div>
      </div>

      {/* Webcam PiP bubble */}
      {showWebcamBubble && (
        <div className="relative w-full h-0">
          <WebcamBubble videoRef={webcam.videoRef} stream={webcam.stream} />
        </div>
      )}

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
      {displayError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {displayError}
        </div>
      )}

      {/* Controls — only show if screen capture is supported */}
      {canCapture && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 animate-fade-up-delay-2">
          <RecorderControls
            state={state}
            onStart={startRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={stopRecording}
            onDiscard={handleDiscard}
          />

          {/* Screenshot button — only show when idle and no screenshot preview */}
          {state === "idle" && !showScreenshot && (
            <Button
              size="lg"
              variant="secondary"
              onClick={takeScreenshot}
              disabled={isTaking}
              className="gap-3 px-6 py-6 text-base font-heading font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              {isTaking ? "Capturing…" : "Screenshot"}
            </Button>
          )}
        </div>
      )}

      {/* Video Preview */}
      {state === "preview" && previewUrl && recordedBlob && (
        <VideoPreview
          previewUrl={previewUrl}
          recordedBlob={recordedBlob}
          onConvertToMp4={handleConvertToMp4}
          isConverting={isConverting}
          mp4Url={mp4Url}
          isNativeMp4={recordedBlob.type.includes("mp4")}
        />
      )}

      {/* Screenshot Preview */}
      {showScreenshot && (
        <ScreenshotPreview
          screenshotUrl={screenshotUrl}
          screenshotBlob={screenshotBlob}
          onDiscard={discardScreenshot}
        />
      )}

      {/* Settings — only when idle and capture supported */}
      {state === "idle" && !showScreenshot && canCapture && (
        <div className="animate-fade-up-delay-3">
          <SettingsPanel
            includeMic={includeMic}
            onMicChange={setIncludeMic}
            includeWebcam={webcam.isEnabled}
            onWebcamChange={webcam.setEnabled}
            maxDuration={maxDuration}
            onMaxDurationChange={setMaxDuration}
            disabled={isRecording}
          />
        </div>
      )}
    </div>
  );
}
