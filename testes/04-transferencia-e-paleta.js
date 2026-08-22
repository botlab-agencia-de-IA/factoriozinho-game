const fs=require('fs'), path=require('path');
const RAIZ = require('path').join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ,D=FZ.Data,Inv=FZ.Inv,World=FZ.World,C=D.CONFIG,P=FZ.Paleta;

let falhas=0; const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};

console.log('\n=== addFaixa: ordem esquerda→direita, cima→baixo ===');
const inv=Inv.criar(40);
Inv.addFaixa(inv,'wood',5,0,40);
ok(inv[0] && inv[0].count===5,'primeiro item vai para o slot 0');
Inv.addFaixa(inv,'stone',5,0,40);
ok(inv[1] && inv[1].item==='stone','o proximo vai para o slot 1 (o primeiro livre)');
inv[0]=null;                                   // abre um buraco no comeco
Inv.addFaixa(inv,'coal',5,0,40);
ok(inv[0] && inv[0].item==='coal','usa o buraco mais a esquerda antes de ir adiante');

// preenche pilha comecada antes de abrir slot novo
const inv2=Inv.criar(10);
inv2[3]={item:'wood',count:90};
const r=Inv.addFaixa(inv2,'wood',30,0,10);
ok(inv2[3].count===100 && inv2[0] && inv2[0].count===20 && r===0,
   'completa a pilha em 100 e joga o resto no primeiro slot livre');

console.log('\n=== faixa restrita (barra rapida x resto) ===');
const inv3=Inv.criar(40);
const sobra=Inv.addFaixa(inv3,'stone',50,C.HOTBAR_SIZE,C.INV_SIZE);
ok(inv3[C.HOTBAR_SIZE] && !inv3[0],'com faixa 8..40 nao encosta na barra rapida');
const cheio=Inv.criar(40);
for(let i=0;i<C.HOTBAR_SIZE;i++) cheio[i]={item:'coal',count:100};
const sob2=Inv.addFaixa(cheio,'wood',10,0,C.HOTBAR_SIZE);
ok(sob2===10,'faixa lotada devolve tudo, nao vaza para fora da faixa');

console.log('\n=== destino certo em cada maquina ===');
World.init('SHIFT',null);
const forno=World.criarEntidade('stone_furnace',0,0,0);
const drill=World.criarEntidade('burner_drill',10,10,1);
const bau=World.criarEntidade('wooden_chest',20,20,0);

// replica a regra do hud (slotDestinoNaMaquina)
function destino(e,item){
  const b=D.building(e.tipo);
  if(b.tipo==='chest') return e.inv.geral;
  if(b.tipo==='furnace'){ if(D.SMELTING[item]) return e.inv.input; if(D.fuelValue(item)>0) return e.inv.fuel; return null; }
  if(b.tipo==='drill'){ if(D.fuelValue(item)>0) return e.inv.fuel; return null; }
  return null;
}
ok(destino(forno,'iron_ore')===forno.inv.input,'minerio de ferro vai para a ENTRADA do forno');
ok(destino(forno,'coal')===forno.inv.fuel,'carvao vai para o COMBUSTIVEL do forno');
ok(destino(forno,'wood')===forno.inv.fuel,'madeira tambem vai para o combustivel');
ok(destino(forno,'iron_plate')===null,'placa pronta nao entra no forno (nao ha o que fundir)');
ok(destino(drill,'coal')===drill.inv.fuel,'carvao vai para o combustivel da mineradora');
ok(destino(drill,'iron_ore')===null,'minerio nao entra na mineradora');
ok(destino(bau,'iron_plate')===bau.inv.geral,'qualquer coisa entra no bau');

console.log('\n=== paleta ===');
let semCor=[];
for(const k in D.ITEMS) if(!P.ITENS[k]) semCor.push(k);
ok(semCor.length===0,'todo item tem cor na paleta'+(semCor.length?': falta '+semCor.join(', '):''));
let semTer=[];
for(const t of D.TERRAIN_INFO) if(!P.TERRENO[t.key]) semTer.push(t.key);
ok(semTer.length===0,'todo terreno tem cor na paleta'+(semTer.length?': falta '+semTer.join(', '):''));
let semJaz=[];
for(let i=1;i<D.RES_INFO.length;i++) if(!P.JAZIDAS[D.RES_INFO[i].key]) semJaz.push(D.RES_INFO[i].key);
ok(semJaz.length===0,'todo recurso tem cor na paleta'+(semJaz.length?': falta '+semJaz.join(', '):''));

// formato das cores
let ruins=[];
for(const tab of [P.ITENS,P.TERRENO,P.JAZIDAS])
  for(const k in tab){
    const c=tab[k];
    if(!Array.isArray(c)||(c.length!==3&&c.length!==5)||c.some(x=>!/^#[0-9a-f]{6}$/i.test(x))) ruins.push(k);
  }
ok(ruins.length===0,'todas as cores estao no formato certo (3 ou 5 tons) com #rrggbb'+(ruins.length?': '+ruins.join(', '):''));

// familia: minerio mais escuro que a barra
function brilho(hex){const m=/#(..)(..)(..)/.exec(hex);return (parseInt(m[1],16)*0.3+parseInt(m[2],16)*0.59+parseInt(m[3],16)*0.11);}
const familias=[['iron_ore','iron_plate','ferro'],['copper_ore','copper_plate','cobre'],['gold_ore','gold_plate','ouro']];
for(const [minerio,barra,nome] of familias){
  const bm=brilho(P.ITENS[minerio][0]), bb=brilho(P.ITENS[barra][0]);
  ok(bb>bm, `${nome}: a barra (${bb.toFixed(0)}) e mais clara que o minerio (${bm.toFixed(0)})`);
}

console.log('\n'+(falhas===0?'TUDO PASSOU ✔':falhas+' FALHA(S) ✘'));
process.exit(falhas?1:0);
