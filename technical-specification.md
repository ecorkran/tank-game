# Tank Game Technical Specification

This document outlines the technical architecture and specifications for implementing the tank game without providing implementation code. It describes the functions, methods, classes, data structures, and logic required for each feature.

## 1. Project Structure and Types

### Directory Structure
```
src/
├── components/     # React components
│   └── game/       # Game-specific components
├── hooks/          # Custom React hooks
├── lib/            # Game logic and utilities
├── styles/         # CSS modules
└── types/          # TypeScript type definitions
```

### Core Game Types
Create the following interfaces in `src/types/game.ts`:

- `Position`: Represents a 2D position
  - Properties: `x: number`, `y: number`

- `GameObject`: Base interface for all game entities
  - Properties: `position: Position`, `rotation: number`, `width: number`, `height: number`

- `Tank`: Extends `GameObject` for both player and enemy tanks
  - Additional properties: `health: number`, `maxHealth: number`, `speed: number`, `rotationSpeed: number`, `cooldown: number`, `maxCooldown: number`, `isPlayer: boolean`

- `Projectile`: Extends `GameObject` for bullets/shells
  - Additional properties: `speed: number`, `damage: number`, `isActive: boolean`

- `Obstacle`: Extends `GameObject` for map obstacles
  - Additional properties: `isDestructible: boolean`, optional `health?: number`

- `PowerUp`: For collectible power-ups
  - Properties: `position: Position`, `type: PowerUpType`, `width: number`, `height: number`, `duration: number`, `isActive: boolean`
  
- `PowerUpType`: String enum with values 'health', 'speed', 'rapidFire', 'shield'

- `GameState`: The complete game state
  - Properties: 
    - `player: Tank`
    - `enemies: Tank[]`
    - `projectiles: Projectile[]`
    - `obstacles: Obstacle[]`
    - `powerUps: PowerUp[]`
    - `score: number`
    - `isGameOver: boolean`
    - `isPaused: boolean`
    - `powerUpEffects: { speed: number, shield: boolean, rapidFire: boolean }`

## 2. Canvas Component

Create a reusable Canvas component in `src/components/game/Canvas.tsx`:

### Props Interface
```typescript
interface CanvasProps {
  draw: (context: CanvasRenderingContext2D, frameCount: number) => void;
  width?: number;
  height?: number;
}
```

### Component Requirements
- Use a `useRef` hook to reference the canvas element
- Set up a rendering loop using `requestAnimationFrame`
- Clear and redraw the canvas on each frame
- Call the provided `draw` function with the canvas context and frame count
- Handle cleanup by canceling animation frame on unmount
- Create supporting CSS module with styling for the canvas

## 3. Input Handling

Create a custom hook in `src/hooks/useInput.ts`:

### Interface
```typescript
interface InputState {
  keys: {
    [key: string]: boolean;
  };
  mousePosition: {
    x: number;
    y: number;
  };
  mouseDown: boolean;
}
```

### Hook Requirements
- Track keyboard key states (pressed/not pressed)
- Track mouse position coordinates
- Track mouse button state (down/up)
- Add support for touch events for mobile compatibility
- Handle event listeners cleanup on unmount
- Return the current input state for use in components

## 4. Game Container Component

Create the main game container in `src/components/game/GameContainer.tsx`:

### State Requirements
- Maintain game state using the `GameState` interface
- Track screen dimensions for responsive sizing
- Track current game screen state ('start', 'playing', 'gameOver')
- Store high score

### Methods
- `handleStartGame()`: Reset game state and start game
- `handleGameOver()`: Update high score and show game over screen
- `handleRestartGame()`: Return to start menu
- `draw(ctx, frameCount)`: Main drawing function passed to Canvas
- `handleCanvasClick(e)`: Handle clicks on UI elements

### Lifecycle Requirements
- Set up resize event listeners
- Initialize game assets and state
- Load high score from localStorage
- Set up interval for the game loop
- Clean up all listeners and intervals on unmount

## 5. Enemy Tank Management

Create utility functions for enemy tanks in `src/lib/enemies.ts`:

### Functions
- `createEnemy(position: Position, canvasWidth: number, canvasHeight: number): Tank`
  - Create a new enemy tank with randomized properties

- `updateEnemy(enemy: Tank, playerPosition: Position, canvasWidth: number, canvasHeight: number): Tank`
  - Update enemy position, rotation, and state based on player position
  - Handle boundary detection
  - Implement basic AI targeting and movement

## 6. Obstacle Generation

Create utilities for obstacles in `src/lib/obstacles.ts`:

### Functions
- `createObstacle(position: Position, width: number, height: number, isDestructible: boolean): Obstacle`
  - Create a new obstacle with specified properties

- `generateObstacles(canvasWidth: number, canvasHeight: number, count: number): Obstacle[]`
  - Create an array of obstacles for the game map
  - Include border obstacles around the edges
  - Generate random obstacles within the play area
  - Avoid placing obstacles too close to player spawn

## 7. Power-Up System

Create power-up utilities in `src/lib/powerups.ts`:

### Functions
- `createPowerUp(position: Position, type: PowerUpType): PowerUp`
  - Create a new power-up with specified type and position
  - Set duration based on power-up type

- `generateRandomPowerUp(canvasWidth: number, canvasHeight: number, obstacles: Obstacle[]): PowerUp | null`
  - Create a power-up at a random position
  - Use weighted randomization for different power-up types
  - Ensure power-up doesn't spawn inside obstacles
  - Return null if a valid position cannot be found

## 8. Sound Management

Create a sound system in `src/lib/sounds.ts`:

### Class: `SoundManager`
- Properties:
  - `sounds`: Map of sound names to HTMLAudioElement objects
  - `isMuted`: Boolean tracking mute state

- Methods:
  - `init()`: Initialize audio elements
  - `play(soundName: string)`: Play a specific sound effect
  - `startMusic()`: Start background music
  - `stopMusic()`: Stop background music
  - `toggleMute()`: Toggle mute state
  - `isSoundMuted()`: Get current mute state

- Export a singleton instance of the SoundManager

## 9. Game Loop Logic

Implement the main game loop in the GameContainer component:

### Game Loop Requirements
- Run at 60 FPS using setInterval
- Skip updates if game is not in 'playing' state
- Update player based on input
- Update all enemies
- Update projectiles
- Check for collisions
- Update power-ups and their effects
- Update game state based on collisions and events

### Collision Detection Functions
- `isColliding(obj1: GameObject, obj2: GameObject): boolean`
  - Check circular collision between two game objects

- `isCollidingRectangles(rect1: GameObject, rect2: GameObject): boolean`
  - Check rectangular collision (for obstacles)

- `checkObstacleCollision(position: Position, size: number, obstacles: Obstacle[]): {collided: boolean, collidedX: boolean, collidedY: boolean}`
  - Check if a position collides with any obstacles
  - Return which axes have collisions for sliding movement

## 10. Start Menu Component

Create a start menu in `src/components/game/StartMenu.tsx`:

### Props Interface
```typescript
interface StartMenuProps {
  onStartGame: () => void;
  highScore: number;
}
```

### Component Requirements
- Display game title
- Show game instructions
- Display high score if available
- Provide start button that calls `onStartGame`
- Create supporting CSS module with styling

## 11. Drawing Functions

Implement these drawing functions within the GameContainer's draw method:

### Drawing Functions
- `drawPlayer(ctx: CanvasRenderingContext2D, player: Tank)`: Draw the player tank
- `drawEnemy(ctx: CanvasRenderingContext2D, enemy: Tank)`: Draw an enemy tank
- `drawProjectile(ctx: CanvasRenderingContext2D, projectile: Projectile)`: Draw a projectile
- `drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle)`: Draw an obstacle
- `drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp)`: Draw a power-up
- `drawUI(ctx: CanvasRenderingContext2D)`: Draw score, health bar, etc.
- `drawGameOver(ctx: CanvasRenderingContext2D)`: Draw game over screen
- `drawMuteButton(ctx: CanvasRenderingContext2D)`: Draw mute/unmute button

## 12. Player Movement Logic

Implement player movement in the game loop:

### Player Movement Steps
1. Read key states from input hook
2. Calculate movement direction based on keys pressed
3. Normalize diagonal movement
4. Apply speed modifier from power-ups
5. Update player position
6. Check for collisions with boundaries and obstacles
7. Allow sliding along obstacles when colliding
8. Calculate rotation based on mouse position
9. Update player's rotation property

## 13. Projectile System

Implement projectile management in the game loop:

### Projectile Management Steps
1. Check if player is firing (mouse down and cooldown expired)
2. Create new projectile at player's position + offset in direction of rotation
3. Add projectile to game state
4. Reset player's cooldown (adjusted for rapid fire power-up)
5. For each projectile:
   - Update position based on speed and direction
   - Check for collisions with boundaries, obstacles, and tanks
   - Mark inactive or remove projectiles that collide or go out of bounds
   - Apply damage to hit entities

## 14. Enemy Spawning and AI

Implement enemy spawning and AI:

### Enemy Spawning
1. Set up interval to spawn enemies at random times
2. Limit maximum number of concurrent enemies
3. Select random spawn position at map edge
4. Create enemy and add to game state

### Enemy AI
For each enemy in the game loop:
1. Calculate angle to player
2. Gradually rotate toward player with some randomness
3. Move forward with a probability factor
4. Check for collisions with boundaries and obstacles
5. Update enemy cooldown
6. Fire at player when cooldown expired and within range

## 15. Power-Up Implementation

Implement power-up system:

### Power-Up Spawning
1. Set up interval to spawn power-ups
2. Generate random power-up with weighted type selection
3. Find valid position away from obstacles
4. Add to game state

### Power-Up Collection
In the game loop:
1. Check for collisions between player and power-ups
2. Apply effect based on power-up type:
   - Health: Instantly increase player health
   - Speed: Set speed multiplier and create timeout to reset
   - Rapid Fire: Set flag and create timeout to reset
   - Shield: Set flag and create timeout to reset
3. Mark collected power-ups as inactive

### Power-Up Effects
- Apply speed multiplier to player movement
- Use rapid fire flag to reduce cooldown between shots
- Use shield flag to prevent damage from projectiles

## 16. Game State Management

Implement game state transitions:

### State Transitions
- Initial state: 'start' screen displayed
- 'start' → 'playing': When start button clicked
- 'playing' → 'gameOver': When player health reaches zero
- 'gameOver' → 'start': When restart button clicked

### Persistence
- Save high score to localStorage when game ends
- Load high score from localStorage on component mount

## 17. Deployment Configuration

Set up Next.js and Vercel configuration:

### Next.js Configuration (`next.config.js`)
- Enable static site generation with `output: 'export'`
- Configure image optimization
- Set up basePath if needed

### Vercel Configuration (`vercel.json`)
- Specify build command
- Set output directory
- Configure other deployment settings

---

## Implementation Strategy

The junior developer should implement these components in the following order:

1. Set up project structure and types
2. Create Canvas component
3. Implement input handling hook
4. Build basic GameContainer
5. Implement player rendering and movement
6. Add projectile system
7. Create enemies and basic AI
8. Implement collision detection
9. Add obstacles
10. Create game state management and UI
11. Implement power-ups
12. Add sound system
13. Polish visuals and performance
14. Set up deployment

Each feature should be implemented following the specifications above, tested, and then integrated with the other components.