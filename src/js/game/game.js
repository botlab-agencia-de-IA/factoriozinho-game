/* ============================================================
   Factoriozinho — Núcleo do jogo
   Laço principal, câmera, interação do mouse e salvamento.
   ============================================================ */

(function (global) {
  'use strict';

  var D = global.FZ.Data;
  var C = D.CONFIG;
  var World = global.FZ.World;
  var PlayerLib = global.FZ.Player;
  var Entities = global.FZ.Entities;
  var Render = global.FZ.Render;
  var Input = global.FZ.Input;
  var Inv = global.FZ.Inv;
  var Saves = global.FZ.Saves;
  var Settings = global.FZ.Settings;

  var g = null;
  var raf = null;
  var ultimoT = 0;
  var acumAutosave = 0;
  var canvas = null;
  var iniciado = false;

  /* ============================================================
     iniciar / sair
     ============================================================ */

  function iniciar(save) {
    canvas = document.getElementById('game-canvas');

    if (!iniciado) {
      Render.init(canvas);
      Input.init(canvas);
      registrarAtalhos();
      iniciado = true;
    }

    World.init(save.seed, save.world);

    // o mundo é finito, então gera tudo de uma vez e monta o mapa
    var t0 = performance.now();
    global.FZ.Minimap.init();
    console.log('mundo gerado em', Math.round(performance.now() - t0), 'ms');

    var pos = null;
    if (save.player && typeof save.player.x === 'number' &&
        (save.player.x !== 0 || save.player.y !== 0)) {
      var px = Math.floor(save.player.x), py = Math.floor(save.player.y);
      // save antigo (de quando o mundo era infinito) pode estar fora ou preso
      if (World.dentroDoMundo(px, py) && !World.tileSolido(px, py)) {
        pos = { x: save.player.x, y: save.player.y };
      }
    }
    if (!pos) pos = World.acharSpawn();

    var p = PlayerLib.criar(pos.x, pos.y);

    // restaura o inventário salvo
    if (save.player && save.player.inventory && save.player.inventory.length) {
      for (var i = 0; i < p.inv.length && i < save.player.inventory.length; i++) {
        p.inv[i] = save.player.inventory[i] || null;
      }
    }
    if (save.player && save.player.hotbar != null) p.hotbar = save.player.hotbar;
    if (save.player && save.player.stats) p.stats = save.player.stats;

    g = {
      save: save,
      player: p,
      camera: { x: p.x, y: p.y, zoom: C.ZOOM_DEFAULT },
      cursor: { tx: 0, ty: 0, wx: 0, wy: 0 },
      dirConstrucao: 1,          // leste, o sentido mais natural para montar linha
      pausado: false,
      painel: null,
      avisos: [],
      tempo: save.playtime || 0,
      cliqueEsqAnterior: false,
      cliqueDirAnterior: false
    };

    document.body.classList.add('jogando');
    document.getElementById('game-layer').classList.add('is-active');
    Render.resize();
    Input.setAtivo(true);

    global.FZ.Hud.montar(g);
    global.FZ.Hud.atualizar();

    acumAutosave = 0;
    ultimoT = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);

    aviso('Bem-vindo a ' + save.name, 'info');
  }

  function sair(salvar) {
    if (!g) return;
    if (salvar !== false) salvarJogo(true);
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    Input.setAtivo(false);
    document.body.classList.remove('jogando');
    document.getElementById('game-layer').classList.remove('is-active');
    global.FZ.Hud.desmontar();
    g = null;
  }

  /* ============================================================
     laço
     ============================================================ */

  function frame(agora) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min((agora - ultimoT) / 1000, 0.1);
    ultimoT = agora;
    if (!g) return;

    if (!g.pausado) {
      update(dt);
      g.tempo += dt;
    }
    Render.draw(g, dt);
    if (Settings.get('showGrid')) Render.desenharGrade(g.camera, C.TILE * g.camera.zoom);

    global.FZ.Hud.desenhar(dt);
  }

  function update(dt) {
    var p = g.player;

    /* --- movimento --- */
    var eixo = Input.eixos();
    PlayerLib.mover(p, eixo.x, eixo.y, dt);
    PlayerLib.update(p, dt);

    /* --- câmera segue com folga --- */
    var k = 1 - Math.pow(0.0015, dt);
    g.camera.x += (p.x - g.camera.x) * k;
    g.camera.y += (p.y - g.camera.y) * k;

    /* --- cursor --- */
    var m = Input.mouse;
    var w = Render.paraMundo(g.camera, m.x, m.y);
    g.cursor.wx = w.x;
    g.cursor.wy = w.y;
    g.cursor.tx = Math.floor(w.x);
    g.cursor.ty = Math.floor(w.y);

    /* --- roda do mouse: zoom, e nada mais.
       A barra rápida se escolhe pelo número ou clicando no slot. --- */
    var roda = Input.consumirRoda();
    if (roda) zoom(-roda);

    /* --- mundo --- */
    Entities.update(dt);

    /* --- mouse no mundo --- */
    if (m.dentro && !global.FZ.Hud.mouseSobreUi()) interagir(dt);
    else PlayerLib.pararDeMinerar(p);

    g.cliqueEsqAnterior = m.esq;
    g.cliqueDirAnterior = m.dir;

    /* --- avisos --- */
    for (var i = g.avisos.length - 1; i >= 0; i--) {
      g.avisos[i].t -= dt;
      if (g.avisos[i].t <= 0) g.avisos.splice(i, 1);
    }

    /* --- autosave --- */
    var minutos = Settings.get('autosave');
    if (minutos > 0) {
      acumAutosave += dt;
      if (acumAutosave >= minutos * 60) {
        acumAutosave = 0;
        salvarJogo();
        aviso('Jogo salvo automaticamente', 'info');
      }
    }
  }

  /* ============================================================
     interação com o mouse
     ============================================================ */

  function interagir(dt) {
    var p = g.player;
    var m = Input.mouse;
    var tx = g.cursor.tx, ty = g.cursor.ty;

    var novoCliqueEsq = m.esq && !g.cliqueEsqAnterior;
    var novoCliqueDir = m.dir && !g.cliqueDirAnterior;

    /* ---- com uma pilha presa ao cursor, o clique abastece a máquina ----
       É o jeito do Factorio: pega metade do carvão com o botão direito na
       mochila, fecha a mochila e vai clicando nas fornalhas. */
    if (global.FZ.Hud.maoCheia()) {
      if (novoCliqueEsq || novoCliqueDir) {
        var maq = World.entityAt(tx, ty);
        if (!maq) {
          global.FZ.Hud.largarMao();
          aviso('Voltou para a mochila', 'info');
        } else if (!PlayerLib.noAlcance(p, maq.x, maq.y)) {
          aviso('Longe demais', 'erro');
        } else {
          var n = global.FZ.Hud.abastecer(maq, novoCliqueDir ? 1 : 0);
          var nomeMaq = D.building(maq.tipo).nome;
          if (n > 0) aviso('+' + n + ' → ' + nomeMaq, 'ok');
          else if (n < 0) aviso(nomeMaq + ' não usa isso', 'erro');
          else aviso(nomeMaq + ' está cheio', 'erro');
        }
      }
      PlayerLib.pararDeMinerar(p);
      return;
    }

    /* ---- botão direito: remover construção ---- */
    if (novoCliqueDir) {
      var alvo = World.entityAt(tx, ty);
      if (alvo) {
        if (PlayerLib.remover(p, alvo)) {
          if (g.painel && g.painel.id === alvo.id) global.FZ.Hud.fecharPainel();
          aviso('Removido: ' + D.building(alvo.tipo).nome, 'info');
          global.FZ.Hud.atualizar();
        } else {
          aviso('Longe demais', 'erro');
        }
      }
      return;
    }

    /* ---- botão esquerdo ---- */
    var mao = PlayerLib.itemNaMao(p);
    var infoMao = mao ? D.ITEMS[mao] : null;

    // 1) com estrutura na mão → construir
    if (infoMao && infoMao.constroi) {
      if (m.esq) {
        var ocupado = World.entityAt(tx, ty);
        if (ocupado) {
          // já tem máquina aqui: em vez de teimar, abre o painel dela
          if (novoCliqueEsq && PlayerLib.noAlcance(p, ocupado.x, ocupado.y)) {
            global.FZ.Hud.abrirPainel(ocupado);
          }
        } else if (PlayerLib.construir(p, mao, tx, ty, g.dirConstrucao)) {
          global.FZ.Hud.atualizar();
        } else if (novoCliqueEsq) {
          aviso(PlayerLib.noAlcance(p, tx, ty) ? 'Não cabe aqui' : 'Longe demais', 'erro');
        }
      }
      PlayerLib.pararDeMinerar(p);
      return;
    }

    var ent = World.entityAt(tx, ty);

    // 1.5) item comum na mão + esteira embaixo do cursor → joga o item nela
    if (mao && ent && D.building(ent.tipo).tipo === 'belt') {
      if (novoCliqueEsq) {
        if (!PlayerLib.noAlcance(p, tx, ty)) aviso('Longe demais', 'erro');
        else if (Entities.porNaEsteira(ent, mao, Entities.faixaOposta(ent, { x: p.x - 0.5, y: p.y - 0.5, w: 1, h: 1 }))) {
          Inv.remove(p.inv, mao, 1);
          global.FZ.Hud.atualizar();
        } else {
          aviso('A esteira está cheia aqui', 'erro');
        }
      }
      PlayerLib.pararDeMinerar(p);
      return;
    }

    // 2) clique numa máquina → abre o painel dela
    if (ent && novoCliqueEsq) {
      if (PlayerLib.noAlcance(p, ent.x, ent.y)) global.FZ.Hud.abrirPainel(ent);
      else aviso('Longe demais', 'erro');
      return;
    }

    // 3) segurando em cima de recurso → minerar
    if (m.esq && !ent) {
      PlayerLib.minerarTile(p, tx, ty, dt);
    } else {
      PlayerLib.pararDeMinerar(p);
    }
  }

  /* ============================================================
     atalhos
     ============================================================ */

  function registrarAtalhos() {
    Input.on('KeyE', function () { global.FZ.Hud.alternarInventario(); });
    Input.on('KeyC', function () { global.FZ.Hud.alternarInventario('fabricar'); });
    Input.on('Escape', function () { global.FZ.Hud.escape(); });
    Input.on('KeyM', function () { global.FZ.Hud.alternarMapa(); });
    Input.on('KeyQ', function () { pegarNaMao(); });
    Input.on('KeyR', function () {
      // com o mouse em cima de uma máquina girável, gira ELA
      var ent = World.entityAt(g.cursor.tx, g.cursor.ty);
      if (ent && D.building(ent.tipo).giravel) {
        if (!PlayerLib.noAlcance(g.player, ent.x, ent.y)) {
          aviso('Longe demais para girar', 'erro');
          return;
        }
        ent.dir = (ent.dir + 1) % 4;
        aviso(D.building(ent.tipo).nome + ' → ' + nomeDir(ent.dir), 'ok');
        global.FZ.Hud.atualizar();
        return;
      }
      // senão, gira a direção do que vai ser construído
      g.dirConstrucao = (g.dirConstrucao + 1) % 4;
      aviso('Direção: ' + nomeDir(g.dirConstrucao), 'info');
    });
    for (var i = 1; i <= C.HOTBAR_SIZE; i++) {
      (function (n) {
        Input.on('Digit' + n, function () {
          g.player.hotbar = n - 1;
          global.FZ.Hud.atualizarHotbar();
        });
      })(i);
    }
    Input.on('Equal', function () { zoom(1); });
    Input.on('NumpadAdd', function () { zoom(1); });
    Input.on('Minus', function () { zoom(-1); });
    Input.on('NumpadSubtract', function () { zoom(-1); });
  }

  function nomeDir(d) { return ['norte', 'leste', 'sul', 'oeste'][d]; }

  /**
   * Tecla Q: aponta para uma coisa no chão e pega ela na mão na hora,
   * se você tiver dela no inventário — igual ao Factorio.
   */
  function pegarNaMao() {
    var p = g.player;
    var tx = g.cursor.tx, ty = g.cursor.ty;
    var itemId = null;

    var ent = World.entityAt(tx, ty);
    if (ent) {
      itemId = ent.tipo;                       // o item que constrói essa máquina
      if (D.building(ent.tipo).giravel) g.dirConstrucao = ent.dir;   // copia a direção também
    } else {
      // item caído no chão, se houver algum perto do cursor
      var drops = World.state.drops;
      for (var d = 0; d < drops.length; d++) {
        if (Math.abs(drops[d].x - (tx + 0.5)) < 0.6 && Math.abs(drops[d].y - (ty + 0.5)) < 0.6) {
          itemId = drops[d].item;
          break;
        }
      }
    }

    if (!itemId) return;
    if (!D.ITEMS[itemId]) return;

    var i = Inv.acharItem(p.inv, itemId);
    if (i < 0) {
      aviso('Você não tem ' + D.itemNome(itemId), 'erro');
      return;
    }

    // já está na barra rápida? é só selecionar
    if (i < C.HOTBAR_SIZE) {
      p.hotbar = i;
    } else {
      // senão, traz para o slot selecionado, trocando com o que estava lá
      var tmp = p.inv[p.hotbar];
      p.inv[p.hotbar] = p.inv[i];
      p.inv[i] = tmp;
    }
    global.FZ.Hud.atualizar();
    aviso('Na mão: ' + D.itemNome(itemId), 'ok');
  }

  function zoom(d) {
    g.camera.zoom = Math.max(C.ZOOM_MIN, Math.min(C.ZOOM_MAX, g.camera.zoom + d));
  }

  /* ============================================================
     salvar
     ============================================================ */

  function salvarJogo(silencioso) {
    if (global.FZ.Hud.maoCheia && global.FZ.Hud.maoCheia()) global.FZ.Hud.largarMao();
    if (!g) return false;
    var s = g.save;
    s.playtime = Math.floor(g.tempo);
    s.player.x = g.player.x;
    s.player.y = g.player.y;
    s.player.inventory = g.player.inv;
    s.player.hotbar = g.player.hotbar;
    s.player.stats = g.player.stats;
    s.world = World.serialize();

    var ok = Saves.write(s.slot, s);
    if (!ok && !silencioso) aviso('Não consegui salvar!', 'erro');
    return ok;
  }

  /* ============================================================
     avisos flutuantes
     ============================================================ */

  function aviso(texto, tipo) {
    if (!g) return;
    // junta avisos repetidos seguidos ("+1 Madeira" vira "+3 Madeira")
    var ultimo = g.avisos[g.avisos.length - 1];
    if (ultimo && ultimo.base === texto) {
      ultimo.n++;
      ultimo.t = 2.4;
    } else {
      g.avisos.push({ base: texto, n: 1, t: 2.4, tipo: tipo || 'info' });
    }
    if (g.avisos.length > 6) g.avisos.shift();
  }

  function pausar(v) {
    if (!g) return;
    g.pausado = v;
    if (v) Input.soltarBotoes();
  }

  global.FZ = global.FZ || {};
  global.FZ.Game = {
    iniciar: iniciar,
    sair: sair,
    salvarJogo: salvarJogo,
    aviso: aviso,
    pausar: pausar,
    get estado() { return g; }
  };
})(window);
