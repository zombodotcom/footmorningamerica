import { createClient } from '@supabase/supabase-js';

// Anon client — build-time reads of approved listings (RLS enforced).
export function anonClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing PUBLIC_SUPABASE_* env vars');
  return createClient(url, key);
}

// Service client — server endpoint only. Bypasses RLS; never import in client code.
export function serviceClient() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing service-role env vars');
  return createClient(url, key, { auth: { persistSession: false } });
}
