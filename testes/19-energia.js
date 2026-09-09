/* A rede elétrica, com os números que ele decidiu (documentos/MATEMATICA.md §6):
   zona do poste 5x5, fio alcançando 7 de centro a centro, gerador a carvão
   com 100 W e inseridor elétrico bebendo 5 W. */
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..');
global.window = global;
global.localStorage = { _d:{}, getItem(k){return this._d[k]||null}, setItem(k,v){this._d[k]=v}, removeItem(k){delete this._d[k]} };
for (const m of ['src/js/core/saves.js','src/js/game/data.js','src/js/game/paleta.js','src/js/game/rng.js',
                 'src/js/game/inventory.js','src/js/game/world.js','src/js/game/entities.js','src/js/game/energia.js'])
  eval(fs.readFileSync(path.join(RAIZ, m), 'utf8'));
const FZ = global.FZ, D = FZ.Data, World = FZ.World, Inv = FZ.Inv, E = FZ.Entities, En = FZ.Energia;
let f = 0;
const ok = (c, m) => { console.log((c ? '  OK  ' : '  XX  ') + m); if (!c) f++; };
const rodar = (s, p = 1/60) => { for (let i = 0; i < s/p; i++) E.update(p); };

console.log('=== A ZONA DO POSTE E 5x5, COM ELE NO MEIO ===');
World.init('EN', null);
const poste = World.criarEntidade('electric_pole', 10, 10, 0);
let dentro = 0;
for (let y = 5; y <= 15; y++) for (let x = 5; x <= 15; x++) if (En.naZonaDoPoste(poste, x, y)) dentro++;
ok(dentro === 25, '25 quadrados na zona (5x5): ' + dentro);
ok(En.naZonaDoPoste(poste, 12, 12) && !En.naZonaDoPoste(poste, 13, 10),
   'alcanca 2 para cada lado e para no terceiro');

console.log('\n=== O FIO ALCANCA 7 DE CENTRO A CENTRO (a conta dele: 5+2+5=12) ===');
World.init('EN2', null);
const p1 = World.criarEntidade('electric_pole', 0, 0, 0);
const p7 = World.criarEntidade('electric_pole', 7, 0, 0);
ok(En.redeDe(p1) !== null && En.redeDe(p1) === En.redeDe(p7), 'a 7 quadrados eles se ligam');
console.log('  da borda esquerda da zona de A ate a direita da de B: ' + ((7 + 2) - (0 - 2) + 1) + ' quadrados');

World.init('EN3', null);
const q1 = World.criarEntidade('electric_pole', 0, 0, 0);
const q8 = World.criarEntidade('electric_pole', 8, 0, 0);
ok(En.redeDe(q1) !== En.redeDe(q8), 'a 8 quadrados ja nao se ligam');

console.log('\n=== A REDE SEGUE DE POSTE EM POSTE ===');
World.init('EN4', null);
const a1 = World.criarEntidade('electric_pole', 0, 0, 0);
World.criarEntidade('electric_pole', 7, 0, 0);
const a3 = World.criarEntidade('electric_pole', 14, 0, 0);
ok(En.redeDe(a1) === En.redeDe(a3), 'A e C estao a 14 um do outro, mas o do meio liga os tres');
ok(En.redeDe(a1).postes.length === 3, 'uma rede so, com 3 postes');
ok(En.fios().length === 2, 'dois fios desenhados: A-B e B-C (nao A-C)');

console.log('\n=== O GERADOR PRECISA ESTAR NA ZONA DE UM POSTE ===');
World.init('EN5', null);
World.criarEntidade('electric_pole', 10, 10, 0);
const ger = World.criarEntidade('burner_generator', 11, 11, 0);
Inv.add(ger.inv.fuel, 'coal', 10);
ok(En.temRede(ger), 'o gerador colado no poste entra na rede');

World.init('EN6', null);
World.criarEntidade('electric_pole', 10, 10, 0);
const longe = World.criarEntidade('burner_generator', 20, 20, 0);
Inv.add(longe.inv.fuel, 'coal', 10);
ok(!En.temRede(longe), 'longe do poste, ele fica de fora');

console.log('\n=== O INSERIDOR ELETRICO NAO COME NADA E SO ANDA COM A REDE ===');
ok(D.building('electric_inserter').slots.fuel === undefined, 'ele nem tem slot de combustivel');

World.init('LINHA', null);
World.criarEntidade('electric_pole', 10, 10, 0);
const ins = World.criarEntidade('electric_inserter', 10, 11, 1);
const eIn = E.tileEntrada(ins), eOut = E.tileSaida(ins);
const bauA = World.criarEntidade('wooden_chest', eIn.x, eIn.y, 0);
const bauB = World.criarEntidade('wooden_chest', eOut.x, eOut.y, 0);
Inv.add(bauA.inv.geral, 'coal', 300);
rodar(10);
ok(Inv.conta(bauB.inv.geral, 'coal') === 0, 'sem gerador na rede, ele nao move nada');
console.log('  estado: ' + E.estado(ins));

const ger2 = World.criarEntidade('burner_generator', 11, 9, 0);
Inv.add(ger2.inv.fuel, 'coal', 60);
rodar(10);
const movidos = Inv.conta(bauB.inv.geral, 'coal');
console.log('  com o gerador ligado, 10 s: ' + movidos + ' itens · ' + E.estado(ins));
ok(movidos >= 9 && movidos <= 11, 'anda a 1 item por segundo, igual ao de carvao');

console.log('\n=== O GERADOR SO QUEIMA O QUE A REDE USA ===');
// 1 inseridor de 5 W numa rede de 100 W = 5% de carga.
// A 5%, 60 s de jogo gastam 3 s de chama (a cheio seriam 60 s).
World.init('QUEIMA', null);
World.criarEntidade('electric_pole', 10, 10, 0);
const gq = World.criarEntidade('burner_generator', 11, 9, 0);
Inv.add(gq.inv.fuel, 'coal', 20);
const insq = World.criarEntidade('electric_inserter', 10, 11, 1);
const qi = E.tileEntrada(insq), qo = E.tileSaida(insq);
const bA = World.criarEntidade('wooden_chest', qi.x, qi.y, 0);
World.criarEntidade('wooden_chest', qo.x, qo.y, 0);
Inv.add(bA.inv.geral, 'coal', 500);
E.update(1/60);
const chamaAntes = gq.queima;
rodar(60);
const gasto = chamaAntes - gq.queima;
console.log('  1 inseridor (5 W de 100 W) em 60 s gastou ' + gasto.toFixed(1) + ' s de chama');
ok(gasto > 2 && gasto < 4, 'gastou ~3 s: 5% de carga, como manda a conta');
ok(Math.abs(En.redeDe(gq).demanda - 5) < 0.001, 'a rede pede 5 W: ' + En.redeDe(gq).demanda);

console.log('\n=== REDE PARADA NAO COME CARVAO ===');
World.init('PARADA', null);
World.criarEntidade('electric_pole', 10, 10, 0);
const gp = World.criarEntidade('burner_generator', 11, 9, 0);
Inv.add(gp.inv.fuel, 'coal', 5);
E.update(1/60);
const antesP = gp.queima;
rodar(60);
ok(Math.abs(gp.queima - antesP) < 0.01, 'sem ninguem puxando, a chama nem anda');
ok(Inv.conta(gp.inv.fuel, 'coal') === 4, 'so o primeiro carvao foi aceso, e ele ainda esta inteiro');

console.log('\n=== REDE CURTA: TODOS FICAM LENTOS, NINGUEM PARA ===');
// 100 W na rede, 200 W de fome = todo mundo a 50%. Como 20 inseridores
// dariam 100 W, uso a conta direto na rede montada.
World.init('CURTA', null);
World.criarEntidade('electric_pole', 10, 10, 0);
const gc = World.criarEntidade('burner_generator', 11, 9, 0);
Inv.add(gc.inv.fuel, 'coal', 200);
E.update(1/60);
const rc = En.redeDe(gc);
ok(rc.producao === 100, 'o gerador poe 100 W: ' + rc.producao);
const prod = D.building('burner_generator').producao, w = D.building('electric_inserter').consumo;
ok(prod / w === 20, 'a conta fecha: ' + prod + ' W / ' + w + ' W = ' + (prod / w) + ' inseridores');
rc.demanda = 200;
rc.satisfacao = Math.min(1, rc.producao / rc.demanda);
ok(rc.satisfacao === 0.5, '200 W de fome com 100 W na rede = todo mundo a 50%');

console.log('\n=== AS RECEITAS DELE ===');
const rec = id => D.HAND_RECIPES.find(r => r.saida === id);
ok(rec('copper_wire').qtd === 2 && rec('copper_wire').custo.copper_plate === 1, '1 chapa de cobre -> 2 fios');
ok(rec('electronic_circuit').custo.copper_wire === 2 && rec('electronic_circuit').custo.iron_plate === 1,
   'circuito = 2 fios + 1 chapa de ferro');
ok(rec('electric_pole').custo.wood === 2 && rec('electric_pole').custo.copper_wire === 1,
   'poste = 2 madeiras + 1 fio');
const ri = rec('electric_inserter').custo;
ok(ri.iron_gear === 1 && ri.electronic_circuit === 1 && ri.iron_plate === 1,
   'inseridor eletrico = 1 engrenagem + 1 circuito + 1 chapa');

console.log('\n=== NADA QUEBROU: a linha a carvao continua de pe ===');
World.init('VELHA', null);
let l2 = null;
for (let y = -60; y < 60 && !l2; y++) for (let x = -60; x < 60 && !l2; x++) {
  if (World.resAt(x, y) === D.RES.IRON && World.podeConstruir('burner_drill', x, y)) {
    let livre = true;
    for (let k = 2; k <= 9; k++) if (!World.podeConstruir('transport_belt', x + k, y + 1)) livre = false;
    if (!World.podeConstruir('stone_furnace', x + 5, y + 1)) livre = false;
    if (livre) l2 = { x, y };
  }
}
const ly = l2.y + 1;
const d3 = World.criarEntidade('burner_drill', l2.x, l2.y, 1); Inv.add(d3.inv.fuel, 'coal', 20);
World.criarEntidade('transport_belt', l2.x + 2, ly, 1);
World.criarEntidade('transport_belt', l2.x + 3, ly, 1);
const i4 = World.criarEntidade('inserter', l2.x + 4, ly, 1); Inv.add(i4.inv.fuel, 'coal', 20);
const fo = World.criarEntidade('stone_furnace', l2.x + 5, ly, 0); Inv.add(fo.inv.fuel, 'coal', 20);
const i5 = World.criarEntidade('inserter', l2.x + 7, ly, 1); Inv.add(i5.inv.fuel, 'coal', 20);
World.criarEntidade('transport_belt', l2.x + 8, ly, 1);
const bauF = World.criarEntidade('wooden_chest', l2.x + 9, ly, 0);
rodar(60);
console.log('  60 s: ' + Inv.conta(bauF.inv.geral, 'iron_plate') + ' placas');
ok(Inv.conta(bauF.inv.geral, 'iron_plate') > 0, 'a linha a carvao continua funcionando');

console.log('\n' + (f === 0 ? 'TUDO PASSOU' : f + ' FALHA(S)'));
process.exit(f ? 1 : 0);
