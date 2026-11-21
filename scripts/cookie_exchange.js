/* Cookie exchange calculator - Lumen & Ledger - MIT License */
(function (root) {
  'use strict';
  // Cookies one baker must bake.
  // p: {people, perPerson, keepOwn, tasting, bufferPct, yieldPerBatch}
  function calc(p) {
    var n = Math.max(2, Math.min(100, Math.floor(p.people) || 0));
    var c = Math.max(1, Math.min(60, Math.floor(p.perPerson) || 0));
    var sets = p.keepOwn ? n : n - 1;            // sets of c cookies to hand out (incl. your own if kept)
    var tasting = Math.max(0, Math.min(200, Math.floor(p.tasting) || 0));
    var buf = Math.max(0, Math.min(50, +p.bufferPct || 0));
    var base = sets * c + tasting;
    var total = Math.ceil(base * (1 + buf / 100) - 1e-9);
    var y = Math.max(1, Math.min(500, Math.floor(p.yieldPerBatch) || 0));
    var batches = Math.ceil(total / y - 1e-9);
    return {
      people: n, perPerson: c, sets: sets, tasting: tasting, bufferPct: buf,
      total: total, dozens: Math.round(total / 12 * 10) / 10,
      yieldPerBatch: y, batches: batches, multiplier: Math.round(total / y * 100) / 100,
      baked: batches * y, spare: batches * y - total,
      takeHome: n * c,                            // what each guest leaves with (one set from every baker incl. self)
      varieties: n, groupTotal: n * total
    };
  }
  // Duplicate cookie types in a sign-up list: [{baker, cookie}] -> {normalisedName: [indexes]}
  function norm(s) { return String(s || '').toLowerCase().replace(/cookies?\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function duplicates(rows) {
    var m = {}, out = {};
    rows.forEach(function (r, i) { var k = norm(r.cookie); if (k) (m[k] = m[k] || []).push(i); });
    Object.keys(m).forEach(function (k) { if (m[k].length > 1) out[k] = m[k]; });
    return out;
  }
  var api = { calc: calc, duplicates: duplicates, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CookieExchange = api;
})(this);
