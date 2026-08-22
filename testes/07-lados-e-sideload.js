const fs=require('fs'), path=require('path');
const RAIZ = require('path').join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ,D=FZ.Data,World=FZ.World,Inv=FZ.Inv,E=FZ.Entities;
const rodar=(s,p=1/60)=>{for(let i=0;i<s/p;i++) E.update(p);};
let f=0; const ok=(c,m)=>{console.log((c?'  OK  ':'  XX  ')+m); if(!c)f++;};
const LADO=['ESQUERDA','DIREITA'];

console.log('=== BUG 1: INSERIDOR SO PODE USAR UMA FAIXA ===');
// esteira em (5,5) indo para o LESTE. inseridor ao NORTE (= esquerda dela).
// ele deve por SEMPRE na faixa da DIREITA, e nunca na esquerda.
World.init('A',null);
const belt=World.criarEntidade('transport_belt',5,5,1);
const bau=World.criarEntidade('wooden_chest',5,3,0);
const ins=World.criarEntidade('inserter',5,4,2);   // aponta sul (para a esteira)
Inv.add(bau.inv.geral,'coal',60);
Inv.add(ins.inv.fuel,'coal',20);

// esteira sem saida: vai encher e o inseridor tem que travar numa faixa so
World.criarEntidade('wooden_chest',6,5,0);   // saida existe, mas vamos enche-lo
rodar(30);
console.log('  esquerda: '+belt.faixas[0].length+' | direita: '+belt.faixas[1].length);

World.init('A2',null);
const belt2=World.criarEntidade('transport_belt',5,5,1);   // sem saida: entope
const bau2=World.criarEntidade('wooden_chest',5,3,0);
const ins2=World.criarEntidade('inserter',5,4,2);
Inv.add(bau2.inv.geral,'coal',60);
Inv.add(ins2.inv.fuel,'coal',20);
rodar(40);
console.log('  esteira entupida -> esquerda: '+belt2.faixas[0].length+' | direita: '+belt2.faixas[1].length);
ok(belt2.faixas[0].length===0,'o inseridor NAO invadiu a faixa da esquerda');
ok(belt2.faixas[1].length===4,'encheu so a faixa da direita e parou');
ok(E.estado(ins2)==='Destino cheio','o inseridor espera: '+E.estado(ins2));

console.log('\n=== BUG 2: MINERADORA TAMBEM SO USA UMA FAIXA ===');
World.init('B',null);
let loc=null;
for(let y=-60;y<60 && !loc;y++) for(let x=-60;x<60 && !loc;x++){
  if(World.resAt(x,y)===D.RES.COAL && World.podeConstruir('burner_drill',x,y)
     && World.podeConstruir('transport_belt',x+2,y)) loc={x,y};
}
const dr=World.criarEntidade('burner_drill',loc.x,loc.y,1);
Inv.add(dr.inv.fuel,'coal',30);
const bd=World.criarEntidade('transport_belt',loc.x+2,loc.y,1);  // esteira sem saida
rodar(60);
console.log('  esquerda: '+bd.faixas[0].length+' | direita: '+bd.faixas[1].length);
ok(bd.faixas[0].length===0 || bd.faixas[1].length===0,'a mineradora usou UMA faixa so');
ok(E.itensNaEsteira(bd)===4,'encheu 4 (uma faixa) e parou, sem invadir a outra');

console.log('\n=== BUG 3: SIDE-LOAD — quem entra pela lateral cai na faixa daquele lado ===');
// esteira "de pe" indo para o NORTE em (5,5), alimentada por tras (5,6)
// e uma esteira "deitada" entrando pela DIREITA dela
World.init('C',null);
const vertical=World.criarEntidade('transport_belt',5,5,0);       // norte
World.criarEntidade('transport_belt',5,6,0);                      // entrada reta (atras)
// para uma esteira que vai ao norte, a DIREITA e o LESTE
const lateral=World.criarEntidade('transport_belt',6,5,3);        // em (6,5) apontando oeste -> entra em (5,5)
ok(E.temEntradaReta(vertical),'a vertical tem entrada reta atras dela');
ok(E.tileSaida(lateral).x===5 && E.tileSaida(lateral).y===5,'a lateral realmente aponta para a vertical');

// poe item nas DUAS faixas da lateral e ve onde caem
E.porNaEsteira(lateral,'iron_ore',E.ESQ);
E.porNaEsteira(lateral,'copper_ore',E.DIR);
rodar(2);
const naEsq=vertical.faixas[0].map(x=>x.item);
const naDir=vertical.faixas[1].map(x=>x.item);
console.log('  na vertical -> esquerda:',naEsq,'| direita:',naDir);
ok(naEsq.length===0,'nada foi para a faixa esquerda');
ok(naDir.length===2,'TUDO que veio pela direita caiu na faixa DIREITA, venha da faixa que vier');

console.log('\n=== side-load pelo outro lado ===');
World.init('C2',null);
const vert2=World.criarEntidade('transport_belt',5,5,0);
World.criarEntidade('transport_belt',5,6,0);
const lat2=World.criarEntidade('transport_belt',4,5,1);           // oeste da vertical, apontando leste
E.porNaEsteira(lat2,'iron_ore',E.ESQ);
E.porNaEsteira(lat2,'copper_ore',E.DIR);
rodar(2);
console.log('  esquerda:',vert2.faixas[0].length,'| direita:',vert2.faixas[1].length);
ok(vert2.faixas[0].length===2 && vert2.faixas[1].length===0,'quem entra pela esquerda cai toda na faixa esquerda');

console.log('\n=== CURVA: sem entrada reta, as faixas sao preservadas ===');
World.init('D',null);
const curva=World.criarEntidade('transport_belt',5,5,0);          // norte, SEM esteira atras
const entra=World.criarEntidade('transport_belt',6,5,3);          // entra pela direita
ok(!E.temEntradaReta(curva),'a esteira da curva nao tem entrada reta');
E.porNaEsteira(entra,'iron_ore',E.ESQ);
E.porNaEsteira(entra,'copper_ore',E.DIR);
rodar(2);
console.log('  esquerda:',curva.faixas[0].map(x=>x.item),'| direita:',curva.faixas[1].map(x=>x.item));
ok(curva.faixas[0].length===1 && curva.faixas[1].length===1,'na curva cada faixa continua na sua');

console.log('\n=== CURVA: a esteira sabe que deve se desenhar virada ===');
ok(E.formaDaEsteira(curva)===1,'curva vindo da direita (+1): '+E.formaDaEsteira(curva));
World.init('D2',null);
const curva2=World.criarEntidade('transport_belt',5,5,0);
World.criarEntidade('transport_belt',4,5,1);                      // entra pela esquerda
ok(E.formaDaEsteira(curva2)===-1,'curva vindo da esquerda (-1): '+E.formaDaEsteira(curva2));
World.init('D3',null);
const reta=World.criarEntidade('transport_belt',5,5,0);
World.criarEntidade('transport_belt',5,6,0);                      // entrada reta
ok(E.formaDaEsteira(reta)===0,'com entrada reta continua reta (0)');
World.init('D4',null);
const duas=World.criarEntidade('transport_belt',5,5,0);
World.criarEntidade('transport_belt',5,6,0);
World.criarEntidade('transport_belt',6,5,3);
ok(E.formaDaEsteira(duas)===0,'com duas entradas nao vira curva (fica reta + side-load)');

console.log('\n=== NADA QUEBROU: linha completa ===');
World.init('LINHA',null);
let l2=null;
for(let y=-60;y<60 && !l2;y++) for(let x=-60;x<60 && !l2;x++){
  if(World.resAt(x,y)===D.RES.IRON && World.podeConstruir('burner_drill',x,y)){
    let livre=true;
    for(let k=2;k<=9;k++) if(!World.podeConstruir('transport_belt',x+k,y)) livre=false;
    if(livre) l2={x,y};
  }
}
const d2=World.criarEntidade('burner_drill',l2.x,l2.y,1); Inv.add(d2.inv.fuel,'coal',20);
World.criarEntidade('transport_belt',l2.x+2,l2.y,1);
World.criarEntidade('transport_belt',l2.x+3,l2.y,1);
const i4=World.criarEntidade('inserter',l2.x+4,l2.y,1); Inv.add(i4.inv.fuel,'coal',20);
const fo=World.criarEntidade('stone_furnace',l2.x+5,l2.y,0); Inv.add(fo.inv.fuel,'coal',20);
const i5=World.criarEntidade('inserter',l2.x+7,l2.y,1); Inv.add(i5.inv.fuel,'coal',20);
World.criarEntidade('transport_belt',l2.x+8,l2.y,1);
const bauF=World.criarEntidade('wooden_chest',l2.x+9,l2.y,0);
rodar(60);
const placas=Inv.conta(bauF.inv.geral,'iron_plate');
console.log('  60s: '+placas+' placas');
ok(placas>0,'a linha automatica continua funcionando');

console.log('\n'+(f===0?'TUDO PASSOU':f+' FALHA(S)'));
process.exit(f?1:0);
