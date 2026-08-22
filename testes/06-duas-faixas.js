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

console.log('=== FAIXA OPOSTA: o inseridor poe no lado contrario ao dele ===');
console.log('(esteira indo para o LESTE — quem olha na direcao do movimento tem o SUL a sua direita)\n');

// esteira em (5,5) indo para leste
World.init('F',null);
const belt=World.criarEntidade('transport_belt',5,5,1);   // dir 1 = leste

// inseridor ao NORTE da esteira (acima) -> esta a ESQUERDA dela -> poe na DIREITA
const insN=World.criarEntidade('inserter',5,4,2);         // aponta sul, empurra pra esteira
const fN=E.faixaOposta(belt,insN);
console.log('  inseridor ao NORTE (esquerda da esteira) -> faixa '+LADO[fN]);
ok(fN===E.DIR,'quem esta a esquerda poe na faixa da DIREITA');

// inseridor ao SUL da esteira (abaixo) -> esta a DIREITA dela -> poe na ESQUERDA
const insS=World.criarEntidade('inserter',5,6,0);
const fS=E.faixaOposta(belt,insS);
console.log('  inseridor ao SUL (direita da esteira) -> faixa '+LADO[fS]);
ok(fS===E.ESQ,'quem esta a direita poe na faixa da ESQUERDA');
ok(fN!==fS,'os dois lados caem em faixas diferentes');

console.log('\n=== A MESMA REGRA VALE PARA AS 4 DIRECOES DA ESTEIRA ===');
for(let d=0;d<4;d++){
  World.init('F'+d,null);
  const b2=World.criarEntidade('transport_belt',5,5,d);
  const dx=[0,1,0,-1][d], dy=[-1,0,1,0][d];
  const rx=-dy, ry=dx;                       // tile a DIREITA da esteira
  const dir_={x:5+rx,y:5+ry,w:1,h:1};
  const esq_={x:5-rx,y:5-ry,w:1,h:1};
  const a=E.faixaOposta(b2,dir_), c=E.faixaOposta(b2,esq_);
  ok(a===E.ESQ && c===E.DIR,
     ['norte','leste','sul','oeste'][d]+': da direita cai na esquerda e vice-versa');
}

console.log('\n=== AS DUAS FAIXAS ANDAM SOZINHAS, SEM SE MISTURAR ===');
World.init('G',null);
const b3=World.criarEntidade('transport_belt',0,0,1);
E.porNaEsteira(b3,'iron_ore',E.ESQ);
E.porNaEsteira(b3,'copper_ore',E.DIR);
rodar(0.2);
ok(b3.faixas[E.ESQ][0].item==='iron_ore','ferro continua na faixa esquerda');
ok(b3.faixas[E.DIR][0].item==='copper_ore','cobre continua na faixa direita');
ok(E.itensNaEsteira(b3)===2,'a esteira conta os itens das duas faixas');

console.log('\n=== CAPACIDADE DOBROU: 4 por faixa = 8 por tile ===');
World.init('H',null);
const b4=World.criarEntidade('transport_belt',0,0,1);
for(let i=0;i<40;i++){ E.porNaEsteira(b4,'coal',E.ESQ); E.porNaEsteira(b4,'stone',E.DIR); rodar(0.13); }
console.log('  esquerda: '+b4.faixas[E.ESQ].length+' | direita: '+b4.faixas[E.DIR].length);
ok(b4.faixas[E.ESQ].length===4 && b4.faixas[E.DIR].length===4,'4 em cada faixa');
ok(E.itensNaEsteira(b4)===8,'8 itens no tile inteiro');
ok(!E.porNaEsteira(b4,'coal',E.ESQ),'faixa esquerda cheia recusa');

console.log('\n=== A FAIXA SE MANTEM DE UMA ESTEIRA PARA A OUTRA ===');
World.init('I',null);
const linha=[];
for(let x=0;x<6;x++) linha.push(World.criarEntidade('transport_belt',x,0,1));
E.porNaEsteira(linha[0],'gold_ore',E.DIR);
rodar(1.2);
let achou=null;
for(const b of linha){ if(b.faixas[E.DIR].length) achou='direita'; if(b.faixas[E.ESQ].length) achou='esquerda'; }
console.log('  o ouro esta na faixa:',achou);
ok(achou==='direita','o item nao troca de faixa ao passar para a proxima esteira');

console.log('\n=== INSERIDOR TIRA DAS DUAS FAIXAS ===');
World.init('J',null);
const b5=World.criarEntidade('transport_belt',0,0,1);
const ins=World.criarEntidade('inserter',1,0,1);
const bau=World.criarEntidade('wooden_chest',2,0,0);
Inv.add(ins.inv.fuel,'coal',5);
E.porNaEsteira(b5,'iron_ore',E.ESQ);
E.porNaEsteira(b5,'copper_ore',E.DIR);
rodar(10);
ok(Inv.conta(bau.inv.geral,'iron_ore')===1 && Inv.conta(bau.inv.geral,'copper_ore')===1,
   'o inseridor tirou item das duas faixas');

console.log('\n=== SAVE ANTIGO (1 faixa) CONTINUA FUNCIONANDO ===');
World.init('K',null);
const velho=World.criarEntidade('transport_belt',0,0,1);
delete velho.faixas;                       // simula save da versao anterior
velho.itens=[{item:'wood',pos:0.4},{item:'stone',pos:0.1}];
E.garantirFaixas(velho);
ok(velho.faixas && velho.faixas[E.ESQ].length===2,'os 2 itens antigos foram para a faixa esquerda');
ok(velho.itens===undefined,'o campo antigo foi removido');
rodar(2);
ok(true,'e a esteira migrada continua rodando sem erro');

console.log('\n=== LINHA COMPLETA AINDA FUNCIONA ===');
World.init('LINHA',null);
let loc=null;
for(let y=-60;y<60 && !loc;y++) for(let x=-60;x<60 && !loc;x++){
  if(World.resAt(x,y)===D.RES.IRON && World.podeConstruir('burner_drill',x,y)){
    let livre=true;
    for(let k=2;k<=9;k++) if(!World.podeConstruir('transport_belt',x+k,y)) livre=false;
    if(livre) loc={x,y};
  }
}
const dr=World.criarEntidade('burner_drill',loc.x,loc.y,1); Inv.add(dr.inv.fuel,'coal',20);
World.criarEntidade('transport_belt',loc.x+2,loc.y,1);
World.criarEntidade('transport_belt',loc.x+3,loc.y,1);
const i2=World.criarEntidade('inserter',loc.x+4,loc.y,1); Inv.add(i2.inv.fuel,'coal',20);
const fo=World.criarEntidade('stone_furnace',loc.x+5,loc.y,0); Inv.add(fo.inv.fuel,'coal',20);
const i3=World.criarEntidade('inserter',loc.x+7,loc.y,1); Inv.add(i3.inv.fuel,'coal',20);
World.criarEntidade('transport_belt',loc.x+8,loc.y,1);
const bauF=World.criarEntidade('wooden_chest',loc.x+9,loc.y,0);
rodar(60);
const placas=Inv.conta(bauF.inv.geral,'iron_plate');
console.log('  60s de linha automatica: '+placas+' placas');
ok(placas>0,'a linha inteira continua produzindo com as duas faixas');

console.log('\n=== PICARETAS ===');
['wood_pickaxe','stone_pickaxe','iron_pickaxe','gold_pickaxe'].forEach(p=>{
  ok(!!D.ITEMS[p],'item '+p+' existe: '+(D.ITEMS[p]?D.ITEMS[p].nome:'?'));
  ok(D.HAND_RECIPES.some(r=>r.saida===p),'  e tem receita');
  ok(fs.existsSync(path.join(RAIZ,'assets/items/'+p+'.png')),'  e o PNG esta em assets/items/');
});

console.log('\n'+(f===0?'TUDO PASSOU':f+' FALHA(S)'));
process.exit(f?1:0);
