/* ============================================================
   Factoriozinho — Aleatoriedade determinística
   Tudo derivado da semente: a mesma semente gera sempre o
   mesmo mundo, sem precisar guardar o mapa no save.
   ============================================================ */

(function (global) {
  'use strict';

  /** Hash de duas coordenadas + semente → número em [0,1). */
  function hash2(x, y, seed) {
    var h = (seed | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }

  /** Ruído de valor com interpolação suave. */
  function valueNoise(x, y, seed) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf);
    var v = yf * yf * (3 - 2 * yf);

    var a = hash2(xi,     yi,     seed);
    var b = hash2(xi + 1, yi,     seed);
    var c = hash2(xi,     yi + 1, seed);
    var d = hash2(xi + 1, yi + 1, seed);

    var top = a + (b - a) * u;
    var bot = c + (d - c) * u;
    return top + (bot - top) * v;
  }

  /** Soma de oitavas — dá manchas grandes com detalhe pequeno. */
  function fbm(x, y, seed, octaves) {
    var sum = 0, amp = 1, freq = 1, norm = 0;
    for (var i = 0; i < octaves; i++) {
      sum += valueNoise(x * freq, y * freq, (seed + i * 1013) | 0) * amp;
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  }

  /** Gerador sequencial (mulberry32), para sorteios que não dependem de posição. */
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  global.FZ = global.FZ || {};
  global.FZ.Rng = {
    hash2: hash2,
    valueNoise: valueNoise,
    fbm: fbm,
    makeRng: makeRng,
    clamp: clamp,
    lerp: lerp
  };
})(window);
