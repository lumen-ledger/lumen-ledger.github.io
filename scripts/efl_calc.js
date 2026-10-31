// Lumen & Ledger - EFL plan cost model (MIT). Runs in browser and in node.
// plan: {energy: cents/kWh, base: $/month, tduFixed: $/month, tduRate: cents/kWh,
//        credit: $, creditMin: kWh, creditMax: kWh (0 = no cap), minFee: $, minFeeBelow: kWh}
function eflMonthCost(p, kwh) {
  var c = (p.base || 0) + (p.tduFixed || 0) + kwh * ((p.energy || 0) + (p.tduRate || 0)) / 100;
  if (p.credit > 0 && kwh >= (p.creditMin || 0) && (!(p.creditMax > 0) || kwh <= p.creditMax)) c -= p.credit;
  if (p.minFee > 0 && kwh < (p.minFeeBelow || 0)) c += p.minFee;
  return c;
}
function eflAvgCents(p, kwh) { return kwh > 0 ? eflMonthCost(p, kwh) / kwh * 100 : 0; }
function eflYear(p, months) {
  var cost = 0, kwh = 0;
  months.forEach(function (m) { cost += eflMonthCost(p, m); kwh += m; });
  return { cost: cost, kwh: kwh, avgCents: kwh > 0 ? cost / kwh * 100 : 0 };
}
if (typeof module !== 'undefined') module.exports = { eflMonthCost: eflMonthCost, eflAvgCents: eflAvgCents, eflYear: eflYear };
