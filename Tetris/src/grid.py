from settings import *

class Grid:
    def __init__(self):
        self.width = GRID_WIDTH
        self.height = GRID_HEIGHT
        self.grid = [[0 for _ in range(self.width)] for _ in range(self.height)]

    def is_inside(self, x, y):
        return 0 <= x < self.width and 0 <= y < self.height

    def is_empty(self, x, y):
        return self.grid[y][x] == 0

    def is_valid_position(self, tetromino, adj_x=0, adj_y=0):
        for x, y in tetromino.shape:
            new_x = tetromino.x + x + adj_x
            new_y = tetromino.y + y + adj_y
            
            # Check walls and floor
            if new_x < 0 or new_x >= self.width or new_y >= self.height:
                return False
            
            # Check collision with existing blocks
            if new_y >= 0:
                if self.grid[new_y][new_x] != 0:
                    return False
        return True

    def add_piece(self, tetromino):
        for x, y in tetromino.shape:
            grid_x = tetromino.x + x
            grid_y = tetromino.y + y
            if self.is_inside(grid_x, grid_y):
                self.grid[grid_y][grid_x] = tetromino.color

    def clear_full_rows(self):
        # Create a new grid with only non-full rows
        new_grid = [row for row in self.grid if 0 in row]
        lines_cleared = self.height - len(new_grid)
        
        # Add empty rows at the top
        for _ in range(lines_cleared):
            new_grid.insert(0, [0 for _ in range(self.width)])
            
        self.grid = new_grid
        return lines_cleared