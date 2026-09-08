/* ============================================================
   O que o Vandré pegou jogando no mundo Clarita:

   - dá para atravessar esteira? dá para construir em cima de si?
   - o inseridor tem que entender o que a máquina da frente precisa:
     numa esteira com carvão e ferro, ele leva carvão só enquanto a
     fornalha estiver com pouco, depois passa a levar minério
   - máquina automática enche no máximo 3 de combustível; na mão o
     jogador enche o quanto quiser
   - inseridor a combustível se serve sozinho do que passa atrás
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/rng.js','src/js/game/inventory.js',
                'src/js/game/world.js','src/js/game/entities.js','src/js/game/player.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ, D=FZ.Data, World=FZ.World, Inv=FZ.Inv, E=FZ.Entities, PlayerLib=FZ.Player, C=D.CONFIG;
const rodar=(s,p=1/60)=>{for(let i=0;i<s/p;i++) E.update(p);};
/* A esteira só aceita um item por vez, com espaço entre eles. Alimentar
   de verdade é ir empurrando enquanto o tempo passa, como faria uma
   mineradora do outro lado. */
function alimentar(esteira, itens, segundos){
  const passos=Math.round(segundos*60);
  for(let i=0;i<passos;i++){
    if(i%6===0) itens.forEach((it,f)=>{ if(it) E.porNaEsteira(esteira,it,f); });
    E.update(1/60);
  }
}
let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};

function lugarLivre(tipo,perto){
  for(let r=0;r<40;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
    const x=(perto?perto.x:0)+dx, y=(perto?perto.y:0)+dy;
    if(World.podeConstruir(tipo,x,y) && !World.resAt(x,y)) return {x,y};
  }
  throw new Error('sem lugar para '+tipo);
}

console.log('\n=== O PERSONAGEM E AS ESTRUTURAS ===');
World.init('CLARITA1',null);
// precisa de corredor livre em cima e embaixo, senão quem barra é uma árvore
let base=null;
for(let r=0;r<40 && !base;r++) for(let dy=-r;dy<=r && !base;dy++) for(let dx=-r;dx<=r && !base;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r) continue;
  let bom=true;
  for(let k=-2;k<=2;k++) if(!World.podeConstruir('transport_belt',dx,dy+k) || World.resAt(dx,dy+k)) bom=false;
  if(bom) base={x:dx,y:dy};
}
const p=PlayerLib.criar(base.x+0.5, base.y+1.5);   // logo abaixo do tile da esteira
World.criarEntidade('transport_belt',base.x,base.y,1);

const antesY=p.y;
for(let i=0;i<40;i++) PlayerLib.mover(p,0,-1,1/60);   // anda para cima, por cima da esteira
console.log('  andou de y='+antesY.toFixed(2)+' para y='+p.y.toFixed(2)+' (a esteira estava em y='+base.y+')');
ok(p.y < base.y+0.5,'dá para atravessar a esteira andando por cima dela');
ok(!World.tileSolido(base.x,base.y),'a esteira não conta como parede');

// construir em cima de si mesmo
const emCima = { x: Math.floor(p.x), y: Math.floor(p.y) };
Inv.add(p.inv,'stone_furnace',5);
Inv.add(p.inv,'transport_belt',5);
ok(PlayerLib.pisandoNaArea(p,'transport_belt',emCima.x,emCima.y),'o jogo sabe que ele está pisando ali');
ok(!PlayerLib.construir(p,'transport_belt',emCima.x,emCima.y,1),'não deixa construir esteira em cima dele');
ok(!PlayerLib.construir(p,'stone_furnace',emCima.x,emCima.y,0),'nem uma fornalha 2x2 em cima dele');
ok(!World.entityAt(emCima.x,emCima.y),'nada foi construído ali');
ok(Inv.conta(p.inv,'transport_belt')===5,'e o item não sumiu da mochila');

// um passo ao lado e já dá
const doLado = { x: emCima.x + 2, y: emCima.y };
if(World.podeConstruir('transport_belt',doLado.x,doLado.y)){
  ok(PlayerLib.construir(p,'transport_belt',doLado.x,doLado.y,1),'ao lado dele, constrói normal');
}

console.log('\n=== SE FICOU PRESO, ELE SAI ===');
World.init('CLARITA2',null);
const lug=lugarLivre('stone_furnace');
const p2=PlayerLib.criar(lug.x+0.5,lug.y+0.5);
World.criarEntidade('stone_furnace',lug.x,lug.y,0);   // nasceu em cima dele
ok(PlayerLib.colide(p2.x,p2.y),'ele começou preso dentro da fornalha');
PlayerLib.update(p2,1/60);
console.log('  saiu para ('+p2.x.toFixed(1)+', '+p2.y.toFixed(1)+')');
ok(!PlayerLib.colide(p2.x,p2.y),'no quadro seguinte ele já está fora');

console.log('\n=== O INSERIDOR ESCOLHE O QUE A FORNALHA PRECISA ===');
World.init('CLARITA3',null);
const lf=lugarLivre('stone_furnace');
const forno=World.criarEntidade('stone_furnace',lf.x,lf.y,0);
// esteira em cima da fornalha, inseridor no meio
const esteira=World.criarEntidade('transport_belt',lf.x,lf.y-2,1);
const ins=World.criarEntidade('inserter',lf.x,lf.y-1,2);   // pega do norte, põe no sul
Inv.add(ins.inv.fuel,'coal',5);

// a esteira leva carvão numa faixa e ferro na outra
alimentar(esteira, ['coal','iron_ore'], 25);
const noFuel=E.contarCombustivel(forno);
const naEntrada=Inv.conta(forno.inv.input,'iron_ore');
console.log('  fornalha ficou com '+noFuel+' de carvão e '+naEntrada+' de minério na entrada');
ok(noFuel>0 && noFuel<=C.FUEL_AUTOMATICO,'o carvão parou no limite de '+C.FUEL_AUTOMATICO);
ok(naEntrada>0,'e o inseridor passou a levar o minério em vez de mais carvão');

console.log('\n=== O LIMITE VALE SÓ PARA MÁQUINA, NÃO PARA A MÃO ===');
const forno2=World.criarEntidade('stone_furnace',lf.x+4,lf.y,0);
Inv.add(forno2.inv.fuel,'coal',100);            // o jogador enchendo na mão
ok(E.contarCombustivel(forno2)===100,'na mão dá para pôr 100 de carvão');
ok(!E.destinoQuer(forno2,'coal'),'com a fornalha cheia, o inseridor não põe mais carvão');
ok(E.destinoQuer(forno2,'iron_ore'),'mas continua aceitando minério');

const forno3=World.criarEntidade('stone_furnace',lf.x+7,lf.y,0);
ok(E.destinoQuer(forno3,'coal'),'fornalha vazia quer carvão');
Inv.add(forno3.inv.fuel,'coal',C.FUEL_AUTOMATICO);
ok(!E.destinoQuer(forno3,'coal'),'com '+C.FUEL_AUTOMATICO+' de carvão, não quer mais');
ok(!E.aceitarItem(forno3,'coal',ins),'e a entrega automática é recusada');

console.log('\n=== A MINERADORA TAMBÉM RESPEITA O LIMITE ===');
ok(!E.aceitarItem(forno3,'coal',null),'nem empurrando direto de outra máquina');

console.log('\n=== O INSERIDOR SE SERVE SOZINHO ===');
World.init('CLARITA4',null);
const lb=lugarLivre('transport_belt');
const cinta=World.criarEntidade('transport_belt',lb.x,lb.y,1);
const ins2=World.criarEntidade('inserter',lb.x,lb.y+1,2);
const bau=World.criarEntidade('wooden_chest',lb.x,lb.y+2,0);
// inseridor sem combustível nenhum, carvão passando atrás
ok(E.contarCombustivel(ins2)===0,'o inseridor começa no seco');
alimentar(cinta, ['coal','coal'], 3);
console.log('  depois de 3s: combustível do inseridor = '+E.contarCombustivel(ins2)+
  ' (ou já queimando: '+(ins2.queima>0)+')');
ok(E.contarCombustivel(ins2)>0 || ins2.queima>0,'ele pegou carvão da esteira para si');
alimentar(cinta, ['coal','coal'], 20);
console.log('  carvão que chegou no baú: '+Inv.conta(bau.inv.geral,'coal'));
ok(Inv.conta(bau.inv.geral,'coal')>0,'e depois de abastecido, passou carvão adiante');

console.log('\n=== NADA QUE SIRVA NA FRENTE ===');
World.init('CLARITA5',null);
const lc=lugarLivre('stone_furnace');
const fornoCheio=World.criarEntidade('stone_furnace',lc.x,lc.y,0);
Inv.add(fornoCheio.inv.fuel,'coal',50);
const est2=World.criarEntidade('transport_belt',lc.x,lc.y-2,1);
const ins3=World.criarEntidade('inserter',lc.x,lc.y-1,2);
Inv.add(ins3.inv.fuel,'coal',5);
alimentar(est2, ['coal','coal'], 5);     // só carvão passando
console.log('  estado do inseridor: '+E.estado(ins3));
ok(E.contarCombustivel(fornoCheio)===50,'ele não empilhou mais carvão na fornalha cheia');
ok(E.estado(ins3).indexOf('sirva')>=0 || !ins3.ativo,'e o painel explica que não há o que servir');

console.log('\n=== A MINERADORA CUSPE SEMPRE DO MESMO LADO ===');
World.init('CLARITA6',null);
const ld=lugarLivre('burner_drill');
const nomes=['norte','leste','sul','oeste'];
const esperado=[
  {x:ld.x+1, y:ld.y-1},   // aponta norte  → direita é leste
  {x:ld.x+2, y:ld.y+1},   // aponta leste  → direita é sul
  {x:ld.x,   y:ld.y+2},   // aponta sul    → direita é oeste
  {x:ld.x-1, y:ld.y}      // aponta oeste  → direita é norte
];
let ladoCerto=true;
for(let d=0;d<4;d++){
  const m=World.criarEntidade('burner_drill',ld.x,ld.y,d);
  const s=E.tileSaida(m);
  const bate = s.x===esperado[d].x && s.y===esperado[d].y;
  console.log('  virada para '+nomes[d].padEnd(6)+' cospe em ('+s.x+','+s.y+')'+
    (bate?'':'  ✘ esperado ('+esperado[d].x+','+esperado[d].y+')'));
  if(!bate) ladoCerto=false;
  World.removerEntidade(m);
}
ok(ladoCerto,'nas quatro direções a saída fica no lado direito da frente');

console.log('\n=== CONSTRUIR COM A PILHA PRESA NO CURSOR ===');
const fonteGame=fs.readFileSync(path.join(RAIZ,'src/js/game/game.js'),'utf8');
const trecho=fonteGame.slice(fonteGame.indexOf('Hud.maoCheia()'), fonteGame.indexOf('Hud.maoCheia()')+900);
ok(trecho.indexOf('infoCursor.constroi')>=0,'o clique com estrutura no cursor constrói');
ok(trecho.indexOf('pisandoNaArea')>=0,'e não deixa construir em cima do próprio jogador');
ok(fonteGame.indexOf('tirarDoCursor(1)')>=0,'gastando uma da pilha do cursor');
const fonteRender=fs.readFileSync(path.join(RAIZ,'src/js/game/render.js'),'utf8');
ok(fonteRender.indexOf('itemDoCursor')>=0,'o fantasma da construção também aparece com o item do cursor');

console.log(falhas ? '\n'+falhas+' falha(s).\n' : '\nTudo certo.\n');
process.exit(falhas?1:0);
