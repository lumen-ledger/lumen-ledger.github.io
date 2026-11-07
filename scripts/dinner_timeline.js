/* Lumen & Ledger - holiday dinner backward timeline (MIT). Same rules as the Christmas Dinner Planner xlsx:
   start = serve - (cook + rest), done = serve - rest; an oven dish clashes with every other oven dish
   at a different temperature whose [start, done) window overlaps its own. Times come from YOUR recipes. */
(function (root) {
  function addMin(d, m) { return new Date(d.getTime() + m * 60000); }
  // dishes: [{name, where:'oven'|'stove'|'slow'|'ahead'|'other', temp, cook, rest}], serve: Date
  function plan(dishes, serve) {
    var rows = [];
    dishes.forEach(function (d, i) {
      if (!d || !String(d.name || '').trim()) return;
      var cook = Number(d.cook), rest = Number(d.rest) || 0;
      var timed = d.where !== 'ahead' && isFinite(cook) && cook > 0;
      if (rest < 0 || cook < 0 || cook > 2880 || rest > 2880) return rows.push({ i: i, name: d.name, error: 'range' });
      var r = { i: i, name: String(d.name).trim(), where: d.where, temp: d.temp === '' || d.temp == null ? null : Number(d.temp), cook: timed ? cook : null, rest: rest, clashWith: [] };
      if (timed) { r.start = addMin(serve, -(cook + rest)); r.done = addMin(serve, -rest); }
      rows.push(r);
    });
    var oven = rows.filter(function (r) { return r.where === 'oven' && r.start; });
    oven.forEach(function (a) {
      oven.forEach(function (b) {
        if (a !== b && a.temp !== b.temp && b.start < a.done && b.done > a.start) a.clashWith.push(b.name);
      });
    });
    var timed = rows.filter(function (r) { return r.start; });
    var events = [];
    timed.forEach(function (r) {
      events.push({ t: r.start, kind: 'start', r: r });
      if (r.rest > 0) events.push({ t: r.done, kind: 'done', r: r });
    });
    events.push({ t: serve, kind: 'serve' });
    events.sort(function (x, y) { return x.t - y.t || (x.kind === 'serve') - (y.kind === 'serve'); });
    var first = timed.length ? new Date(Math.min.apply(null, timed.map(function (r) { return r.start.getTime(); }))) : null;
    return { rows: rows, events: events, first: first, clashes: oven.filter(function (r) { return r.clashWith.length; }).length,
             ahead: rows.filter(function (r) { return !r.start && !r.error; }) };
  }
  // compact share format in the #hash: name~where~temp~cook~rest|... (no server involved)
  function encode(dishes, serveIso) {
    return 's=' + encodeURIComponent(serveIso) + '&d=' + encodeURIComponent(dishes.map(function (d) {
      return [d.name, d.where, d.temp == null ? '' : d.temp, d.cook == null ? '' : d.cook, d.rest || 0].map(function (v) { return String(v).replace(/[~|]/g, ' '); }).join('~');
    }).join('|'));
  }
  function decode(hash) {
    var q = {}; String(hash).replace(/^#/, '').split('&').forEach(function (kv) { var k = kv.split('='); if (k[0]) q[k[0]] = decodeURIComponent(k.slice(1).join('=')); });
    if (!q.d) return null;
    return { serve: q.s || '', dishes: q.d.split('|').map(function (s) { var f = s.split('~'); return { name: f[0], where: /^(oven|stove|slow|ahead|other)$/.test(f[1]) ? f[1] : 'other', temp: f[2] === '' ? null : Number(f[2]), cook: f[3] === '' ? null : Number(f[3]), rest: Number(f[4]) || 0 }; }) };
  }
  var api = { plan: plan, encode: encode, decode: decode, addMin: addMin };
  if (typeof module !== 'undefined') module.exports = api; else root.DinnerTimeline = api;
})(this);
