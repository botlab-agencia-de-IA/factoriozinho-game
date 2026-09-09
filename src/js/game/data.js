/* ============================================================
   Factoriozinho — Dados do jogo
   Itens, receitas, estruturas, terreno e recursos.
   É aqui que se mexe para balancear o jogo.
   ============================================================ */

(function (global) {
  'use strict';

  var TILE = 32;   // pixels por tile (padrão de toda a arte)

  /* ---------------- terreno ---------------- */
  var TERRAIN = {
    WATER:  0,
    SAND:   1,
    GRASS:  2,
    GRASS2: 3,
    DIRT:   4,
    ROCKY:  5,
    VOID:   6      // fora do mundo — barreira intransponível
  };

  var TERRAIN_INFO = [
    { id: 0, key: 'water',        nome: 'Água',          cor: '#3E9BBD', cor2: '#54ACC9', solido: true  },
    { id: 1, key: 'sand',         nome: 'Areia',         cor: '#D7B96E', cor2: '#DEC37C', solido: false },
    { id: 2, key: 'grass',        nome: 'Grama',         cor: '#5EAA4B', cor2: '#6DB552', solido: false },
    { id: 3, key: 'grass_dark',   nome: 'Mato',          cor: '#426D38', cor2: '#4B773C', solido: false },
    { id: 4, key: 'dirt',         nome: 'Terra',         cor: '#8F5D38', cor2: '#9D6A3F', solido: false },
    { id: 5, key: 'stone_ground', nome: 'Chão de pedra', cor: '#5c6068', cor2: '#666b73', solido: false },
    { id: 6, key: 'void',         nome: 'Fim do mundo',  cor: '#0a0b0d', cor2: '#15171b', solido: true  }
  ];

  /* ---------------- recursos do mundo ---------------- */
  var RES = {
    NONE:    0,
    TREE:    1,
    ROCK:    2,
    COAL:    3,
    IRON:    4,
    COPPER:  5,
    STONE:   6,
    GOLD:    7,
    URANIUM: 8,
    CLAY:    9,
    SAND:   10,
    SOIL:   11,
    OIL:    12
  };

  /* emCima  = fica desenhado por cima do chão (jazida) em vez de ser um objeto
     bloqueia = impede passagem
     mao      = dá para coletar na mão (petróleo precisa de bomba) */
  var RES_INFO = [
    null,
    { id: 1,  key: 'tree',    nome: 'Árvore',              item: 'wood',        tempo: 0.65, bloqueia: true,  emCima: false, mao: true,  sprite: 'world/tree' },
    { id: 2,  key: 'rock',    nome: 'Pedregulho',          item: 'stone',       tempo: 0.90, bloqueia: true,  emCima: false, mao: true,  sprite: 'world/rock' },
    { id: 3,  key: 'coal',    nome: 'Jazida de carvão',    item: 'coal',        tempo: 1.00, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_coal',    cor: '#2b2f36' },
    { id: 4,  key: 'iron',    nome: 'Jazida de ferro',     item: 'iron_ore',    tempo: 1.20, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_iron',    cor: '#8d97a5' },
    { id: 5,  key: 'copper',  nome: 'Jazida de cobre',     item: 'copper_ore',  tempo: 1.20, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_copper',  cor: '#b3603f' },
    { id: 6,  key: 'stone',   nome: 'Jazida de pedra',     item: 'stone',       tempo: 1.00, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_stone',   cor: '#8a8f98' },
    { id: 7,  key: 'gold',    nome: 'Jazida de ouro',      item: 'gold_ore',    tempo: 1.60, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_gold',    cor: '#d4a017' },
    { id: 8,  key: 'uranium', nome: 'Jazida de urânio',    item: 'uranium_ore', tempo: 2.20, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_uranium', cor: '#3F8B35' },
    { id: 9,  key: 'clay',    nome: 'Depósito de argila',  item: 'clay',        tempo: 0.80, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_clay',    cor: '#B96949' },
    { id: 10, key: 'sand',    nome: 'Depósito de areia',   item: 'sand',        tempo: 0.70, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_sand',    cor: '#95723D' },
    { id: 11, key: 'soil',    nome: 'Depósito de terra',   item: 'soil',        tempo: 0.70, bloqueia: false, emCima: true,  mao: true,  sprite: 'tiles/ore_soil',    cor: '#643A29' },
    { id: 12, key: 'oil',     nome: 'Poço de petróleo',    item: 'crude_oil',   tempo: 3.00, bloqueia: false, emCima: true,  mao: false, sprite: 'tiles/ore_oil',     cor: '#2C3E54',
      aviso: 'Precisa de bomba de petróleo — ainda não existe.' }
  ];

  /* ---------------- itens ----------------
     stack = quantos cabem numa pilha
     fuel  = segundos de queima numa máquina a combustível
     forma/cor = desenho provisório enquanto não há sprite
  */
  var STACK = 100;   // padrão de pilha para tudo

  var ITEMS = {
    /* --- brutos --- */
    wood:        { nome: 'Madeira',              stack: STACK, fuel: 10, cor: '#c07a4a', forma: 'tora' },
    stone:       { nome: 'Pedra',                stack: STACK, cor: '#9aa3af', forma: 'pedra' },
    coal:        { nome: 'Carvão',               stack: STACK, fuel: 30, cor: '#3a3f47', forma: 'pedra' },
    iron_ore:    { nome: 'Minério de ferro',     stack: STACK, cor: '#8d97a5', forma: 'pedra' },
    copper_ore:  { nome: 'Minério de cobre',     stack: STACK, cor: '#b3603f', forma: 'pedra' },
    gold_ore:    { nome: 'Minério de ouro',      stack: STACK, cor: '#d4a017', forma: 'pedra' },
    uranium_ore: { nome: 'Minério de urânio',    stack: STACK, cor: '#3F8B35', forma: 'pedra' },
    clay:        { nome: 'Argila',               stack: STACK, cor: '#B96949', forma: 'pedra' },
    sand:        { nome: 'Areia',                stack: STACK, cor: '#95723D', forma: 'po' },
    soil:        { nome: 'Terra',                stack: STACK, cor: '#643A29', forma: 'po' },
    crude_oil:   { nome: 'Petróleo bruto',       stack: STACK, fuel: 60, cor: '#2C3E54', forma: 'po' },

    /* --- processados --- */
    iron_plate:  { nome: 'Placa de ferro',       stack: STACK, cor: '#b6bec8', forma: 'placa' },
    copper_plate:{ nome: 'Placa de cobre',       stack: STACK, cor: '#e08a5a', forma: 'placa' },
    gold_plate:  { nome: 'Placa de ouro',        stack: STACK, cor: '#f0c850', forma: 'placa' },
    glass:       { nome: 'Vidro',                stack: STACK, cor: '#6FBCC6', forma: 'placa' },
    stone_brick: { nome: 'Tijolo de pedra',      stack: STACK, cor: '#8a8f98', forma: 'tijolo' },
    iron_gear:   { nome: 'Engrenagem de ferro',  stack: STACK, cor: '#98a2ad', forma: 'engrenagem' },

    /* --- ferramentas ---
       Por enquanto só existem como item (a arte já é do Vandré).
       A regra de "só minera pedra com picareta" entra na fase de progressão. */
    wood_pickaxe:  { nome: 'Picareta de madeira', stack: STACK, nivel: 1, cor: '#c07a4a', forma: 'ferramenta' },
    stone_pickaxe: { nome: 'Picareta de pedra',   stack: STACK, nivel: 2, cor: '#9aa3af', forma: 'ferramenta' },
    iron_pickaxe:  { nome: 'Picareta de ferro',   stack: STACK, nivel: 3, cor: '#b6bec8', forma: 'ferramenta' },
    gold_pickaxe:  { nome: 'Picareta de ouro',    stack: STACK, nivel: 4, cor: '#f0c850', forma: 'ferramenta' },

    /* --- peças --- */
    copper_wire:       { nome: 'Fio de cobre',        stack: STACK, cor: '#e08a5a', forma: 'fio' },
    electronic_circuit:{ nome: 'Circuito eletrônico', stack: STACK, cor: '#5f9950', forma: 'circuito' },

    /* --- construções --- */
    stone_furnace:{ nome: 'Forno de pedra',      stack: STACK, constroi: 'stone_furnace', cor: '#7d8390', forma: 'predio' },
    burner_drill: { nome: 'Mineradora a carvão', stack: STACK, constroi: 'burner_drill',  cor: '#c98a3a', forma: 'predio' },
    wooden_chest: { nome: 'Baú de madeira',      stack: STACK, constroi: 'wooden_chest',  cor: '#a06a3c', forma: 'predio' },
    iron_chest:   { nome: 'Baú de ferro',        stack: STACK, constroi: 'iron_chest',    cor: '#8e99a5', forma: 'predio' },
    transport_belt:{ nome: 'Esteira',            stack: STACK, constroi: 'transport_belt', cor: '#6b7280', forma: 'esteira' },
    inserter:     { nome: 'Inseridor',           stack: STACK, constroi: 'inserter',      cor: '#c4a33a', forma: 'braco' },

    /* --- a era da eletricidade --- */
    electric_pole:     { nome: 'Poste elétrico',     stack: STACK, constroi: 'electric_pole',     cor: '#a97c4a', forma: 'poste' },
    burner_generator:  { nome: 'Gerador a carvão',   stack: STACK, constroi: 'burner_generator',  cor: '#8d6a4a', forma: 'predio' },
    /* vermelho de propósito, escolha dele: é o jeito de bater o olho e
       saber qual inseridor é o elétrico enquanto a arte não chega */
    electric_inserter: { nome: 'Inseridor elétrico', stack: STACK, constroi: 'electric_inserter', cor: '#d24b3f', forma: 'braco' }
  };

  /* ---------------- receitas de mão ----------------
     cat = em que seção da tela de fabricação a receita aparece
     (ferramenta / estrutura / item) */
  var CATEGORIAS = [
    { id: 'ferramenta', nome: 'Ferramentas' },
    { id: 'estrutura',  nome: 'Estruturas'  },
    { id: 'item',       nome: 'Itens'       }
  ];

  var HAND_RECIPES = [
    { saida: 'wood_pickaxe',   qtd: 1, tempo: 1.0, cat: 'ferramenta', custo: { wood: 5 } },
    { saida: 'stone_pickaxe',  qtd: 1, tempo: 1.0, cat: 'ferramenta', custo: { wood: 2, stone: 3 } },
    { saida: 'iron_pickaxe',   qtd: 1, tempo: 1.5, cat: 'ferramenta', custo: { wood: 2, iron_plate: 3 } },
    { saida: 'gold_pickaxe',   qtd: 1, tempo: 2.0, cat: 'ferramenta', custo: { wood: 2, gold_plate: 3 } },
    { saida: 'stone_furnace',  qtd: 1, tempo: 1.0, cat: 'estrutura',  custo: { stone: 5 } },
    { saida: 'wooden_chest',   qtd: 1, tempo: 0.5, cat: 'estrutura',  custo: { wood: 4 } },
    { saida: 'iron_chest',     qtd: 1, tempo: 1.0, cat: 'estrutura',  custo: { iron_plate: 5 } },
    { saida: 'burner_drill',   qtd: 1, tempo: 2.0, cat: 'estrutura',  custo: { iron_gear: 3, iron_plate: 3, stone_furnace: 1 } },
    { saida: 'transport_belt', qtd: 2, tempo: 0.5, cat: 'estrutura',  custo: { iron_gear: 1, iron_plate: 1 } },
    { saida: 'inserter',       qtd: 1, tempo: 0.5, cat: 'estrutura',  custo: { iron_gear: 1, iron_plate: 1, copper_plate: 1 } },
    { saida: 'iron_gear',      qtd: 1, tempo: 0.5, cat: 'item',       custo: { iron_plate: 2 } },

    /* --- a era da eletricidade ---
       1 chapa de cobre rende 2 fios, a mesma proporção da engrenagem. */
    { saida: 'copper_wire',        qtd: 2, tempo: 0.5, cat: 'item',      custo: { copper_plate: 1 } },
    { saida: 'electronic_circuit', qtd: 1, tempo: 0.5, cat: 'item',      custo: { copper_wire: 2, iron_plate: 1 } },
    { saida: 'electric_pole',      qtd: 1, tempo: 0.5, cat: 'estrutura', custo: { wood: 2, copper_wire: 1 } },
    { saida: 'burner_generator',   qtd: 1, tempo: 2.0, cat: 'estrutura', custo: { iron_plate: 5, iron_gear: 5, stone_brick: 5 } },
    { saida: 'electric_inserter',  qtd: 1, tempo: 0.5, cat: 'estrutura', custo: { iron_gear: 1, electronic_circuit: 1, iron_plate: 1 } }
  ];

  /** Em que seção a receita cai. Sem 'cat' escrito, deduz pelo item. */
  function categoriaDaReceita(r) {
    if (r.cat) return r.cat;
    var i = ITEMS[r.saida];
    if (i && i.constroi) return 'estrutura';
    if (i && i.nivel) return 'ferramenta';
    return 'item';
  }

  /* ---------------- receitas de fundição (forno) ---------------- */
  /* 3 s por peça = 20 por minuto. É o número em cima do qual a
     matemática do jogo inteira foi montada (ver documentos/MATEMATICA.md).
     O ouro demora uma vez e meia. */
  var SMELTING = {
    iron_ore:   { saida: 'iron_plate',   qtd: 1, tempo: 3.0 },
    copper_ore: { saida: 'copper_plate', qtd: 1, tempo: 3.0 },
    gold_ore:   { saida: 'gold_plate',   qtd: 1, tempo: 4.5 },
    stone:      { saida: 'stone_brick',  qtd: 1, tempo: 3.0 },
    sand:       { saida: 'glass',        qtd: 1, tempo: 3.0 }
  };

  /* ---------------- estruturas ---------------- */
  var BUILDINGS = {
    stone_furnace: {
      nome: 'Forno de pedra',
      tipo: 'furnace',
      w: 2, h: 2,
      giravel: false,
      slots: { fuel: 1, input: 1, output: 1 },
      cor: '#6f747f', cor2: '#565b64',
      dica: 'Queima combustível para transformar minério em placa.'
    },
    burner_drill: {
      nome: 'Mineradora a carvão',
      tipo: 'drill',
      w: 2, h: 2,
      giravel: true,
      velocidade: 0.5,           // itens por segundo = 30/min = 1,5 fornalhas
      slots: { fuel: 1, output: 1 },
      cor: '#8a6a3a', cor2: '#6d5330',
      dica: 'Fica em cima da jazida e joga o minério no que estiver na frente.'
    },
    wooden_chest: {
      nome: 'Baú de madeira',
      tipo: 'chest',
      w: 1, h: 1,
      giravel: false,
      slots: { geral: 16 },
      cor: '#8a5a34', cor2: '#6d4728',
      dica: 'Guarda 16 pilhas de itens.'
    },
    iron_chest: {
      nome: 'Baú de ferro',
      tipo: 'chest',
      w: 1, h: 1,
      giravel: false,
      slots: { geral: 24 },      // 8 a mais que o de madeira
      cor: '#7e8791', cor2: '#5d656e',
      dica: 'Guarda 24 pilhas — oito a mais que o baú de madeira.'
    },
    transport_belt: {
      nome: 'Esteira',
      tipo: 'belt',
      w: 1, h: 1,
      giravel: true,
      atravessavel: true,        // o jogador anda por cima dela
      velocidade: 2.0,           // tiles por segundo
      capacidade: 4,             // itens que cabem em cima de 1 tile
      slots: {},
      cor: '#6b7280', cor2: '#4b5159',
      dica: 'Leva os itens sozinha, na direção da seta. Não precisa de combustível.'
    },
    /* ---------------- a era da eletricidade ----------------
       A regra da rede, decidida por ele: a zona do poste é 5x5 com o
       poste no meio, e o fio alcança 7 quadrados de centro a centro —
       5 da zona de um, 2 de vão, 5 da zona do outro, 12 de ponta a
       ponta. Ver documentos/MATEMATICA.md §6. */
    electric_pole: {
      nome: 'Poste elétrico',
      tipo: 'pole',
      w: 1, h: 1,
      giravel: false,
      atravessavel: true,        // é um poste fino: dá para passar por ele
      zona: 5,                   // atende um quadrado de 5x5 em volta
      alcanceFio: 7,             // de centro a centro do próximo poste
      slots: {},
      cor: '#a97c4a', cor2: '#7d5a35',
      dica: 'Leva energia num quadrado de 5×5. Liga em outro poste a até 7 quadrados.'
    },
    burner_generator: {
      nome: 'Gerador a carvão',
      tipo: 'generator',
      w: 2, h: 2,
      giravel: false,
      producao: 100,             // watts, com o fogo aceso
      slots: { fuel: 1 },
      cor: '#8d6a4a', cor2: '#6b4f37',
      dica: 'Queima carvão ou madeira e põe 100 W na rede. Precisa estar na zona de um poste.'
    },
    electric_inserter: {
      nome: 'Inseridor elétrico',
      tipo: 'inserter',
      eletrico: true,            // sem combustível: bebe da rede
      consumo: 5,                // watts
      w: 1, h: 1,
      giravel: true,
      /* mesmos 2 ciclos por segundo do inseridor a carvão — cada item
         gasta dois, um para pegar e outro para entregar, então isso dá
         1 item por segundo, 60 por minuto. Ver MATEMATICA.md §5. */
      velocidade: 2.0,
      slots: {},
      cor: '#d24b3f', cor2: '#9c342b',
      dica: 'Não come carvão: precisa estar na zona de um poste com energia.'
    },
    inserter: {
      nome: 'Inseridor',
      tipo: 'inserter',
      w: 1, h: 1,
      giravel: true,
      /* ciclos por segundo: cada item gasta DOIS ciclos, um para pegar
         e outro para entregar. 2 ciclos/s = 1 item/s = 60 por minuto,
         o que dá conta de duas mineradoras. */
      velocidade: 2.0,
      gastoCombustivel: 0.25,    // 1 carvão dura 2 minutos de trabalho
      slots: { fuel: 1 },
      cor: '#c4a33a', cor2: '#957a22',
      dica: 'Pega do que está ATRÁS e põe no que está NA FRENTE (seta). Queima combustível.'
    }
  };

  /* ---------------- constantes de jogo ---------------- */
  var CHUNK = 32;
  var MUNDO_CHUNKS = 10;                       // o mundo tem 10x10 chunks

  var CONFIG = {
    TILE: TILE,
    CHUNK: CHUNK,
    MUNDO_CHUNKS: MUNDO_CHUNKS,
    MUNDO_TILES: MUNDO_CHUNKS * CHUNK,         // 320 tiles de lado
    MUNDO_MIN: -(MUNDO_CHUNKS * CHUNK) / 2,    // -160
    MUNDO_MAX: (MUNDO_CHUNKS * CHUNK) / 2 - 1, //  159
    STACK: STACK,
    INV_SIZE: 40,
    HOTBAR_SIZE: 8,
    REACH: 4.2,
    /* Quanto combustível uma máquina automática pode empilhar numa
        outra. O jogador enche na mão o quanto quiser; inseridor e
        mineradora só repõem até aqui, senão entopem a fornalha de
        carvão e não sobra braço para o minério. */
    FUEL_AUTOMATICO: 3,
    PLAYER_SPEED: 5.2,
    PLAYER_HITBOX: 0.55,
    ZOOM_MIN: 1,
    ZOOM_MAX: 4,
    ZOOM_DEFAULT: 2,
    DROP_PICKUP_RADIUS: 1.4
  };

  function item(id) { return ITEMS[id] || null; }
  function itemNome(id) { var i = ITEMS[id]; return i ? i.nome : id; }
  function stackMax(id) { var i = ITEMS[id]; return i ? (i.stack || STACK) : STACK; }
  function fuelValue(id) { var i = ITEMS[id]; return (i && i.fuel) || 0; }
  function building(id) { return BUILDINGS[id] || null; }
  function resInfo(id) { return RES_INFO[id] || null; }
  function terrainInfo(id) { return TERRAIN_INFO[id] || TERRAIN_INFO[2]; }

  global.FZ = global.FZ || {};
  /* Uma jazida tem três desenhos: cheia, pela metade e no fim.
     Tirar um minério de 415 para 414 não muda nada na tela — e é isso que
     deixa o chão em paz enquanto a mineradora trabalha. */
  function nivelDaJazida(res, qtd) {
    if (!res) return -1;
    return qtd > 600 ? 0 : (qtd > 200 ? 1 : 2);
  }

  global.FZ.Data = {
    CONFIG: CONFIG,
    TERRAIN: TERRAIN,
    TERRAIN_INFO: TERRAIN_INFO,
    RES: RES,
    RES_INFO: RES_INFO,
    ITEMS: ITEMS,
    HAND_RECIPES: HAND_RECIPES,
    SMELTING: SMELTING,
    BUILDINGS: BUILDINGS,
    item: item,
    itemNome: itemNome,
    CATEGORIAS: CATEGORIAS,
    categoriaDaReceita: categoriaDaReceita,
    stackMax: stackMax,
    fuelValue: fuelValue,
    building: building,
    resInfo: resInfo,
    terrainInfo: terrainInfo,
    nivelDaJazida: nivelDaJazida
  };
})(window);
