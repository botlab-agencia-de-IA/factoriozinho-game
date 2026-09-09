/* ============================================================
   Factoriozinho — Comportamento das máquinas
   Forno, mineradora, baú, esteira e inseridor.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var C = D.CONFIG;
  var Inv = global.FZ.Inv;
  var World = global.FZ.World;

  /* ---------------- utilidades ---------------- */

  /* Tile para onde a máquina cospe o produto.
     Numa máquina maior que um tile a saída fica sempre no lado DIREITO
     da frente dela — de quem está dentro da máquina olhando para fora.
     Antes o lado mudava conforme a direção, e a mesma mineradora girada
     entregava ora de um lado ora do outro. Em máquina de 1 tile isso não
     muda nada, porque frente e lado são o mesmo tile. */
  function tileSaida(e) {
    switch (e.dir) {
      case 0: return { x: e.x + e.w - 1, y: e.y - 1 };        // norte → direita é leste
      case 1: return { x: e.x + e.w,     y: e.y + e.h - 1 };  // leste → direita é sul
      case 2: return { x: e.x,           y: e.y + e.h };      // sul   → direita é oeste
      default: return { x: e.x - 1,      y: e.y };            // oeste → direita é norte
    }
  }

  /** Tile de onde a máquina puxa (o lado oposto ao da seta). */
  /* De onde a máquina pega — o espelho da saída, no mesmo lado direito. */
  function tileEntrada(e) {
    switch (e.dir) {
      case 0: return { x: e.x + e.w - 1, y: e.y + e.h };      // aponta norte → pega do sul
      case 1: return { x: e.x - 1,       y: e.y + e.h - 1 };  // aponta leste → pega do oeste
      case 2: return { x: e.x,           y: e.y - 1 };        // aponta sul → pega do norte
      default: return { x: e.x + e.w,    y: e.y };            // aponta oeste → pega do leste
    }
  }

  /**
   * Tenta enfiar 1 item numa máquina vizinha.
   * @param origem quem está entregando (define em qual faixa da esteira cai)
   * @param faixa  quando vem de outra esteira, mantém a mesma faixa
   */
  /** Quanto combustível a máquina já tem guardado. */
  function contarCombustivel(e) {
    if (!e.inv || !e.inv.fuel) return 0;
    var n = 0;
    for (var i = 0; i < e.inv.fuel.length; i++) if (e.inv.fuel[i]) n += e.inv.fuel[i].count;
    return n;
  }

  /** Máquina cheia de combustível para o que vem de outra máquina. */
  function combustivelNoLimite(alvo) {
    return contarCombustivel(alvo) >= C.FUEL_AUTOMATICO;
  }

  function aceitarItem(alvo, item, origem, faixa) {
    if (!alvo) return false;
    var b = D.building(alvo.tipo);

    if (b.tipo === 'belt') {
      var f;
      if (origem && D.building(origem.tipo) && D.building(origem.tipo).tipo === 'belt') {
        // esteira → esteira: reto mantém, curva mantém, lateral entra pelo lado
        f = faixaDeEsteiraParaEsteira(alvo, origem, faixa);
      } else if (faixa === 0 || faixa === 1) {
        f = faixa;
      } else {
        // máquina → esteira: mineradora no lado dela, inseridor no lado oposto
        f = faixaDeMaquina(alvo, origem);
      }
      return porNaEsteira(alvo, item, f);
    }
    if (b.tipo === 'inserter') {
      if (b.eletrico) return false;          // o elétrico não come nada
      // inseridor só aceita combustível (não se usa inseridor como depósito)
      if (D.fuelValue(item) > 0 && !combustivelNoLimite(alvo) && Inv.cabe(alvo.inv.fuel, item, 1)) {
        return Inv.add(alvo.inv.fuel, item, 1) === 0;
      }
      return false;
    }
    if (b.tipo === 'chest') {
      return Inv.add(alvo.inv.geral, item, 1) === 0;
    }
    if (b.tipo === 'furnace') {
      // minério vai para a entrada; combustível vai para o combustível
      if (D.SMELTING[item]) {
        if (Inv.cabe(alvo.inv.input, item, 1)) return Inv.add(alvo.inv.input, item, 1) === 0;
        return false;
      }
      if (D.fuelValue(item) > 0 && !combustivelNoLimite(alvo)) {
        if (Inv.cabe(alvo.inv.fuel, item, 1)) return Inv.add(alvo.inv.fuel, item, 1) === 0;
      }
      return false;
    }
    if (b.tipo === 'drill' || b.tipo === 'generator') {
      if (D.fuelValue(item) > 0 && !combustivelNoLimite(alvo) && Inv.cabe(alvo.inv.fuel, item, 1)) {
        return Inv.add(alvo.inv.fuel, item, 1) === 0;
      }
      return false;
    }
    return false;
  }

  /**
   * Garante combustível queimando. Devolve true se há chama acesa.
   * `extra` é um inventário opcional de onde também pode tirar
   * (a mineradora usa o próprio minério de carvão que acabou de extrair).
   */
  function manterChama(e, extra) {
    if (e.queima > 0) return true;

    var fontes = [e.inv.fuel];
    if (extra) fontes.push(extra);

    for (var f = 0; f < fontes.length; f++) {
      var slots = fontes[f];
      if (!slots) continue;
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
    }
    return false;
  }

  /* ---------------- forno ---------------- */

  function updateForno(e, dt) {
    var entrada = e.inv.input[0];
    var receita = entrada ? D.SMELTING[entrada.item] : null;

    if (!receita) { e.ativo = false; e.progresso = 0; return; }
    if (!Inv.cabe(e.inv.output, receita.saida, receita.qtd)) { e.ativo = false; return; }
    if (!manterChama(e)) { e.ativo = false; return; }

    e.ativo = true;
    e.queima -= dt;
    e.progresso += dt / receita.tempo;

    if (e.progresso >= 1) {
      e.progresso -= 1;
      Inv.remove(e.inv.input, entrada.item, 1);
      Inv.add(e.inv.output, receita.saida, receita.qtd);
    }
  }

  /* ---------------- mineradora a carvão ---------------- */

  /** Acha o tile de jazida com mais recurso debaixo da máquina. */
  function jazidaSob(e) {
    var melhor = null, maior = 0;
    for (var dy = 0; dy < e.h; dy++) {
      for (var dx = 0; dx < e.w; dx++) {
        var x = e.x + dx, y = e.y + dy;
        var res = World.resAt(x, y);
        if (!res) continue;
        var info = D.resInfo(res);
        if (!info || !info.emCima) continue;   // só jazida, não árvore/pedregulho
        var qtd = World.amountAt(x, y);
        if (qtd > maior) { maior = qtd; melhor = { x: x, y: y, res: res, info: info }; }
      }
    }
    return melhor;
  }

  function updateDrill(e, dt) {
    var b = D.building(e.tipo);

    // 1) tenta esvaziar o buffer para a máquina da frente
    empurrarSaida(e);

    var alvo = jazidaSob(e);
    if (!alvo) { e.ativo = false; e.semJazida = true; return; }
    e.semJazida = false;

    if (!Inv.cabe(e.inv.output, alvo.info.item, 1)) { e.ativo = false; return; }
    // a mineradora pode se abastecer com o carvão que ela mesma tira
    if (!manterChama(e, e.inv.output)) { e.ativo = false; return; }

    e.ativo = true;
    e.queima -= dt;
    e.progresso += dt * b.velocidade;

    if (e.progresso >= 1) {
      e.progresso -= 1;
      var item = World.minerar(alvo.x, alvo.y);
      if (item) Inv.add(e.inv.output, item, 1);
      empurrarSaida(e);
    }
  }

  function empurrarSaida(e) {
    var slots = e.inv.output;
    var i = 0;
    for (; i < slots.length; i++) if (slots[i]) break;
    if (i === slots.length) return;

    var t = tileSaida(e);
    var alvo = World.entityAt(t.x, t.y);
    if (!alvo || alvo.id === e.id) return;

    if (aceitarItem(alvo, slots[i].item, e)) {
      slots[i].count--;
      if (slots[i].count <= 0) slots[i] = null;
    }
  }

  /* ============================================================
     ESTEIRA
     Cada esteira guarda os itens que estão em cima dela, com uma
     posição de 0 (entrada) a 1 (saída). Quando o da frente chega
     em 1, ele passa para a próxima coisa. Se não pode passar, a
     fila trava para trás — é assim que dá para ver o gargalo.
     ============================================================ */

  var ESQ = 0, DIR = 1;              // as duas faixas da esteira
  var DIR_DX = [0, 1, 0, -1];
  var DIR_DY = [-1, 0, 1, 0];

  /** Garante que a esteira tem as duas faixas (migra save antigo de 1 faixa). */
  function garantirFaixas(e) {
    if (e.faixas) return;
    e.faixas = [[], []];
    if (e.itens && e.itens.length) e.faixas[ESQ] = e.itens;
    delete e.itens;
  }

  /**
   * De que lado da esteira está quem entrega?
   * @returns {number} +1 = à direita da esteira · -1 = à esquerda · 0 = atrás, alinhado
   */
  function ladoDaEsteira(belt, origem) {
    var dx = DIR_DX[belt.dir], dy = DIR_DY[belt.dir];
    var rx = -dy, ry = dx;                                  // vetor "direita" da esteira

    /* O lado sai da FACE de quem entrega, não da posição dela.
       Quem entrega sempre empurra o item no sentido para onde aponta,
       e o tile de saída dela É o tile da esteira — então comparar as
       duas posições dava sempre zero numa máquina 2x2, e a mineradora
       caía na faixa da direita fosse qual fosse o sentido da esteira.
       Com o vetor da face isso some: a máquina está no lado oposto ao
       sentido em que ela empurra. */
    if (origem.dir != null && DIR_DX[origem.dir] !== undefined) {
      var lado = -(DIR_DX[origem.dir] * rx + DIR_DY[origem.dir] * ry);
      return lado === 0 ? 0 : (lado > 0 ? 1 : -1);
    }

    // máquina sem sentido (baú, forno): resta comparar as posições
    var ox = origem.x + (origem.w || 1) / 2 - (belt.x + 0.5);
    var oy = origem.y + (origem.h || 1) / 2 - (belt.y + 0.5);
    var l2 = ox * rx + oy * ry;
    if (Math.abs(l2) < 0.01) return 0;
    return l2 > 0 ? 1 : -1;
  }

  /**
   * MÁQUINA entregando na esteira. Sempre UMA faixa só: se ela encher, a
   * máquina espera — nunca invade a outra.
   *
   *  • **Mineradora**: ela só empurra o minério para fora, então ele cai na
   *    faixa **do lado dela** — a que está bem na frente da saída.
   *  • **Inseridor**: o braço é comprido e alcança a faixa **do outro lado**.
   *  • **Alinhada exatamente atrás** (esteira reta saindo da máquina): faixa
   *    da **direita**.
   */
  function faixaDeMaquina(belt, origem) {
    if (!origem) return DIR;
    var lado = ladoDaEsteira(belt, origem);
    if (lado === 0) return DIR;                             // esteira reta: direita

    var b = D.building(origem.tipo);
    if (b && b.tipo === 'drill') {
      return lado > 0 ? DIR : ESQ;                          // near lane: o lado dela
    }
    return lado > 0 ? ESQ : DIR;                            // far lane: o lado oposto
  }

  // nome antigo, mantido para não quebrar quem já chamava
  var faixaOposta = faixaDeMaquina;

  /**
   * ESTEIRA entrando pela LATERAL de outra (side-load): os itens caem na
   * faixa do MESMO lado de onde vieram — tudo que entra pela direita vai
   * para a faixa da direita, venha da faixa que vier.
   */
  function faixaMesmoLado(belt, origem) {
    var lado = ladoDaEsteira(belt, origem);
    if (lado === 0) return null;                            // veio de trás: não é lateral
    return lado > 0 ? DIR : ESQ;
  }

  /** Tem uma esteira atrás alimentando esta em linha reta? */
  function temEntradaReta(belt) {
    var t = tileEntrada(belt);
    var atras = World.entityAt(t.x, t.y);
    if (!atras) return false;
    var b = D.building(atras.tipo);
    return b.tipo === 'belt' && atras.dir === belt.dir;
  }

  /**
   * Em qual faixa do destino entra um item que vem da esteira `origem`,
   * que estava na faixa `faixa`.
   */
  function faixaDeEsteiraParaEsteira(destino, origem, faixa) {
    if (destino.dir === origem.dir) return faixa;           // reto: mantém a faixa
    // perpendicular sem entrada reta = CURVA: as faixas são preservadas
    if (!temEntradaReta(destino)) return faixa;
    // perpendicular com entrada reta = SIDE-LOAD: entra pela faixa do lado
    var lat = faixaMesmoLado(destino, origem);
    return lat === null ? faixa : lat;
  }

  /**
   * Coloca 1 item no começo de uma faixa da esteira.
   * @param faixa 0 = esquerda, 1 = direita, null = escolhe a mais vazia
   */
  function porNaEsteira(e, item, faixa) {
    garantirFaixas(e);
    var b = D.building(e.tipo);

    if (faixa === null || faixa === undefined) {
      faixa = e.faixas[ESQ].length <= e.faixas[DIR].length ? ESQ : DIR;
    }
    var lista = e.faixas[faixa];

    if (lista.length >= b.capacidade) return false;         // essa faixa está lotada
    var espaco = 1 / b.capacidade;
    var ultimo = lista[lista.length - 1];
    if (ultimo && ultimo.pos < espaco) return false;        // ainda não abriu vaga

    lista.push({ item: item, pos: 0 });
    return true;
  }

  function updateBelt(e, dt) {
    garantirFaixas(e);

    var b = D.building(e.tipo);
    var passo = b.velocidade * dt;
    var espaco = 1 / b.capacidade;
    var t = tileSaida(e);
    var alvo = World.entityAt(t.x, t.y);
    var temItem = false, travado = true;
    var f, i;

    for (f = 0; f < 2; f++) {
      var lista = e.faixas[f];
      if (!lista.length) continue;
      temItem = true;

      // anda, mas ninguém passa por cima de quem está na frente
      for (i = 0; i < lista.length; i++) {
        var it = lista[i];
        var limite = (i === 0) ? 1 : lista[i - 1].pos - espaco;
        var novo = it.pos + passo;
        it.pos = novo > limite ? limite : novo;
        if (it.pos < 0) it.pos = 0;
      }

      // o da frente chegou no fim: tenta passar adiante, mantendo a faixa
      if (lista[0].pos >= 1 - 1e-6) {
        if (alvo && alvo.id !== e.id && aceitarItem(alvo, lista[0].item, e, f)) {
          lista.shift();
          travado = false;
        }
      } else {
        travado = false;
      }
    }

    e.ativo = temItem && !travado;
  }

  /**
   * Descobre se a esteira deve se desenhar reta ou fazendo uma curva.
   * Igual ao Factorio: se só UMA esteira alimenta esta, e ela vem de lado,
   * esta vira sozinha — não precisa colocar mais nada na frente.
   * @returns {number} 0 = reta · -1 = curva vindo da esquerda · +1 = da direita
   */
  function formaDaEsteira(e) {
    /* A forma só muda quando alguém constrói, remove ou gira alguma coisa
       ao lado. Recalcular isso para cada esteira em cada quadro era varrer
       a vizinhança inteira da fábrica 60 vezes por segundo à toa. */
    var v = World.versaoDoMundo();
    if (e._formaVer === v) return e._formaVal;

    var r = calcularFormaDaEsteira(e);
    e._formaVer = v;
    e._formaVal = r;
    return r;
  }

  function calcularFormaDaEsteira(e) {
    var dx = DIR_DX[e.dir], dy = DIR_DY[e.dir];
    var rx = -dy, ry = dx;

    var vizinhos = [
      { x: e.x - dx, y: e.y - dy, lado: 0 },      // atrás
      { x: e.x - rx, y: e.y - ry, lado: -1 },     // esquerda
      { x: e.x + rx, y: e.y + ry, lado: 1 }       // direita
    ];

    var quantas = 0, ladoUnico = 0;
    for (var i = 0; i < vizinhos.length; i++) {
      var v = vizinhos[i];
      var o = World.entityAt(v.x, v.y);
      if (!o || o.id === e.id) continue;
      var b = D.building(o.tipo);
      if (!b || b.tipo !== 'belt') continue;
      // essa esteira aponta para cá?
      var t = tileSaida(o);
      if (t.x !== e.x || t.y !== e.y) continue;
      quantas++;
      ladoUnico = v.lado;
    }

    // curva só quando existe exatamente uma entrada e ela vem de lado
    if (quantas === 1 && ladoUnico !== 0) return ladoUnico;
    return 0;
  }

  /** Quantos itens estão em cima desta esteira (as duas faixas). */
  function itensNaEsteira(e) {
    garantirFaixas(e);
    return e.faixas[ESQ].length + e.faixas[DIR].length;
  }

  /* ============================================================
     INSERIDOR
     Pega 1 item do que está ATRÁS e põe no que está NA FRENTE.
     ============================================================ */

  /** Tira 1 item de uma máquina (o que ela tem para dar). */
  /**
   * O destino aceitaria esse item AGORA? É o que faz o inseridor
   * escolher: numa esteira com carvão e ferro, ele leva carvão só
   * enquanto a fornalha estiver com pouco, e depois só leva minério.
   */
  function destinoQuer(alvo, item) {
    if (!alvo || !item) return false;
    var b = D.building(alvo.tipo);

    if (b.tipo === 'belt') return true;
    if (b.tipo === 'chest') return Inv.cabe(alvo.inv.geral, item, 1);
    if (b.tipo === 'inserter') {
      if (b.eletrico) return false;
      return D.fuelValue(item) > 0 && !combustivelNoLimite(alvo) &&
             Inv.cabe(alvo.inv.fuel, item, 1);
    }
    if (b.tipo === 'furnace') {
      if (D.SMELTING[item]) return Inv.cabe(alvo.inv.input, item, 1);
      if (D.fuelValue(item) > 0) {
        return !combustivelNoLimite(alvo) && Inv.cabe(alvo.inv.fuel, item, 1);
      }
      return false;
    }
    if (b.tipo === 'drill' || b.tipo === 'generator') {
      return D.fuelValue(item) > 0 && !combustivelNoLimite(alvo) &&
             Inv.cabe(alvo.inv.fuel, item, 1);
    }
    return false;
  }

  /** O que dá para pegar da origem agora, sem tirar do lugar. */
  function itensAoAlcance(origem, out) {
    out.length = 0;
    if (!origem) return out;
    var b = D.building(origem.tipo);
    var i;

    if (b.tipo === 'belt') {
      // só o item da frente de cada faixa está ao alcance do braço
      garantirFaixas(origem);
      for (i = 0; i < 2; i++) {
        var l = origem.faixas[i];
        if (l.length) out.push(l[0].item);
      }
      return out;
    }
    var slots = b.tipo === 'chest' ? origem.inv.geral : origem.inv.output;
    if (!slots) return out;
    for (i = 0; i < slots.length; i++) if (slots[i]) out.push(slots[i].item);
    return out;
  }

  /** Tira 1 daquele item da origem. Devolve o item ou null. */
  function retirarItemDe(origem, item) {
    if (!origem) return null;
    var b = D.building(origem.tipo);
    var i;

    if (b.tipo === 'belt') {
      garantirFaixas(origem);
      var melhor = -1, maior = -1;
      for (i = 0; i < 2; i++) {
        var l = origem.faixas[i];
        if (l.length && l[0].item === item && l[0].pos > maior) { maior = l[0].pos; melhor = i; }
      }
      if (melhor < 0) return null;
      return origem.faixas[melhor].shift().item;
    }

    var slots = b.tipo === 'chest' ? origem.inv.geral : origem.inv.output;
    if (!slots) return null;
    for (i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (!s || s.item !== item) continue;
      s.count--;
      if (s.count <= 0) slots[i] = null;
      return item;
    }
    return null;
  }

  function retirarDe(origem) {
    if (!origem) return null;
    var b = D.building(origem.tipo);
    var i;

    if (b.tipo === 'belt') {
      garantirFaixas(origem);
      // pega o item mais adiantado, olhando as duas faixas
      var melhor = -1, maior = -1;
      for (i = 0; i < 2; i++) {
        var l = origem.faixas[i];
        if (l.length && l[0].pos > maior) { maior = l[0].pos; melhor = i; }
      }
      if (melhor < 0) return null;
      return origem.faixas[melhor].shift().item;
    }
    if (b.tipo === 'chest') {
      for (i = 0; i < origem.inv.geral.length; i++) {
        var s = origem.inv.geral[i];
        if (s) {
          s.count--;
          var item = s.item;
          if (s.count <= 0) origem.inv.geral[i] = null;
          return item;
        }
      }
      return null;
    }
    // forno e mineradora: só o que já está pronto na saída
    if (origem.inv.output) {
      for (i = 0; i < origem.inv.output.length; i++) {
        var o = origem.inv.output[i];
        if (o) {
          o.count--;
          var it2 = o.item;
          if (o.count <= 0) origem.inv.output[i] = null;
          return it2;
        }
      }
    }
    return null;
  }

  /** Dá para tirar algo dali agora? (olha sem mexer) */
  function temParaDar(origem) {
    if (!origem) return false;
    var b = D.building(origem.tipo);
    if (b.tipo === 'belt') return itensNaEsteira(origem) > 0;
    if (b.tipo === 'chest') return !Inv.vazio(origem.inv.geral);
    if (origem.inv.output) return !Inv.vazio(origem.inv.output);
    return false;
  }

  var _candidatos = [];        // reaproveitado, para não alocar por quadro

  /* O que move o inseridor neste quadro.
     No de carvão é a chama: 1 se está acesa, 0 se apagou.
     No elétrico é a rede: 1 com energia sobrando, uma fração quando a
     rede está curta (aí ele trabalha devagar, como no Factorio), 0 sem
     poste por perto. */
  function forcaDoInseridor(e, b, dt) {
    if (!b.eletrico) return manterChama(e) ? 1 : 0;
    var f = global.FZ.Energia ? global.FZ.Energia.forca(e) : 0;
    return f;
  }

  function updateInserter(e, dt) {
    var b = D.building(e.tipo);
    var frente = tileSaida(e);
    var tras = tileEntrada(e);

    /* --- no seco, ele se serve do que passa atrás ---
       Inseridor sem combustível não trabalha, então nunca conseguiria
       se reabastecer sozinho. Como no Factorio, ele tem esse direito:
       se tem combustível ao alcance atrás, pega para si.
       O elétrico não precisa disso: ele não come nada. */
    if (!b.eletrico && semCombustivel(e)) {
      var atras = World.entityAt(tras.x, tras.y);
      if (atras) {
        var lista = itensAoAlcance(atras, _candidatos);
        for (var ci = 0; ci < lista.length; ci++) {
          if (D.fuelValue(lista[ci]) <= 0) continue;
          if (retirarItemDe(atras, lista[ci])) {
            Inv.add(e.inv.fuel, lista[ci], 1);
            e.seServiu = true;
            break;
          }
        }
      }
    }

    /* --- já está com algo na mão: leva para a frente --- */
    if (e.segurando) {
      var alvo = World.entityAt(frente.x, frente.y);
      if (!alvo) { e.ativo = false; e.semDestino = true; e.querEnergia = false; return; }
      e.semDestino = false;

      var forca = forcaDoInseridor(e, b, dt);
      if (forca <= 0) { e.ativo = false; e.querEnergia = true; return; }
      e.querEnergia = true;

      e.ativo = true;
      if (!b.eletrico) e.queima -= dt * b.gastoCombustivel;
      e.progresso += dt * b.velocidade * forca;

      if (e.progresso >= 1) {
        if (aceitarItem(alvo, e.segurando, e)) {   // `e` define a faixa da esteira
          e.segurando = null;
          e.progresso = 0;
        } else {
          e.progresso = 1;      // destino cheio: fica esperando de braço estendido
          e.ativo = false;
        }
      }
      return;
    }

    /* --- mão vazia: procura o que pegar atrás --- */
    var origem = World.entityAt(tras.x, tras.y);
    if (!temParaDar(origem)) { e.ativo = false; e.progresso = 0; e.naoServe = false; e.querEnergia = false; return; }

    // só pega se tiver para onde levar
    var destino = World.entityAt(frente.x, frente.y);
    if (!destino) { e.ativo = false; e.semDestino = true; e.querEnergia = false; return; }
    e.semDestino = false;

    /* de tudo que está ao alcance atrás, o que o destino quer agora?
       É isso que faz ele deixar o carvão passar quando a fornalha já
       tem o bastante, e levar o minério em vez dele. */
    var candidatos = itensAoAlcance(origem, _candidatos);
    var escolhido = null;
    for (var i = 0; i < candidatos.length; i++) {
      if (destinoQuer(destino, candidatos[i])) { escolhido = candidatos[i]; break; }
    }
    if (!escolhido) { e.ativo = false; e.naoServe = true; e.progresso = 0; e.querEnergia = false; return; }
    e.naoServe = false;

    var forca2 = forcaDoInseridor(e, b, dt);
    if (forca2 <= 0) { e.ativo = false; e.querEnergia = true; return; }
    e.querEnergia = true;

    e.ativo = true;
    if (!b.eletrico) e.queima -= dt * b.gastoCombustivel;
    e.progresso += dt * b.velocidade * forca2;

    if (e.progresso >= 1) {
      var pego = retirarItemDe(origem, escolhido);
      if (pego) e.segurando = pego;
      e.progresso = 0;
    }
  }

  /* ---------------- laço geral ---------------- */

  function update(dt) {
    var lista = World.todasEntidades();
    for (var i = 0; i < lista.length; i++) {
      var e = lista[i];
      var b = D.building(e.tipo);
      if (!b) continue;
      if (b.tipo === 'furnace') updateForno(e, dt);
      else if (b.tipo === 'drill') updateDrill(e, dt);
      else if (b.tipo === 'belt') updateBelt(e, dt);
      else if (b.tipo === 'inserter') updateInserter(e, dt);
      // gerador e poste não têm vida própria: quem cuida deles é a rede
    }

    /* A rede fecha a conta depois de todo mundo dizer se quer trabalhar
       neste quadro — assim um inseridor parado não faz o gerador queimar
       carvão à toa. */
    if (global.FZ.Energia) global.FZ.Energia.update(dt);
  }

  /** Junta tudo que está dentro da máquina (para devolver ao remover). */
  function conteudo(e) {
    var out = [];
    var i;
    for (var slot in e.inv) {
      var slots = e.inv[slot];
      for (i = 0; i < slots.length; i++) {
        if (slots[i]) out.push({ item: slots[i].item, count: slots[i].count });
      }
    }
    // o que estava andando em cima da esteira (as duas faixas)
    if (e.faixas || e.itens) {
      garantirFaixas(e);
      for (var f = 0; f < 2; f++) {
        for (i = 0; i < e.faixas[f].length; i++) {
          out.push({ item: e.faixas[f][i].item, count: 1 });
        }
      }
    }
    // o que o inseridor tinha na mão
    if (e.segurando) out.push({ item: e.segurando, count: 1 });
    return out;
  }

  /** Nome amigável do estado, para o painel e para a dica do cursor. */
  function estado(e) {
    var b = D.building(e.tipo);

    if (b.tipo === 'chest') return 'Guardando';

    if (b.tipo === 'belt') {
      garantirFaixas(e);
      var ne = e.faixas[ESQ].length, nd = e.faixas[DIR].length;
      var n = ne + nd;
      if (!n) return 'Vazia';
      var lados = '(esq ' + ne + ' · dir ' + nd + ')';
      if (!e.ativo) return 'Entupida ' + lados;
      return 'Levando ' + n + (n > 1 ? ' itens ' : ' item ') + lados;
    }

    if (b.tipo === 'pole') {
      var rede = global.FZ.Energia ? global.FZ.Energia.redeDe(e) : null;
      if (!rede) return 'Poste solto';
      var quantos = rede.postes.length;
      if (rede.producao <= 0) return 'Rede sem gerador' + (quantos > 1 ? ' (' + quantos + ' postes)' : '');
      return Math.round(rede.producao) + ' W na rede · ' +
             Math.round(rede.demanda) + ' W em uso' +
             (quantos > 1 ? ' · ' + quantos + ' postes' : '');
    }

    if (b.tipo === 'generator') {
      if (semCombustivel(e)) return 'Sem combustível';
      if (!global.FZ.Energia || !global.FZ.Energia.temRede(e)) {
        return 'Fora da rede — falta um poste por perto';
      }
      if (!e.ativo) return 'Aceso, mas ninguém puxando';
      return 'Gerando ' + Math.round((b.producao || 0) * (e.carga || 0)) + ' W' +
             ' de ' + b.producao + ' W';
    }

    if (b.tipo === 'inserter') {
      if (e.semDestino) return 'Sem nada na frente para receber';
      if (b.eletrico) {
        var falta = global.FZ.Energia ? global.FZ.Energia.estadoDaMaquina(e) : 'Sem rede';
        if (falta && !e.ativo) return falta;
      } else if (semCombustivel(e)) {
        return 'Sem combustível';
      }
      if (e.naoServe) return 'Nada que sirva na frente';
      if (e.ativo) {
        var lento = b.eletrico && global.FZ.Energia ? global.FZ.Energia.estadoDaMaquina(e) : null;
        var base = e.segurando ? 'Entregando ' + D.itemNome(e.segurando) : 'Pegando';
        return lento ? base + ' — ' + lento.toLowerCase() : base;
      }
      if (e.segurando) return 'Destino cheio';
      return 'Nada para pegar atrás';
    }

    if (e.semJazida) return 'Sem jazida embaixo';
    if (e.ativo) return 'Trabalhando';
    if (semCombustivel(e)) return 'Sem combustível';
    if (b.tipo === 'furnace' && !e.inv.input[0]) return 'Sem minério';
    if (b.tipo === 'furnace' && e.inv.input[0] && !D.SMELTING[e.inv.input[0].item]) {
      return 'Isso não funde';
    }
    return 'Parado';
  }

  function semCombustivel(e) {
    return e.queima <= 0 && e.inv.fuel && Inv.vazio(e.inv.fuel);
  }

  global.FZ = global.FZ || {};
  global.FZ.Entities = {
    update: update,
    tileSaida: tileSaida,
    tileEntrada: tileEntrada,
    aceitarItem: aceitarItem,
    porNaEsteira: porNaEsteira,
    garantirFaixas: garantirFaixas,
    itensNaEsteira: itensNaEsteira,
    faixaOposta: faixaOposta,
    faixaDeMaquina: faixaDeMaquina,
    faixaMesmoLado: faixaMesmoLado,
    faixaDeEsteiraParaEsteira: faixaDeEsteiraParaEsteira,
    temEntradaReta: temEntradaReta,
    ladoDaEsteira: ladoDaEsteira,
    formaDaEsteira: formaDaEsteira,
    ESQ: ESQ, DIR: DIR,
    retirarDe: retirarDe,
    temParaDar: temParaDar,
    conteudo: conteudo,
    destinoQuer: destinoQuer,
    itensAoAlcance: itensAoAlcance,
    retirarItemDe: retirarItemDe,
    contarCombustivel: contarCombustivel,
    estado: estado,
    jazidaSob: jazidaSob
  };
})(window);
