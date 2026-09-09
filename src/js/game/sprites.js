/* ============================================================
   Factoriozinho — Carregador de sprites
   Tenta carregar os PNGs de assets/. O que não existir é
   desenhado por código (forma provisória), sem erro nem travar.
   Basta salvar o arquivo na pasta certa e recarregar (F5).
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;

  // Lista do que o jogo procura. Ver assets/LEIA-ME.md.
  var LISTA = [
    // chão (32x32, tileável)
    'tiles/grass', 'tiles/grass_dark', 'tiles/sand', 'tiles/dirt',
    'tiles/stone_ground', 'tiles/water',
    'tiles/ore_coal', 'tiles/ore_iron', 'tiles/ore_copper', 'tiles/ore_stone',
    'tiles/ore_gold', 'tiles/ore_uranium', 'tiles/ore_clay', 'tiles/ore_sand',
    'tiles/ore_soil', 'tiles/ore_oil',
    // objetos do mundo
    'world/tree',        // 32x48
    'world/rock',        // 32x32
    // ícones de item (32x32)
    'items/wood', 'items/stone', 'items/coal', 'items/iron_ore', 'items/copper_ore',
    'items/gold_ore', 'items/uranium_ore', 'items/clay', 'items/sand', 'items/soil',
    'items/crude_oil',
    'items/iron_plate', 'items/copper_plate', 'items/gold_plate', 'items/glass',
    'items/stone_brick', 'items/iron_gear',
    'items/stone_furnace', 'items/burner_drill', 'items/wooden_chest', 'items/iron_chest',
    'items/transport_belt', 'items/inserter',
    // ferramentas (arte do Vandré)
    'items/wood_pickaxe', 'items/stone_pickaxe', 'items/iron_pickaxe', 'items/gold_pickaxe',
    // estruturas
    'buildings/stone_furnace',  // 64x64
    'buildings/burner_drill',   // 64x64
    'buildings/wooden_chest',   // 32x32
    'buildings/iron_chest',     // 32x32
    'buildings/transport_belt', // 32x32
    'buildings/inserter',       // 32x32
    // personagem
    'player/player'             // folha 128x128
  ];

  var cache = {};      // key -> { img, ok }
  var carregados = 0;
  var total = 0;

  function init(onDone) {
    total = LISTA.length;
    if (total === 0) { onDone && onDone(); return; }

    var restantes = total;
    function passo() {
      restantes--;
      // chegou arte nova: os ícones guardados são do desenho provisório
      if (restantes === 0) { limparIcones(); if (onDone) onDone(); }
    }

    LISTA.forEach(function (key) {
      var img = new Image();
      var reg = { img: img, ok: false };
      cache[key] = reg;

      img.onload = function () {
        reg.ok = img.naturalWidth > 0;
        if (reg.ok) carregados++;
        passo();
      };
      img.onerror = function () { passo(); };
      img.src = 'assets/' + key + '.png';
    });
  }

  function get(key) {
    var reg = cache[key];
    return (reg && reg.ok) ? reg.img : null;
  }

  function has(key) { return !!get(key); }

  /** Relatório no console: FZ.Sprites.status() */
  function status() {
    var ok = [], falta = [];
    LISTA.forEach(function (k) { (get(k) ? ok : falta).push(k); });
    console.log('%cSprites carregados: ' + ok.length + '/' + LISTA.length,
      'color:#6fc26b;font-weight:bold');
    if (ok.length) console.log('  ✔ ' + ok.join('\n  ✔ '));
    if (falta.length) {
      console.log('%cFaltando (usando desenho provisório):', 'color:#ff9b2b;font-weight:bold');
      console.log('  ✗ assets/' + falta.join('.png\n  ✗ assets/') + '.png');
    }
    return { carregados: ok, faltando: falta };
  }

  /* ============================================================
     Desenho provisório de ícones de item
     Usado tanto no mundo quanto nos slots da interface.
     ============================================================ */

  /* ---------------- ícone pronto, guardado ----------------
     O desenho provisório de um item são umas dez operações de traço e
     preenchimento. Isso é barato uma vez e caríssimo 2.700 vezes por
     quadro, que é o que uma base cheia de esteira pede: era daí que
     vinha a queda de FPS perto da fábrica. Agora cada ícone é pintado
     UMA vez num canvas do tamanho pedido e depois só copiado.
     São poucos tamanhos na prática (um por nível de zoom, mais os da
     interface), então o cache não cresce. */
  /* Dois níveis (item → tamanho) de propósito: assim nem a chave precisa
     ser montada com concatenação de texto a cada item desenhado. */
  var iconeCache = {};
  var iconeQtd = 0;
  var ICONE_MAX = 400;
  var pngDoItem = {};        // itemId -> Image, ou false quando não existe PNG

  function iconePronto(itemId, lado) {
    var porTamanho = iconeCache[itemId];
    if (porTamanho) {
      var pronto = porTamanho[lado];
      if (pronto) return pronto;
    } else {
      porTamanho = iconeCache[itemId] = {};
    }

    var info = D.ITEMS[itemId];
    if (!info) return null;
    if (iconeQtd >= ICONE_MAX) { iconeCache = {}; iconeQtd = 0; porTamanho = iconeCache[itemId] = {}; }

    var o = document.createElement('canvas');
    o.width = lado; o.height = lado;
    var cx = o.getContext('2d');
    cx.imageSmoothingEnabled = false;
    fallbackItem(cx, itemId, info, 0, 0, lado);

    porTamanho[lado] = o;
    iconeQtd++;
    return o;
  }

  /** Some com os ícones guardados — usado quando a arte de verdade chega. */
  function limparIcones() { iconeCache = {}; iconeQtd = 0; pngDoItem = {}; }

  function drawItem(ctx, itemId, x, y, size) {
    var img = pngDoItem[itemId];
    if (img === undefined) img = pngDoItem[itemId] = (get('items/' + itemId) || false);
    if (img) {
      ctx.drawImage(img, x, y, size, size);
      return;
    }

    var lado = Math.max(1, Math.round(size));
    var pronto = iconePronto(itemId, lado);
    if (pronto) ctx.drawImage(pronto, x, y, lado, lado);
  }

  function fallbackItem(ctx, itemId, info, x, y, s) {
    // as cores vêm todas de src/js/game/paleta.js
    var p = global.FZ.Paleta.item(itemId, info.cor || '#999');
    var cor = p.base, claro = p.luz, escuro = p.sombra;
    var brilho = p.brilho, fundo = p.fundo;

    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = Math.max(1, s / 32);
    ctx.strokeStyle = global.FZ.Paleta.CONTORNO;

    switch (info.forma) {
      case 'tora':
        rect(ctx, s * 0.14, s * 0.30, s * 0.72, s * 0.40, cor, escuro);
        ctx.fillStyle = escuro;
        ctx.fillRect(s * 0.14, s * 0.44, s * 0.72, s * 0.04);
        ctx.fillRect(s * 0.14, s * 0.56, s * 0.72, s * 0.04);
        ctx.strokeRect(s * 0.14, s * 0.30, s * 0.72, s * 0.40);
        break;

      case 'pedra':
        ctx.beginPath();
        ctx.moveTo(s * 0.20, s * 0.68);
        ctx.lineTo(s * 0.14, s * 0.44);
        ctx.lineTo(s * 0.34, s * 0.26);
        ctx.lineTo(s * 0.66, s * 0.24);
        ctx.lineTo(s * 0.84, s * 0.46);
        ctx.lineTo(s * 0.76, s * 0.70);
        ctx.closePath();
        ctx.fillStyle = cor; ctx.fill();
        ctx.stroke();
        ctx.fillStyle = escuro;                       // parte de baixo
        ctx.fillRect(s * 0.22, s * 0.58, s * 0.50, s * 0.10);
        ctx.fillStyle = fundo;                        // quina mais escura
        ctx.fillRect(s * 0.22, s * 0.64, s * 0.36, s * 0.05);
        ctx.fillStyle = claro;
        ctx.fillRect(s * 0.32, s * 0.34, s * 0.16, s * 0.10);
        ctx.fillStyle = brilho;                       // ponto de luz
        ctx.fillRect(s * 0.34, s * 0.34, s * 0.07, s * 0.05);
        break;

      case 'placa':
        rect(ctx, s * 0.16, s * 0.34, s * 0.68, s * 0.32, cor, escuro);
        ctx.fillStyle = fundo;
        ctx.fillRect(s * 0.16, s * 0.60, s * 0.68, s * 0.06);
        ctx.fillStyle = claro;
        ctx.fillRect(s * 0.20, s * 0.38, s * 0.60, s * 0.06);
        ctx.fillStyle = brilho;                       // reflexo metálico
        ctx.fillRect(s * 0.24, s * 0.38, s * 0.22, s * 0.05);
        ctx.strokeRect(s * 0.16, s * 0.34, s * 0.68, s * 0.32);
        break;

      case 'tijolo':
        rect(ctx, s * 0.16, s * 0.32, s * 0.68, s * 0.36, cor, escuro);
        ctx.fillStyle = escuro;
        ctx.fillRect(s * 0.16, s * 0.50, s * 0.68, s * 0.03);
        ctx.fillRect(s * 0.48, s * 0.32, s * 0.03, s * 0.18);
        ctx.fillRect(s * 0.32, s * 0.53, s * 0.03, s * 0.15);
        ctx.strokeRect(s * 0.16, s * 0.32, s * 0.68, s * 0.36);
        break;

      case 'ferramenta':
        // cabo na diagonal + cabeça (só aparece se faltar o PNG)
        ctx.strokeStyle = '#8a5a34';
        ctx.lineWidth = Math.max(2, s / 11);
        ctx.beginPath();
        ctx.moveTo(s * 0.28, s * 0.78);
        ctx.lineTo(s * 0.62, s * 0.32);
        ctx.stroke();
        ctx.strokeStyle = global.FZ.Paleta.CONTORNO;
        ctx.lineWidth = Math.max(1, s / 32);
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.moveTo(s * 0.38, s * 0.30);
        ctx.quadraticCurveTo(s * 0.62, s * 0.14, s * 0.84, s * 0.30);
        ctx.quadraticCurveTo(s * 0.62, s * 0.26, s * 0.38, s * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'esteira':
        rect(ctx, s * 0.10, s * 0.30, s * 0.80, s * 0.40, cor, escuro);
        ctx.fillStyle = claro;
        for (var ei = 0; ei < 4; ei++) {
          ctx.fillRect(s * (0.16 + ei * 0.18), s * 0.34, s * 0.05, s * 0.32);
        }
        ctx.strokeRect(s * 0.10, s * 0.30, s * 0.80, s * 0.40);
        break;

      case 'braco':
        // base
        rect(ctx, s * 0.20, s * 0.56, s * 0.60, s * 0.28, cor, escuro);
        ctx.strokeRect(s * 0.20, s * 0.56, s * 0.60, s * 0.28);
        // braço erguido
        ctx.strokeStyle = escuro;
        ctx.lineWidth = Math.max(2, s / 12);
        ctx.beginPath();
        ctx.moveTo(s * 0.50, s * 0.60);
        ctx.lineTo(s * 0.66, s * 0.20);
        ctx.stroke();
        ctx.fillStyle = claro;
        ctx.beginPath();
        ctx.arc(s * 0.66, s * 0.20, s * 0.10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = global.FZ.Paleta.CONTORNO;
        ctx.lineWidth = Math.max(1, s / 32);
        ctx.stroke();
        break;

      case 'po':
        // montinho de grãos (areia, terra, petróleo)
        ctx.beginPath();
        ctx.moveTo(s * 0.16, s * 0.68);
        ctx.quadraticCurveTo(s * 0.50, s * 0.26, s * 0.84, s * 0.68);
        ctx.closePath();
        ctx.fillStyle = cor; ctx.fill();
        ctx.stroke();
        ctx.fillStyle = claro;
        for (var pi = 0; pi < 5; pi++) {
          ctx.fillRect(s * (0.30 + pi * 0.09), s * (0.52 + (pi % 2) * 0.08), s * 0.05, s * 0.05);
        }
        break;

      case 'engrenagem':
        var cx = s / 2, cy = s / 2, r = s * 0.30;
        ctx.fillStyle = cor;
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
          var a1 = (i / 8) * Math.PI * 2;
          var a2 = ((i + 0.5) / 8) * Math.PI * 2;
          ctx.lineTo(cx + Math.cos(a1) * r * 1.32, cy + Math.sin(a1) * r * 1.32);
          ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = global.FZ.Paleta.CONTORNO;
        ctx.fill();
        break;

      default: // 'predio'
        rect(ctx, s * 0.14, s * 0.16, s * 0.72, s * 0.68, cor, escuro);
        ctx.fillStyle = escuro;
        ctx.fillRect(s * 0.26, s * 0.30, s * 0.48, s * 0.22);
        ctx.strokeRect(s * 0.14, s * 0.16, s * 0.72, s * 0.68);
    }
    ctx.restore();
  }

  function rect(ctx, x, y, w, h, cor, escuro) {
    ctx.fillStyle = cor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = escuro;
    ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
  }

  /** Clareia (t>0) ou escurece (t<0) uma cor hex. */
  function sombrear(hex, t) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    function mix(c) {
      var v = t >= 0 ? c + (255 - c) * t : c * (1 + t);
      return Math.max(0, Math.min(255, Math.round(v)));
    }
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }

  global.FZ = global.FZ || {};
  global.FZ.Sprites = {
    LISTA: LISTA,
    init: init,
    get: get,
    has: has,
    status: status,
    drawItem: drawItem,
    limparIcones: limparIcones,
    sombrear: sombrear
  };
})(window);
