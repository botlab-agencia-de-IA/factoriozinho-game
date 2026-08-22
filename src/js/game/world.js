/* ============================================================
   Factoriozinho — Mundo
   Mundo FINITO de 10x10 chunks (320x320 tiles), gerado por
   semente. O save guarda só o que você MUDOU (recursos gastos
   e construções) — o resto é regerado pela semente.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var R = global.FZ.Rng;
  var T = D.TERRAIN;
  var RES = D.RES;
  var C = D.CONFIG;
  var CHUNK = C.CHUNK;
  var MIN = C.MUNDO_MIN;
  var MAX = C.MUNDO_MAX;

  var state = null;
  var voidChunk = null;

  /* ---------------- criação / carregamento ---------------- */

  function init(seed, salvo) {
    state = {
      seed: seed,
      seedNum: global.FZ.Saves.seedToNumber(seed),
      chunks: {},
      mods: {},            // "x,y" -> [res, amount]  (vai pro save)
      entities: {},        // id -> entidade           (vai pro save)
      entityAt: {},        // "x,y" -> id              (índice)
      drops: [],
      nextId: 1
    };

    voidChunk = criarVoidChunk();
    regioes = montarRegioes(state.seedNum);
    centrosIniciais = montarCentrosIniciais(state.seedNum);

    if (salvo) {
      if (salvo.mods) state.mods = salvo.mods;
      if (salvo.drops) state.drops = salvo.drops;
      if (salvo.nextId) state.nextId = salvo.nextId;
      if (salvo.entities) {
        for (var id in salvo.entities) {
          var e = salvo.entities[id];
          state.entities[id] = e;
          indexar(e);
        }
      }
    }
    return state;
  }

  function criarVoidChunk() {
    var n = CHUNK * CHUNK;
    var terrain = new Uint8Array(n);
    terrain.fill(T.VOID);
    return { cx: 0, cy: 0, terrain: terrain, res: new Uint8Array(n), amount: new Int32Array(n) };
  }

  /** Gera o mundo inteiro de uma vez (mundo é finito, então cabe). */
  function gerarTudo() {
    var c0 = Math.floor(MIN / CHUNK), c1 = Math.floor(MAX / CHUNK);
    for (var cy = c0; cy <= c1; cy++) {
      for (var cx = c0; cx <= c1; cx++) getChunk(cx, cy);
    }
  }

  function serialize() {
    return {
      mods: state.mods,
      entities: state.entities,
      drops: state.drops,
      nextId: state.nextId
    };
  }

  /* ---------------- geração ---------------- */

  /* Jazidas duras.
     Em vez de um ruído por minério (caro), um ruído só decide ONDE tem
     jazida, e cada chunk tem um minério dominante sorteado da tabela
     abaixo. Assim o mundo fica com regiões de ferro, regiões de cobre
     etc., e todos os minérios existem sempre — as proporções são exatas. */
  var RIQUEZA_ESCALA = 16;
  var RIQUEZA_THR = 0.628;

  var PROPORCAO_REGIOES = [
    [RES.COAL,    20],
    [RES.IRON,    22],
    [RES.COPPER,  18],
    [RES.STONE,   18],
    [RES.GOLD,    10],
    [RES.OIL,      7],
    [RES.URANIUM,  5]
  ];

  var regioes = null;      // um minério por chunk, embaralhado pela semente

  function montarRegioes(seed) {
    var total = C.MUNDO_CHUNKS * C.MUNDO_CHUNKS;
    var lista = [];
    var i, j;

    // monta a lista respeitando as proporções e completa com ferro
    for (i = 0; i < PROPORCAO_REGIOES.length; i++) {
      var quantas = Math.round(PROPORCAO_REGIOES[i][1] / 100 * total);
      for (j = 0; j < quantas; j++) lista.push(PROPORCAO_REGIOES[i][0]);
    }
    while (lista.length < total) lista.push(RES.IRON);
    lista.length = total;

    // embaralha de forma determinística
    var rnd = R.makeRng(seed + 4242);
    for (i = lista.length - 1; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1));
      var t = lista[i]; lista[i] = lista[j]; lista[j] = t;
    }
    return lista;
  }

  function minerioDaRegiao(cx, cy) {
    var c0 = Math.floor(MIN / CHUNK);
    var rx = cx - c0, ry = cy - c0;
    if (rx < 0 || ry < 0 || rx >= C.MUNDO_CHUNKS || ry >= C.MUNDO_CHUNKS) return RES.IRON;
    return regioes[ry * C.MUNDO_CHUNKS + rx];
  }

  /* Depósitos de superfície: dependem do bioma, não competem com as jazidas. */
  var SUPERFICIE = [
    { res: RES.SAND, terreno: T.SAND,  off: 1201, escala: 9, thr: 0.600 },
    { res: RES.SOIL, terreno: T.DIRT,  off: 1301, escala: 9, thr: 0.620 },
    { res: RES.CLAY, terreno: T.SAND,  off: 1401, escala: 7, thr: 0.700, perto: true },
    { res: RES.CLAY, terreno: T.DIRT,  off: 1401, escala: 7, thr: 0.720, perto: true }
  ];

  /* Manchas garantidas em volta do ponto de partida. */
  var INICIAIS = [
    { res: RES.COAL,   ang: 0.4, dist: 25, raio: 5.0 },
    { res: RES.IRON,   ang: 2.1, dist: 21, raio: 5.5 },
    { res: RES.COPPER, ang: 3.7, dist: 27, raio: 4.5 },
    { res: RES.STONE,  ang: 5.2, dist: 23, raio: 4.5 }
  ];

  /* Centros calculados uma vez por mundo — dentro do laço de geração
     isso era o gargalo (cos/sin/hypot em cada um dos 102.400 tiles). */
  var centrosIniciais = null;
  var ALCANCE_INICIAIS = 45;

  function montarCentrosIniciais(seed) {
    var giro = R.hash2(7, 13, seed + 12345) * Math.PI * 2;
    var out = [];
    for (var i = 0; i < INICIAIS.length; i++) {
      var s = INICIAIS[i];
      var a = giro + s.ang;
      var lim = s.raio * 1.6;
      out.push({
        res: s.res,
        cx: Math.round(Math.cos(a) * s.dist),
        cy: Math.round(Math.sin(a) * s.dist),
        raio: s.raio,
        lim2: lim * lim
      });
    }
    return out;
  }

  function manchaInicial(x, y, seed) {
    if (x < -ALCANCE_INICIAIS || x > ALCANCE_INICIAIS ||
        y < -ALCANCE_INICIAIS || y > ALCANCE_INICIAIS) return null;

    for (var i = 0; i < centrosIniciais.length; i++) {
      var s = centrosIniciais[i];
      var dx = x - s.cx, dy = y - s.cy;
      var d2 = dx * dx + dy * dy;
      if (d2 > s.lim2) continue;
      var d = Math.sqrt(d2);
      var raio = s.raio * (0.78 + 0.44 * R.valueNoise(x / 3.5, y / 3.5, seed + s.res * 77));
      if (d <= raio) {
        var t = 1 - d / (raio + 0.001);
        return { res: s.res, amount: Math.round(260 + t * 1100) };
      }
    }
    return null;
  }

  function chunkKey(cx, cy) { return cx + ',' + cy; }
  function tileKey(x, y) { return x + ',' + y; }

  function dentroDoMundo(x, y) {
    return x >= MIN && x <= MAX && y >= MIN && y <= MAX;
  }

  function getChunk(cx, cy) {
    var k = chunkKey(cx, cy);
    var c = state.chunks[k];
    if (c) return c;
    c = gerarChunk(cx, cy);
    state.chunks[k] = c;
    return c;
  }

  function gerarChunk(cx, cy) {
    var seed = state.seedNum;
    var n = CHUNK * CHUNK;
    var terrain = new Uint8Array(n);
    var res = new Uint8Array(n);
    var amount = new Int32Array(n);

    for (var iy = 0; iy < CHUNK; iy++) {
      for (var ix = 0; ix < CHUNK; ix++) {
        var x = cx * CHUNK + ix;
        var y = cy * CHUNK + iy;
        var i = iy * CHUNK + ix;

        if (!dentroDoMundo(x, y)) { terrain[i] = T.VOID; continue; }

        /* --- terreno --- */
        var e = R.fbm(x / 38, y / 38, seed, 4);
        var m = R.fbm(x / 28, y / 28, seed + 7777, 3);
        var t;
        if (e < 0.300)      t = T.WATER;
        else if (e < 0.350) t = T.SAND;
        else if (e > 0.700) t = T.ROCKY;
        else if (m > 0.575) t = T.GRASS2;
        else if (m < 0.425) t = T.DIRT;
        else                t = T.GRASS;

        /* --- manchas garantidas do começo (têm prioridade) --- */
        var ini = manchaInicial(x, y, seed);
        if (ini) {
          if (t === T.WATER) t = T.SAND;
          terrain[i] = t;
          res[i] = ini.res;
          amount[i] = ini.amount;
          continue;
        }

        terrain[i] = t;
        if (t === T.WATER) continue;

        /* --- jazidas duras --- */
        var riqueza = R.fbm(x / RIQUEZA_ESCALA, y / RIQUEZA_ESCALA, seed + 100, 3);
        if (riqueza > RIQUEZA_THR) {
          res[i] = minerioDaRegiao(cx, cy);
          amount[i] = Math.round(180 + (riqueza - RIQUEZA_THR) * 7000);
          continue;
        }

        /* --- depósitos de superfície (areia, terra, argila) --- */
        var achou = false;
        for (var s = 0; s < SUPERFICIE.length && !achou; s++) {
          var sp = SUPERFICIE[s];
          if (sp.terreno !== t) continue;
          if (sp.perto && e > 0.400) continue;      // argila só perto da água
          var vs = R.fbm(x / sp.escala, y / sp.escala, seed + sp.off, 2);
          if (vs > sp.thr) {
            res[i] = sp.res;
            amount[i] = Math.round(120 + (vs - sp.thr) * 2400);
            achou = true;
          }
        }
        if (achou) continue;

        /* --- árvores --- */
        if (t === T.GRASS || t === T.GRASS2) {
          var f = R.fbm(x / 13, y / 13, seed + 555, 3);
          if (f > 0.50) {
            var densidade = (f - 0.50) / 0.24;
            if (R.hash2(x, y, seed + 901) < densidade * 0.80) {
              res[i] = RES.TREE;
              amount[i] = 4;
              continue;
            }
          }
        }

        /* --- pedregulhos soltos --- */
        if (R.hash2(x, y, seed + 77) < 0.008) {
          res[i] = RES.ROCK;
          amount[i] = 8;
        }
      }
    }

    var chunk = { cx: cx, cy: cy, terrain: terrain, res: res, amount: amount };
    aplicarMods(chunk);
    return chunk;
  }

  function aplicarMods(chunk) {
    var base = chunk.cx * CHUNK, baseY = chunk.cy * CHUNK;
    for (var key in state.mods) {
      var p = key.split(',');
      var x = +p[0], y = +p[1];
      if (x < base || x >= base + CHUNK || y < baseY || y >= baseY + CHUNK) continue;
      var i = (y - baseY) * CHUNK + (x - base);
      var mod = state.mods[key];
      chunk.res[i] = mod[0];
      chunk.amount[i] = mod[1];
    }
  }

  /* ---------------- consulta de tiles ---------------- */

  /* Chamadas milhares de vezes por quadro: não alocam objeto. */
  var _chunk = null, _i = 0;

  function idx(x, y) {
    if (!dentroDoMundo(x, y)) { _chunk = voidChunk; _i = 0; return; }
    var cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
    _chunk = getChunk(cx, cy);
    _i = (y - cy * CHUNK) * CHUNK + (x - cx * CHUNK);
  }

  function terrainAt(x, y) { idx(x, y); return _chunk.terrain[_i]; }
  function resAt(x, y)     { idx(x, y); return _chunk.res[_i]; }
  function amountAt(x, y)  { idx(x, y); return _chunk.amount[_i]; }

  function setRes(x, y, res, amount) {
    if (!dentroDoMundo(x, y)) return;
    idx(x, y);
    _chunk.res[_i] = res;
    _chunk.amount[_i] = amount;
    state.mods[tileKey(x, y)] = [res, amount];
    if (global.FZ.Minimap) global.FZ.Minimap.atualizarTile(x, y);
  }

  /**
   * Tira 1 unidade de um tile de recurso.
   * @returns {string|null} id do item obtido, ou null
   */
  function minerar(x, y) {
    var res = resAt(x, y);
    if (!res) return null;
    var info = D.resInfo(res);
    if (!info) return null;

    var qtd = amountAt(x, y) - 1;
    if (qtd <= 0) setRes(x, y, RES.NONE, 0);
    else setRes(x, y, res, qtd);

    return info.item;
  }

  /* ---------------- colisão ---------------- */

  function tileSolido(x, y) {
    var t = terrainAt(x, y);
    if (D.terrainInfo(t).solido) return true;
    var res = resAt(x, y);
    if (res) {
      var info = D.resInfo(res);
      if (info && info.bloqueia) return true;
    }
    return !!entityAt(x, y);
  }

  /* ---------------- entidades ---------------- */

  function entityAt(x, y) {
    var id = state.entityAt[tileKey(x, y)];
    return id ? state.entities[id] : null;
  }

  function indexar(e) {
    for (var dy = 0; dy < e.h; dy++) {
      for (var dx = 0; dx < e.w; dx++) {
        state.entityAt[tileKey(e.x + dx, e.y + dy)] = e.id;
      }
    }
  }

  function desindexar(e) {
    for (var dy = 0; dy < e.h; dy++) {
      for (var dx = 0; dx < e.w; dx++) {
        delete state.entityAt[tileKey(e.x + dx, e.y + dy)];
      }
    }
  }

  function podeConstruir(tipo, x, y) {
    var b = D.building(tipo);
    if (!b) return false;
    for (var dy = 0; dy < b.h; dy++) {
      for (var dx = 0; dx < b.w; dx++) {
        var tx = x + dx, ty = y + dy;
        if (!dentroDoMundo(tx, ty)) return false;
        if (D.terrainInfo(terrainAt(tx, ty)).solido) return false;
        var res = resAt(tx, ty);
        if (res) {
          var info = D.resInfo(res);
          if (info && info.bloqueia) return false;
        }
        if (entityAt(tx, ty)) return false;
      }
    }
    return true;
  }

  function criarEntidade(tipo, x, y, dir) {
    var b = D.building(tipo);
    var e = {
      id: state.nextId++,
      tipo: tipo,
      x: x, y: y,
      w: b.w, h: b.h,
      dir: dir || 0,
      inv: {},
      progresso: 0,
      queima: 0,
      queimaMax: 0,
      ativo: false
    };
    for (var slot in b.slots) {
      e.inv[slot] = new Array(b.slots[slot]).fill(null);
    }
    // a esteira não tem slots: ela guarda os itens andando nas duas faixas
    if (b.tipo === 'belt') e.faixas = [[], []];
    if (b.tipo === 'inserter') e.segurando = null;

    state.entities[e.id] = e;
    indexar(e);
    if (global.FZ.Minimap) global.FZ.Minimap.atualizarArea(x, y, b.w, b.h);
    return e;
  }

  function removerEntidade(e) {
    desindexar(e);
    delete state.entities[e.id];
    if (global.FZ.Minimap) global.FZ.Minimap.atualizarArea(e.x, e.y, e.w, e.h);
  }

  function todasEntidades() {
    var out = [];
    for (var id in state.entities) out.push(state.entities[id]);
    return out;
  }

  /* ---------------- itens no chão ---------------- */

  function soltarItem(x, y, item, count) {
    state.drops.push({ x: x, y: y, item: item, count: count, t: 0 });
  }

  /* ---------------- ponto de partida ---------------- */

  function acharSpawn() {
    for (var raio = 0; raio < 120; raio++) {
      for (var dy = -raio; dy <= raio; dy++) {
        for (var dx = -raio; dx <= raio; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
          if (livreParaSpawn(dx, dy)) return { x: dx + 0.5, y: dy + 0.5 };
        }
      }
    }
    return { x: 0.5, y: 0.5 };
  }

  function livreParaSpawn(x, y) {
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (!dentroDoMundo(x + dx, y + dy)) return false;
        var t = terrainAt(x + dx, y + dy);
        if (D.terrainInfo(t).solido) return false;
        var res = resAt(x + dx, y + dy);
        if (res) {
          var info = D.resInfo(res);
          if (info && info.bloqueia) return false;
        }
      }
    }
    return true;
  }

  global.FZ = global.FZ || {};
  global.FZ.World = {
    init: init,
    gerarTudo: gerarTudo,
    serialize: serialize,
    get state() { return state; },
    getChunk: getChunk,
    dentroDoMundo: dentroDoMundo,
    terrainAt: terrainAt,
    resAt: resAt,
    amountAt: amountAt,
    setRes: setRes,
    minerar: minerar,
    tileSolido: tileSolido,
    entityAt: entityAt,
    podeConstruir: podeConstruir,
    criarEntidade: criarEntidade,
    removerEntidade: removerEntidade,
    todasEntidades: todasEntidades,
    soltarItem: soltarItem,
    acharSpawn: acharSpawn
  };
})(window);
