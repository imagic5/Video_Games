# Tetris Project — Handoff Document

## Workspace
- **Path:** `c:\Users\irosn\Documents\Video_Games\`
- **OS:** Windows
- **File:** `tetris.html` (685 lines, single self-contained HTML file)

## What Was Built
A fully functional, single-file Tetris game in HTML/CSS/JavaScript. No dependencies, no build tools — just open in a browser and play.

## Current Feature Set (all implemented and working)
1. **10×20 board** with 30px block size, rendered on HTML5 Canvas
2. **7 standard Tetrominos** (I, O, T, S, Z, J, L) with canonical colors
3. **7-bag randomizer** (Fisher-Yates shuffle) — guarantees all 7 pieces appear before repeating
4. **Rotation** with wall-kick offsets (tries 0, ±1, ±2)
5. **Ghost piece** — translucent preview showing where the piece will land (Easy mode only)
6. **Soft drop** (↓, +1 point per cell), **Hard drop** (Space, +2 per cell)
7. **Line clearing** with NES-style scoring: 100/300/500/800 × level
8. **Level progression** — level increases every 10 lines; drop speed increases (1000ms down to 50ms min, −80ms per level)
9. **Next piece preview** — centered in a 5×5 side canvas (Easy & Normal modes)
10. **Side panel UI** — Score, Level, Lines, Mode, High Score displays + controls reference
11. **Pause** (P key) with "PAUSED" overlay text
12. **Game Over** detection + overlay with final score, high score, and "NEW HIGH SCORE" indicator
13. **Restart** (R key) — works from any state
14. **Visual polish** — dark theme (#1a1a2e background), block highlights (white edge shading), grid lines, rounded panel boxes, cyan accent for stats
15. **Title screen** with difficulty selection (Easy / Normal / Hard) and high score display
16. **Game modes:**
    - **Easy** — Ghost piece + Next preview (full assists)
    - **Normal** — Next preview only (no ghost piece)
    - **Hard** — No assists (no ghost piece, no next preview)
17. **Sound effects** — Web Audio API synthesized sounds for: move, rotate, piece lock, hard drop, line clear (special Tetris sound for 4-line), level up, game over
18. **Animated line clears** — flashing white/cyan animation (~400ms) before rows disappear
19. **High score persistence** — localStorage per difficulty mode, displayed on title screen and side panel

## Architecture (single file: tetris.html)
- **Lines 1–78:** HTML + CSS (dark theme, flexbox layout, overlay styles)
- **Lines 80–176:** Additional CSS (title screen, mode buttons, high score display, game over enhancements)
- **Lines 178–244:** HTML structure (title screen, main canvas, next-preview canvas, side panels with mode/high score)
- **Lines 246–270:** Canvas setup, DOM element refs, constants (COLS=10, ROWS=20, BLOCK=30)
- **Lines 272–340:** Sound effects system (Web Audio API), high score localStorage functions
- **Lines 342–365:** Piece definitions (shape coords + colors)
- **Lines 367–430:** Game state vars, board creation, 7-bag system, piece spawning, init(), title screen/start logic
- **Lines 432–475:** Collision detection, rotation with wall kicks
- **Lines 477–545:** Lock piece, animated line clear (detectClears, finishClear), spawnNext, handleGameOver, scoring
- **Lines 547–555:** Ghost piece calculation
- **Lines 557–580:** Drawing functions (blocks with highlights, board, ghost, active piece, next preview)
- **Lines 582–640:** Line clear animation renderer, game loop (requestAnimationFrame with mode-aware drawing)
- **Lines 642–685:** drop(), hardDrop(), keyboard input handler (with SFX), showTitleScreen() call

## Controls
| Key | Action |
|-----|--------|
| ← → | Move left/right |
| ↑ | Rotate clockwise |
| ↓ | Soft drop (+1 pt/cell) |
| Space | Hard drop (+2 pts/cell) |
| P | Pause/Unpause |
| R | Restart |
| ESC | Return to title screen |

## Scoring System
- **Soft drop:** 1 point per cell
- **Hard drop:** 2 points per cell
- **Line clears:** 1 line = 100×level, 2 = 300×level, 3 = 500×level, 4 (Tetris) = 800×level
- **Level up:** Every 10 lines cleared
- **Speed:** `max(50, 1000 - (level-1) * 80)` ms per drop tick
- **High scores:** Stored per mode in localStorage (`tetris_hs` key)

## What Has NOT Been Done Yet / Potential Next Steps
These are features that were **not** requested or implemented. The user may want to add any of these:
- Hold/swap piece
- Background music (looping melody)
- T-spin detection / bonus scoring
- Touch/mobile controls
- Start screen music/animation
- DAS (Delayed Auto Shift) for smoother movement
- Lock delay
- Combo scoring
- Animated piece entry

## Key Design Decisions
- Single HTML file for maximum portability (no server needed)
- Canvas-based rendering (not DOM/CSS grid)
- Pieces stored as coordinate arrays, not matrix grids
- requestAnimationFrame loop with delta-time accumulator for drop timing
- Ghost piece drawn at 0.2 alpha of piece color (Easy mode only)
- Web Audio API for sound effects — no external audio files needed; AudioContext created on first user interaction (title screen click) to comply with browser autoplay policies
- Line clear animation uses a clearing state that pauses piece dropping for 400ms while rows flash
- High scores stored as JSON object in localStorage with per-mode tracking
- cancelAnimationFrame used to cleanly stop game loop on menu transitions

## How to Run
Just open `tetris.html` in any modern browser. No server, no install, nothing else needed.

---
*Generated as a context handoff — paste the instructions "Read HANDOFF.md in c:\Users\irosn\Documents\Video_Games\ and continue from where we left off" into a new conversation to resume.*
