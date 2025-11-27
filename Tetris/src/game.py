import pygame
from settings import *
from src.grid import Grid
from src.tetromino import Tetromino
from src.sound_manager import SoundManager

class Game:
    def __init__(self):
        self.grid = Grid()
        self.sound_manager = SoundManager()
        self.sound_manager.play_music()
        self.reset_game()
        self.font = pygame.font.SysFont(FONT_NAME, FONT_SIZE)

    def reset_game(self):
        self.grid = Grid()
        self.current_piece = Tetromino(GRID_WIDTH // 2, 0)
        self.next_piece = Tetromino(GRID_WIDTH // 2, 0)
        self.game_over = False
        self.paused = False
        self.score = 0
        self.lines_cleared = 0
        self.level = 1
        self.fall_speed = 1000
        self.last_fall_time = pygame.time.get_ticks()
        self.sound_manager.play_music()

    def toggle_pause(self):
        self.paused = not self.paused
        if self.paused:
            pygame.mixer.music.pause()
        else:
            pygame.mixer.music.unpause()

    def update_level(self):
        # Level up every 10 lines
        new_level = (self.lines_cleared // 10) + 1
        if new_level > self.level:
            self.level = new_level
            # Increase speed (decrease fall delay)
            # Example: 10% speed increase per level, capped at some minimum delay
            self.fall_speed = max(100, int(1000 * (0.9 ** (self.level - 1))))

    def update(self):
        if self.game_over or self.paused:
            return

        current_time = pygame.time.get_ticks()
        if current_time - self.last_fall_time > self.fall_speed:
            if self.grid.is_valid_position(self.current_piece, adj_y=1):
                self.current_piece.y += 1
            else:
                self.lock_piece()
            self.last_fall_time = current_time

    def move(self, dx):
        if self.game_over or self.paused: return
        if self.grid.is_valid_position(self.current_piece, adj_x=dx):
            self.current_piece.x += dx
            self.sound_manager.play_sound('move')

    def rotate(self):
        if self.game_over or self.paused: return
        old_shape = self.current_piece.shape
        self.current_piece.rotate()
        if self.grid.is_valid_position(self.current_piece):
            self.sound_manager.play_sound('rotate')
        else:
            self.current_piece.shape = old_shape

    def drop(self):
        if self.game_over or self.paused: return
        if self.grid.is_valid_position(self.current_piece, adj_y=1):
            self.current_piece.y += 1
            self.last_fall_time = pygame.time.get_ticks()

    def lock_piece(self):
        self.grid.add_piece(self.current_piece)
        self.sound_manager.play_sound('drop')
        cleared = self.grid.clear_full_rows()
        
        if cleared > 0:
            self.lines_cleared += cleared
            self.score += SCORE_TABLE.get(cleared, 0) * self.level
            self.update_level()
            self.sound_manager.play_sound('clear')

        self.current_piece = self.next_piece
        self.next_piece = Tetromino(GRID_WIDTH // 2, 0)
        
        if not self.grid.is_valid_position(self.current_piece):
            self.game_over = True
            self.sound_manager.stop_music()
            self.sound_manager.play_sound('gameover')

    def draw(self, screen):
        # Draw the grid background
        pygame.draw.rect(screen, DARK_GRAY, (TOP_LEFT_X, TOP_LEFT_Y, GAME_WIDTH, GAME_HEIGHT))
        # Draw border
        pygame.draw.rect(screen, WHITE, (TOP_LEFT_X - 2, TOP_LEFT_Y - 2, GAME_WIDTH + 4, GAME_HEIGHT + 4), 2)

        # Draw the grid cells
        for y in range(self.grid.height):
            for x in range(self.grid.width):
                if self.grid.grid[y][x] != 0:
                    pygame.draw.rect(screen, self.grid.grid[y][x],
                                     (TOP_LEFT_X + x * BLOCK_SIZE, TOP_LEFT_Y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE))
                    pygame.draw.rect(screen, BLACK,
                                     (TOP_LEFT_X + x * BLOCK_SIZE, TOP_LEFT_Y + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), 1)

        # Draw the current piece
        if self.current_piece:
            for x, y in self.current_piece.shape:
                piece_x = (self.current_piece.x + x) * BLOCK_SIZE + TOP_LEFT_X
                piece_y = (self.current_piece.y + y) * BLOCK_SIZE + TOP_LEFT_Y
                pygame.draw.rect(screen, self.current_piece.color, (piece_x, piece_y, BLOCK_SIZE, BLOCK_SIZE))
                pygame.draw.rect(screen, BLACK, (piece_x, piece_y, BLOCK_SIZE, BLOCK_SIZE), 1)

        # Draw UI
        self.draw_ui(screen)

        if self.paused:
            pause_text = self.font.render("PAUSED", True, WHITE)
            text_rect = pause_text.get_rect(center=(TOP_LEFT_X + GAME_WIDTH // 2, TOP_LEFT_Y + GAME_HEIGHT // 2))
            pygame.draw.rect(screen, BLACK, text_rect) # Background for text
            screen.blit(pause_text, text_rect)

        if self.game_over:
            # Semi-transparent overlay
            overlay = pygame.Surface((GAME_WIDTH, GAME_HEIGHT))
            overlay.set_alpha(128)
            overlay.fill(BLACK)
            screen.blit(overlay, (TOP_LEFT_X, TOP_LEFT_Y))

            game_over_text = self.font.render("GAME OVER", True, RED)
            restart_text = self.font.render("Press R to Restart", True, WHITE)
            
            go_rect = game_over_text.get_rect(center=(TOP_LEFT_X + GAME_WIDTH // 2, TOP_LEFT_Y + GAME_HEIGHT // 2 - 30))
            restart_rect = restart_text.get_rect(center=(TOP_LEFT_X + GAME_WIDTH // 2, TOP_LEFT_Y + GAME_HEIGHT // 2 + 30))
            
            screen.blit(game_over_text, go_rect)
            screen.blit(restart_text, restart_rect)

    def draw_ui(self, screen):
        score_text = self.font.render(f"Score: {self.score}", True, WHITE)
        level_text = self.font.render(f"Level: {self.level}", True, WHITE)
        lines_text = self.font.render(f"Lines: {self.lines_cleared}", True, WHITE)

        screen.blit(score_text, (UI_START_X, UI_START_Y))
        screen.blit(level_text, (UI_START_X, UI_START_Y + 40))
        screen.blit(lines_text, (UI_START_X, UI_START_Y + 80))

        # Draw Next Piece
        next_text = self.font.render("Next:", True, WHITE)
        screen.blit(next_text, (UI_START_X, UI_START_Y + 140))

        if self.next_piece:
            # Calculate offset for next piece preview
            # Center the piece somewhat in the UI area
            preview_x = UI_START_X + 50
            preview_y = UI_START_Y + 200
            
            for x, y in self.next_piece.shape:
                piece_x = preview_x + (x * BLOCK_SIZE)
                piece_y = preview_y + (y * BLOCK_SIZE)
                pygame.draw.rect(screen, self.next_piece.color, (piece_x, piece_y, BLOCK_SIZE, BLOCK_SIZE))
                pygame.draw.rect(screen, BLACK, (piece_x, piece_y, BLOCK_SIZE, BLOCK_SIZE), 1)