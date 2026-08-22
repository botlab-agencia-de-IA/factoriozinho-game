/* ============================================================
   Factoriozinho — Personagem
   Movimento, colisão, coleta na mão, construção e fabricação.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var C = D.CONFIG;
  var Inv = global.FZ.Inv;
  var World = global.FZ.World;
  var Entities = global.FZ.Entities;

  var DIR_BAIXO = 0, DIR_ESQ = 1, DIR_DIR = 2, DIR_CIMA = 3;

  function criar(x, y) {
    return {
      x: x, y: y,
      dir: DIR_BAIXO,
      andando: false,
      animT: 0,
      inv: Inv.criar(C.INV_SIZE),
      hotbar: 0,
      minerando: null,       // { x, y, progresso, total }
      fila: [],              // fabricação: [{ receita, progresso }]
      stats: { coletado: 0, fabricado: 0, construido: 0 }
    };
  }

  /* ---------------- movimento ---------------- */

  function colide(x, y) {
    var r = C.PLAYER_HITBOX / 2;
    var x0 = Math.floor(x - r), x1 = Math.floor(x + r);
    var y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (var ty = y0; ty <= y1; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        if (World.tileSolido(tx, ty)) return true;
      }
    }
    return false;
  }

  function mover(p, ex, ey, dt) {
    var len = Math.hypot(ex, ey);
    p.andando = len > 0.01;
    if (!p.andando) { p.animT = 0; return; }

    ex /= len; ey /= len;

    // direção do sprite: o eixo dominante manda
    if (Math.abs(ex) > Math.abs(ey)) p.dir = ex > 0 ? DIR_DIR : DIR_ESQ;
    else p.dir = ey > 0 ? DIR_BAIXO : DIR_CIMA;

    var passo = C.PLAYER_SPEED * dt;
    var nx = p.x + ex * passo;
    var ny = p.y + ey * passo;

    if (!colide(nx, p.y)) p.x = nx;
    if (!colide(p.x, ny)) p.y = ny;

    p.animT += dt;
  }

  /* ---------------- alcance ---------------- */

  function distanciaAte(p, tx, ty) {
    return Math.hypot((tx + 0.5) - p.x, (ty + 0.5) - p.y);
  }

  function noAlcance(p, tx, ty) {
    return distanciaAte(p, tx, ty) <= C.REACH;
  }

  /* ---------------- coleta na mão ---------------- */

  /**
   * Chamado enquanto o botão do mouse está segurado em cima de um tile.
   * Devolve o texto do que está minerando (para a HUD) ou null.
   */
  function minerarTile(p, tx, ty, dt) {
    var res = World.resAt(tx, ty);
    if (!res || !noAlcance(p, tx, ty)) { p.minerando = null; return null; }

    var info = D.resInfo(res);
    if (!info) { p.minerando = null; return null; }

    // tem coisa que não sai na mão (petróleo precisa de bomba)
    if (info.mao === false) {
      p.minerando = null;
      if (global.FZ.Game) global.FZ.Game.aviso(info.aviso || 'Não dá para coletar na mão.', 'erro');
      return info.nome;
    }

    // trocou de alvo? recomeça
    if (!p.minerando || p.minerando.x !== tx || p.minerando.y !== ty) {
      p.minerando = { x: tx, y: ty, progresso: 0, total: info.tempo, res: res };
    }

    // vira para o que está minerando
    var ang = Math.atan2((ty + 0.5) - p.y, (tx + 0.5) - p.x);
    if (Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang))) {
      p.dir = Math.cos(ang) > 0 ? DIR_DIR : DIR_ESQ;
    } else {
      p.dir = Math.sin(ang) > 0 ? DIR_BAIXO : DIR_CIMA;
    }

    p.minerando.progresso += dt / info.tempo;

    if (p.minerando.progresso >= 1) {
      p.minerando.progresso = 0;
      var item = World.minerar(tx, ty);
      if (item) {
        var resto = Inv.add(p.inv, item, 1);
        if (resto > 0) World.soltarItem(tx + 0.5, ty + 0.5, item, resto);
        p.stats.coletado++;
        if (global.FZ.Game) global.FZ.Game.aviso('+1 ' + D.itemNome(item), 'ganho');
      }
      // acabou o recurso do tile
      if (!World.resAt(tx, ty)) p.minerando = null;
    }
    return info.nome;
  }

  function pararDeMinerar(p) { p.minerando = null; }

  /* ---------------- construção ---------------- */

  function construir(p, itemId, tx, ty, dir) {
    var item = D.ITEMS[itemId];
    if (!item || !item.constroi) return false;
    if (!noAlcance(p, tx, ty)) return false;
    if (!World.podeConstruir(item.constroi, tx, ty)) return false;
    if (Inv.conta(p.inv, itemId) < 1) return false;

    Inv.remove(p.inv, itemId, 1);
    World.criarEntidade(item.constroi, tx, ty, dir);
    p.stats.construido++;
    return true;
  }

  /** Remove a máquina e devolve ela + o conteúdo para o inventário. */
  function remover(p, e) {
    if (!noAlcance(p, e.x, e.y)) return false;

    var devolver = Entities.conteudo(e);
    devolver.push({ item: e.tipo, count: 1 });

    World.removerEntidade(e);

    for (var i = 0; i < devolver.length; i++) {
      var d = devolver[i];
      var resto = Inv.add(p.inv, d.item, d.count);
      if (resto > 0) World.soltarItem(e.x + 0.5, e.y + 0.5, d.item, resto);
    }
    return true;
  }

  /* ---------------- fabricação na mão ---------------- */

  function podeFabricar(p, receita) {
    return Inv.temTodos(p.inv, receita.custo);
  }

  function fabricar(p, receita, vezes) {
    vezes = vezes || 1;
    var feitos = 0;
    for (var i = 0; i < vezes; i++) {
      if (!Inv.consumir(p.inv, receita.custo)) break;
      p.fila.push({ receita: receita, progresso: 0 });
      feitos++;
    }
    return feitos;
  }

  /** Cancela o último item da fila e devolve os materiais. */
  function cancelarFabricacao(p) {
    var job = p.fila.pop();
    if (!job) return;
    for (var item in job.receita.custo) {
      Inv.add(p.inv, item, job.receita.custo[item]);
    }
  }

  function updateFila(p, dt) {
    if (!p.fila.length) return;
    var job = p.fila[0];
    job.progresso += dt / job.receita.tempo;
    if (job.progresso >= 1) {
      p.fila.shift();
      var resto = Inv.add(p.inv, job.receita.saida, job.receita.qtd);
      if (resto > 0) World.soltarItem(p.x, p.y, job.receita.saida, resto);
      p.stats.fabricado += job.receita.qtd;
      if (global.FZ.Game) {
        global.FZ.Game.aviso('+' + job.receita.qtd + ' ' + D.itemNome(job.receita.saida), 'ganho');
      }
    }
  }

  /* ---------------- itens no chão ---------------- */

  function catarDrops(p, dt) {
    var drops = World.state.drops;
    for (var i = drops.length - 1; i >= 0; i--) {
      var d = drops[i];
      d.t += dt;
      if (d.t < 0.4) continue;                       // não cata no mesmo instante que soltou
      if (Math.hypot(d.x - p.x, d.y - p.y) > C.DROP_PICKUP_RADIUS) continue;
      var resto = Inv.add(p.inv, d.item, d.count);
      if (resto === 0) drops.splice(i, 1);
      else d.count = resto;
    }
  }

  /* ---------------- update geral ---------------- */

  function update(p, dt) {
    updateFila(p, dt);
    catarDrops(p, dt);
  }

  /* ---------------- hotbar ---------------- */

  function itemNaMao(p) {
    var s = p.inv[p.hotbar];
    return s ? s.item : null;
  }

  global.FZ = global.FZ || {};
  global.FZ.Player = {
    DIR_BAIXO: DIR_BAIXO, DIR_ESQ: DIR_ESQ, DIR_DIR: DIR_DIR, DIR_CIMA: DIR_CIMA,
    criar: criar,
    mover: mover,
    update: update,
    colide: colide,
    noAlcance: noAlcance,
    distanciaAte: distanciaAte,
    minerarTile: minerarTile,
    pararDeMinerar: pararDeMinerar,
    construir: construir,
    remover: remover,
    fabricar: fabricar,
    podeFabricar: podeFabricar,
    cancelarFabricacao: cancelarFabricacao,
    itemNaMao: itemNaMao
  };
})(window);
