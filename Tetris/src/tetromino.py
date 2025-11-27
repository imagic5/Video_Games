import random
from settings import *

class Tetromino:
    # Standard Tetris shapes (I, J, L, O, S, T, Z)
    # Defined as list of coordinates relative to pivot (0,0)
    SHAPES = {
        'I': [(-1, 0), (0, 0), (1, 0), (2, 0)],
        'J': [(-1, -1), (-1, 0), (0, 0), (1, 0)],
        'L': [(1, -1), (-1, 0), (0, 0), (1, 0)],
        'O': [(0, 0), (1, 0), (0, 1), (1, 1)],
        'S': [(0, 0), (1, 0), (0, 1), (-1, 1)],
        'T': [(-1, 0), (0, 0), (1, 0), (0, -1)],
        'Z': [(-1, 0), (0, 0), (0, 1), (1, 1)]
    }

    SHAPE_COLORS = {
        'I': CYAN,
        'J': BLUE,
        'L': ORANGE,
        'O': YELLOW,
        'S': GREEN,
        'T': PURPLE,
        'Z': RED
    }

    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.shape_type = random.choice(list(self.SHAPES.keys()))
        self.shape = self.SHAPES[self.shape_type]
        self.color = self.SHAPE_COLORS[self.shape_type]
        self.rotation = 0

    def rotate(self):
        # Basic rotation logic (90 degrees clockwise)
        # (x, y) -> (-y, x)
        new_shape = []
        for x, y in self.shape:
            new_shape.append((-y, x))
        self.shape = new_shape