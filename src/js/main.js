/* ============================================================
   Factoriozinho — ponto de entrada
   ============================================================ */

(function (global) {
  'use strict';

  var VERSION = '0.8.0';
  var PHASE = 'Fase 2 — Curvas e faixas ajustadas';

  function boot() {
    global.FZ.Settings.load();
    global.FZ.Background.start();
    global.FZ.Settings.apply();
    global.FZ.Menu.init();

    // procura os PNGs em assets/. O que faltar continua com desenho provisório.
    global.FZ.Sprites.init(function () {
      var s = global.FZ.Sprites;
      var n = 0;
      s.LISTA.forEach(function (k) { if (s.get(k)) n++; });
      console.log('%cSprites: ' + n + '/' + s.LISTA.length + ' carregados',
        'color:#6fc26b', '— use FZ.Sprites.status() para ver a lista');
    });

    var label = document.getElementById('version-label');
    if (label) label.textContent = 'v' + VERSION + ' — ' + PHASE;

    console.log('%cFactoriozinho v' + VERSION,
      'color:#ff9b2b;font-weight:bold;font-size:14px', '·', PHASE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.FZ = global.FZ || {};
  global.FZ.VERSION = VERSION;
})(window);
