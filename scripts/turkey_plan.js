/* Lumen & Ledger - turkey thaw & roast planner (MIT). Tables: UGA Extension Circular 1226 (rev. 2026-09-15), based on USDA FSIS. */
(function (root) {
  var H = 60; // minutes per hour
  // Roasting at 325 F, fresh or thawed, unstuffed: [lo lb, hi lb, min minutes, max minutes]
  var ROAST = {
    whole: [[8, 12, 165, 180], [12, 14, 180, 225], [14, 18, 225, 255], [18, 20, 255, 270], [20, 24, 270, 300]],
    breast: [[4, 6, 90, 135], [6, 8, 135, 195]]
  };
  // Thawing: refrigerator at 40 F (days) and cold water changed every 30 min (hours)
  var FRIDGE = [[4, 12, 1, 3], [12, 16, 3, 4], [16, 20, 4, 5], [20, 24, 5, 6]];
  var WATER = [[4, 12, 2, 6], [12, 16, 6, 8], [16, 20, 8, 10], [20, 24, 10, 12]];
  var REST = 20; // minutes before carving
  // On a shared boundary (e.g. 12 lb) both rows apply: shortest min, longest max.
  function lookup(rows, w) {
    var lo = Infinity, hi = -Infinity;
    rows.forEach(function (r) { if (w >= r[0] && w <= r[1]) { lo = Math.min(lo, r[2]); hi = Math.max(hi, r[3]); } });
    return isFinite(lo) ? { min: lo, max: hi } : null;
  }
  function addMin(d, m) { return new Date(d.getTime() + m * 60000); }
  // o: {lb, cut:'whole'|'breast', serve:Date, thaw:'fridge'|'water'|'none'|'frozen'}
  function plan(o) {
    var rows = ROAST[o.cut] || ROAST.whole, roast = lookup(rows, o.lb);
    if (!roast) return { error: 'range', range: [rows[0][0], rows[rows.length - 1][1]] };
    var factor = o.thaw === 'frozen' ? 1.5 : 1; // cooking from frozen: at least 50% longer
    var rmin = Math.round(roast.min * factor), rmax = Math.round(roast.max * factor);
    var ovenOut = addMin(o.serve, -REST), ovenIn = addMin(ovenOut, -rmax);
    var p = { roastMin: rmin, roastMax: rmax, rest: REST, ovenIn: ovenIn, checkFrom: addMin(ovenIn, rmin), ovenOut: ovenOut, serve: o.serve, frozen: factor > 1 };
    if (o.thaw === 'fridge') {
      var f = lookup(FRIDGE, o.lb);
      p.thawDays = f; p.thawStart = addMin(ovenIn, -f.max * 24 * H);
    } else if (o.thaw === 'water') {
      var c = lookup(WATER, o.lb);
      p.thawHours = c; p.thawStart = addMin(ovenIn, -c.max * H);
    }
    return p;
  }
  var api = { plan: plan, lookup: lookup, ROAST: ROAST, FRIDGE: FRIDGE, WATER: WATER, REST: REST };
  if (typeof module !== 'undefined') module.exports = api; else root.TurkeyPlan = api;
})(this);
