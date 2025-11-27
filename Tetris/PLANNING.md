# Tetris Clone - Technical Design Document

## 1. Project Overview
A top-notch, carbon-copy Tetris clone featuring colorful blocks, accurate physics, music, and a progressive leveling system. The game is designed to be played in a desktop environment.

## 2. Technology Stack
*   **Language**: Python 3.x
*   **Library**: Pygame (Community Edition recommended `pygame-ce` or standard `pygame`)
    *   *Reasoning*: Pygame is the standard for 2D game development in Python, offering easy handling of graphics, input, and audio, perfect for a VSCode Sandbox on Windows.
*   **Environment**: Windows 11 (VSCode Terminal)

## 3. Game Architecture

### 3.1. Core Components
*   **Main Loop**: Handles the game clock, event processing (input), state updates, and rendering.
*   **Game State Manager**: Manages transitions between different screens:
    *   `MENU`: Start screen.
    *   `PLAYING`: The active game loop.
    *   `PAUSED`: Temporary suspension of gameplay.
    *   `GAME_OVER`: End state with final score.

### 3.2. Data Structures
*   **The Grid**: A 10 (width) x 20 (height) grid.
    *   Implementation: A 2D list (or dictionary) where `(0,0)` is top-left.
    *   Values: `0` for empty, Color/ID for occupied blocks.
*   **Tetrominoes**:
    *   Shapes: I, J, L, O, S, T, Z (Standard Tetris set).
    *   Representation: List of coordinate offsets relative to a pivot point.
    *   Colors: Standard Tetris colors (Cyan, Blue, Orange, Yellow, Green, Purple, Red).

## 4. Core Mechanics

### 4.1. Movement & Physics
*   **Gravity**: Pieces fall automatically at a speed determined by the current level.
*   **Input**:
    *   Left/Right: Move horizontally.
    *   Down: Soft drop (accelerates fall).
    *   Up/Space: Hard drop (instant lock) or Rotate (depending on control scheme preference, usually Up is Rotate, Space is Hard Drop).
*   **Collision Detection**:
    *   Check against grid boundaries (walls, floor).
    *   Check against existing locked blocks in the grid.

### 4.2. Rotation
*   **Logic**: Rotate piece coordinates 90 degrees clockwise around a pivot.
*   **Wall Kicks**: (Optional but recommended for "top-notch" feel) If a rotation hits a wall/block, attempt to shift the piece slightly to fit.

### 4.3. Line Clearing
*   Check grid after every piece lock.
*   Identify full rows (no empty cells).
*   Remove full rows.
*   Shift all blocks above the cleared lines down.
*   Update "Lines Cleared" counter.

## 5. Leveling & Scoring System

### 5.1. Leveling
*   **Rule**: Speed increases every 10 lines cleared.
*   **Implementation**:
    *   `level = lines_cleared // 10 + 1`
    *   Drop interval decreases as level increases (e.g., starts at 1000ms, reduces by percentage or fixed amount per level).

### 5.2. Scoring
*   Standard scoring based on lines cleared at once (1, 2, 3, or 4 "Tetris").
*   Bonus for higher levels.

## 6. Audio/Visual Requirements
*   **Visuals**:
    *   Distinct colors for each Tetromino type.
    *   Ghost piece (shows where the piece will land).
    *   UI: Score, Level, Lines, Next Piece preview.
*   **Audio**:
    *   Background Music: Looping track (classic theme style).
    *   Sound Effects: Move, Rotate, Drop, Line Clear, Tetris (4 lines), Game Over.

## 7. File Structure
```
Tetris/
├── main.py              # Entry point
├── settings.py          # Constants (Colors, Dimensions, Speeds)
├── src/
│   ├── game.py          # Main Game class
│   ├── grid.py          # Grid logic
│   ├── tetromino.py     # Piece definitions and logic
│   └── ui.py            # Rendering helpers
└── assets/              # Images and Sound files