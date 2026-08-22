const fs=require('fs'), path=require('path'), vm=require('vm');
const RAIZ = require('path').join(__dirname, '..');
global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; const win=global;
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=win.FZ, D=FZ.Data, World=FZ.World;

console.log('Checando 40 sementes aleatorias — comeco jogavel em raio de 40 tiles?\n');
console.log('semente   arv  ped  carv ferro cobr pedra  spawn        2x2 livres  veredito');
let ruins=0;
for(let n=0;n<40;n++){
  const seed = FZ.Saves.randomSeed();
  World.init(seed,null);
  const c={1:0,2:0,3:0,4:0,5:0,6:0};
  let livres2x2=0;
  for(let y=-40;y<40;y++) for(let x=-40;x<40;x++){
    const r=World.resAt(x,y); if(r) c[r]++;
    if(World.podeConstruir('stone_furnace',x,y)) livres2x2++;
  }
  const sp=World.acharSpawn();
  // precisa: madeira (arvore), pedra (pedregulho OU jazida de pedra), carvao, ferro
  const temMadeira=c[1]>=20, temPedra=(c[2]*8 + c[6])>=40, temCarvao=c[3]>=15, temFerro=c[4]>=15, temCobre=c[5]>=15;
  const bom = temMadeira&&temPedra&&temCarvao&&temFerro&&temCobre&&livres2x2>500;
  if(!bom) ruins++;
  console.log(
    seed.padEnd(9),
    String(c[1]).padStart(4), String(c[2]).padStart(4), String(c[3]).padStart(4),
    String(c[4]).padStart(5), String(c[5]).padStart(4), String(c[6]).padStart(5),
    ' ('+sp.x+','+sp.y+')'.padEnd(10),
    String(livres2x2).padStart(9),
    '  ', bom?'ok':'>>> RUIM: '+[!temMadeira&&'madeira',!temPedra&&'pedra',!temCarvao&&'carvao',!temFerro&&'ferro',!temCobre&&'cobre',livres2x2<=500&&'espaco'].filter(Boolean).join(',')
  );
}
console.log('\nsementes com comeco problematico: '+ruins+'/40');
process.exit(ruins>0?1:0);
