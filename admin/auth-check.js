/* ============================================================
   Guards every admin/*.html page except login.html. Requires
   supabase-auth.js to be loaded first on the same page.
   Real Supabase Auth session check — no longer a sessionStorage
   placeholder flag.
   ============================================================ */
(function () {
  if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
    window.location.href = 'login.html';
  }
})();
