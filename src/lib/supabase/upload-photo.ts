import { createClient } from "@/lib/supabase/client";
import {
  isAllowedPhotoType,
  MAX_PHOTO_SIZE_MB,
} from "@/lib/security/validation";

const BUCKET = "cv-photos";

/**
 * Uploads a photo to Supabase Storage under the user's folder.
 */
export async function uploadPhoto(
  file: File,
  storagePath: string
): Promise<{ url: string } | { error: string }> {
  if (!isAllowedPhotoType(file.type)) {
    return { error: "Only JPG, PNG, WebP or GIF images are allowed." };
  }

  if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return { error: `Image must be smaller than ${MAX_PHOTO_SIZE_MB}MB.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to upload a photo." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filePath = `${user.id}/${storagePath}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return { url: publicUrl };
}

/**
 * Removes a photo from Supabase Storage using its public URL.
 */
export async function deletePhotoByUrl(
  photoUrl: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const marker = `/object/public/${BUCKET}/`;
  const index = photoUrl.indexOf(marker);

  if (index === -1) {
    return {};
  }

  const filePath = decodeURIComponent(photoUrl.slice(index + marker.length));
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

  if (error) {
    return { error: error.message };
  }

  return {};
}
