/* Screen shake, hit-stop and the little pencil particles: dust scribbles, impact bursts, debris strokes, floating score text. */
(function (G) {
  'use strict';
  const U = G.U, C = G.C, S = G.settings, A = () => G.art;
  const FX = { shake: 0, hitstop: 0, parts: [], texts: [] };
  const MAX = 160;

  FX.decals = [];
  FX.reset = function () { FX.shake = 0; FX.hitstop = 0; FX.parts.length = 0; FX.texts.length = 0; FX.decals.length = 0; };
  /* wreckage left lying on the floor for a few seconds (planks, metal scraps) */
  FX.decal = function (x, y, col, n, plank) {
    for (let i = 0; i < n; i++) { if (FX.decals.length >= 36) FX.decals.shift(); FX.decals.push({ x: x + U.rand(-13, 13), y: y + U.rand(-3, 3), a: U.rand(-0.5, 0.5), l: plank ? U.rand(4, 9) : U.rand(1.5, 3.5), col, t: 0, life: 7, w: plank ? 2.2 : 1.5 }); }
  };
  FX.addShake = function (v) { if (S.shake) FX.shake = Math.min(7, Math.max(FX.shake, v)); };
  FX.freeze = function (t) { if (S.hitstop) FX.hitstop = Math.max(FX.hitstop, t); };

  FX.dust = function (x, y, n, big) {
    for (let i = 0; i < n && FX.parts.length < MAX; i++) FX.parts.push({ k: 'dust', x: x + U.rand(-5, 5), y: y + U.rand(-1, 1), z: U.rand(0, 3), vx: U.rand(-26, 26), vz: U.rand(6, 24), life: U.rand(0.25, 0.45), t: 0, r: (big ? 4.5 : 3) * U.rand(0.7, 1.2) });
  };
  /* impact burst: radiating strokes + a yellow highlighter blob */
  FX.spark = function (x, y, z, size) {
    if (FX.parts.length < MAX) FX.parts.push({ k: 'spark', x, y, z, vx: 0, vz: 0, life: 0.13 + size * 0.03, t: 0, r: 7 + size * 5, seed: Math.random() * 6.3 });
  };
  FX.debris = function (x, y, z, dir, n, col, len) {
    for (let i = 0; i < n && FX.parts.length < MAX; i++) FX.parts.push({ k: 'bit', x, y, z, vx: dir * U.rand(20, 90) + U.rand(-30, 30), vz: U.rand(30, 110), life: U.rand(0.3, 0.6), t: 0, a: U.rand(0, 6.3), va: U.rand(-14, 14), col: col || C.INK, len: len || 2.2 });
  };
  FX.text = function (x, y, str, col, size) {
    FX.texts.push({ x, y, str, col: col || C.INK, size: size || 8, t: 0, life: 0.9 });
  };

  FX.update = function (dt) {
    FX.shake = Math.max(0, FX.shake - dt * 14);
    for (let i = FX.parts.length - 1; i >= 0; i--) {
      const p = FX.parts[i];
      p.t += dt;
      if (p.t >= p.life) { FX.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      if (p.k === 'bit') { p.vz -= 420 * dt; p.z += p.vz * dt; p.a += p.va * dt; if (p.z < 0) { p.z = 0; p.vz = 0; p.vx *= 0.5; p.va = 0; } }
      else { p.z += p.vz * dt; }
    }
    for (let i = FX.decals.length - 1; i >= 0; i--) { FX.decals[i].t += dt; if (FX.decals[i].t >= FX.decals[i].life) FX.decals.splice(i, 1); }
    for (let i = FX.texts.length - 1; i >= 0; i--) {
      const t = FX.texts[i];
      t.t += dt; t.y -= dt * 14;
      if (t.t >= t.life) FX.texts.splice(i, 1);
    }
  };

  FX.drawDecals = function (ctx, camX) {
    ctx.lineCap = 'round';
    for (const d of FX.decals) {
      const left = d.life - d.t; ctx.globalAlpha = left < 1.2 ? left / 1.2 : 1; ctx.strokeStyle = d.col; ctx.lineWidth = d.w;
      const sx = d.x - camX; ctx.beginPath(); ctx.moveTo(sx - Math.cos(d.a) * d.l, d.y - Math.sin(d.a) * d.l * 0.4); ctx.lineTo(sx + Math.cos(d.a) * d.l, d.y + Math.sin(d.a) * d.l * 0.4); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  FX.draw = function (ctx, camX) {
    const art = A();
    for (const p of FX.parts) {
      const u = p.t / p.life, sx = p.x - camX, sy = p.y - p.z;
      if (p.k === 'dust') {
        ctx.strokeStyle = C.INK; ctx.globalAlpha = 0.45 * (1 - u); ctx.lineWidth = 0.9;
        const r = p.r * (0.6 + u);
        ctx.beginPath(); ctx.arc(sx, sy, r, 0.4, 5.4); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx + 0.6, sy + 0.3, r * 0.6, 1, 5); ctx.stroke();
      } else if (p.k === 'spark') {
        const r = p.r * (0.55 + u * 0.7);
        ctx.globalAlpha = 0.65 * (1 - u); ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(sx, sy, r * 0.72, 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1 - u * 0.5; ctx.strokeStyle = C.INK; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i < 9; i++) { const a = p.seed + i * (6.283 / 9), r0 = r * (0.45 + (i % 2) * 0.15), r1 = r * (1.05 + (i % 3) * 0.25); ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0); ctx.lineTo(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1); }
        ctx.stroke();
      } else if (p.k === 'bit') {
        ctx.globalAlpha = 1 - u * u; ctx.strokeStyle = p.col; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath();
        const L = p.len || 2.2; ctx.lineWidth = L > 3 ? 2 : 1.4;
        ctx.moveTo(sx - Math.cos(p.a) * L, sy - Math.sin(p.a) * L); ctx.lineTo(sx + Math.cos(p.a) * L, sy + Math.sin(p.a) * L); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    for (const t of FX.texts) {
      const u = t.t / t.life;
      ctx.globalAlpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
      ctx.font = '800 ' + t.size + 'px ' + art.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(241,233,212,0.9)'; ctx.strokeText(t.str, t.x - camX, t.y);
      ctx.fillStyle = t.col; ctx.fillText(t.str, t.x - camX, t.y);
    }
    ctx.globalAlpha = 1;
  };

  G.fx = FX;
})((window.SGS = window.SGS || {}));
