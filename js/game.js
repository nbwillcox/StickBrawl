/* The world: player, enemies, items, thrown weapons, waves, camera, scoring, lives and the draw order. */
(function (G) {
  'use strict';
  const U = G.U, C = G.C, A = G.audio, FX = G.fx, I = G.input, F = G.fighter, E = G.enemies, ART = G.art;
  const MOVES = F.MOVES;
  const Game = {
    mode: 'title', score: 0, lives: C.START_LIVES, camX: 0, level: null, onOver: null, stage: 0,
    enemies: [], items: [], projs: [], tokens: new Set(), queue: [], player: null, dbg: [],
  };
  G.game = Game;

  Game.levelDef = function () { return G.debug.lab ? G.level.lab : G.level.list[Game.stage]; };

  Game.reset = function (demo) {
    Game.level = Game.levelDef();
    Game.demo = !!demo;
    Game.score = 0; Game.lives = C.START_LIVES; Game.nextLife = 0; Game.timeLeft = C.STAGE_TIME;
    Game.loadLevel();
  };
  Game.loadLevel = function () {
    const lv = Game.level;
    Game.camX = 0; Game.camMax = 0; Game.waveIdx = 0; Game.waveActive = false; Game.queue = []; Game.waveItems = 0;
    Game.enemies = []; Game.props = []; Game.items = []; Game.projs = []; Game.tokens = new Set(); Game.goT = 0; Game.goBeep = 0;
    Game.introT = 0; Game.bossT = 0; Game.clearT = 0; Game.cleared = false; Game.respawnT = 0; Game.timeLeft = C.STAGE_TIME; Game.bossBar = null; Game.lastHitE = null; Game.lastHitT = 0;
    FX.reset();
    const p = new F.Fighter(Game, F.PLAYER, lv.start.x, lv.start.y);
    p.hp = p.maxhp = C.PLAYER_HP;
    Game.player = p;
    Game.mode = 'play';
    if (G.debug.wave && !G.debug.lab) {
      Game.waveIdx = Math.min(G.debug.wave, lv.waves.length - 1);
      const w = lv.waves[Game.waveIdx];
      Game.camX = Game.camMax = w.at; p.x = w.at + 70;
    }
  };

  /* ---------- scoring ---------- */
  Game.score = 0;
  Game.addScore = function (n) {
    Game.score += n;
    const th = Game.nextLife < C.EXTRA_LIFE.length ? C.EXTRA_LIFE[Game.nextLife] : C.EXTRA_LIFE[C.EXTRA_LIFE.length - 1] + (Game.nextLife - C.EXTRA_LIFE.length + 1) * 50000;
    if (Game.score >= th) { Game.nextLife++; Game.lives++; A.sfx.extra(); FX.text(Game.camX + C.W / 2, 60, '1UP!', '#2a8a3a', 11); }
  };
  /* only the player's actions score */
  Game.scoreFor = function (att, n) { if (att && att.team === 'p') Game.addScore(n); };

  /* ---------- tokens ---------- */
  Game.tokenFree = function () { return Game.tokens.size < 2; };

  /* ---------- items ---------- */
  Game.dropItem = function (w, x, y, z, dir) {
    Game.items.push({ kind: 'weapon', type: w.type, uses: w.uses, x, y, z, vz: 70, vx: (dir || 1) * 34, rot: U.rand(-60, 60), taken: false, t: 0 });
  };
  Game.props = [];
  Game.addItem = function (type, x, y, drop) {
    if (type === 'drum') { Game.props.push({ kind: 'drum', x, y, hp: 4, flash: 0, drop: drop || null, id: Math.random() }); return; }
    if (type === 'apple' || type === 'chicken') Game.items.push({ kind: 'food', type, x, y, z: 0, vz: 0, vx: 0, t: 0 });
    else Game.items.push({ kind: 'weapon', type, uses: F.WEAPON[type].uses, x, y, z: 120, vz: 0, vx: 0, rot: U.rand(-70, 70), taken: false, t: 0 });
  };
  Game.nearWeapon = function (f) {
    for (const it of Game.items) if (it.kind === 'weapon' && !it.taken && it.z < 4 && Math.abs(it.x - f.x) < 17 && Math.abs(it.y - f.y) < 9) return it;
    return null;
  };
  Game.nearestWeapon = function (x, y, r) {
    let best = null, bd = r * r;
    for (const it of Game.items) { if (it.kind !== 'weapon' || it.taken || it.z > 4) continue; const dd = (it.x - x) * (it.x - x) + (it.y - y) * (it.y - y); if (dd < bd) { bd = dd; best = it; } }
    return best;
  };
  Game.takeWeapon = function (f, it) {
    f.weapon = { type: it.type, uses: it.uses };
    const i = Game.items.indexOf(it); if (i >= 0) Game.items.splice(i, 1);
  };
  Game.throwWeapon = function (f) {
    const w = f.weapon; f.weapon = null;
    const knife = w.type === 'knife';
    const crate = w.type === 'crate';
    Game.projs.push({ type: w.type, uses: w.uses, x: f.x + f.face * 10, y: f.y, z: f.z + (crate ? 36 : 24), vx: f.face * (knife ? 270 : crate ? 190 : 210), vz: knife ? 5 : crate ? 20 : 40, rot: crate ? 0 : f.face > 0 ? 0 : 180, team: f.team, owner: f, dmg: knife ? 6 : crate ? 6 : w.type === 'bat' ? 5 : 3, spin: !knife && !crate, hit: false });
    A.sfx.throw();
  };

  /* ---------- hit resolution ---------- */
  Game.fighters = function () { const a = Game.enemies.slice(); if (Game.player) a.push(Game.player); return a; };
  function canBeHit(v) { return v.hp > 0 && v.inv <= 0 && !v.down && v.state !== 'dead'; }

  Game.hitCheck = function (att, mv) {
    if (mv.both === undefined && !mv.reach) return;
    const list = att.team === 'p' ? Game.enemies : [Game.player];
    for (const v of list) {
      if (!v || !canBeHit(v) || att.hitSet.has(v)) continue;
      const dx = v.x - att.x, fwd = dx * att.face;
      const front = mv.both ? Math.abs(dx) < mv.reach + 6 : (fwd > -7 && fwd < mv.reach + 6);
      if (!front || Math.abs(v.y - att.y) > 11 || Math.abs(v.z - att.z) > (att.z > 4 ? 40 : 26)) continue;
      att.hitSet.add(v);
      v.takeHit(att, mv, Game);
    }
    if (att.team === 'p') {
      for (const pr of Game.props) {
        if (pr.hp <= 0 || att.hitSet.has(pr)) continue;
        const dx = pr.x - att.x, fwd = dx * att.face;
        const front = mv.both ? Math.abs(dx) < mv.reach + 8 : (fwd > -8 && fwd < mv.reach + 8);
        if (!front || Math.abs(pr.y - att.y) > 12 || att.z > 22) continue;
        att.hitSet.add(pr); att.connected = true; hurtProp(pr, mv.dmg >= 4 ? 2 : 1, att.face);
      }
    }
    if (G.debug.boxes) Game.dbg.push({ x0: att.face > 0 ? att.x - 7 : att.x - mv.reach - 6, x1: att.face > 0 ? att.x + mv.reach + 6 : att.x + 7, y: att.y, z: att.z, t: 0.08 });
  };
  function hurtProp(pr, n, dir) {
    pr.hp -= n; pr.flash = 0.12;
    FX.spark(pr.x, pr.y + 0.5, 12, 0.8); FX.debris(pr.x, pr.y, 14, dir || 1, 3, '#4a5a66'); A.sfx.punch(); FX.freeze(0.04); FX.addShake(1.5);
    if (pr.hp <= 0) {
      FX.debris(pr.x, pr.y, 10, 1, 8, '#4a5a66'); FX.debris(pr.x, pr.y, 10, -1, 8, '#4a5a66'); FX.dust(pr.x, pr.y, 6, true); A.sfx.snap(); FX.addShake(3);
      if (pr.drop) {
        if (pr.drop === 'apple' || pr.drop === 'chicken') Game.items.push({ kind: 'food', type: pr.drop, x: pr.x, y: pr.y, z: 24, vz: 60, vx: 0, t: 0 });
        else Game.items.push({ kind: 'weapon', type: pr.drop, uses: F.WEAPON[pr.drop].uses, x: pr.x, y: pr.y, z: 24, vz: 60, vx: 0, rot: U.rand(-40, 40), taken: false, t: 0 });
      }
    }
  }
  Game.onHit = function (att, v, mv, dmg, heavy, over) {
    const dirAway = U.sign(v.x - att.x) || att.face;
    const hx = v.x - dirAway * 3, hz = v.z + (v.state === 'lie' ? 6 : 26);
    FX.spark(hx, v.y + 0.5, hz, heavy ? 1.6 : 0.8);
    if (heavy) FX.debris(hx, v.y, hz, dirAway, 4, C.INK);
    const snd = (over && over.snd) || mv.snd;
    if (snd && A.sfx[snd]) A.sfx[snd]();
    FX.freeze((mv.hs || 0.04) * (att.team === 'p' ? 0.8 : 1)); FX.addShake(mv.sh || 1);
    att.connected = true;
    if (att.team === 'p') { Game.addScore(dmg * 10); Game.lastHitE = v; Game.lastHitT = 3; }
    else if (v.team === 'p') { Game.hudHurt = 0.4; }
    if (att.weapon && mv.wep) {
      att.weapon.uses--;
      if (att.weapon.uses <= 0) { FX.debris(att.x + att.face * 20, att.y, att.z + 18, att.face, 7, '#8a5a2b'); A.sfx.snap(); att.weapon = null; }
    }
    if (v.hp <= 0 && !v.killed) {
      v.killed = true;
      A.sfx.kill();
      if (v.team === 'e') {
        const owner = att.thrownBy || att;
        if (owner.team === 'p' || att.team === 'p') { Game.addScore(v.def.score); FX.text(v.x, v.y - 50, '+' + v.def.score, '#8a1c14', 9); }
        E.release(v);
        if (v.def.food && Math.random() < v.def.food) Game.items.push({ kind: 'food', type: v.def.kind === 'brute' ? 'chicken' : 'apple', x: v.x + dirAway * 12, y: v.y, z: 40, vz: 40, vx: dirAway * 20, t: 0 });
        if (v.def.boss) { FX.freeze(0.28); FX.addShake(8); FX.text(v.x, v.y - 70, 'K.O.!', '#c62a1f', 14); }
      }
    }
  };
  Game.noteKnock = function () { };
  Game.thrownHit = function (f) {
    const by = f.thrownBy;
    for (const o of Game.fighters()) {
      if (o === f || o.team !== f.team || !canBeHit(o) || f.hitSet.has(o)) continue;
      if (Math.abs(o.x - f.x) < 14 && Math.abs(o.y - f.y) < 10 && Math.abs(o.z - f.z) < 32) {
        f.hitSet.add(o);
        o.takeHit(by, { dmg: 4, kd: true, kdv: 90, hs: 0.07, sh: 3, snd: 'punchH' }, Game);
      }
    }
  };
  Game.clampFighter = function (f) {
    f.y = U.clamp(f.y, C.YMIN, C.YMAX);
    const lv = Game.level;
    if (f.team === 'p') f.x = U.clamp(f.x, Game.camX + 9, Game.camX + C.W - 9);
    else {
      if (!f.entered && f.x > Game.camX + 12 && f.x < Game.camX + C.W - 12) f.entered = true;
      if (f.entered) f.x = U.clamp(f.x, Game.camX + 6, Game.camX + C.W - 6);
    }
    f.x = U.clamp(f.x, -20, lv.width + 20);
  };

  /* ---------- waves ---------- */
  function startWave(w) {
    Game.waveActive = true; Game.goT = 0;
    Game.queue = (w.enemies || []).map((s) => ({ k: s.k, side: s.side, t: s.d }));
    for (const it of (w.items || [])) Game.addItem(it.t, it.x, it.y, it.drop);
    if (w.mini || w.boss) { A.sfx.warn(); Game.bossT = 0; }
    if (w.boss) { A.music('boss'); Game.bossT = 0; }
    Game.curWave = w;
  }
  function spawnEnemy(s) {
    const x = s.side === 'l' ? Game.camX - 22 : Game.camX + C.W + 22, y = U.rand(C.YMIN + 8, C.YMAX - 6);
    const e = E.create(Game, s.k, x, y);
    e.face = s.side === 'l' ? 1 : -1;
    Game.enemies.push(e);
    if (e.def.boss) Game.bossBar = e;
  }
  function waveLogic(dt) {
    const lv = Game.level, w = lv.waves[Game.waveIdx];
    const maxCam = lv.width - C.W;
    if (!Game.waveActive) {
      Game.camMax = w ? Math.min(maxCam, w.at) : maxCam;
      if (w && Game.camX >= w.at - 0.5) startWave(w);
    } else {
      Game.camMax = Game.camX;
      /* feed the queue: at most three alive at once */
      const alive = Game.enemies.filter((e) => e.state !== 'dead' && e.hp > 0).length;
      let slots = 3 - alive;
      for (const q of Game.queue) q.t -= dt;
      for (let i = 0; i < Game.queue.length && slots > 0; i++) {
        if (Game.queue[i].t <= 0) { spawnEnemy(Game.queue[i]); Game.queue.splice(i, 1); i--; slots--; }
      }
      const left = Game.enemies.some((e) => e.state !== 'dead' && e.hp > 0) || Game.queue.length;
      if (!left) {
        Game.waveActive = false; Game.waveIdx++; Game.tokens.clear();
        if (Game.curWave && Game.curWave.boss) { Game.stageClear(); }
        else { Game.goT = 0.01; if (Game.level.music) A.music(Game.level.music); }
      }
    }
  }

  Game.stageClear = function () {
    if (Game.cleared) return;
    Game.cleared = true; Game.clearT = 0; Game.mode = 'clear';
    A.jingle('clear');
    Game.timeBonus = Math.floor(Game.timeLeft) * 10; Game.lifeBonus = Game.player.hp * 50;
  };

  /* ---------- update ---------- */
  Game.update = function (dt) {
    const p = Game.player;
    for (let i = Game.dbg.length - 1; i >= 0; i--) { Game.dbg[i].t -= dt; if (Game.dbg[i].t <= 0) Game.dbg.splice(i, 1); }
    if (FX.hitstop > 0) { FX.hitstop -= dt; return; }
    I.tick(dt);
    FX.update(dt);
    Game.introT += dt; Game.bossT += dt;
    if (Game.hudHurt > 0) Game.hudHurt -= dt;
    if (Game.lastHitT > 0) Game.lastHitT -= dt;

    if (Game.mode === 'clear') {
      Game.clearT += dt;
      /* the tally ticks into the score, then the run ends */
      if (Game.clearT > 1.6 && Game.timeBonus > 0) { const n = Math.min(Game.timeBonus, 400); Game.timeBonus -= n; Game.addScore(n); if (Math.floor(Game.clearT * 20) % 2 === 0) A.sfx.tick(); }
      else if (Game.clearT > 1.6 && Game.lifeBonus > 0) { const n = Math.min(Game.lifeBonus, 200); Game.lifeBonus -= n; Game.addScore(n); }
      if (Game.clearT > 6 && Game.onOver) { const cb = Game.onOver; Game.onOver = null; cb(true); }
      p.intent.dx = p.intent.dy = 0; p.intent.punch = p.intent.kick = p.intent.jump = false;
      p.update(dt, Game);
      for (const e of Game.enemies) e.update(dt, Game);
      return;
    }

    /* player input -> intent */
    const it = p.intent;
    if (Game.mode === 'play' && p.state !== 'dead') {
      it.dx = I.dx; it.dy = I.dy; it.jump = I.buf.jump > 0; it.punch = I.buf.punch > 0; it.kick = I.buf.kick > 0;
      it.use = (k) => { it[k] = false; I.buf[k] = 0; };
    } else { it.dx = it.dy = 0; it.jump = it.punch = it.kick = false; }

    p.update(dt, Game);
    for (const e of Game.enemies) { E.think(e, Game, dt); e.update(dt, Game); }
    for (let i = Game.enemies.length - 1; i >= 0; i--) { const e = Game.enemies[i]; if (e.state === 'dead' && e.deadT > 0.9) { if (Game.bossBar === e) Game.bossBar = null; E.release(e); Game.enemies.splice(i, 1); } }
    separate(dt);
    updateItems(dt);
    updateProjs(dt);

    /* the clock and the player's life */
    if (p.state !== 'dead') {
      Game.timeLeft -= dt;
      if (Game.timeLeft <= 0) { Game.timeLeft = 0; if (p.hp > 0) { p.hp = 0; p.dying = true; p.knock(-p.face, 60, null); } }
    }
    if (p.state === 'dead' && Game.mode === 'play') {
      Game.respawnT += dt;
      if (Game.respawnT > 1.2) {
        Game.lives--;
        if (Game.lives <= 0) { Game.lives = 0; Game.mode = 'over'; A.jingle('over'); if (Game.onOver) { const cb = Game.onOver; Game.onOver = null; setTimeout(() => cb(false), 1400); } }
        else respawn();
      }
    }
    camera(dt);
    waveLogic(dt);
    /* GO cue */
    if (Game.goT > 0) {
      Game.goT += dt; Game.goBeep -= dt;
      if (Game.goBeep <= 0) { Game.goBeep = 1.4; A.sfx.go(); }
      if (Game.camX >= Game.camMax - 1 && !Game.waveActive && Game.level.waves[Game.waveIdx] && Game.camX >= Game.level.waves[Game.waveIdx].at - 1) Game.goT = 0;
    }
  };

  function respawn() {
    const p = Game.player;
    p.hp = p.maxhp; p.dying = false; p.killed = false; p.weapon = null;
    p.x = Game.camX + 50; p.y = 214; p.z = 0; p.vx = p.vy = p.vz = 0; p.face = 1;
    p.to('idle'); p.inv = 2.2; Game.respawnT = 0;
    Game.tokens.clear();
    for (const e of Game.enemies) { e.ai && (e.ai.tok = false); }
  }
  function camera(dt) {
    const p = Game.player, target = p.x - 200;
    if (target > Game.camX) Game.camX += Math.min(target - Game.camX, Math.max(60, (target - Game.camX) * 6) * dt);
    Game.camX = Math.min(Game.camX, Game.camMax);
    Game.camX = U.clamp(Game.camX, 0, Game.level.width - C.W);
  }
  function separate(dt) {
    const all = Game.fighters().filter((f) => !f.down && f.state !== 'grabbed' && f.state !== 'grab' && f.z < 6);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 5) {
        const px = (dx === 0 ? (a.id % 2 ? 1 : -1) : U.sign(dx)) * 28 * dt, py = (dy === 0 ? 1 : U.sign(dy)) * 14 * dt;
        a.x -= px; b.x += px; a.y -= py; b.y += py;
      }
    }
  }
  function updateItems(dt) {
    const p = Game.player;
    for (const pr of Game.props) if (pr.flash > 0) pr.flash -= dt;
    for (let i = Game.items.length - 1; i >= 0; i--) {
      const it = Game.items[i];
      it.t += dt;
      if (it.z > 0 || it.vz > 0) { it.vz -= C.GRAV * dt; it.z += it.vz * dt; it.x += it.vx * dt; if (it.z <= 0) { it.z = 0; if (it.vz < -80) { it.vz *= -0.3; } else { it.vz = 0; it.vx = 0; } } }
      it.y = U.clamp(it.y, C.YMIN, C.YMAX);
      if (it.kind === 'food' && p.state !== 'dead' && it.z < 8 && Math.abs(it.x - p.x) < 14 && Math.abs(it.y - p.y) < 9 && p.hp > 0) {
        const heal = it.type === 'chicken' ? 12 : 6;
        p.hp = Math.min(p.maxhp, p.hp + heal); A.sfx.food(); FX.text(it.x, it.y - 30, it.type === 'chicken' ? 'YUM! +3' : '+1', '#2a8a3a', 8);
        Game.items.splice(i, 1);
      }
    }
  }
  function updateProjs(dt) {
    for (let i = Game.projs.length - 1; i >= 0; i--) {
      const q = Game.projs[i];
      q.x += q.vx * dt; q.z += q.vz * dt; q.vz -= 260 * dt;
      if (q.spin) q.rot += (q.vx > 0 ? 1 : -1) * 900 * dt;
      let done = false;
      const targets = q.team === 'p' ? Game.enemies : [Game.player];
      for (const v of targets) {
        if (!v || !canBeHit(v)) continue;
        if (Math.abs(v.x - q.x) < 10 && Math.abs(v.y - q.y) < 10 && q.z > v.z - 4 && q.z < v.z + 44) {
          const mv = { dmg: q.dmg, kd: q.type !== 'nunchaku', kdv: 90, stun: 0.35, hs: 0.06, sh: 2.5, snd: q.type === 'knife' ? 'stab' : 'punchH' };
          v.takeHit(q.owner, mv, Game);
          q.uses = Math.max(1, q.uses - 1);
          if (q.type === 'crate') { FX.debris(q.x, q.y, q.z, U.sign(q.vx), 9, '#8a5a2b'); A.sfx.snap(); }
          else Game.items.push({ kind: 'weapon', type: q.type, uses: q.uses, x: v.x, y: v.y, z: v.z + 20, vz: 50, vx: -U.sign(q.vx) * 20, rot: q.rot, taken: false, t: 0 });
          done = true; break;
        }
      }
      if (!done && q.team === 'p') {
        for (const pr of Game.props) if (pr.hp > 0 && Math.abs(pr.x - q.x) < 11 && Math.abs(pr.y - q.y) < 10 && q.z < 26) { hurtProp(pr, q.dmg >= 5 ? 3 : 2, U.sign(q.vx)); if (q.type === 'crate') { FX.debris(q.x, q.y, q.z, U.sign(q.vx), 9, '#8a5a2b'); A.sfx.snap(); } else Game.items.push({ kind: 'weapon', type: q.type, uses: q.uses, x: q.x, y: q.y, z: 14, vz: 40, vx: -U.sign(q.vx) * 20, rot: q.rot, taken: false, t: 0 }); done = true; break; }
      }
      if (!done && (q.z <= 0 || q.x < Game.camX - 40 || q.x > Game.camX + C.W + 40)) {
        if (q.type === 'crate') { if (q.z <= 0) { FX.debris(q.x, q.y, 4, 1, 8, '#8a5a2b'); A.sfx.snap(); } }
        else if (q.z <= 0) Game.items.push({ kind: 'weapon', type: q.type, uses: q.uses, x: q.x, y: q.y, z: 0, vz: 0, vx: 0, rot: q.rot % 360, taken: false, t: 0 });
        done = true; FX.dust(q.x, q.y, 2);
      }
      if (done) Game.projs.splice(i, 1);
    }
  }

  /* ---------- drawing ---------- */
  Game.backdrop = null;
  Game.ensureBackdrop = function (f) {
    if (Game.backdrop && Game.backdrop.f === f && Game.backdrop.lv === Game.level) return;
    const b = ART.buildBackdrop(Game.level, f); b.lv = Game.level; Game.backdrop = b;
  };

  Game.render = function (ctx) {
    const cam = Game.camX, f = Game.backdrop ? Game.backdrop.f : 1;
    if (Game.backdrop) {
      const b = Game.backdrop, farX = cam * 0.45;
      ctx.drawImage(b.far, farX * f, 0, C.W * f, C.H * f, 0, 0, C.W, C.H);
      ctx.drawImage(b.near, cam * f, 0, C.W * f, C.H * f, 0, 0, C.W, C.H);
    }
    /* depth-sorted drawables */
    const list = [];
    for (const it of Game.items) list.push({ y: it.y, it });
    for (const pr of Game.props) if (pr.hp > 0) list.push({ y: pr.y, pr });
    for (const e of Game.enemies) list.push({ y: e.y, f: e });
    if (Game.player) list.push({ y: Game.player.y + 0.01, f: Game.player });
    for (const q of Game.projs) list.push({ y: q.y + 2, q });
    list.sort((a, b) => a.y - b.y);
    /* shadows first so nothing is covered by another character's shadow */
    for (const d of list) if (d.f && d.f.state !== 'dead') ART.shadow(ctx, d.f, cam);
    for (const it of Game.items) if (it.kind === 'weapon' && it.z < 2) { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = C.INK; ctx.beginPath(); ctx.ellipse(it.x - cam, it.y + 0.5, 9, 2.2, 0, 0, 6.3); ctx.fill(); ctx.restore(); }
    for (const d of list) {
      if (d.pr) { ART.drum(ctx, d.pr.x - cam, d.pr.y, d.pr.flash); }
      else if (d.it) drawItem(ctx, d.it, cam);
      else if (d.q) { const q = d.q; if (q.type === 'crate') ART.crate(ctx, q.x - cam, q.y - q.z + 7, q.rot); else ART.weaponIcon(ctx, q.type, q.x - cam, q.y - q.z + 8, q.rot, 1); }
      else drawFighter(ctx, d.f, cam);
    }
    FX.draw(ctx, cam);
    if (G.debug.boxes) {
      ctx.strokeStyle = '#d00'; ctx.lineWidth = 0.8;
      for (const d of Game.dbg) ctx.strokeRect(d.x0 - cam, d.y - 11 - d.z - 20, d.x1 - d.x0, 22 + 40);
    }
  };
  function drawItem(ctx, it, cam) {
    const sx = it.x - cam, sy = it.y - it.z;
    if (it.kind === 'food') { const bob = Math.sin(it.t * 4) * 1.2; ART.food(ctx, it.type, sx, sy + bob); return; }
    if (it.type === 'crate') ART.crate(ctx, sx, sy, it.z < 1 ? 0 : it.t * 300); else
    ART.weaponIcon(ctx, it.type, sx, sy + 2, it.z < 1 ? 78 + (it.rot || 0) * 0.3 : (it.rot || 0) + it.t * 400, 1);
    if (it.z < 1 && !it.taken) {
      const a = 0.5 + 0.5 * Math.sin(it.t * 5);
      ctx.save(); ctx.globalAlpha = 0.4 + a * 0.4; ctx.strokeStyle = '#e8b81f'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sx, sy - 3, 9 + a * 1.5, 0.3, 2.8); ctx.stroke(); ctx.beginPath(); ctx.arc(sx, sy - 3, 9 + a * 1.5, 3.5, 6); ctx.stroke(); ctx.restore();
    }
  }
  function drawFighter(ctx, f, cam) {
    let alpha = 1;
    if (f.state === 'dead') { const u = f.deadT / 0.9; alpha = Math.floor(f.deadT * 14) % 2 ? 0.2 : 1 - u * 0.6; }
    else if (f.inv > 0 && f.team === 'p' && f.state !== 'getup') alpha = Math.floor(f.clock * 18) % 2 ? 0.35 : 1;
    ctx.globalAlpha = alpha;
    const pose = f.pose();
    if (f.flash > 0 && Math.floor(f.flash * 80) % 2 === 0) {
      const save = f.look; f.look = Object.assign({}, save, { col: '#1d1c1a', core: '#000' });
      ART.figure(ctx, f, cam, pose); f.look = save;
    } else ART.figure(ctx, f, cam, pose);
    ctx.globalAlpha = 1;
    /* telegraph: a small exclamation mark above a winding-up enemy */
    if (f.team === 'e' && f.state === 'atk' && f.move && f.t < f.move.s && f.move.s > 0.2 && f.t > 0.04) {
      const sx = f.x - cam, sy = f.y - 52 * (f.look.scale || 1);
      ctx.fillStyle = '#c62a1f'; ctx.font = '900 11px ' + ART.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', sx, sy);
    }
  }

  /* ---------- debug helpers (?debug=1) ---------- */
  G.debugKey = function (e) {
    if (!G.debug.on || Game.mode !== 'play') return;
    const p = Game.player, map = { Digit1: 'thug', Digit2: 'masked', Digit3: 'ninja', Digit4: 'brute', Digit5: 'boss' };
    if (map[e.code]) { spawnEnemy({ k: map[e.code], side: 'r' }); }
    else if (e.code === 'Digit6') Game.addItem('bat', p.x + 40, p.y);
    else if (e.code === 'Digit7') Game.addItem('knife', p.x + 40, p.y);
    else if (e.code === 'Digit8') Game.addItem('nunchaku', p.x + 40, p.y);
    else if (e.code === 'Digit9') Game.addItem('chicken', p.x + 40, p.y);
    else if (e.code === 'Digit0') Game.addItem('crate', p.x + 40, p.y);
    else if (e.code === 'KeyG') Game.addItem('drum', p.x + 40, p.y, 'knife');
    else if (e.code === 'KeyH') p.hp = p.maxhp;
    else if (e.code === 'KeyE') { for (const q of Game.enemies) { q.hp = 0; q.dying = true; q.knock(1, 60, p); } }
  };
})((window.SGS = window.SGS || {}));
