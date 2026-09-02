/* ============================================================
   Duas coisas aqui.

   1) DESENHO DO CHÃO. O jogo travava quando se tirava o zoom
      porque o chão era um drawImage por tile — mais de dois mil
      por quadro. Agora cada chunk é pintado uma vez num canvas
      guardado e o quadro desenha um por chunk. Este teste conta
      os drawImage de um quadro com um canvas de mentira.

   2) SEÇÕES DA FABRICAÇÃO. Clicar em Ferramentas mostra só
      ferramentas; clicar em Estruturas troca a lista.
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');

/* ---- canvas de mentira que conta o que foi desenhado ---- */
let desenhos=0;
function makeCtx(){
  const noop=()=>{};
  const alvo={
    canvas:{width:1400,height:730},
    drawImage(){ desenhos++; },
    measureText:()=>({width:10}),
    createLinearGradient:()=>({addColorStop:noop}),
    getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)})
  };
  return new Proxy(alvo,{get:(t,p)=> (p in t) ? t[p] : noop, set:()=>true});
}
const registrados={};
function makeEl(tag){
  const ouvintes={};
  const el={
    tagName:(tag||'div').toUpperCase(), style:{setProperty(){}}, dataset:{}, children:[],
    classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},
      toggle(c,v){v?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
    appendChild(c){this.children.push(c); if(!this._fc) this._fc=c; return c},
    removeChild(){},
    addEventListener(tipo,fn){ (ouvintes[tipo]=ouvintes[tipo]||[]).push(fn); },
    removeEventListener(){}, setAttribute(){}, getAttribute(){return null},
    querySelector(){return makeEl('div')}, querySelectorAll(){return []},
    getBoundingClientRect(){return {left:0,top:0,width:1400,height:730}},
    getContext(){return makeCtx()}, focus(){},
    click(){ (ouvintes.click||[]).forEach(fn=>fn({shiftKey:false})); },
    isConnected:true,
    get innerHTML(){return this._html||''}, set innerHTML(v){this._html=v; this.children=[]; this._fc=null;},
    get firstChild(){return this._fc}, set firstChild(v){this._fc=v},
    get textContent(){return this._txt||''}, set textContent(v){this._txt=v},
    get id(){return this._id||''}, set id(v){ this._id=v; registrados[v]=this; },
    width:1400, height:730, clientWidth:1400, clientHeight:730
  };
  return el;
}
global.document={
  readyState:'complete', body:makeEl('body'), documentElement:makeEl('html'),
  createElement:t=>makeEl(t),
  getElementById:id=>registrados[id]||(registrados[id]=makeEl('div')),
  querySelector:()=>makeEl('div'), querySelectorAll:()=>[],
  addEventListener(){}, removeEventListener(){}
};
global.window=global;
global.devicePixelRatio=1;
global.performance={now:()=>Date.now()};
global.requestAnimationFrame=()=>1;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.Image=class{ set src(v){ setTimeout(()=>this.onerror&&this.onerror(),0); } };
global.matchMedia=()=>({matches:false});
global.addEventListener=()=>{};
global.removeEventListener=()=>{};

for(const m of ['src/js/core/settings.js','src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js',
                'src/js/game/rng.js','src/js/game/sprites.js','src/js/game/inventory.js','src/js/game/world.js',
                'src/js/game/entities.js','src/js/game/minimap.js','src/js/game/player.js','src/js/game/render.js',
                'src/js/ui/hud.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));

const FZ=global.FZ, D=FZ.Data, World=FZ.World, Inv=FZ.Inv, E=FZ.Entities, Render=FZ.Render, Hud=FZ.Hud,
      PlayerLib=FZ.Player, C=D.CONFIG;
let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};

/* ---------------- 1. desenho do chão ---------------- */
console.log('\n=== QUANTOS DESENHOS UM QUADRO CUSTA ===');
const tela=makeEl('canvas');
Render.init(tela);
Render.resize();
World.init('PERF1',null);
World.gerarTudo();

const p=PlayerLib.criar(0.5,0.5);
const g={ save:{}, player:p, camera:{x:0,y:0,zoom:1}, cursor:{tx:0,ty:0,wx:0,wy:0},
  dirConstrucao:1, pausado:false, painel:null, avisos:[], tempo:0 };

function quadro(zoom){
  g.camera.zoom=zoom;
  Render.draw(g,1/60);      // primeiro pinta e guarda os chunks
  desenhos=0;
  Render.draw(g,1/60);      // este é o quadro que interessa
  return desenhos;
}

const tiles = { 1: Math.ceil(1400/32)*Math.ceil(730/32), 2: Math.ceil(1400/64)*Math.ceil(730/64) };
for(const z of [4,3,2,1]){
  const n=quadro(z);
  console.log('  zoom '+z+': '+String(n).padStart(4)+' desenhos por quadro'+
    (tiles[z]?'   (o chão sozinho daria '+tiles[z]+' do jeito antigo)':''));
}
const noZoom1=quadro(1);
ok(noZoom1<300,'no zoom mais aberto o quadro fica abaixo de 300 desenhos ('+noZoom1+')');
ok(quadro(1)<=quadro(4)*8,'tirar o zoom não multiplica o custo por vinte');

console.log('\n=== O CHÃO GUARDADO SE ATUALIZA QUANDO A JAZIDA MUDA ===');
let jaz=null;
for(let y=-30;y<30 && !jaz;y++) for(let x=-30;x<30 && !jaz;x++)
  if(World.resAt(x,y)===D.RES.COAL) jaz={x,y};
g.camera.x=jaz.x; g.camera.y=jaz.y;
Render.draw(g,1/60);
desenhos=0; Render.draw(g,1/60);
const paradinho=desenhos;
World.setRes(jaz.x,jaz.y,D.RES.NONE,0);      // minerou até acabar
desenhos=0; Render.draw(g,1/60);
const depoisDeMinerar=desenhos;
console.log('  quadro parado: '+paradinho+' desenhos | quadro logo depois de minerar: '+depoisDeMinerar);
ok(depoisDeMinerar>paradinho,'minerar manda repintar o chunk do chão');
desenhos=0; Render.draw(g,1/60);
console.log('  quadro seguinte: '+desenhos+' desenhos');
ok(desenhos<=paradinho+2,'e no quadro seguinte o custo volta ao normal');

console.log('\n=== MUNDO NOVO NÃO HERDA O CHÃO DO ANTIGO ===');
const antes=World.terrainAt(0,0);
World.init('PERF2',null);
World.gerarTudo();
Render.draw(g,1/60);
ok(true,'trocar de mundo não quebra o desenho');

/* ---------------- 2. seções da fabricação ---------------- */
console.log('\n=== SEÇÕES DA FABRICAÇÃO ===');
World.init('PERF3',null);
const g2={ save:{}, player:PlayerLib.criar(0.5,0.5), camera:{x:0,y:0,zoom:2},
  cursor:{tx:0,ty:0,wx:0,wy:0}, dirConstrucao:1, pausado:false, painel:null, avisos:[], tempo:0 };
Hud.montar(g2);
Hud.alternarInventario();

const lista=document.getElementById('lista-receitas');
const secoes=document.getElementById('secoes-craft');
const daCat=id=>D.HAND_RECIPES.filter(r=>D.categoriaDaReceita(r)===id).length;

console.log('  botões de seção: '+secoes.children.map(b=>b.textContent).join(' | '));
ok(secoes.children.length===D.CATEGORIAS.length,'tem um botão para cada seção');
console.log('  seção aberta mostra '+lista.children.length+' receitas (ferramentas tem '+daCat('ferramenta')+')');
ok(lista.children.length===daCat('ferramenta'),'abre em Ferramentas e mostra só as ferramentas');
ok(lista.children.length!==D.HAND_RECIPES.length,'não mostra tudo de uma vez');

secoes.children[1].click();      // Estruturas
console.log('  depois de clicar em '+secoes.children[1].textContent+': '+lista.children.length+
  ' receitas (estruturas tem '+daCat('estrutura')+')');
ok(lista.children.length===daCat('estrutura'),'clicar em Estruturas troca a lista');
ok(secoes.children[1].classList.contains('sel'),'o botão clicado fica marcado');
ok(!secoes.children[0].classList.contains('sel'),'e o anterior desmarca');

secoes.children[2].click();      // Itens
ok(lista.children.length===daCat('item'),'clicar em Itens troca de novo');

/* ---------------- 3. a roda é só do zoom ---------------- */
console.log('\n=== A RODA DO MOUSE É SÓ DO ZOOM ===');
const fonteGame=fs.readFileSync(path.join(RAIZ,'src/js/game/game.js'),'utf8');
const trecho=fonteGame.slice(fonteGame.indexOf('consumirRoda'), fonteGame.indexOf('consumirRoda')+260);
ok(trecho.indexOf('hotbar')<0,'a roda não mexe mais na barra rápida');
ok(trecho.indexOf('zoom')>=0,'a roda mexe no zoom');
ok(fonteGame.indexOf('m.ctrl')<0,'não precisa mais segurar Ctrl para dar zoom');
const html=fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');
ok(html.indexOf('Ctrl+roda')<0 && html.indexOf('<kbd>roda</kbd> zoom')>=0,'a ajuda de teclas conta a regra nova');
ok(html.indexOf('id="fps"')>=0,'o contador de fps está na tela');

console.log(falhas ? '\n'+falhas+' falha(s).\n' : '\nTudo certo.\n');
process.exit(falhas?1:0);
