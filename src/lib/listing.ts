import type { Platform } from './affiliate.config';

export interface Listing {
  id: string;
  display_name: string;
  platform: Platform;
  handle: string;
  outbound_url: string;
  photo_path: string | null;
  bio: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type SubmissionInput = Pick<Listing, 'display_name' | 'platform' | 'handle' | 'outbound_url' | 'bio'>;

const PLATFORMS = ['onlyfans', 'feetfinder', 'fansly', 'other'];

export function validateSubmission(input: Record<string, unknown>):
  | { ok: true; value: SubmissionInput }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  const display_name = s(input.display_name);
  const platform = s(input.platform);
  const handle = s(input.handle);
  const outbound_url = s(input.outbound_url);
  const bio = s(input.bio);

  if (!display_name) errors.push('display_name required');
  if (!PLATFORMS.includes(platform)) errors.push('invalid platform');
  if (!handle) errors.push('handle required');
  try {
    const u = new URL(outbound_url);
    if (u.protocol !== 'https:') errors.push('outbound_url must be https');
  } catch {
    errors.push('outbound_url invalid');
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { display_name, platform: platform as Platform, handle, outbound_url, bio } };
}
