/* ============================================================
   Factoriozinho — Mapa
   Desenha o mundo inteiro num canvas de 1 pixel por tile.
   Serve para o minimapa do canto e para o mapa grande (tecla M).
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var C = D.CONFIG;
  var World = global.FZ.World;

  var LADO = C.MUNDO_TILES;      // 320 px = 320 tiles
  var MIN = C.MUNDO_MIN;

  var canvas = null, ctx = null, imgData = null, dados = null;
  var sujo = false;
  var pronto = false;

  /* Todas as cores do mapa saem de src/js/game/paleta.js. */
  var CORES_TERRENO = [];      // índice do terreno -> [r,g,b]
  var CORES_RES = {};          // res id -> [r,g,b]
  var COR_ENTIDADE = [255, 155, 43];

  function hexParaRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return [255, 0, 255];
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  function prepararCores() {
    var P = global.FZ.Paleta;
    var i;
    CORES_TERRENO = [];
    for (i = 0; i < D.TERRAIN_INFO.length; i++) {
      var t = D.TERRAIN_INFO[i];
      CORES_TERRENO.push(hexParaRgb(P.terreno(t.key, t.cor).base));
    }
    CORES_RES = {};
    for (i = 1; i < D.RES_INFO.length; i++) {
      var ri = D.RES_INFO[i];
      if (!ri) continue;
      CORES_RES[ri.id] = hexParaRgb(P.jazida(ri.key, ri.cor || '#ff00ff').base);
    }
  }

  /* ---------------- construção ---------------- */

  function init() {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = LADO;
      canvas.height = LADO;
      ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      prepararCores();
    }
    imgData = ctx.createImageData(LADO, LADO);
    dados = imgData.data;
    pronto = false;

    World.gerarTudo();

    for (var y = 0; y < LADO; y++) {
      for (var x = 0; x < LADO; x++) pintar(x + MIN, y + MIN);
    }
    ctx.putImageData(imgData, 0, 0);
    pronto = true;
    sujo = false;
  }

  /** Calcula e escreve a cor de um tile no buffer. */
  function pintar(wx, wy) {
    var px = wx - MIN, py = wy - MIN;
    if (px < 0 || px >= LADO || py < 0 || py >= LADO) return;
    var off = (py * LADO + px) * 4;

    var cor;
    if (World.entityAt(wx, wy)) {
      cor = COR_ENTIDADE;
    } else {
      var res = World.resAt(wx, wy);
      if (res && CORES_RES[res]) cor = CORES_RES[res];
      else cor = CORES_TERRENO[World.terrainAt(wx, wy)] || CORES_TERRENO[2];
    }

    dados[off] = cor[0];
    dados[off + 1] = cor[1];
    dados[off + 2] = cor[2];
    dados[off + 3] = 255;
  }

  function atualizarTile(wx, wy) {
    if (!pronto) return;
    pintar(wx, wy);
    sujo = true;
  }

  function atualizarArea(wx, wy, w, h) {
    if (!pronto) return;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) pintar(wx + x, wy + y);
    }
    sujo = true;
  }

  function aplicarSujeira() {
    if (!sujo || !pronto) return;
    ctx.putImageData(imgData, 0, 0);
    sujo = false;
  }

  /* ---------------- desenho ---------------- */

  /**
   * Minimapa: um recorte quadrado ao redor do jogador.
   * @param destCtx contexto de destino
   * @param tam lado do minimapa em pixels
   * @param player jogador (para centralizar e marcar)
   * @param tilesVisiveis quantos tiles cabem no recorte
   */
  function desenharMini(destCtx, tam, player, tilesVisiveis) {
    if (!pronto) return;
    aplicarSujeira();

    var meio = tilesVisiveis / 2;
    var sx = (player.x - MIN) - meio;
    var sy = (player.y - MIN) - meio;

    destCtx.imageSmoothingEnabled = false;
    destCtx.clearRect(0, 0, tam, tam);

    // fundo (o que estiver fora do mundo)
    destCtx.fillStyle = '#0a0b0d';
    destCtx.fillRect(0, 0, tam, tam);

    destCtx.drawImage(canvas, sx, sy, tilesVisiveis, tilesVisiveis, 0, 0, tam, tam);

    // jogador no centro
    var escala = tam / tilesVisiveis;
    destCtx.fillStyle = '#ffffff';
    destCtx.fillRect(tam / 2 - 2, tam / 2 - 2, 4, 4);
    destCtx.strokeStyle = '#1a1a20';
    destCtx.lineWidth = 1;
    destCtx.strokeRect(tam / 2 - 2.5, tam / 2 - 2.5, 5, 5);

    // direção do olhar
    var dx = [0, -1, 1, 0][player.dir], dy = [1, 0, 0, -1][player.dir];
    destCtx.fillStyle = '#ff9b2b';
    destCtx.fillRect(tam / 2 - 1 + dx * 5, tam / 2 - 1 + dy * 5, 2, 2);

    return escala;
  }

  /**
   * Mapa grande: o mundo inteiro, ajustado ao tamanho pedido.
   */
  function desenharGrande(destCtx, largura, altura, player, entidades) {
    if (!pronto) return null;
    aplicarSujeira();

    var escala = Math.floor(Math.min(largura / LADO, altura / LADO) * 100) / 100;
    if (escala <= 0) escala = 1;
    var w = LADO * escala, h = LADO * escala;
    var ox = Math.floor((largura - w) / 2), oy = Math.floor((altura - h) / 2);

    destCtx.imageSmoothingEnabled = false;
    destCtx.clearRect(0, 0, largura, altura);
    destCtx.fillStyle = '#101216';
    destCtx.fillRect(0, 0, largura, altura);

    destCtx.drawImage(canvas, 0, 0, LADO, LADO, ox, oy, w, h);

    // borda do mundo
    destCtx.strokeStyle = '#3a4049';
    destCtx.lineWidth = 2;
    destCtx.strokeRect(ox - 1, oy - 1, w + 2, h + 2);

    // jogador
    var jx = ox + (player.x - MIN) * escala;
    var jy = oy + (player.y - MIN) * escala;
    destCtx.fillStyle = '#ffffff';
    destCtx.beginPath();
    destCtx.arc(jx, jy, 4, 0, Math.PI * 2);
    destCtx.fill();
    destCtx.strokeStyle = '#1a1a20';
    destCtx.lineWidth = 2;
    destCtx.stroke();

    // anel pulsante, para achar o jogador de relance
    destCtx.strokeStyle = 'rgba(255,155,43,0.8)';
    destCtx.lineWidth = 2;
    destCtx.beginPath();
    destCtx.arc(jx, jy, 8 + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
    destCtx.stroke();

    return { escala: escala, ox: ox, oy: oy, w: w, h: h };
  }

  /** Converte um clique no mapa grande para coordenada do mundo. */
  function mapaParaMundo(info, mx, my) {
    return {
      x: (mx - info.ox) / info.escala + MIN,
      y: (my - info.oy) / info.escala + MIN
    };
  }

  /** Conta quanto ainda existe de cada recurso no mundo inteiro. */
  function inventarioDoMundo() {
    var total = {};
    for (var y = MIN; y <= C.MUNDO_MAX; y++) {
      for (var x = MIN; x <= C.MUNDO_MAX; x++) {
        var r = World.resAt(x, y);
        if (!r) continue;
        total[r] = (total[r] || 0) + World.amountAt(x, y);
      }
    }
    return total;
  }

  global.FZ = global.FZ || {};
  global.FZ.Minimap = {
    init: init,
    atualizarTile: atualizarTile,
    atualizarArea: atualizarArea,
    desenharMini: desenharMini,
    desenharGrande: desenharGrande,
    mapaParaMundo: mapaParaMundo,
    inventarioDoMundo: inventarioDoMundo,
    get pronto() { return pronto; },
    get canvas() { return canvas; }
  };
})(window);
