import pygame
import os

class SoundManager:
    def __init__(self):
        self.sounds = {}
        self.music_loaded = False
        
        # Initialize mixer if not already initialized
        if not pygame.mixer.get_init():
            try:
                pygame.mixer.init()
            except Exception as e:
                print(f"Warning: Could not initialize sound mixer: {e}")
                return

        self.load_assets()

    def load_assets(self):
        # Sound effects to load
        sound_files = {
            'move': 'move.wav',
            'rotate': 'rotate.wav',
            'drop': 'drop.wav',
            'clear': 'clear.wav',
            'gameover': 'gameover.wav'
        }

        # Load sound effects
        for name, filename in sound_files.items():
            path = os.path.join('assets', filename)
            if os.path.exists(path):
                try:
                    self.sounds[name] = pygame.mixer.Sound(path)
                except Exception as e:
                    print(f"Warning: Could not load sound {filename}: {e}")
            else:
                print(f"Warning: Sound file not found: {path}")

        # Load music
        music_files = ['music.ogg', 'music.mp3', 'music.wav']
        for filename in music_files:
            path = os.path.join('assets', filename)
            if os.path.exists(path):
                try:
                    pygame.mixer.music.load(path)
                    self.music_loaded = True
                    break
                except Exception as e:
                    print(f"Warning: Could not load music {filename}: {e}")
        
        if not self.music_loaded:
            print("Warning: No music file found (music.ogg, music.mp3, or music.wav)")

    def play_music(self):
        if self.music_loaded:
            try:
                pygame.mixer.music.play(-1) # Loop indefinitely
            except Exception as e:
                print(f"Warning: Could not play music: {e}")

    def stop_music(self):
        if self.music_loaded:
            pygame.mixer.music.stop()

    def play_sound(self, name):
        if name in self.sounds:
            try:
                self.sounds[name].play()
            except Exception as e:
                print(f"Warning: Could not play sound {name}: {e}")