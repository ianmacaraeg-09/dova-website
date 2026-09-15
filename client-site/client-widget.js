/* ============================================================
   Where each page's agent will eventually live. Agents still
   marked here are "coming soon" — Argo and Obol have no backend
   yet. Eos, Charis, Echo and Hora are real, but Eos and Charis
   are owner-only, admin-side agents (see admin/widget.js), not
   customer-facing — so this just marks the spot and names which
   agent owns this page, matching DOVA's confirmed one-agent-per-
   page site model.
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
