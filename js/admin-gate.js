/* ============================================================
   ADMIN GATE — placeholder passphrase check.
   NOT real security: the passphrase is plainly visible in this
   file's source and the check runs entirely in the visitor's own
   browser, so it stops nobody who opens devtools. It exists only
   to keep casual visitors from wandering into the admin area
   before real auth is built. Replace with real auth (e.g.
   Supabase) before this is relied on for anything that matters.
   ============================================================ */
(function () {
  var PASSPHRASE = 'dova2026'; // placeholder only

  var trigger = document.getElementById('adminTrigger');
  var gate = document.getElementById('adminGate');
  var input = document.getElementById('adminGateInput');
  var closeBtn = document.getElementById('adminGateClose');
  if (!trigger || !gate || !input || !closeBtn) return;

  function openGate() {
    gate.classList.add('open');
    input.value = '';
    input.classList.remove('error');
    setTimeout(function () { input.focus(); }, 50);
  }

  function closeGate() {
    gate.classList.remove('open');
  }

  trigger.addEventListener('click', openGate);
  closeBtn.addEventListener('click', closeGate);
  gate.addEventListener('click', function (e) {
    if (e.target === gate) closeGate();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && gate.classList.contains('open')) closeGate();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (input.value === PASSPHRASE) {
      sessionStorage.setItem('dova_admin_auth', 'true');
      window.location.href = 'admin/dashboard.html';
    } else {
      input.classList.remove('error');
      void input.offsetWidth; /* restart the shake animation on repeat wrong entries */
      input.classList.add('error');
    }
  });
})();
