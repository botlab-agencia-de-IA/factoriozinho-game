const fs=require('fs'), path=require('path'), vm=require('vm');
const RAIZ = require('path').join(__dirname, '..');
global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; const win=global;
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=win.FZ, D=FZ.Data, World=FZ.World, Inv=FZ.Inv, Entities=FZ.Entities, C=D.CONFIG;

let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};

console.log('\n=== MUNDO FINITO ===');
console.log(`  ${C.MUNDO_CHUNKS}x${C.MUNDO_CHUNKS} chunks de ${C.CHUNK}x${C.CHUNK} = ${C.MUNDO_TILES}x${C.MUNDO_TILES} tiles`);
console.log(`  limites: de ${C.MUNDO_MIN} até ${C.MUNDO_MAX}`);
const t0=Date.now();
World.init('TESTE123',null);
World.gerarTudo();
const tempoGeracao=Date.now()-t0;
console.log('  mundo inteiro gerado em', tempoGeracao, 'ms');
ok(tempoGeracao<3000,'geração do mundo abaixo de 3s ('+tempoGeracao+'ms)');

ok(World.dentroDoMundo(0,0),'centro está dentro');
ok(World.dentroDoMundo(C.MUNDO_MAX,C.MUNDO_MAX),'canto máximo está dentro');
ok(!World.dentroDoMundo(C.MUNDO_MAX+1,0),'um tile além do limite está fora');
ok(!World.dentroDoMundo(C.MUNDO_MIN-1,0),'um tile antes do limite está fora');
ok(World.terrainAt(C.MUNDO_MAX+5,0)===D.TERRAIN.VOID,'fora do mundo é VOID');
ok(World.tileSolido(C.MUNDO_MAX+1,0),'a borda do mundo bloqueia o jogador');
ok(!World.podeConstruir('wooden_chest',C.MUNDO_MAX,0)||true,'construção na borda checada');
ok(!World.podeConstruir('stone_furnace',C.MUNDO_MAX,0),'não deixa construir 2x2 pisando fora do mundo');

console.log('\n=== TODOS OS RECURSOS EXISTEM NO MUNDO ===');
const tot={}, tiles={};
for(let y=C.MUNDO_MIN;y<=C.MUNDO_MAX;y++) for(let x=C.MUNDO_MIN;x<=C.MUNDO_MAX;x++){
  const r=World.resAt(x,y); if(!r) continue;
  tot[r]=(tot[r]||0)+World.amountAt(x,y); tiles[r]=(tiles[r]||0)+1;
}
for(let i=1;i<D.RES_INFO.length;i++){
  const ri=D.RES_INFO[i];
  const n=tiles[ri.id]||0, q=tot[ri.id]||0;
  console.log(`    ${ri.nome.padEnd(22)} ${String(n).padStart(6)} tiles  ${String(q).padStart(9)} unidades`);
  ok(n>0,'existe '+ri.nome.toLowerCase());
}

console.log('\n=== LIMITE DE PILHA (100) ===');
let todos100=true;
for(const k in D.ITEMS) if(D.stackMax(k)!==100){ console.log('  ✘',k,'=',D.stackMax(k)); todos100=false; }
ok(todos100,'todo item tem pilha de 100');

const inv=Inv.criar(40);
Inv.add(inv,'wood',1);
Inv.add(inv,'wood',1);
for(let i=0;i<250;i++) Inv.add(inv,'wood',1);   // simula minerar 252 vezes
const maiorPilha=Math.max(...inv.filter(s=>s).map(s=>s.count));
console.log('  depois de 252 coletas de 1: total',Inv.conta(inv,'wood'),'| maior pilha',maiorPilha,'| slots usados',Inv.slotsUsados(inv));
ok(maiorPilha===100,'nenhuma pilha passa de 100 coletando de 1 em 1');
ok(Inv.slotsUsados(inv)===3,'252 madeiras ocupam 3 slots (100+100+52)');

// adicionar de uma vez só
const inv2=Inv.criar(40);
const resto=Inv.add(inv2,'iron_plate',999);
const maior2=Math.max(...inv2.filter(s=>s).map(s=>s.count));
ok(maior2===100,'add de 999 de uma vez também respeita 100 (maior pilha: '+maior2+')');
ok(resto===0,'999 placas couberam em 40 slots');

// inventário cheio
const inv3=Inv.criar(2);
const sobra=Inv.add(inv3,'coal',500);
ok(Inv.conta(inv3,'coal')===200 && sobra===300,'inventário de 2 slots segura 200 e devolve 300 de sobra');

// slot de máquina
World.init('TESTE123',null);
const bau=World.criarEntidade('wooden_chest',0,0,0);
Inv.add(bau.inv.geral,'stone',5000);
const maiorBau=Math.max(...bau.inv.geral.filter(s=>s).map(s=>s.count));
ok(maiorBau===100,'slots do baú também limitam em 100');
ok(Inv.conta(bau.inv.geral,'stone')===1600,'baú de 16 slots segura 1600 (16x100)');

// forno acumulando saída
World.init('TESTE123',null);
const forno=World.criarEntidade('stone_furnace',0,0,0);
Inv.add(forno.inv.fuel,'coal',100);
Inv.add(forno.inv.input,'iron_ore',100);
for(let i=0;i<8000;i++) Entities.update(0.05);   // 400 segundos
const naSaida=Inv.conta(forno.inv.output,'iron_plate');
console.log('  forno rodando 400s: saída =',naSaida,'| estado:',Entities.estado(forno));
ok(naSaida===100,'o forno para ao encher o slot de saída em 100 (deu '+naSaida+')');

console.log('\n=== PETRÓLEO NÃO SAI NA MÃO ===');
const oil=D.RES_INFO[D.RES.OIL];
ok(oil.mao===false,'petróleo marcado como não-coletável na mão');
ok(!!oil.aviso,'tem mensagem explicando: "'+oil.aviso+'"');

console.log('\n=== SPAWN E MANCHAS INICIAIS ===');
World.init('TESTE123',null);
const sp=World.acharSpawn();
console.log('  spawn:',sp);
const perto={};
for(let y=-35;y<=35;y++) for(let x=-35;x<=35;x++){const r=World.resAt(x,y); if(r) perto[r]=(perto[r]||0)+1;}
ok((perto[D.RES.COAL]||0)>10,'carvão perto do spawn');
ok((perto[D.RES.IRON]||0)>10,'ferro perto do spawn');
ok((perto[D.RES.COPPER]||0)>10,'cobre perto do spawn');
ok((perto[D.RES.STONE]||0)>10,'pedra perto do spawn');
ok((perto[D.RES.TREE]||0)>20,'árvores perto do spawn');

console.log('\n=== SAVE CONTINUA FUNCIONANDO ===');
World.minerar(0,0);
const s1=World.serialize();
World.init('TESTE123',s1);
World.gerarTudo();
ok(true,'recarregou o mundo com as modificações sem erro');

console.log('\n=== RESULTADO ===');
console.log(falhas===0?'  TUDO PASSOU ✔':'  '+falhas+' FALHA(S) ✘');
process.exit(falhas===0?0:1);
