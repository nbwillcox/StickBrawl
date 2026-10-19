/* Pencil-on-paper drawing: paper texture, the sketched backdrop, stick figures (posed from joint angles), props, weapons and items. All lines are steady - no wobble. */
(function (G) {
  'use strict';
  const U = G.U, C = G.C, D = U.DEG;
  const A = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); return c; };
  const FONT = '"Segoe Print","Bradley Hand","Chalkboard SE","Comic Sans MS","Marker Felt",cursive';
  A.FONT = FONT;

  /* ---------- pencil line helpers ---------- */
  /* one coloured-pencil stroke: soft wide pass, solid pass, thin dark core offset a hair for the graphite edge */
  A.pencil = function (ctx, pts, col, core, w, alpha) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const a = alpha === undefined ? 1 : alpha;
    const path = (dx, dy) => { ctx.beginPath(); ctx.moveTo(pts[0] + dx, pts[1] + dy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + dx, pts[i + 1] + dy); ctx.stroke(); };
    ctx.strokeStyle = col; ctx.globalAlpha = 0.4 * a; ctx.lineWidth = w + 1; path(0, 0);
    ctx.globalAlpha = 0.92 * a; ctx.lineWidth = w; path(0, 0);
    ctx.strokeStyle = core; ctx.globalAlpha = 0.5 * a; ctx.lineWidth = Math.max(0.5, w * 0.34); path(0.3, 0.25);
    ctx.globalAlpha = 1;
  };
  /* graphite line (backdrop and hud): grey double stroke */
  A.graphite = function (ctx, pts, w, alpha, col) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = (dx, dy) => { ctx.beginPath(); ctx.moveTo(pts[0] + dx, pts[1] + dy); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + dx, pts[i + 1] + dy); ctx.stroke(); };
    ctx.strokeStyle = col || C.INK;
    ctx.globalAlpha = 0.55 * alpha; ctx.lineWidth = w; path(0, 0);
    ctx.globalAlpha = 0.35 * alpha; ctx.lineWidth = w * 0.6; path(0.45, 0.35);
    ctx.globalAlpha = 1;
  };
  A.hatch = function (ctx, x, y, w, h, gap, angle, alpha, col) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = col || C.INK; ctx.globalAlpha = alpha; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
    const dx = Math.cos(angle), dy = Math.sin(angle), len = Math.hypot(w, h), cx = x + w / 2, cy = y + h / 2;
    const nx = -dy, ny = dx;
    ctx.beginPath();
    for (let o = -len; o <= len; o += gap) { ctx.moveTo(cx + nx * o - dx * len, cy + ny * o - dy * len); ctx.lineTo(cx + nx * o + dx * len, cy + ny * o + dy * len); }
    ctx.stroke();
    ctx.restore();
  };

  /* ---------- paper ---------- */
  A.paperTile = function (f) {
    const s = Math.round(200 * f), c = mk(s, s), x = c.getContext('2d'), r = U.rng(7);
    x.fillStyle = C.PAPER; x.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,100,60,' + (0.03 + r() * 0.05) + ')' : 'rgba(255,255,255,' + (0.05 + r() * 0.12) + ')'; const z = (0.6 + r() * 1.4) * f; x.fillRect(r() * s, r() * s, z, z); }
    x.lineWidth = 0.6 * f;
    for (let i = 0; i < 90; i++) { x.strokeStyle = 'rgba(110,90,55,' + (0.04 + r() * 0.05) + ')'; const px = r() * s, py = r() * s, a = r() * 6.28, l = (4 + r() * 10) * f; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    return c;
  };

  /* ---------- the sketched backdrop (rendered once per scale into two parallax layers) ---------- */
  const INK = '#3f3d37';
  function building(x, bx, by, w, h, r, kind) {
    /* outline */
    A.graphite(x, [bx, by + h, bx, by, bx + w, by, bx + w, by + h], 1.5, 0.95, INK);
    A.hatch(x, bx, by, w, h, 5, 0.9, 0.07);
    A.hatch(x, bx + w - 14, by, 14, h, 3, -0.9, 0.18);                       /* shaded right edge */
    A.graphite(x, [bx - 2, by, bx + w + 2, by], 2, 0.9, INK);
    /* windows */
    const cols = Math.max(2, Math.floor((w - 16) / 26)), rows = Math.max(1, Math.floor((h - 52) / 30));
    const gx = (w - 16) / cols;
    for (let ry = 0; ry < rows; ry++) {
      for (let cx = 0; cx < cols; cx++) {
        const wx = bx + 8 + cx * gx + 4, wy = by + 10 + ry * 30, ww = gx - 8, wh = 20;
        A.graphite(x, [wx, wy, wx + ww, wy, wx + ww, wy + wh, wx, wy + wh, wx, wy], 1.1, 0.85, INK);
        A.graphite(x, [wx + ww / 2, wy, wx + ww / 2, wy + wh], 0.8, 0.6, INK);
        if (r() < 0.45) A.hatch(x, wx, wy, ww, wh, 2.6, 0.7, 0.35);
        else if (r() < 0.25) A.hatch(x, wx, wy, ww / 2, wh, 2.6, -0.7, 0.3);
        A.graphite(x, [wx - 2, wy + wh + 1, wx + ww + 2, wy + wh + 1], 1.2, 0.8, INK);
      }
    }
    /* shop front on the ground floor */
    const sy = by + h - 40;
    if (kind === 'shop') {
      const dw = 26, dx = bx + 18 + r() * (w - 70);
      A.graphite(x, [dx, by + h, dx, sy + 6, dx + dw, sy + 6, dx + dw, by + h], 1.4, 0.95, INK);
      A.hatch(x, dx + 2, sy + 8, dw - 4, 32, 3, 0.8, 0.28);
      x.fillStyle = INK; x.beginPath(); x.arc(dx + dw - 5, sy + 24, 1.2, 0, 6.3); x.fill();
      const sx0 = bx + 6, sw = Math.max(40, w - dw - 40);
      A.graphite(x, [sx0, sy, sx0 + sw, sy, sx0 + sw, sy + 14, sx0, sy + 14, sx0, sy], 1.3, 0.9, INK);
      x.fillStyle = INK; x.globalAlpha = 0.8; x.font = '700 10px ' + FONT; x.textBaseline = 'middle';
      x.fillText(U.pick(['PIZZA', 'BAR', 'HOTEL', 'DINER', 'PAWN', 'VIDEO', 'NOODLES', 'LIQUOR']), sx0 + 5, sy + 8); x.globalAlpha = 1;
      for (let i = 0; i < 6; i++) A.graphite(x, [sx0 + i * (sw / 6), sy + 14, sx0 + i * (sw / 6) + sw / 12, sy + 20, sx0 + (i + 1) * (sw / 6), sy + 14], 1, 0.7, INK);
    } else {
      const dx = bx + 14 + r() * (w - 50);
      A.graphite(x, [dx, by + h, dx, sy + 4, dx + 22, sy + 4, dx + 22, by + h], 1.4, 0.95, INK);
      A.graphite(x, [dx + 11, sy + 4, dx + 11, by + h], 1, 0.7, INK);
      A.hatch(x, dx + 2, sy + 6, 7, 30, 2.6, 0.8, 0.3);
    }
  }
  function lamp(x, px, base) {
    A.graphite(x, [px, base, px, base - 72, px + 14, base - 78], 1.7, 0.95, INK);
    A.graphite(x, [px + 10, base - 79, px + 22, base - 79, px + 20, base - 74, px + 12, base - 74, px + 10, base - 79], 1.2, 0.9, INK);
    A.hatch(x, px + 11, base - 78, 10, 4, 2, 0.8, 0.5);
    A.graphite(x, [px - 4, base, px + 4, base], 2, 0.9, INK);
  }
  function hydrant(x, px, base) {
    A.graphite(x, [px - 5, base, px - 5, base - 12, px - 3, base - 16, px + 3, base - 16, px + 5, base - 12, px + 5, base], 1.4, 0.95, INK);
    A.graphite(x, [px - 8, base - 9, px + 8, base - 9], 1.4, 0.9, INK);
    A.hatch(x, px - 4, base - 15, 8, 14, 2.4, 0.8, 0.4);
  }
  function crate(x, px, base, s) {
    A.graphite(x, [px, base, px, base - s, px + s, base - s, px + s, base, px, base], 1.5, 0.95, INK);
    A.graphite(x, [px, base - s, px + s, base, px + s, base - s, px, base], 1, 0.7, INK);
    A.hatch(x, px, base - s, s, s, 3, 0.6, 0.12);
  }
  function dumpster(x, px, base) {
    A.graphite(x, [px, base, px + 2, base - 26, px + 44, base - 26, px + 46, base, px, base], 1.6, 0.95, INK);
    A.graphite(x, [px - 2, base - 26, px + 48, base - 26, px + 48, base - 30, px - 2, base - 30, px - 2, base - 26], 1.4, 0.9, INK);
    A.hatch(x, px + 2, base - 24, 42, 24, 3, 0.7, 0.3);
    A.hatch(x, px + 36, base - 24, 10, 24, 2, -0.8, 0.3);
  }
  A.buildBackdrop = function (level, f) {
    const W = level.width, H = C.H, far = mk((W * 0.5 + C.W) * f, H * f), near = mk(W * f, H * f);
    /* far skyline */
    let x = far.getContext('2d'), r = U.rng(level.seed || 3);
    x.scale(f, f);
    let px = -10;
    while (px < W * 0.5 + C.W) {
      const w = 40 + r() * 70, h = 40 + r() * 70, by = 168 - h;
      x.strokeStyle = INK;
      A.graphite(x, [px, 168, px, by, px + w, by, px + w, 168], 1.1, 0.4, INK);
      A.hatch(x, px, by, w, h, 6, 0.9 + r() * 0.3, 0.08);
      for (let wy = by + 8; wy < 150; wy += 14) for (let wx = px + 7; wx < px + w - 8; wx += 12) if (r() < 0.55) A.graphite(x, [wx, wy, wx + 5, wy, wx + 5, wy + 7, wx, wy + 7, wx, wy], 0.8, 0.28, INK);
      if (r() < 0.2) A.graphite(x, [px + w * 0.3, by, px + w * 0.3, by - 14, px + w * 0.3 + 6, by - 14], 1, 0.35, INK);
      px += w + 4 + r() * 6;
    }
    /* near layer */
    x = near.getContext('2d'); r = U.rng((level.seed || 3) + 11);
    x.scale(f, f);
    px = -20;
    const base = 168;
    while (px < W + 20) {
      const w = 130 + r() * 90, h = 100 + r() * 36;
      building(x, px, base - h, w, h, r, r() < 0.65 ? 'shop' : 'door');
      px += w;
    }
    /* sidewalk and street */
    A.graphite(x, [0, base, W, base], 2.2, 1, INK);
    A.hatch(x, 0, base, W, 22, 7, 0.5, 0.07);
    for (let sx = 0; sx < W; sx += 38 + (sx * 7) % 17) A.graphite(x, [sx, base + 2, sx - 6, base + 22], 0.9, 0.35, INK);
    A.graphite(x, [0, base + 24, W, base + 24], 1.8, 0.9, INK);
    A.graphite(x, [0, base + 28, W, base + 28], 1, 0.45, INK);
    A.hatch(x, 0, base + 24, W, 4, 2, 0.8, 0.4);
    /* road marks and grime */
    for (let sx = 20; sx < W; sx += 70) A.graphite(x, [sx, 212, sx + 34, 212], 2, 0.5, INK);
    for (let i = 0; i < W / 60; i++) {
      const cx = r() * W, cy = 190 + r() * 75, n = 3 + Math.floor(r() * 3), pts = [cx, cy];
      let ax = cx, ay = cy;
      for (let k = 0; k < n; k++) { ax += (r() - 0.35) * 16; ay += (r() - 0.5) * 7; pts.push(ax, ay); }
      A.graphite(x, pts, 0.9, 0.3, INK);
    }
    for (let i = 0; i < W / 220; i++) {
      const cx = 60 + r() * (W - 120), cy = 228 + r() * 22;
      x.save(); x.translate(cx, cy); x.scale(1, 0.32); x.strokeStyle = INK; x.globalAlpha = 0.45; x.lineWidth = 1.3; x.beginPath(); x.arc(0, 0, 13, 0, 6.3); x.stroke(); x.beginPath(); x.arc(0, 0, 8, 0, 6.3); x.stroke(); x.restore();
    }
    /* street furniture on the sidewalk */
    for (let sx = 90; sx < W - 40; sx += 150 + r() * 90) {
      const k = r();
      if (k < 0.3) lamp(x, sx, base + 18); else if (k < 0.5) hydrant(x, sx, base + 18); else if (k < 0.75) crate(x, sx, base + 18, 14 + r() * 8); else dumpster(x, sx, base + 20);
    }
    return { far, near, f };
  };

  /* ---------- stick figure ---------- */
  const TH = 10.5, SH = 10.5, UA = 7.5, FA = 7.5, TORSO = 14, HEADR = 5.4;
  function legExtent(l) { return TH * Math.cos(l[0] * D) + SH * Math.cos((l[0] - l[1]) * D); }
  function head(ctx, hx, hy, look, col, core, f) {
    ctx.fillStyle = C.PAPER; ctx.beginPath(); ctx.arc(hx, hy, HEADR, 0, 6.3); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.globalAlpha = 0.4; ctx.lineWidth = 3.1; ctx.beginPath(); ctx.arc(hx, hy, HEADR, 0, 6.3); ctx.stroke();
    ctx.globalAlpha = 0.92; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(hx, hy, HEADR, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = core; ctx.globalAlpha = 0.5; ctx.lineWidth = 0.75; ctx.beginPath(); ctx.arc(hx + 0.3, hy + 0.25, HEADR, 0, 6.3); ctx.stroke();
    ctx.globalAlpha = 1;
    const P = look.props || [];
    const has = (k) => P.indexOf(k) >= 0;
    /* face: a dot for the eye, a brow for the angry ones */
    ctx.fillStyle = C.INK;
    if (!has('mask')) { ctx.beginPath(); ctx.arc(hx + 2.5, hy - 0.4, 0.9, 0, 6.3); ctx.fill(); }
    if (look.team === 'e' && !has('mask')) { ctx.strokeStyle = C.INK; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx + 0.8, hy - 2.6); ctx.lineTo(hx + 4.2, hy - 1.5); ctx.stroke(); }
    if (has('hair')) { ctx.strokeStyle = core; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = (-150 + i * 30) * D; ctx.moveTo(hx + Math.cos(a) * 4.6, hy + Math.sin(a) * 4.6); ctx.lineTo(hx + Math.cos(a) * 8.2 - 0.8, hy + Math.sin(a) * 8.2 - 0.4); } ctx.stroke(); }
    if (has('mask')) {
      ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, HEADR + 0.2, 0, 6.3); ctx.clip();
      ctx.fillStyle = '#1d1c1a'; ctx.fillRect(hx - 7, hy - 3.2, 14, 4.6);
      ctx.fillStyle = '#fff'; ctx.fillRect(hx + 1.6, hy - 1.7, 2.6, 1.1); ctx.fillRect(hx - 2.6, hy - 1.7, 2.2, 1.1);
      ctx.restore();
    }
    if (has('band')) {
      const bc = look.bandCol || '#e8b81f';
      ctx.strokeStyle = bc; ctx.lineWidth = 2.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx - 5.2, hy - 2.6); ctx.lineTo(hx + 5.3, hy - 3.4); ctx.stroke();
      ctx.strokeStyle = C.INK; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(hx - 5.2, hy - 2.0); ctx.lineTo(hx + 5.3, hy - 2.8); ctx.stroke(); ctx.globalAlpha = 1;
      const sway = Math.sin((f.clock || 0) * 11) * 1.4 + (f.tailV || 0);
      ctx.strokeStyle = bc; ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(hx - 5, hy - 2.6); ctx.quadraticCurveTo(hx - 10, hy - 2 + sway, hx - (has('tails') ? 18 : 12), hy - 0.5 + sway * 1.6 + 1); ctx.stroke();
      if (has('tails')) { ctx.beginPath(); ctx.moveTo(hx - 5, hy - 2.4); ctx.quadraticCurveTo(hx - 11, hy - 3.6 - sway * 0.6, hx - 17, hy - 4 - sway * 1.2); ctx.stroke(); }
    }
    if (has('wrap')) {
      ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, HEADR + 0.2, 0, 6.3); ctx.clip();
      ctx.fillStyle = '#1d1c1a'; ctx.fillRect(hx - 7, hy + 1.3, 14, 6); ctx.restore();
    }
    if (has('mohawk')) {
      ctx.fillStyle = look.hawkCol || '#1d1c1a';
      for (let i = 0; i < 5; i++) { const a = (-150 + i * 30) * D, bx = hx + Math.cos(a) * 4.8, by = hy + Math.sin(a) * 4.8; ctx.beginPath(); ctx.moveTo(bx - 1.6, by + 0.8); ctx.lineTo(hx + Math.cos(a) * 10.5 - 1.2, hy + Math.sin(a) * 10.5 - 0.8); ctx.lineTo(bx + 1.6, by - 0.4); ctx.closePath(); ctx.fill(); }
    }
    if (has('hat')) {
      ctx.fillStyle = '#1d1c1a'; ctx.fillRect(hx - 4.8, hy - 14.5, 9.6, 9); ctx.fillRect(hx - 8, hy - 6, 16, 1.9);
      ctx.fillStyle = look.hatBand || '#c9a227'; ctx.fillRect(hx - 4.8, hy - 8.6, 9.6, 2);
    }
    if (has('scar')) { ctx.strokeStyle = C.INK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx + 2, hy + 0.8); ctx.lineTo(hx + 4.6, hy + 3.4); ctx.moveTo(hx + 4.4, hy + 0.9); ctx.lineTo(hx + 2.2, hy + 3.3); ctx.stroke(); }
    if (has('beard')) { ctx.strokeStyle = C.INK; ctx.lineWidth = 0.8; ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.moveTo(hx + 1 + i * 0.9, hy + 4.2); ctx.lineTo(hx + 2 + i * 1.1, hy + 7.2); } ctx.stroke(); }
    if (has('shades')) { ctx.fillStyle = '#1d1c1a'; ctx.fillRect(hx - 0.6, hy - 2.6, 6.2, 2.6); ctx.fillRect(hx - 5.4, hy - 2.2, 5, 0.9); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(hx + 0.6, hy - 2, 1.5, 0.8); }
  }

  /* weapons in a hand-space where +y is the direction the forearm points */
  function weaponShape(ctx, type, f, pose) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (type === 'bat') {
      ctx.fillStyle = '#b07a3e'; ctx.strokeStyle = '#4a2c0f'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-0.7, -5); ctx.lineTo(0.7, -5); ctx.lineTo(0.9, 9); ctx.lineTo(2.4, 17); ctx.lineTo(2.2, 27); ctx.quadraticCurveTo(0, 30, -2.2, 27); ctx.lineTo(-2.4, 17); ctx.lineTo(-0.9, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,40,10,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-1, 14); ctx.lineTo(-1.2, 25); ctx.stroke();
    } else if (type === 'knife') {
      ctx.fillStyle = '#5a3a1c'; ctx.fillRect(-1.2, -3.5, 2.4, 5);
      ctx.fillStyle = '#d6dde2'; ctx.strokeStyle = '#2b2a27'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-1.8, 1.5); ctx.lineTo(1.8, 1.5); ctx.lineTo(1.4, 10); ctx.lineTo(0, 13); ctx.lineTo(-1.8, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b2a27'; ctx.fillRect(-2.6, 0.7, 5.2, 1.1);
    } else if (type === 'nunchaku') {
      const b = (pose.wSw || 0) * D;
      ctx.strokeStyle = '#4a2c0f'; ctx.fillStyle = '#b07a3e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, 9); ctx.stroke();
      ctx.strokeStyle = '#b07a3e'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, 9); ctx.stroke();
      const jx = 0, jy = 9, cx = jx + Math.sin(b) * 5, cy = jy + Math.cos(b) * 5, ex = cx + Math.sin(b) * 11, ey = cy + Math.cos(b) * 11;
      ctx.strokeStyle = '#555'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(jx, jy); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.strokeStyle = '#4a2c0f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#b07a3e'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
    }
  }

  /* draw a figure: f = fighter (x, y, z, face, look), pose = joint angles. Origin of the drawing is the feet. */
  A.figure = function (ctx, f, camX, pose) {
    const look = f.look, S = look.scale || 1, col = look.col, core = look.core;
    let sxs = pose.sx === undefined ? 1 : pose.sx;
    if (Math.abs(sxs) < 0.1) sxs = sxs < 0 ? -0.1 : 0.1;
    const hipH = pose.hipH == null ? Math.max(legExtent(pose.lF), legExtent(pose.lB)) : pose.hipH;
    ctx.save();
    ctx.translate(Math.round((f.x - camX) * 2) / 2, f.y - f.z);
    ctx.scale(f.face * S * sxs, S);
    ctx.translate(0, -hipH);
    if (pose.rot) ctx.rotate(pose.rot * D);
    const lean = pose.lean * D, hx = 0, hy = 0;
    const tx = hx + Math.sin(lean) * TORSO, ty = hy - Math.cos(lean) * TORSO;
    const shx = hx + Math.sin(lean) * (TORSO - 1.6), shy = hy - Math.cos(lean) * (TORSO - 1.6);
    const ha = (pose.lean + (pose.head || 0)) * D, hdx = tx + Math.sin(ha) * (HEADR + 0.6), hdy = ty - Math.cos(ha) * (HEADR + 0.6);
    const arm = (a) => { const s1 = a[0] * D, s2 = (a[0] + a[1]) * D, ex = shx + Math.sin(s1) * UA, ey = shy + Math.cos(s1) * UA; return [shx, shy, ex, ey, ex + Math.sin(s2) * FA, ey + Math.cos(s2) * FA, (a[0] + a[1])]; };
    const leg = (l) => { const t1 = l[0] * D, t2 = (l[0] - l[1]) * D, kx = hx + Math.sin(t1) * TH, ky = hy + Math.cos(t1) * TH; return [hx, hy, kx, ky, kx + Math.sin(t2) * SH, ky + Math.cos(t2) * SH]; };
    const w = look.line || 2.5;
    const aB = arm(pose.aB), aF = arm(pose.aF), lB = leg(pose.lB), lF = leg(pose.lF);
    f.tailV = (f.tailV || 0) * 0.9;
    A.pencil(ctx, aB.slice(0, 6), col, core, w, 0.9);
    A.pencil(ctx, lB, col, core, w);
    A.pencil(ctx, [hx, hy, tx, ty], col, core, w + 0.5);
    if (look.props && look.props.indexOf('vest') >= 0) {
      ctx.strokeStyle = '#1d1c1a'; ctx.lineWidth = 4.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + Math.sin(lean) * 3, hy - Math.cos(lean) * 3); ctx.lineTo(hx + Math.sin(lean) * 11, hy - Math.cos(lean) * 11); ctx.stroke();
      ctx.fillStyle = '#1d1c1a'; ctx.beginPath(); ctx.moveTo(shx - 3.5, shy - 0.5); ctx.lineTo(shx - 0.5, shy - 4); ctx.lineTo(shx + 3.5, shy - 0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d9d2c0'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx + Math.sin(lean) * 4, hy - Math.cos(lean) * 4); ctx.lineTo(hx + Math.sin(lean) * 10, hy - Math.cos(lean) * 10); ctx.stroke();
    }
    if (look.props && look.props.indexOf('belt') >= 0) { ctx.strokeStyle = '#1d1c1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 2.4, hy - 1.2); ctx.lineTo(hx + 2.4, hy - 1.2); ctx.stroke(); }
    A.pencil(ctx, lF, col, core, w);
    head(ctx, hdx, hdy, look, col, core, f);
    A.pencil(ctx, aF.slice(0, 6), col, core, w);
    if (f.weapon) {
      ctx.save(); ctx.translate(aF[4], aF[5]); ctx.rotate(-((aF[6] + (pose.wRot || 0)) * D));
      weaponShape(ctx, f.weapon.type, f, pose);
      ctx.restore();
    }
    /* grabbed/grabbing hand dot and fists */
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(aF[4], aF[5], 1.45, 0, 6.3); ctx.fill();
    if (!f.weapon || true) { ctx.beginPath(); ctx.arc(aB[4], aB[5], 1.45, 0, 6.3); ctx.fill(); }
    ctx.restore();
  };

  A.shadow = function (ctx, f, camX) {
    const k = U.clamp(1 - f.z / 90, 0.35, 1), rx = 11 * (f.look.scale || 1) * k, ry = 3.1 * (f.look.scale || 1) * k, sx = f.x - camX;
    ctx.save(); ctx.translate(sx, f.y + 0.5); ctx.scale(1, ry / rx);
    ctx.globalAlpha = 0.2 * k; ctx.fillStyle = C.INK; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.3); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.3 * k; ctx.strokeStyle = C.INK; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let i = -2; i <= 2; i++) { ctx.moveTo(sx + i * rx * 0.3 - 2, f.y + ry * 0.7); ctx.lineTo(sx + i * rx * 0.3 + 2, f.y - ry * 0.7); }
    ctx.stroke(); ctx.restore();
  };

  /* ---------- floor items, thrown weapons and hud icons ---------- */
  A.weaponIcon = function (ctx, type, x, y, rotDeg, sc) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotDeg * D); ctx.scale(sc || 1, sc || 1);
    ctx.translate(0, -8);
    weaponShape(ctx, type, { t: 0 }, { wSw: 40 });
    ctx.restore();
  };
  A.food = function (ctx, type, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (type === 'chicken') {
      ctx.strokeStyle = '#4a2c0f'; ctx.fillStyle = '#d88a3a'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.ellipse(-1, -6, 7, 5, -0.5, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#efe6cf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -9); ctx.lineTo(9, -13); ctx.stroke();
      ctx.fillStyle = '#efe6cf'; ctx.beginPath(); ctx.arc(9.5, -13.6, 1.8, 0, 6.3); ctx.arc(11.3, -11.8, 1.5, 0, 6.3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-3, -8, 2.6, 3.6, 5), ctx.stroke();
    } else {
      ctx.fillStyle = '#e04a3a'; ctx.strokeStyle = '#6b1810'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(0, -5, 5, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3d2a14'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(1, -13); ctx.stroke();
      ctx.fillStyle = '#4f9a3d'; ctx.beginPath(); ctx.ellipse(3, -12, 2.6, 1.3, -0.5, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  };
  A.heart = function (ctx, x, y, s, fill, col, outline) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const path = () => { ctx.beginPath(); ctx.moveTo(0, 4.4); ctx.bezierCurveTo(-7.4, -0.8, -4.6, -6.4, 0, -2.4); ctx.bezierCurveTo(4.6, -6.4, 7.4, -0.8, 0, 4.4); ctx.closePath(); };
    ctx.fillStyle = 'rgba(40,36,30,0.12)'; path(); ctx.fill();
    if (fill > 0) { ctx.save(); path(); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(-8, -8, 16 * fill, 16); A.hatch(ctx, -8, -8, 16 * fill, 16, 1.6, 0.8, 0.28, '#4a0d09'); ctx.restore(); }
    ctx.strokeStyle = outline || C.INK; ctx.lineWidth = 1; ctx.lineJoin = 'round'; path(); ctx.stroke();
    ctx.restore();
  };

  G.art = A;
})((window.SGS = window.SGS || {}));
