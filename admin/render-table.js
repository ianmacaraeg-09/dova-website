/* ============================================================
   Small shared table renderer for the agent pages. Each page
   defines its own column list (label + how to render each cell);
   this just turns rows into a <table> or an empty-state message.
   ============================================================ */
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderTable(containerId, rows, columns) {
  var el = document.getElementById(containerId);
  if (!el) return;
  if (!rows || !rows.length) {
    el.innerHTML = '<div class="data-empty">Nothing here yet.</div>';
    return;
  }
  var thead = '<tr>' + columns.map(function (c) { return '<th>' + c.label + '</th>'; }).join('') + '</tr>';
  var body = rows.map(function (r) {
    return '<tr>' + columns.map(function (c) {
      return '<td>' + (c.render ? c.render(r) : escapeHtml(r[c.key])) + '</td>';
    }).join('') + '</tr>';
  }).join('');
  el.innerHTML = '<table class="data-table"><thead>' + thead + '</thead><tbody>' + body + '</tbody></table>';
}

function fmtDate(value) {
  if (!value) return '&mdash;';
  var d = new Date(value);
  if (isNaN(d)) return escapeHtml(value);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(value) {
  if (!value) return '&mdash;';
  var d = new Date(value);
  if (isNaN(d)) return escapeHtml(value);
  return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtCurrency(value) {
  if (value == null) return '&mdash;';
  return '&#8369;' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function pill(text, tone) {
  return '<span class="pill' + (tone ? ' pill-' + tone : '') + '">' + escapeHtml(text) + '</span>';
}
