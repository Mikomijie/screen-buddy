import { ScreenRecorder } from "@/components/recorder/ScreenRecorder";
import { Video, Zap, Download, Share2, Camera } from "lucide-react";

const features = [
  { icon: Video, label: "Screen + Audio", desc: "Capture any tab, window, or full screen" },
  { icon: Camera, label: "Screenshots", desc: "Grab a still frame and download as PNG" },
  { icon: Zap, label: "MP4 Export", desc: "Convert to MP4 for X/Twitter in-browser" },
  { icon: Download, label: "Instant Download", desc: "No upload — your video stays local" },
  { icon: Share2, label: "Share Links", desc: "Upload and share with a unique URL" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5 font-heading font-bold text-lg tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            ScreenCap
          </div>
          <span className="text-xs text-muted-foreground font-heading">v1.0</span>
        </nav>

        {/* Hero */}
        <section className="px-6 pt-12 pb-16 max-w-5xl mx-auto text-center space-y-6">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] animate-fade-up">
            Record your screen.
            <br />
            <span className="text-gradient">Export. Share. Done.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto animate-fade-up-delay-1">
            No extensions. No sign-ups. Just hit record, get your video, and post it anywhere.
          </p>
        </section>

        {/* Recorder */}
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <ScreenRecorder />
        </section>

        {/* Features */}
        <section className="px-6 pb-20 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {features.map((f, i) => (
              <div
                key={f.label}
                className={`glass rounded-xl p-5 space-y-3 animate-fade-up-delay-${Math.min(i + 1, 3)}`}
              >
                <f.icon className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-heading text-sm font-semibold">{f.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            Built with browser APIs • No data leaves your device
          </p>
        </footer>
      </div>
    </div>
  );
}
