import { useState, useRef, useCallback, useEffect } from "react";
import { Crop, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CropOverlayProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
  onCancel: () => void;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function CropOverlay({ imageUrl, onCropComplete, onCancel }: CropOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });

  const getRelativePos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    setStartPos(pos);
    setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setIsDragging(true);
  }, [getRelativePos]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    setCrop({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y),
    });
  }, [isDragging, startPos, getRelativePos]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!crop || crop.w < 10 || crop.h < 10 || !containerRef.current || !imgRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = imgNatural.w / rect.width;
    const scaleY = imgNatural.h / rect.height;

    const sx = crop.x * scaleX;
    const sy = crop.y * scaleY;
    const sw = crop.w * scaleX;
    const sh = crop.h * scaleY;

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d")!;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    await new Promise((r) => { img.onload = r; });

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      onCropComplete(blob, url);
    }, "image/png");
  }, [crop, imageUrl, imgNatural, onCropComplete]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Crop className="h-4 w-4" />
        <span>Drag to select the area you want to keep</span>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-primary/50 cursor-crosshair select-none touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Crop preview"
          className="w-full max-h-[500px] object-contain pointer-events-none"
          onLoad={(e) => {
            const img = e.currentTarget;
            setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          draggable={false}
        />

        {/* Darkened overlay outside crop */}
        {crop && crop.w > 5 && crop.h > 5 && (
          <>
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            <div
              className="absolute border-2 border-primary bg-transparent pointer-events-none"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.w,
                height: crop.h,
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
                background: "transparent",
              }}
            />
            {/* Clear the double-darkening inside the crop area */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.w,
                height: crop.h,
                backdropFilter: "none",
              }}
            />
          </>
        )}

        {/* Size indicator */}
        {crop && crop.w > 30 && crop.h > 20 && (
          <div
            className="absolute text-[10px] text-primary font-mono bg-background/80 px-1 rounded pointer-events-none"
            style={{ left: crop.x + 4, top: crop.y + 4 }}
          >
            {Math.round(crop.w * (imgNatural.w / (containerRef.current?.getBoundingClientRect().width || 1)))}×
            {Math.round(crop.h * (imgNatural.h / (containerRef.current?.getBoundingClientRect().height || 1)))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleApplyCrop}
          disabled={!crop || crop.w < 10 || crop.h < 10}
          className="gap-2 font-heading glow-ember"
          size="sm"
        >
          <Check className="h-4 w-4" />
          Apply crop
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm" className="gap-2 font-heading">
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
