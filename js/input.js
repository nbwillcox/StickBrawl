/* Keyboard, gamepad and (through the mobile kit later) touch. Move: arrows / WASD. Punch: J / Z. Kick: K / X. Jump: Space / C / L. Pause: P / Esc. */
(function (G) {
  'use strict';
  const BUF = 0.16;
  const I = { dx: 0, dy: 0, left: false, right: false, up: false, down: false, buf: { punch: 0, kick: 0, jump: 0 }, held: { punch: false, kick: false, jump: false }, _pause: false, _any: false, pad: false };
  const MAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  const ACT = { KeyJ: 'punch', KeyZ: 'punch', KeyK: 'kick', KeyX: 'kick', Space: 'jump', KeyC: 'jump', KeyL: 'jump' };
  const typing = (t) => { const n = t && t.tagName; return n === 'INPUT' || n === 'TEXTAREA' || n === 'SELECT'; };
  const refresh = () => { I.dx = (I.right ? 1 : 0) - (I.left ? 1 : 0); I.dy = (I.down ? 1 : 0) - (I.up ? 1 : 0); };

  window.addEventListener('keydown', (e) => {
    if (typing(e.target)) return;
    const m = MAP[e.code], a = ACT[e.code];
    if (m) { I[m] = true; refresh(); }
    else if (a) { if (!e.repeat) I.buf[a] = BUF; I.held[a] = true; }
    else if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) I._pause = true;
    else { if (G.debugKey && !e.repeat) G.debugKey(e); return; }
    if (e.target.tagName !== 'BUTTON') e.preventDefault();
    if (!e.repeat) I._any = true;
  });
  window.addEventListener('keyup', (e) => {
    const m = MAP[e.code], a = ACT[e.code];
    if (m) { I[m] = false; refresh(); }
    if (a) I.held[a] = false;
  });
  window.addEventListener('blur', () => { I.left = I.right = I.up = I.down = false; I.held.punch = I.held.kick = I.held.jump = false; refresh(); });

  I.tick = function (dt) { const b = I.buf; if (b.punch > 0) b.punch -= dt; if (b.kick > 0) b.kick -= dt; if (b.jump > 0) b.jump -= dt; };
  I.bind = function (canvas) { canvas.addEventListener('contextmenu', (e) => e.preventDefault()); };
  I.takePause = () => { const b = I._pause; I._pause = false; return b; };
  I.clear = () => { I.left = I.right = I.up = I.down = false; I.dx = I.dy = 0; I.buf.punch = I.buf.kick = I.buf.jump = 0; I.held.punch = I.held.kick = I.held.jump = false; I._pause = false; I._any = false; };
  I.resync = () => { I._pause = false; };

  const pads = { a: false, x: false, b: false, st: false };
  let pdx = 0, pdy = 0;
  I.poll = function () {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of list) {
      if (!p || !p.connected) continue;
      const b = p.buttons, ax = p.axes;
      let x = 0, y = 0;
      if (b[14] && b[14].pressed) x = -1; else if (b[15] && b[15].pressed) x = 1; else if (ax.length && Math.abs(ax[0]) > 0.35) x = ax[0] < 0 ? -1 : 1;
      if (b[12] && b[12].pressed) y = -1; else if (b[13] && b[13].pressed) y = 1; else if (ax.length > 1 && Math.abs(ax[1]) > 0.4) y = ax[1] < 0 ? -1 : 1;
      if (x !== pdx || y !== pdy) { I.left = x < 0; I.right = x > 0; I.up = y < 0; I.down = y > 0; pdx = x; pdy = y; refresh(); }
      const pj = !!(b[0] && b[0].pressed), pp = !!((b[2] && b[2].pressed) || (b[3] && b[3].pressed)), pk = !!(b[1] && b[1].pressed);
      if (pj && !pads.a) { I.buf.jump = BUF; I._any = true; }
      if (pp && !pads.x) { I.buf.punch = BUF; I._any = true; }
      if (pk && !pads.b) { I.buf.kick = BUF; I._any = true; }
      pads.a = pj; pads.x = pp; pads.b = pk;
      const st = !!(b[9] && b[9].pressed);
      if (st && !pads.st) I._pause = true;
      pads.st = st;
      I.pad = true;
      break;
    }
  };
  G.input = I;
})((window.SGS = window.SGS || {}));
