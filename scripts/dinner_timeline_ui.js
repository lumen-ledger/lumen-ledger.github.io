/* Lumen & Ledger - UI for dinner_timeline.js (MIT). Labels come from window.DT_L set by the page. */
(function () {
  var T = window.DinnerTimeline, L = window.DT_L;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var tb = $('dishes-body');
  function row(d) {
    d = d || {}; var tr = document.createElement('tr'), o = '';
    for (var k in L.where) o += '<option value="' + k + '"' + (d.where === k ? ' selected' : '') + '>' + L.where[k] + '</option>';
    tr.innerHTML = '<td><input class="n" maxlength="60" value="' + esc(d.name || '') + '" aria-label="' + L.aria[0] + '"></td>' +
      '<td><select class="w" aria-label="' + L.aria[1] + '">' + o + '</select></td>' +
      '<td><input class="t" type="number" min="0" max="600" value="' + (d.temp == null ? '' : d.temp) + '" aria-label="' + L.aria[2] + '"></td>' +
      '<td><input class="c" type="number" min="0" max="2880" value="' + (d.cook == null ? '' : d.cook) + '" aria-label="' + L.aria[3] + '"></td>' +
      '<td><input class="r" type="number" min="0" max="2880" value="' + (d.rest || '') + '" aria-label="' + L.aria[4] + '"></td>' +
      '<td><button class="light del" style="margin:0" aria-label="' + L.aria[5] + '">&times;</button></td>';
    tr.querySelector('.del').addEventListener('click', function () { tb.removeChild(tr); });
    tb.appendChild(tr);
  }
  function num(v) { return v === '' ? null : Number(v); }
  function read() {
    return Array.prototype.map.call(tb.querySelectorAll('tr'), function (tr) {
      function g(c) { return tr.querySelector(c).value; }
      return { name: g('.n').trim(), where: g('.w'), temp: num(g('.t')), cook: num(g('.c')), rest: Number(g('.r')) || 0 };
    }).filter(function (d) { return d.name; });
  }
  function load(list) { tb.innerHTML = ''; list.forEach(row); if (!list.length) for (var i = 0; i < 4; i++) row(); }
  function exList() { return L.ex.map(function (e) { return { name: e[0], where: e[1], temp: e[2] === '' ? null : e[2], cook: e[3] === '' ? null : e[3], rest: e[4] }; }); }
  function nextDec25() { var n = new Date(), y = n.getMonth() === 11 && n.getDate() > 25 ? n.getFullYear() + 1 : n.getFullYear(); return y + '-12-25T' + L.defServe; }
  function hm(d) { return d.toLocaleTimeString(L.locale, { hour: 'numeric', minute: '2-digit' }); }
  function run() {
    var out = $('out'), v = $('serve').value;
    if (!v) { out.innerHTML = '<p class="err">' + L.noServe + '</p>'; return; }
    var serve = new Date(v), ds = read();
    if (isNaN(serve)) { out.innerHTML = '<p class="err">' + L.noServe + '</p>'; return; }
    var p = T.plan(ds, serve), bad = p.rows.filter(function (r) { return r.error; });
    if (bad.length) { out.innerHTML = '<p class="err">' + L.range + ' ' + esc(bad.map(function (r) { return r.name; }).join(', ')) + '</p>'; return; }
    if (!p.first) { out.innerHTML = '<p class="err">' + L.noTimed + '</p>'; return; }
    var h = '<h2>' + esc(serve.toLocaleDateString(L.locale, { weekday: 'long', month: 'long', day: 'numeric' })) + '</h2>';
    h += p.clashes ? '<p class="clash">' + L.clashSum.replace('%n', p.clashes) + '</p>' : '<p>' + L.noClash + '</p>';
    h += '<table class="tl"><tr><th>' + L.th[0] + '</th><th>' + L.th[1] + '</th></tr>';
    p.events.forEach(function (e) {
      var r = e.r, w;
      if (e.kind === 'serve') w = '<b>' + L.serve + '</b>';
      else if (e.kind === 'start') {
        w = L.start + ': <b>' + esc(r.name) + '</b> (' + L.where[r.where] + (r.where === 'oven' && r.temp != null ? ' ' + r.temp + ' &deg;' + L.unit : '') + ', ' + r.cook + ' min' + (r.rest ? ' + ' + r.rest + ' min ' + L.restWord : '') + ')';
        if (r.clashWith.length) w += ' <span class="clash">' + L.clash + ' ' + esc(r.clashWith.join(', ')) + '</span>';
      } else w = L.out + ' <b>' + esc(r.name) + '</b> (' + r.rest + ' min)';
      h += '<tr><td>' + hm(e.t) + '</td><td>' + w + '</td></tr>';
    });
    h += '</table>';
    if (p.ahead.length) h += '<p><b>' + L.ahead + ':</b> ' + esc(p.ahead.map(function (r) { return r.name; }).join(', ')) + '</p>';
    h += '<button id="print">' + L.print + '</button><button id="share" class="light">' + L.share + '</button>';
    out.innerHTML = h;
    var link = location.origin + location.pathname + '#' + T.encode(ds, v);
    if (window.history && history.replaceState) history.replaceState(null, '', link);
    $('print').addEventListener('click', function () { window.print(); });
    $('share').addEventListener('click', function () {
      var b = this; function ok() { b.textContent = L.copied; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok, function () { prompt('', link); }); else prompt('', link);
    });
  }
  $('add').addEventListener('click', function () { row(); });
  $('ex').addEventListener('click', function () { load(exList()); });
  $('clear').addEventListener('click', function () { load([]); $('out').innerHTML = ''; });
  $('go').addEventListener('click', run);
  var st = T.decode(location.hash);
  if (st && st.dishes.length) { $('serve').value = st.serve; load(st.dishes); run(); }
  else { $('serve').value = nextDec25(); load(exList()); }
})();
