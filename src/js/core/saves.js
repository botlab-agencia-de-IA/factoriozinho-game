/* ============================================================
   Factoriozinho — Sistema de saves
   5 slots em localStorage. Um save guarda o mundo inteiro;
   por enquanto guarda só o cabeçalho (seed, opções, progresso).
   ============================================================ */

(function (global) {
  'use strict';

  var PREFIX = 'factoriozinho.save.';
  var SLOT_COUNT = 5;
  var SAVE_VERSION = 1;

  function key(slot) { return PREFIX + slot; }

  function read(slot) {
    try {
      var raw = localStorage.getItem(key(slot));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(slot, data) {
    data.slot = slot;
    data.updatedAt = Date.now();
    try {
      localStorage.setItem(key(slot), JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(slot) {
    try { localStorage.removeItem(key(slot)); } catch (e) {}
  }

  /** Lista os 5 slots; posição vazia vem como null. */
  function list() {
    var out = [];
    for (var i = 1; i <= SLOT_COUNT; i++) out.push(read(i));
    return out;
  }

  /** Primeiro slot livre, ou 0 se estiver tudo cheio. */
  function firstFree() {
    for (var i = 1; i <= SLOT_COUNT; i++) {
      if (!read(i)) return i;
    }
    return 0;
  }

  /** Monta o estado inicial de um mundo novo. */
  function createWorld(opts) {
    return {
      version: SAVE_VERSION,
      slot: 0,
      name: opts.name || 'Mundo sem nome',
      seed: opts.seed,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      playtime: 0,                       // segundos
      options: {
        worldSize: opts.worldSize || 'medium',
        mode: opts.mode || 'relaxed',
        enemies: !!opts.enemies,
        tutorial: opts.tutorial !== false
      },
      player: {
        x: 0, y: 0,
        level: 1,
        xp: 0,
        skillPoints: 0,
        coins: 0,
        inventory: [],                   // [{ item, qtd }]
        hotbar: []
      },
      world: {
        chunks: {},                      // "cx,cy" -> dados do chunk
        unlocked: ['0,0'],
        entities: []                     // máquinas, esteiras, baús...
      },
      research: {
        completed: [],
        current: null,
        progress: 0
      },
      skills: { unlocked: [] },
      stats: { gathered: 0, crafted: 0, built: 0 }
    };
  }

  /** Semente aleatória curta e legível. */
  function randomSeed() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 8; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }

  /** Converte texto em número (para gerar o mapa a partir da seed). */
  function seedToNumber(seed) {
    var h = 2166136261;
    var str = String(seed);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function formatPlaytime(seconds) {
    var s = Math.max(0, Math.floor(seconds || 0));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    if (h > 0) return h + 'h ' + m + 'min';
    if (m > 0) return m + 'min';
    return 'recém-criado';
  }

  function formatDate(ts) {
    if (!ts) return '—';
    var d = new Date(ts);
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() +
           ' às ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  global.FZ = global.FZ || {};
  global.FZ.Saves = {
    SLOT_COUNT: SLOT_COUNT,
    read: read,
    write: write,
    remove: remove,
    list: list,
    firstFree: firstFree,
    createWorld: createWorld,
    randomSeed: randomSeed,
    seedToNumber: seedToNumber,
    formatPlaytime: formatPlaytime,
    formatDate: formatDate
  };
})(window);
