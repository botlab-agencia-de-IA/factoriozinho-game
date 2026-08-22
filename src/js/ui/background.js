/* ============================================================
   Factoriozinho — Fundo animado do menu
   Esteiras rolando com itens, em cima de uma grade de tiles.
   Serve também de teste do canvas que o jogo vai usar depois.
   ============================================================ */

(function (global) {
  'use strict';

  var canvas, ctx, raf = null, enabled = true;
  var w = 0, h = 0, dpr = 1, last = 0;
  var belts = [];

  var TILE = 40;

  // cores dos "itens" que passam na esteira
  var ITEM_COLORS = [
    '#c07a4a', // madeira
    '#8d939c', // pedra
    '#3a3f47', // carvão
    '#b3603f', // minério de cobre
    '#7e8791', // placa de ferro
    '#d98b3a', // engrenagem
    '#e05a5a'  // frasco de ciência
  ];

  function resize() {
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBelts();
  }

  /** Monta as faixas de esteira, espaçadas ao longo da tela. */
  function buildBelts() {
    belts = [];
    var count = Math.max(3, Math.floor(h / 150));
    for (var i = 0; i < count; i++) {
      var dir = i % 2 === 0 ? 1 : -1;
      var speed = (16 + Math.random() * 18) * dir;
      var y = (h / count) * i + (h / count) * 0.5 + (Math.random() * 30 - 15);

      var items = [];
      var gap = 34 + Math.random() * 26;
      for (var x = -60; x < w + 60; x += gap) {
        if (Math.random() < 0.72) {
          items.push({
            x: x,
            color: ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)]
          });
        }
      }
      belts.push({ y: y, speed: speed, items: items, offset: 0, depth: 0.45 + (i % 3) * 0.16 });
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.022)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= w; x += TILE) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (var y = 0; y <= h; y += TILE) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
  }

  function drawBelt(b) {
    var beltH = 22;
    var top = b.y - beltH / 2;
    var alpha = b.depth;

    // corpo da esteira
    ctx.fillStyle = 'rgba(44,49,58,' + (alpha * 0.9) + ')';
    ctx.fillRect(0, top, w, beltH);

    // bordas
    ctx.fillStyle = 'rgba(88,96,108,' + (alpha * 0.7) + ')';
    ctx.fillRect(0, top, w, 2);
    ctx.fillRect(0, top + beltH - 2, w, 2);

    // ranhuras que rolam (dão a sensação de movimento)
    ctx.fillStyle = 'rgba(120,130,145,' + (alpha * 0.28) + ')';
    var step = 14;
    var shift = ((b.offset % step) + step) % step;
    for (var x = -step + shift; x < w + step; x += step) {
      ctx.fillRect(x, top + 3, 3, beltH - 6);
    }

    // itens em cima
    for (var i = 0; i < b.items.length; i++) {
      var it = b.items[i];
      var size = 11;
      ctx.fillStyle = it.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(it.x - size / 2, b.y - size / 2, size, size);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(it.x - size / 2 + 0.5, b.y - size / 2 + 0.5, size - 1, size - 1);
      ctx.globalAlpha = 1;
    }
  }

  function update(dt) {
    for (var i = 0; i < belts.length; i++) {
      var b = belts[i];
      b.offset += b.speed * dt;
      for (var j = 0; j < b.items.length; j++) {
        var it = b.items[j];
        it.x += b.speed * dt;
        if (it.x > w + 40) it.x = -40;
        if (it.x < -40) it.x = w + 40;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, w, h);

    var g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#171a1f');
    g.addColorStop(1, '#101216');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    drawGrid();
    for (var i = 0; i < belts.length; i++) drawBelt(belts[i]);
  }

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (enabled) update(dt);
    render();
    raf = global.requestAnimationFrame(frame);
  }

  function start() {
    canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // respeita quem pediu menos animação no sistema
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      enabled = false;
    }

    resize();
    global.addEventListener('resize', resize);
    last = performance.now();
    raf = global.requestAnimationFrame(frame);
  }

  function setEnabled(v) {
    enabled = !!v;
  }

  global.FZ = global.FZ || {};
  global.FZ.Background = { start: start, setEnabled: setEnabled };
})(window);
