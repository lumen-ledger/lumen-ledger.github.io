/* Lumen & Ledger - holiday / Christmas lights running cost (MIT).
   kWh = watts x hours / 1000. If only amps are known: watts <= amps x volts (upper bound). */
(function (root) {
  function run(o) {
    var w = 0;
    (o.sets || []).forEach(function (s) { w += Math.max(0, s.watts) * Math.max(0, s.count); });
    var h = Math.min(24, Math.max(0, o.hours)), d = Math.max(0, o.days), rate = Math.max(0, o.rate);
    var r = { watts: w, kwhDay: w * h / 1000 };
    r.kwh = r.kwhDay * d; r.perHour = w / 1000 * rate; r.perDay = r.kwhDay * rate; r.season = r.kwh * rate;
    return r;
  }
  function wattsFromAmps(amps, volts) { return Math.max(0, amps) * (volts || 120); }
  var api = { run: run, wattsFromAmps: wattsFromAmps };
  if (typeof module !== 'undefined') module.exports = api; else root.XmasLights = api;
})(this);
