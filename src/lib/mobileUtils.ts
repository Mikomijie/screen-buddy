export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function supportsScreenCapture(): boolean {
  return typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    "getDisplayMedia" in navigator.mediaDevices;
}

export async function shareOrDownload(blob: Blob, filename: string, title?: string): Promise<void> {
  // Try Web Share API first (works great on iOS/Android)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: blob.type });
    const shareData = { title: title || filename, files: [file] };
    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e: any) {
        // User cancelled share — fall through to download
        if (e.name === "AbortError") return;
      }
    }
  }
  // Fallback: standard download
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
