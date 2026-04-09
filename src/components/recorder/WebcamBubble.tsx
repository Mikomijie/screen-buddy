import { useRef, useState, useCallback, useEffect } from "react";

interface WebcamBubbleProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  size?: number;
}

export function WebcamBubble({ videoRef, stream, size = 140 }: WebcamBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !bubbleRef.current?.parentElement) return;
      const parent = bubbleRef.current.parentElement.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - parent.left - dragOffset.current.x, parent.width - size));
      const y = Math.max(0, Math.min(e.clientY - parent.top - dragOffset.current.y, parent.height - size));
      setPosition({ x, y });
    },
    [size]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

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
      className="absolute z-50 cursor-grab active:cursor-grabbing select-none"
      style={{
        left: position.x,
        top: position.y,
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
