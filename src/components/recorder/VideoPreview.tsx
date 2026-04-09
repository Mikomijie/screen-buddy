import { Download, FileVideo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VideoPreviewProps {
  previewUrl: string;
  recordedBlob: Blob;
  onConvertToMp4: () => void;
  isConverting: boolean;
  mp4Url: string | null;
}

export function VideoPreview({ previewUrl, recordedBlob, onConvertToMp4, isConverting, mp4Url }: VideoPreviewProps) {
  const downloadWebm = () => {
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `recording-${Date.now()}.webm`;
    a.click();
  };

  const downloadMp4 = () => {
    if (!mp4Url) return;
    const a = document.createElement("a");
    a.href = mp4Url;
    a.download = `recording-${Date.now()}.mp4`;
    a.click();
  };

  const fileSizeMB = (recordedBlob.size / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Video player */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <video
          src={previewUrl}
          controls
          className="w-full max-h-[400px] object-contain"
          playsInline
        />
      </div>

      {/* File info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileVideo className="h-3.5 w-3.5" />
        <span>{fileSizeMB} MB • WebM</span>
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadWebm} variant="secondary" className="gap-2 font-heading">
          <Download className="h-4 w-4" />
          Download .webm
        </Button>

        {!mp4Url ? (
          <Button onClick={onConvertToMp4} disabled={isConverting} className="gap-2 font-heading glow-ember">
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting to MP4…
              </>
            ) : (
              <>
                <FileVideo className="h-4 w-4" />
                Export as .mp4
              </>
            )}
          </Button>
        ) : (
          <Button onClick={downloadMp4} className="gap-2 font-heading glow-ember">
            <Download className="h-4 w-4" />
            Download .mp4
          </Button>
        )}
      </div>
    </div>
  );
}
