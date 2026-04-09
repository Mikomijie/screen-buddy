import { Monitor, Smartphone } from "lucide-react";
import { isIOS, isMobile, supportsScreenCapture } from "@/lib/mobileUtils";

export function MobileBanner() {
  const mobile = isMobile();
  const ios = isIOS();
  const canCapture = supportsScreenCapture();

  if (!mobile && canCapture) return null;

  const message = ios
    ? "Screen recording isn't available on iPhone due to iOS restrictions. You can view and save shared recordings here."
    : !canCapture
      ? "Screen recording requires a desktop browser (Chrome, Edge, or Firefox). You can view and save shared recordings here."
      : "Screen recording works on Android Chrome! Tap the record button to get started.";

  const Icon = ios || !canCapture ? Monitor : Smartphone;
  const variant = ios || !canCapture ? "warning" : "success";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${
        variant === "warning"
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-primary/30 bg-primary/10 text-primary"
      }`}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
