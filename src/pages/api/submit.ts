import type { APIRoute } from 'astro';
import { serviceClient } from '../../lib/supabase';
import { validateSubmission } from '../../lib/listing';
import { insertPendingListing } from '../../lib/listings.repo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const result = validateSubmission(Object.fromEntries(form.entries()));
  if (!result.ok) {
    return new Response(JSON.stringify({ errors: result.errors }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const client = serviceClient();
  let photo_path: string | null = null;

  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    const key = `submissions/${crypto.randomUUID()}-${photo.name}`;
    const { error } = await client.storage.from('creator-photos').upload(key, photo, { upsert: false });
    if (!error) photo_path = key;
  }

  await insertPendingListing(client, { ...result.value, photo_path });
  return new Response(null, { status: 303, headers: { Location: '/get-featured?submitted=1' } });
};
