/* ============================================================
   Factoriozinho — Desenho do mundo
   Enquanto não há sprite de verdade, tudo é desenhado por
   código em texturas prontas (offscreen), o que mantém o
   desenho rápido. Quando o PNG aparece em assets/, ele entra
   no lugar automaticamente.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var R = global.FZ.Rng;
  var World = global.FZ.World;
  var Sprites = global.FZ.Sprites;
  var Entities = global.FZ.Entities;
  var Inv = global.FZ.Inv;
  var TILE = D.CONFIG.TILE;

  var canvas, ctx, largura = 0, altura = 0, dpr = 1;
  var tex = {};          // texturas provisórias já desenhadas
  var tempo = 0;
  var CHUNK = D.CONFIG.CHUNK;

  /* ============================================================
     texturas provisórias
     ============================================================ */

  function novoCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: cx };
  }

  function criarTexturas() {
    var i, v;

    /* --- terrenos: 4 variantes de cada, para o chão não ficar chapado --- */
    for (i = 0; i < D.TERRAIN_INFO.length; i++) {
      var info = D.TERRAIN_INFO[i];
      for (v = 0; v < 4; v++) {
        tex['t' + i + '_' + v] = texTerreno(info, v);
      }
    }

    /* --- jazidas: 3 densidades --- */
    for (i = 1; i < D.RES_INFO.length; i++) {
      var ri = D.RES_INFO[i];
      if (!ri || !ri.emCima) continue;
      for (v = 0; v < 3; v++) {
        tex['ore' + i + '_' + v] = texJazida(ri, v);
      }
    }

    tex.tree = texArvore();
    tex.rock = texPedra();
    tex.player = texPersonagem();

    for (var tipo in D.BUILDINGS) {
      var bt = D.BUILDINGS[tipo].tipo;
      if (bt === 'belt') {
        for (v = 0; v < 4; v++) {
          tex['belt_' + v] = texEsteira(v);
          tex['beltc_' + v] = texEsteiraCurva(v);
        }
        tex['b_' + tipo] = tex.belt_0;
      } else if (bt === 'inserter') {
        tex['b_' + tipo] = texInseridorBase(tipo);
      } else if (bt === 'pole') {
        tex['b_' + tipo] = texPoste(tipo);
      } else {
        tex['b_' + tipo] = texPredio(tipo);
      }
    }
  }

  /** Esteira vista de cima, com as ranhuras deslocadas em 4 quadros. */
  function texEsteira(quadro) {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    var p = global.FZ.Paleta.item('transport_belt', '#6b7280');

    // corpo
    c.fillStyle = p.sombra;
    c.fillRect(0, 0, TILE, TILE);
    c.fillStyle = p.base;
    c.fillRect(2, 0, TILE - 4, TILE);

    // trilhos das laterais
    c.fillStyle = p.luz;
    c.fillRect(1, 0, 2, TILE);
    c.fillRect(TILE - 3, 0, 2, TILE);

    /* Ranhuras que "correm". A esteira desta textura aponta para CIMA, então
       elas precisam subir — por isso o deslocamento é negativo. Com o sinal
       trocado a esteira parecia andar ao contrário do sentido dela. */
    c.fillStyle = p.luz;
    var passo = 8;
    var desloc = -quadro * (passo / 4);
    for (var y = -passo + desloc; y < TILE + passo; y += passo) {
      c.fillRect(4, Math.round(y), 11, 2);
      c.fillRect(TILE - 15, Math.round(y), 11, 2);
    }

    // divisória entre as duas faixas
    c.fillStyle = p.sombra;
    c.fillRect(TILE / 2 - 1, 0, 2, TILE);

    // seta discreta apontando o sentido (para cima = direção 0)
    c.fillStyle = 'rgba(255,200,87,0.5)';
    c.beginPath();
    c.moveTo(TILE / 2, 8);
    c.lineTo(TILE / 2 - 4, 14);
    c.lineTo(TILE / 2 + 4, 14);
    c.closePath();
    c.fill();

    return o.canvas;
  }

  /**
   * Esteira fazendo curva: entra pela ESQUERDA e sai para cima.
   * (Para a curva do outro lado o desenho é espelhado na hora.)
   */
  function texEsteiraCurva(quadro) {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    var p = global.FZ.Paleta.item('transport_belt', '#6b7280');

    /* O item entra pela borda ESQUERDA (0, 16) e sai pela borda de CIMA
       (16, 0). O arco que liga esses dois pontos tem centro no canto
       SUPERIOR ESQUERDO (0,0) — era aqui que estava torto: o centro
       estava no canto de baixo, então a curva saía ao contrário. */
    var CX = 0, CY = 0;
    var R_EXT = TILE - 2;         // borda externa da esteira
    var R_INT = 2;                // borda interna
    var R_MEIO = TILE / 2;        // divisória entre as duas faixas

    c.fillStyle = p.sombra;
    c.fillRect(0, 0, TILE, TILE);

    // corpo da curva: coroa entre o raio interno e o externo
    c.beginPath();
    c.arc(CX, CY, R_EXT, 0, Math.PI / 2);
    c.arc(CX, CY, R_INT, Math.PI / 2, 0, true);
    c.closePath();
    c.fillStyle = p.base;
    c.fill();

    // trilhos das bordas
    c.strokeStyle = p.luz;
    c.lineWidth = 2;
    c.beginPath(); c.arc(CX, CY, R_EXT - 1, 0, Math.PI / 2); c.stroke();
    c.beginPath(); c.arc(CX, CY, R_INT + 1, 0, Math.PI / 2); c.stroke();

    // divisória entre as duas faixas
    c.strokeStyle = p.sombra;
    c.lineWidth = 2;
    c.beginPath(); c.arc(CX, CY, R_MEIO, 0, Math.PI / 2); c.stroke();

    /* Ranhuras cruzando a curva. O ângulo 0 é a saída (topo) e π/2 é a
       entrada (esquerda), então elas precisam andar de π/2 para 0. */
    c.strokeStyle = p.luz;
    c.lineWidth = 2;
    var passos = 5;
    var avanco = (quadro / 4) * (Math.PI / 2) / passos;
    for (var i = 0; i < passos; i++) {
      var a = (Math.PI / 2) * ((i + 0.5) / passos) - avanco;
      if (a < 0) a += Math.PI / 2;
      c.beginPath();
      c.moveTo(CX + Math.cos(a) * (R_INT + 2), CY + Math.sin(a) * (R_INT + 2));
      c.lineTo(CX + Math.cos(a) * (R_EXT - 2), CY + Math.sin(a) * (R_EXT - 2));
      c.stroke();
    }

    // seta na saída (topo), apontando para cima
    c.fillStyle = 'rgba(255,200,87,0.5)';
    c.beginPath();
    c.moveTo(TILE / 2, 7);
    c.lineTo(TILE / 2 - 4, 13);
    c.lineTo(TILE / 2 + 4, 13);
    c.closePath();
    c.fill();

    return o.canvas;
  }

  /** Base do inseridor (o braço é desenhado por cima, na hora). */
  function texInseridorBase(tipo) {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    // o elétrico é vermelho, escolha dele, para os dois não se confundirem
    var p = global.FZ.Paleta.item(tipo || 'inserter', '#c4a33a');

    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(4, TILE - 5, TILE - 8, 4);

    c.fillStyle = p.base;
    c.fillRect(6, 6, TILE - 12, TILE - 12);
    c.fillStyle = p.luz;
    c.fillRect(6, 6, TILE - 12, 4);
    c.fillStyle = p.sombra;
    c.fillRect(6, TILE - 10, TILE - 12, 4);
    c.strokeStyle = global.FZ.Paleta.CONTORNO;
    c.lineWidth = 2;
    c.strokeRect(7, 7, TILE - 14, TILE - 14);

    // base do braço no meio
    c.fillStyle = global.FZ.Paleta.CONTORNO;
    c.beginPath();
    c.arc(TILE / 2, TILE / 2, 4, 0, Math.PI * 2);
    c.fill();

    return o.canvas;
  }

  function texTerreno(info, variante) {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    var p = global.FZ.Paleta.terreno(info.key, info.cor);   // ver paleta.js
    info = { key: info.key, cor: p.base, cor2: p.luz, sombra: p.sombra };

    c.fillStyle = info.cor;
    c.fillRect(0, 0, TILE, TILE);

    if (info.key === 'water') {
      c.fillStyle = info.cor2;
      for (var w = 0; w < 3; w++) {
        var wy = 6 + w * 10 + variante * 2;
        c.fillRect(4 + (w % 2) * 8, wy, 12, 2);
        c.fillRect(20, wy + 4, 8, 2);
      }
    } else {
      // salpicos determinísticos
      c.fillStyle = info.cor2;
      for (var i = 0; i < 14; i++) {
        var x = Math.floor(R.hash2(i, variante, 991) * TILE);
        var y = Math.floor(R.hash2(i, variante, 773) * TILE);
        var s = R.hash2(i, variante, 555) > 0.7 ? 2 : 1;
        c.fillRect(x, y, s, s);
      }
      if (info.key === 'grass' || info.key === 'grass_dark') {
        c.fillStyle = info.sombra;
        for (var g = 0; g < 5; g++) {
          var gx = Math.floor(R.hash2(g, variante, 313) * (TILE - 3));
          var gy = Math.floor(R.hash2(g, variante, 617) * (TILE - 4));
          c.fillRect(gx, gy, 1, 3);
          c.fillRect(gx + 2, gy + 1, 1, 2);
        }
      }
    }
    return o.canvas;
  }

  function texJazida(ri, nivel) {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    var qtd = [10, 6, 3][nivel];
    var p = global.FZ.Paleta.jazida(ri.key, ri.cor || '#888');   // ver paleta.js

    for (var i = 0; i < qtd; i++) {
      var x = 3 + Math.floor(R.hash2(i, ri.id, 4001) * (TILE - 9));
      var y = 3 + Math.floor(R.hash2(i, ri.id, 8009) * (TILE - 9));
      var s = 3 + Math.floor(R.hash2(i, ri.id, 1201) * 3);
      c.fillStyle = global.FZ.Paleta.CONTORNO;
      c.fillRect(x - 1, y - 1, s + 2, s + 2);
      c.fillStyle = p.base;
      c.fillRect(x, y, s, s);
      c.fillStyle = p.fundo;
      c.fillRect(x, y + s - 1, s, 1);
      c.fillStyle = p.sombra;
      c.fillRect(x + s - 1, y, 1, s);
      c.fillStyle = p.luz;
      c.fillRect(x, y, Math.max(1, s - 2), 1);
      c.fillStyle = p.brilho;
      c.fillRect(x, y, 1, 1);
    }
    return o.canvas;
  }

  function texArvore() {
    var o = novoCanvas(TILE, TILE + 16);
    var c = o.ctx;
    var H = TILE + 16;
    var p = global.FZ.Paleta.jazida('tree', '#2f5a28');
    var pt = global.FZ.Paleta.item('wood', '#c07a4a');   // tronco = cor da madeira

    // sombra no chão
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath();
    c.ellipse(TILE / 2, H - 5, 11, 4, 0, 0, Math.PI * 2);
    c.fill();

    // tronco
    c.fillStyle = pt.sombra;
    c.fillRect(TILE / 2 - 3, H - 16, 6, 12);
    c.fillStyle = pt.base;
    c.fillRect(TILE / 2 - 3, H - 16, 2, 12);

    // copa
    function folha(cx, cy, r, cor) {
      c.fillStyle = cor;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.fill();
    }
    folha(TILE / 2, 22, 13, p.sombra);
    folha(TILE / 2 - 7, 18, 9, p.base);
    folha(TILE / 2 + 7, 19, 9, p.base);
    folha(TILE / 2, 14, 10, p.luz);
    folha(TILE / 2 - 3, 12, 5, Sprites.sombrear(p.luz, 0.15));
    return o.canvas;
  }

  function texPedra() {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    var p = global.FZ.Paleta.jazida('rock', '#7b8391');
    c.fillStyle = 'rgba(0,0,0,0.20)';
    c.beginPath();
    c.ellipse(TILE / 2, TILE - 6, 10, 4, 0, 0, Math.PI * 2);
    c.fill();

    c.beginPath();
    c.moveTo(6, 25); c.lineTo(4, 15); c.lineTo(11, 8);
    c.lineTo(22, 7); c.lineTo(28, 16); c.lineTo(25, 26);
    c.closePath();
    c.fillStyle = p.base; c.fill();
    c.strokeStyle = global.FZ.Paleta.CONTORNO; c.lineWidth = 1; c.stroke();

    c.fillStyle = p.luz;
    c.fillRect(11, 11, 7, 4);
    c.fillStyle = p.sombra;
    c.fillRect(15, 19, 8, 3);
    return o.canvas;
  }

  function texPersonagem() {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath();
    c.ellipse(16, 29, 8, 3, 0, 0, Math.PI * 2);
    c.fill();

    // corpo
    c.fillStyle = '#2f6f9e';
    c.fillRect(9, 15, 14, 13);
    c.fillStyle = '#3d8bc4';
    c.fillRect(9, 15, 14, 4);
    // braços
    c.fillStyle = '#e8b48c';
    c.fillRect(6, 17, 3, 8);
    c.fillRect(23, 17, 3, 8);
    // cabeça
    c.fillStyle = '#f0c39a';
    c.fillRect(10, 5, 12, 11);
    // capacete
    c.fillStyle = '#ff9b2b';
    c.fillRect(9, 3, 14, 6);
    c.fillStyle = '#ffc857';
    c.fillRect(9, 3, 14, 2);
    // contorno
    c.strokeStyle = '#1a1a20';
    c.lineWidth = 1;
    c.strokeRect(9.5, 3.5, 13, 24);
    return o.canvas;
  }

  function texPredio(tipo) {
    var b = D.BUILDINGS[tipo];
    var W = b.w * TILE, H = b.h * TILE;
    var o = novoCanvas(W, H);
    var c = o.ctx;
    var p = global.FZ.Paleta.item(tipo, b.cor);   // ver paleta.js

    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(3, H - 4, W - 6, 4);

    // corpo: luz em cima, base no meio, sombra embaixo
    c.fillStyle = p.base;
    c.fillRect(2, 2, W - 4, H - 5);
    c.fillStyle = p.luz;
    c.fillRect(2, 2, W - 4, 5);
    c.fillStyle = p.sombra;
    c.fillRect(2, H - 12, W - 4, 7);
    c.strokeStyle = global.FZ.Paleta.CONTORNO;
    c.lineWidth = 2;
    c.strokeRect(3, 3, W - 6, H - 7);

    if (b.tipo === 'furnace') {
      // boca do forno
      c.fillStyle = '#2a2118';
      c.fillRect(W / 2 - 10, H / 2 - 4, 20, 14);
      c.fillStyle = '#4a3a28';
      c.fillRect(W / 2 - 10, H / 2 - 4, 20, 3);
      // chaminé
      c.fillStyle = p.sombra;
      c.fillRect(6, 6, 8, 8);
    } else if (b.tipo === 'drill') {
      var pf = global.FZ.Paleta.item('iron_plate', '#9aa3af');
      c.fillStyle = global.FZ.Paleta.item('coal', '#3a3f47').base;
      c.fillRect(W / 2 - 12, H / 2 - 10, 24, 20);
      c.fillStyle = pf.base;
      c.fillRect(W / 2 - 4, H / 2 - 14, 8, 26);
      c.fillStyle = pf.sombra;
      c.fillRect(W / 2 - 12, H / 2 + 4, 24, 4);
    } else if (b.tipo === 'chest') {
      c.fillStyle = p.sombra;
      c.fillRect(4, H / 2 - 2, W - 8, 4);
      c.fillStyle = global.FZ.Paleta.item('gold_plate', '#d0a050').base;
      c.fillRect(W / 2 - 3, H / 2 - 4, 6, 8);
    }
    return o.canvas;
  }

  /* ============================================================
     câmera
     ============================================================ */

  function init(cv) {
    canvas = cv;
    /* alpha:false — o jogo pinta a tela inteira todo quadro, então o
       navegador não precisa guardar transparência nem compor o canvas
       com o que está atrás dele. */
    ctx = canvas.getContext('2d', { alpha: false });
    criarTexturas();
    resize();
    global.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    largura = canvas.clientWidth;
    altura = canvas.clientHeight;
    canvas.width = Math.floor(largura * dpr);
    canvas.height = Math.floor(altura * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function escala(cam) { return TILE * cam.zoom; }

  function paraTela(cam, wx, wy) {
    var s = escala(cam);
    return {
      x: (wx - cam.x) * s + largura / 2,
      y: (wy - cam.y) * s + altura / 2
    };
  }

  function paraMundo(cam, sx, sy) {
    var s = escala(cam);
    return {
      x: (sx - largura / 2) / s + cam.x,
      y: (sy - altura / 2) / s + cam.y
    };
  }

  /* ============================================================
     desenho
     ============================================================ */

  function draw(g, dt) {
    if (!ctx) return;
    tempo += dt;

    var cam = g.camera;
    var s = escala(cam);
    var p = g.player;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, largura, altura);

    // faixa de tiles visíveis (com folga para a copa das árvores)
    var meiaW = largura / (2 * s), meiaH = altura / (2 * s);
    var x0 = Math.floor(cam.x - meiaW) - 1;
    var x1 = Math.ceil(cam.x + meiaW) + 1;
    var y0 = Math.floor(cam.y - meiaH) - 2;
    var y1 = Math.ceil(cam.y + meiaH) + 2;

    desenharChao(cam, x0, x1, y0, y1, s);

    /* --- objetos ordenados por Y, para o de baixo tapar o de cima --- */
    var lista = [];
    var esteiras = [];        // esteiras vão numa camada própria, rente ao chão

    // árvore e pedregulho já vieram pintados junto com o chão do chunk

    // máquinas: varre a lista de entidades do mundo em vez de perguntar
    // em cada tile se tem alguma coisa ali
    var todas = World.todasEntidades();
    for (var ei = 0; ei < todas.length; ei++) {
      var e = todas[ei];
      if (e.x + e.w <= x0 || e.x > x1 || e.y + e.h <= y0 || e.y > y1) continue;
      if (D.building(e.tipo).tipo === 'belt') esteiras.push(e);
      else lista.push({ y: e.y + e.h, tipo: 'ent', e: e });
    }

    /* Esteiras em DUAS passadas: primeiro todas as bases, depois todos os
       itens. Sem isso, a esteira desenhada depois corta os itens da anterior. */
    var k2;
    for (k2 = 0; k2 < esteiras.length; k2++) desenharBaseEsteira(cam, esteiras[k2], s);
    for (k2 = 0; k2 < esteiras.length; k2++) desenharItensEsteira(cam, esteiras[k2], s);

    var drops = World.state.drops;
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) continue;
      lista.push({ y: d.y, tipo: 'drop', d: d });
    }

    lista.push({ y: p.y + 0.4, tipo: 'player', p: p });
    lista.sort(function (a, b) { return a.y - b.y; });

    for (var k = 0; k < lista.length; k++) {
      var o = lista[k];
      if (o.tipo === 'res') desenharRecurso(cam, o.res, o.x, o.ty, s);
      else if (o.tipo === 'ent') desenharEntidade(cam, o.e, s);
      else if (o.tipo === 'drop') desenharDrop(cam, o.d, s);
      else desenharPersonagem(cam, o.p, s);
    }

    repintarArvoresNaFrente(cam, p, s);
    desenharFiosDaRede(cam, s);
    desenharBordaMundo(cam);
    desenharOverlays(g, cam, s);
  }

  /* ---------------- os fios da rede elétrica ----------------
     Um risco de poste a poste, com uma barriga leve para parecer fio
     pendurado. Amarelo quando há energia correndo, cinza quando a rede
     está no escuro — dá para ver de longe qual pedaço da fábrica caiu. */
  function desenharFiosDaRede(cam, s) {
    if (!global.FZ.Energia) return;
    var fios = global.FZ.Energia.fios();
    if (!fios.length) return;

    ctx.save();
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.lineCap = 'round';

    for (var i = 0; i < fios.length; i++) {
      var a = fios[i][0], b = fios[i][1], rede = fios[i][2];
      var pa = paraTela(cam, a.x + 0.5, a.y + 0.22);   // sai do alto do poste
      var pb = paraTela(cam, b.x + 0.5, b.y + 0.22);

      // fora da tela inteiro? não desenha
      if ((pa.x < -50 && pb.x < -50) || (pa.x > largura + 50 && pb.x > largura + 50)) continue;
      if ((pa.y < -50 && pb.y < -50) || (pa.y > altura + 50 && pb.y > altura + 50)) continue;

      var viva = rede.producao > 0;
      ctx.strokeStyle = viva ? 'rgba(255,200,87,0.75)' : 'rgba(150,157,168,0.45)';

      var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 + s * 0.18;   // a barriga
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Com o poste na mão, puxa o risco até os postes que ele alcançaria
     dali — assim ele vê se está esticando demais ANTES de gastar o fio. */
  function desenharFioDaPrevia(cam, tipo, tx, ty, s) {
    var b = D.building(tipo);
    var alcance = b.alcanceFio || 7;
    var todas = World.todasEntidades();
    var meu = { x: tx, y: ty, w: b.w, h: b.h };
    var achou = false;

    ctx.save();
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255,200,87,0.9)';

    for (var i = 0; i < todas.length; i++) {
      var o = todas[i];
      var ob = D.building(o.tipo);
      if (!ob || ob.tipo !== 'pole') continue;
      var lim = Math.min(alcance, ob.alcanceFio || 7);
      if (global.FZ.Energia.distanciaEntre(meu, o) > lim + 1e-6) continue;

      var pa = paraTela(cam, tx + 0.5, ty + 0.22);
      var pb = paraTela(cam, o.x + 0.5, o.y + 0.22);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      achou = true;
    }
    ctx.restore();
    return achou;
  }

  /* A zona 5x5 de um poste, marcada no chão. Aparece com o poste na mão
     (para ele saber o que vai cobrir antes de plantar) e ao passar o
     mouse num poste já construído. */
  function desenharZonaDoPoste(cam, tipo, tx, ty, s, corBorda, corFundo) {
    var b = D.building(tipo);
    var raio = ((b.zona || 5) - 1) / 2;
    var pos = paraTela(cam, tx - raio, ty - raio);
    var lado = (b.zona || 5) * s;

    ctx.save();
    ctx.fillStyle = corFundo;
    ctx.fillRect(pos.x, pos.y, lado, lado);
    ctx.strokeStyle = corBorda;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(pos.x + 1, pos.y + 1, lado - 2, lado - 2);
    ctx.restore();
  }

  /* Pintar um chunk custa mais de mil desenhos de uma vez. Se isso cair
     no mesmo quadro em que ele aparece na tela, dá a travadinha que se
     sente ao andar. Então o chunk do lado para onde a câmera está indo
     é pintado ANTES, um por quadro, enquanto ainda está fora da tela. */
  function adiantarChunkQueVemChegando(cam, cx0, cx1, cy0, cy1, c0, c1) {
    var dx = cam.x - camAntX, dy = cam.y - camAntY;
    camAntX = cam.x; camAntY = cam.y;
    if (redesenhosNoQuadro >= REDESENHOS_POR_QUADRO) return;

    var alvoX = dx > 0.0005 ? cx1 + 1 : (dx < -0.0005 ? cx0 - 1 : null);
    var alvoY = dy > 0.0005 ? cy1 + 1 : (dy < -0.0005 ? cy0 - 1 : null);
    var cx, cy;

    if (alvoX !== null && alvoX >= c0 && alvoX <= c1) {
      for (cy = cy0; cy <= cy1; cy++) {
        if (cacheChao[alvoX + ',' + cy]) continue;
        chaoDoChunk(alvoX, cy);
        return;
      }
    }
    if (alvoY !== null && alvoY >= c0 && alvoY <= c1) {
      for (cx = cx0; cx <= cx1; cx++) {
        if (cacheChao[cx + ',' + alvoY]) continue;
        chaoDoChunk(cx, alvoY);
        return;
      }
    }
  }

  /* As árvores vêm prontas no desenho do chunk, o que é rápido mas as
     deixa todas ATRÁS do jogador. As poucas que estão à frente dele são
     repintadas por cima — cerca de vinte tiles em volta, em vez das
     quatrocentas árvores da tela. */
  function repintarArvoresNaFrente(cam, p, s) {
    var cx = Math.floor(p.x), cy = Math.floor(p.y);
    var limite = p.y + 0.4;
    for (var ty = cy - 1; ty <= cy + 2; ty++) {
      if (ty + 1 <= limite) continue;
      for (var tx = cx - 2; tx <= cx + 2; tx++) {
        var res = World.resAt(tx, ty);
        if (!res) continue;
        var ri = D.resInfo(res);
        if (!ri || ri.emCima) continue;
        var pos = paraTela(cam, tx, ty);
        pintarObjetoDeChao(ctx, res, Math.floor(pos.x), Math.floor(pos.y), s);
      }
    }
  }

  /** Linha vermelha tracejada marcando onde o mundo acaba. */
  function desenharBordaMundo(cam) {
    var cfg = D.CONFIG;
    var p0 = paraTela(cam, cfg.MUNDO_MIN, cfg.MUNDO_MIN);
    var p1 = paraTela(cam, cfg.MUNDO_MAX + 1, cfg.MUNDO_MAX + 1);
    // só desenha se a borda estiver por perto
    if (p1.x < -40 || p0.x > largura + 40 || p1.y < -40 || p0.y > altura + 40) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(229,86,74,0.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    ctx.restore();
  }

  /* ---------------- o chão, guardado por chunk ----------------
     Chão e jazida de um chunk inteiro (32x32 tiles) são pintados uma
     vez num canvas de 32px por tile e depois é UM drawImage por chunk
     no quadro. Antes era um drawImage por tile: no zoom mais aberto
     passavam de dois mil por quadro e o jogo travava.

     Como o zoom é sempre inteiro, esticar essa imagem cai certinho
     em cima do pixel — não borra nada. */

  var cacheChao = {};        // "cx,cy" -> { canvas, uso, sujo }
  var usoAtual = 0;
  var CACHE_MAX = 14;        // ~4 MB cada; no zoom mais aberto cabem 6 na tela
  var REDESENHOS_POR_QUADRO = 2;
  var redesenhosNoQuadro = 0;
  var camAntX = 0, camAntY = 0;   // para saber para que lado a câmera anda
  /* A árvore é mais alta que o tile: a copa sobe meio tile. Por isso o
     canvas do chunk tem uma faixa de um tile em cima, senão a copa da
     primeira linha sairia cortada bem na emenda entre dois chunks. */
  var MARGEM = 1;

  /** Um tile do chão mudou (minerou, a jazida sumiu): repintar o chunk. */
  function sujarTile(x, y) {
    var k = Math.floor(x / CHUNK) + ',' + Math.floor(y / CHUNK);
    var c = cacheChao[k];
    if (c) c.sujo = true;
  }

  function limparCacheChao() { cacheChao = {}; usoAtual = 0; }

  function chaoDoChunk(cx, cy) {
    var k = cx + ',' + cy;
    var c = cacheChao[k];

    if (c && !c.sujo) { c.uso = ++usoAtual; return c.canvas; }
    if (c && c.sujo && redesenhosNoQuadro >= REDESENHOS_POR_QUADRO) {
      c.uso = ++usoAtual;                 // repinta no próximo quadro
      return c.canvas;
    }

    if (!c) {
      var novo = novoCanvas(CHUNK * TILE, (CHUNK + MARGEM) * TILE);
      c = cacheChao[k] = { canvas: novo.canvas, ctx: novo.ctx, uso: 0, sujo: true };
      podarCacheChao();
    }

    pintarChunk(c.ctx, cx, cy);
    c.sujo = false;
    c.uso = ++usoAtual;
    redesenhosNoQuadro++;
    return c.canvas;
  }

  function pintarChunk(cc, cx, cy) {
    var bx = cx * CHUNK, by = cy * CHUNK;
    var ix, iy, tx, ty, px, py, res, ri;
    cc.clearRect(0, 0, CHUNK * TILE, (CHUNK + MARGEM) * TILE);

    /* 1. chão e jazida */
    for (iy = 0; iy < CHUNK; iy++) {
      for (ix = 0; ix < CHUNK; ix++) {
        tx = bx + ix; ty = by + iy;
        px = ix * TILE; py = (iy + MARGEM) * TILE;

        var t = World.terrainAt(tx, ty);
        var img = Sprites.get('tiles/' + D.terrainInfo(t).key);
        if (img) cc.drawImage(img, px, py, TILE, TILE);
        else {
          var v = Math.floor(R.hash2(tx, ty, 12345) * 4);
          cc.drawImage(tex['t' + t + '_' + v], px, py, TILE, TILE);
        }

        res = World.resAt(tx, ty);
        if (!res) continue;
        ri = D.resInfo(res);
        if (!ri || !ri.emCima) continue;
        var qtd = World.amountAt(tx, ty);
        var nivel = D.nivelDaJazida(res, qtd);
        var oimg = Sprites.get(ri.sprite);
        if (oimg) cc.drawImage(oimg, px, py, TILE, TILE);
        else cc.drawImage(tex['ore' + res + '_' + nivel], px, py, TILE, TILE);
      }
    }

    /* 2. árvore e pedregulho, de cima para baixo, para a de baixo tapar
       a de cima como acontece no mundo */
    for (iy = 0; iy < CHUNK; iy++) {
      for (ix = 0; ix < CHUNK; ix++) {
        tx = bx + ix; ty = by + iy;
        res = World.resAt(tx, ty);
        if (!res) continue;
        ri = D.resInfo(res);
        if (!ri || ri.emCima) continue;
        pintarObjetoDeChao(cc, res, ix * TILE, (iy + MARGEM) * TILE, TILE);
      }
    }
  }

  /** Árvore ou pedregulho, num tamanho de tile qualquer. */
  function pintarObjetoDeChao(cc, res, px, py, tam) {
    if (res === D.RES.TREE) {
      var h = tam * 1.5;
      var img = Sprites.get('world/tree');
      cc.drawImage(img || tex.tree, px, py - (h - tam), Math.ceil(tam), Math.ceil(h));
    } else {
      var img2 = Sprites.get('world/rock');
      cc.drawImage(img2 || tex.rock, px, py, Math.ceil(tam), Math.ceil(tam));
    }
  }

  /** Guarda só os chunks usados há pouco: cada um pesa alguns MB. */
  function podarCacheChao() {
    var chaves = Object.keys(cacheChao);
    while (chaves.length > CACHE_MAX) {
      var pior = null, piorUso = Infinity;
      for (var i = 0; i < chaves.length; i++) {
        var u = cacheChao[chaves[i]].uso;
        if (u < piorUso) { piorUso = u; pior = chaves[i]; }
      }
      delete cacheChao[pior];
      chaves.splice(chaves.indexOf(pior), 1);
    }
  }

  function desenharChao(cam, x0, x1, y0, y1, s) {
    redesenhosNoQuadro = 0;
    var cfg = D.CONFIG;
    var c0 = Math.floor(cfg.MUNDO_MIN / CHUNK), c1 = Math.floor(cfg.MUNDO_MAX / CHUNK);
    var cx0 = Math.max(c0, Math.floor(x0 / CHUNK));
    var cx1 = Math.min(c1, Math.floor(x1 / CHUNK));
    var cy0 = Math.max(c0, Math.floor(y0 / CHUNK));
    var cy1 = Math.min(c1, Math.floor(y1 / CHUNK));

    adiantarChunkQueVemChegando(cam, cx0, cx1, cy0, cy1, c0, c1);

    for (var cy = cy0; cy <= cy1; cy++) {
      for (var cx = cx0; cx <= cx1; cx++) {
        var img = chaoDoChunk(cx, cy);
        // arredonda os dois cantos com a mesma conta: assim um chunk
        // encosta no outro sem deixar risco de 1 pixel no meio
        var ex = (cx * CHUNK - cam.x) * s + largura / 2;
        var ey = (cy * CHUNK - MARGEM - cam.y) * s + altura / 2;
        var px = Math.round(ex), py = Math.round(ey);
        var pw = Math.round(ex + CHUNK * s) - px;
        var ph = Math.round(ey + (CHUNK + MARGEM) * s) - py;
        ctx.drawImage(img, px, py, pw, ph);
      }
    }
  }

  function desenharRecurso(cam, res, tx, ty, s) {
    var ri = D.resInfo(res);
    var pos = paraTela(cam, tx, ty);

    if (res === D.RES.TREE) {
      var img = Sprites.get('world/tree');
      var h = s * 1.5;
      var px = Math.floor(pos.x), py = Math.floor(pos.y - (h - s));
      if (img) ctx.drawImage(img, px, py, Math.ceil(s), Math.ceil(h));
      else ctx.drawImage(tex.tree, px, py, Math.ceil(s), Math.ceil(h));
    } else {
      var img2 = Sprites.get('world/rock');
      ctx.drawImage(img2 || tex.rock, Math.floor(pos.x), Math.floor(pos.y),
        Math.ceil(s), Math.ceil(s));
    }
  }

  /* ---------------- esteira ---------------- */

  var DIR_DX = [0, 1, 0, -1];
  var DIR_DY = [-1, 0, 1, 0];

  var DESVIO_FAIXA = 0.21;   // quanto cada faixa sai do meio da esteira

  /**
   * Onde no mundo está um item na posição `pos` (0..1) da faixa `faixa`.
   * Se a esteira faz curva, o caminho vira um arco de quarto de volta.
   */
  /* Um ponto só, reaproveitado. Desenhar uma base cheia chama isto milhares
     de vezes por quadro, e devolver um objeto novo em cada chamada enchia a
     memória de lixo para o coletor limpar no meio da animação. */
  var pontoEsteira = { x: 0, y: 0 };

  function posNaEsteira(e, pos, faixa, forma) {
    var dx = DIR_DX[e.dir], dy = DIR_DY[e.dir];
    var rx = -dy, ry = dx;                                  // vetor "direita"
    var off = (faixa === 1 ? DESVIO_FAIXA : -DESVIO_FAIXA);
    var cx = e.x + 0.5, cy = e.y + 0.5;
    var p = pontoEsteira;

    if (!forma) {
      p.x = cx + dx * (pos - 0.5) + rx * off;
      p.y = cy + dy * (pos - 0.5) + ry * off;
      return p;
    }

    /* --- curva: o item percorre um arco de quarto de volta ---
       O centro do arco é o canto onde a borda de entrada encontra a borda
       de saída. A faixa de dentro da curva anda num raio menor que a de fora. */
    var L = forma;                             // -1 entra pela esquerda · +1 pela direita

    var qx = cx + rx * 0.5 * L + dx * 0.5;     // canto = centro do arco
    var qy = cy + ry * 0.5 * L + dy * 0.5;

    var raio = 0.5 - off * L;                  // faixa de dentro = raio menor
    var a0 = Math.atan2(-dy, -dx);             // ângulo da entrada
    var a1 = Math.atan2(-ry * L, -rx * L);     // ângulo da saída

    var da = a1 - a0;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;

    var a = a0 + da * pos;
    p.x = qx + Math.cos(a) * raio;
    p.y = qy + Math.sin(a) * raio;
    return p;
  }

  function desenharBaseEsteira(cam, e, s) {
    var pos = paraTela(cam, e.x, e.y);
    var px = Math.floor(pos.x), py = Math.floor(pos.y);
    var w = Math.ceil(s);

    var forma = Entities.formaDaEsteira(e);
    e._forma = forma;                       // guarda para os itens usarem

    // a esteira só "corre" quando tem coisa andando nela
    var quadro = e.ativo ? (Math.floor(tempo * 8) % 4) : 0;
    var img = Sprites.get('buildings/transport_belt');
    var arte = img || (forma ? tex['beltc_' + quadro] : tex['belt_' + quadro]);

    ctx.save();
    ctx.translate(px + w / 2, py + w / 2);
    if (e.dir) ctx.rotate((e.dir === 1 ? 90 : e.dir === 2 ? 180 : 270) * Math.PI / 180);
    // a textura da curva é desenhada vindo da esquerda; para a direita, espelha
    if (forma > 0 && !img) ctx.scale(-1, 1);
    ctx.drawImage(arte, -w / 2, -w / 2, w, w);
    ctx.restore();
  }

  function desenharItensEsteira(cam, e, s) {
    Entities.garantirFaixas(e);
    var tam = s * 0.34;
    var meia = tam / 2;
    var forma = e._forma || 0;
    // a conta de paraTela, aberta aqui para não criar um objeto por item
    var ox = largura / 2 - cam.x * s, oy = altura / 2 - cam.y * s;

    for (var f = 0; f < 2; f++) {
      var lista = e.faixas[f];
      for (var i = 0; i < lista.length; i++) {
        var it = lista[i];
        var wp = posNaEsteira(e, it.pos, f, forma);
        Sprites.drawItem(ctx, it.item, wp.x * s + ox - meia, wp.y * s + oy - meia, tam);
      }
    }
  }

  function desenharEsteira(cam, e, s) {
    desenharBaseEsteira(cam, e, s);
    desenharItensEsteira(cam, e, s);
  }

  /** Poste elétrico: um mastro fino com o isolador em cima. */
  function texPoste(tipo) {
    var o = novoCanvas(TILE, TILE);
    var c = o.ctx;
    var p = global.FZ.Paleta.item(tipo, '#a97c4a');

    // base larga, para não parecer que flutua
    c.fillStyle = p.sombra;
    c.fillRect(TILE / 2 - 6, TILE - 8, 12, 5);
    c.fillStyle = p.base;
    c.fillRect(TILE / 2 - 5, TILE - 9, 10, 4);

    // mastro
    c.fillStyle = p.base;
    c.fillRect(TILE / 2 - 2, 6, 4, TILE - 14);
    c.fillStyle = p.luz;
    c.fillRect(TILE / 2 - 2, 6, 2, TILE - 14);

    // braço de cima, onde o fio se prende
    c.fillStyle = p.sombra;
    c.fillRect(TILE / 2 - 8, 6, 16, 3);
    c.fillStyle = p.brilho;
    c.fillRect(TILE / 2 - 8, 4, 3, 3);
    c.fillRect(TILE / 2 + 5, 4, 3, 3);

    c.strokeStyle = global.FZ.Paleta.CONTORNO;
    c.lineWidth = 1;
    c.strokeRect(TILE / 2 - 2.5, 5.5, 5, TILE - 13);
    return o.canvas;
  }

  /* ---------------- inseridor ---------------- */

  function desenharInseridor(cam, e, s) {
    var pos = paraTela(cam, e.x, e.y);
    var px = Math.floor(pos.x), py = Math.floor(pos.y);
    var w = Math.ceil(s);

    var img = Sprites.get('buildings/' + e.tipo);
    ctx.drawImage(img || tex['b_' + e.tipo] || tex.b_inserter, px, py, w, w);

    var cx = pos.x + s / 2, cy = pos.y + s / 2;

    // seta fixa na base, para saber de relance para que lado ele joga
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate([-Math.PI / 2, 0, Math.PI / 2, Math.PI][e.dir]);
    ctx.fillStyle = 'rgba(255,155,43,0.85)';
    ctx.beginPath();
    ctx.moveTo(s * 0.34, 0);
    ctx.lineTo(s * 0.14, -s * 0.13);
    ctx.lineTo(s * 0.14, s * 0.13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* o braço vai do lado de trás ao lado da frente.
       t = 0 → totalmente atrás · t = 1 → totalmente à frente */
    var t = Math.min(1, e.progresso || 0);
    var indoBuscar = !e.segurando;
    var frac = indoBuscar ? (1 - t) : t;          // buscando: volta para trás
    var alcance = (frac * 2 - 1) * s * 0.72;      // -0.72s (trás) até +0.72s (frente)

    var bx = cx + DIR_DX[e.dir] * alcance;
    var by = cy + DIR_DY[e.dir] * alcance;

    var p = global.FZ.Paleta.item(e.tipo, '#c4a33a');
    ctx.strokeStyle = global.FZ.Paleta.CONTORNO;
    ctx.lineWidth = Math.max(3, s * 0.14);
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(bx, by);
    ctx.stroke();

    ctx.strokeStyle = e.ativo ? p.luz : p.sombra;
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(bx, by);
    ctx.stroke();

    // a mão, com o item se estiver carregando
    if (e.segurando) {
      var tam = s * 0.4;
      Sprites.drawItem(ctx, e.segurando, bx - tam / 2, by - tam / 2, tam);
    } else {
      ctx.fillStyle = p.base;
      ctx.beginPath();
      ctx.arc(bx, by, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = global.FZ.Paleta.CONTORNO;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // avisos
    if (!e.ativo) {
      var bi = D.building(e.tipo);
      var semLuz = bi.eletrico && global.FZ.Energia && !global.FZ.Energia.temRede(e);
      var msg = e.semDestino ? '⬦'
        : semLuz ? '⚡'
        : (!bi.eletrico && Inv.vazio(e.inv.fuel) && e.queima <= 0 ? '🔥' : null);
      if (msg) {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(tempo * 3);
        ctx.font = Math.floor(s * 0.45) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffc857';
        ctx.fillText(msg, px + w / 2, py - 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  function desenharEntidade(cam, e, s) {
    var b = D.building(e.tipo);
    if (b.tipo === 'belt') { desenharEsteira(cam, e, s); return; }
    if (b.tipo === 'inserter') { desenharInseridor(cam, e, s); return; }

    var pos = paraTela(cam, e.x, e.y);
    var w = Math.ceil(b.w * s), h = Math.ceil(b.h * s);
    var px = Math.floor(pos.x), py = Math.floor(pos.y);

    var img = Sprites.get('buildings/' + e.tipo);
    ctx.save();

    if (b.giravel && e.dir) {
      // gira em torno do centro
      ctx.translate(px + w / 2, py + h / 2);
      ctx.rotate((e.dir === 1 ? 90 : e.dir === 2 ? 180 : 270) * Math.PI / 180);
      ctx.drawImage(img || tex['b_' + e.tipo], -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img || tex['b_' + e.tipo], px, py, w, h);
      ctx.restore();
    }

    // fogo aceso
    if (e.queima > 0 && e.ativo) {
      var pisca = 0.55 + 0.45 * Math.sin(tempo * 12 + e.id);
      ctx.fillStyle = 'rgba(255,150,40,' + (0.35 * pisca) + ')';
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h * 0.62, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    // seta de saída
    if (b.giravel) {
      var t = Entities.tileSaida(e);
      var tp = paraTela(cam, t.x + 0.5, t.y + 0.5);
      ctx.fillStyle = 'rgba(255,155,43,0.55)';
      ctx.beginPath();
      var ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][e.dir];
      var r = s * 0.2;
      ctx.translate(tp.x, tp.y);
      ctx.rotate(ang);
      ctx.moveTo(r, 0); ctx.lineTo(-r * 0.6, -r * 0.7); ctx.lineTo(-r * 0.6, r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // aviso de problema
    if (!e.ativo && b.tipo !== 'chest' && b.tipo !== 'pole') {
      var msg = null;
      if (e.semJazida) msg = '⛏';
      else if (b.tipo === 'generator' && global.FZ.Energia && !global.FZ.Energia.temRede(e)) msg = '⚡';
      else if (e.inv.fuel && e.queima <= 0 && Inv.vazio(e.inv.fuel)) msg = '🔥';
      if (msg) {
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(tempo * 3);
        ctx.font = Math.floor(s * 0.5) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(msg, px + w / 2, py - 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  function desenharDrop(cam, d, s) {
    var pos = paraTela(cam, d.x, d.y);
    var tam = s * 0.5;
    var flut = Math.sin(tempo * 3 + d.x * 3) * s * 0.05;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + tam * 0.35, tam * 0.4, tam * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    Sprites.drawItem(ctx, d.item, pos.x - tam / 2, pos.y - tam / 2 + flut, tam);
  }

  function desenharPersonagem(cam, p, s) {
    var pos = paraTela(cam, p.x, p.y);
    var tam = Math.ceil(s);
    var px = Math.floor(pos.x - tam / 2);
    var py = Math.floor(pos.y - tam * 0.72);

    var folha = Sprites.get('player/player');
    if (folha) {
      // folha 4x4: linha = direção, coluna = quadro
      var quadro = p.andando ? (Math.floor(p.animT * 8) % 4) : 0;
      var linha = p.dir;   // 0 baixo, 1 esq, 2 dir, 3 cima
      var fw = folha.naturalWidth / 4, fh = folha.naturalHeight / 4;
      ctx.drawImage(folha, quadro * fw, linha * fh, fw, fh, px, py, tam, tam);
    } else {
      var balanco = p.andando ? Math.sin(p.animT * 14) * s * 0.03 : 0;
      ctx.drawImage(tex.player, px, Math.floor(py + balanco), tam, tam);
      // indicador de para onde está olhando
      var dx = [0, -1, 1, 0][p.dir], dy = [1, 0, 0, -1][p.dir];
      ctx.fillStyle = 'rgba(255,155,43,0.5)';
      ctx.beginPath();
      ctx.arc(pos.x + dx * s * 0.42, pos.y + dy * s * 0.42 - s * 0.1, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------------- overlays de interação ---------------- */

  /**
   * Seta gorda dentro de um tile, apontando para onde o fluxo vai.
   * `sentido` +1 = para fora da máquina · -1 = para dentro dela
   */
  function setaNoTile(cam, tile, dir, s, cor, sentido) {
    var p = paraTela(cam, tile.x + 0.5, tile.y + 0.5);
    var ang = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][dir];
    if (sentido < 0) ang += Math.PI;

    var r = s * 0.30;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(ang);

    // corpo da seta
    ctx.fillStyle = cor;
    ctx.strokeStyle = 'rgba(0,0,0,0.65)';
    ctx.lineWidth = Math.max(1.5, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.35, -r * 0.85);
    ctx.lineTo(-r * 0.35, -r * 0.32);
    ctx.lineTo(-r, -r * 0.32);
    ctx.lineTo(-r, r * 0.32);
    ctx.lineTo(-r * 0.35, r * 0.32);
    ctx.lineTo(-r * 0.35, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  var COR_ENTRA = 'rgba(111,194,107,0.92)';   // verde: por onde ENTRA
  var COR_SAI   = 'rgba(255,155,43,0.95)';    // laranja: por onde SAI

  /** Mostra de onde a máquina pega e para onde ela joga. */
  function desenharFluxo(cam, ent, s) {
    var b = D.building(ent.tipo);
    if (!b.giravel) return;

    var saida = Entities.tileSaida(ent);
    setaNoTile(cam, saida, ent.dir, s, COR_SAI, 1);

    // só o inseridor puxa de trás; esteira e mineradora não
    if (b.tipo === 'inserter') {
      var entrada = Entities.tileEntrada(ent);
      setaNoTile(cam, entrada, ent.dir, s, COR_ENTRA, 1);
    }
  }

  function desenharOverlays(g, cam, s) {
    var p = g.player;
    var cur = g.cursor;
    if (!cur) return;

    var tx = cur.tx, ty = cur.ty;
    var dentro = global.FZ.Player.noAlcance(p, tx, ty);
    var mao = global.FZ.Player.itemNaMao(p);
    // a estrutura pode estar presa no cursor, vinda da mochila
    var noCursor = global.FZ.Hud && global.FZ.Hud.itemDoCursor ? global.FZ.Hud.itemDoCursor() : null;
    if (noCursor && D.ITEMS[noCursor] && D.ITEMS[noCursor].constroi) mao = noCursor;
    var itemInfo = mao ? D.ITEMS[mao] : null;

    /* fantasma de construção */
    if (itemInfo && itemInfo.constroi) {
      var b = D.building(itemInfo.constroi);
      var ok = dentro && World.podeConstruir(itemInfo.constroi, tx, ty) &&
               !global.FZ.Player.pisandoNaArea(p, itemInfo.constroi, tx, ty);
      var pos = paraTela(cam, tx, ty);
      var w = b.w * s, h = b.h * s;
      var px = Math.floor(pos.x), py = Math.floor(pos.y);

      ctx.globalAlpha = 0.6;
      if (b.giravel && g.dirConstrucao) {
        ctx.save();
        ctx.translate(px + w / 2, py + h / 2);
        ctx.rotate((g.dirConstrucao === 1 ? 90 : g.dirConstrucao === 2 ? 180 : 270) * Math.PI / 180);
        ctx.drawImage(tex['b_' + itemInfo.constroi], -w / 2, -h / 2, Math.ceil(w), Math.ceil(h));
        ctx.restore();
      } else {
        ctx.drawImage(tex['b_' + itemInfo.constroi], px, py, Math.ceil(w), Math.ceil(h));
      }
      ctx.globalAlpha = 1;

      ctx.strokeStyle = ok ? 'rgba(111,194,107,0.95)' : 'rgba(229,86,74,0.95)';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, w - 2, h - 2);

      /* Com o poste na mão ele precisa ver o que aquele lugar vai cobrir,
         e se dali o fio ainda alcança a rede que já existe. */
      if (b.tipo === 'pole') {
        desenharZonaDoPoste(cam, itemInfo.constroi, tx, ty, s,
          'rgba(255,200,87,0.8)', 'rgba(255,200,87,0.10)');
        desenharFioDaPrevia(cam, itemInfo.constroi, tx, ty, s);
      }
      // a zona que o gerador precisa alcançar já aparece pelo poste

      if (b.giravel) {
        desenharFluxo(cam, { tipo: itemInfo.constroi, x: tx, y: ty, w: b.w, h: b.h, dir: g.dirConstrucao }, s);
      }
      return;
    }

    /* destaque do tile sob o mouse */
    var res = World.resAt(tx, ty);
    var ent = World.entityAt(tx, ty);

    // passar o mouse num poste mostra o que ele cobre
    if (ent && D.building(ent.tipo).tipo === 'pole') {
      desenharZonaDoPoste(cam, ent.tipo, ent.x, ent.y, s,
        'rgba(255,200,87,0.7)', 'rgba(255,200,87,0.08)');
    }

    if (ent) {
      var ep = paraTela(cam, ent.x, ent.y);
      ctx.strokeStyle = dentro ? 'rgba(255,200,87,0.9)' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.floor(ep.x) + 1, Math.floor(ep.y) + 1, ent.w * s - 2, ent.h * s - 2);
      // passando o mouse em cima, mostra de onde pega e para onde joga
      desenharFluxo(cam, ent, s);
    } else if (res) {
      var rp = paraTela(cam, tx, ty);
      ctx.strokeStyle = dentro ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.floor(rp.x) + 1, Math.floor(rp.y) + 1, s - 2, s - 2);
    }

    /* barra de progresso da coleta */
    if (p.minerando) {
      var mp = paraTela(cam, p.minerando.x + 0.5, p.minerando.y);
      var bw = s * 0.9;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(mp.x - bw / 2, mp.y - 12, bw, 7);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(mp.x - bw / 2 + 1, mp.y - 11, (bw - 2) * p.minerando.progresso, 5);
    }
  }

  /* ---------------- grade opcional ---------------- */

  function desenharGrade(cam, s) {
    var meiaW = largura / (2 * s), meiaH = altura / (2 * s);
    var x0 = Math.floor(cam.x - meiaW), x1 = Math.ceil(cam.x + meiaW);
    var y0 = Math.floor(cam.y - meiaH), y1 = Math.ceil(cam.y + meiaH);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = x0; x <= x1; x++) {
      var px = Math.floor(paraTela(cam, x, 0).x) + 0.5;
      ctx.moveTo(px, 0); ctx.lineTo(px, altura);
    }
    for (var y = y0; y <= y1; y++) {
      var py = Math.floor(paraTela(cam, 0, y).y) + 0.5;
      ctx.moveTo(0, py); ctx.lineTo(largura, py);
    }
    ctx.stroke();
  }

  global.FZ = global.FZ || {};
  global.FZ.Render = {
    init: init,
    resize: resize,
    draw: draw,
    sujarTile: sujarTile,
    limparCacheChao: limparCacheChao,
    paraTela: paraTela,
    paraMundo: paraMundo,
    desenharGrade: desenharGrade,
    get largura() { return largura; },
    get altura() { return altura; }
  };
})(window);
