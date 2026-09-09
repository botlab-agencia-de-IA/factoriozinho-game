/* ============================================================
   Factoriozinho — A rede elétrica
   Postes se ligam entre si, geradores põem watts na rede e as
   máquinas elétricas bebem dela — desde que estejam dentro da
   zona de algum poste daquela rede.

   As regras são as do documentos/MATEMATICA.md §6, decididas
   pelo Vandré:
     · a zona do poste é 5x5, com o poste no quadrado do meio;
     · o fio alcança 7 quadrados de centro a centro (5 da zona de
       um + 2 de vão + 5 da zona do outro = 12 de ponta a ponta);
     · gerador a carvão põe 100 W; inseridor elétrico bebe 5 W.

   Quando a rede não dá conta de todo mundo, ninguém para: todos
   ficam mais lentos na mesma proporção, como no Factorio. Uma
   rede com 100 W e 200 W de fome anda pela metade.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var World = global.FZ.World;

  /* As redes são recalculadas só quando a fábrica muda de planta —
     construir, remover ou girar. No resto do tempo é a mesma conta
     do quadro anterior. */
  var redes = [];            // [{ postes, geradores, consumidores, producao, demanda }]
  var redeDoPoste = {};      // id do poste -> rede
  var versaoCalculada = -1;

  function precisaRecalcular() {
    return World.versaoDoMundo() !== versaoCalculada;
  }

  function invalidar() { versaoCalculada = -1; }

  /** Distância de centro a centro, para o alcance do fio. */
  function distanciaEntre(a, b) {
    var ax = a.x + a.w / 2, ay = a.y + a.h / 2;
    var bx = b.x + b.w / 2, by = b.y + b.h / 2;
    return Math.hypot(ax - bx, ay - by);
  }

  /** O tile (x,y) está dentro da zona 5x5 deste poste? */
  function naZonaDoPoste(poste, x, y) {
    var raio = ((D.building(poste.tipo).zona || 5) - 1) / 2;   // 5x5 -> 2 para cada lado
    return Math.abs(x - poste.x) <= raio && Math.abs(y - poste.y) <= raio;
  }

  /** Alguma parte da máquina cai dentro da zona do poste? */
  function maquinaNaZona(poste, e) {
    for (var dy = 0; dy < e.h; dy++) {
      for (var dx = 0; dx < e.w; dx++) {
        if (naZonaDoPoste(poste, e.x + dx, e.y + dy)) return true;
      }
    }
    return false;
  }

  /* ---------------- montar as redes ---------------- */

  function recalcular() {
    versaoCalculada = World.versaoDoMundo();
    redes = [];
    redeDoPoste = {};

    var todas = World.todasEntidades();
    var postes = [], eletricas = [], geradores = [];
    var i, j;

    for (i = 0; i < todas.length; i++) {
      var e = todas[i];
      var b = D.building(e.tipo);
      if (!b) continue;
      if (b.tipo === 'pole') postes.push(e);
      else if (b.tipo === 'generator') geradores.push(e);
      else if (b.eletrico) eletricas.push(e);
    }

    /* 1. junta os postes que se alcançam. Cada grupo ligado é uma rede;
       basta um poste no meio para o fio seguir adiante. */
    var visto = {};
    for (i = 0; i < postes.length; i++) {
      if (visto[postes[i].id]) continue;

      var rede = {
        postes: [], geradores: [], consumidores: [],
        producao: 0, demanda: 0, satisfacao: 1
      };
      var fila = [postes[i]];
      visto[postes[i].id] = true;

      while (fila.length) {
        var p = fila.pop();
        rede.postes.push(p);
        redeDoPoste[p.id] = rede;
        p._rede = rede;              // o poste também pertence à própria rede

        var alcance = D.building(p.tipo).alcanceFio || 7;
        for (j = 0; j < postes.length; j++) {
          var o = postes[j];
          if (visto[o.id]) continue;
          // o alcance do menor dos dois manda, para não haver ligação de mão única
          var lim = Math.min(alcance, D.building(o.tipo).alcanceFio || 7);
          if (distanciaEntre(p, o) <= lim + 1e-6) {
            visto[o.id] = true;
            fila.push(o);
          }
        }
      }
      redes.push(rede);
    }

    /* 2. cada gerador e cada máquina elétrica entra na rede do primeiro
       poste que os cobre. Fora de qualquer zona, ficam de fora. */
    for (i = 0; i < geradores.length; i++) {
      var ger = geradores[i];
      var rg = redeQueCobre(ger);
      ger._rede = rg;
      if (rg) rg.geradores.push(ger);
    }
    for (i = 0; i < eletricas.length; i++) {
      var maq = eletricas[i];
      var rm = redeQueCobre(maq);
      maq._rede = rm;
      if (rm) rm.consumidores.push(maq);
    }
  }

  function redeQueCobre(e) {
    for (var i = 0; i < redes.length; i++) {
      var postes = redes[i].postes;
      for (var j = 0; j < postes.length; j++) {
        if (maquinaNaZona(postes[j], e)) return redes[i];
      }
    }
    return null;
  }

  function garantir() { if (precisaRecalcular()) recalcular(); }

  /* ---------------- o quadro ---------------- */

  /**
   * Fecha a conta de cada rede e queima o combustível dos geradores.
   * O gerador só gasta o que a rede pediu: uma rede parada não come
   * carvão. A plena carga ele consome como qualquer máquina — 1 carvão
   * a cada 30 s, que é a medida do jogo.
   */
  function update(dt) {
    garantir();

    for (var i = 0; i < redes.length; i++) {
      var r = redes[i];
      var j;

      // quanto a rede quer
      r.demanda = 0;
      for (j = 0; j < r.consumidores.length; j++) {
        var c = r.consumidores[j];
        if (querEnergia(c)) r.demanda += D.building(c.tipo).consumo || 0;
      }

      /* quanto ela pode dar: só conta o gerador que consegue manter o
         fogo aceso. Aqui ele ainda não gastou nada — a chama de um
         gerador parado fica guardada para quando alguém precisar. */
      r.producao = 0;
      for (j = 0; j < r.geradores.length; j++) {
        var ger = r.geradores[j];
        if (temChama(ger)) r.producao += D.building(ger.tipo).producao || 0;
      }

      r.satisfacao = r.demanda <= 0 ? 1 : Math.min(1, r.producao / r.demanda);

      // e agora queima o que foi realmente usado
      var usado = Math.min(r.demanda, r.producao);
      for (j = 0; j < r.geradores.length; j++) {
        gastarNoGerador(r.geradores[j], usado, r.producao, dt);
      }
    }
  }

  /** A máquina está querendo trabalhar agora? (parada não puxa watt) */
  function querEnergia(e) {
    return e.querEnergia !== false;
  }

  /* Acende a chama do gerador se houver combustível. Não gasta nada:
     quem gasta é gastarNoGerador, na medida do que a rede usou. */
  function temChama(e) {
    if (e.queima > 0) return true;
    var slots = e.inv && e.inv.fuel;
    if (!slots) return false;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s && D.fuelValue(s.item) > 0) {
        e.queimaMax = D.fuelValue(s.item);
        e.queima = e.queimaMax;
        s.count--;
        if (s.count <= 0) slots[i] = null;
        return true;
      }
    }
    return false;
  }

  function gastarNoGerador(e, usadoNaRede, producaoDaRede, dt) {
    if (e.queima <= 0) { e.ativo = false; e.carga = 0; return; }

    /* A parte do trabalho que coube a este gerador. Dois geradores numa
       rede que usa 50 W dividem: cada um trabalha a 25%. */
    var fatia = producaoDaRede > 0 ? (usadoNaRede / producaoDaRede) : 0;
    e.carga = fatia;
    e.ativo = fatia > 0;
    if (fatia > 0) e.queima -= dt * fatia;
    if (e.queima < 0) e.queima = 0;
  }

  /* ---------------- perguntas que as máquinas fazem ---------------- */

  /** Quanto da força a máquina tem agora: 0 (no escuro) a 1 (à vontade). */
  function forca(e) {
    garantir();
    if (!e._rede) return 0;
    return e._rede.satisfacao;
  }

  /** Está ligada em alguma rede, mesmo que sem energia? */
  function temRede(e) {
    garantir();
    return !!e._rede;
  }

  function redeDe(e) {
    garantir();
    return e._rede || null;
  }

  /** Frase curta para o painel e o inspetor. */
  function estadoDaMaquina(e) {
    garantir();
    if (!e._rede) return 'Fora da rede — falta um poste por perto';
    if (e._rede.producao <= 0) return 'Rede sem energia';
    if (e._rede.satisfacao < 0.999) {
      return 'Energia curta (' + Math.round(e._rede.satisfacao * 100) + '%)';
    }
    return null;
  }

  /** Os pares de postes ligados, para o desenho puxar o fio. */
  function fios() {
    garantir();
    var out = [];
    for (var i = 0; i < redes.length; i++) {
      var postes = redes[i].postes;
      for (var a = 0; a < postes.length; a++) {
        for (var b = a + 1; b < postes.length; b++) {
          var lim = Math.min(
            D.building(postes[a].tipo).alcanceFio || 7,
            D.building(postes[b].tipo).alcanceFio || 7
          );
          if (distanciaEntre(postes[a], postes[b]) <= lim + 1e-6) {
            out.push([postes[a], postes[b], redes[i]]);
          }
        }
      }
    }
    return out;
  }

  function todasAsRedes() { garantir(); return redes; }

  global.FZ = global.FZ || {};
  global.FZ.Energia = {
    update: update,
    recalcular: recalcular,
    invalidar: invalidar,
    forca: forca,
    temRede: temRede,
    redeDe: redeDe,
    estadoDaMaquina: estadoDaMaquina,
    fios: fios,
    naZonaDoPoste: naZonaDoPoste,
    maquinaNaZona: maquinaNaZona,
    distanciaEntre: distanciaEntre,
    todasAsRedes: todasAsRedes
  };
})(window);
