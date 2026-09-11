/* ============================================================
   Real Supabase Auth for the admin area — replaces the earlier
   placeholder passphrase gate. The anon/publishable key below is
   meant to be public (Supabase's own model for it): it can only
   ever authenticate as a specific signed-in user or read nothing,
   since every table's RLS policy is scoped to `authenticated`,
   not `anon`. Writes stay service_role-only (real agent backends).
   ============================================================ */
const SUPABASE_URL = 'https://wzvlftxvthnuydkfmnrz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4TdwkSV-rrbXHj8WKo3m7w_LHbkMs1p';

const SESSION_KEY = 'dova_admin_session';

function saveSession(session) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}

function isLoggedIn() {
  const s = loadSession();
  return !!(s && s.access_token && s.expires_at > Date.now());
}

function getUserEmail() {
  const s = loadSession();
  return s && s.user ? s.user.email : null;
}

async function signIn(email, password) {
  const res = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Sign-in failed');
  saveSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
    user: data.user
  });
  return data;
}

async function signOut() {
  const s = loadSession();
  clearSession();
  if (s && s.access_token) {
    try {
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + s.access_token }
      });
    } catch (e) { /* best-effort — session is already cleared locally either way */ }
  }
}

/* Authenticated PostgREST read. RLS enforces the real boundary here —
   this just attaches the logged-in user's token. */
async function fetchTable(table, query) {
  const s = loadSession();
  if (!s || !s.access_token) throw new Error('Not signed in');
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + (query || ''), {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + s.access_token }
  });
  if (!res.ok) throw new Error('Could not load ' + table + ' (' + res.status + ')');
  return res.json();
}
