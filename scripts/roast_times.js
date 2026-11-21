/* Roast times by weight. Data: Clemson Cooperative Extension HGIC 3565 "Holiday Meats - Not Just Turkey!"
   (revised Dec 16, 2019), which lists USDA FSIS "Roasting Those 'Other' Holiday Meats" (May 2011) as its source.
   Read 2026-11-21. Times are approximate, oven temperature in deg F, minutes per pound or minutes total. */
(function (root) {
  var CUTS = [
    // id, label, min lb, max lb, oven F, lo, hi, per ('lb' or 'total'), internal F
    ['rib-bone', 'Beef rib roast, bone-in (prime rib)', 4, 8, 325, 23, 30, 'lb', 145],
    ['rib-boneless', 'Beef rib roast, boneless', 4, 4, 325, 39, 43, 'lb', 145],
    ['eye-round', 'Beef eye round roast', 2, 3, 325, 20, 22, 'lb', 145],
    ['tender-whole', 'Beef tenderloin roast, whole', 4, 6, 425, 45, 60, 'total', 145],
    ['tender-half', 'Beef tenderloin roast, half', 2, 3, 425, 35, 45, 'total', 145],
    ['ham-cbe-whole', 'Ham, cook-before-eating, bone-in, whole', 14, 16, 325, 18, 20, 'lb', 145],
    ['ham-cbe-half', 'Ham, cook-before-eating, bone-in, half', 7, 8, 325, 22, 25, 'lb', 145],
    ['ham-fc-whole', 'Ham, fully cooked, bone-in, whole', 14, 16, 325, 15, 18, 'lb', 140],
    ['ham-fc-half', 'Ham, fully cooked, bone-in, half', 7, 8, 325, 18, 25, 'lb', 140],
    ['ham-fc-boneless', 'Ham, fully cooked, boneless', 3, 4, 325, 27, 33, 'lb', 140],
    ['pork-loin-bone', 'Pork loin roast, bone-in', 3, 5, 325, 20, 25, 'lb', 145],
    ['pork-loin-boneless', 'Pork loin roast, boneless', 2, 4, 325, 23, 33, 'lb', 145],
    ['pork-crown', 'Pork crown roast', 6, 10, 325, 20, 25, 'lb', 145],
    ['pork-tender', 'Pork tenderloin', 0.5, 1.5, 425, 20, 30, 'total', 145]
  ];
  var KG = 2.20462;
  function find(id) { for (var i = 0; i < CUTS.length; i++) if (CUTS[i][0] === id) return CUTS[i]; return null; }
  function fToC(f) { return Math.round((f - 32) * 5 / 9); }
  function ovenC(f) { return Math.round((f - 32) * 5 / 9 / 5) * 5; } // rounded to 5 for an oven dial
  // weight in lb; returns minutes range and a flag when the weight is outside the table row
  function roast(id, lb) {
    var c = find(id);
    if (!c || !(lb > 0)) return null;
    var lo = c[7] === 'lb' ? c[5] * lb : c[5], hi = c[7] === 'lb' ? c[6] * lb : c[6];
    return { id: id, label: c[1], oven: c[4], lo: Math.round(lo), hi: Math.round(hi), per: c[7],
      internal: c[8], minLb: c[2], maxLb: c[3], outside: lb < c[2] - 1e-9 || lb > c[3] + 1e-9 };
  }
  var api = { CUTS: CUTS, KG: KG, roast: roast, fToC: fToC, ovenC: ovenC };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RoastTimes = api;
  if (typeof document === 'undefined') return;
  function $(i) { return document.getElementById(i); }
  function fmt(m) { var h = Math.floor(m / 60), r = m % 60; return ((h ? h + ' h ' : '') + (r || !h ? r + ' min' : '')).trim(); }
  var sel = $('rt-cut'); if (!sel) return;
  // optional localisation: window.RT_L = {names:{id:label}, kg:true, s:{...}} (defaults = English page)
  var L = root.RT_L || {}, N = L.names || {}, S = L.s || {};
  function tx(k, d) { return S[k] != null ? S[k] : d; }
  function num(x) { var v = String(Math.round(x * 100) / 100); return L.comma ? v.replace('.', ',') : v; }
  function label(c) { return N[c[0]] || c[1]; }
  CUTS.forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = label(c); sel.appendChild(o); });
  var last = null;
  function calc() {
    var w = Number(String($('rt-w').value).replace(',', '.')), kg = $('rt-u').value === 'kg', lb = kg ? w * KG : w, r = roast(sel.value, lb), out = $('rt-out');
    last = null;
    if (!r) { out.innerHTML = '<p class="err">' + tx('noW', 'Enter the weight of the roast.') + '</p>'; return; }
    r.name = N[r.id] || r.label; last = r;
    var h;
    if (L.kg) {
      var k1 = function (x) { var v = String(Math.round(x / KG * 10) / 10); return L.comma ? v.replace('.', ',') : v; };
      var range = r.minLb === r.maxLb ? k1(r.minLb) : k1(r.minLb) + '&ndash;' + k1(r.maxLb);
      h = '<p><b>' + r.name + '</b>, ' + num(lb / KG) + ' kg: ' + tx('oven', 'oven') + ' ' + ovenC(r.oven) + ' &deg;C (' + r.oven + ' &deg;F), ' + tx('about', 'about') + ' <b>' + fmt(r.lo) + ' ' + tx('to', 'to') + ' ' + fmt(r.hi) + '</b>' +
        (r.per === 'total' ? tx('total', ' in total') : '') + '. ' + tx('done', 'Done at') + ' ' + fToC(r.internal) + ' &deg;C (' + r.internal + ' &deg;F) ' + tx('inside', 'inside') + (r.internal === 145 ? tx('rest', ', then rest at least 3 minutes') : '') + '.</p>';
      if (r.outside) h += '<p class="err">' + num(lb / KG) + ' kg ' + tx('outA', 'is outside the weights in the table for this cut') + ' (' + range + ' kg). ' + tx('outB', '') + '</p>';
      h += '<p>' + tx('chk1', 'Start checking with a thermometer at the short end') + ' (' + fmt(r.lo) + '). ' + tx('chk2', 'The planner uses the long end') + ' (' + fmt(r.hi) + ') ' + tx('chk3', '') + '</p>';
    } else {
      var oven = r.oven + ' &deg;F (about ' + ovenC(r.oven) + ' &deg;C)';
      h = '<p><b>' + r.label + '</b>, ' + (Math.round(lb * 100) / 100) + ' lb' + (kg ? ' (' + w + ' kg)' : '') + ': oven ' + oven +
        ', about <b>' + fmt(r.lo) + ' to ' + fmt(r.hi) + '</b>' + (r.per === 'total' ? ' in total (the table gives total minutes, not per pound)' : '') +
        '. Done at ' + r.internal + ' &deg;F (' + fToC(r.internal) + ' &deg;C) inside' + (r.internal === 145 ? ', then rest at least 3 minutes' : '') + '.</p>';
      if (r.outside) h += '<p class="err">' + (Math.round(lb * 100) / 100) + ' lb is outside the weights in the table for this cut (' + r.minLb + (r.maxLb !== r.minLb ? '&ndash;' + r.maxLb : '') + ' lb). The minutes above are a straight per-pound projection, not a published time: rely on the thermometer.</p>';
      h += '<p>Start checking with a thermometer at the short end (' + fmt(r.lo) + '). The planner uses the long end (' + fmt(r.hi) + ') so the roast is never late; if it is done early, it simply rests longer.</p>';
    }
    h += '<button id="rt-add" class="light">' + tx('add', 'Add to my timeline') + '</button>';
    out.innerHTML = h;
    $('rt-add').addEventListener('click', addToPlan);
  }
  function addToPlan() {
    if (!last) return;
    $('add').click();
    var rows = $('dishes-body').querySelectorAll('tr'), tr = rows[rows.length - 1];
    var unitC = $('unit') ? $('unit').value === 'C' : !!(root.DT_L && root.DT_L.unit === 'C');
    tr.querySelector('.n').value = last.name.slice(0, 60);
    tr.querySelector('.w').value = 'oven';
    tr.querySelector('.t').value = unitC ? ovenC(last.oven) : last.oven;
    tr.querySelector('.c').value = last.hi;
    tr.querySelector('.r').value = 3;
    $('rt-out').insertAdjacentHTML('beforeend', '<p>' + tx('addedA', 'Added to the plan above with') + ' ' + last.hi + ' ' + tx('addedB', 'cooking minutes and 3 rest minutes: change the rest if your recipe rests longer, then press "Make the timeline".') + '</p>');
    $('editor').scrollIntoView({ behavior: 'smooth' });
  }
  $('rt-go').addEventListener('click', calc);
})(typeof window !== 'undefined' ? window : this);
