/* ============================================================
   Testa se as regiões de minério ainda entregam o quadriculado
   dos chunks (§8.5 do GDD).

   A ideia da medida: andando de coluna em coluna pelo mapa,
   contar quantas vezes o minério da região muda de uma coluna
   para a outra. Se as regiões forem os chunks, TODAS as trocas
   caem nas colunas múltiplas de 32 e nenhuma no meio — é isso
   que o olho lê como quadriculado. Num mapa orgânico as trocas
   se espalham, e a coluna da grade não tem nada de especial.
   ============================================================ */
const fs=require('fs'), path=require('path');
const RAIZ = path.join(__dirname, '..');
global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; const win=global;
for(const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/rng.js','src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js'])
  eval(fs.readFileSync(path.join(RAIZ,m),'utf8'));
const FZ=win.FZ, D=FZ.Data, World=FZ.World, C=D.CONFIG, RES=D.RES;

let falhas=0;
const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m); if(!c)falhas++;};
const MIN=C.MUNDO_MIN, MAX=C.MUNDO_MAX, CH=C.CHUNK;

/* --------- a medida do quadriculado --------- */
function medir(eixo){
  const passo=2;                       // amostra metade das linhas: chega e sobra
  const naGrade=[], noMeio=[];
  let anterior=null;
  for(let a=MIN;a<=MAX;a++){
    const linha=[];
    for(let b=MIN;b<=MAX;b+=passo)
      linha.push(eixo==='x' ? World.minerioDaRegiao(a,b) : World.minerioDaRegiao(b,a));
    if(anterior){
      let trocas=0;
      for(let i=0;i<linha.length;i++) if(linha[i]!==anterior[i]) trocas++;
      (((a%CH)+CH)%CH===0 ? naGrade : noMeio).push(trocas);
    }
    anterior=linha;
  }
  const media=v=>v.reduce((s,n)=>s+n,0)/v.length;
  const soma=v=>v.reduce((s,n)=>s+n,0);
  return {
    mediaGrade: media(naGrade),
    mediaMeio: media(noMeio),
    razao: media(noMeio)>0 ? media(naGrade)/media(noMeio) : Infinity,
    fatiaNaGrade: soma(naGrade)/(soma(naGrade)+soma(noMeio)),
    colunasGrade: naGrade.length,
    colunasMeio: noMeio.length
  };
}

console.log('\n=== O QUADRICULADO DOS CHUNKS (§8.5) ===');
console.log('  Antes, com um minério por chunk: 100% das trocas caíam nas');
console.log('  linhas da grade e ZERO no meio — razão infinita.');
console.log('  O ideal é razão perto de 1,00: a linha da grade não é especial.\n');

const SEMENTES=['TESTE123','FACTORIO','VANDRE01'];
let piorRazao=0, piorFatia=0;
for(const s of SEMENTES){
  World.init(s,null);
  const h=medir('x'), v=medir('y');
  console.log('  semente '+s+
    '   vertical: razão '+h.razao.toFixed(2)+
    '  |  horizontal: razão '+v.razao.toFixed(2));
  console.log('              trocas por linha: na grade '+h.mediaGrade.toFixed(1)+
    ' / no meio '+h.mediaMeio.toFixed(1)+
    '   — a grade fica com '+(h.fatiaNaGrade*100).toFixed(1)+'% das trocas (o justo é '+
    (h.colunasGrade/(h.colunasGrade+h.colunasMeio)*100).toFixed(1)+'%)');
  piorRazao=Math.max(piorRazao,h.razao,v.razao);
  piorFatia=Math.max(piorFatia,h.fatiaNaGrade,v.fatiaNaGrade);
}
console.log('');
ok(piorRazao<2.0,'a linha da grade não tem mais troca que o resto (pior razão '+piorRazao.toFixed(2)+', limite 2,00)');
ok(piorFatia<0.10,'as linhas da grade ficam com menos de 10% das trocas (pior '+(piorFatia*100).toFixed(1)+'%)');

/* --------- o mapa continua servindo para jogar --------- */
console.log('\n=== O MUNDO CONTINUA COMPLETO ===');
World.init('TESTE123',null);
const t0=Date.now();
World.gerarTudo();
const tempo=Date.now()-t0;
console.log('  mundo inteiro gerado em '+tempo+' ms');
ok(tempo<3000,'geração abaixo de 3s ('+tempo+' ms)');

const DUROS=[['carvão',RES.COAL,20],['ferro',RES.IRON,22],['cobre',RES.COPPER,18],
             ['pedra',RES.STONE,18],['ouro',RES.GOLD,10],['petróleo',RES.OIL,7],['urânio',RES.URANIUM,5]];
const conta={}; let totalDuro=0;
for(let y=MIN;y<=MAX;y++) for(let x=MIN;x<=MAX;x++){
  const r=World.resAt(x,y); if(!r) continue;
  conta[r]=(conta[r]||0)+1;
  if(DUROS.some(d=>d[1]===r)) totalDuro++;
}
console.log('  minério        tiles    fatia   esperado');
let proporcaoOk=true;
for(const [nome,id,alvo] of DUROS){
  const n=conta[id]||0, fatia=n/totalDuro*100;
  console.log('  '+nome.padEnd(12)+String(n).padStart(7)+'   '+fatia.toFixed(1).padStart(5)+'%   '+String(alvo).padStart(4)+'%');
  if(n===0) proporcaoOk=false;
  // as células do Voronoi têm áreas diferentes, então a fatia oscila em
  // torno do alvo — cobrar metade/dobro já pega qualquer deformação feia
  if(fatia < alvo*0.45 || fatia > alvo*1.9) proporcaoOk=false;
}
ok(proporcaoOk,'todo minério existe e fica perto da proporção pedida');

/* --------- as regiões se misturam de verdade --------- */
console.log('\n=== AS REGIÕES SE MISTURAM ===');
let comVizinhoDiferente=0, comJazida=0;
for(let y=MIN+8;y<=MAX-8;y+=3) for(let x=MIN+8;x<=MAX-8;x+=3){
  const r=World.resAt(x,y);
  if(!DUROS.some(d=>d[1]===r)) continue;
  comJazida++;
  let achou=false;
  for(let dy=-8;dy<=8&&!achou;dy+=2) for(let dx=-8;dx<=8&&!achou;dx+=2){
    const o=World.resAt(x+dx,y+dy);
    if(o && o!==r && DUROS.some(d=>d[1]===o)) achou=true;
  }
  if(achou) comVizinhoDiferente++;
}
const fatiaMista=comVizinhoDiferente/comJazida;
console.log('  '+(fatiaMista*100).toFixed(1)+'% das jazidas têm outro minério a até 8 tiles');
ok(fatiaMista>0.05,'existem lugares onde dois minérios se encostam ('+(fatiaMista*100).toFixed(1)+'%)');

/* --------- a semente continua mandando --------- */
console.log('\n=== MESMA SEMENTE, MESMO MUNDO ===');
World.init('REPETE99',null);
const amostra=[];
for(let i=0;i<600;i++){
  const x=MIN+((i*97)%C.MUNDO_TILES), y=MIN+((i*61)%C.MUNDO_TILES);
  amostra.push(World.resAt(x,y)+':'+World.terrainAt(x,y));
}
World.init('REPETE99',null);
let igual=true;
for(let i=0;i<600;i++){
  const x=MIN+((i*97)%C.MUNDO_TILES), y=MIN+((i*61)%C.MUNDO_TILES);
  if(amostra[i]!==World.resAt(x,y)+':'+World.terrainAt(x,y)) igual=false;
}
ok(igual,'gerar duas vezes a mesma semente dá o mesmo mundo');

World.init('OUTRA777',null);
let diferentes=0;
for(let i=0;i<600;i++){
  const x=MIN+((i*97)%C.MUNDO_TILES), y=MIN+((i*61)%C.MUNDO_TILES);
  if(amostra[i]!==World.resAt(x,y)+':'+World.terrainAt(x,y)) diferentes++;
}
ok(diferentes>200,'outra semente dá outro mundo ('+diferentes+'/600 tiles diferentes)');

/* --------- desenho para o olho conferir --------- */
console.log('\n=== O MAPA DAS REGIÕES (cada letra = 5 tiles) ===');
const LETRA={}; LETRA[RES.COAL]='c'; LETRA[RES.IRON]='F'; LETRA[RES.COPPER]='u';
LETRA[RES.STONE]='p'; LETRA[RES.GOLD]='O'; LETRA[RES.OIL]='.'; LETRA[RES.URANIUM]='U';
World.init('TESTE123',null);
for(let y=MIN;y<=MAX;y+=10){
  let linha='  ';
  for(let x=MIN;x<=MAX;x+=5) linha+=LETRA[World.minerioDaRegiao(x,y)]||'?';
  console.log(linha);
}
console.log('  c=carvão F=ferro u=cobre p=pedra O=ouro .=petróleo U=urânio');
console.log('  (as bordas de chunk ficam a cada 6,4 letras — não deve dar para achá-las)');

console.log(falhas ? '\n'+falhas+' falha(s).\n' : '\nTudo certo.\n');
process.exit(falhas?1:0);
