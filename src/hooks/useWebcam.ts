import { useState, useRef, useCallback, useEffect } from "react";

interface UseWebcamReturn {
  isEnabled: boolean;
  setEnabled: (val: boolean) => void;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  error: string | null;
}

export function useWebcam(): UseWebcamReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null!);

  const startWebcam = useCallback(async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: "user" },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setError("Camera access denied");
      setIsEnabled(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const setEnabled = useCallback(
    (val: boolean) => {
      setIsEnabled(val);
      if (val) {
        startWebcam();
      } else {
        stopWebcam();
      }
    },
    [startWebcam, stopWebcam]
  );

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { isEnabled, setEnabled, stream, videoRef, error };
}
