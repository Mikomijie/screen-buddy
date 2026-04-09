import { useRef, useState, useCallback, useEffect } from "react";

export interface WebcamBubblePosition {
  x: number;
  y: number;
}

interface WebcamBubbleProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  size?: number;
  padding?: number;
  position?: WebcamBubblePosition;
  onPositionChange?: (position: WebcamBubblePosition) => void;
}

const DEFAULT_POSITION: WebcamBubblePosition = { x: 1, y: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function WebcamBubble({
  videoRef,
  stream,
  size = 140,
  padding = 20,
  position = DEFAULT_POSITION,
  onPositionChange,
}: WebcamBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: size + padding * 2, height: size + padding * 2 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const maxX = Math.max(bounds.width - size - padding * 2, 0);
  const maxY = Math.max(bounds.height - size - padding * 2, 0);
  const left = padding + position.x * maxX;
  const top = padding + position.y * maxY;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !bubbleRef.current?.parentElement) return;
      const parent = bubbleRef.current.parentElement.getBoundingClientRect();
      const nextX = clamp(e.clientX - parent.left - dragOffset.current.x - padding, 0, Math.max(parent.width - size - padding * 2, 0));
      const nextY = clamp(e.clientY - parent.top - dragOffset.current.y - padding, 0, Math.max(parent.height - size - padding * 2, 0));

      onPositionChange?.({
        x: Math.max(parent.width - size - padding * 2, 0) === 0 ? 0 : nextX / Math.max(parent.width - size - padding * 2, 0),
        y: Math.max(parent.height - size - padding * 2, 0) === 0 ? 0 : nextY / Math.max(parent.height - size - padding * 2, 0),
      });
    },
    [onPositionChange, padding, size]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  useEffect(() => {
    if (!bubbleRef.current?.parentElement) return;

    const parent = bubbleRef.current.parentElement;
    const updateBounds = () => {
      setBounds({ width: parent.clientWidth, height: parent.clientHeight });
    };

    updateBounds();
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(parent);

    return () => resizeObserver.disconnect();
  }, [size, padding]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, videoRef]);

  if (!stream) return null;

  return (
    <div
      ref={bubbleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute z-50 cursor-grab active:cursor-grabbing select-none pointer-events-auto"
      style={{
        left,
        top,
        width: size,
        height: size,
        touchAction: "none",
      }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden border-[3px] border-primary shadow-lg shadow-primary/20"
        style={{ background: "hsl(var(--card))" }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      </div>
    </div>
  );
}
