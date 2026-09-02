/* ============================================================
   Factoriozinho — Interface durante o jogo
   Barra rápida, inventário, fabricação, painel das máquinas
   e menu de pausa.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var C = D.CONFIG;
  var Inv = global.FZ.Inv;
  var Sprites = global.FZ.Sprites;
  var Entities = global.FZ.Entities;
  var PlayerLib = global.FZ.Player;
  var World = global.FZ.World;

  var g = null;
  var el = {};              // referências do DOM
  var mao = null;           // pilha presa ao cursor: { item, count }
  var uiHover = false;
  var painelEnt = null;
  var acumRefresh = 0;
  var abaAtual = 'fabricar';
  var catAtual = 'ferramenta';    // seção aberta na fabricação

  /* ============================================================
     montagem
     ============================================================ */

  function montar(estado) {
    g = estado;
    el.layer = document.getElementById('game-layer');
    el.hud = document.getElementById('hud');
    el.hotbar = document.getElementById('hotbar');
    el.avisos = document.getElementById('avisos');
    el.inspetor = document.getElementById('inspetor');
    el.fps = document.getElementById('fps');
    el.janelas = document.getElementById('janelas');
    el.maoEl = document.getElementById('mao-cursor');
    el.minimapa = document.getElementById('minimapa-canvas');

    var abrirMapaBtn = document.getElementById('minimapa');
    if (abrirMapaBtn) {
      abrirMapaBtn.onclick = alternarMapa;
    }

    el.hotbar.innerHTML = '';
    for (var i = 0; i < C.HOTBAR_SIZE; i++) {
      el.hotbar.appendChild(criarSlot({ slots: g.player.inv, i: i, contexto: 'inv', hotbar: i + 1 }));
    }

    document.addEventListener('mousemove', moverMao);
    el.janelas.addEventListener('mouseenter', function () { uiHover = true; }, true);
    el.janelas.addEventListener('mouseleave', function () { uiHover = false; }, true);
    el.hud.addEventListener('mouseenter', function () { uiHover = true; }, true);
    el.hud.addEventListener('mouseleave', function () { uiHover = false; }, true);

    atualizarHotbar();
  }

  function desmontar() {
    fecharTudo();
    document.removeEventListener('mousemove', moverMao);
    if (el.hotbar) el.hotbar.innerHTML = '';
    mao = null;
    g = null;
  }

  function mouseSobreUi() { return uiHover; }

  /* ============================================================
     slots
     ============================================================ */

  function criarSlot(cfg) {
    var d = document.createElement('div');
    d.className = 'slot-item';
    d.dataset.i = cfg.i;

    var cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    d.appendChild(cv);

    var n = document.createElement('span');
    n.className = 'qtd';
    d.appendChild(n);

    if (cfg.hotbar) {
      var h = document.createElement('b');
      h.className = 'tecla';
      h.textContent = cfg.hotbar;
      d.appendChild(h);
    }

    d._cfg = cfg;
    d.addEventListener('mousedown', function (ev) {
      ev.preventDefault();
      // Shift + clique = manda a pilha inteira para o outro lado
      if (ev.shiftKey && ev.button === 0) { transferirRapido(cfg); return; }
      // clicar na barra rápida com nada aberto = só escolher o slot
      if (cfg.hotbar && !temJanela()) {
        g.player.hotbar = cfg.i;
        atualizarHotbar();
        return;
      }
      cliqueSlot(cfg, ev.button === 2);
    });
    d.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });
    d.addEventListener('mouseenter', function () { mostrarDica(d, cfg); });
    d.addEventListener('mouseleave', esconderDica);

    pintarSlot(d);
    return d;
  }

  function pintarSlot(d) {
    var cfg = d._cfg;
    var s = cfg.slots[cfg.i];
    var chave = s ? s.item + ':' + s.count : '';
    if (d.dataset.k === chave) return;
    d.dataset.k = chave;

    var cv = d.firstChild;
    var cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.clearRect(0, 0, 32, 32);

    var qtd = d.querySelector('.qtd');
    if (s) {
      Sprites.drawItem(cx, s.item, 0, 0, 32);
      qtd.textContent = s.count > 1 ? s.count : '';
      d.classList.add('cheio');
    } else {
      qtd.textContent = '';
      d.classList.remove('cheio');
    }
  }

  /** Regras de qual item cada slot de máquina aceita. */
  function slotAceita(cfg, item) {
    if (cfg.contexto === 'inv' || cfg.contexto === 'chest') return true;
    if (cfg.contexto === 'fuel') return D.fuelValue(item) > 0;
    if (cfg.contexto === 'input') return !!D.SMELTING[item];
    if (cfg.contexto === 'output') return false;
    return true;
  }

  function cliqueSlot(cfg, botaoDireito) {
    var slots = cfg.slots;
    var i = cfg.i;
    var s = slots[i];

    if (!mao) {
      if (!s) return;
      if (botaoDireito) {
        var metade = Math.ceil(s.count / 2);
        mao = { item: s.item, count: metade };
        s.count -= metade;
        if (s.count <= 0) slots[i] = null;
      } else {
        mao = { item: s.item, count: s.count };
        slots[i] = null;
      }
    } else {
      if (!slotAceita(cfg, mao.item)) { flash('Esse slot não aceita ' + D.itemNome(mao.item)); return; }
      var max = D.stackMax(mao.item);

      if (!s) {
        var qtd = botaoDireito ? 1 : mao.count;
        slots[i] = { item: mao.item, count: Math.min(qtd, max) };
        mao.count -= slots[i].count;
        if (mao.count <= 0) mao = null;
      } else if (s.item === mao.item) {
        var cabe = Math.min(max - s.count, botaoDireito ? 1 : mao.count);
        s.count += cabe;
        mao.count -= cabe;
        if (mao.count <= 0) mao = null;
      } else if (!botaoDireito) {
        var tmp = { item: s.item, count: s.count };
        slots[i] = { item: mao.item, count: mao.count };
        mao = tmp;
      }
    }
    atualizar();
    desenharMao();
  }

  /* ============================================================
     Shift + clique — transferência rápida
     ============================================================ */

  /** Em qual slot da máquina esse item deve cair? */
  function slotDestinoNaMaquina(e, item) {
    var b = D.building(e.tipo);
    if (b.tipo === 'chest') return e.inv.geral;
    if (b.tipo === 'furnace') {
      if (D.SMELTING[item]) return e.inv.input;      // minério → entrada
      if (D.fuelValue(item) > 0) return e.inv.fuel;  // lenha/carvão → combustível
      return null;
    }
    if (b.tipo === 'drill' || b.tipo === 'inserter') {
      if (D.fuelValue(item) > 0) return e.inv.fuel;
      return null;
    }
    return null;
  }

  /**
   * Manda a pilha inteira do slot clicado para o outro lado:
   *   máquina/baú  →  mochila
   *   mochila      →  máquina/baú aberto
   *   mochila      →  entre barra rápida e resto (quando só a mochila está aberta)
   * Sempre no primeiro lugar livre, da esquerda para a direita.
   */
  function transferirRapido(cfg) {
    var s = cfg.slots[cfg.i];
    if (!s) return;

    var destino = null;
    var ini = 0, fim = 0;

    if (cfg.contexto === 'inv') {
      if (painelEnt) {
        destino = slotDestinoNaMaquina(painelEnt, s.item);
        if (!destino) {
          flash(D.itemNome(s.item) + ' não serve nessa máquina');
          return;
        }
        ini = 0; fim = destino.length;
      } else {
        // só a mochila aberta: alterna entre a barra rápida e o resto
        destino = g.player.inv;
        if (cfg.i < C.HOTBAR_SIZE) { ini = C.HOTBAR_SIZE; fim = C.INV_SIZE; }
        else { ini = 0; fim = C.HOTBAR_SIZE; }
      }
    } else {
      destino = g.player.inv;
      ini = 0; fim = destino.length;
    }

    var resto = Inv.addFaixa(destino, s.item, s.count, ini, fim);
    if (resto === s.count) { flash('Não cabe mais nada lá'); return; }

    s.count = resto;
    if (s.count <= 0) cfg.slots[cfg.i] = null;
    atualizar();
  }

  function moverMao(ev) {
    if (!el.maoEl) return;
    el.maoEl.style.left = ev.clientX + 'px';
    el.maoEl.style.top = ev.clientY + 'px';
  }

  function desenharMao() {
    if (!el.maoEl) return;
    if (!mao) { el.maoEl.classList.remove('is-on'); return; }
    el.maoEl.classList.add('is-on');
    var cv = el.maoEl.querySelector('canvas');
    var cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.clearRect(0, 0, 32, 32);
    Sprites.drawItem(cx, mao.item, 0, 0, 32);
    el.maoEl.querySelector('span').textContent = mao.count > 1 ? mao.count : '';
  }

  /** Devolve o que estiver no cursor para o inventário. */
  function largarMao() {
    if (!mao) return;
    var resto = Inv.add(g.player.inv, mao.item, mao.count);
    if (resto > 0) World.soltarItem(g.player.x, g.player.y, mao.item, resto);
    mao = null;
    desenharMao();
  }

  /* ============================================================
     dicas (tooltip)
     ============================================================ */

  var dicaEl = null;
  function mostrarDica(d, cfg) {
    var s = cfg.slots[cfg.i];
    if (!s) return;
    if (!dicaEl) {
      dicaEl = document.createElement('div');
      dicaEl.className = 'dica';
      document.body.appendChild(dicaEl);
    }
    var info = D.ITEMS[s.item] || {};
    var extras = [];
    if (info.fuel) extras.push('🔥 combustível: ' + info.fuel + 's');
    if (info.constroi) extras.push('🔨 ' + D.building(info.constroi).dica);
    if (D.SMELTING[s.item]) extras.push('♨ funde em ' + D.itemNome(D.SMELTING[s.item].saida));

    dicaEl.innerHTML = '<b>' + D.itemNome(s.item) + '</b> <i>×' + s.count + '</i>' +
      (extras.length ? '<small>' + extras.join('<br>') + '</small>' : '');

    var r = d.getBoundingClientRect();
    dicaEl.style.left = Math.min(r.left, global.innerWidth - 230) + 'px';
    dicaEl.style.top = (r.top - 8) + 'px';
    dicaEl.classList.add('is-on');
  }

  function esconderDica() {
    if (dicaEl) dicaEl.classList.remove('is-on');
  }

  /* ============================================================
     janelas
     ============================================================ */

  function novaJanela(titulo, classe) {
    var j = document.createElement('div');
    j.className = 'janela ' + (classe || '');
    j.innerHTML =
      '<header><h3>' + titulo + '</h3><button class="fechar">✕</button></header>' +
      '<div class="corpo"></div>';
    j.querySelector('.fechar').addEventListener('click', function () { fecharTudo(); });
    el.janelas.appendChild(j);
    return j;
  }

  function fecharTudo() {
    largarMao();
    esconderDica();
    if (el.janelas) el.janelas.innerHTML = '';
    mapaCanvas = null;
    mapaInfo = null;
    painelEnt = null;
    if (g) g.painel = null;
    uiHover = false;
    if (global.FZ.Input) global.FZ.Input.soltarBotoes();
  }

  function temJanela() {
    return el.janelas && el.janelas.children.length > 0;
  }

  /* ---------------- inventário + fabricação ---------------- */

  /** `E` abre a mochila — e fecha QUALQUER janela que estiver aberta. */
  function alternarInventario(aba) {
    if (temJanela()) {
      var eraPausa = !!el.janelas.querySelector('.j-pausa');
      fecharTudo();
      if (eraPausa) global.FZ.Game.pausar(false);
      return;
    }
    if (aba) abaAtual = aba;
    abrirInventario();
  }

  function abrirInventario() {
    var j = novaJanela('Mochila', 'j-inv');
    var corpo = j.querySelector('.corpo');

    var wrap = document.createElement('div');
    wrap.className = 'inv-wrap';

    // esquerda: inventário
    var esq = document.createElement('div');
    esq.className = 'inv-lado';
    esq.innerHTML = '<h4>Inventário</h4>';
    var grade = document.createElement('div');
    grade.className = 'grade-inv';
    for (var i = 0; i < C.INV_SIZE; i++) {
      grade.appendChild(criarSlot({ slots: g.player.inv, i: i, contexto: 'inv' }));
    }
    esq.appendChild(grade);

    // direita: fabricação
    var dir = document.createElement('div');
    dir.className = 'inv-lado';
    dir.innerHTML = '<h4>Fabricar à mão</h4>';
    dir.appendChild(barraDeSecoes());

    var lista = document.createElement('div');
    lista.className = 'lista-receitas';
    lista.id = 'lista-receitas';
    dir.appendChild(lista);

    var fila = document.createElement('div');
    fila.className = 'fila-craft';
    fila.id = 'fila-craft';
    dir.appendChild(fila);

    wrap.appendChild(esq);
    wrap.appendChild(dir);
    corpo.appendChild(wrap);

    montarReceitas();
    atualizar();
  }

  function montarReceitas() {
    var lista = document.getElementById('lista-receitas');
    if (!lista) return;
    lista.innerHTML = '';

    // só a seção escolhida: picareta não fica no meio de forno e baú
    var receitas = D.HAND_RECIPES.filter(function (r) {
      return D.categoriaDaReceita(r) === catAtual;
    });

    if (!receitas.length) {
      lista.innerHTML = '<p class="lista-vazia">Nada nesta seção ainda.</p>';
      return;
    }
    receitas.forEach(montarUmaReceita);

    function montarUmaReceita(r) {
      var pode = PlayerLib.podeFabricar(g.player, r);
      var linha = document.createElement('button');
      linha.className = 'receita' + (pode ? '' : ' bloqueada');

      var cv = document.createElement('canvas');
      cv.width = 32; cv.height = 32;
      cv.className = 'r-icone';
      var cx = cv.getContext('2d');
      cx.imageSmoothingEnabled = false;
      Sprites.drawItem(cx, r.saida, 0, 0, 32);
      linha.appendChild(cv);

      var txt = document.createElement('span');
      var custos = [];
      for (var item in r.custo) {
        var tem = Inv.conta(g.player.inv, item);
        var falta = tem < r.custo[item];
        custos.push('<i class="' + (falta ? 'falta' : '') + '">' +
          D.itemNome(item) + ' ' + tem + '/' + r.custo[item] + '</i>');
      }
      txt.innerHTML = '<b>' + D.itemNome(r.saida) + (r.qtd > 1 ? ' ×' + r.qtd : '') + '</b>' +
        '<small>' + custos.join(' · ') + '</small>';
      linha.appendChild(txt);

      linha.addEventListener('click', function (ev) {
        var vezes = ev.shiftKey ? 5 : 1;
        if (PlayerLib.fabricar(g.player, r, vezes) === 0) {
          flash('Faltam materiais para ' + D.itemNome(r.saida));
        }
        atualizar();
      });
      lista.appendChild(linha);
    }
  }

  /** Os botões que escolhem a seção da fabricação. */
  function barraDeSecoes() {
    var barra = document.createElement('div');
    barra.className = 'secoes-craft';
    barra.id = 'secoes-craft';

    D.CATEGORIAS.forEach(function (cat) {
      var b = document.createElement('button');
      b.className = 'secao-btn' + (cat.id === catAtual ? ' sel' : '');
      b.textContent = cat.nome;
      b.dataset.cat = cat.id;
      b.addEventListener('click', function () {
        if (catAtual === cat.id) return;
        catAtual = cat.id;
        marcarSecaoEscolhida();
        montarReceitas();
      });
      barra.appendChild(b);
    });
    return barra;
  }

  function marcarSecaoEscolhida() {
    var barra = document.getElementById('secoes-craft');
    if (!barra) return;
    for (var i = 0; i < barra.children.length; i++) {
      var b = barra.children[i];
      b.classList.toggle('sel', b.dataset.cat === catAtual);
    }
  }

  function atualizarFila() {
    var box = document.getElementById('fila-craft');
    if (!box) return;
    var fila = g.player.fila;
    if (!fila.length) { box.innerHTML = '<p class="vazio">Nada sendo fabricado.</p>'; return; }

    var html = '<h4>Fila <button id="cancelar-craft">cancelar último</button></h4>';
    for (var i = 0; i < Math.min(fila.length, 8); i++) {
      var f = fila[i];
      var pct = i === 0 ? Math.round(f.progresso * 100) : 0;
      html += '<div class="fila-item"><span>' + D.itemNome(f.receita.saida) + '</span>' +
        '<div class="barra"><div style="width:' + pct + '%"></div></div></div>';
    }
    if (fila.length > 8) html += '<p class="vazio">+' + (fila.length - 8) + ' na fila</p>';
    box.innerHTML = html;

    var btn = document.getElementById('cancelar-craft');
    if (btn) btn.addEventListener('click', function () {
      PlayerLib.cancelarFabricacao(g.player);
      atualizar();
    });
  }

  /* ---------------- painel de máquina ---------------- */

  function abrirPainel(e) {
    var b = D.building(e.tipo);
    // esteira não tem painel — o que ela leva já aparece na barra de cima
    if (b.tipo === 'belt') return;

    if (painelEnt && painelEnt.id === e.id) { fecharTudo(); return; }
    fecharTudo();
    painelEnt = e;
    g.painel = e;
    var j = novaJanela(b.nome, 'j-maq');
    var corpo = j.querySelector('.corpo');

    var top = document.createElement('div');
    top.className = 'maq-top';
    top.id = 'maq-top';
    corpo.appendChild(top);

    if (b.tipo === 'chest') {
      var g1 = document.createElement('div');
      g1.className = 'grade-inv';
      for (var i = 0; i < e.inv.geral.length; i++) {
        g1.appendChild(criarSlot({ slots: e.inv.geral, i: i, contexto: 'chest' }));
      }
      top.appendChild(g1);
    } else {
      if (e.inv.fuel) top.appendChild(blocoSlot(e, 'fuel', '🔥 Combustível'));
      if (e.inv.input) top.appendChild(blocoSlot(e, 'input', '⛏ Entrada'));
      if (e.inv.output) {
        top.appendChild(setaProgresso());
        top.appendChild(blocoSlot(e, 'output', '📦 Saída'));
      }
      if (b.tipo === 'inserter') {
        var mao2 = document.createElement('div');
        mao2.className = 'bloco-slot';
        mao2.innerHTML = '<label>✋ Na mão</label><div class="caixa-slot"><div class="slot-fixo" id="ins-mao"></div></div>';
        top.appendChild(mao2);
      }
    }

    var est = document.createElement('p');
    est.className = 'maq-estado';
    est.id = 'maq-estado';
    corpo.appendChild(est);

    if (b.giravel) {
      var girar = document.createElement('button');
      girar.className = 'btn-small';
      girar.id = 'maq-girar';
      girar.textContent = textoGirar(e);
      girar.addEventListener('click', function () {
        e.dir = (e.dir + 1) % 4;
        girar.textContent = textoGirar(e);
      });
      corpo.appendChild(girar);
    }

    // inventário do jogador embaixo, para transferir
    var sep = document.createElement('h4');
    sep.textContent = 'Sua mochila';
    corpo.appendChild(sep);

    var grade = document.createElement('div');
    grade.className = 'grade-inv';
    for (var k = 0; k < C.INV_SIZE; k++) {
      grade.appendChild(criarSlot({ slots: g.player.inv, i: k, contexto: 'inv' }));
    }
    corpo.appendChild(grade);

    atualizar();
  }

  function blocoSlot(e, nome, rotulo) {
    var d = document.createElement('div');
    d.className = 'bloco-slot';
    d.innerHTML = '<label>' + rotulo + '</label>';
    var caixa = document.createElement('div');
    caixa.className = 'caixa-slot';
    for (var i = 0; i < e.inv[nome].length; i++) {
      caixa.appendChild(criarSlot({ slots: e.inv[nome], i: i, contexto: nome }));
    }
    d.appendChild(caixa);
    if (nome === 'fuel') {
      var chama = document.createElement('div');
      chama.className = 'chama';
      chama.id = 'maq-chama';
      chama.innerHTML = '<div></div>';
      d.appendChild(chama);
    }
    return d;
  }

  function setaProgresso() {
    var d = document.createElement('div');
    d.className = 'seta-prog';
    d.innerHTML = '<div class="trilho"><div id="maq-prog"></div></div><span>➜</span>';
    return d;
  }

  function nomeDir(d) { return ['norte', 'leste', 'sul', 'oeste'][d]; }

  function textoGirar(e) {
    var b = D.building(e.tipo);
    if (b.tipo === 'inserter') {
      var op = (e.dir + 2) % 4;
      return '↻ Girar  (pega do ' + nomeDir(op) + ' → põe no ' + nomeDir(e.dir) + ')';
    }
    return '↻ Girar saída (agora: ' + nomeDir(e.dir) + ')';
  }

  function atualizarPainel() {
    if (!painelEnt) return;
    var e = painelEnt;

    var est = document.getElementById('maq-estado');
    if (est) {
      est.textContent = Entities.estado(e);
      est.className = 'maq-estado ' + (e.ativo ? 'ok' : 'parado');
    }

    var prog = document.getElementById('maq-prog');
    if (prog) prog.style.width = Math.round(Math.min(1, e.progresso) * 100) + '%';

    // se girou com R, o botão do painel acompanha
    var btnGirar = document.getElementById('maq-girar');
    if (btnGirar) {
      var txt = textoGirar(e);
      if (btnGirar.textContent !== txt) btnGirar.textContent = txt;
    }

    // o que o inseridor está carregando agora
    var insMao = document.getElementById('ins-mao');
    if (insMao) {
      var chave = e.segurando || '';
      if (insMao.dataset.k !== chave) {
        insMao.dataset.k = chave;
        insMao.innerHTML = '';
        if (e.segurando) {
          var cv = document.createElement('canvas');
          cv.width = 32; cv.height = 32;
          var cx2 = cv.getContext('2d');
          cx2.imageSmoothingEnabled = false;
          Sprites.drawItem(cx2, e.segurando, 0, 0, 32);
          insMao.appendChild(cv);
        }
      }
    }

    var chama = document.getElementById('maq-chama');
    if (chama && chama.firstChild) {
      var pct = e.queimaMax > 0 ? Math.max(0, e.queima / e.queimaMax) : 0;
      chama.firstChild.style.height = Math.round(pct * 100) + '%';
    }
  }

  /* ============================================================
     mapa
     ============================================================ */

  var TILES_MINI = 72;          // quantos tiles cabem no minimapa
  var mapaInfo = null;
  var mapaCanvas = null;
  var mapaHover = null;         // tile sob o mouse no mapa grande
  var inspAssinatura = null;    // só remonta o inspetor quando muda de verdade

  function alternarMapa() {
    if (el.janelas.querySelector('.j-mapa')) { fecharTudo(); return; }
    fecharTudo();
    abrirMapa();
  }

  function abrirMapa() {
    var j = novaJanela('Mapa do mundo', 'j-mapa');
    var corpo = j.querySelector('.corpo');

    var wrap = document.createElement('div');
    wrap.className = 'mapa-wrap';

    mapaCanvas = document.createElement('canvas');
    mapaCanvas.className = 'mapa-grande';
    var lado = Math.min(global.innerWidth * 0.55, global.innerHeight * 0.72, 640);
    mapaCanvas.width = Math.floor(lado);
    mapaCanvas.height = Math.floor(lado);
    wrap.appendChild(mapaCanvas);

    var lateral = document.createElement('div');
    lateral.className = 'mapa-legenda';
    lateral.innerHTML = montarLegenda();

    // o que está sob o mouse aparece aqui embaixo, com ícone
    var insp = document.createElement('div');
    insp.className = 'mapa-inspetor';
    insp.id = 'mapa-inspetor';
    lateral.appendChild(insp);

    wrap.appendChild(lateral);

    corpo.appendChild(wrap);

    var rodape = document.createElement('p');
    rodape.className = 'mapa-info';
    rodape.id = 'mapa-info';
    rodape.textContent = 'Mundo de ' + C.MUNDO_TILES + '×' + C.MUNDO_TILES +
      ' tiles (' + C.MUNDO_CHUNKS + '×' + C.MUNDO_CHUNKS + ' chunks).';
    corpo.appendChild(rodape);

    mapaHover = null;
    inspAssinatura = null;

    mapaCanvas.addEventListener('mousemove', function (ev) {
      if (!mapaInfo) return;
      var r = mapaCanvas.getBoundingClientRect();
      var p = global.FZ.Minimap.mapaParaMundo(mapaInfo,
        (ev.clientX - r.left) * (mapaCanvas.width / r.width),
        (ev.clientY - r.top) * (mapaCanvas.height / r.height));
      mapaHover = { tx: Math.floor(p.x), ty: Math.floor(p.y) };
      atualizarInspetorMapa();
    });

    mapaCanvas.addEventListener('mouseleave', function () {
      mapaHover = null;
      atualizarInspetorMapa();
    });

    desenharMapaGrande();
    atualizarInspetorMapa();
  }

  function montarLegenda() {
    var totais = global.FZ.Minimap.inventarioDoMundo();
    var html = '<h4>O que ainda existe</h4><ul>';

    for (var i = 1; i < D.RES_INFO.length; i++) {
      var ri = D.RES_INFO[i];
      if (!ri) continue;
      var qtd = totais[ri.id] || 0;
      var cor = global.FZ.Paleta.jazida(ri.key, ri.cor || '#9aa3af').base;
      var nome = ri.nome.replace('Jazida de ', '').replace('Depósito de ', '');
      nome = nome.charAt(0).toUpperCase() + nome.slice(1);
      html += '<li' + (qtd === 0 ? ' class="acabou"' : '') + '>' +
        '<i style="background:' + cor + '"></i>' +
        '<span>' + nome + '</span>' +
        '<b>' + (qtd === 0 ? 'acabou' : formatarNumero(qtd)) + '</b></li>';
    }
    html += '</ul><p class="legenda-nota">Recurso não volta: o que sai do mapa, sai de vez.</p>';
    return html;
  }

  function formatarNumero(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  /* ---------------- inspetor do mapa ----------------
     Passar o mouse pelo mapa mostra aqui do lado o que tem naquele
     lugar: a jazida com o quanto ainda existe, ou a máquina com o
     que está acontecendo dentro dela. */

  function atualizarInspetorMapa() {
    var box = document.getElementById('mapa-inspetor');
    if (!box) { inspAssinatura = null; return; }

    var d = mapaHover ? lerLugar(mapaHover.tx, mapaHover.ty) : {
      assinatura: 'nada',
      html: '<p class="insp-vazio">Passe o mouse pelo mapa.</p>',
      prog: null, chama: null
    };

    if (d.assinatura !== inspAssinatura) {
      inspAssinatura = d.assinatura;
      box.innerHTML = tituloInsp() + d.html;
      pintarIcones(box);
    }

    // as barras andam sozinhas, sem remontar o painel
    var bp = box.querySelector('.insp-b.prog > i');
    if (bp) bp.style.width = Math.round(Math.min(1, Math.max(0, d.prog || 0)) * 100) + '%';
    var bc = box.querySelector('.insp-b.chama > i');
    if (bc) bc.style.width = Math.round(Math.min(1, Math.max(0, d.chama || 0)) * 100) + '%';
  }

  function tituloInsp() { return '<h4>No cursor</h4>'; }

  function lerLugar(tx, ty) {
    var coord = '(' + tx + ', ' + ty + ')';
    if (!World.dentroDoMundo(tx, ty)) {
      return {
        assinatura: 'fora',
        html: '<p class="insp-vazio">Fora do mundo.</p>',
        prog: null, chama: null
      };
    }

    var ent = World.entityAt(tx, ty);
    if (ent) return lugarMaquina(ent, coord);

    var res = World.resAt(tx, ty);
    if (res) return lugarJazida(res, tx, ty, coord);

    var t = D.terrainInfo(World.terrainAt(tx, ty));
    return {
      assinatura: 'chao:' + t.key + ':' + coord,
      html: cabecalhoCor(t.cor, t.nome, t.solido ? 'Não dá para passar' : 'Chão livre', coord) +
        '<p class="insp-nota">' + (t.solido ? 'Nem para construir.' : 'Dá para construir aqui.') + '</p>',
      prog: null, chama: null
    };
  }

  /* ---- jazida ---- */

  function lugarJazida(res, tx, ty, coord) {
    var info = D.resInfo(res);
    var aqui = World.amountAt(tx, ty);
    var toda = totalDaJazida(tx, ty, res);

    var html = cabecalhoItem(info.item, info.nome, 'Rende ' + D.itemNome(info.item), coord) +
      '<ul class="insp-lista">' +
      linhaItem(info.item, 'Neste quadrado', formatarNumero(aqui)) +
      linhaItem(null, 'A jazida inteira', formatarNumero(toda)) +
      '</ul>';
    if (info.aviso) html += '<p class="insp-nota aviso">' + info.aviso + '</p>';
    else if (!info.mao) html += '<p class="insp-nota aviso">Não dá para tirar na mão.</p>';

    return { assinatura: 'jaz:' + coord + ':' + aqui + ':' + toda, html: html, prog: null, chama: null };
  }

  /* Uma jazida é a mancha ligada do mesmo minério. O total vale para
     todos os tiles dela, então guarda todos de uma vez — andar com o
     mouse dentro da mesma jazida não recalcula nada. */
  var manchaCache = { t: -1, tot: {} };

  function totalDaJazida(tx, ty, res) {
    var agora = Date.now() / 1000;
    if (agora - manchaCache.t > 1.5) manchaCache = { t: agora, tot: {} };
    var chave = tx + ',' + ty;
    if (manchaCache.tot[chave] !== undefined) return manchaCache.tot[chave];

    var fila = [[tx, ty]], vistos = {}, membros = [], soma = 0;
    vistos[chave] = 1;
    while (fila.length && membros.length < 6000) {
      var pt = fila.pop(), x = pt[0], y = pt[1];
      if (World.resAt(x, y) !== res) continue;
      membros.push(x + ',' + y);
      soma += World.amountAt(x, y);
      var viz = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (var i = 0; i < 4; i++) {
        var vx = viz[i][0], vy = viz[i][1], vk = vx + ',' + vy;
        if (vistos[vk] || !World.dentroDoMundo(vx, vy)) continue;
        vistos[vk] = 1;
        fila.push(viz[i]);
      }
    }
    for (var j = 0; j < membros.length; j++) manchaCache.tot[membros[j]] = soma;
    return soma;
  }

  /* ---- máquina ---- */

  function lugarMaquina(e, coord) {
    var b = D.building(e.tipo);
    var est = Entities.estado(e);
    var linhas = '', nota = '', prog = null, chama = null;
    var sig = 'maq:' + e.id + ':' + est;

    if (b.tipo === 'furnace') {
      var entrada = e.inv.input[0], saida = e.inv.output[0];
      var receita = entrada ? D.SMELTING[entrada.item] : null;
      linhas += linhaSlot(entrada, 'Fundindo', 'nada dentro');
      linhas += linhaSlot(saida, 'Já pronto', 'nada pronto');
      linhas += linhaSlot(e.inv.fuel[0], 'Combustível', 'sem combustível');
      if (receita) nota = 'Vira ' + D.itemNome(receita.saida) + ' a cada ' + receita.tempo + ' s';
      prog = e.progresso;
      chama = e.queimaMax > 0 ? e.queima / e.queimaMax : 0;
      sig += ':' + assinaturaSlots([entrada, saida, e.inv.fuel[0]]);

    } else if (b.tipo === 'drill') {
      var alvo = Entities.jazidaSob(e);
      var sob = minerioSob(e);
      if (alvo) {
        linhas += linhaItem(alvo.info.item, 'Tirando', D.itemNome(alvo.info.item));
        linhas += linhaItem(null, 'Ainda dá para tirar', formatarNumero(sob));
        nota = 'Tira ' + b.velocidade + ' por segundo — dá ' +
          tempoCurto(sob / b.velocidade) + ' até acabar embaixo dela';
      } else {
        linhas += linhaItem(null, 'Jazida embaixo', 'acabou');
      }
      linhas += linhaSlot(e.inv.output[0], 'No buffer', 'vazio');
      linhas += linhaSlot(e.inv.fuel[0], 'Combustível', 'sem combustível');
      prog = e.progresso;
      chama = e.queimaMax > 0 ? e.queima / e.queimaMax : 0;
      sig += ':' + sob + ':' + assinaturaSlots([e.inv.output[0], e.inv.fuel[0]]);

    } else if (b.tipo === 'chest') {
      var itens = agrupar(e.inv.geral);
      if (!itens.length) linhas += linhaItem(null, 'Vazio', '—');
      for (var i = 0; i < itens.length && i < 6; i++)
        linhas += linhaItem(itens[i].item, D.itemNome(itens[i].item), formatarNumero(itens[i].n));
      if (itens.length > 6) nota = 'e mais ' + (itens.length - 6) + ' tipo(s)';
      sig += ':' + itens.map(function (o) { return o.item + o.n; }).join(',');

    } else if (b.tipo === 'belt') {
      Entities.garantirFaixas(e);
      var todos = agrupar(e.faixas[0].concat(e.faixas[1]));
      linhas += linhaItem(null, 'Faixa esquerda', e.faixas[0].length + '/' + b.capacidade);
      linhas += linhaItem(null, 'Faixa direita', e.faixas[1].length + '/' + b.capacidade);
      for (var k = 0; k < todos.length && k < 4; k++)
        linhas += linhaItem(todos[k].item, D.itemNome(todos[k].item), String(todos[k].n));
      sig += ':' + e.faixas[0].length + ':' + e.faixas[1].length + ':' +
        todos.map(function (o) { return o.item + o.n; }).join(',');

    } else if (b.tipo === 'inserter') {
      linhas += linhaItem(e.segurando, 'Na mão', e.segurando ? D.itemNome(e.segurando) : 'nada');
      linhas += linhaSlot(e.inv.fuel[0], 'Combustível', 'sem combustível');
      nota = 'Pega do ' + nomeDir((e.dir + 2) % 4) + ' e põe no ' + nomeDir(e.dir) + ' · R gira';
      chama = e.queimaMax > 0 ? e.queima / e.queimaMax : 0;
      sig += ':' + (e.segurando || '-') + ':' + assinaturaSlots([e.inv.fuel[0]]);
    }

    if (b.giravel && b.tipo !== 'inserter')
      nota = (nota ? nota + '<br>' : '') + 'Sai para o ' + nomeDir(e.dir) + ' · R gira';

    var html = cabecalhoItem(e.tipo, b.nome, est, coord);
    if (linhas) html += '<ul class="insp-lista">' + linhas + '</ul>';
    if (prog !== null) html += medidor('Progresso', 'prog');
    if (chama !== null) html += medidor('Queimando', 'chama');
    if (nota) html += '<p class="insp-nota">' + nota + '</p>';

    return { assinatura: sig, html: html, prog: prog, chama: chama };
  }

  /** Quanto de jazida ainda existe debaixo da máquina inteira. */
  function minerioSob(e) {
    var total = 0;
    for (var dy = 0; dy < e.h; dy++) {
      for (var dx = 0; dx < e.w; dx++) {
        var res = World.resAt(e.x + dx, e.y + dy);
        if (!res) continue;
        var info = D.resInfo(res);
        if (info && info.emCima) total += World.amountAt(e.x + dx, e.y + dy);
      }
    }
    return total;
  }

  function agrupar(slots) {
    var mapa = {}, ordem = [];
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (!s) continue;
      var item = s.item;
      if (mapa[item] === undefined) { mapa[item] = 0; ordem.push(item); }
      mapa[item] += (s.count || 1);
    }
    return ordem.map(function (it) { return { item: it, n: mapa[it] }; });
  }

  function assinaturaSlots(lista) {
    var out = '';
    for (var i = 0; i < lista.length; i++)
      out += (lista[i] ? lista[i].item + lista[i].count : '-') + '|';
    return out;
  }

  function tempoCurto(seg) {
    if (seg >= 3600) return Math.round(seg / 3600) + ' h';
    if (seg >= 60) return Math.round(seg / 60) + ' min';
    return Math.round(seg) + ' s';
  }

  /* ---- pedaços de HTML ---- */

  function cabecalhoItem(item, nome, sub, coord) {
    return '<div class="insp-topo">' +
      '<span class="insp-ic g" data-item="' + item + '"></span>' +
      '<div><b>' + nome + '</b><em>' + sub + '</em></div>' +
      '</div><p class="insp-coord">' + coord + '</p>';
  }

  function cabecalhoCor(cor, nome, sub, coord) {
    return '<div class="insp-topo">' +
      '<span class="insp-cor" style="background:' + cor + '"></span>' +
      '<div><b>' + nome + '</b><em>' + sub + '</em></div>' +
      '</div><p class="insp-coord">' + coord + '</p>';
  }

  function linhaItem(item, rotulo, valor) {
    return '<li>' +
      (item ? '<span class="insp-ic" data-item="' + item + '"></span>'
            : '<span class="insp-ic vazio"></span>') +
      '<span>' + rotulo + '</span><b>' + valor + '</b></li>';
  }

  function linhaSlot(slot, rotulo, vazio) {
    if (!slot) return linhaItem(null, rotulo, vazio);
    return linhaItem(slot.item, rotulo, D.itemNome(slot.item) + ' ×' + slot.count);
  }

  function medidor(rotulo, classe) {
    return '<div class="insp-medidor"><span>' + rotulo + '</span>' +
      '<div class="insp-b ' + classe + '"><i></i></div></div>';
  }

  /* O mesmo painel, agora no canto direito da tela do jogo: mostra o
     que está debaixo do cursor sem precisar abrir o mapa. Fica escondido
     quando não há nada para dizer, para não sujar a tela. */
  var inspHudSig = null;

  function atualizarInspetorHud() {
    if (!el.inspetor) return;

    if (temJanela()) { limparInspetorHud(); return; }

    var c = g.cursor;
    var dentro = World.dentroDoMundo(c.tx, c.ty);
    var alvo = dentro && (World.entityAt(c.tx, c.ty) || World.resAt(c.tx, c.ty));

    var naMao = PlayerLib.itemNaMao(g.player);
    var construindo = (naMao && D.ITEMS[naMao] && D.ITEMS[naMao].constroi) ? naMao : null;

    if (!alvo && !construindo) { limparInspetorHud(); return; }

    var d = alvo ? lerLugar(c.tx, c.ty) : { assinatura: 'mao', html: '', prog: null, chama: null };
    var sig = d.assinatura + '|' + (construindo || '-') + '|' + g.dirConstrucao;

    if (sig !== inspHudSig) {
      inspHudSig = sig;
      el.inspetor.innerHTML = d.html + (construindo ? blocoNaMao(construindo) : '');
      pintarIcones(el.inspetor);
    }

    var bp = el.inspetor.querySelector('.insp-b.prog > i');
    if (bp) bp.style.width = Math.round(Math.min(1, Math.max(0, d.prog || 0)) * 100) + '%';
    var bc = el.inspetor.querySelector('.insp-b.chama > i');
    if (bc) bc.style.width = Math.round(Math.min(1, Math.max(0, d.chama || 0)) * 100) + '%';
  }

  function limparInspetorHud() {
    if (inspHudSig === null) return;
    inspHudSig = null;
    el.inspetor.innerHTML = '';
  }

  function blocoNaMao(item) {
    return '<div class="insp-mao">' +
      '<span class="insp-ic" data-item="' + item + '"></span>' +
      '<span>Na mão: <b>' + D.itemNome(item) + '</b></span>' +
      '<em>R gira · ' + nomeDir(g.dirConstrucao) + '</em></div>';
  }

  function pintarIcones(box) {
    var ics = box.querySelectorAll('.insp-ic[data-item]');
    for (var i = 0; i < ics.length; i++) {
      var tam = ics[i].classList.contains('g') ? 32 : 18;
      var cv = document.createElement('canvas');
      cv.width = tam; cv.height = tam;
      var cx = cv.getContext('2d');
      cx.imageSmoothingEnabled = false;
      Sprites.drawItem(cx, ics[i].dataset.item, 0, 0, tam);
      ics[i].appendChild(cv);
    }
  }

  function desenharMapaGrande() {
    if (!mapaCanvas || !mapaCanvas.isConnected) { mapaCanvas = null; return; }
    var cx = mapaCanvas.getContext('2d');
    mapaInfo = global.FZ.Minimap.desenharGrande(cx, mapaCanvas.width, mapaCanvas.height, g.player);
  }

  function desenharMinimapa() {
    if (!el.minimapa || !global.FZ.Minimap.pronto) return;
    var cx = el.minimapa.getContext('2d');
    global.FZ.Minimap.desenharMini(cx, el.minimapa.width, g.player, TILES_MINI);
  }

  /* ============================================================
     menu de pausa
     ============================================================ */

  function abrirPausa() {
    fecharTudo();
    global.FZ.Game.pausar(true);

    var j = novaJanela('Pausa', 'j-pausa');
    var corpo = j.querySelector('.corpo');
    j.querySelector('.fechar').addEventListener('click', retomar);

    var botoes = [
      ['▶ Continuar', retomar],
      ['💾 Salvar agora', function () {
        if (global.FZ.Game.salvarJogo()) flash('Jogo salvo no slot ' + g.save.slot);
      }],
      ['⚙ Configurações', function () {
        fecharTudo();
        global.FZ.Menu.configuracoesNoJogo();
      }],
      ['🏠 Salvar e sair para o menu', function () {
        fecharTudo();
        global.FZ.Game.sair(true);
        global.FZ.Menu.showScreen('main', false);
      }]
    ];

    botoes.forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn-pausa';
      btn.textContent = b[0];
      btn.addEventListener('click', b[1]);
      corpo.appendChild(btn);
    });

    var info = document.createElement('p');
    info.className = 'pausa-info';
    info.innerHTML = 'Mundo: <b>' + g.save.name + '</b><br>' +
      'Semente: <b>' + g.save.seed + '</b><br>' +
      'Coletado: <b>' + g.player.stats.coletado + '</b> · ' +
      'Fabricado: <b>' + g.player.stats.fabricado + '</b> · ' +
      'Construído: <b>' + g.player.stats.construido + '</b>';
    corpo.appendChild(info);
  }

  function retomar() {
    fecharTudo();
    global.FZ.Game.pausar(false);
  }

  function escape() {
    if (temJanela()) {
      var pausado = !!el.janelas.querySelector('.j-pausa');
      fecharTudo();
      if (pausado) global.FZ.Game.pausar(false);
      return;
    }
    abrirPausa();
  }

  /* ============================================================
     atualização
     ============================================================ */

  function atualizar() {
    if (!g) return;
    var slots = el.janelas.querySelectorAll('.slot-item');
    for (var i = 0; i < slots.length; i++) pintarSlot(slots[i]);
    atualizarHotbar();
    montarReceitasSeAberto();
    atualizarFila();
    atualizarPainel();
  }

  /* A lista de receitas é recriada no DOM, então só refaz quando o
     inventário realmente muda — senão pisca 8 vezes por segundo. */
  var assinaturaInv = null;

  function assinaturaInventario() {
    var s = '';
    for (var i = 0; i < g.player.inv.length; i++) {
      var x = g.player.inv[i];
      s += x ? x.item + x.count + '|' : '.';
    }
    return s;
  }

  function montarReceitasSeAberto() {
    if (!document.getElementById('lista-receitas')) { assinaturaInv = null; return; }
    var a = assinaturaInventario();
    if (a === assinaturaInv) return;
    assinaturaInv = a;
    montarReceitas();
  }

  function atualizarHotbar() {
    if (!el.hotbar) return;
    var filhos = el.hotbar.children;
    for (var i = 0; i < filhos.length; i++) {
      pintarSlot(filhos[i]);
      filhos[i].classList.toggle('sel', i === g.player.hotbar);
    }
  }

  /* ============================================================
     desenho por quadro (avisos, barras, info do cursor)
     ============================================================ */

  function desenhar(dt) {
    if (!g) return;

    contarFps(dt);
    acumRefresh += dt;
    if (acumRefresh > 0.12) {
      acumRefresh = 0;

      // andou para longe da máquina? o painel fecha sozinho
      if (painelEnt) {
        var dx = (painelEnt.x + painelEnt.w / 2) - g.player.x;
        var dy = (painelEnt.y + painelEnt.h / 2) - g.player.y;
        if (Math.hypot(dx, dy) > C.REACH + 2) {
          var nome = D.building(painelEnt.tipo).nome;
          fecharTudo();
          flash('Longe demais — ' + nome + ' fechado');
        }
      }

      if (temJanela()) atualizar();
      else atualizarHotbar();
      desenharMinimapa();
      atualizarInspetorHud();
      if (mapaCanvas) atualizarInspetorMapa();
    }

    if (mapaCanvas) desenharMapaGrande();

    // avisos
    var html = '';
    for (var i = 0; i < g.avisos.length; i++) {
      var a = g.avisos[i];
      var op = Math.min(1, a.t / 0.6);
      var txt = a.n > 1 ? a.base.replace(/^\+\d+/, '+' + a.n) : a.base;
      html += '<div class="aviso ' + a.tipo + '" style="opacity:' + op.toFixed(2) + '">' +
        txt + '</div>';
    }
    if (el.avisos.innerHTML !== html) el.avisos.innerHTML = html;

  }

  /* Contador de quadros por segundo, no canto de cima à esquerda.
     Serve para ele conseguir dizer "travou" com número junto. */
  var fpsAcum = 0, fpsQuadros = 0, fpsUltimo = -1, zoomUltimo = -1;

  function contarFps(dt) {
    if (!el.fps) return;
    fpsAcum += dt;
    fpsQuadros++;
    if (fpsAcum < 0.4) return;

    var fps = Math.round(fpsQuadros / fpsAcum);
    fpsAcum = 0;
    fpsQuadros = 0;
    if (fps === fpsUltimo && g.camera.zoom === zoomUltimo) return;
    fpsUltimo = fps;
    zoomUltimo = g.camera.zoom;

    el.fps.innerHTML = '<b>' + fps + '</b> fps <i>zoom ' + g.camera.zoom + '</i>';
    el.fps.className = fps >= 50 ? 'bom' : (fps >= 30 ? 'medio' : 'ruim');
  }

  function flash(msg) {
    if (global.FZ.Game) global.FZ.Game.aviso(msg, 'erro');
  }

  global.FZ = global.FZ || {};
  global.FZ.Hud = {
    montar: montar,
    desmontar: desmontar,
    atualizar: atualizar,
    atualizarHotbar: atualizarHotbar,
    desenhar: desenhar,
    alternarInventario: alternarInventario,
    alternarMapa: alternarMapa,
    abrirPainel: abrirPainel,
    fecharPainel: fecharTudo,
    escape: escape,
    mouseSobreUi: mouseSobreUi,
    lerLugarDoMapa: lerLugar    // exposto para o teste do inspetor
  };
})(window);
