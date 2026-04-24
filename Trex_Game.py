import array
import math
import random
import sys

import pygame

# Screen and world constants
SCREEN_WIDTH = 900
SCREEN_HEIGHT = 420
GROUND_Y = 340
FPS = 60

# Physics/gameplay constants
GRAVITY = 0.8
JUMP_VELOCITY = -16
START_SPEED = 7.0
MAX_SPEED = 16.0
SPEED_INCREMENT = 0.16

# Colors
SKY_BLUE = (178, 232, 255)
GROUND_BROWN = (126, 84, 48)
GRASS_GREEN = (88, 166, 57)
DINO_GREEN = (32, 105, 70)
DINO_DUCK_GREEN = (26, 90, 62)
CACTUS_GREEN = (22, 125, 70)
BIRD_ORANGE = (227, 121, 63)
SUN_YELLOW = (255, 217, 71)
TEXT_DARK = (30, 30, 30)
WHITE = (255, 255, 255)


def create_tone(
    frequency: float,
    duration: float,
    volume: float = 0.35,
    sample_rate: int = 44100,
    fade_ms: int = 8,
) -> pygame.mixer.Sound:
    """Generate a simple sine-wave sound so no external assets are required."""
    samples_count = max(1, int(sample_rate * duration))
    fade_samples = int(sample_rate * (fade_ms / 1000))
    buf = array.array("h")

    amplitude = int(32767 * max(0.0, min(volume, 1.0)))
    for i in range(samples_count):
        t = i / sample_rate
        envelope = 1.0
        if fade_samples > 0:
            if i < fade_samples:
                envelope = i / fade_samples
            elif i > samples_count - fade_samples:
                envelope = max(0.0, (samples_count - i) / fade_samples)
        sample = int(amplitude * envelope * math.sin(2.0 * math.pi * frequency * t))
        buf.append(sample)

    # Duplicate samples for stereo output.
    stereo = array.array("h")
    for sample in buf:
        stereo.extend((sample, sample))

    return pygame.mixer.Sound(buffer=stereo.tobytes())


class Dino:
    def __init__(self):
        self.stand_height = 56
        self.duck_height = 34
        self.rect = pygame.Rect(120, GROUND_Y - self.stand_height, 52, self.stand_height)
        self.vy = 0.0
        self.is_ducking = False

    @property
    def on_ground(self) -> bool:
        return self.rect.bottom >= GROUND_Y

    def jump(self):
        if self.on_ground:
            self.vy = JUMP_VELOCITY

    def set_duck(self, ducking: bool):
        if ducking and self.on_ground and not self.is_ducking:
            self.is_ducking = True
            self.rect.height = self.duck_height
            self.rect.width = 64
            self.rect.bottom = GROUND_Y
        elif not ducking and self.is_ducking:
            self.is_ducking = False
            self.rect.height = self.stand_height
            self.rect.width = 52
            self.rect.bottom = GROUND_Y

    def update(self):
        self.vy += GRAVITY
        self.rect.y += int(self.vy)

        if self.rect.bottom > GROUND_Y:
            self.rect.bottom = GROUND_Y
            self.vy = 0.0

    def draw(self, surface: pygame.Surface):
        body_color = DINO_DUCK_GREEN if self.is_ducking else DINO_GREEN
        pygame.draw.rect(surface, body_color, self.rect, border_radius=8)
        eye = pygame.Rect(self.rect.right - 16, self.rect.top + 10, 6, 6)
        pygame.draw.rect(surface, WHITE, eye, border_radius=2)


class Obstacle:
    def __init__(self, x_pos: int):
        self.kind = random.choice(("cactus", "cactus", "bird"))
        if self.kind == "bird":
            self.rect = pygame.Rect(x_pos, random.choice((GROUND_Y - 92, GROUND_Y - 118)), 46, 30)
        else:
            width = random.randint(24, 42)
            height = random.randint(45, 76)
            self.rect = pygame.Rect(x_pos, GROUND_Y - height, width, height)

    def update(self, speed: float):
        self.rect.x -= int(speed)

    def draw(self, surface: pygame.Surface):
        if self.kind == "bird":
            pygame.draw.ellipse(surface, BIRD_ORANGE, self.rect)
            wing = pygame.Rect(self.rect.x + 8, self.rect.y + 8, 16, 8)
            pygame.draw.ellipse(surface, WHITE, wing)
        else:
            pygame.draw.rect(surface, CACTUS_GREEN, self.rect, border_radius=5)
            arm_h = max(14, self.rect.height // 3)
            arm = pygame.Rect(self.rect.x - 10, self.rect.y + arm_h, 10, 8)
            pygame.draw.rect(surface, CACTUS_GREEN, arm, border_radius=3)


def spawn_obstacle(existing_obstacles):
    last_right = max((obs.rect.right for obs in existing_obstacles), default=SCREEN_WIDTH)
    spacing = random.randint(280, 460)
    return Obstacle(last_right + spacing)


def draw_background(screen: pygame.Surface, score: int, ground_scroll: int):
    screen.fill(SKY_BLUE)
    pygame.draw.circle(screen, SUN_YELLOW, (770, 80), 36)

    # Clouds move slowly based on score for subtle parallax.
    cloud_offset = (score * 2) % (SCREEN_WIDTH + 200)
    cloud_x = SCREEN_WIDTH - cloud_offset
    for dx in (0, 120):
        cx = (cloud_x + dx) % (SCREEN_WIDTH + 220) - 60
        pygame.draw.ellipse(screen, WHITE, (cx, 70, 80, 30))
        pygame.draw.ellipse(screen, WHITE, (cx + 20, 55, 70, 35))

    pygame.draw.rect(screen, GROUND_BROWN, (0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y))
    pygame.draw.rect(screen, GRASS_GREEN, (0, GROUND_Y - 8, SCREEN_WIDTH, 8))

    # Scrolling pebbles for better sensation of motion.
    step = 45
    for x in range(-step, SCREEN_WIDTH + step, step):
        px = (x - ground_scroll) % (SCREEN_WIDTH + step) - 8
        pygame.draw.circle(screen, TEXT_DARK, (px, GROUND_Y + 30), 2)


def draw_text(screen: pygame.Surface, font: pygame.font.Font, text: str, x: int, y: int, color=TEXT_DARK):
    surface = font.render(text, True, color)
    screen.blit(surface, (x, y))


def reset_state():
    dino = Dino()
    obstacles = [Obstacle(SCREEN_WIDTH + 120), Obstacle(SCREEN_WIDTH + 460)]
    return dino, obstacles, 0, START_SPEED, False, 0, 0


def main():
    pygame.init()

    try:
        pygame.mixer.init(frequency=44100, size=-16, channels=2)
        sound_jump = create_tone(700, 0.09, 0.30)
        sound_point = create_tone(980, 0.06, 0.28)
        sound_hit = create_tone(180, 0.24, 0.35)
    except pygame.error:
        # Graceful fallback in environments without audio devices.
        sound_jump = sound_point = sound_hit = None

    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("T-Rex Runner")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 38)
    big_font = pygame.font.Font(None, 64)

    dino, obstacles, score, speed, game_over, best_score, ground_scroll = reset_state()
    started = False

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_SPACE, pygame.K_UP) and not game_over and dino.on_ground:
                    started = True
                    dino.jump()
                    if sound_jump:
                        sound_jump.play()
                if event.key in (pygame.K_DOWN, pygame.K_s):
                    dino.set_duck(True)
                if event.key == pygame.K_r and game_over:
                    dino, obstacles, score, speed, game_over, _, ground_scroll = reset_state()
                    best_score = max(best_score, score)
                    started = False
            if event.type == pygame.KEYUP and event.key in (pygame.K_DOWN, pygame.K_s):
                dino.set_duck(False)

        draw_background(screen, score, ground_scroll)

        if not game_over:
            if started:
                ground_scroll = (ground_scroll + int(speed)) % (SCREEN_WIDTH + 45)
                dino.update()

                for obstacle in obstacles:
                    obstacle.update(speed)
                    obstacle.draw(screen)

                # Remove passed obstacles and spawn new ones.
                if obstacles and obstacles[0].rect.right < 0:
                    obstacles.pop(0)
                    obstacles.append(spawn_obstacle(obstacles))
                    score += 1
                    best_score = max(best_score, score)
                    speed = min(MAX_SPEED, speed + SPEED_INCREMENT)
                    if sound_point:
                        sound_point.play()

                # Collision check
                if any(dino.rect.colliderect(ob.rect) for ob in obstacles):
                    game_over = True
                    if sound_hit:
                        sound_hit.play()
            else:
                for obstacle in obstacles:
                    obstacle.draw(screen)

            dino.draw(screen)
            draw_text(screen, font, f"Score: {score}", 20, 18)
            draw_text(screen, font, f"Best: {best_score}", 20, 52)
            draw_text(screen, font, f"Speed: {speed:.1f}", 20, 86)
            draw_text(screen, font, "SPACE/UP: Jump", 620, 16)
            draw_text(screen, font, "DOWN/S: Duck", 650, 48)
            if not started:
                draw_text(screen, font, "Press SPACE to start", 340, 130)

        else:
            dino.draw(screen)
            for obstacle in obstacles:
                obstacle.draw(screen)

            over_box = pygame.Rect(220, 115, 460, 190)
            pygame.draw.rect(screen, WHITE, over_box, border_radius=12)
            pygame.draw.rect(screen, (90, 90, 90), over_box, 3, border_radius=12)
            draw_text(screen, big_font, "Game Over", 320, 140)
            draw_text(screen, font, f"Final Score: {score}", 335, 198)
            draw_text(screen, font, f"Best Score: {best_score}", 335, 228)
            draw_text(screen, font, "Press R to restart", 323, 258)

        pygame.display.flip()
        clock.tick(FPS)


if __name__ == "__main__":
    main()
