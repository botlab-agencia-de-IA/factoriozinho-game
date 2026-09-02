/* ============================================================
   As manhas de inventário que o Vandré pediu, copiadas do
   Factorio e do Minecraft:

   - botão direito pega metade da pilha; fechar a mochila NÃO
     devolve o que está na mão; clicar na máquina abastece
   - arrastar a pilha por vários slots divide igual entre eles
   - dois cliques rápidos juntam todo aquele item na mão
   - Shift + dois cliques mandam todo aquele item para o baú

   Tudo com um DOM de mentira que responde a clique e a arrasto.
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');

function makeCtx(){
  const noop=()=>{};
  return new Proxy({ canvas:{width:800,height:600}, measureText:()=>({width:10}) },
    {get:(t,p)=> (p in t)?t[p]:noop, set:()=>true});
}
const criados=[], reg={}, doc={};
function makeEl(tag){
  const ouv={};
  const el={
    tagName:(tag||'div').toUpperCase(), style:{setProperty(){}}, dataset:{}, children:[],
    _ouv:ouv,
    classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},
      toggle(c,v){v?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
    appendChild(c){this.children.push(c); if(!this._fc)this._fc=c; return c},
    removeChild(){},
    addEventListener(t,fn){ (ouv[t]=ouv[t]||[]).push(fn); },
    removeEventListener(){}, setAttribute(){}, getAttribute(){return null},
    querySelector(){return makeEl('div')}, querySelectorAll(){return []},
    getBoundingClientRect(){return {left:0,top:0,width:42,height:42}},
    getContext(){return makeCtx()}, focus(){}, click(){ (ouv.click||[]).forEach(f=>f({shiftKey:false})); },
    isConnected:true,
    get innerHTML(){return this._h||''}, set innerHTML(v){this._h=v;this.children=[];this._fc=null;},
    get firstChild(){return this._fc}, set firstChild(v){this._fc=v},
    get textContent(){return this._t||''}, set textContent(v){this._t=v},
    get id(){return this._id||''}, set id(v){this._id=v;reg[v]=this;},
    width:32,height:32
  };
  return el;
}
global.document={
  readyState:'complete', body:makeEl('body'), documentElement:makeEl('html'),
  createElement:t=>{ const e=makeEl(t); criados.push(e); return e; },
  getElementById:id=>reg[id]||(reg[id]=makeEl('div')),
  querySelector:()=>makeEl('div'), querySelectorAll:()=>[],
  addEventListener(t,fn){ (doc[t]=doc[t]||[]).push(fn); },
  removeEventListener(){}
};
global.window=global; global.innerWidth=1400; global.innerHeight=730;
global.performance={now:()=>Date.now()};
global.requestAnimationFrame=()=>1; global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.Image=class{ set src(v){} };

for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js',
                'src/js/game/sprites.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js',
                'src/js/game/minimap.js','src/js/game/player.js','src/js/ui/hud.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));

const FZ=global.FZ, D=FZ.Data, World=FZ.World, Inv=FZ.Inv, Hud=FZ.Hud, PlayerLib=FZ.Player, C=D.CONFIG;
let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};

/* ---- gestos ---- */
const disparar=(el,tipo,ev)=>(el._ouv[tipo]||[]).forEach(f=>f(Object.assign({preventDefault(){},button:0,shiftKey:false},ev)));
const soltarBotao=()=>(doc.mouseup||[]).forEach(f=>f({}));
const slotsDe=ctx=>criados.filter(e=>e._cfg && e._cfg.contexto===ctx).sort((a,b)=>a._cfg.i-b._cfg.i);
/* Cada janela aberta cria 40 slots novos. Sem zerar a lista, o teste
   acabaria clicando no slot de uma janela que ja foi fechada. */
const abrirMochila=()=>{ criados.length=0; Hud.alternarInventario(); };
const abrirMaquina=e=>{ criados.length=0; Hud.abrirPainel(e); };
const esperar=ms=>{const t=Date.now()+ms; while(Date.now()<t);};

World.init('INV1',null);
const p=PlayerLib.criar(0.5,0.5);
const g={ save:{}, player:p, camera:{x:0,y:0,zoom:2}, cursor:{tx:0,ty:0,wx:0,wy:0},
  dirConstrucao:1, pausado:false, painel:null, avisos:[], tempo:0 };
Hud.montar(g);

console.log('\n=== BOTÃO DIREITO PEGA METADE, E A MÃO NÃO SOLTA AO FECHAR ===');
p.inv[0]={item:'coal',count:40};
abrirMochila();
let inv=slotsDe('inv');
disparar(inv[0],'mousedown',{button:2});
soltarBotao();
ok(Hud.maoCheia(),'clicar com o direito deixa a pilha presa no cursor');
ok(p.inv[0] && p.inv[0].count===20,'metade fica no slot (20 de 40)');
Hud.fecharPainel();                       // fecha a mochila
ok(Hud.maoCheia(),'fechar a mochila NÃO devolve o que está na mão');

console.log('\n=== CLICAR NA MÁQUINA ABASTECE ===');
let livre=null;
for(let y=-20;y<20 && !livre;y++) for(let x=-20;x<20 && !livre;x++)
  if(World.podeConstruir('stone_furnace',x,y) && !World.resAt(x,y)) livre={x,y};
const forno=World.criarEntidade('stone_furnace',livre.x,livre.y,0);
const entraram=Hud.abastecer(forno,0);
console.log('  entraram '+entraram+' de carvão no forno');
ok(entraram===20,'a mão inteira entra de uma vez');
ok(forno.inv.fuel[0] && forno.inv.fuel[0].item==='coal' && forno.inv.fuel[0].count===20,
   'o carvão foi para o slot de combustível sozinho');
ok(!Hud.maoCheia(),'a mão esvazia depois de abastecer');

// um por clique, com o botão direito
p.inv[0]={item:'iron_ore',count:10};
abrirMochila();
inv=slotsDe('inv');
disparar(inv[0],'mousedown',{button:0});
soltarBotao();
Hud.fecharPainel();
ok(Hud.abastecer(forno,1)===1,'o botão direito enfia um de cada vez');
ok(forno.inv.input[0].count===1,'e o minério foi para a entrada, não para o combustível');
const naoServe=Hud.abastecer(World.criarEntidade('transport_belt',livre.x+3,livre.y,1),0);
ok(naoServe===-1,'máquina que não usa aquilo avisa em vez de engolir');
Hud.largarMao();

console.log('\n=== ARRASTAR A PILHA DIVIDE IGUAL (Minecraft) ===');
for(let i=0;i<C.INV_SIZE;i++) p.inv[i]=null;
p.inv[0]={item:'iron_plate',count:100};
abrirMochila();
inv=slotsDe('inv');
disparar(inv[0],'mousedown',{button:0});     // pega as 100
soltarBotao();
ok(Hud.maoCheia(),'pegou a pilha inteira');

disparar(inv[1],'mousedown',{button:0});     // começa o arrasto
for(const i of [2,3,4,5]) disparar(inv[i],'mouseenter',{});
soltarBotao();                                // solta: divide
const espalhado=[1,2,3,4,5].map(i=>p.inv[i]?p.inv[i].count:0);
console.log('  os cinco slots ficaram com: '+espalhado.join(', '));
ok(espalhado.every(n=>n===20),'100 placas por 5 slots = 20 em cada');
ok(!Hud.maoCheia(),'não sobrou nada na mão');

// número quebrado: o resto continua na mão
for(let i=0;i<C.INV_SIZE;i++) p.inv[i]=null;
p.inv[0]={item:'iron_plate',count:13};
Hud.fecharPainel(); abrirMochila();
inv=slotsDe('inv');
disparar(inv[0],'mousedown',{button:0});
soltarBotao();
disparar(inv[1],'mousedown',{button:0});
for(const i of [2,3,4,5]) disparar(inv[i],'mouseenter',{});
soltarBotao();
const quebrado=[1,2,3,4,5].map(i=>p.inv[i]?p.inv[i].count:0);
console.log('  13 placas por 5 slots: '+quebrado.join(', ')+'  (o resto fica no cursor, como no Minecraft)');
ok(quebrado.every(n=>n===2),'cada slot fica com 2');
ok(Hud.maoCheia(),'e os 3 que sobraram continuam na mão');
Hud.largarMao();

console.log('\n=== DOIS CLIQUES JUNTAM TUDO NA MÃO ===');
for(let i=0;i<C.INV_SIZE;i++) p.inv[i]=null;
p.inv[0]={item:'stone',count:10};
p.inv[3]={item:'stone',count:7};
p.inv[8]={item:'stone',count:25};
p.inv[5]={item:'wood',count:9};
Hud.fecharPainel(); abrirMochila();
inv=slotsDe('inv');
disparar(inv[0],'mousedown',{button:0});     // pega 10
soltarBotao();
disparar(inv[0],'mousedown',{button:0});     // de novo, rápido: junta o resto
soltarBotao();
const naMao=Inv.conta(p.inv,'stone');
console.log('  sobrou '+naMao+' de pedra no inventário depois do clique duplo');
ok(naMao===0,'os 42 de pedra vieram todos para a mão');
ok(Inv.conta(p.inv,'wood')===9,'a madeira não foi junto');
Hud.largarMao();

console.log('\n=== SHIFT + DOIS CLIQUES MANDAM TUDO PARA O BAÚ ===');
for(let i=0;i<C.INV_SIZE;i++) p.inv[i]=null;
p.inv[0]={item:'coal',count:50};
p.inv[1]={item:'coal',count:30};
p.inv[2]={item:'coal',count:12};
p.inv[4]={item:'wood',count:20};
Hud.fecharPainel();
const bau=World.criarEntidade('wooden_chest',livre.x,livre.y+3,0);
abrirMaquina(bau);
inv=slotsDe('inv');
disparar(inv[0],'mousedown',{button:0,shiftKey:true});
esperar(5);
disparar(inv[0],'mousedown',{button:0,shiftKey:true});   // duplo com shift
console.log('  carvão no baú: '+Inv.conta(bau.inv.geral,'coal')+' | na mochila: '+Inv.conta(p.inv,'coal'));
ok(Inv.conta(p.inv,'coal')===0,'todo o carvão foi para o baú');
ok(Inv.conta(bau.inv.geral,'coal')===92,'os 92 chegaram lá');
ok(Inv.conta(p.inv,'wood')===20,'a madeira ficou onde estava');

// e o caminho de volta
const bauSlots=slotsDe('chest');
disparar(bauSlots[0],'mousedown',{button:0,shiftKey:true});
esperar(5);
disparar(bauSlots[0],'mousedown',{button:0,shiftKey:true});
console.log('  depois do mesmo gesto no baú: mochila com '+Inv.conta(p.inv,'coal'));
ok(Inv.conta(p.inv,'coal')===92,'o mesmo gesto no baú traz tudo de volta');

console.log('\n=== SHIFT + CLIQUE SIMPLES CONTINUA MOVENDO SÓ UMA PILHA ===');
for(let i=0;i<C.INV_SIZE;i++) p.inv[i]=null;
p.inv[0]={item:'stone',count:20};
p.inv[1]={item:'stone',count:20};
Hud.fecharPainel();
abrirMaquina(bau);
inv=slotsDe('inv');
esperar(400);                                  // longe do clique anterior
disparar(inv[0],'mousedown',{button:0,shiftKey:true});
ok(Inv.conta(p.inv,'stone')===20,'um shift+clique sozinho move só a pilha clicada');
Hud.fecharPainel();
Hud.largarMao();

console.log(falhas ? '\n'+falhas+' falha(s).\n' : '\nTudo certo.\n');
process.exit(falhas?1:0);
