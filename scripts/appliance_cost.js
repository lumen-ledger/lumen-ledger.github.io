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
  /* Cost of 100,000 Btu (1 therm) of heat delivered into the home.
     Electric resistance: 100% of 3,412 Btu/kWh. Gas: $/Mcf, 1 cf = btuCf Btu, times AFUE. */
  function heat(rate, gasMcf, afuePct, btuCf) {
    var kwhTherm = 100000 / 3412, therms = (btuCf || 1036) * 1000 / 100000;
    var elec = kwhTherm * Math.max(0, rate);
    var afue = Math.min(100, Math.max(1, afuePct)) / 100;
    var gas = Math.max(0, gasMcf) / therms / afue;
    return { elec: elec, gas: gas, ratio: gas > 0 ? elec / gas : 0 };
  }
  var api = { cost: cost, run: run, heat: heat };
  if (typeof module !== 'undefined') module.exports = api; else root.ApplianceCost = api;
})(this);
