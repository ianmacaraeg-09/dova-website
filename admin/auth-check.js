/* ============================================================
   Guards every admin/*.html page. Same caveat as js/admin-gate.js:
   this is a sessionStorage flag check, not real auth — anyone who
   opens devtools can set it themselves. Placeholder until real
   auth exists.
   ============================================================ */
(function () {
  if (sessionStorage.getItem('dova_admin_auth') !== 'true') {
    window.location.href = '../index.html';
  }
})();
