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

  /* Se por algum motivo o jogador ficou dentro de coisa sólida —
     um save antigo, uma construção que nasceu em cima dele — ele é
     empurrado para o lugar livre mais perto, em vez de ficar preso
     ou sair atravessando parede. */
  function desencalhar(p) {
    if (!colide(p.x, p.y)) return false;
    var bx = Math.floor(p.x), by = Math.floor(p.y);
    for (var raio = 1; raio <= 8; raio++) {
      for (var dy = -raio; dy <= raio; dy++) {
        for (var dx = -raio; dx <= raio; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
          var nx = bx + dx + 0.5, ny = by + dy + 0.5;
          if (!colide(nx, ny)) { p.x = nx; p.y = ny; return true; }
        }
      }
    }
    return false;
  }

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

  /** O jogador está pisando na área onde a construção iria? */
  function pisandoNaArea(p, tipo, tx, ty) {
    var b = D.building(tipo);
    if (!b) return false;
    var r = C.PLAYER_HITBOX / 2;
    return (p.x + r) > tx && (p.x - r) < (tx + b.w) &&
           (p.y + r) > ty && (p.y - r) < (ty + b.h);
  }

  function construir(p, itemId, tx, ty, dir) {
    var item = D.ITEMS[itemId];
    if (!item || !item.constroi) return false;
    if (!noAlcance(p, tx, ty)) return false;
    if (pisandoNaArea(p, item.constroi, tx, ty)) return false;   // não em cima de si
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

  /** Dá para pagar a receita agora, sem fabricar mais nada antes? */
  function podeFabricar(p, receita) {
    return Inv.temTodos(p.inv, receita.custo);
  }

  /** A receita de mão que produz este item, se existir. */
  function receitaDe(item) {
    for (var i = 0; i < D.HAND_RECIPES.length; i++) {
      if (D.HAND_RECIPES[i].saida === item) return D.HAND_RECIPES[i];
    }
    return null;
  }

  var LIMITE_FILA = 120;        // teto de segurança para uma cascata só

  /* ---------------- fabricação em cascata ----------------
     Como no Factorio: clicou na mineradora e só tem chapa e pedra na
     mochila? O jogo monta a escada sozinho — faz as engrenagens, faz o
     forno e só então a mineradora.

     O que o planejamento devolve é a lista de trabalhos já na ORDEM de
     execução (quem depende de outro vem depois), e para cada um:

       pago    o que sai da mochila por causa DELE (o resto vem da fila)
       entrega quanto do resultado vai para a mochila quando ele terminar

     `entrega` é o que faz a escada funcionar: a engrenagem feita para
     alimentar a mineradora entrega ZERO — ela não passa pela mochila, é
     consumida ali mesmo. Só a sobra de um arredondamento é entregue. */
  function planejar(p, receita, vezes) {
    var disp = {};
    for (var i = 0; i < p.inv.length; i++) {
      var s = p.inv[i];
      if (s) disp[s.item] = (disp[s.item] || 0) + s.count;
    }

    var jobs = [];
    var naPilha = {};           // pega receita que depende de si mesma

    /** Uma rodada da receita. Devolve o índice do trabalho, ou -1. */
    function umaRodada(r) {
      if (naPilha[r.saida]) return -1;
      if (jobs.length >= LIMITE_FILA) return -1;
      naPilha[r.saida] = true;

      var pago = {};
      for (var item in r.custo) {
        var precisa = r.custo[item];
        var tem = disp[item] || 0;
        var usa = Math.min(tem, precisa);
        if (usa > 0) { disp[item] = tem - usa; pago[item] = usa; }

        var falta = precisa - usa;
        if (falta <= 0) continue;

        var sub = receitaDe(item);
        if (!sub) { naPilha[r.saida] = false; return -1; }   // material bruto que acabou

        var rodadas = Math.ceil(falta / sub.qtd);
        var criados = garantir(sub, rodadas);
        if (!criados) { naPilha[r.saida] = false; return -1; }

        /* Tudo que esses trabalhos produzem é para cá, menos a sobra do
           arredondamento — essa vai para a mochila, no último deles. */
        var sobra = rodadas * sub.qtd - falta;
        for (var c = criados.length - 1; c >= 0; c--) {
          var da = Math.min(sub.qtd, sobra);
          jobs[criados[c]].entrega = da;
          sobra -= da;
        }
      }

      naPilha[r.saida] = false;
      jobs.push({ receita: r, progresso: 0, pago: pago, entrega: r.qtd });
      return jobs.length - 1;
    }

    function garantir(r, rodadas) {
      var criados = [];
      for (var n = 0; n < rodadas; n++) {
        var idx = umaRodada(r);
        if (idx < 0) return null;
        criados.push(idx);
      }
      return criados;
    }

    return garantir(receita, vezes || 1) ? jobs : null;
  }

  /** Dá para fazer, nem que seja fabricando os pedaços antes? */
  function podeFabricarEmCascata(p, receita) {
    return planejar(p, receita, 1) !== null;
  }

  /** Quais pedaços seriam feitos antes deste item. Só para a tela. */
  function passosAntesDe(p, receita) {
    var plano = planejar(p, receita, 1);
    if (!plano) return null;
    var out = [], soma = {}, ordem = [];
    for (var i = 0; i < plano.length - 1; i++) {          // o último é o item pedido
      var id = plano[i].receita.saida;
      if (soma[id] === undefined) { soma[id] = 0; ordem.push(id); }
      soma[id] += plano[i].receita.qtd;
    }
    for (var k = 0; k < ordem.length; k++) out.push({ item: ordem[k], n: soma[ordem[k]] });
    return out;
  }

  var proximoLote = 1;

  function fabricar(p, receita, vezes) {
    var plano = planejar(p, receita, vezes || 1);
    if (!plano) return 0;

    var lote = proximoLote++;
    for (var i = 0; i < plano.length; i++) {
      var job = plano[i];
      for (var item in job.pago) Inv.remove(p.inv, item, job.pago[item]);
      job.lote = lote;
      p.fila.push(job);
    }
    return vezes || 1;
  }

  /* Cancela o último pedido inteiro — a escada toda, não só o degrau de
     cima. Cancelar só a mineradora e deixar as engrenagens rodando faria
     elas sumirem, porque elas foram feitas para não passar pela mochila. */
  function cancelarFabricacao(p) {
    if (!p.fila.length) return;
    var lote = p.fila[p.fila.length - 1].lote;

    for (var i = p.fila.length - 1; i >= 0; i--) {
      var job = p.fila[i];
      if (lote !== undefined && job.lote !== lote) continue;
      if (lote === undefined && i !== p.fila.length - 1) continue;
      for (var item in job.pago) Inv.add(p.inv, item, job.pago[item]);
      p.fila.splice(i, 1);
    }
  }

  /** Anota uma peça pronta no próximo trabalho do mesmo pedido. */
  function creditarNoLote(p, lote, item, n) {
    for (var i = 0; i < p.fila.length; i++) {
      if (p.fila[i].lote !== lote) continue;
      var pg = p.fila[i].pago;
      pg[item] = (pg[item] || 0) + n;
      return;
    }
  }

  function updateFila(p, dt) {
    if (!p.fila.length) return;
    var job = p.fila[0];
    job.progresso += dt / job.receita.tempo;
    if (job.progresso < 1) return;

    p.fila.shift();
    var qtd = (job.entrega === undefined) ? job.receita.qtd : job.entrega;

    /* O que foi feito para alimentar o próximo degrau não passa pela
       mochila — mas fica anotado nele. Assim, se o pedido for cancelado
       no meio, o que já ficou pronto volta como PEÇA PRONTA em vez de
       evaporar. Antes, cancelar depois da primeira engrenagem comia as
       duas chapas dela. */
    var interno = job.receita.qtd - qtd;
    if (interno > 0) creditarNoLote(p, job.lote, job.receita.saida, interno);

    if (qtd <= 0) return;

    var resto = Inv.add(p.inv, job.receita.saida, qtd);
    if (resto > 0) World.soltarItem(p.x, p.y, job.receita.saida, resto);
    p.stats.fabricado += qtd;
    if (global.FZ.Game) {
      global.FZ.Game.aviso('+' + qtd + ' ' + D.itemNome(job.receita.saida), 'ganho');
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
    desencalhar(p);
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
    pisandoNaArea: pisandoNaArea,
    desencalhar: desencalhar,
    remover: remover,
    fabricar: fabricar,
    podeFabricar: podeFabricar,
    podeFabricarEmCascata: podeFabricarEmCascata,
    passosAntesDe: passosAntesDe,
    planejar: planejar,
    receitaDe: receitaDe,
    cancelarFabricacao: cancelarFabricacao,
    updateFila: updateFila,
    itemNaMao: itemNaMao
  };
})(window);
