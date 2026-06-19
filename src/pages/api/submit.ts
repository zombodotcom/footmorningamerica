import type { APIRoute } from 'astro';
import { serviceClient } from '../../lib/supabase';
import { validateSubmission } from '../../lib/listing';
import { insertPendingListing } from '../../lib/listings.repo';

export const prerender = false;

// Server-side allowlist: never trust the uploaded filename or client extension.
const ALLOWED_IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_PHOTO_BYTES = 5_000_000; // 5 MB

function jsonError(errors: string[], status = 400) {
  return new Response(JSON.stringify({ errors }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const result = validateSubmission(Object.fromEntries(form.entries()));
  if (!result.ok) return jsonError(result.errors);

  const client = serviceClient();
  let photo_path: string | null = null;

  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    const ext = ALLOWED_IMAGE_EXT[photo.type];
    if (!ext) return jsonError(['unsupported image type']);
    if (photo.size > MAX_PHOTO_BYTES) return jsonError(['image too large (max 5MB)']);

    // Storage key is built only from a server-generated UUID + an allowlisted
    // extension — the user-supplied filename is never used.
    const key = `submissions/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage
      .from('creator-photos')
      .upload(key, photo, { upsert: false, contentType: photo.type });
    if (!error) photo_path = key;
  }

  await insertPendingListing(client, { ...result.value, photo_path });
  return new Response(null, { status: 303, headers: { Location: '/get-featured?submitted=1' } });
};
