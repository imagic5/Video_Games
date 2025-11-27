# Project Roadmap: Tetris Clone

## Phase 1: Setup & Initialization
- [x] **Environment Setup**: Initialize Python virtual environment and install Pygame.
- [x] **Project Structure**: Create directory structure (`src/`, `assets/`) and initial files (`main.py`, `settings.py`).
- [x] **Window Creation**: Initialize Pygame window with defined dimensions and title.

## Phase 2: Core Data Structures
- [x] **Settings**: Define constants for screen size, grid size (10x20), block size, and colors in `settings.py`.
- [x] **Tetromino Class**: Implement the `Tetromino` class with shape definitions and rotation logic.
- [x] **Grid Management**: Implement the grid data structure to track occupied cells.

## Phase 3: Game Loop & Basic Movement
- [x] **Main Loop**: Create the game loop handling events, updates, and drawing.
- [x] **Spawning**: Logic to spawn new pieces at the top.
- [x] **Gravity**: Implement automatic downward movement based on a timer.
- [x] **Input Handling**: Implement Left, Right, and Down (Soft Drop) movement.

## Phase 4: Mechanics & Physics
- [x] **Collision Detection**: Implement checks for walls, floor, and other blocks.
- [x] **Locking**: Logic to lock a piece into the grid when it lands.
- [x] **Rotation**: Implement rotation with basic wall kick checks (prevent rotating into walls).

## Phase 5: Gameplay Logic
- [x] **Line Clearing**: Detect full rows, remove them, and shift blocks down.
- [x] **Scoring**: Implement score calculation based on lines cleared.
- [x] **Leveling**: Implement "Speed Up" logic every 10 lines.
- [x] **Game Over**: Detect when a new piece cannot spawn (loss condition).

## Phase 6: UI & Polish
- [x] **Graphics**: Render the grid and pieces with distinct colors.
- [x] **UI Overlay**: Display Score, Level, and Next Piece.
- [ ] **Audio**: Add background music and sound effects (optional placeholders first).
- [ ] **Ghost Piece**: (Optional) Visual indicator of where the piece will land.

## Phase 7: Final Review
- [ ] **Testing**: Playtest for bugs (stuck pieces, incorrect line clears).
- [ ] **Refinement**: Tweak speeds and controls for "feel".