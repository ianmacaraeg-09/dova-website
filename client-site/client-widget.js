/* ============================================================
   Where each page's agent will eventually live. All six agents
   are real now (see admin/widget.js) — Eos, Charis and Argo are
   owner-only, admin-side agents with no public trace at all;
   Echo and Hora are straightforwardly customer-facing; Obol is
   genuinely both, a real public presence plus a separate
   admin-side view for the collections/ageing side of its job.
   The one remaining caller of initPageAgent (index.html's
   homepage bubble) is a real "coming soon": a site-wide Echo
   presence distinct from Echo's real per-page widget on Contact.
   ============================================================ */
function initPageAgent(agentName, note) {
  var root = document.createElement('div');
  root.className = 'agent-widget';
  root.innerHTML =
    '<button class="agent-widget-bubble" aria-label="' + agentName + '">' + agentName.charAt(0) + '</button>' +
    '<div class="agent-widget-panel">' +
      '<div class="agent-widget-simple-body">' +
        '<div class="agent-widget-name">' + agentName + '</div>' +
        '<div class="agent-widget-note">' + note + '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  var bubble = root.querySelector('.agent-widget-bubble');
  bubble.addEventListener('click', function () {
    root.classList.toggle('open');
  });
}
