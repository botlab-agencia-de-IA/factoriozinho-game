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

  global.FZ = global.FZ || {};
  global.FZ.Inv = {
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
