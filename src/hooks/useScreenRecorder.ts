import { useState, useRef, useCallback, useEffect } from "react";
import type { WebcamBubblePosition } from "@/components/recorder/WebcamBubble";
import { createCompositeStream, type CompositeStreamController } from "@/lib/recorder/createCompositeStream";

export type RecordingState = "idle" | "recording" | "paused" | "preview";

interface UseScreenRecorderOptions {
  maxDurationSeconds?: number;
  warningBeforeEndSeconds?: number;
  includeMic?: boolean;
  webcamStream?: MediaStream | null;
  webcamOverlayPosition?: WebcamBubblePosition;
}

interface UseScreenRecorderReturn {
  state: RecordingState;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  recordedBlob: Blob | null;
  previewUrl: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  discardRecording: () => void;
  error: string | null;
  warningActive: boolean;
}

export function useScreenRecorder(options: UseScreenRecorderOptions = {}): UseScreenRecorderReturn {
  const {
    maxDurationSeconds = 0,
    warningBeforeEndSeconds = 30,
    includeMic = false,
    webcamStream = null,
    webcamOverlayPosition = { x: 1, y: 1 },
  } = options;

  const [state, setState] = useState<RecordingState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warningActive, setWarningActive] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const compositeControllerRef = useRef<CompositeStreamController | null>(null);
  const webcamOverlayPositionRef = useRef(webcamOverlayPosition);
  useEffect(() => {
    webcamOverlayPositionRef.current = webcamOverlayPosition;
  }, [webcamOverlayPosition]);


  const remainingSeconds = maxDurationSeconds > 0 ? Math.max(0, maxDurationSeconds - elapsedSeconds) : null;

  useEffect(() => {
    if (maxDurationSeconds > 0 && remainingSeconds !== null && remainingSeconds <= warningBeforeEndSeconds && remainingSeconds > 0 && state === "recording") {
      setWarningActive(true);
    } else {
      setWarningActive(false);
    }
  }, [remainingSeconds, warningBeforeEndSeconds, maxDurationSeconds, state]);

  useEffect(() => {
    if (maxDurationSeconds > 0 && elapsedSeconds >= maxDurationSeconds && state === "recording") {
      stopRecording();
    }
  }, [elapsedSeconds, maxDurationSeconds, state]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 200);
  }, [clearTimer]);

  const stopCompositing = useCallback(() => {
    compositeControllerRef.current?.stop();
    compositeControllerRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setWarningActive(false);
    chunksRef.current = [];

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      streamRef.current = displayStream;

      // Build video stream: composite with webcam if available
      let videoStream: MediaStream;
      if (webcamStream) {
        const compositeController = await createCompositeStream({
          displayStream,
          overlayPositionRef: webcamOverlayPositionRef,
          webcamStream,
        });
        compositeControllerRef.current = compositeController;
        videoStream = compositeController.stream;
      } else {
        videoStream = new MediaStream(displayStream.getVideoTracks());
      }

      // Build audio: combine display audio + optional mic
      let audioTracks: MediaStreamTrack[] = [];

      const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
      
      if (includeMic || hasDisplayAudio) {
        try {
          const audioContext = new AudioContext();
          const dest = audioContext.createMediaStreamDestination();

          if (hasDisplayAudio) {
            displayStream.getAudioTracks().forEach((track) => {
              const source = audioContext.createMediaStreamSource(new MediaStream([track]));
              source.connect(dest);
            });
          }

          if (includeMic) {
            try {
              const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              micStreamRef.current = micStream;
              micStream.getAudioTracks().forEach((track) => {
                const source = audioContext.createMediaStreamSource(new MediaStream([track]));
                source.connect(dest);
              });
            } catch {
              console.warn("Mic access denied, recording without mic");
            }
          }

          audioTracks = dest.stream.getAudioTracks();
        } catch {
          console.warn("Audio mixing failed");
        }
      }

      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ]);

      // Prefer MP4 natively (Chrome 130+), fall back to WebM
      const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1,mp4a.40.2")
        ? "video/mp4;codecs=avc1,mp4a.40.2"
        : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setState("preview");
        clearTimer();
        stopCompositing();
      };

      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state !== "inactive") {
          stopRecording();
        }
      };

      recorder.start(1000);
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedSeconds(0);
      setState("recording");
      startTimer();
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Screen sharing was cancelled.");
      } else {
        setError(err.message || "Failed to start recording.");
      }
    }
  }, [includeMic, webcamStream, clearTimer, startTimer, stopCompositing]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      clearTimer();
      setState("paused");
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setState("recording");
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    clearTimer();
    stopCompositing();
  }, [clearTimer, stopCompositing]);

  const discardRecording = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setElapsedSeconds(0);
    setState("idle");
    setWarningActive(false);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      stopCompositing();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  return {
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
  };
}
