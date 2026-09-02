/* ============================================================
   Testa o painel do canto direito da TELA DO JOGO (embaixo do
   minimapa): apontar o cursor para uma máquina ou jazida tem que
   encher o painel, e apontar para o mato tem que esvaziar.

   Usa um DOM de mentira, igual ao teste de carregamento — o que
   interessa aqui é o que o hud escreve dentro do #inspetor.
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');

/* ---- DOM mínimo ---- */
function makeCtx(){
  const noop=()=>{};
  return new Proxy({ canvas:{width:800,height:600}, measureText:()=>({width:10}) },
    {get:(t,p)=> (p in t) ? t[p] : noop, set:()=>true});
}
function makeEl(tag){
  const el={
    tagName:(tag||'div').toUpperCase(), style:{setProperty(){}}, dataset:{}, children:[],
    classList:{_s:new Set(),add(...c){c.forEach(x=>this._s.add(x))},remove(...c){c.forEach(x=>this._s.delete(x))},
      toggle(c,v){v?this._s.add(c):this._s.delete(c)},contains(c){return this._s.has(c)}},
    appendChild(c){this.children.push(c); if(!this._fc) this._fc=c; return c},
    removeChild(){}, addEventListener(){}, removeEventListener(){}, setAttribute(){}, getAttribute(){return null},
    querySelector(){return makeEl('div')}, querySelectorAll(){return []},
    getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},
    getContext(){return makeCtx()}, focus(){}, click(){}, isConnected:true,
    get innerHTML(){return this._html||''}, set innerHTML(v){this._html=v; this.children=[]; this._fc=null;},
    get firstChild(){return this._fc}, set firstChild(v){this._fc=v},
    get textContent(){return this._txt||''}, set textContent(v){this._txt=v},
    width:180, height:180
  };
  return el;
}
const registrados={};
global.document={
  readyState:'complete', body:makeEl('body'), documentElement:makeEl('html'),
  createElement:t=>makeEl(t),
  getElementById:id=>registrados[id]||(registrados[id]=makeEl('div')),
  querySelector:()=>makeEl('div'), querySelectorAll:()=>[],
  addEventListener(){}, removeEventListener(){}
};
global.window=global;
global.performance={now:()=>Date.now()};
global.requestAnimationFrame=()=>1;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.Image=class{ set src(v){ setTimeout(()=>this.onerror&&this.onerror(),0); } };

for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js',
                'src/js/game/sprites.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js',
                'src/js/game/minimap.js','src/js/game/player.js','src/js/ui/hud.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));

const FZ=global.FZ, D=FZ.Data, World=FZ.World, Inv=FZ.Inv, E=FZ.Entities, Hud=FZ.Hud, PlayerLib=FZ.Player, C=D.CONFIG;
let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};
const painel=()=>document.getElementById('inspetor').innerHTML;
const rodar=(s,p=1/60)=>{for(let i=0;i<s/p;i++) E.update(p);};

/* monta o hud com um estado de jogo montado à mão */
World.init('PAINEL1',null);
const p=PlayerLib.criar(0.5,0.5);
const g={ save:{}, player:p, camera:{x:0,y:0,zoom:1}, cursor:{tx:0,ty:0,wx:0,wy:0},
  dirConstrucao:1, pausado:false, painel:null, avisos:[], tempo:0 };
Hud.montar(g);

function apontar(tx,ty){
  g.cursor.tx=tx; g.cursor.ty=ty;
  Hud.desenhar(0.2);          // passa do refresh de 0,12 s
}

console.log('\n=== O PAINEL SÓ APARECE QUANDO TEM O QUE DIZER ===');
let mato=null;
for(let y=-40;y<40 && !mato;y++) for(let x=-40;x<40 && !mato;x++)
  if(!World.resAt(x,y) && !World.entityAt(x,y) && !D.terrainInfo(World.terrainAt(x,y)).solido) mato={x,y};
apontar(mato.x,mato.y);
ok(painel()==='','apontando o mato, o painel some (nada para dizer)');

let jaz=null;
for(let y=-60;y<60 && !jaz;y++) for(let x=-60;x<60 && !jaz;x++)
  if(World.resAt(x,y)===D.RES.COAL) jaz={x,y};
apontar(jaz.x,jaz.y);
ok(painel().indexOf('Jazida de carvão')>=0,'apontando a jazida, o painel mostra a jazida');
ok(painel().indexOf('A jazida inteira')>=0,'com o total da jazida inteira');
ok(painel().indexOf('data-item="coal"')>=0,'e com o ícone do minério');

console.log('\n=== FORNO: o processo aparece no painel do jogo ===');
let livre=null;
for(let y=-40;y<40 && !livre;y++) for(let x=-40;x<40 && !livre;x++)
  if(World.podeConstruir('stone_furnace',x,y) && !World.resAt(x,y)) livre={x,y};
const forno=World.criarEntidade('stone_furnace',livre.x,livre.y,0);
Inv.add(forno.inv.fuel,'coal',10);
Inv.add(forno.inv.input,'iron_ore',20);
rodar(2);
apontar(livre.x,livre.y);
const htmlForno=painel();
ok(htmlForno.indexOf('Forno de pedra')>=0,'aponta o forno e ele aparece');
ok(htmlForno.indexOf('Fundindo')>=0,'mostra o que está fundindo');
ok(htmlForno.indexOf('insp-b prog')>=0,'com a barra de progresso');
ok(htmlForno.indexOf('insp-b chama')>=0,'e a barra do combustível');
ok(htmlForno.indexOf('undefined')<0,'sem nenhum "undefined"');

// a barra tem que andar sem remontar o painel
const antes=painel();
rodar(1);
apontar(livre.x,livre.y);
ok(painel().length>0,'o painel continua de pé com a máquina trabalhando');

console.log('\n=== MINERADORA ===');
let carvao=null;
for(let y=-60;y<60 && !carvao;y++) for(let x=-60;x<60 && !carvao;x++)
  if(World.resAt(x,y)===D.RES.COAL && World.podeConstruir('burner_drill',x,y)) carvao={x,y};
const drill=World.criarEntidade('burner_drill',carvao.x,carvao.y,1);
Inv.add(drill.inv.fuel,'coal',10);
rodar(3);
apontar(carvao.x,carvao.y);
ok(painel().indexOf('Ainda dá para tirar')>=0,'a mineradora mostra o total que ainda dá para tirar');
ok(painel().indexOf('Sai para o')>=0,'e para onde ela joga o minério');

console.log('\n=== COM ALGO PARA CONSTRUIR NA MÃO ===');
Inv.add(p.inv,'stone_furnace',3);
p.hotbar=0;
// o item de construção está no primeiro slot, que é o da barra rápida
apontar(mato.x,mato.y);
const comMao=painel();
ok(comMao.indexOf('Na mão')>=0,'apontando o mato com forno na mão, o painel mostra o que vai construir');
ok(comMao.indexOf('R gira')>=0,'e lembra que R gira');

console.log('\n=== FORA DO MUNDO ===');
apontar(C.MUNDO_MAX+5,0);
ok(painel().indexOf('Na mão')>=0 || painel()==='','fora do mundo não quebra o painel');

console.log('\n=== A TARJA DO TOPO NÃO EXISTE MAIS ===');
const html=fs.readFileSync(path.join(RAIZ,'index.html'),'utf8');
ok(html.indexOf('id="cursor-info"')<0,'o #cursor-info saiu do index.html');
ok(html.indexOf('id="inspetor"')>=0,'o #inspetor entrou no lugar');
ok(fs.readFileSync(path.join(RAIZ,'src/js/game/render.js'),'utf8').indexOf('// barra de progresso')<0,
   'a barra de progresso saiu de baixo das estruturas');

console.log('\n=== CACHE DO NAVEGADOR ===');
const scripts=[...html.matchAll(/src="(src\/js[^"]+)"/g)].map(m=>m[1]);
const css=[...html.matchAll(/href="(src\/css[^"]+)"/g)].map(m=>m[1]);
ok(scripts.every(s=>/\?v=/.test(s)),'todo script tem ?v= (senão o navegador serve a versão velha)');
ok(css.every(s=>/\?v=/.test(s)),'todo css tem ?v=');
const versoes=new Set([...scripts,...css].map(s=>s.split('?v=')[1]));
ok(versoes.size===1,'todos na mesma versão ('+[...versoes].join(', ')+')');

console.log('\n=== FABRICAÇÃO EM SEÇÕES ===');
const cats={};
D.HAND_RECIPES.forEach(r=>{ const c=D.categoriaDaReceita(r); (cats[c]=cats[c]||[]).push(r.saida); });
for(const c of D.CATEGORIAS) console.log('  '+c.nome.padEnd(12)+(cats[c.id]||[]).join(', '));
ok(D.HAND_RECIPES.every(r=>D.CATEGORIAS.some(c=>c.id===D.categoriaDaReceita(r))),
   'toda receita cai numa seção que existe');
ok((cats.ferramenta||[]).length>=4,'as picaretas estão na seção de ferramentas');
ok((cats.estrutura||[]).indexOf('stone_furnace')>=0 && (cats.estrutura||[]).indexOf('wooden_chest')>=0,
   'forno e baú estão na seção de estruturas');
ok((cats.ferramenta||[]).indexOf('stone_furnace')<0,'o forno não está junto das picaretas');

console.log(falhas ? '\n'+falhas+' falha(s).\n' : '\nTudo certo.\n');
process.exit(falhas?1:0);
