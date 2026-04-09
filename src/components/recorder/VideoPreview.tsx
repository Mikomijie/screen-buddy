import { Download, FileVideo, Loader2, Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { uploadAndShareRecording } from "@/lib/shareRecording";
import { useToast } from "@/hooks/use-toast";

interface VideoPreviewProps {
  previewUrl: string;
  recordedBlob: Blob;
  onConvertToMp4: () => void;
  isConverting: boolean;
  mp4Url: string | null;
  isNativeMp4?: boolean;
}

export function VideoPreview({ previewUrl, recordedBlob, onConvertToMp4, isConverting, mp4Url, isNativeMp4 = false }: VideoPreviewProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await uploadAndShareRecording(recordedBlob);
      setShareUrl(result.shareUrl);
      toast({ title: "Share link ready!", description: "Copy the link and share it anywhere." });
    } catch (err: any) {
      console.error("Share error:", err);
      toast({ title: "Share failed", description: err.message || "Could not upload recording.", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
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

      {/* Download & Share buttons */}
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

        {/* Share button */}
        {!shareUrl ? (
          <Button onClick={handleShare} disabled={isSharing} variant="outline" className="gap-2 font-heading">
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share link
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleCopyLink} variant="outline" className="gap-2 font-heading">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy share link"}
          </Button>
        )}
      </div>

      {/* Share URL display */}
      {shareUrl && (
        <div
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleCopyLink}
        >
          <Share2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate font-mono">{shareUrl}</span>
        </div>
      )}
    </div>
  );
}
