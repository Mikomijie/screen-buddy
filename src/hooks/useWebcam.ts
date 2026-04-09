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
  const streamRef = useRef<MediaStream | null>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const setEnabled = useCallback(
    async (val: boolean) => {
      setIsEnabled(val);
      if (!val) {
        stopWebcam();
        return;
      }
      // getUserMedia directly in user gesture handler
      setError(null);
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 320, facingMode: "user" },
          audio: false,
        });
        streamRef.current = s;
        setStream(s);
        // Attach to video element if already mounted
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Allow webcam in browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No webcam found.");
        } else if (err.name === "NotReadableError") {
          setError("Webcam in use by another app.");
        } else {
          setError("Could not access webcam.");
        }
        setIsEnabled(false);
      }
    },
    [stopWebcam]
  );

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { isEnabled, setEnabled, stream, videoRef, error };
}
