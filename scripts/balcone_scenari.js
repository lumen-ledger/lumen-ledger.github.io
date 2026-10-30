// Replica del modello del calcolatore IT per gli scenari dell'articolo.
const SYS_EFF=0.86,DEGR=0.005,HOURS=12,DETR_YEARS=10;
function dayCurve(n){const w=[];let s=0;for(let i=0;i<n;i++){const v=Math.sin(Math.PI*(i+.5)/n);w.push(v);s+=v}return w.map(v=>v/s)}
function run(o){
  const {panelW=800,invW=800,cost=700,yld,factor,shade=10,base=250,shift=0.5,rate=0.27,esc=2,life=20,detr=0}=o;
  const f=factor*(1-shade/100),steps=48,c=dayCurve(steps),dt=HOURS/steps,load=base/1000+shift/HOURS;
  const daily=panelW/1000*yld/365*f*SYS_EFF;let used=0,prod=0;
  for(const w of c){const p=Math.min(daily*w/dt,invW/1000);prod+=p*dt;used+=Math.min(p,load)*dt}
  const yp=prod*365,sc=used/prod,yu=yp*sc,dy=cost*detr/100/DETR_YEARS;
  let cum=-cost,pay=null;
  for(let y=1;y<=life;y++){const s=yu*rate*Math.pow(1+esc/100,y-1)*Math.pow(1-DEGR,y-1),t=y<=DETR_YEARS?dy:0,pr=cum;cum+=s+t;if(pay===null&&cum>=0)pay=y-1+(-pr)/(s+t)}
  return {prod:Math.round(yp),self:Math.round(sc*100),save1:Math.round(yu*rate),pay:pay&&pay.toFixed(1),cum20:Math.round(cum)};
}
const S={
 'A Centro, ringhiera Sud, base 250W, 700€':{yld:1400,factor:.70},
 'B Nord, ringhiera Est/Ovest, base 150W, 700€':{yld:1250,factor:.50,base:150},
 'C Sud, staffe Sud 30°, base 300W, shift 1, 600€':{yld:1550,factor:1,base:300,shift:1,cost:600,shade:5},
 'D come A con 50% detrazione':{yld:1400,factor:.70,detr:50},
 'E Centro, ringhiera Sud, 400W, 400€':{yld:1400,factor:.70,panelW:400,invW:400,cost:400},
 'F come A, prezzo 0.22':{yld:1400,factor:.70,rate:0.22},
 'G come A, base 100W (casa vuota di giorno), shift 0':{yld:1400,factor:.70,base:100,shift:0},
};
for(const k in S)console.log(k,JSON.stringify(run(S[k])));
// Variante prudente: distribuzione mensile (Centro Italia, approssimata da profili PVGIS)
// e variabilita' meteo (meta' giorni a 1,5x, meta' a 0,5x della media mensile).
const M=[4.5,6,8.5,9.5,11,11.5,12,11,9,7,5,4.5].map(v=>v/99.5);
function selfSeasonal(o){
  const {panelW=800,invW=800,yld,factor,shade=10,base=250,shift=0.5}=o;
  const f=factor*(1-shade/100),c=dayCurve(48),dt=HOURS/48,load=base/1000+shift/HOURS;
  const yearKWh=panelW/1000*yld*f*SYS_EFF;let used=0,prod=0;
  M.forEach(m=>{const avg=yearKWh*m/30.4;for(const k of[1.5,0.5])for(const w of c){const p=Math.min(avg*k*w/dt,invW/1000);prod+=p*dt*15.2;used+=Math.min(p,load)*dt*15.2}});
  return Math.round(used/prod*100);
}
console.log('--- autoconsumo stagionale+meteo');
for(const k in S)console.log(k,selfSeasonal(S[k])+'%');
