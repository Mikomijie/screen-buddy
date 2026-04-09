import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Video, Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShareView() {
  const { shareId } = useParams<{ shareId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState<{
    title: string | null;
    mime_type: string;
    file_size: number | null;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    async function loadRecording() {
      if (!shareId) {
        setError("Invalid share link.");
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from("shared_recordings")
        .select("*")
        .eq("share_id", shareId)
        .single();

      if (dbError || !data) {
        setError("Recording not found or link has expired.");
        setLoading(false);
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This share link has expired.");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("recordings")
        .getPublicUrl(data.file_path);

      setVideoUrl(urlData.publicUrl);
      setRecording({
        title: data.title,
        mime_type: data.mime_type,
        file_size: data.file_size,
        created_at: data.created_at,
      });
      setLoading(false);
    }

    loadRecording();
  }, [shareId]);

  const isImage = recording?.mime_type.startsWith("image/");

  const handleDownload = () => {
    if (!videoUrl || !recording) return;
    const ext = isImage ? "png" : recording.mime_type.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${isImage ? "screenshot" : "recording"}-${shareId}.${ext}`;
    a.target = "_blank";
    a.click();
  };

  const fileSizeMB = recording?.file_size
    ? (recording.file_size / (1024 * 1024)).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5 font-heading font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            ScreenCap
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 font-heading">
              <ArrowLeft className="h-4 w-4" />
              Record your own
            </Button>
          </Link>
        </nav>

        <div className="px-6 py-12 max-w-4xl mx-auto">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-20 animate-fade-up">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground font-heading">Loading recording…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20 space-y-4 animate-fade-up">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-8 max-w-md mx-auto">
                <p className="text-destructive font-heading font-medium">{error}</p>
              </div>
              <Link to="/">
                <Button variant="secondary" className="gap-2 font-heading mt-4">
                  <ArrowLeft className="h-4 w-4" />
                  Go to recorder
                </Button>
              </Link>
            </div>
          )}

          {!loading && !error && videoUrl && recording && (
            <div className="space-y-6 animate-fade-up">
              <div className="text-center space-y-2">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                  {recording.title || "Shared Recording"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {new Date(recording.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {fileSizeMB && ` • ${fileSizeMB} MB`}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain"
                  playsInline
                />
              </div>

              <div className="flex justify-center">
                <Button onClick={handleDownload} className="gap-2 font-heading glow-ember">
                  <Download className="h-4 w-4" />
                  Download recording
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
