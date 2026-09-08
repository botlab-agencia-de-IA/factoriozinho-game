/* ============================================================
   A matemática do jogo, medida rodando a simulação — nada de
   conta no papel. Imprime a tabela que está no MATEMATICA.md e
   reclama se alguém mexer numa velocidade sem querer.
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/rng.js','src/js/game/inventory.js',
                'src/js/game/world.js','src/js/game/entities.js','src/js/game/player.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const D=FZ.Data, World=FZ.World, Inv=FZ.Inv, E=FZ.Entities, C=D.CONFIG;
const rodar=s=>{for(let i=0;i<Math.round(s*60);i++) E.update(1/60);};

function livre(tipo, base){
  base=base||{x:0,y:0};
  for(let r=0;r<60;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    const x=base.x+dx, y=base.y+dy;
    if(World.podeConstruir(tipo,x,y) && !World.resAt(x,y)) return {x,y};
  }
}
function achar(res){
  for(let r=0;r<80;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    if(World.resAt(dx,dy)===res && World.podeConstruir('burner_drill',dx,dy)) return {x:dx,y:dy};
  }
}

const MIN=60;   // tudo por minuto

console.log('\n==================== O QUE CADA MÁQUINA FAZ HOJE ====================\n');

/* ---- mineradora ---- */
World.init('MAT1',null);
const jz=achar(D.RES.IRON);
const drill=World.criarEntidade('burner_drill',jz.x,jz.y,1);
const bau1=World.criarEntidade('wooden_chest',jz.x+2,jz.y,0);
Inv.add(drill.inv.fuel,'coal',100);
const fuel0=E.contarCombustivel(drill);
rodar(MIN);
const minerado=Inv.conta(bau1.inv.geral,'iron_ore')+Inv.conta(drill.inv.output,'iron_ore');
const carvaoDrill=fuel0-E.contarCombustivel(drill);
console.log('MINERADORA A CARVÃO');
console.log('  tira            ' + minerado + ' minério/min   (' + (minerado/60).toFixed(2) + '/s)');
console.log('  queima          ' + carvaoDrill + ' carvão/min');
console.log('  1 carvão rende  ' + (minerado/carvaoDrill).toFixed(1) + ' minérios\n');

/* ---- fornalha ---- */
World.init('MAT2',null);
const lf=livre('stone_furnace');
const forno=World.criarEntidade('stone_furnace',lf.x,lf.y,0);
Inv.add(forno.inv.fuel,'coal',100);
Inv.add(forno.inv.input,'iron_ore',100);
const f0=E.contarCombustivel(forno);
rodar(MIN);
const placas=Inv.conta(forno.inv.output,'iron_plate');
const carvaoForno=f0-E.contarCombustivel(forno);
const minerioGasto=100-Inv.conta(forno.inv.input,'iron_ore');
console.log('FORNALHA DE PEDRA');
console.log('  faz             ' + placas + ' placas/min   (uma a cada ' + (60/placas).toFixed(1) + ' s)');
console.log('  come            ' + minerioGasto + ' minério/min');
console.log('  queima          ' + carvaoForno + ' carvão/min');
console.log('  1 carvão rende  ' + (placas/carvaoForno).toFixed(1) + ' placas\n');

/* ---- esteira: vazão máxima ---- */
World.init('MAT3',null);
const le=livre('transport_belt');
const cinta=[];
for(let i=0;i<6;i++) cinta.push(World.criarEntidade('transport_belt',le.x+i,le.y,1));
const bauE=World.criarEntidade('wooden_chest',le.x+6,le.y,0);
let posto=0;
for(let i=0;i<MIN*60;i++){
  if(E.porNaEsteira(cinta[0],'iron_plate',0)) posto++;
  if(E.porNaEsteira(cinta[0],'iron_plate',1)) posto++;
  E.update(1/60);
}
const passou=Inv.conta(bauE.inv.geral,'iron_plate');
console.log('ESTEIRA (as duas faixas)');
console.log('  leva            ' + passou + ' itens/min   (' + (passou/60).toFixed(1) + '/s)');
console.log('  cabem           ' + (D.building('transport_belt').capacidade*2) + ' itens parados por tile\n');

/* ---- inseridor ---- */
World.init('MAT4',null);
const li=livre('wooden_chest');
const de=World.criarEntidade('wooden_chest',li.x,li.y,0);
const ins=World.criarEntidade('inserter',li.x+1,li.y,1);
const para=World.criarEntidade('wooden_chest',li.x+2,li.y,0);
Inv.add(de.inv.geral,'stone',1000);
Inv.add(ins.inv.fuel,'coal',100);
const i0=E.contarCombustivel(ins);
rodar(MIN);
const movidos=Inv.conta(para.inv.geral,'stone');
const carvaoIns=i0-E.contarCombustivel(ins);
console.log('INSERIDOR A CARVÃO');
console.log('  move            ' + movidos + ' itens/min   (' + (movidos/60).toFixed(2) + '/s)');
console.log('  queima          ' + carvaoIns + ' carvão/min   (1 carvão dura ' +
  (carvaoIns? (60/carvaoIns).toFixed(0) : '?') + ' s)\n');

/* ---- a linha completa que ele monta no jogo ---- */
World.init('MAT5',null);
const jz2=achar(D.RES.IRON);
const d2=World.criarEntidade('burner_drill',jz2.x,jz2.y,1);
// a linha corre na altura da saída da mineradora (canto de baixo da frente)
const ly=jz2.y+1;
const e1=World.criarEntidade('transport_belt',jz2.x+2,ly,1);
const e2=World.criarEntidade('transport_belt',jz2.x+3,ly,1);
const i1=World.criarEntidade('inserter',jz2.x+4,ly,1);
const fo=World.criarEntidade('stone_furnace',jz2.x+5,ly,1);
const i2=World.criarEntidade('inserter',jz2.x+7,ly,1);
const bf=World.criarEntidade('wooden_chest',jz2.x+8,ly,0);
Inv.add(d2.inv.fuel,'coal',200);
Inv.add(fo.inv.fuel,'coal',200);
Inv.add(i1.inv.fuel,'coal',50);
Inv.add(i2.inv.fuel,'coal',50);
rodar(MIN*2);
const linha=Inv.conta(bf.inv.geral,'iron_plate');
console.log('A LINHA INTEIRA (mineradora → esteira → inseridor → fornalha → inseridor → baú)');
console.log('  entrega         ' + (linha/2).toFixed(1) + ' placas/min');
console.log('  gargalo: a mineradora tira ' + (minerado) + '/min e a fornalha come ' + minerioGasto + '/min\n');

/* ---- proporções que saem disso ---- */
console.log('==================== AS PROPORÇÕES QUE ISSO DÁ ====================\n');
console.log('  1 mineradora dá para       ' + (minerado/minerioGasto).toFixed(2) + ' fornalhas');
console.log('  1 esteira cheia aguenta    ' + (passou/minerado).toFixed(0) + ' mineradoras');
console.log('  1 inseridor aguenta        ' + (movidos/minerado).toFixed(1) + ' mineradoras');
console.log('  para 1 fornalha rodando sem parar:');
console.log('     ' + (minerioGasto/minerado).toFixed(2) + ' mineradora de ferro');
console.log('     ' + ((carvaoForno + carvaoDrill*(minerioGasto/minerado))/minerado).toFixed(2) +
            ' mineradora de carvão (para ela e para a de ferro)');
console.log('');

/* --------- guarda contra mexida sem querer --------- */
let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};
const perto=(v,alvo,folga)=>Math.abs(v-alvo)<=folga;

console.log('============= OS NUMEROS CONTINUAM OS COMBINADOS =============');
console.log('');
ok(perto(minerado,30,2),'mineradora tira ~30 minerios/min (deu '+minerado+')');
ok(perto(placas,20,2),'fornalha faz ~20 placas/min (deu '+placas+')');
ok(perto(movidos,60,4),'inseridor move ~60 itens/min (deu '+movidos+')');
ok(passou>600,'esteira leva mais de 600 itens/min (deu '+passou+')');
ok(perto(carvaoForno,2,1),'fornalha queima ~2 carvoes/min (deu '+carvaoForno+')');
ok(perto(carvaoDrill,2,1),'mineradora queima ~2 carvoes/min (deu '+carvaoDrill+')');
ok(perto(minerado/minerioGasto,1.5,0.15),'1 mineradora a carvao alimenta ~1,5 fornalhas (deu '+
   (minerado/minerioGasto).toFixed(2)+')');
ok(perto(movidos/minerado,2,0.3),'1 inseridor da conta de ~2 mineradoras (deu '+
   (movidos/minerado).toFixed(1)+')');
ok(linha/2>15,'a linha inteira entrega mais de 15 placas/min (deu '+(linha/2).toFixed(1)+')');
ok(minerado>minerioGasto,'a mineradora tira mais rapido do que a fornalha come');

console.log('');
console.log('  (os alvos acima sao os do MATEMATICA.md, secao 1 — quando a');
console.log('   matematica mudar, e aqui e la que os numeros novos entram)');
console.log(falhas ? String(falhas)+' falha(s).' : 'Tudo certo.');
process.exit(falhas?1:0);
