import { supabase } from "@/integrations/supabase/client";

export async function uploadAndShareRecording(
  blob: Blob,
  mimeType: string = "video/webm"
): Promise<{ shareUrl: string; shareId: string }> {
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `shared/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("recordings")
    .upload(filePath, blob, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Create DB record
  const { data, error: dbError } = await supabase
    .from("shared_recordings")
    .insert({
      file_path: filePath,
      file_size: blob.size,
      mime_type: mimeType,
    })
    .select("share_id")
    .single();

  if (dbError) throw new Error(`Failed to create share link: ${dbError.message}`);

  const shareUrl = `${window.location.origin}/share/${data.share_id}`;
  return { shareUrl, shareId: data.share_id };
}
