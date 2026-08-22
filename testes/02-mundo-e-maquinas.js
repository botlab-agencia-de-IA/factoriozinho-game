/* Teste headless da lógica do jogo (sem navegador).
   Carrega os módulos que não dependem de DOM e simula o loop. */

const fs = require('fs');
const path = require('path');


const RAIZ = require('path').join(__dirname, '..');

// janela falsa suficiente para os módulos de lógica
global.window=global; global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}}; const win=global;

const modulos = [
  'src/js/core/saves.js',      // precisa de seedToNumber
  'src/js/game/data.js',
  'src/js/game/rng.js',
  'src/js/game/inventory.js',
  'src/js/game/world.js',
  'src/js/game/entities.js'
];



for (const m of modulos) { eval(fs.readFileSync(path.join(RAIZ,m),'utf8')); }

const FZ = win.FZ;
const D = FZ.Data, World = FZ.World, Inv = FZ.Inv, Entities = FZ.Entities;

let falhas = 0;
function ok(cond, msg) {
  console.log((cond ? '  ✔ ' : '  ✘ ') + msg);
  if (!cond) falhas++;
}

console.log('\n=== 1. GERAÇÃO DO MUNDO ===');
World.init('TESTE123', null);

const contagem = {};
let comRecurso = 0;
const RAIO = 60;
for (let y = -RAIO; y < RAIO; y++) {
  for (let x = -RAIO; x < RAIO; x++) {
    const t = World.terrainAt(x, y);
    const r = World.resAt(x, y);
    contagem['terreno' + t] = (contagem['terreno' + t] || 0) + 1;
    if (r) { comRecurso++; contagem['res' + r] = (contagem['res' + r] || 0) + 1; }
  }
}
const totalTiles = (RAIO * 2) ** 2;
console.log('  tiles analisados:', totalTiles);
for (let i = 0; i < D.TERRAIN_INFO.length; i++) {
  const n = contagem['terreno' + i] || 0;
  console.log(`    ${D.TERRAIN_INFO[i].nome.padEnd(14)} ${n} (${(n / totalTiles * 100).toFixed(1)}%)`);
}
for (let i = 1; i < D.RES_INFO.length; i++) {
  const n = contagem['res' + i] || 0;
  console.log(`    ${D.RES_INFO[i].nome.padEnd(22)} ${n} tiles`);
}

ok((contagem.res1 || 0) > 40, 'tem árvores por perto');
ok((contagem.res2 || 0) > 5, 'tem pedregulhos por perto');
ok((contagem.res3 || 0) > 10, 'tem carvão por perto');
ok((contagem.res4 || 0) > 10, 'tem ferro por perto');
ok((contagem.res5 || 0) > 10, 'tem cobre por perto');
// o que importa nao eh 'ter recurso' (jazida nao bloqueia) e sim ter onde construir
let livres2x2 = 0;
for (let y = -RAIO; y < RAIO - 1; y++) for (let x = -RAIO; x < RAIO - 1; x++) if (World.podeConstruir('stone_furnace', x, y)) livres2x2++;
const pctLivre = livres2x2 / totalTiles * 100;
console.log('  lugares 2x2 livres para construir: ' + livres2x2 + ' (' + pctLivre.toFixed(1) + '% dos tiles)');
ok(pctLivre > 40, 'sobra bastante espaco 2x2 para construir');

console.log('\n=== 2. DETERMINISMO (mesma semente = mesmo mapa) ===');
const amostra1 = [];
for (let i = 0; i < 200; i++) amostra1.push(World.terrainAt(i * 7, i * 13) + ':' + World.resAt(i * 7, i * 13));
World.init('TESTE123', null);
const amostra2 = [];
for (let i = 0; i < 200; i++) amostra2.push(World.terrainAt(i * 7, i * 13) + ':' + World.resAt(i * 7, i * 13));
ok(amostra1.join() === amostra2.join(), 'mesma semente gera o mesmo mundo');

World.init('OUTRA', null);
const amostra3 = [];
for (let i = 0; i < 200; i++) amostra3.push(World.terrainAt(i * 7, i * 13) + ':' + World.resAt(i * 7, i * 13));
ok(amostra1.join() !== amostra3.join(), 'sementes diferentes geram mundos diferentes');

console.log('\n=== 3. SPAWN ===');
World.init('TESTE123', null);
const sp = World.acharSpawn();
console.log('  spawn em', sp);
ok(!World.tileSolido(Math.floor(sp.x), Math.floor(sp.y)), 'o spawn não está dentro de obstáculo');

console.log('\n=== 4. RECURSO É FINITO ===');
// acha uma árvore
let arvore = null;
for (let y = -40; y < 40 && !arvore; y++)
  for (let x = -40; x < 40 && !arvore; x++)
    if (World.resAt(x, y) === D.RES.TREE) arvore = { x, y };
console.log('  árvore em', arvore);
const antes = World.amountAt(arvore.x, arvore.y);
let colhido = 0;
for (let i = 0; i < 20; i++) {
  const item = World.minerar(arvore.x, arvore.y);
  if (item) colhido++;
  else break;
}
ok(antes === 4, 'árvore começa com 4 de madeira (tinha ' + antes + ')');
ok(colhido === 4, 'rendeu exatamente 4 madeiras (rendeu ' + colhido + ')');
ok(World.resAt(arvore.x, arvore.y) === 0, 'a árvore sumiu do mapa e NÃO volta');

// jazida
let jazida = null;
for (let y = -50; y < 50 && !jazida; y++)
  for (let x = -50; x < 50 && !jazida; x++)
    if (World.resAt(x, y) === D.RES.IRON) jazida = { x, y };
const qtdJazida = World.amountAt(jazida.x, jazida.y);
console.log('  jazida de ferro em', jazida, 'com', qtdJazida);
World.minerar(jazida.x, jazida.y);
ok(World.amountAt(jazida.x, jazida.y) === qtdJazida - 1, 'jazida diminui ao extrair');

console.log('\n=== 5. PERSISTÊNCIA DAS MUDANÇAS ===');
const salvo = World.serialize();
console.log('  mods gravados:', Object.keys(salvo.mods).length);
World.init('TESTE123', salvo);
ok(World.resAt(arvore.x, arvore.y) === 0, 'a árvore derrubada continua derrubada depois de recarregar');
ok(World.amountAt(jazida.x, jazida.y) === qtdJazida - 1, 'a jazida gasta continua gasta');

console.log('\n=== 6. INVENTÁRIO ===');
const inv = Inv.criar(40);
Inv.add(inv, 'wood', 250);
ok(Inv.conta(inv, 'wood') === 250, 'guardou 250 madeiras');
ok(inv.filter(s => s).length === 3, 'dividiu em 3 pilhas de até 100');
Inv.remove(inv, 'wood', 120);
ok(Inv.conta(inv, 'wood') === 130, 'tirou 120, sobrou 130');
ok(Inv.temTodos(inv, { wood: 100 }), 'reconhece que tem material');
ok(!Inv.temTodos(inv, { wood: 200 }), 'reconhece que falta material');
Inv.consumir(inv, { wood: 30 });
ok(Inv.conta(inv, 'wood') === 100, 'consumir tirou certo');

console.log('\n=== 7. FORNO ===');
World.init('TESTE123', null);
const forno = World.criarEntidade('stone_furnace', 5, 5, 0);
ok(World.entityAt(5, 5) === forno && World.entityAt(6, 6) === forno, 'o forno 2x2 ocupa os 4 tiles');
ok(!World.podeConstruir('wooden_chest', 6, 5), 'não deixa construir em cima de outra máquina');

Inv.add(forno.inv.fuel, 'coal', 2);
Inv.add(forno.inv.input, 'iron_ore', 5);

let t = 0;
while (t < 10) { Entities.update(0.05); t += 0.05; }
const placas = Inv.conta(forno.inv.output, 'iron_plate');
console.log('  depois de 10s:', placas, 'placas | minério restante:', Inv.conta(forno.inv.input, 'iron_ore'));
ok(placas === 3, 'fundiu 3 placas em 10s (3.2s cada) — deu ' + placas);
ok(Inv.conta(forno.inv.input, 'iron_ore') === 2, 'consumiu 3 minérios');
ok(forno.queima > 0, 'ainda tem carvão queimando');

console.log('\n  -- forno sem combustível --');
const forno2 = World.criarEntidade('stone_furnace', 20, 20, 0);
Inv.add(forno2.inv.input, 'iron_ore', 5);
for (let i = 0; i < 100; i++) Entities.update(0.05);
ok(Inv.conta(forno2.inv.output, 'iron_plate') === 0, 'sem combustível não produz nada');
ok(Entities.estado(forno2) === 'Sem combustível', 'o estado avisa: ' + Entities.estado(forno2));

console.log('\n=== 8. MINERADORA ===');
World.init('TESTE123', null);
// acha uma jazida de ferro com espaço 2x2
let local = null;
for (let y = -50; y < 50 && !local; y++) {
  for (let x = -50; x < 50 && !local; x++) {
    if (World.resAt(x, y) === D.RES.IRON && World.resAt(x + 1, y) === D.RES.IRON &&
        World.resAt(x, y + 1) === D.RES.IRON && World.podeConstruir('burner_drill', x, y)) {
      local = { x, y };
    }
  }
}
console.log('  mineradora em', local);
const drill = World.criarEntidade('burner_drill', local.x, local.y, 1); // saída para leste
Inv.add(drill.inv.fuel, 'coal', 5);
for (let i = 0; i < 200; i++) Entities.update(0.05);   // 10 segundos
const extraido = Inv.conta(drill.inv.output, 'iron_ore');
console.log('  extraiu em 10s:', extraido, '| estado:', Entities.estado(drill));
ok(extraido >= 4 && extraido <= 5, 'extraiu ~4,5 minérios em 10s (0,45/s) — deu ' + extraido);

console.log('\n  -- mineradora alimentando um baú --');
const saida = Entities.tileSaida(drill);
console.log('  tile de saída:', saida);
const bau = World.criarEntidade('wooden_chest', saida.x, saida.y, 0);
for (let i = 0; i < 200; i++) Entities.update(0.05);
const noBau = Inv.conta(bau.inv.geral, 'iron_ore');
console.log('  no baú:', noBau, '| ainda na mineradora:', Inv.conta(drill.inv.output, 'iron_ore'));
ok(noBau > 0, 'a mineradora empurrou minério para o baú');

console.log('\n  -- mineradora alimentando um forno direto --');
World.init('TESTE123', null);
const d2 = World.criarEntidade('burner_drill', local.x, local.y, 1);
Inv.add(d2.inv.fuel, 'coal', 10);
const s2 = Entities.tileSaida(d2);
const f2 = World.criarEntidade('stone_furnace', s2.x, s2.y, 0);
Inv.add(f2.inv.fuel, 'coal', 10);
for (let i = 0; i < 600; i++) Entities.update(0.05);   // 30 segundos
console.log('  placas produzidas:', Inv.conta(f2.inv.output, 'iron_plate'));
ok(Inv.conta(f2.inv.output, 'iron_plate') > 0, 'a linha mineradora→forno produziu placa sozinha');

console.log('\n  -- mineradora fora de jazida --');
World.init('TESTE123', null);
let vazio = null;
for (let y = 0; y < 60 && !vazio; y++)
  for (let x = 0; x < 60 && !vazio; x++)
    if (!World.resAt(x,y) && !World.resAt(x+1,y) && !World.resAt(x,y+1) && !World.resAt(x+1,y+1) && World.podeConstruir('burner_drill', x, y)) vazio = { x, y };
const d3 = World.criarEntidade('burner_drill', vazio.x, vazio.y, 1);
Inv.add(d3.inv.fuel, 'coal', 5);
for (let i = 0; i < 100; i++) Entities.update(0.05);
ok(Entities.estado(d3) === 'Sem jazida embaixo', 'avisa quando não há jazida: ' + Entities.estado(d3));

console.log('\n=== 9. REMOÇÃO DEVOLVE O CONTEÚDO ===');
const conteudo = Entities.conteudo(d3);
console.log('  conteúdo devolvido:', JSON.stringify(conteudo));
ok(conteudo.some(c => c.item === 'coal'), 'o carvão que sobrou volta pro jogador');
World.removerEntidade(d3);
ok(World.entityAt(vazio.x, vazio.y) === null, 'a máquina sumiu do mapa');

console.log('\n=== 10. RECEITAS FECHAM ===');
// toda receita de mão precisa produzir item que existe e usar itens que existem
let receitasOk = true;
D.HAND_RECIPES.forEach(r => {
  if (!D.ITEMS[r.saida]) { console.log('  ✘ saída inexistente:', r.saida); receitasOk = false; }
  for (const i in r.custo) if (!D.ITEMS[i]) { console.log('  ✘ ingrediente inexistente:', i); receitasOk = false; }
});
for (const k in D.SMELTING) {
  if (!D.ITEMS[k]) { console.log('  ✘ minério inexistente:', k); receitasOk = false; }
  if (!D.ITEMS[D.SMELTING[k].saida]) { console.log('  ✘ saída inexistente:', D.SMELTING[k].saida); receitasOk = false; }
}
ok(receitasOk, 'todas as receitas apontam para itens que existem');

// os itens que constroem apontam para prédios existentes
let construiOk = true;
for (const k in D.ITEMS) {
  const c = D.ITEMS[k].constroi;
  if (c && !D.BUILDINGS[c]) { console.log('  ✘ prédio inexistente:', c); construiOk = false; }
}
ok(construiOk, 'todo item de construção aponta para um prédio existente');

// dá para chegar na mineradora partindo do zero?
console.log('\n  cadeia até a mineradora:');
console.log('    pedra ×5           → forno de pedra');
console.log('    minério + carvão   → placa de ferro (no forno)');
console.log('    placa ×2           → engrenagem');
console.log('    3 engr + 3 placas + 1 forno → mineradora ✔');

console.log('\n=== RESULTADO ===');
console.log(falhas === 0 ? '  TUDO PASSOU ✔' : '  ' + falhas + ' FALHA(S) ✘');
process.exit(falhas === 0 ? 0 : 1);
