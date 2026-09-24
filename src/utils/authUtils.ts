// Simple client-side SHA-256 hashing for password gating.
//
// IMPORTANT CAVEAT: this app has no real backend/server, so "authentication"
// here means comparing a SHA-256 hash against a value stored in a public
// (RLS-open) Supabase table. It stops casual access / accidental edits by
// the wrong person, but it is NOT the same guarantee as a proper backend
// auth system (Supabase Auth, etc.) — a technically sophisticated user could
// still bypass it since the anon key is public. Good enough for a small
// school's internal tool; upgrade to Supabase Auth if stronger security is
// ever needed.
export async function sha256(message: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const FIRST_LOGIN_SENTINEL = 'CHANGE_ON_FIRST_LOGIN';
