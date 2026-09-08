/* ============================================================
   Factoriozinho — Configurações
   Guarda e aplica as preferências do jogador (localStorage).
   ============================================================ */

(function (global) {
  'use strict';

  var KEY = 'factoriozinho.settings.v1';

  var DEFAULTS = {
    // áudio
    volumeMaster: 80,
    volumeMusic: 60,
    volumeSfx: 80,
    muted: false,
    // vídeo
    fullscreen: false,
    uiScale: 100,
    showFps: false,
    showGrid: true,
    animatedBg: true,
    // jogo
    autosave: 5,          // minutos; 0 = desligado
    tooltips: true,
    floatingNumbers: true,
    language: 'pt-BR',
    ordemInventario: 'nome'      // 'nome' ou 'quantidade'
  };

  var current = clone(DEFAULTS);

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        for (var k in DEFAULTS) {
          if (Object.prototype.hasOwnProperty.call(saved, k)) current[k] = saved[k];
        }
      }
    } catch (e) {
      // localStorage bloqueado (aba privada, etc.) — segue com os padrões
    }
    return current;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch (e) { /* sem persistência disponível */ }
  }

  function get(key) { return current[key]; }
  function all() { return current; }

  function set(key, value) {
    current[key] = value;
    save();
    apply(key === 'fullscreen');
  }

  function reset() {
    current = clone(DEFAULTS);
    save();
    apply(true);
    return current;
  }

  /**
   * Aplica no documento o que é visível de imediato.
   * @param {boolean} withFullscreen só mexe em tela cheia quando veio de um
   *        clique no próprio botão — o navegador exige gesto do usuário.
   */
  function apply(withFullscreen) {
    document.documentElement.style.setProperty('--ui-scale', current.uiScale / 100);

    if (global.FZ && global.FZ.Background) {
      global.FZ.Background.setEnabled(current.animatedBg);
    }

    if (!withFullscreen) return;
    try {
      if (current.fullscreen && !document.fullscreenElement) {
        var p = document.documentElement.requestFullscreen();
        if (p && p.catch) p.catch(function () {});
      } else if (!current.fullscreen && document.fullscreenElement) {
        var q = document.exitFullscreen();
        if (q && q.catch) q.catch(function () {});
      }
    } catch (e) { /* navegador recusou */ }
  }

  // Se o jogador sair da tela cheia por fora (F11/Esc), a configuração acompanha.
  document.addEventListener('fullscreenchange', function () {
    var isFs = !!document.fullscreenElement;
    if (current.fullscreen !== isFs) {
      current.fullscreen = isFs;
      save();
      var box = document.querySelector('[data-setting="fullscreen"]');
      if (box) box.checked = isFs;
    }
  });

  global.FZ = global.FZ || {};
  global.FZ.Settings = {
    DEFAULTS: DEFAULTS,
    load: load,
    save: save,
    get: get,
    set: set,
    all: all,
    reset: reset,
    apply: apply
  };
})(window);
