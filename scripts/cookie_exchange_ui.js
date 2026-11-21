/* Cookie exchange page UI - Lumen & Ledger - MIT License */
(function () {
  'use strict';
  var C = window.CookieExchange;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(id) { return parseFloat($(id).value); }

  function render() {
    var r = C.calc({ people: num('n'), perPerson: num('c'), keepOwn: $('own').checked, tasting: num('t'), bufferPct: num('b'), yieldPerBatch: num('y') });
    var h = '<p>Each baker bakes <span class="big">' + r.total + ' cookies</span> (' + r.dozens + ' dozen).</p>' +
      '<p>That is <b>' + r.batches + ' batch' + (r.batches === 1 ? '' : 'es') + '</b> of a recipe that makes ' + r.yieldPerBatch +
      ' (recipe × ' + r.multiplier + '), giving ' + r.baked + ' cookies: ' + r.spare + ' spare.</p>' +
      '<p>Pack <b>' + r.sets + ' bags or boxes of ' + r.perPerson + '</b>' + (r.tasting ? ', plus ' + r.tasting + ' for the tasting plate' : '') + '.' +
      ' Everyone goes home with ' + (r.sets === r.people ? r.takeHome : (r.people - 1) * r.perPerson) + ' cookies in ' + (r.sets === r.people ? r.people : r.people - 1) + ' varieties. ' +
      'The whole group bakes ' + r.groupTotal + ' cookies.</p>';
    $('res').innerHTML = h;
  }
  ['n', 'c', 'own', 't', 'b', 'y'].forEach(function (id) { $(id).addEventListener('input', render); $(id).addEventListener('change', render); });
  render();

  var ALL = ['nuts', 'peanuts', 'milk', 'eggs', 'wheat', 'soy'];
  var rows = [];
  function addRow(baker, cookie) { rows.push({ baker: baker || '', cookie: cookie || '', allergens: {} }); drawList(); }
  function drawList() {
    var d = C.duplicates(rows), dupIdx = {};
    Object.keys(d).forEach(function (k) { d[k].forEach(function (i) { dupIdx[i] = 1; }); });
    var h = '<tr><th>Baker</th><th>Cookie</th><th>Contains</th><th></th></tr>';
    rows.forEach(function (r, i) {
      h += '<tr' + (dupIdx[i] ? ' class="dup"' : '') + '><td><input data-i="' + i + '" data-f="baker" value="' + esc(r.baker) + '" maxlength="40" aria-label="Baker ' + (i + 1) + '"></td>' +
        '<td><input data-i="' + i + '" data-f="cookie" value="' + esc(r.cookie) + '" maxlength="50" aria-label="Cookie ' + (i + 1) + '"></td><td>' +
        ALL.map(function (a) { return '<label><input type="checkbox" data-i="' + i + '" data-a="' + a + '"' + (r.allergens[a] ? ' checked' : '') + '> ' + a + '</label>'; }).join(' ') +
        '</td><td><button class="s light" data-x="' + i + '" aria-label="Remove row ' + (i + 1) + '">×</button></td></tr>';
    });
    $('sl').innerHTML = h;
    status();
  }
  function status() {
    var d = C.duplicates(rows), n = Object.keys(d).length, dupIdx = {};
    Object.keys(d).forEach(function (k) { d[k].forEach(function (i) { dupIdx[i] = 1; }); });
    Array.prototype.forEach.call($('sl').rows, function (tr, j) { if (j > 0) tr.className = dupIdx[j - 1] ? 'dup' : ''; });
    $('dup').textContent = n ? 'Possible duplicates: ' + Object.keys(d).map(function (k) { return d[k].map(function (i) { return rows[i].baker || ('row ' + (i + 1)); }).join(' and ') + ' (' + k + ')'; }).join('; ') + '.' : '';
    var h = '';
    rows.forEach(function (r) {
      if (!r.cookie.trim()) return;
      var a = ALL.filter(function (x) { return r.allergens[x]; });
      h += '<div class="card"><b>' + esc(r.cookie) + '</b><br>' + (r.baker ? 'Baked by ' + esc(r.baker) + '<br>' : '') +
        'Contains: ' + (a.length ? esc(a.join(', ')) : 'none of the listed allergens (ask the baker)') + '</div>';
    });
    $('cards').innerHTML = h;
  }
  $('sl').addEventListener('input', function (e) {
    var t = e.target, i = +t.dataset.i;
    if (t.dataset.f) { rows[i][t.dataset.f] = t.value; status(); }
  });
  $('sl').addEventListener('change', function (e) {
    var t = e.target, i = +t.dataset.i;
    if (t.dataset.a) { rows[i].allergens[t.dataset.a] = t.checked; status(); }
  });
  $('sl').addEventListener('click', function (e) {
    if (e.target.dataset.x !== undefined) { rows.splice(+e.target.dataset.x, 1); drawList(); }
  });
  $('add').onclick = function () { addRow(); };
  $('print').onclick = function () { window.print(); };
  $('copy').onclick = function () {
    var t = rows.filter(function (r) { return r.baker || r.cookie; }).map(function (r) {
      var a = ALL.filter(function (x) { return r.allergens[x]; });
      return (r.baker || '?') + ': ' + (r.cookie || '?') + (a.length ? ' (contains ' + a.join(', ') + ')' : '');
    }).join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { $('msg').textContent = 'Copied.'; }, function () { $('msg').textContent = 'Copy failed: select the table instead.'; });
    else $('msg').textContent = 'Copy not available: select the table instead.';
  };
  for (var k = 0; k < 4; k++) addRow();
})();
