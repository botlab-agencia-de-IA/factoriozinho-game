/* ============================================================
   Factoriozinho — Menu principal (Fase 0)
   Navegação entre telas, novo jogo, saves e configurações.
   ============================================================ */

(function (global) {
  'use strict';

  var S = global.FZ.Settings;
  var Saves = global.FZ.Saves;

  var history = [];          // pilha de telas, para o "voltar"
  var currentScreen = 'main';
  var focusIndex = 0;

  // estado do formulário de novo jogo
  var newGame = {
    name: '',
    seed: '',
    worldSize: 'medium',
    mode: 'relaxed',
    enemies: false,
    tutorial: true
  };

  var MODE_HINTS = {
    relaxed:   'Recursos abundantes, produção rápida, sem ameaças. Ideal para construir em paz.',
    normal:    'Custos e velocidades equilibrados. A experiência que o jogo foi desenhado para ter.',
    challenge: 'Recursos escassos, produção lenta e pesquisa cara. Para quem quer suar a camisa.'
  };

  var SIZE_LABELS = { small: 'Pequeno', medium: 'Médio', large: 'Grande', infinite: 'Infinito' };
  var MODE_LABELS = { relaxed: 'Relaxado', normal: 'Padrão', challenge: 'Desafio' };

  /* ---------------- utilidades de tela ---------------- */

  function showScreen(name, pushHistory) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.toggle('is-active', screens[i].dataset.screen === name);
    }
    if (pushHistory !== false && currentScreen !== name) history.push(currentScreen);
    currentScreen = name;
    focusIndex = 0;
  }

  function goBack() {
    // veio da pausa dentro do jogo? volta pra lá
    if (voltandoParaJogo) {
      voltandoParaJogo = false;
      esconderTelas();
      global.FZ.Input.setAtivo(true);
      global.FZ.Hud.escape();
      return;
    }
    var prev = history.pop() || 'main';
    showScreen(prev, false);
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2600);
  }

  function confirmBox(text, onYes) {
    var modal = document.getElementById('modal');
    document.getElementById('modal-text').textContent = text;
    modal.classList.add('is-open');

    var yes = document.getElementById('modal-yes');
    var no  = document.getElementById('modal-no');

    function close() {
      modal.classList.remove('is-open');
      yes.removeEventListener('click', accept);
      no.removeEventListener('click', close);
    }
    function accept() { close(); onYes(); }

    yes.addEventListener('click', accept);
    no.addEventListener('click', close);
  }

  /* ---------------- menu principal ---------------- */

  function bindMainMenu() {
    document.getElementById('main-menu').addEventListener('click', function (ev) {
      var btn = ev.target.closest('.menu-item');
      if (!btn) return;

      switch (btn.dataset.action) {
        case 'new':      openNewGame();       break;
        case 'load':     openLoad();          break;
        case 'settings': showScreen('settings'); break;
        case 'help':     showScreen('help');     break;
        case 'credits':  showScreen('credits');  break;
        case 'quit':     quit();              break;
      }
    });

    // botões "voltar" de todas as telas
    var backs = document.querySelectorAll('[data-action="back"]');
    for (var i = 0; i < backs.length; i++) {
      backs[i].addEventListener('click', goBack);
    }
  }

  function quit() {
    confirmBox('Sair do Factoriozinho?', function () {
      global.close();
      // se o navegador não deixar fechar a aba, ao menos avisa
      setTimeout(function () {
        toast('O navegador não deixa fechar esta aba — feche na mão. 👋');
      }, 250);
    });
  }

  /* ---------------- novo jogo ---------------- */

  function openNewGame() {
    newGame.seed = Saves.randomSeed();
    document.getElementById('world-seed').value = newGame.seed;
    document.getElementById('world-name').value = newGame.name;
    showScreen('new');
    setTimeout(function () { document.getElementById('world-name').focus(); }, 60);
  }

  function bindNewGame() {
    document.getElementById('btn-reroll').addEventListener('click', function () {
      newGame.seed = Saves.randomSeed();
      document.getElementById('world-seed').value = newGame.seed;
    });

    document.getElementById('world-name').addEventListener('input', function (e) {
      newGame.name = e.target.value;
    });
    document.getElementById('world-seed').addEventListener('input', function (e) {
      newGame.seed = e.target.value;
    });

    document.getElementById('opt-enemies').addEventListener('change', function (e) {
      newGame.enemies = e.target.checked;
    });
    document.getElementById('opt-tutorial').addEventListener('change', function (e) {
      newGame.tutorial = e.target.checked;
    });

    document.getElementById('btn-create').addEventListener('click', createWorld);
  }

  function createWorld() {
    var name = (newGame.name || '').trim() || 'Fábrica sem nome';
    var seed = (newGame.seed || '').trim() || Saves.randomSeed();

    var slot = Saves.firstFree();
    if (slot === 0) {
      toast('Todos os 5 slots estão cheios. Apague um em "Carregar Jogo".');
      openLoad();
      return;
    }

    var data = Saves.createWorld({
      name: name,
      seed: seed,
      worldSize: newGame.worldSize,
      mode: newGame.mode,
      enemies: newGame.enemies,
      tutorial: newGame.tutorial
    });

    if (!Saves.write(slot, data)) {
      toast('Não consegui salvar (armazenamento do navegador bloqueado).');
      return;
    }

    toast('Mundo salvo no slot ' + slot + '.');
    openWorld(data);
  }

  /* ---------------- entrar no jogo ---------------- */

  /** Esconde todo o menu (o jogo assume a tela). */
  function esconderTelas() {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('is-active');
    currentScreen = null;
  }

  function openWorld(data) {
    // migra saves antigos, criados antes da Fase 1 existir
    if (!data.world) data.world = {};
    if (!data.world.mods) data.world.mods = {};
    if (!data.world.entities) data.world.entities = {};
    if (!data.world.drops) data.world.drops = [];
    if (!data.player) data.player = { x: 0, y: 0, inventory: [], hotbar: 0 };

    history.length = 0;
    esconderTelas();
    global.FZ.Game.iniciar(data);
  }

  /** Configurações abertas de dentro do jogo (a partir da pausa). */
  function configuracoesNoJogo() {
    voltandoParaJogo = true;
    global.FZ.Input.setAtivo(false);   // enquanto isso, o jogo não escuta teclas
    syncSettingsUI();
    showScreen('settings', false);
  }

  var voltandoParaJogo = false;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- carregar jogo ---------------- */

  function openLoad() {
    renderSlots();
    showScreen('load');
  }

  function renderSlots() {
    var list = Saves.list();
    var box = document.getElementById('slot-list');
    box.innerHTML = '';

    for (var i = 0; i < list.length; i++) {
      var slotNum = i + 1;
      var data = list[i];
      var div = document.createElement('div');
      div.className = 'slot ' + (data ? 'is-filled' : 'is-empty');
      div.dataset.slot = slotNum;

      if (data) {
        div.innerHTML =
          '<span class="slot-num">' + slotNum + '</span>' +
          '<span class="slot-info">' +
            '<b>' + escapeHtml(data.name) + '</b>' +
            '<span class="slot-meta">' +
              '<small>Nível ' + data.player.level + '</small>' +
              '<small>' + Saves.formatPlaytime(data.playtime) + '</small>' +
              '<small>semente ' + escapeHtml(String(data.seed)) + '</small>' +
              '<small>' + Saves.formatDate(data.updatedAt) + '</small>' +
            '</span>' +
          '</span>' +
          '<button class="slot-del" title="Apagar este save">🗑</button>';
      } else {
        div.innerHTML =
          '<span class="slot-num">' + slotNum + '</span>' +
          '<span class="slot-info"><b>Slot vazio</b><small>Clique para criar um mundo aqui</small></span>';
      }
      box.appendChild(div);
    }
  }

  function bindLoad() {
    document.getElementById('slot-list').addEventListener('click', function (ev) {
      var slotEl = ev.target.closest('.slot');
      if (!slotEl) return;
      var slot = parseInt(slotEl.dataset.slot, 10);

      // apagar
      if (ev.target.closest('.slot-del')) {
        ev.stopPropagation();
        var data = Saves.read(slot);
        confirmBox('Apagar o mundo "' + (data ? data.name : '?') + '"? Isso não tem volta.', function () {
          Saves.remove(slot);
          renderSlots();
          toast('Save do slot ' + slot + ' apagado.');
        });
        return;
      }

      if (slotEl.classList.contains('is-empty')) {
        openNewGame();
        return;
      }

      var save = Saves.read(slot);
      if (save) openWorld(save);
    });
  }

  /* ---------------- configurações ---------------- */

  function bindSettings() {
    // abas
    document.getElementById('settings-tabs').addEventListener('click', function (ev) {
      var btn = ev.target.closest('button[data-tab]');
      if (!btn) return;
      var tabs = this.querySelectorAll('button');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('is-on', tabs[i] === btn);

      var pages = document.querySelectorAll('.tab-page');
      for (var j = 0; j < pages.length; j++) {
        pages[j].classList.toggle('is-active', pages[j].dataset.page === btn.dataset.tab);
      }
    });

    // sliders e switches ligados por data-setting
    var inputs = document.querySelectorAll('[data-setting]');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].addEventListener('input', function (ev) {
        var el = ev.target;
        var name = el.dataset.setting;
        var value = el.type === 'checkbox' ? el.checked : Number(el.value);
        S.set(name, value);
        syncOutputs();
      });
    }

    document.getElementById('btn-reset-settings').addEventListener('click', function () {
      confirmBox('Restaurar todas as configurações para o padrão?', function () {
        S.reset();
        syncSettingsUI();
        toast('Configurações restauradas.');
      });
    });
  }

  /** Espelha o estado salvo nos controles da tela. */
  function syncSettingsUI() {
    var cfg = S.all();
    var inputs = document.querySelectorAll('[data-setting]');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      var v = cfg[el.dataset.setting];
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v;
    }
    syncSeg('autosave', String(cfg.autosave));
    syncSeg('language', cfg.language);
    syncSeg('worldSize', newGame.worldSize);
    syncSeg('mode', newGame.mode);
    syncOutputs();
  }

  function syncOutputs() {
    var cfg = S.all();
    setOut('o-master', cfg.volumeMaster + '%');
    setOut('o-music',  cfg.volumeMusic  + '%');
    setOut('o-sfx',    cfg.volumeSfx    + '%');
    setOut('o-uiscale', cfg.uiScale + '%');
  }

  function setOut(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ---------------- botões segmentados ---------------- */

  function syncSeg(segName, value) {
    var seg = document.querySelector('.seg[data-seg="' + segName + '"]');
    if (!seg) return;
    var btns = seg.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('is-on', btns[i].dataset.value === String(value));
    }
  }

  function bindSegs() {
    var segs = document.querySelectorAll('.seg');
    for (var i = 0; i < segs.length; i++) {
      segs[i].addEventListener('click', function (ev) {
        var btn = ev.target.closest('button');
        if (!btn || btn.disabled) return;

        var segName = this.dataset.seg;
        var value = btn.dataset.value;

        var btns = this.querySelectorAll('button');
        for (var j = 0; j < btns.length; j++) btns[j].classList.toggle('is-on', btns[j] === btn);

        if (segName === 'autosave')      S.set('autosave', Number(value));
        else if (segName === 'language') S.set('language', value);
        else if (segName === 'worldSize') newGame.worldSize = value;
        else if (segName === 'mode') {
          newGame.mode = value;
          var hint = document.getElementById('mode-hint');
          if (hint) hint.textContent = MODE_HINTS[value] || '';
        }
      });
    }
  }

  /* ---------------- teclado ---------------- */

  function bindKeyboard() {
    document.addEventListener('keydown', function (ev) {
      // com o jogo na frente e nenhum painel de menu aberto, quem manda é o jogo
      if (document.body.classList.contains('jogando') && currentScreen === null) return;

      // Esc fecha modal, senão volta uma tela
      if (ev.key === 'Escape') {
        var modal = document.getElementById('modal');
        if (modal.classList.contains('is-open')) {
          modal.classList.remove('is-open');
        } else if (currentScreen !== 'main') {
          goBack();
        }
        return;
      }

      if (currentScreen !== 'main') return;

      var items = document.querySelectorAll('#main-menu .menu-item');
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        focusIndex = (focusIndex + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[focusIndex].focus();
      } else if (ev.key === 'Enter' && document.activeElement.classList.contains('menu-item')) {
        document.activeElement.click();
      }
    });
  }

  /* ---------------- init ---------------- */

  function init() {
    bindMainMenu();
    bindNewGame();
    bindLoad();
    bindSettings();
    bindSegs();
    bindKeyboard();
    syncSettingsUI();

    var hint = document.getElementById('mode-hint');
    if (hint) hint.textContent = MODE_HINTS[newGame.mode];

    showScreen('main', false);
  }

  global.FZ = global.FZ || {};
  global.FZ.Menu = {
    init: init,
    showScreen: showScreen,
    toast: toast,
    configuracoesNoJogo: configuracoesNoJogo,
    esconderTelas: esconderTelas
  };
})(window);
