# StickBrawl

A free, original pencil-sketch beat 'em up in the spirit of the 80s arcade street brawlers. You are the blue stick figure; the red ones want you gone. Everything is drawn in code (steady graphite lines on paper), and all music and sound effects are synthesized with the Web Audio API. No image or audio files, no build step.

**Status:** playable. Five levels (streets, warehouse, dojo, docks, rooftop), each with a mini boss and a big boss, with their own backdrop and music.

## Controls

| Action | Default key |
| --- | --- |
| Move (and walk "up" and "down" the street) | `←` `→` `↑` `↓` |
| Punch (3-hit combo, the third knocks down) | `Z` |
| Kick (3 light kicks, then a heavy kick that knocks down) | `X` |
| Jump | `Space` |
| Jump kick / spin kick | in the air: kick = jump kick, punch = spin kick (hits both sides) |
| Grab | walk into a standing or stunned enemy |
| While holding | punch = knee (3 knees throw him), kick or back + punch = throw |
| Pick up a weapon | stand on it and press punch |
| With a weapon | punch = swing / stab, kick = throw it |
| Pause | `P` or `Esc` |

Every key can be changed in **Settings → Controls** (click an action, then press a key or click a mouse button - left, right and middle click can be bound too; a key already in use is swapped). Esc always pauses.

Gamepad: the d-pad / left stick move; A jump, X punch, B kick and Start pause by default, all rebindable in the same Controls screen.

### On a phone or tablet

Play in landscape. A floating stick on the left walks (up and down walk you along the street's depth); on the right, **PUNCH**, **KICK** and **JUMP** (jump, then tap punch for a spin kick or kick for a jump kick). Walk into a stunned enemy to grab him: punch to knee, kick to throw. Stand on a weapon and tap **PUNCH** to pick it up. The pause button opens the menu. The on-screen controls appear on touch devices automatically; Settings has size, opacity and a left-handed layout. Use your browser's *Add to Home Screen* to install it as a full-screen app.

### Controller

In menus a gamepad's D-pad / left stick moves the highlight, **A** selects, **B** goes back and **Start** plays or resumes; in play the buttons are chosen in **Settings -> Controls**. In menus the D-pad / left stick moves the highlight, **A** selects, **B** goes back and **Start** plays or resumes. **Settings -> Controller** has a dead-zone slider and lets you remap every button.

## Weapons

- **Baseball bat:** slow, heavy, knocks down.
- **Nunchaku:** fast two-hit combo.
- **Knife:** quick stab; thrown it flies straight and fast.
- **Crate and barrel:** carry it overhead (a bit slower) and throw it; it breaks and leaves planks on the floor. The barrel hits harder than the crate.

Enemies fight like you: a telegraphed opener, then a 2 or 3 hit punch or kick combo that only continues if the hit before it landed, ending in a knockdown. Big bosses skip the light stuff and use heavy attacks that always knock you down. Bosses have their own moves (slam, charge) and get enraged at half health. Regular enemies can grab you from the front: mash the buttons to break free.

Crates can be picked up and thrown (enemies throw them too); oil drums can be smashed and often hide a weapon or food. Enemies come in armed (not bosses), so the weapons you use are mostly ones you take off them: knock a weapon out of a fighter's hands and pick it up. Weapons wear out after a number of hits. Enemies pick them up too, and drop them when knocked down.

Chain 3 or more hits within a second and a half for a combo bonus. Menus can be driven with the up / down arrows (or a gamepad d-pad) and Enter / A.

## Rules

6 hearts per life, 3 lives, no continues. Extra lives at 20,000 and 50,000 points. Apples and chickens heal. The clock counts down from 300.

## Testing flags

Add to the URL: `?debug=1` (spawn keys: `1`-`5` enemies, `6`-`8` weapons, `9` chicken, `H` heal, `E` knock out all), `?god=1` (no damage), `?wave=N` (start at wave N), `?lab=1` (empty training yard), `?boxes=1` (show hit boxes), `?play=1` (skip the title).

## Run it locally

Serve the folder with any static server, for example `python -m http.server`, and open `index.html`.

CC BY-NC 4.0, free to play and share, not for money.
