/* Lumen & Ledger - costo del calore da pompa di calore aria-aria (condizionatore) - MIT */
(function(root){
  var KWH_PER_SMC=10.7; /* PCS ARERA 0,038520 GJ/Smc / 3,6 MJ/kWh */
  var HHE={media:1400,calda:1400,fredda:2100}; /* Reg. UE 206/2012 all. II tab. 4 */
  function run(o){
    var p=o.price,scop=o.scop,eff=(o.eff||86)/100,r={};
    r.heatCostPompa=p/scop;            /* EUR per kWh di calore */
    r.heatCostStufetta=p;
    r.gasBreakeven=p/scop*KWH_PER_SMC*eff; /* EUR/Smc sopra cui la pompa costa meno della caldaia */
    if(o.heatKw>0&&o.hours>0&&o.days>0){
      var heat=o.heatKw*o.hours*o.days;
      r.heat=heat; r.kwhPompa=heat/scop; r.costPompa=r.kwhPompa*p; r.costStufetta=heat*p;
      if(o.gas>0){r.smc=heat/(KWH_PER_SMC*eff); r.costCaldaia=r.smc*o.gas;}
    }
    if(o.qhe>0) r.labelYear=o.qhe*p;
    if(o.pdesign>0) r.labelHeat=o.pdesign*HHE[o.season||'media'];
    return r;
  }
  var api={run:run,KWH_PER_SMC:KWH_PER_SMC,HHE:HHE};
  if(typeof module!=='undefined')module.exports=api; else root.PompaCalore=api;
})(this);
