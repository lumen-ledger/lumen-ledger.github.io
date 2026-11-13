/* Ponti e ferie - Lumen & Ledger - MIT License
 * Festivita' nazionali italiane (L. 260/1949 art. 2 come modificata da L. 54/1977,
 * DPR 792/1985, L. 336/2000, L. 151/2025) + ottimizzazione esatta dei giorni di ferie.
 * Con opt.hols accetta qualsiasi elenco di festivita' (usato per i bank holidays UK).
 * Tutto nel browser, nessun dato inviato. Funziona anche in Node (module.exports). */
(function (root) {
  'use strict';
  var DAY = 86400000;
  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }
  // Pasqua (algoritmo anonimo gregoriano, Meeus/Jones/Butcher)
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return utc(y, month, day);
  }
  function holidays(y, patron) { // patron: "MM-DD" opzionale
    var list = [
      [utc(y, 1, 1), 'Capodanno'], [utc(y, 1, 6), 'Epifania'],
      [easter(y) + DAY, "Lunedì dell'Angelo (Pasquetta)"],
      [utc(y, 4, 25), 'Festa della Liberazione'], [utc(y, 5, 1), 'Festa del Lavoro'],
      [utc(y, 6, 2), 'Festa della Repubblica'], [utc(y, 8, 15), 'Ferragosto (Assunzione)'],
      [utc(y, 11, 1), 'Ognissanti'], [utc(y, 12, 8), 'Immacolata Concezione'],
      [utc(y, 12, 25), 'Natale'], [utc(y, 12, 26), 'Santo Stefano']
    ];
    if (y >= 2026) list.push([utc(y, 10, 4), "San Francesco d'Assisi"]);
    if (patron && /^\d{2}-\d{2}$/.test(patron)) {
      var p = patron.split('-');
      list.push([utc(y, +p[0], +p[1]), 'Santo patrono (tuo comune)']);
    }
    list.sort(function (a, b) { return a[0] - b[0]; });
    return list;
  }
  // Restituisce un array di giorni dell'anno: {t, dow, off, hol}
  function days(y, opt) {
    opt = opt || {};
    var sixDay = !!opt.sixDay, hol = {}, extra = opt.closed || [];
    // opt.hols: elenco [t, nome] alternativo (es. bank holidays UK) al posto delle festivita' italiane
    (opt.hols || holidays(y, opt.patron).concat(holidays(y + 1, opt.patron))).forEach(function (h) { hol[h[0]] = (hol[h[0]] ? hol[h[0]] + ' + ' : '') + h[1]; });
    extra.forEach(function (t) { if (!hol[t]) hol[t] = opt.closedLabel || 'Chiusura aziendale'; });
    var out = [], t = utc(y, 1, 1), end = utc(y + 1, 1, 7); // fino al 6 gennaio dell'anno dopo
    for (; t < end; t += DAY) {
      var dow = new Date(t).getUTCDay(); // 0 = domenica
      var weekend = dow === 0 || (!sixDay && dow === 6);
      out.push({ t: t, dow: dow, hol: hol[t] || '', off: weekend || !!hol[t], weekend: weekend });
    }
    return out;
  }
  // Blocchi candidati: [s,e] con s-1 ed e+1 lavorativi (o fuori anno), almeno 1 giorno di ferie dentro.
  function candidates(D, maxLen, minLen) {
    minLen = minLen || 1;
    var n = D.length, res = [], y = new Date(D[0].t).getUTCFullYear(), yEnd = utc(y + 1, 1, 1);
    for (var s = 0; s < n; s++) {
      if (D[s].t >= yEnd) break; // le pause devono iniziare nell'anno scelto
      if (s > 0 && D[s - 1].off) continue; // inizio massimale
      var cost = 0;
      for (var e = s; e < n && e - s + 1 <= maxLen; e++) {
        if (!D[e].off) cost++;
        if (e + 1 < n && D[e + 1].off) continue; // fine massimale
        if (cost >= 1 && e - s + 1 >= minLen) {
          var hol = 0;
          for (var j = s; j <= e; j++) if (D[j].hol && !D[j].weekend) hol++;
          res.push({ s: s, e: e, len: e - s + 1, cost: cost, hol: hol });
        }
      }
    }
    return res;
  }
  // Ottimo esatto: insieme di blocchi non adiacenti (separati da >=1 giorno lavorativo
  // non preso) che massimizza i giorni liberi totali con al massimo N giorni di ferie.
  // A parita' di giorni liberi preferisce meno ferie usate.
  function optimize(D, N, maxLen, minLen) {
    var C = candidates(D, maxLen, minLen);
    var n = D.length, NEG = -1e9, i, k;
    // best[i][k] = max giorni liberi usando blocchi che finiscono prima di i (indice giorno)
    var best = [], from = [];
    for (i = 0; i <= n + 1; i++) { best.push(new Array(N + 1).fill(NEG)); from.push(new Array(N + 1).fill(null)); }
    best[0][0] = 0;
    var byStart = {};
    C.forEach(function (c) { (byStart[c.s] = byStart[c.s] || []).push(c); });
    for (i = 0; i <= n; i++) {
      for (k = 0; k <= N; k++) {
        var v = best[i][k];
        if (v === NEG) continue;
        // salta il giorno i
        if (v > best[i + 1][k]) { best[i + 1][k] = v; from[i + 1][k] = { p: i, k: k, c: null }; }
        var list = byStart[i] || [];
        for (var j = 0; j < list.length; j++) {
          var c = list[j], k2 = k + c.cost, nx = c.e + 2; // e+1 e' lavorativo, lascia un giorno
          if (k2 > N) continue;
          if (nx > n + 1) nx = n + 1;
          var nv = v + c.len;
          if (nv > best[nx][k2]) { best[nx][k2] = nv; from[nx][k2] = { p: i, k: k, c: c }; }
        }
      }
    }
    // scegli il miglior k (massimo valore, poi meno ferie)
    var bk = 0, bv = 0;
    for (k = 0; k <= N; k++) if (best[n + 1][k] > bv) { bv = best[n + 1][k]; bk = k; }
    var blocks = [], ci = n + 1, ck = bk;
    while (ci > 0 && from[ci][ck]) {
      var f = from[ci][ck];
      if (f.c) blocks.unshift(f.c);
      ci = f.p; ck = f.k;
    }
    return { blocks: blocks, daysOff: bv, used: bk };
  }
  // Ponti singoli piu' efficienti (1-maxCost giorni di ferie), ordinati per data
  function bridges(D, maxCost, maxLen) {
    var keep = {}, out = [];
    candidates(D, maxLen || 16).forEach(function (c) {
      if (c.cost > maxCost || c.hol < 1 || c.len / c.cost < 2.5) return;
      var key = '';
      for (var j = c.s; j <= c.e; j++) if (D[j].hol && !D[j].weekend) { key = c.cost + ':' + j; break; }
      if (!keep[key] || c.len > keep[key][0].len) keep[key] = [c];
      else if (c.len === keep[key][0].len) keep[key].push(c);
    });
    Object.keys(keep).forEach(function (k) { out = out.concat(keep[k]); });
    return out.sort(function (a, b) { return a.s - b.s || a.cost - b.cost; });
  }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  var api = { easter: easter, holidays: holidays, days: days, candidates: candidates, optimize: optimize, bridges: bridges, iso: iso, utc: utc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PontiFerie = api;
})(this);
