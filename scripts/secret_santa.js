// Lumen & Ledger - Secret Santa draw with exclusions, private links. MIT.
// Everything runs in the browser: no server, no email, nothing stored.
(function (root) {
  function rnd(n, rng) {
    if (rng) return Math.floor(rng() * n);
    var c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
    if (!c) return Math.floor(Math.random() * n);
    var lim = Math.floor(4294967296 / n) * n, a = new Uint32Array(1);
    do { c.getRandomValues(a); } while (a[0] >= lim);
    return a[0] % n;
  }
  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) { var j = rnd(i + 1, rng), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  }
  function key(s) { return s.trim().toLowerCase(); }
  // "Anna, Ben" or "Anna - Ben" or "Anna & Ben" per line = these two never draw each other
  function parseNames(text) {
    var seen = {}, out = [], dup = [];
    String(text || '').split(/\r?\n/).forEach(function (l) {
      var n = l.trim().replace(/\s+/g, ' ');
      if (!n) return;
      if (seen[key(n)]) { dup.push(n); return; }
      seen[key(n)] = 1; out.push(n);
    });
    return { names: out, dup: dup };
  }
  function parsePairs(text, names) {
    var idx = {}, pairs = [], unknown = [];
    names.forEach(function (n, i) { idx[key(n)] = i; });
    String(text || '').split(/\r?\n/).forEach(function (l) {
      if (!l.trim()) return;
      var p = l.split(/\s*(?:,|;|&|\+|\s-\s|\/)\s*/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (p.length < 2) { unknown.push(l.trim()); return; }
      var ids = [];
      for (var k = 0; k < p.length; k++) {
        if (!(key(p[k]) in idx)) { unknown.push(p[k]); return; }
        ids.push(idx[key(p[k])]);
      }
      // a group line ("A, B, C") excludes every pair inside the group
      for (var a = 0; a < ids.length; a++) for (var b = a + 1; b < ids.length; b++) pairs.push([ids[a], ids[b]]);
    });
    return { pairs: pairs, unknown: unknown };
  }
  // Optional gift hints: one line per person, "Name: hint" (also "Name - hint"). Max 150 characters each.
  function parseHints(text, names) {
    var idx = {}, hints = {}, unknown = [], dup = [];
    names.forEach(function (n, i) { idx[key(n)] = i; });
    String(text || '').split(/\r?\n/).forEach(function (l) {
      if (!l.trim()) return;
      var m = /^\s*([^:]+?)\s*(?::|\s-\s)\s*(.*)$/.exec(l);
      if (!m || !m[2].trim()) { unknown.push(l.trim()); return; }
      var n = m[1].replace(/\s+/g, ' ');
      if (!(key(n) in idx)) { unknown.push(n); return; }
      var i = idx[key(n)];
      if (i in hints) dup.push(n);
      hints[i] = m[2].trim().replace(/\s+/g, ' ').slice(0, 150);
    });
    return { hints: hints, unknown: unknown, dup: dup };
  }
  // Last year's draw: one line per giver, "Anna > Ben" (also "->", "=>" or the arrow sign) = Anna does not draw Ben again.
  // One-way: Ben may still draw Anna.
  function parseOneWay(text, names) {
    var idx = {}, pairs = [], unknown = [];
    names.forEach(function (n, i) { idx[key(n)] = i; });
    String(text || '').split(/\r?\n/).forEach(function (l) {
      if (!l.trim()) return;
      var p = l.split(/\s*(?:->|=>|\u2192|>)\s*/).map(function (s) { return s.trim().replace(/\s+/g, ' '); });
      if (p.length !== 2 || !p[0] || !p[1]) { unknown.push(l.trim()); return; }
      for (var k = 0; k < 2; k++) if (!(key(p[k]) in idx)) { unknown.push(p[k]); return; }
      var g = idx[key(p[0])], r = idx[key(p[1])];
      if (g !== r) pairs.push([g, r]);
    });
    return { pairs: pairs, unknown: unknown };
  }
  // returns array giver index -> receiver index, or null if impossible
  // opts.noSwap: avoid A->B together with B->A (ignored when n < 3)
  // opts.oneWay: [[giver, receiver], ...] banned in that direction only
  function draw(n, pairs, opts, rng) {
    opts = opts || {};
    if (n < 2) return null;
    var ban = [];
    for (var i = 0; i < n; i++) { ban.push({}); ban[i][i] = 1; }
    (pairs || []).forEach(function (p) { ban[p[0]][p[1]] = 1; ban[p[1]][p[0]] = 1; });
    (opts.oneWay || []).forEach(function (p) { ban[p[0]][p[1]] = 1; });
    var noSwap = !!opts.noSwap && n >= 3;
    var res = new Array(n), used = {}, steps = 0, LIMIT = 200000;
    var order = shuffle(range(n), rng);
    var cand = order.map(function (g) { return shuffle(range(n), rng).filter(function (r) { return !ban[g][r]; }); });
    // most constrained givers first (fewer options)
    var idx = range(n).sort(function (a, b) { return cand[a].length - cand[b].length; });
    function go(k) {
      if (++steps > LIMIT) return false;
      if (k === n) return true;
      var gi = idx[k], g = order[gi], c = cand[gi];
      for (var j = 0; j < c.length; j++) {
        var r = c[j];
        if (used[r]) continue;
        if (noSwap && res[r] === g) continue;
        used[r] = 1; res[g] = r;
        if (go(k + 1)) return true;
        used[r] = 0; res[g] = undefined;
      }
      return false;
    }
    return go(0) ? res : null;
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
  // Encoded (not encrypted): hides the name from a casual glance at the link.
  var K = 'lumen-ledger';
  function b64(s) {
    if (typeof btoa !== 'undefined') return btoa(s);
    return Buffer.from(s, 'binary').toString('base64');
  }
  function unb64(s) {
    if (typeof atob !== 'undefined') return atob(s);
    return Buffer.from(s, 'base64').toString('binary');
  }
  function utf8(s) { return unescape(encodeURIComponent(s)); }
  function deutf8(s) { return decodeURIComponent(escape(s)); }
  function encode(obj) {
    var s = utf8(JSON.stringify(obj)), o = '';
    for (var i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ K.charCodeAt(i % K.length));
    return b64(o).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(t) {
    try {
      var s = String(t).replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      var x = unb64(s), o = '';
      for (var i = 0; i < x.length; i++) o += String.fromCharCode(x.charCodeAt(i) ^ K.charCodeAt(i % K.length));
      return JSON.parse(deutf8(o));
    } catch (e) { return null; }
  }
  var api = { parseNames: parseNames, parsePairs: parsePairs, parseHints: parseHints, parseOneWay: parseOneWay, draw: draw, encode: encode, decode: decode, shuffle: shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SecretSanta = api;
})(this);
