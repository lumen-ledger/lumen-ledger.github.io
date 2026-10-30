// Scenari 400 W vs 800 W per l'articolo it/fotovoltaico-balcone-400-o-800-w.
// Stesso modello di balcone_scenari.js: autoconsumo prudente (stagioni + meteo).
const SYS_EFF=0.86,DEGR=0.005,HOURS=12;
const M=[4.5,6,8.5,9.5,11,11.5,12,11,9,7,5,4.5].map(v=>v/99.5);
function dayCurve(n){const w=[];let s=0;for(let i=0;i<n;i++){const v=Math.sin(Math.PI*(i+.5)/n);w.push(v);s+=v}return w.map(v=>v/s)}
function run(o){
  const {panelW,invW=panelW,cost,yld=1400,factor=.70,shade=10,base=250,shift=0.5,rate=0.27,esc=2,life=20}=o;
  const f=factor*(1-shade/100),c=dayCurve(48),dt=HOURS/48,load=base/1000+shift/HOURS;
  const yearKWh=panelW/1000*yld*f*SYS_EFF;let used=0,prod=0;
  M.forEach(m=>{const avg=yearKWh*m/30.4;for(const k of[1.5,0.5])for(const w of c){const p=Math.min(avg*k*w/dt,invW/1000);prod+=p*dt*15.2;used+=Math.min(p,load)*dt*15.2}});
  const sc=used/prod;let cum=-cost,pay=null;
  for(let y=1;y<=life;y++){const s=prod*sc*rate*Math.pow(1+esc/100,y-1)*Math.pow(1-DEGR,y-1),pr=cum;cum+=s;if(pay===null&&cum>=0)pay=y-1+(-pr)/s}
  return {prod:Math.round(prod),self:Math.round(sc*100),used:Math.round(prod*sc),save1:Math.round(prod*sc*rate),pay:pay===null?'>20':pay.toFixed(1),net20:Math.round(cum)};
}
const rows=[];
for(const base of[100,150,250,350])for(const [p,cost] of[[400,400],[800,700]])rows.push(['ringhiera Sud, Centro, base '+base+' W',p,cost,run({panelW:p,cost,base,shift:base===100?0:0.5})]);
for(const [p,cost] of[[400,400],[800,700]])rows.push(['staffe 30° Sud, Centro, base 250 W',p,cost,run({panelW:p,cost,factor:1,base:250})]);
for(const [p,cost] of[[400,400],[800,700]])rows.push(['ringhiera Est/Ovest, Nord, base 150 W',p,cost,run({panelW:p,cost,yld:1250,factor:.5,base:150})]);
for(const r of rows)console.log(r[0],'|',r[1]+' W',r[2]+' €','|',JSON.stringify(r[3]));
// Costo marginale dei secondi 400 W: +300 €, kWh in piu' autoconsumati
console.log('--- incremento 400->800 (300 € in piu)');
for(let i=0;i<rows.length;i+=2){const a=rows[i][3],b=rows[i+1][3];const d=b.save1-a.save1;console.log(rows[i][0],'| +kWh usati',b.used-a.used,'| +€/anno',d,'| rientro incremento ~',(300/d).toFixed(1),'anni (semplice) | netto20 diff',b.net20-a.net20)}
