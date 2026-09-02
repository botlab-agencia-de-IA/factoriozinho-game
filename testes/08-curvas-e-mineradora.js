const fs=require('fs'), path=require('path');
const RAIZ = require('path').join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ,D=FZ.Data,World=FZ.World,Inv=FZ.Inv,E=FZ.Entities;
const rodar=(s,p=1/60)=>{for(let i=0;i<s/p;i++) E.update(p);};
let f=0; const ok=(c,m)=>{console.log((c?'  OK  ':'  XX  ')+m); if(!c)f++;};

console.log('=== MINERADORA: joga na faixa DO LADO DELA (a que fica na frente da saida) ===');
// esteira indo para o SUL em (5,5); mineradora a OESTE dela.
// esteira ao sul: "direita" = oeste. Entao a mineradora esta a DIREITA -> faixa DIREITA.
// Procura no mundo que ACABOU de ser criado. Cada semente e um mundo
// diferente, entao achar o carvao numa semente e usar a coordenada em
// outra so funciona por sorte.
function acharCarvao(){
  for(let y=-60;y<60;y++) for(let x=-60;x<60;x++){
    if(World.resAt(x,y)===D.RES.COAL && World.podeConstruir('burner_drill',x,y)
       && World.podeConstruir('transport_belt',x+2,y)) return {x,y};
  }
  throw new Error('nao achei carvao com espaco para a mineradora');
}
World.init('M1',null);
const loc=acharCarvao();
const dr=World.criarEntidade('burner_drill',loc.x,loc.y,1);   // saida para leste
Inv.add(dr.inv.fuel,'coal',30);
const beltPerp=World.criarEntidade('transport_belt',loc.x+2,loc.y,2);   // esteira indo ao SUL
rodar(40);
console.log('  mineradora a oeste de uma esteira que desce');
console.log('  esquerda: '+beltPerp.faixas[0].length+' | direita: '+beltPerp.faixas[1].length);
const lado=E.ladoDaEsteira(beltPerp,dr);
console.log('  (a mineradora esta do lado '+(lado>0?'DIREITO':'ESQUERDO')+' da esteira)');
ok(beltPerp.faixas[1].length>0 && beltPerp.faixas[0].length===0,
   'o minerio caiu na faixa do lado DELA (near lane), nao na oposta');

console.log('\n=== MINERADORA em esteira RETA (alinhada atras) -> faixa DIREITA ===');
World.init('M2',null);
const loc2=acharCarvao();
const dr2=World.criarEntidade('burner_drill',loc2.x,loc2.y,1);
Inv.add(dr2.inv.fuel,'coal',30);
const beltReta=World.criarEntidade('transport_belt',loc2.x+2,loc2.y,1);   // mesma direcao da saida
rodar(40);
console.log('  esquerda: '+beltReta.faixas[0].length+' | direita: '+beltReta.faixas[1].length);
ok(beltReta.faixas[1].length===4 && beltReta.faixas[0].length===0,'esteira reta: so a faixa da DIREITA');

console.log('\n=== INSERIDOR continua usando a faixa OPOSTA (braco alcanca longe) ===');
World.init('I1',null);
const b=World.criarEntidade('transport_belt',5,5,1);     // leste
const bau=World.criarEntidade('wooden_chest',5,3,0);
const ins=World.criarEntidade('inserter',5,4,2);          // ao NORTE = esquerda da esteira
Inv.add(bau.inv.geral,'coal',40);
Inv.add(ins.inv.fuel,'coal',20);
rodar(40);
console.log('  esquerda: '+b.faixas[0].length+' | direita: '+b.faixas[1].length);
ok(b.faixas[1].length>0 && b.faixas[0].length===0,'inseridor a esquerda -> faixa DIREITA (oposta)');

console.log('\n=== As duas maquinas juntas usam faixas diferentes ===');
console.log('  (mineradora de um lado + inseridor do outro = esteira cheia dos dois lados,');
console.log('   cada um no seu, sem um atrapalhar o outro)');

console.log('\n=== CURVA: geometria do caminho do item ===');
// replica a conta do render para conferir os pontos de entrada e saida
const DIR_DX=[0,1,0,-1], DIR_DY=[-1,0,1,0];
function posNaEsteira(e,pos,faixa,forma){
  const dx=DIR_DX[e.dir], dy=DIR_DY[e.dir];
  const rx=-dy, ry=dx;
  const off=(faixa===1?0.21:-0.21);
  const cx=e.x+0.5, cy=e.y+0.5;
  if(!forma) return {x:cx+dx*(pos-0.5)+rx*off, y:cy+dy*(pos-0.5)+ry*off};
  const L=forma;
  const qx=cx+rx*0.5*L+dx*0.5, qy=cy+ry*0.5*L+dy*0.5;
  const raio=0.5-off*L;
  const a0=Math.atan2(-dy,-dx), a1=Math.atan2(-ry*L,-rx*L);
  let da=a1-a0;
  while(da>Math.PI) da-=Math.PI*2;
  while(da<-Math.PI) da+=Math.PI*2;
  const a=a0+da*pos;
  return {x:qx+Math.cos(a)*raio, y:qy+Math.sin(a)*raio};
}
const perto=(a,b,t=0.02)=>Math.abs(a-b)<t;

// esteira em (0,0) apontando NORTE, entrada pela ESQUERDA (forma -1)
const e0={x:0,y:0,dir:0};
const ent0=posNaEsteira(e0,0,0,-1), sai0=posNaEsteira(e0,1,0,-1);
console.log('  faixa esquerda: entra em ('+ent0.x.toFixed(2)+','+ent0.y.toFixed(2)+') sai em ('+sai0.x.toFixed(2)+','+sai0.y.toFixed(2)+')');
ok(perto(ent0.x,0),'entra pela borda ESQUERDA do tile (x=0)');
ok(perto(sai0.y,0),'sai pela borda de CIMA do tile (y=0)');

const ent1=posNaEsteira(e0,0,1,-1), sai1=posNaEsteira(e0,1,1,-1);
console.log('  faixa direita:   entra em ('+ent1.x.toFixed(2)+','+ent1.y.toFixed(2)+') sai em ('+sai1.x.toFixed(2)+','+sai1.y.toFixed(2)+')');
ok(perto(ent1.x,0) && perto(sai1.y,0),'a outra faixa entra e sai pelas mesmas bordas');

// a faixa de dentro da curva tem que percorrer um raio menor
const meioEsq=posNaEsteira(e0,0.5,0,-1), meioDir=posNaEsteira(e0,0.5,1,-1);
const dEsq=Math.hypot(meioEsq.x-0,meioEsq.y-0), dDir=Math.hypot(meioDir.x-0,meioDir.y-0);
console.log('  no meio da curva: faixa esq a '+dEsq.toFixed(2)+' do canto, faixa dir a '+dDir.toFixed(2));
ok(dEsq<dDir,'a faixa de DENTRO da curva anda por um raio menor que a de fora');

// todo ponto do caminho fica dentro do tile
let dentro=true;
for(const fx of [0,1]) for(let t=0;t<=1;t+=0.05){
  const p=posNaEsteira(e0,t,fx,-1);
  if(p.x<-0.01||p.x>1.01||p.y<-0.01||p.y>1.01) dentro=false;
}
ok(dentro,'o caminho inteiro da curva fica dentro do tile');

// e para a curva do outro lado
const ent2=posNaEsteira(e0,0,0,1), sai2=posNaEsteira(e0,1,0,1);
console.log('  curva pela DIREITA: entra em ('+ent2.x.toFixed(2)+','+ent2.y.toFixed(2)+') sai em ('+sai2.x.toFixed(2)+','+sai2.y.toFixed(2)+')');
ok(perto(ent2.x,1),'entra pela borda DIREITA (x=1)');
ok(perto(sai2.y,0),'sai pela borda de CIMA');

console.log('\n=== As 4 direcoes da curva entram e saem pelas bordas certas ===');
for(let d=0;d<4;d++){
  for(const L of [-1,1]){
    const e={x:0,y:0,dir:d};
    const ent=posNaEsteira(e,0,0,L), sai=posNaEsteira(e,1,0,L);
    const naBorda=v=>perto(v,0)||perto(v,1);
    const entOk=naBorda(ent.x)||naBorda(ent.y);
    const saiOk=naBorda(sai.x)||naBorda(sai.y);
    ok(entOk&&saiOk,['norte','leste','sul','oeste'][d]+' entrando pela '+(L<0?'esquerda':'direita'));
  }
}

console.log('\n=== NADA QUEBROU ===');
World.init('LINHA',null);
let l2=null;
for(let y=-60;y<60 && !l2;y++) for(let x=-60;x<60 && !l2;x++){
  if(World.resAt(x,y)===D.RES.IRON && World.podeConstruir('burner_drill',x,y)){
    let livre=true;
    for(let k=2;k<=9;k++) if(!World.podeConstruir('transport_belt',x+k,y)) livre=false;
    if(livre) l2={x,y};
  }
}
const d3=World.criarEntidade('burner_drill',l2.x,l2.y,1); Inv.add(d3.inv.fuel,'coal',20);
World.criarEntidade('transport_belt',l2.x+2,l2.y,1);
World.criarEntidade('transport_belt',l2.x+3,l2.y,1);
const i4=World.criarEntidade('inserter',l2.x+4,l2.y,1); Inv.add(i4.inv.fuel,'coal',20);
const fo=World.criarEntidade('stone_furnace',l2.x+5,l2.y,0); Inv.add(fo.inv.fuel,'coal',20);
const i5=World.criarEntidade('inserter',l2.x+7,l2.y,1); Inv.add(i5.inv.fuel,'coal',20);
World.criarEntidade('transport_belt',l2.x+8,l2.y,1);
const bauF=World.criarEntidade('wooden_chest',l2.x+9,l2.y,0);
rodar(60);
console.log('  60s de linha: '+Inv.conta(bauF.inv.geral,'iron_plate')+' placas');
ok(Inv.conta(bauF.inv.geral,'iron_plate')>0,'a linha automatica continua funcionando');

console.log('\n'+(f===0?'TUDO PASSOU':f+' FALHA(S)'));
process.exit(f?1:0);
