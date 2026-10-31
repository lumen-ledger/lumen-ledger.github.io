// Calcolo ricevuta per prestazione di lavoro autonomo occasionale (Italia).
// Lumen & Ledger, licenza MIT. Usato dalla pagina /it/ricevuta-prestazione-occasionale/
// e testabile con Node.js: node ricevuta_occasionale.js
// Regole (verificate 2026-10-31, vedi fonti nella pagina):
// - ritenuta d'acconto 20% se il committente e' sostituto d'imposta (impresa, professionista, ente);
// - imposta di bollo 2,00 EUR se l'importo della ricevuta supera 77,47 EUR;
// - nessuna ritenuta se il committente e' un privato.
var RITENUTA = 0.20, BOLLO = 2.00, SOGLIA_BOLLO = 77.47, SOGLIA_INPS = 5000;

function r2(x) { return Math.round((x + 1e-9) * 100) / 100; }

// opt: {modo:'lordo'|'netto', importo, spese, sostituto:bool, bolloAddebitato:bool, giaRicevuti}
function calcolaRicevuta(opt) {
  var sost = !!opt.sostituto, aliq = sost ? RITENUTA : 0;
  var spese = r2(+opt.spese || 0), imp = +opt.importo || 0, compenso;
  if (opt.modo === 'netto') {
    // netto = (compenso + spese) * (1 - aliq)  ->  compenso = netto / (1 - aliq) - spese
    compenso = r2(imp / (1 - aliq) - spese);
  } else {
    compenso = r2(imp);
  }
  if (compenso < 0) compenso = 0;
  var lordo = r2(compenso + spese);
  var ritenuta = r2(lordo * aliq);
  var bollo = lordo > SOGLIA_BOLLO;
  var addebito = bollo && opt.bolloAddebitato ? BOLLO : 0;
  var netto = r2(lordo - ritenuta + addebito);
  var anno = r2((+opt.giaRicevuti || 0) + lordo);
  return { compenso: compenso, spese: spese, lordo: lordo, aliquota: aliq, ritenuta: ritenuta,
           bollo: bollo, addebitoBollo: addebito, netto: netto,
           totaleAnno: anno, oltreSogliaInps: anno > SOGLIA_INPS };
}

if (typeof module !== 'undefined' && require.main === module) {
  var casi = [
    ['lordo 500, impresa', { modo: 'lordo', importo: 500, sostituto: true }],
    ['netto 400, impresa', { modo: 'netto', importo: 400, sostituto: true }],
    ['lordo 500, privato', { modo: 'lordo', importo: 500, sostituto: false }],
    ['lordo 70, impresa (no bollo)', { modo: 'lordo', importo: 70, sostituto: true }],
    ['lordo 77,47 (no bollo, soglia esclusa)', { modo: 'lordo', importo: 77.47, sostituto: true }],
    ['lordo 1000 + spese 50, bollo addebitato, gia 4200', { modo: 'lordo', importo: 1000, spese: 50, sostituto: true, bolloAddebitato: true, giaRicevuti: 4200 }],
    ['netto 1000 con spese 100, impresa', { modo: 'netto', importo: 1000, spese: 100, sostituto: true }]
  ];
  casi.forEach(function (c) { console.log(c[0], JSON.stringify(calcolaRicevuta(c[1]))); });
}
if (typeof module !== 'undefined') module.exports = { calcolaRicevuta: calcolaRicevuta };
