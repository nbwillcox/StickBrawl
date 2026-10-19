# StickBrawl - confirmed intent (2026-10-19)

Working title. A solo, browser-playable Double Dragon-style beat 'em up. Mechanics follow the 1987 arcade game closely; levels, characters, bosses and music are original.

## Outcome
- HTML5 canvas, no build step, no asset files, hosted on GitHub Pages like the rest of the series. Keyboard + gamepad + the shared `_mobile_kit` touch layer (landscape).
- Side-scrolling with depth (walk up/down the street), camera locks during fights, "GO ->" cue when clear.

## Combat (arcade feel, not DD2/3)
- 3-hit punch combo (3rd knocks down), kick, jump kick, spin kick (cyclone), grab -> knees -> throw, enemies knock you down.
- Weapons: baseball bat, nunchaku, knives. Pick up, limited uses, can be thrown (knives especially). Enemies use them too.
- Enemies attack one or two at a time (attack tokens), circle otherwise, telegraph their hits.

## Rules
- Heart-bar health per life, 3 lives, no continues, generous stage timer, saved high score, extra lives at score thresholds, rare food pickups from enemies.
- Levels with a mini boss midway and a big boss at the end. Vertical slice first (level 1), then 4-5 themed levels: street, warehouse, dojo, docks, rooftop.

## Look and sound
- Player = blue stick figure. Enemies = red stick figures, each with a distinct prop (mask, headband, mohawk, hat...).
- Pencil art: steady lines (NO wobble), graphite texture, cross-hatch shading, paper background. Placeholder art, to be upgraded later.
- Original WebAudio chiptune music and SFX, one track per level plus boss and jingles.

## Success
- Game feel first: responsive controls, hit-stop, screen shake, fair knockdown/recovery timing, arcade-style enemy AI, locked 60fps. Title screen, pause and GO cue are baseline.

## Out of scope
- Co-op, DD2/DD3 moves (backflip etc.), copying original characters/levels/music, sprite sheets (for now).
