import { Download, Image, Share2, Loader2, Check, Copy, Trash2, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { uploadAndShareRecording } from "@/lib/shareRecording";
import { useToast } from "@/hooks/use-toast";
import { CropOverlay } from "./CropOverlay";

interface ScreenshotPreviewProps {
  screenshotUrl: string;
  screenshotBlob: Blob;
  onDiscard: () => void;
}

export function ScreenshotPreview({ screenshotUrl, screenshotBlob, onDiscard }: ScreenshotPreviewProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(screenshotUrl);
  const [currentBlob, setCurrentBlob] = useState(screenshotBlob);
  const { toast } = useToast();

  const downloadPng = () => {
    const a = document.createElement("a");
    a.href = currentUrl;
    a.download = `screenshot-${Date.now()}.png`;
    a.click();
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await uploadAndShareRecording(currentBlob, "image/png");
      setShareUrl(result.shareUrl);
      toast({ title: "Share link ready!", description: "Copy the link and share it anywhere." });
    } catch (err: any) {
      console.error("Share error:", err);
      toast({ title: "Share failed", description: err.message || "Could not upload screenshot.", variant: "destructive" });
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

  const handleCropComplete = useCallback((croppedBlob: Blob, croppedUrl: string) => {
    // Revoke old URL if it's different from the original
    if (currentUrl !== screenshotUrl) URL.revokeObjectURL(currentUrl);
    setCurrentBlob(croppedBlob);
    setCurrentUrl(croppedUrl);
    setShareUrl(null); // Reset share since image changed
    setIsCropping(false);
    toast({ title: "Cropped!", description: "Screenshot has been cropped. Download or share the result." });
  }, [currentUrl, screenshotUrl, toast]);

  const fileSizeKB = (currentBlob.size / 1024).toFixed(0);

  if (isCropping) {
    return (
      <div className="animate-fade-up">
        <CropOverlay
          imageUrl={currentUrl}
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropping(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Image preview */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <img
          src={currentUrl}
          alt="Screenshot"
          className="w-full max-h-[400px] object-contain"
        />
      </div>

      {/* File info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Image className="h-3.5 w-3.5" />
        <span>{fileSizeKB} KB • PNG</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={downloadPng} className="gap-2 font-heading glow-ember">
          <Download className="h-4 w-4" />
          Download .png
        </Button>

        <Button onClick={() => setIsCropping(true)} variant="outline" className="gap-2 font-heading">
          <Crop className="h-4 w-4" />
          Crop
        </Button>

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

        <Button onClick={onDiscard} variant="outline" className="gap-2 font-heading text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          Discard
        </Button>
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
