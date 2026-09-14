/* ============================================================
   Public read/insert helper for the client-site sandbox. Uses the
   anon/publishable key directly — no login, matching a real
   visitor on a real business site. RLS is the actual boundary:
   anon can INSERT into bookings/enquiries/invoices/leads (new
   records only, can't read them back) and SELECT inventory_items
   (a public catalog). Everything else stays authenticated-only,
   same project as the admin sandbox at ../admin/.
   ============================================================ */
const SUPABASE_URL = 'https://wzvlftxvthnuydkfmnrz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4TdwkSV-rrbXHj8WKo3m7w_LHbkMs1p';

async function insertRow(table, row) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (!res.ok) {
    let message = 'Request failed (' + res.status + ')';
    try { const err = await res.json(); message = err.message || message; } catch (e) {}
    throw new Error(message);
  }
}

async function fetchPublicTable(table, query) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + (query || ''), {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
  });
  if (!res.ok) throw new Error('Could not load ' + table + ' (' + res.status + ')');
  return res.json();
}
