import { useState, useCallback } from "react";

interface UseScreenshotReturn {
  takeScreenshot: () => Promise<void>;
  screenshotUrl: string | null;
  screenshotBlob: Blob | null;
  isTaking: boolean;
  error: string | null;
  discardScreenshot: () => void;
}

export function useScreenshot(): UseScreenshotReturn {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takeScreenshot = useCallback(async () => {
    setError(null);
    setIsTaking(true);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1 },
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      const width = settings.width || 1920;
      const height = settings.height || 1080;

      // Wait a frame for the stream to stabilize
      await new Promise((r) => setTimeout(r, 200));

      // Use ImageCapture if available, otherwise fallback to canvas
      let blob: Blob;

      if ("ImageCapture" in window) {
        const capture = new (window as any).ImageCapture(track);
        const bitmap = await capture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to capture"))), "image/png");
        });
      } else {
        // Fallback: draw video to canvas
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        await new Promise((r) => setTimeout(r, 300));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0, width, height);
        video.pause();
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to capture"))), "image/png");
        });
      }

      // Stop the stream immediately
      stream.getTracks().forEach((t) => t.stop());

      const url = URL.createObjectURL(blob);
      setScreenshotBlob(blob);
      setScreenshotUrl(url);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Screen sharing was cancelled.");
      } else {
        setError(err.message || "Failed to take screenshot.");
      }
    } finally {
      setIsTaking(false);
    }
  }, []);

  const discardScreenshot = useCallback(() => {
    if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
    setScreenshotUrl(null);
    setScreenshotBlob(null);
    setError(null);
  }, [screenshotUrl]);

  return {
    takeScreenshot,
    screenshotUrl,
    screenshotBlob,
    isTaking,
    error,
    discardScreenshot,
  };
}
