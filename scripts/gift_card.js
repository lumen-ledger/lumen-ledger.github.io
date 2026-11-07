// Lumen & Ledger - US gift card dates under 12 CFR 1005.20 (Regulation E). MIT.
// Dates are UTC midnight Date objects. No data leaves the browser.
(function (root) {
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d) ? null : d;
  }
  function addD(d, n) { return new Date(d.getTime() + n * 864e5); }
  // add years; 29 Feb -> 28 Feb (cautious: never later than the true anniversary)
  function addY(d, n) {
    var y = d.getUTCFullYear() + n, m = d.getUTCMonth(), day = d.getUTCDate();
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  }
  function later(a, b) { return !b ? a : (b > a ? b : a); }
  // type: 'cert' (gift certificate, fixed amount), 'store' (store gift card), 'gpr' (general-use prepaid), 'excluded'
  // issued: date sold/issued; loaded: last date funds were added (optional); activity: last purchase/load/spend (optional)
  // printed: expiration date printed on the card (optional)
  function compute(o) {
    if (o.type === 'excluded') return { covered: false };
    var base = o.issued;
    if (o.type !== 'cert' && o.loaded && o.loaded > base) base = o.loaded;
    var fiveY = addY(base, 5);
    var funds = later(fiveY, o.printed);
    var act = o.issued;
    if (o.loaded && o.loaded > act) act = o.loaded;
    if (o.activity && o.activity > act) act = o.activity;
    // fee allowed only if no activity in the one-year period ending on the fee date:
    // cautious earliest date = the day after the one-year anniversary of the last activity
    var fee = addD(addY(act, 1), 1);
    return {
      covered: true, base: base, fiveY: fiveY, funds: funds, lastActivity: act, feeFrom: fee,
      cardBeforeFunds: !!(o.printed && o.printed < funds)
    };
  }
  var api = { parse: parse, addD: addD, addY: addY, compute: compute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GiftCard = api;
})(this);
