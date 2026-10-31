// Scenari 400 W vs 800 W per l'articolo it/fotovoltaico-balcone-400-o-800-w.
// Stesso modello del calcolatore IT e di balcone_scenari.js (PVGIS v5.3, autoconsumo prudente).
const {run}=require('./balcone_scenari.js');
const rows=[];
for(const base of[100,150,250,350])for(const [p,cost] of[[400,400],[800,700]])rows.push(['ringhiera Sud, Centro, base '+base+' W',p,cost,run({zone:'centro',mount:'s90',panelW:p,cost,base,shift:base===100?0:0.5})]);
for(const [p,cost] of[[400,400],[800,700]])rows.push(['staffe 30 gradi Sud, Centro, base 250 W',p,cost,run({zone:'centro',mount:'s30',panelW:p,cost})]);
for(const [p,cost] of[[400,400],[800,700]])rows.push(['ringhiera Est/Ovest, Nord, base 150 W',p,cost,run({zone:'nord',mount:'e90',panelW:p,cost,base:150})]);
for(const r of rows)console.log(r[0],'|',r[1]+' W',r[2]+' EUR','|',JSON.stringify(r[3]));
// Costo marginale dei secondi 400 W: +300 EUR, kWh in piu' autoconsumati
console.log('--- incremento 400->800 (300 EUR in piu)');
for(let i=0;i<rows.length;i+=2){const a=rows[i][3],b=rows[i+1][3];const d=b.save1-a.save1;console.log(rows[i][0],'| +kWh usati',b.used-a.used,'| +EUR/anno',d,'| rientro incremento ~',(300/d).toFixed(1),'anni (semplice) | netto20 diff',b.cum20-a.cum20)}
