// Lumen & Ledger - debt snowball vs avalanche simulator. MIT. No data leaves the browser.
// Model: each month interest = balance * APR/12 (rounded to cents), minimums paid first,
// then the whole remaining budget goes to the target debt in the chosen order.
// Freed-up minimums roll over automatically because the monthly budget stays the same.
(function (root) {
  function r2(x) { return Math.round(x * 100) / 100; }
  function order(debts, method) {
    var idx = debts.map(function (d, i) { return i; });
    idx.sort(function (a, b) {
      var A = debts[a], B = debts[b];
      if (method === 'avalanche') { if (B.apr !== A.apr) return B.apr - A.apr; return A.bal - B.bal; }
      if (A.bal !== B.bal) return A.bal - B.bal; return B.apr - A.apr;
    });
    return idx;
  }
  // debts: [{name, bal, apr (percent), min}], extra: monthly amount on top of all minimums
  function run(debts, extra, method, maxMonths) {
    maxMonths = maxMonths || 600;
    var ord = order(debts, method);
    var bal = debts.map(function (d) { return d.bal; });
    var budget = debts.reduce(function (s, d) { return s + d.min; }, 0) + extra;
    var interest = 0, m = 0, closed = debts.map(function () { return 0; });
    var left = function () { return bal.reduce(function (s, b) { return s + b; }, 0); };
    while (left() > 0.005) {
      if (m >= maxMonths) return { ok: false, months: m, interest: r2(interest), closed: closed, order: ord, budget: budget };
      m++;
      var due = bal.map(function (b, i) { return r2(b * (1 + debts[i].apr / 1200)); });
      due.forEach(function (d, i) { interest += d - bal[i]; });
      var mins = due.map(function (d, i) { return Math.min(debts[i].min, d); });
      var pool = budget - mins.reduce(function (s, x) { return s + x; }, 0);
      ord.forEach(function (i) {
        var x = Math.max(0, Math.min(due[i] - mins[i], pool)); pool -= x;
        bal[i] = r2(due[i] - mins[i] - x);
        if (bal[i] < 0.005 && !closed[i]) closed[i] = m;
      });
    }
    return { ok: true, months: m, interest: r2(interest), closed: closed, order: ord, budget: budget, paid: r2(debts.reduce(function (s, d) { return s + d.bal; }, 0) + interest) };
  }
  var api = { run: run, order: order };
  if (typeof module !== 'undefined') module.exports = api; else root.DebtPayoff = api;
})(this);
