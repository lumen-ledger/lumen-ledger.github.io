/* Lumen & Ledger - costo per ciclo dall'etichetta energetica UE (MIT).
   kWh per 100 cicli (etichetta) / 100 x prezzo per kWh; anno = cicli a settimana x 52. */
(function(root){
  function run(o){
    var k=Math.max(0,+o.kwh100||0)/100, p=Math.max(0,+o.rate||0), c=Math.max(0,+o.perWeek||0);
    var l=Math.max(0,+o.litres||0), w=Math.max(0,+o.water||0);
    var cyc=c*52, kwhY=k*cyc, eCyc=k*p, wCyc=l/1000*w;
    return {kwhCycle:k, energyCycle:eCyc, waterCycle:wCyc, cycle:eCyc+wCyc,
      cyclesYear:cyc, kwhYear:kwhY, energyYear:eCyc*cyc, waterYear:wCyc*cyc,
      year:(eCyc+wCyc)*cyc, month:(eCyc+wCyc)*cyc/12};
  }
  function compare(a,b,rate,perWeek){
    var ra=run({kwh100:a,rate:rate,perWeek:perWeek}), rb=run({kwh100:b,rate:rate,perWeek:perWeek});
    return {a:ra,b:rb,diffYear:ra.energyYear-rb.energyYear,diffKwhYear:ra.kwhYear-rb.kwhYear};
  }
  var api={run:run,compare:compare};
  if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.CostoCiclo=api;
})(this);
