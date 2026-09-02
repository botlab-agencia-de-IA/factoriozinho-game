/* Carrega TODOS os scripts na ordem do index.html com um DOM falso,
   para pegar erro de referência que o teste de lógica não vê. */
const fs=require('fs');
const RAIZ = require('path').join(__dirname, '..');

// ---- DOM mínimo ----
function makeCtx(){
  const noop=()=>{};
  return new Proxy({
    canvas:{width:800,height:600},
    createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
    putImageData:noop, getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
    createLinearGradient:()=>({addColorStop:noop}),
    measureText:()=>({width:10}),
    setTransform:noop, drawImage:noop, fillRect:noop, clearRect:noop
  },{get:(t,p)=>{
    if (p in t) return t[p];
    const props=['fillStyle','strokeStyle','lineWidth','lineCap','lineJoin','miterLimit','font','textAlign','textBaseline','globalAlpha','globalCompositeOperation','imageSmoothingEnabled','shadowBlur','shadowColor','shadowOffsetX','shadowOffsetY','lineDashOffset','filter','direction'];
    if (props.includes(p)) return undefined;
    return noop;
  },set:()=>true});
}
function makeEl(tag){
  const el={
    tagName:(tag||'div').toUpperCase(), style:{setProperty(){}}, dataset:{}, children:[], childNodes:[],
    classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},
      toggle(c,v){v?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
    appendChild(c){this.children.push(c);this.childNodes.push(c);if(!this.firstChild)this.firstChild=c;return c},
    removeChild(){}, addEventListener(){}, removeEventListener(){}, setAttribute(){}, getAttribute(){return null},
    querySelector(){return makeEl('div')}, querySelectorAll(){return []},
    getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},
    getContext(){return makeCtx()}, focus(){}, click(){}, isConnected:true,
    get innerHTML(){return this._html||''}, set innerHTML(v){this._html=v; this.children=[]; this.childNodes=[];},
    get textContent(){return this._txt||''}, set textContent(v){this._txt=v},
    get firstChild(){return this._fc}, set firstChild(v){this._fc=v},
    width:180,height:180, clientWidth:1280, clientHeight:720, value:'', checked:false, type:'text'
  };
  return el;
}
const registrados={};
global.document={
  readyState:'complete',
  documentElement:makeEl('html'),
  body:makeEl('body'),
  createElement:t=>makeEl(t),
  getElementById:id=>registrados[id]||(registrados[id]=makeEl('div')),
  querySelector:()=>makeEl('div'),
  querySelectorAll:()=>[],
  addEventListener(){}, removeEventListener(){}
};
global.window=global;
global.performance={now:()=>Number(process.hrtime.bigint()/1000000n)};
global.requestAnimationFrame=()=>1;
global.cancelAnimationFrame=()=>{};
global.devicePixelRatio=1;
global.matchMedia=()=>({matches:false});
global.Image=class{ set src(v){ this._src=v; setTimeout(()=>this.onerror&&this.onerror(),0); } get src(){return this._src} };
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.addEventListener=()=>{};
global.close=()=>{};
global.innerWidth=1280; global.innerHeight=720;
global.setTimeout=setTimeout; global.clearTimeout=clearTimeout;

// ---- carrega na ordem do index.html ----
const html=fs.readFileSync(RAIZ+'/index.html','utf8');
const ordem=[...html.matchAll(/src="(src\/js[^"]+)"/g)].map(m=>m[1].replace(/\?.*$/,''));  // sem o ?v= do cache
console.log('Carregando '+ordem.length+' scripts na ordem do index.html...\n');
for(const f of ordem){
  try { eval(fs.readFileSync(RAIZ+'/'+f,'utf8')); console.log('  ✔ '+f); }
  catch(e){ console.log('  ✘ '+f+' → '+e.message); process.exit(1); }
}

const FZ=global.FZ;
console.log('\nMódulos expostos:', Object.keys(FZ).sort().join(', '));

console.log('\n--- boot ---');
FZ.Settings.load();
FZ.Settings.apply();
console.log('  ✔ configurações carregadas');

console.log('\n--- criar mundo e entrar no jogo ---');
const save=FZ.Saves.createWorld({name:'Teste',seed:'SMOKE123',worldSize:'medium',mode:'relaxed'});
save.slot=1;
const t0=Date.now();
FZ.Game.iniciar(save);
console.log('  ✔ Game.iniciar() rodou em '+(Date.now()-t0)+'ms');

const g=FZ.Game.estado;
console.log('  jogador em ('+g.player.x.toFixed(1)+', '+g.player.y.toFixed(1)+')');
console.log('  minimapa pronto:', FZ.Minimap.pronto);

console.log('\n--- simular 3 segundos de jogo ---');
// acessa o loop interno indiretamente: chama as partes públicas
let erros=0;
try{
  for(let i=0;i<180;i++){ FZ.Entities.update(1/60); FZ.Player.update(g.player,1/60); }
  console.log('  ✔ 180 quadros de lógica sem erro');
}catch(e){ console.log('  ✘ '+e.message); erros++; }

try{ FZ.Render.draw(g,0.016); console.log('  ✔ Render.draw sem erro'); }
catch(e){ console.log('  ✘ Render.draw → '+e.message); erros++; }

try{ FZ.Hud.desenhar(0.2); console.log('  ✔ Hud.desenhar sem erro'); }
catch(e){ console.log('  ✘ Hud.desenhar → '+e.message); erros++; }

try{ FZ.Hud.alternarInventario(); FZ.Hud.alternarInventario(); console.log('  ✔ abrir/fechar inventário'); }
catch(e){ console.log('  ✘ inventário → '+e.message); erros++; }

try{ FZ.Hud.alternarMapa(); FZ.Hud.alternarMapa(); console.log('  ✔ abrir/fechar mapa'); }
catch(e){ console.log('  ✘ mapa → '+e.message); erros++; }

try{
  FZ.Inv.add(g.player.inv,'stone_furnace',3);
  const ok=FZ.Player.construir(g.player,'stone_furnace',Math.floor(g.player.x)+2,Math.floor(g.player.y),0);
  const e=FZ.World.entityAt(Math.floor(g.player.x)+2,Math.floor(g.player.y));
  console.log((ok&&e?'  ✔':'  ✘')+' construir forno perto do jogador: '+ok);
  if(e){ FZ.Hud.abrirPainel(e); FZ.Hud.fecharPainel(); console.log('  ✔ abrir/fechar painel da máquina'); }
}catch(e){ console.log('  ✘ construção → '+e.message); erros++; }

try{ FZ.Game.salvarJogo(); console.log('  ✔ salvar'); }
catch(e){ console.log('  ✘ salvar → '+e.message); erros++; }

try{ FZ.Game.sair(true); console.log('  ✔ sair para o menu'); }
catch(e){ console.log('  ✘ sair → '+e.message); erros++; }

console.log('\n'+(erros===0?'SMOKE TEST PASSOU ✔':erros+' ERRO(S) ✘'));
process.exit(erros?1:0);
