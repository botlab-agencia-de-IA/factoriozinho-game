/* ============================================================
   FACTORIOZINHO — PALETA DE CORES
   ============================================================

   ESTE É O ARQUIVO DAS CORES. É só aqui que se mexe em cor.

   As cores vêm do CORES.md, preenchido pelo Vandré.
   Cada item tem CINCO tons, sempre nesta ordem:

     [ 'BASE' , 'LUZ' , 'SOMBRA' , 'BRILHO' , 'SOMBRA PROFUNDA' ]
        │        │       │          │          │
        │        │       │          │          └── canto mais escuro, quina
        │        │       │          └───────────── ponto de luz, o reflexo
        │        │       └──────────────────────── parte de baixo
        │        └──────────────────────────────── parte de cima
        └───────────────────────────────────────── a cor principal ("cor piloto")

   PARA TROCAR UMA COR: mude só o texto entre aspas.
   Não mexa nas vírgulas, nos colchetes nem no nome antes dos dois pontos.

   REGRA DA FAMÍLIA: o minério é o material sujo — usa os tons mais escuros
   da mesma paleta. A barra/placa é o material limpo — usa os tons claros.
   A ferramenta daquele material usa a mesma tonalidade da barra.
   ============================================================ */

(function (global) {
  'use strict';

  /* Contorno em volta de tudo. */
  var CONTORNO = '#000000';

  /* ============================================================
     ITENS
     ============================================================ */
  var ITENS = {

    /* ---------- MADEIRA ---------- */
    wood:         ['#A86532', '#D69A58', '#784321', '#F0C27A', '#51301E'],

    /* ---------- PEDRA ---------- */
    stone:        ['#78838C', '#A7B2B8', '#515D66', '#D2DADF', '#35404A'],
    stone_brick:  ['#8A939B', '#B6C0C5', '#5F6A73', '#D2DADF', '#3E4952'],

    /* ---------- CARVÃO ---------- */
    coal:         ['#30383D', '#505B60', '#22292E', '#788388', '#151A1E'],

    /* ---------- FERRO ----------  minério = tons escuros · placa = tons claros */
    iron_ore:     ['#788F99', '#A9BEC7', '#526873', '#D4E3E7', '#3B4C55'],
    iron_plate:   ['#A9BEC7', '#D4E3E7', '#788F99', '#F2FAF8', '#526873'],
    iron_gear:    ['#A9BEC7', '#D4E3E7', '#788F99', '#F2FAF8', '#526873'],

    /* ---------- COBRE ---------- */
    copper_ore:   ['#913E2C', '#C66A3D', '#612D24', '#E69A60', '#451F19'],
    copper_plate: ['#C66A3D', '#E69A60', '#913E2C', '#FFC184', '#612D24'],

    /* ---------- OURO ---------- */
    gold_ore:     ['#C99A2D', '#F2CB55', '#8A651E', '#FFE38A', '#5F4614'],
    gold_plate:   ['#F2CB55', '#FFE38A', '#C99A2D', '#FFF8CF', '#8A651E'],

    /* ---------- URÂNIO ---------- (ainda a definir pelo Vandré) */
    uranium_ore:  ['#4aab4a', '#6fd46f', '#2f7a2f', '#9bec9b', '#1d521d'],

    /* ---------- AREIA E VIDRO ---------- (ainda a definir) */
    sand:         ['#d9c48a', '#eddda9', '#ad9a63', '#f7eec9', '#87764a'],
    glass:        ['#a8d8e8', '#cdeef8', '#7aacbd', '#e8f8ff', '#5a8494'],

    /* ---------- TERRA E ARGILA ---------- (ainda a definir) */
    soil:         ['#6b4f34', '#87684a', '#4c3722', '#a5855f', '#332314'],
    clay:         ['#a8674a', '#c48466', '#7d4a33', '#dba488', '#5a3323'],

    /* ---------- PETRÓLEO ---------- (ainda a definir) */
    crude_oil:    ['#25262c', '#3b3d46', '#131418', '#565a66', '#08090b'],

    /* ---------- FERRAMENTAS ----------
       usam a tonalidade da barra do material (regra da família) */
    wood_pickaxe:  ['#A86532', '#D69A58', '#784321', '#F0C27A', '#51301E'],
    stone_pickaxe: ['#78838C', '#A7B2B8', '#515D66', '#D2DADF', '#35404A'],
    iron_pickaxe:  ['#A9BEC7', '#D4E3E7', '#788F99', '#F2FAF8', '#526873'],
    gold_pickaxe:  ['#F2CB55', '#FFE38A', '#C99A2D', '#FFF8CF', '#8A651E'],

    /* ---------- CONSTRUÇÕES ---------- */
    stone_furnace:  ['#78838C', '#A7B2B8', '#515D66', '#D2DADF', '#35404A'],
    burner_drill:   ['#A9BEC7', '#D4E3E7', '#788F99', '#F2FAF8', '#526873'],
    wooden_chest:   ['#A86532', '#D69A58', '#784321', '#F0C27A', '#51301E'],
    transport_belt: ['#515D66', '#78838C', '#35404A', '#A7B2B8', '#22292E'],
    inserter:       ['#C99A2D', '#F2CB55', '#8A651E', '#FFE38A', '#5F4614']
  };

  /* ============================================================
     TERRENO (o chão e o mapa) — ainda a definir pelo Vandré
     ============================================================ */
  var TERRENO = {
    water:        ['#2b5d78', '#3d7a9a', '#1e4657', '#589cbd', '#132f3b'],
    sand:         ['#c9b27a', '#dcc691', '#a68f5c', '#eeddb0', '#7f6c44'],
    grass:        ['#4a7c3f', '#5f9950', '#375c2e', '#79b767', '#26401f'],
    grass_dark:   ['#3d6a35', '#4f8544', '#2c4d26', '#66a259', '#1e3619'],
    dirt:         ['#6b5334', '#856a47', '#4d3b24', '#a08558', '#332614'],
    stone_ground: ['#5C6068', '#78838C', '#35404A', '#A7B2B8', '#22292E'],
    void:         ['#0a0b0d', '#15171b', '#000000', '#20242a', '#000000']
  };

  /* ============================================================
     JAZIDAS NO CHÃO (a manchinha por cima do terreno)
     Segue a cor do minério, que é a versão suja do material.
     ============================================================ */
  var JAZIDAS = {
    coal:    ['#30383D', '#505B60', '#22292E', '#788388', '#151A1E'],
    iron:    ['#788F99', '#A9BEC7', '#526873', '#D4E3E7', '#3B4C55'],
    copper:  ['#913E2C', '#C66A3D', '#612D24', '#E69A60', '#451F19'],
    stone:   ['#78838C', '#A7B2B8', '#515D66', '#D2DADF', '#35404A'],
    gold:    ['#C99A2D', '#F2CB55', '#8A651E', '#FFE38A', '#5F4614'],
    uranium: ['#4aab4a', '#6fd46f', '#2f7a2f', '#9bec9b', '#1d521d'],
    clay:    ['#a8674a', '#c48466', '#7d4a33', '#dba488', '#5a3323'],
    sand:    ['#e0cb92', '#f2e2b0', '#b3a26f', '#f9f0d4', '#8d7d52'],
    soil:    ['#7a5a38', '#96734d', '#5a4126', '#b4926a', '#3d2b17'],
    oil:     ['#1f2026', '#34363e', '#0e0f12', '#4e515c', '#050506'],
    tree:    ['#2f5a28', '#457f39', '#1e3d1a', '#5b9e4c', '#132a11'],
    rock:    ['#78838C', '#A7B2B8', '#515D66', '#D2DADF', '#35404A']
  };

  /* ============================================================
     Daqui para baixo é o encanamento — não precisa mexer.
     ============================================================ */

  function trio(tabela, chave, reserva) {
    var c = tabela[chave];
    if (c) {
      return {
        base:   c[0],
        luz:    c[1],
        sombra: c[2],
        brilho: c[3] || c[1],           // se faltar, usa a luz
        fundo:  c[4] || c[2]            // se faltar, usa a sombra
      };
    }
    if (reserva) {
      return { base: reserva, luz: reserva, sombra: reserva, brilho: reserva, fundo: reserva };
    }
    return null;
  }

  /** Cores de um item: FZ.Paleta.item('iron_plate') */
  function item(id, reserva) { return trio(ITENS, id, reserva); }

  /** Cores de um terreno pela chave ('grass', 'water'...) */
  function terreno(chave, reserva) { return trio(TERRENO, chave, reserva); }

  /** Cores de uma jazida pela chave ('iron', 'gold'...) */
  function jazida(chave, reserva) { return trio(JAZIDAS, chave, reserva); }

  global.FZ = global.FZ || {};
  global.FZ.Paleta = {
    CONTORNO: CONTORNO,
    ITENS: ITENS,
    TERRENO: TERRENO,
    JAZIDAS: JAZIDAS,
    item: item,
    terreno: terreno,
    jazida: jazida
  };
})(window);
