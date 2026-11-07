/* Lumen & Ledger - EV home charging cost (MIT).
   kWh = miles / 100 x kWh per 100 mi x (1 + extra loss %). MPGe -> kWh/100 mi = 3370.5 / MPGe
   (40 CFR 600.002: 1 gallon of gasoline = 33.705 kWh). */
(function (root) {
  var KWH_PER_GAL = 33.705;
  function mpgeToKwh100(mpge) { return mpge > 0 ? KWH_PER_GAL * 100 / mpge : 0; }
  function run(o) {
    var eff = Math.max(0, o.kwh100) * (1 + Math.max(0, o.lossPct || 0) / 100);
    var miles = Math.max(0, o.miles), rate = Math.max(0, o.rate);
    var kwh = miles / 100 * eff, usd = kwh * rate;
    var perMile = eff / 100 * rate;
    var gasPerMile = o.mpg > 0 ? Math.max(0, o.gasPrice) / o.mpg : 0;
    var gasMonth = gasPerMile * miles;
    return { kwh: kwh, usd: usd, year: usd * 12, perMile: perMile, per100: perMile * 100,
             gasPerMile: gasPerMile, gasMonth: gasMonth, saveMonth: gasMonth - usd, saveYear: (gasMonth - usd) * 12,
             breakEvenRate: eff > 0 && o.mpg > 0 ? gasPerMile * 100 / eff : 0 };
  }
  var api = { run: run, mpgeToKwh100: mpgeToKwh100, KWH_PER_GAL: KWH_PER_GAL };
  if (typeof module !== 'undefined') module.exports = api; else root.EvCharging = api;
})(this);
