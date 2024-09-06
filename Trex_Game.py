import pygame
import sys
import random

# Game Variables
gravity = 0.6
t_rex_y = 200
t_rex_vy = 0
obstacle_x = 800
obstacle_y = 300
score = 0
game_over = False

# Pygame Initialization
pygame.init()
clock = pygame.time.Clock()
screen = pygame.display.set_mode((800, 400))

# Colors
black = (0, 0, 0)
white = (255, 255, 255)

# Fonts
font = pygame.font.Font(None, 36)

class T_Rex(pygame.Rect):
    def __init__(self):
        super().__init__(100, t_rex_y, 50, 50)

    def move(self):
        global t_rex_vy
        t_rex_vy += gravity
        self.y += t_rex_vy

        if self.y > 350:
            self.y = 350
            t_rex_vy = 0

    def jump(self):
        global t_rex_vy
        t_rex_vy = -15

class Obstacle(pygame.Rect):
    def __init__(self):
        super().__init__(obstacle_x, obstacle_y, 30, 30)

    def move(self):
        self.x -= 5

def draw_text(text, x, y):
    text_surface = font.render(text, True, black)
    screen.blit(text_surface, (x, y))

def main():
    global score, game_over
    t_rex = T_Rex()
    obstacle = Obstacle()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and not game_over:
                    t_rex.jump()
                if event.key == pygame.K_r and game_over:
                    game_over = False
                    score = 0
                    t_rex.y = 200
                    obstacle.x = 800

        screen.fill(white)

        if not game_over:
            t_rex.move()
            obstacle.move()

            if obstacle.x < -30:
                obstacle.x = 800
                score += 1
                obstacle.y = random.randint(200, 350)

            if t_rex.colliderect(obstacle):
                game_over = True

            pygame.draw.rect(screen, black, t_rex)
            pygame.draw.rect(screen, black, obstacle)

            draw_text(f'Score: {score}', 10, 10)

        else:
            draw_text('Game Over', 300, 100)
            draw_text(f'Final Score: {score}', 300, 150)
            draw_text('Press R to restart', 300, 200)

        pygame.display.update()
        clock.tick(60)

if __name__ == '__main__':
    main()