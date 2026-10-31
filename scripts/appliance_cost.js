/* Lumen & Ledger - appliance running cost (MIT). kWh = W/1000 x hours x share of time on. */
(function (root) {
  function cost(watts, hours, dutyPct, rate) {
    var kw = Math.max(0, watts) / 1000, duty = Math.min(100, Math.max(0, dutyPct)) / 100;
    var kwh = kw * Math.max(0, hours) * duty;
    return { kwh: kwh, usd: kwh * Math.max(0, rate) };
  }
  function run(o) {
    var h = cost(o.watts, 1, o.duty, o.rate), d = cost(o.watts, o.hours, o.duty, o.rate);
    return { hour: h, day: d, month: { kwh: d.kwh * o.days, usd: d.usd * o.days }, btuh: o.watts * 3.412 };
  }
  var api = { cost: cost, run: run };
  if (typeof module !== 'undefined') module.exports = api; else root.ApplianceCost = api;
})(this);
