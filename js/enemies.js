/* Enemy roster and AI. Every enemy is a red stick figure with its own prop. Attack tokens keep it to two attackers at a time; the rest circle at a distance. */
(function (G) {
  'use strict';
  const U = G.U, C = G.C, F = G.fighter;
  const RED = { col: C.RED, core: C.RED_D, team: 'e' };
  const look = (o) => Object.assign({ scale: 1, line: 2.5 }, RED, o);

  const DEFS = {
    thug: { kind: 'thug', name: 'THUG', team: 'e', speed: 36, hp: 14, score: 300, reach: 25, cool: [0.9, 1.7], attacks: [['e_jab', 3], ['e_kick', 1]], grabs: 0.22, food: 0.08, weapons: 0.4, look: look({ props: ['band'], bandCol: '#e8b81f' }) },
    masked: { kind: 'masked', name: 'BANDIT', team: 'e', speed: 50, hp: 14, score: 400, reach: 25, cool: [0.6, 1.2], attacks: [['e_quick', 3], ['e_kick', 1]], grabs: 0.15, food: 0.08, weapons: 0.35, look: look({ props: ['mask'] }) },
    ninja: { kind: 'ninja', name: 'NINJA', team: 'e', speed: 58, hp: 18, score: 500, reach: 26, cool: [0.8, 1.5], attacks: [['e_kick', 2], ['e_jab', 2]], hop: 0.45, food: 0.1, weapons: 0.2, look: look({ props: ['band', 'tails', 'wrap'], bandCol: '#1d1c1a' }) },
    brute: { kind: 'brute', name: 'BIG BRUTE', team: 'e', speed: 26, hp: 90, score: 2000, reach: 38, cool: [1.0, 1.8], attacks: [['e_hook', 3], ['e_jab', 1], ['e_slam', 2]], armor: 3, noGrab: true, stunMul: 0.6, food: 1, boss: 'mini', look: look({ scale: 1.3, line: 2.9, props: ['mohawk', 'vest', 'scar'], hawkCol: '#1d1c1a' }) },
    boss: { kind: 'boss', name: 'THE CHIEF', team: 'e', speed: 34, hp: 150, score: 5000, reach: 38, cool: [0.9, 1.7], attacks: [['e_hook', 3], ['e_kick', 2], ['e_jab', 1], ['e_slam', 1]], hop: 0.35, rush: { move: 'e_charge', min: 70, max: 190 }, armor: 4, noGrab: true, stunMul: 0.5, food: 0, boss: 'big', look: look({ scale: 1.45, line: 3, props: ['hat', 'scar', 'beard', 'vest'], hatBand: '#c9a227' }) },
  };

  function weightedPick(list) {
    let tot = 0; for (const a of list) tot += a[1];
    let r = Math.random() * tot;
    for (const a of list) { r -= a[1]; if (r <= 0) return a[0]; }
    return list[0][0];
  }

  function release(e) {
    const ai = e.ai;
    if (ai.tok) { ai.tok = false; e.g.tokens.delete(e); }
    ai.attacking = false;
  }

  function create(g, kind, x, y) {
    const def = DEFS[kind], e = new F.Fighter(g, def, x, y);
    e.hp = e.maxhp = def.hp;
    e.ai = { side: Math.random() < 0.5 ? -1 : 1, tok: false, tokT: 0, cd: U.rand(0.3, 1.3), attacking: false, yoff: U.rand(-16, 16), wantsWeapon: Math.random() < (def.weapons || 0), ringR: 62 + Math.random() * 22, retarget: 0 };
    e.kind = kind;
    return e;
  }

  function reachOf(e) {
    if (e.weapon) { if (e.weapon.type === 'crate') return 110; const m = F.MOVES[F.WEAPON[e.weapon.type].emv]; return m.reach; }
    return e.def.reach;
  }

  function think(e, g, dt) {
    const I = e.intent, ai = e.ai, p = g.player;
    I.dx = I.dy = 0; I.face = 0; I.jump = false; I.punch = false; I.kick = false;
    if (e.state !== 'idle' && e.state !== 'walk') {
      if (e.state === 'hurt' || e.down || e.state === 'grabbed') release(e);
      return;
    }
    if (ai.attacking) { release(e); ai.attacking = false; }
    ai.cd -= dt;
    if (e.def.boss && !ai.enraged && e.hp > 0 && e.hp < e.maxhp * 0.5) {
      ai.enraged = true; e.speedMul = 1.3; ai.cdMul = 0.65;
      G.audio.sfx.warn(); G.fx.addShake(5); G.fx.text(e.x, e.y - 74 * (e.look.scale || 1), 'ENRAGED!', '#c62a1f', 10);
    }
    const onScreen = e.x > g.camX - 4 && e.x < g.camX + C.W + 4;
    if (!p || p.state === 'dead' || p.hp <= 0) { release(e); return; }
    const dxp = p.x - e.x, dyp = p.y - e.y, adx = Math.abs(dxp), ady = Math.abs(dyp);
    I.face = U.sign(dxp) || e.face;
    if (!ai.inited) { ai.inited = true; ai.side = U.sign(e.x - p.x) || ai.side; ai.retarget = U.rand(1, 2.2); }
    /* low on health, some run away for a few seconds */
    if (!ai.fled && !e.def.boss && e.hp <= e.maxhp * 0.3) { ai.fled = true; if (Math.random() < 0.6) ai.flee = 2.6; }
    if (ai.flee > 0) { ai.flee -= dt; release(e); I.dx = -U.sign(dxp) || 1; I.dy = 0; if (ai.flee <= 0) ai.cd = Math.max(ai.cd, 0.8); return; }
    const pDown = p.down || p.inv > 0.9 || p.state === 'dead';
    const reach = reachOf(e);

    /* going for a weapon on the floor */
    if (ai.wantsWeapon && !e.weapon && !ai.tok) {
      const it = g.nearestWeapon(e.x, e.y, 130);
      if (it) {
        const wx = it.x - e.x, wy = it.y - e.y;
        if (Math.abs(wx) < 7 && Math.abs(wy) < 5) { I.punch = true; }
        else { I.dx = Math.abs(wx) > 3 ? U.sign(wx) : 0; I.dy = Math.abs(wy) > 2 ? U.sign(wy) : 0; }
        return;
      }
    }
    /* token handling */
    if (ai.tok) { ai.tokT -= dt; if (ai.tokT <= 0 || pDown) { release(e); ai.cd = Math.max(ai.cd, 0.5); } }
    else if (!pDown && onScreen && ai.cd <= 0 && adx < 170 && g.tokenFree(e)) { ai.tok = true; ai.tokT = 3.2; g.tokens.add(e); }

    /* spread out: if two or more mates crowd my side and the other side is empty, go around */
    ai.retarget -= dt;
    if (ai.retarget <= 0 && !ai.tok) {
      ai.retarget = U.rand(1.5, 2.8);
      let same = 0, other = 0;
      for (const m of g.enemies) if (m !== e && m.hp > 0 && m.state !== 'dead') { if (U.sign(m.x - p.x) === ai.side) same++; else other++; }
      if (same >= 1 && other === 0) ai.side = -ai.side;
    }
    const side = ai.side;
    let gx, gy;
    if (ai.tok) { gx = p.x + side * reach * 0.8; gy = p.y; }
    else if (pDown) { gx = p.x + side * 90; gy = p.y + ai.yoff; }
    else { gx = p.x + side * ai.ringR; gy = p.y + ai.yoff; }
    const ddx = gx - e.x, ddy = gy - e.y;
    const tolX = ai.tok ? 3 : 8;
    I.dx = Math.abs(ddx) > tolX ? U.sign(ddx) : 0;
    I.dy = Math.abs(ddy) > 2.5 ? U.sign(ddy) : 0;
    /* a fighter that is too close and has no token backs off a little */
    if (!ai.tok && adx < ai.ringR - 14) I.dx = -U.sign(dxp) || I.dx;

    if (ai.tok && ai.cd <= 0) {
      if (e.weapon && e.weapon.type === 'knife' && ady < 7 && adx > 90 && adx < 190 && Math.random() < 0.03) { I.act = 'throwW'; ai.attacking = true; ai.cd = U.rand(e.def.cool[0], e.def.cool[1]); return; }
      if (e.def.grabs && adx <= 17 && ady < 6 && (p.state === 'idle' || p.state === 'walk') && p.z === 0 && Math.random() < e.def.grabs * 0.1) { I.act = 'grab'; ai.attacking = true; ai.cd = U.rand(e.def.cool[0], e.def.cool[1]); I.dx = I.dy = 0; return; }
      if (e.def.rush && adx > e.def.rush.min && adx < e.def.rush.max && ady < 9 && Math.random() < 0.025 + dt * 0.5) { I.act = e.def.rush.move; ai.attacking = true; ai.cd = U.rand(e.def.cool[0], e.def.cool[1]) * (ai.cdMul || 1); return; }
      if (e.def.hop && adx > 55 && adx < 140 && ady < 14 && Math.random() < 0.02 + dt * 0.6 * e.def.hop && !e.weapon) { I.act = 'hop'; ai.attacking = true; ai.cd = U.rand(e.def.cool[0], e.def.cool[1]); return; }
      if (adx <= reach && ady < 7 && U.sign(dxp) === e.face * 1 || (adx <= reach && ady < 7)) {
        if (e.weapon && Math.random() < 0.8) I.act = 'weapon';
        else I.act = weightedPick(e.def.attacks);
        ai.attacking = true;
        ai.cd = U.rand(e.def.cool[0], e.def.cool[1]) * (ai.cdMul || 1);
        I.dx = I.dy = 0;
      }
    }
  }

  G.enemies = { DEFS, create, think, release };
})((window.SGS = window.SGS || {}));
