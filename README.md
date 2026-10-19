# StickBrawl

A free, original pencil-sketch beat 'em up in the spirit of the 80s arcade street brawlers. You are the blue stick figure; the red ones want you gone. Everything is drawn in code (steady graphite lines on paper), and all music and sound effects are synthesized with the Web Audio API. No image or audio files, no build step.

**Status:** early sandbox. Combat engine, one draft level (street) with a mini boss and a big boss. More levels to come.

## Controls

| Action | Default key |
| --- | --- |
| Move (and walk "up" and "down" the street) | `←` `→` `↑` `↓` |
| Punch (3-hit combo, the third knocks down) | `Z` |
| Kick | `X` |
| Jump | `Space` |
| Jump kick / spin kick | in the air: kick = jump kick, punch = spin kick (hits both sides) |
| Grab | walk into a standing or stunned enemy |
| While holding | punch = knee (3 knees throw him), kick or back + punch = throw |
| Pick up a weapon | stand on it and press punch |
| With a weapon | punch = swing / stab, kick = throw it |
| Pause | `P` or `Esc` |

Every key can be changed in **Settings → Controls** (click an action, then press a key or click a mouse button - left, right and middle click can be bound too; a key already in use is swapped). Esc always pauses.

Gamepad: A jump, X/Y punch, B kick, Start pause (not rebindable yet).

## Weapons

- **Baseball bat:** slow, heavy, knocks down.
- **Nunchaku:** fast two-hit combo.
- **Knife:** quick stab; thrown it flies straight and fast.

Weapons wear out after a number of hits. Enemies pick them up too, and drop them when knocked down.

## Rules

6 hearts per life, 3 lives, no continues. Extra lives at 20,000 and 50,000 points. Apples and chickens heal. The clock counts down from 240.

## Testing flags

Add to the URL: `?debug=1` (spawn keys: `1`-`5` enemies, `6`-`8` weapons, `9` chicken, `H` heal, `E` knock out all), `?god=1` (no damage), `?wave=N` (start at wave N), `?lab=1` (empty training yard), `?boxes=1` (show hit boxes), `?play=1` (skip the title).

## Run it locally

Serve the folder with any static server, for example `python -m http.server`, and open `index.html`.

CC BY-NC 4.0, free to play and share, not for money.
