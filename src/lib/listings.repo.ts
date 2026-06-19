import type { SupabaseClient } from '@supabase/supabase-js';
import type { Listing, SubmissionInput } from './listing';

export async function getApprovedListings(client: SupabaseClient): Promise<Listing[]> {
  const { data, error } = await client
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Listing[];
}

export async function insertPendingListing(
  client: SupabaseClient,
  input: SubmissionInput & { photo_path?: string | null },
): Promise<void> {
  const { error } = await client.from('listings').insert({ ...input, status: 'pending' });
  if (error) throw new Error(error.message);
}
