import { supabase } from './supabase';

const MAX_BYTES = 2 * 1024 * 1024;

/** Uploads an image to a public bucket under a random name and returns its public URL. */
export async function uploadImage(bucket: 'branding' | 'question-media', file: File | Blob, fileName = 'image'): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error(`${fileName} is larger than 2 MB. Use a smaller or compressed image.`);
  const extension = (file.type.split('/')[1] ?? 'png').replace('svg+xml', 'svg').replace('jpeg', 'jpg');
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
