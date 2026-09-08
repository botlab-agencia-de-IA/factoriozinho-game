/* ============================================================
   Factoriozinho — Inventário
   Um inventário é só um array de slots. Cada slot é
   { item: 'wood', count: 12 } ou null.
   As mesmas funções servem para a mochila, o baú e os slots
   internos das máquinas.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;

  function criar(n) { return new Array(n).fill(null); }

  /** Quantos cabem ainda de um item, no total. */
  function espacoPara(slots, item) {
    var max = D.stackMax(item), total = 0;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (!s) total += max;
      else if (s.item === item) total += Math.max(0, max - s.count);
    }
    return total;
  }

  function cabe(slots, item, count) {
    return espacoPara(slots, item) >= count;
  }

  /**
   * Guarda itens só numa parte do inventário (do slot `ini` até `fim`).
   * Preenche pilhas já começadas antes de abrir slot novo, e sempre da
   * esquerda para a direita, de cima para baixo.
   * @returns {number} quanto NÃO coube
   */
  function addFaixa(slots, item, count, ini, fim) {
    if (!item || count <= 0) return 0;
    var max = D.stackMax(item);
    var i;

    for (i = ini; i < fim && count > 0; i++) {
      var s = slots[i];
      if (s && s.item === item && s.count < max) {
        var pode = Math.min(max - s.count, count);
        s.count += pode;
        count -= pode;
      }
    }
    for (i = ini; i < fim && count > 0; i++) {
      if (!slots[i]) {
        var qtd = Math.min(max, count);
        slots[i] = { item: item, count: qtd };
        count -= qtd;
      }
    }
    return count;
  }

  /**
   * Guarda itens no inventário inteiro.
   * @returns {number} quanto NÃO coube
   */
  function add(slots, item, count) {
    return addFaixa(slots, item, count, 0, slots.length);
  }

  /**
   * Tira itens.
   * @returns {number} quanto conseguiu tirar
   */
  function remove(slots, item, count) {
    var tirado = 0;
    for (var i = 0; i < slots.length && tirado < count; i++) {
      var s = slots[i];
      if (s && s.item === item) {
        var pode = Math.min(s.count, count - tirado);
        s.count -= pode;
        tirado += pode;
        if (s.count <= 0) slots[i] = null;
      }
    }
    return tirado;
  }

  function conta(slots, item) {
    var total = 0;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s && s.item === item) total += s.count;
    }
    return total;
  }

  function vazio(slots) {
    for (var i = 0; i < slots.length; i++) if (slots[i]) return false;
    return true;
  }

  /** Tem tudo que a receita pede? custo = { wood: 4, stone: 5 } */
  function temTodos(slots, custo) {
    for (var item in custo) {
      if (conta(slots, item) < custo[item]) return false;
    }
    return true;
  }

  /** Consome a receita inteira. Só mexe se tiver tudo. */
  function consumir(slots, custo) {
    if (!temTodos(slots, custo)) return false;
    for (var item in custo) remove(slots, item, custo[item]);
    return true;
  }

  /** Primeiro slot que contém o item (ou -1). */
  function acharItem(slots, item) {
    for (var i = 0; i < slots.length; i++) {
      if (slots[i] && slots[i].item === item) return i;
    }
    return -1;
  }

  /** Total de itens guardados (para mostrar "3/16"). */
  function slotsUsados(slots) {
    var n = 0;
    for (var i = 0; i < slots.length; i++) if (slots[i]) n++;
    return n;
  }

  /** Move tudo de um inventário para outro; devolve o que sobrou. */
  function despejar(origem, destino) {
    var sobrou = 0;
    for (var i = 0; i < origem.length; i++) {
      var s = origem[i];
      if (!s) continue;
      var resto = add(destino, s.item, s.count);
      if (resto > 0) { s.count = resto; sobrou += resto; }
      else origem[i] = null;
    }
    return sobrou;
  }

  /* ---------------- organizar ----------------
     Junta o que está espalhado e põe em ordem. A faixa existe porque a
     barra rápida são os 8 primeiros slots da mochila: organizar não pode
     tirar a picareta do lugar em que ele deixou. */

  var ORDENS = {
    /* Por nome, como ele leria numa lista. */
    nome: function (a, b) {
      return D.itemNome(a.item).localeCompare(D.itemNome(b.item), 'pt-BR');
    },
    /* Do que ele tem mais para o que tem menos; empate desempata por nome,
       senão a ordem mudava sozinha a cada vez que organizasse. */
    quantidade: function (a, b) {
      if (b.n !== a.n) return b.n - a.n;
      return D.itemNome(a.item).localeCompare(D.itemNome(b.item), 'pt-BR');
    }
  };

  /**
   * @param ordem 'nome' ou 'quantidade'
   * @param ini,fim faixa de slots a mexer (o resto fica intocado)
   * @returns {boolean} true se alguma coisa mudou de lugar
   */
  function organizar(slots, ordem, ini, fim) {
    ini = ini || 0;
    fim = (fim === undefined || fim === null) ? slots.length : fim;
    var cmp = ORDENS[ordem] || ORDENS.nome;
    var i;

    var antes = [];
    for (i = ini; i < fim; i++) antes.push(slots[i] ? slots[i].item + ':' + slots[i].count : '-');

    // 1. recolhe tudo, somando o que é do mesmo item
    var soma = {}, lista = [];
    for (i = ini; i < fim; i++) {
      var s = slots[i];
      if (!s) continue;
      if (soma[s.item] === undefined) { soma[s.item] = 0; lista.push(s.item); }
      soma[s.item] += s.count;
      slots[i] = null;
    }

    // 2. põe em ordem
    lista = lista.map(function (it) { return { item: it, n: soma[it] }; });
    lista.sort(cmp);

    // 3. devolve, enchendo pilha por pilha da esquerda para a direita
    for (i = 0; i < lista.length; i++) {
      addFaixa(slots, lista[i].item, lista[i].n, ini, fim);
    }

    for (i = ini; i < fim; i++) {
      var d = slots[i] ? slots[i].item + ':' + slots[i].count : '-';
      if (d !== antes[i - ini]) return true;
    }
    return false;
  }

  global.FZ = global.FZ || {};
  global.FZ.Inv = {
    organizar: organizar,
    ORDENS: ORDENS,
    criar: criar,
    add: add,
    addFaixa: addFaixa,
    remove: remove,
    conta: conta,
    cabe: cabe,
    vazio: vazio,
    espacoPara: espacoPara,
    temTodos: temTodos,
    consumir: consumir,
    acharItem: acharItem,
    slotsUsados: slotsUsados,
    despejar: despejar
  };
})(window);
