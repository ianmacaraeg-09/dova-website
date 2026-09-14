/* ============================================================
   Where each page's agent will eventually live. Every agent here
   is "coming soon" — none of Echo/Hora/Argo/Obol/Charis have a
   backend yet (only Eos does, and Eos is the owner-only agent on
   the admin side, not customer-facing) — so this just marks the
   spot and names which agent owns this page, matching DOVA's
   confirmed one-agent-per-page site model.
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
