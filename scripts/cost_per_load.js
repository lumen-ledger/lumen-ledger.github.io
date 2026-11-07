/* Lumen & Ledger - cost per load from the U.S. EnergyGuide label (MIT).
   Label kWh/year is stated by the FTC label as based on a fixed number of loads a week
   (clothes washers: 6, dishwashers: 4; 16 CFR 305.15(a)(10), 305.16(a)(9)).
   kWh per load = label kWh / (label loads a week x 52); your year = kWh per load x your loads a week x 52. */
(function(root){
  var BASIS={washer:6,dishwasher:4}, LABEL_RATE=0.14;
  function run(o){
    var b=BASIS[o.type]||+o.basis||4, k=Math.max(0,+o.labelKwh||0), p=Math.max(0,+o.rate||0), n=Math.max(0,+o.perWeek||0);
    var kLoad=k/(b*52), loadsY=n*52, kwhY=kLoad*loadsY;
    var g=Math.max(0,+o.labelGasUsd||0);
    return {basis:b, kwhLoad:kLoad, load:kLoad*p, loadsYear:loadsY, kwhYear:kwhY, year:kwhY*p, month:kwhY*p/12,
      labelCostAt14:k*LABEL_RATE, gasYear:g*n/b, gasLoad:b>0?g/(b*52):0};
  }
  function compare(type,a,b,rate,perWeek){
    var ra=run({type:type,labelKwh:a,rate:rate,perWeek:perWeek}), rb=run({type:type,labelKwh:b,rate:rate,perWeek:perWeek});
    var d=ra.year-rb.year;
    return {a:ra,b:rb,diffYear:d,diffKwhYear:ra.kwhYear-rb.kwhYear,diffTenYears:d*10};
  }
  var api={run:run,compare:compare,BASIS:BASIS,LABEL_RATE:LABEL_RATE};
  if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.CostPerLoad=api;
})(this);
