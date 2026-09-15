/* ============================================================
   Where each page's agent will eventually live. Agents still
   marked here are "coming soon" — only Argo has no backend yet.
   Eos, Charis, Echo, Hora and Obol are all real (see
   admin/widget.js), though Eos and Charis are owner-only,
   admin-side agents with no public trace at all, while Obol is
   genuinely both — a real public presence here plus a separate
   admin-side view for the collections/ageing side of its job.
   This file just marks the spot and names which agent owns each
   page, matching DOVA's confirmed one-agent-per-page site model.
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
