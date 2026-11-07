/* Lumen & Ledger - heat pump vs space heater vs gas furnace, cost per therm of heat (MIT).
   HSPF/HSPF2 = seasonal Btu of heat per Wh of electricity (10 CFR 430 subpart B, app. M 1.2), so
   seasonal COP = HSPF2 / 3.412. 1 therm = 100,000 Btu; 1 kWh = 3,412 Btu; 1 cf gas = btuCf Btu (EIA). */
(function (root) {
  var KWH_THERM = 100000 / 3412;
  function run(o) {
    var rate = Math.max(0, o.rate), hspf = Math.max(0.1, o.hspf2);
    var afue = Math.min(100, Math.max(1, o.afue)) / 100;
    var gasTherm = Math.max(0, o.gasPerTherm); /* fuel price, $ per therm of gas bought */
    var r = { cop: hspf / 3.412 };
    r.resist = KWH_THERM * rate;            /* $ per therm of heat, electric resistance */
    r.hp = r.resist / r.cop;                /* $ per therm of heat, heat pump at rated HSPF2 */
    r.gas = gasTherm / afue;                /* $ per therm of heat, gas furnace */
    r.breakevenGas = r.hp * afue;           /* gas $/therm bought at which furnace = heat pump */
    r.breakevenHspf = gasTherm > 0 ? 3.412 * r.resist / r.gas : 0; /* HSPF2 at which heat pump = furnace */
    if (o.thermsUsed > 0) {                 /* gas therms bought last winter -> heat delivered */
      var heat = o.thermsUsed * afue;
      r.heat = heat; r.kwhHp = heat * KWH_THERM / r.cop;
      r.yearGas = heat * r.gas; r.yearHp = heat * r.hp; r.yearResist = heat * r.resist;
    }
    return r;
  }
  var api = { run: run, KWH_THERM: KWH_THERM };
  if (typeof module !== 'undefined') module.exports = api; else root.HeatPump = api;
})(this);
