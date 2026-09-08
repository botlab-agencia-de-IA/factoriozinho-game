/* A mineradora cospe pelo lado direito da FACE dela, e o minério cai na
   faixa do lado de onde ele veio — não numa faixa fixa.
   Antes o cálculo comparava a posição do tile de saída com a da esteira.
   Só que o tile de saída É o tile da esteira, então a conta dava sempre
   zero e toda mineradora 2x2 jogava na faixa da direita, girasse para
   onde girasse. */
const fs=require('fs'), path=require('path');
const RAIZ = require('path').join(__dirname, '..');
global.window=global;
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=global.FZ,D=FZ.Data,World=FZ.World,Inv=FZ.Inv,E=FZ.Entities;
let f=0; const ok=(c,m)=>{console.log((c?'  OK  ':'  XX  ')+m); if(!c)f++;};
const NOME=['norte','leste','sul','oeste'];
const DX=[0,1,0,-1], DY=[-1,0,1,0];

console.log('=== O TILE DE SAIDA E O CANTO DIREITO DA FACE ===');
World.init('LADO',null);
// mineradora 2x2 em (10,10): ocupa (10,10) ate (11,11)
const esperado=[ {dir:0,x:11,y:9},   // aponta norte -> direita e leste  -> canto leste da face norte
                 {dir:1,x:12,y:11},  // aponta leste -> direita e sul    -> canto sul da face leste
                 {dir:2,x:10,y:12},  // aponta sul   -> direita e oeste  -> canto oeste da face sul
                 {dir:3,x:9,y:10} ]; // aponta oeste -> direita e norte  -> canto norte da face oeste
for(const c of esperado){
  const t=E.tileSaida({x:10,y:10,w:2,h:2,dir:c.dir,tipo:'burner_drill'});
  ok(t.x===c.x&&t.y===c.y, 'apontando '+NOME[c.dir]+' cospe em ('+t.x+','+t.y+')');
}

console.log('\n=== A FAIXA SAI DE ONDE O MINERIO VEM, NAO E FIXA ===');
// Para cada giro da mineradora e cada sentido da esteira, a faixa tem de
// ser a do lado em que a mineradora esta. Ficando a esteira perpendicular,
// um sentido da a faixa esquerda e o outro a direita — se as duas dessem
// a mesma faixa, o calculo estaria cego para o giro (era o bug).
for(let dm=0; dm<4; dm++){
  const dr={x:10,y:10,w:2,h:2,dir:dm,tipo:'burner_drill'};
  const t=E.tileSaida(dr);
  const perp=[(dm+1)%4,(dm+3)%4];   // os dois sentidos perpendiculares ao dela
  const faixas=perp.map(db=>{
    const lado=E.ladoDaEsteira({x:t.x,y:t.y,dir:db,tipo:'transport_belt'},dr);
    return lado>0?1:0;              // mineradora usa a faixa do lado dela
  });
  ok(faixas[0]!==faixas[1],
     'mineradora ao '+NOME[dm]+': esteira p/'+NOME[perp[0]]+' usa '+(faixas[0]?'DIR':'ESQ')+
     ' e p/'+NOME[perp[1]]+' usa '+(faixas[1]?'DIR':'ESQ'));

  // e o lado tem de bater com a geometria: a mineradora esta atras do
  // tile de saida, no sentido oposto ao que ela aponta
  for(const db of perp){
    const rx=-DY[db], ry=DX[db];                 // "direita" da esteira
    const ox=-DX[dm], oy=-DY[dm];                // da esteira de volta para a mineradora
    const geo=(ox*rx+oy*ry)>0?1:-1;
    ok(E.ladoDaEsteira({x:t.x,y:t.y,dir:db,tipo:'transport_belt'},dr)===geo,
       '  o lado bate com a geometria (esteira p/'+NOME[db]+')');
  }
}

console.log('\n=== NA PRATICA: o mesmo par girado nao muda de faixa por acaso ===');
function acharCarvao(){
  for(let y=-60;y<60;y++) for(let x=-60;x<60;x++)
    if(World.resAt(x,y)===D.RES.COAL && World.podeConstruir('burner_drill',x,y)) return {x,y};
  throw new Error('nao achei carvao');
}
// mineradora apontando NORTE, esteira correndo para OESTE em cima da saida:
// a mineradora fica ao SUL, que para quem vai ao oeste e a ESQUERDA.
World.init('P1',null);
const loc=acharCarvao();
const dr=World.criarEntidade('burner_drill',loc.x,loc.y,0);
Inv.add(dr.inv.fuel,'coal',30);
const t=E.tileSaida(dr);
const belt=World.criarEntidade('transport_belt',t.x,t.y,3);   // corre para o oeste
for(let i=0;i<40*60;i++) E.update(1/60);
console.log('  esquerda: '+belt.faixas[0].length+' | direita: '+belt.faixas[1].length);
ok(belt.faixas[0].length>0 && belt.faixas[1].length===0,
   'a mineradora ao sul de uma esteira que vai ao oeste usa a faixa ESQUERDA');

console.log('\n'+(f===0?'TUDO PASSOU':f+' FALHA(S)'));
process.exit(f?1:0);
