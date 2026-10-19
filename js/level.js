/* Level scripts. A wave triggers when the camera reaches `at`; the camera is locked there until every enemy of the wave is down. */
(function (G) {
  'use strict';
  const L = {};
  const e = (k, side, d) => ({ k, side: side || 'r', d: d || 0 });
  L.list = [
    {
      name: 'THE STREETS', sub: 'LEVEL 1', width: 2240, seed: 5, music: 'street', start: { x: 70, y: 214 },
      waves: [
        { at: 0, enemies: [e('thug', 'r', 0.2), e('thug', 'r', 1.2)] },
        { at: 340, items: [{ t: 'bat', x: 560, y: 224 }], enemies: [e('thug', 'r', 0), e('masked', 'l', 0.6), e('thug', 'r', 2.5)] },
        { at: 760, items: [{ t: 'knife', x: 960, y: 212 }, { t: 'knife', x: 1090, y: 238 }], enemies: [e('masked', 'r', 0), e('masked', 'l', 0.4), e('ninja', 'r', 3)] },
        { at: 1180, items: [{ t: 'nunchaku', x: 1400, y: 228 }, { t: 'apple', x: 1560, y: 214 }], enemies: [e('thug', 'l', 0), e('thug', 'r', 0.5), e('masked', 'r', 2.4), e('ninja', 'l', 3.4)] },
        { at: 1500, mini: true, enemies: [e('brute', 'r', 0.3), e('thug', 'l', 4), e('masked', 'r', 6)] },
        { at: 1760, boss: true, items: [{ t: 'bat', x: 1980, y: 236 }], enemies: [e('boss', 'r', 0.6), e('ninja', 'l', 3), e('ninja', 'r', 9)] },
      ],
    },
  ];
  /* an empty arena for tuning moves: ?lab=1 and the number keys with ?debug=1 */
  L.lab = { name: 'TRAINING YARD', sub: 'LAB', width: 960, seed: 9, music: null, start: { x: 90, y: 214 }, waves: [] };
  G.level = L;
})((window.SGS = window.SGS || {}));
