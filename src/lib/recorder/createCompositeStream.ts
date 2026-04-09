import type { WebcamBubblePosition } from "@/components/recorder/WebcamBubble";

export interface CompositeStreamController {
  stop: () => void;
  stream: MediaStream;
}

interface CreateCompositeStreamOptions {
  bubbleSize?: number;
  displayStream: MediaStream;
  overlayPositionRef?: { current: WebcamBubblePosition };
  webcamStream: MediaStream;
}

const HIDDEN_VIDEO_STYLE =
  "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const waitForVideoReady = (video: HTMLVideoElement) =>
  new Promise<void>((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      resolve();
      return;
    }

    const handleReady = () => {
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      resolve();
    };

    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);
  });

const createHiddenVideo = (stream: MediaStream) => {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute("autoplay", "");
  video.style.cssText = HIDDEN_VIDEO_STYLE;
  document.body.appendChild(video);
  video.play().catch(() => {});
  return video;
};

const getPrimaryRingColor = () => {
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  return primary ? `hsl(${primary})` : "#e85d3a";
};

export async function createCompositeStream({
  bubbleSize = 160,
  displayStream,
  overlayPositionRef,
  webcamStream,
}: CreateCompositeStreamOptions): Promise<CompositeStreamController> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create recording canvas.");
  }

  const screenVideo = createHiddenVideo(displayStream);
  const webcamVideo = createHiddenVideo(webcamStream);
  const ringColor = getPrimaryRingColor();

  let isStopped = false;
  let animationFrameId = 0;
  let videoFrameCallbackId = 0;

  const cancelScheduledDraw = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }

    if (videoFrameCallbackId && typeof screenVideo.cancelVideoFrameCallback === "function") {
      screenVideo.cancelVideoFrameCallback(videoFrameCallbackId);
      videoFrameCallbackId = 0;
    }
  };

  const drawFrame = () => {
    if (isStopped) return;

    const width = screenVideo.videoWidth || canvas.width || 1920;
    const height = screenVideo.videoHeight || canvas.height || 1080;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(screenVideo, 0, 0, width, height);

    if (webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const position = overlayPositionRef?.current ?? { x: 1, y: 1 };
      const inset = 24;
      const maxX = Math.max(width - bubbleSize - inset * 2, 0);
      const maxY = Math.max(height - bubbleSize - inset * 2, 0);
      const x = inset + clamp(position.x, 0, 1) * maxX;
      const y = inset + clamp(position.y, 0, 1) * maxY;
      const centerX = x + bubbleSize / 2;
      const centerY = y + bubbleSize / 2;
      const radius = bubbleSize / 2;

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.closePath();
      context.clip();

      context.translate(centerX, centerY);
      context.scale(-1, 1);
      context.translate(-centerX, -centerY);

      const webcamWidth = webcamVideo.videoWidth || bubbleSize;
      const webcamHeight = webcamVideo.videoHeight || bubbleSize;
      const scale = Math.max(bubbleSize / webcamWidth, bubbleSize / webcamHeight);
      const drawWidth = webcamWidth * scale;
      const drawHeight = webcamHeight * scale;

      context.drawImage(
        webcamVideo,
        x - (drawWidth - bubbleSize) / 2,
        y - (drawHeight - bubbleSize) / 2,
        drawWidth,
        drawHeight,
      );

      context.restore();

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = ringColor;
      context.lineWidth = 3;
      context.stroke();
    }
  };

  const scheduleNextDraw = () => {
    if (isStopped) return;

    if (typeof screenVideo.requestVideoFrameCallback === "function") {
      videoFrameCallbackId = screenVideo.requestVideoFrameCallback(() => {
        drawFrame();
        scheduleNextDraw();
      });
      return;
    }

    animationFrameId = requestAnimationFrame(() => {
      drawFrame();
      scheduleNextDraw();
    });
  };

  const stop = () => {
    if (isStopped) return;

    isStopped = true;
    cancelScheduledDraw();
    screenVideo.pause();
    webcamVideo.pause();
    screenVideo.srcObject = null;
    webcamVideo.srcObject = null;
    screenVideo.remove();
    webcamVideo.remove();
  };

  await Promise.all([waitForVideoReady(screenVideo), waitForVideoReady(webcamVideo)]);
  drawFrame();
  scheduleNextDraw();

  return {
    stop,
    stream: canvas.captureStream(30),
  };
}