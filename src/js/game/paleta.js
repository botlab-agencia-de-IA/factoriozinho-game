/* ============================================================
   FACTORIOZINHO — PALETA DE CORES
   ============================================================

   ESTE É O ARQUIVO DAS CORES. É só aqui que se mexe em cor.

   As cores vêm do documentos/CORES.md, preenchido pelo Vandré.
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

    /* ---------- URÂNIO ----------  minério: o Vandré pediu massa em #3F8B35 */
    uranium_ore:  ['#3F8B35', '#73C94B', '#215427', '#B5ED75', '#183D1C'],

    /* ---------- AREIA E VIDRO ----------
       areia: ele pediu que até o ícone de inventário use a SOMBRA como base
       vidro: superfície na cor piloto, borda e reflexo no branco */
    sand:         ['#95723D', '#C9A45D', '#624827', '#ECD18B', '#48351C'],
    glass:        ['#6FBCC6', '#B6E8ED', '#41818F', '#F4FFFF', '#28525E'],

    /* ---------- TERRA E ARGILA ----------
       terra: massa em #643A29, senão fica igual ao chão de terra
       argila: essa fica na cor piloto mesmo, com luz em cima */
    soil:         ['#643A29', '#965A34', '#43281F', '#C58A51', '#311D17'],
    clay:         ['#B96949', '#D9956A', '#823F32', '#F6C49C', '#552B28'],

    /* ---------- PETRÓLEO ----------  azul-noturno, separado do carvão */
    crude_oil:    ['#2C3E54', '#485D72', '#19283D', '#71879B', '#0D1526'],

    /* DIAMANTE já tem cor escolhida no documentos/CORES.md
       (#56C5E6 e família), mas ainda não existe item no jogo. */

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
    iron_chest:     ['#7E8791', '#B6BEC8', '#5D656E', '#DCE3EA', '#3E454D'],
    transport_belt: ['#515D66', '#78838C', '#35404A', '#A7B2B8', '#22292E'],
    inserter:       ['#C99A2D', '#F2CB55', '#8A651E', '#FFE38A', '#5F4614'],

    /* --- a era da eletricidade --- */
    electric_pole:     ['#A97C4A', '#D2A472', '#7D5A35', '#EAC79A', '#553B22'],
    burner_generator:  ['#8D6A4A', '#B89372', '#6B4F37', '#D8B694', '#4A3625'],
    /* vermelho, escolha dele, para diferenciar do inseridor a carvão */
    electric_inserter: ['#D24B3F', '#F07A6C', '#9C342B', '#FFA79A', '#6B2019'],
    copper_wire:       ['#E08A5A', '#F5B189', '#B3603F', '#FFD2B8', '#7D3F26'],
    electronic_circuit:['#5F9950', '#8FC47F', '#417034', '#B9E3AA', '#2B4C22']
  };

  /* ============================================================
     TERRENO (o chão e o mapa)
     ============================================================ */
  var TERRENO = {
    water:        ['#3E9BBD', '#87D5E6', '#23668B', '#D5F7FF', '#173C61'],
    sand:         ['#D7B96E', '#EED99B', '#AD884C', '#FFF2C5', '#735B34'],
    grass:        ['#5EAA4B', '#8FCE61', '#397A3B', '#BDEB83', '#244D31'],
    grass_dark:   ['#426D38', '#618F45', '#2D4D31', '#8EBE62', '#1F3527'],
    dirt:         ['#8F5D38', '#BD894F', '#603A29', '#E2B978', '#42271F'],
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
    uranium: ['#3F8B35', '#73C94B', '#215427', '#B5ED75', '#183D1C'],
    clay:    ['#B96949', '#D9956A', '#823F32', '#F6C49C', '#552B28'],
    sand:    ['#95723D', '#C9A45D', '#624827', '#ECD18B', '#48351C'],
    soil:    ['#643A29', '#965A34', '#43281F', '#C58A51', '#311D17'],
    oil:     ['#2C3E54', '#485D72', '#19283D', '#71879B', '#0D1526'],
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
