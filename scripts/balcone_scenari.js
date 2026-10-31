// Replica del modello del calcolatore IT per gli scenari dell'articolo it/fotovoltaico-balcone-conviene.
// Rese e profili mensili: PVGIS v5.3 (JRC), SARAH3, perdite di sistema 14% gia' incluse, consultato 2026-10-31.
// Autoconsumo prudente: profilo mensile del montaggio + meta' giorni a 1,5x e meta' a 0,5x della media mensile.
const DEGR=0.005,HOURS=12,DETR_YEARS=10;
const ZONE={nord:1350,centro:1490,sud:1530,sardegna:1580};
const MOUNT={s30:1,h:.85,e30:.81,s90:.67,e90:.49,n90:.13};
const PROFILES={
  s30:[84.02,97.12,124.79,138.78,150.92,156.83,169.7,160.85,133.09,114.53,82.81,78.29],
  h:[46.85,64.8,100.05,126.97,152.18,164.7,174.76,152.07,111.38,81.65,50.21,41.14],
  e30:[48.06,63.4,97.12,120.22,142.11,153.49,160.98,142.0,106.32,79.72,49.26,42.06],
  s90:[91.77,92.17,94.9,80.92,66.79,58.8,65.14,81.68,92.19,101.58,85.63,88.76],
  e90:[34.02,41.11,60.7,71.12,80.12,85.94,90.33,83.7,64.3,51.06,31.82,29.47],
  n90:[6.84,9.23,15.31,20.25,28.42,31.99,27.32,20.15,15.1,11.83,7.88,6.26]};
const share=a=>{const t=a.reduce((x,y)=>x+y,0);return a.map(v=>v/t)};
function dayCurve(n){const w=[];let s=0;for(let i=0;i<n;i++){const v=Math.sin(Math.PI*(i+.5)/n);w.push(v);s+=v}return w.map(v=>v/s)}
function run(o){
  const {panelW=800,invW=panelW,cost=700,zone,mount,shade=10,base=250,shift=0.5,rate=0.27,esc=2,life=20,detr=0}=o;
  const c=dayCurve(48),dt=HOURS/48,load=base/1000+shift/HOURS,invKW=invW/1000;
  const yearKWh=panelW/1000*ZONE[zone]*MOUNT[mount]*(1-shade/100);
  let used=0,prod=0;
  share(PROFILES[mount]).forEach(m=>{const avg=yearKWh*m/30.4;for(const k of[1.5,0.5])for(const w of c){const p=Math.min(avg*k*w/dt,invKW);prod+=p*dt*15.2;used+=Math.min(p,load)*dt*15.2}});
  const sc=used/prod,yu=prod*sc,dy=cost*detr/100/DETR_YEARS;
  let cum=-cost,pay=null;
  for(let y=1;y<=life;y++){const s=yu*rate*Math.pow(1+esc/100,y-1)*Math.pow(1-DEGR,y-1),t=y<=DETR_YEARS?dy:0,pr=cum;cum+=s+t;if(pay===null&&cum>=0)pay=y-1+(-pr)/(s+t)}
  return {prod:Math.round(prod),self:Math.round(sc*100),used:Math.round(yu),save1:Math.round(yu*rate),detr1:Math.round(dy),pay:pay===null?'>'+life:pay.toFixed(1),cum20:Math.round(cum)};
}
const A={zone:'centro',mount:'s90'};
const S={
 'A Centro, ringhiera Sud, 800 W, 700 EUR, base 250 W':A,
 'B Nord, ringhiera Est/Ovest, 800 W, 700 EUR, base 150 W':{zone:'nord',mount:'e90',base:150},
 'C Sud, staffe Sud 30 gradi, 800 W, 600 EUR, base 300 W, shift 1, ombra 5%':{zone:'sud',mount:'s30',base:300,shift:1,cost:600,shade:5},
 'D come A con detrazione 50% in 10 anni':{...A,detr:50},
 'E Centro, ringhiera Sud, 400 W, 400 EUR':{...A,panelW:400,cost:400},
 'F come A, prezzo 0,22':{...A,rate:0.22},
 'G come A, base 100 W (casa vuota di giorno), shift 0':{...A,base:100,shift:0},
};
if(require.main===module)for(const k in S)console.log(k,JSON.stringify(run(S[k])));
module.exports={run,ZONE,MOUNT};
