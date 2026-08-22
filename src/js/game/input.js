/* ============================================================
   Factoriozinho — Entrada (teclado e mouse)
   ============================================================ */

(function (global) {
  'use strict';

  var teclas = {};
  var mouse = { x: 0, y: 0, esq: false, dir: false, dentro: false, roda: 0 };
  var atalhos = {};        // code -> [fn]
  var alvo = null;
  var ativo = false;

  function init(canvasEl) {
    alvo = canvasEl;

    document.addEventListener('keydown', function (ev) {
      if (ehCampoDeTexto(ev.target)) return;
      teclas[ev.code] = true;
      var fns = atalhos[ev.code];
      if (fns && ativo) {
        ev.preventDefault();
        for (var i = 0; i < fns.length; i++) fns[i](ev);
      }
      // não deixa a página rolar com as setas/espaço
      if (ativo && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].indexOf(ev.code) >= 0) {
        ev.preventDefault();
      }
    });

    document.addEventListener('keyup', function (ev) { teclas[ev.code] = false; });

    // se a janela perder o foco, solta tudo
    global.addEventListener('blur', function () {
      teclas = {};
      mouse.esq = false;
      mouse.dir = false;
    });

    alvo.addEventListener('mousemove', function (ev) {
      var r = alvo.getBoundingClientRect();
      mouse.x = ev.clientX - r.left;
      mouse.y = ev.clientY - r.top;
      mouse.dentro = true;
    });

    alvo.addEventListener('mouseleave', function () {
      mouse.dentro = false;
      mouse.esq = false;
      mouse.dir = false;
    });

    alvo.addEventListener('mousedown', function (ev) {
      ev.preventDefault();
      if (ev.button === 0) mouse.esq = true;
      if (ev.button === 2) mouse.dir = true;
    });

    global.addEventListener('mouseup', function (ev) {
      if (ev.button === 0) mouse.esq = false;
      if (ev.button === 2) mouse.dir = false;
    });

    alvo.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

    alvo.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      mouse.roda += ev.deltaY > 0 ? 1 : -1;
      mouse.ctrl = ev.ctrlKey;
    }, { passive: false });
  }

  function ehCampoDeTexto(el) {
    if (!el) return false;
    var t = (el.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || el.isContentEditable;
  }

  /** Registra um atalho de tecla (só dispara com o jogo ativo). */
  function on(code, fn) {
    (atalhos[code] = atalhos[code] || []).push(fn);
  }

  function pressionada(code) { return !!teclas[code]; }

  /** Vetor de movimento a partir do WASD / setas. */
  function eixos() {
    var x = 0, y = 0;
    if (teclas.KeyA || teclas.ArrowLeft)  x -= 1;
    if (teclas.KeyD || teclas.ArrowRight) x += 1;
    if (teclas.KeyW || teclas.ArrowUp)    y -= 1;
    if (teclas.KeyS || teclas.ArrowDown)  y += 1;
    return { x: x, y: y };
  }

  function consumirRoda() {
    var v = mouse.roda;
    mouse.roda = 0;
    return v;
  }

  function setAtivo(v) {
    ativo = !!v;
    if (!ativo) { teclas = {}; mouse.esq = false; mouse.dir = false; }
  }

  function soltarBotoes() { mouse.esq = false; mouse.dir = false; }

  global.FZ = global.FZ || {};
  global.FZ.Input = {
    init: init,
    on: on,
    pressionada: pressionada,
    eixos: eixos,
    consumirRoda: consumirRoda,
    setAtivo: setAtivo,
    soltarBotoes: soltarBotoes,
    get mouse() { return mouse; }
  };
})(window);
