# Detailed Refactoring Plan for GameContainer.tsx

This document outlines a structured approach to refactoring the large GameContainer.tsx component into more manageable pieces while preserving all functionality and adding support for multiple control schemes.

## Current Structure Analysis

The GameContainer.tsx file (approximately 1550 lines) currently handles:

1. Game state management
2. Input handling
3. Game loop logic
4. Collision detection
5. Entity updates (player, enemies, projectiles, power-ups)
6. Rendering logic
7. UI components and menus
8. Sound management
9. Control scheme handling

## Refactoring Goals

1. Separate game logic from rendering
2. Extract reusable utility functions
3. Create dedicated components for different aspects of the game
4. Implement proper state management
5. Improve maintainability and readability
6. Support multiple control schemes (keyboard and mouse)

## Detailed Refactoring Plan

### Phase 1: Extract Game Engine Logic - Detailed Implementation Plan

#### 1. Create Core Game Engine Module (`/src/engine/GameEngine.ts`)

**Purpose:** Centralize game loop logic and provide a clean interface for React components.

**Implementation Tasks:**
- Create a new TypeScript class `GameEngine` that will:
  - Manage the main game loop using requestAnimationFrame
  - Provide methods to start/stop/pause the game
  - Handle the game state updates at a fixed time step
  - Process input from different control schemes

**API Design:**
```typescript
class GameEngine {
  private gameState: GameState;
  private lastTimestamp: number = 0;
  private isRunning: boolean = false;
  private updateCallback: (state: GameState) => void;
  private physics: PhysicsSystem;
  private entityManager: EntityManager;

  constructor(initialState: GameState, updateCallback: (state: GameState) => void) {
    this.gameState = initialState;
    this.updateCallback = updateCallback;
    this.physics = new PhysicsSystem();
    this.entityManager = new EntityManager();
  }

  public start(): void {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  public stop(): void {
    this.isRunning = false;
  }

  public pause(): void {
    this.isRunning = false;
  }

  public resume(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTimestamp = performance.now();
      requestAnimationFrame(this.gameLoop);
    }
  }

  public updateState(partialState: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...partialState };
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Update game state
    this.update(deltaTime);

    // Notify React component of state changes
    this.updateCallback(this.gameState);

    // Continue the loop
    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Process input and update entities
    this.processInput();
    this.updateEntities(deltaTime);
    this.checkCollisions();
    this.cleanupEntities();
  }

  private processInput(): void {
    // Handle input based on control scheme
    // Will delegate to control manager
  }

  private updateEntities(deltaTime: number): void {
    // Update player, enemies, projectiles, etc.
    this.entityManager.updateEntities(this.gameState, deltaTime);
  }

  private checkCollisions(): void {
    // Detect and handle collisions
    this.physics.handleCollisions(this.gameState);
  }

  private cleanupEntities(): void {
    // Remove inactive entities
    this.entityManager.cleanup(this.gameState);
  }
}
```

**Testing Strategy:**
- Create unit tests for GameEngine class
- Test game loop timing
- Test state updates
- Test start/stop/pause functionality

#### 2. Extract Physics System (`/src/engine/PhysicsSystem.ts`)

**Purpose:** Handle all collision detection, position calculations, and movement physics.

**Implementation Tasks:**
- Move collision detection logic from GameContainer.tsx
- Implement wrapping and boundary handling
- Create utility functions for different collision types

**API Design:**
```typescript
class PhysicsSystem {
  public handleCollisions(gameState: GameState): GameState {
    const newState = { ...gameState };
    
    // Handle projectile collisions
    newState.projectiles = this.handleProjectileCollisions(newState);
    
    // Handle tank collisions
    this.handleTankCollisions(newState);
    
    // Handle power-up collisions
    newState.powerUps = this.handlePowerUpCollisions(newState);
    
    return newState;
  }

  public checkObstacleCollision(
    position: Position,
    width: number,
    obstacles: GameObject[]
  ): CollisionResult {
    // Existing collision detection logic
  }

  public isColliding(obj1: GameObject, obj2: GameObject): boolean {
    // Circular collision detection
  }

  public isCollidingRectangles(rect1: GameObject, rect2: GameObject): boolean {
    // Rectangle collision detection
  }

  public calculateWrappedPosition(
    x: number,
    y: number,
    threshold: number,
    dimensions: { width: number; height: number }
  ): Position {
    // Position wrapping logic
  }

  private handleProjectileCollisions(gameState: GameState): Projectile[] {
    // Handle projectile collisions with tanks and obstacles
  }

  private handleTankCollisions(gameState: GameState): void {
    // Handle tank-to-tank collisions
  }

  private handlePowerUpCollisions(gameState: GameState): PowerUp[] {
    // Handle power-up collisions with player
  }
}
```

**Testing Strategy:**
- Unit test each collision detection method
- Test boundary wrapping with various scenarios
- Test complex collision scenarios (projectiles hitting tanks, tanks hitting obstacles)

#### 3. Extract Entity Management (`/src/engine/EntityManager.ts`)

**Purpose:** Manage entity lifecycles, spawning, and cleanup.

**Implementation Tasks:**
- Move entity creation/update/removal logic
- Create dedicated update methods for each entity type
- Implement entity lifecycle management

**API Design:**
```typescript
class EntityManager {
  public updateEntities(gameState: GameState, deltaTime: number): GameState {
    const newState = { ...gameState };
    
    // Update player
    newState.player = this.updatePlayer(newState.player, deltaTime, gameState);
    
    // Update enemies
    newState.enemies = this.updateEnemies(newState.enemies, newState.player, deltaTime, gameState);
    
    // Update projectiles
    newState.projectiles = this.updateProjectiles(newState.projectiles, deltaTime, gameState);
    
    // Update power-ups
    newState.powerUps = this.updatePowerUps(newState.powerUps, deltaTime);
    
    return newState;
  }

  public spawnEnemy(
    position: Position,
    dimensions: { width: number; height: number },
    speedIncrease: number
  ): Tank {
    // Enemy creation logic
  }

  public createProjectile(
    position: Position,
    rotation: number,
    owner: 'player' | 'enemy'
  ): Projectile {
    // Projectile creation logic
  }

  public generatePowerUp(
    dimensions: { width: number; height: number },
    obstacles: GameObject[]
  ): PowerUp | null {
    // Power-up generation logic
  }

  public cleanup(gameState: GameState): GameState {
    // Remove inactive entities
    return {
      ...gameState,
      projectiles: gameState.projectiles.filter(p => p.isActive),
      enemies: gameState.enemies.filter(e => e.health > 0),
      powerUps: gameState.powerUps.filter(p => p.isActive),
      obstacles: gameState.obstacles.filter(o => !o.isDestructible || o.health > 0)
    };
  }

  private updatePlayer(player: Tank, deltaTime: number, gameState: GameState): Tank {
    // Player update logic
  }

  private updateEnemies(
    enemies: Tank[],
    player: Tank,
    deltaTime: number,
    gameState: GameState
  ): Tank[] {
    // Enemy update logic
  }

  private updateProjectiles(
    projectiles: Projectile[],
    deltaTime: number,
    gameState: GameState
  ): Projectile[] {
    // Projectile update logic
  }

  private updatePowerUps(powerUps: PowerUp[], deltaTime: number): PowerUp[] {
    // Power-up update logic
  }
}
```

**Testing Strategy:**
- Test entity creation functions
- Test update methods for each entity type
- Test cleanup logic
- Test entity lifecycle management (creation to removal)

#### 4. Integration Plan for Phase 1

**Step 1: Create Type Definitions**
- Create or update types in `/src/types/game.ts` to support new engine components

**Step 2: Implement Core Modules**
- Implement PhysicsSystem.ts
- Implement EntityManager.ts
- Implement GameEngine.ts

**Step 3: Create Integration Tests**
- Test interactions between modules
- Verify behavior matches original implementation

**Step 4: Refactor GameContainer.tsx to Use New Engine**
- Replace game loop with GameEngine instance
- Update rendering to use engine state
- Maintain current functionality

#### 5. Detailed Testing Plan for Phase 1

##### Unit Testing Framework Setup
```typescript
// /src/tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(callback => {
  return setTimeout(() => callback(performance.now()), 16);
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = vi.fn(id => {
  clearTimeout(id);
});

// Mock performance.now
if (typeof performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now())
  } as Performance;
}
```

##### 1. GameEngine Unit Tests
```typescript
// /src/tests/engine/GameEngine.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../engine/GameEngine';
import { initialGameState } from '../../constants/game';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let updateCallback: vi.Mock;
  
  beforeEach(() => {
    vi.useFakeTimers();
    updateCallback = vi.fn();
    gameEngine = new GameEngine({...initialGameState}, updateCallback);
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });
  
  it('should initialize with correct state', () => {
    expect(gameEngine['gameState']).toEqual(initialGameState);
    expect(gameEngine['isRunning']).toBe(false);
  });
  
  it('should start the game loop when start is called', () => {
    const spy = vi.spyOn(global, 'requestAnimationFrame');
    gameEngine.start();
    expect(gameEngine['isRunning']).toBe(true);
    expect(spy).toHaveBeenCalled();
  });
  
  it('should stop the game loop when stop is called', () => {
    gameEngine.start();
    gameEngine.stop();
    expect(gameEngine['isRunning']).toBe(false);
  });
  
  it('should update state correctly', () => {
    const newState = { score: 100 };
    gameEngine.updateState(newState);
    expect(gameEngine['gameState'].score).toBe(100);
  });
  
  it('should call updateCallback with updated state during game loop', () => {
    gameEngine.start();
    // Advance timer to trigger animation frame
    vi.advanceTimersByTime(16);
    expect(updateCallback).toHaveBeenCalledWith(expect.objectContaining(gameEngine['gameState']));
  });
  
  it('should call all update methods in each game loop iteration', () => {
    const processInputSpy = vi.spyOn(gameEngine as any, 'processInput');
    const updateEntitiesSpy = vi.spyOn(gameEngine as any, 'updateEntities');
    const checkCollisionsSpy = vi.spyOn(gameEngine as any, 'checkCollisions');
    const cleanupEntitiesSpy = vi.spyOn(gameEngine as any, 'cleanupEntities');
    
    gameEngine.start();
    vi.advanceTimersByTime(16);
    
    expect(processInputSpy).toHaveBeenCalled();
    expect(updateEntitiesSpy).toHaveBeenCalled();
    expect(checkCollisionsSpy).toHaveBeenCalled();
    expect(cleanupEntitiesSpy).toHaveBeenCalled();
  });
});
```

##### 2. PhysicsSystem Unit Tests
```typescript
// /src/tests/engine/PhysicsSystem.test.ts
import { describe, it, expect } from 'vitest';
import { PhysicsSystem } from '../../engine/PhysicsSystem';
import { GameObject, Position } from '../../types/game';

describe('PhysicsSystem', () => {
  let physicsSystem: PhysicsSystem;
  
  beforeEach(() => {
    physicsSystem = new PhysicsSystem();
  });
  
  describe('collision detection', () => {
    it('should correctly detect circular collision between two objects', () => {
      const obj1: GameObject = {
        position: { x: 100, y: 100 },
        width: 40,
        height: 40
      };
      
      const obj2: GameObject = {
        position: { x: 120, y: 120 },
        width: 40,
        height: 40
      };
      
      expect(physicsSystem.isColliding(obj1, obj2)).toBe(true);
      
      // Test non-colliding objects
      const obj3: GameObject = {
        position: { x: 200, y: 200 },
        width: 40,
        height: 40
      };
      
      expect(physicsSystem.isColliding(obj1, obj3)).toBe(false);
    });
    
    it('should correctly detect rectangular collision', () => {
      const rect1: GameObject = {
        position: { x: 100, y: 100 },
        width: 50,
        height: 50
      };
      
      const rect2: GameObject = {
        position: { x: 125, y: 125 },
        width: 50,
        height: 50
      };
      
      expect(physicsSystem.isCollidingRectangles(rect1, rect2)).toBe(true);
      
      // Test non-colliding rectangles
      const rect3: GameObject = {
        position: { x: 200, y: 200 },
        width: 50,
        height: 50
      };
      
      expect(physicsSystem.isCollidingRectangles(rect1, rect3)).toBe(false);
    });
  });
  
  describe('position wrapping', () => {
    it('should wrap positions correctly at screen boundaries', () => {
      const dimensions = { width: 800, height: 600 };
      
      // Test wrapping beyond right edge
      const pos1 = physicsSystem.calculateWrappedPosition(850, 300, 40, dimensions);
      expect(pos1).toEqual({ x: -40, y: 300 });
      
      // Test wrapping beyond left edge
      const pos2 = physicsSystem.calculateWrappedPosition(-50, 300, 40, dimensions);
      expect(pos2).toEqual({ x: 800 + 40, y: 300 });
      
      // Test wrapping beyond bottom edge
      const pos3 = physicsSystem.calculateWrappedPosition(400, 650, 40, dimensions);
      expect(pos3).toEqual({ x: 400, y: -40 });
      
      // Test wrapping beyond top edge
      const pos4 = physicsSystem.calculateWrappedPosition(400, -50, 40, dimensions);
      expect(pos4).toEqual({ x: 400, y: 600 + 40 });
    });
  });
  
  describe('obstacle collision', () => {
    it('should detect collisions with obstacles', () => {
      const position: Position = { x: 100, y: 100 };
      const width = 40;
      const obstacles: GameObject[] = [
        { position: { x: 120, y: 120 }, width: 50, height: 50 }
      ];
      
      const result = physicsSystem.checkObstacleCollision(position, width, obstacles);
      expect(result.collided).toBe(true);
      
      // Test non-colliding position
      const nonCollidingPosition: Position = { x: 200, y: 200 };
      const nonCollidingResult = physicsSystem.checkObstacleCollision(nonCollidingPosition, width, obstacles);
      expect(nonCollidingResult.collided).toBe(false);
    });
  });
  
  describe('handleCollisions', () => {
    it('should process all collision types when handling collisions', () => {
      // Mock the methods to verify they're called
      const handleProjectileCollisionsSpy = vi.spyOn(physicsSystem as any, 'handleProjectileCollisions');
      const handleTankCollisionsSpy = vi.spyOn(physicsSystem as any, 'handleTankCollisions');
      const handlePowerUpCollisionsSpy = vi.spyOn(physicsSystem as any, 'handlePowerUpCollisions');
      
      const mockGameState = {
        player: { position: { x: 100, y: 100 }, width: 40, height: 40, health: 100 },
        enemies: [],
        projectiles: [],
        powerUps: [],
        obstacles: []
      };
      
      physicsSystem.handleCollisions(mockGameState);
      
      expect(handleProjectileCollisionsSpy).toHaveBeenCalled();
      expect(handleTankCollisionsSpy).toHaveBeenCalled();
      expect(handlePowerUpCollisionsSpy).toHaveBeenCalled();
    });
  });
});
```

##### 3. EntityManager Unit Tests
```typescript
// /src/tests/engine/EntityManager.test.ts
import { describe, it, expect, vi } from 'vitest';
import { EntityManager } from '../../engine/EntityManager';
import { GameState, Tank, Projectile, PowerUp } from '../../types/game';

describe('EntityManager', () => {
  let entityManager: EntityManager;
  
  beforeEach(() => {
    entityManager = new EntityManager();
  });
  
  describe('spawnEnemy', () => {
    it('should create a new enemy with correct properties', () => {
      const position = { x: 100, y: 100 };
      const dimensions = { width: 800, height: 600 };
      const speedIncrease = 0.5;
      
      const enemy = entityManager.spawnEnemy(position, dimensions, speedIncrease);
      
      expect(enemy).toHaveProperty('position', position);
      expect(enemy).toHaveProperty('health');
      expect(enemy).toHaveProperty('speed');
      expect(enemy.speed).toBeGreaterThan(0); // Speed should be positive
    });
  });
  
  describe('createProjectile', () => {
    it('should create a new projectile with correct properties', () => {
      const position = { x: 100, y: 100 };
      const rotation = 1.5;
      const owner = 'player';
      
      const projectile = entityManager.createProjectile(position, rotation, owner);
      
      expect(projectile).toHaveProperty('position', position);
      expect(projectile).toHaveProperty('rotation', rotation);
      expect(projectile).toHaveProperty('owner', owner);
      expect(projectile).toHaveProperty('isActive', true);
    });
  });
  
  describe('generatePowerUp', () => {
    it('should create a new power-up with correct properties', () => {
      const dimensions = { width: 800, height: 600 };
      const obstacles = [];
      
      const powerUp = entityManager.generatePowerUp(dimensions, obstacles);
      
      // Could be null if random position couldn't be found
      if (powerUp) {
        expect(powerUp).toHaveProperty('position');
        expect(powerUp).toHaveProperty('type');
        expect(powerUp).toHaveProperty('isActive', true);
        expect(['health', 'speed', 'rapidFire', 'shield']).toContain(powerUp.type);
      }
    });
  });
  
  describe('cleanup', () => {
    it('should remove inactive entities', () => {
      const gameState: GameState = {
        player: {} as Tank,
        enemies: [
          { health: 0 } as Tank,
          { health: 50 } as Tank
        ],
        projectiles: [
          { isActive: false } as Projectile,
          { isActive: true } as Projectile
        ],
        powerUps: [
          { isActive: false } as PowerUp,
          { isActive: true } as PowerUp
        ],
        obstacles: [],
        score: 0,
        isGameOver: false,
        isPaused: false,
        powerUpEffects: { speed: 1, shield: false, rapidFire: false },
        controls: { scheme: 'keyboard', mouseSensitivity: 1, invertY: false }
      };
      
      const cleanedState = entityManager.cleanup(gameState);
      
      expect(cleanedState.enemies.length).toBe(1);
      expect(cleanedState.projectiles.length).toBe(1);
      expect(cleanedState.powerUps.length).toBe(1);
    });
  });
  
  describe('updateEntities', () => {
    it('should call all entity update methods', () => {
      const updatePlayerSpy = vi.spyOn(entityManager as any, 'updatePlayer');
      const updateEnemiesSpy = vi.spyOn(entityManager as any, 'updateEnemies');
      const updateProjectilesSpy = vi.spyOn(entityManager as any, 'updateProjectiles');
      const updatePowerUpsSpy = vi.spyOn(entityManager as any, 'updatePowerUps');
      
      const mockGameState: GameState = {
        player: {} as Tank,
        enemies: [],
        projectiles: [],
        powerUps: [],
        obstacles: [],
        score: 0,
        isGameOver: false,
        isPaused: false,
        powerUpEffects: { speed: 1, shield: false, rapidFire: false },
        controls: { scheme: 'keyboard', mouseSensitivity: 1, invertY: false }
      };
      
      entityManager.updateEntities(mockGameState, 16);
      
      expect(updatePlayerSpy).toHaveBeenCalled();
      expect(updateEnemiesSpy).toHaveBeenCalled();
      expect(updateProjectilesSpy).toHaveBeenCalled();
      expect(updatePowerUpsSpy).toHaveBeenCalled();
    });
  });
});
```

##### 4. Integration Tests

```typescript
// /src/tests/engine/integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameEngine } from '../../engine/GameEngine';
import { PhysicsSystem } from '../../engine/PhysicsSystem';
import { EntityManager } from '../../engine/EntityManager';
import { initialGameState } from '../../constants/game';

describe('Game Engine Integration', () => {
  let gameEngine: GameEngine;
  let updateCallback: vi.Mock;

  beforeEach(() => {
    updateCallback = vi.fn();
    gameEngine = new GameEngine({...initialGameState}, updateCallback);
  });

  it('should handle a complete game cycle', () => {
    // Setup test data - player moving and enemies present
    const testState = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        position: { x: 100, y: 100 }
      },
      enemies: [
        {
          position: { x: 300, y: 300 },
          rotation: 0,
          width: 40,
          height: 40,
          health: 100,
          maxHealth: 100,
          speed: 2,
          rotationSpeed: 0.05,
          cooldown: 0,
          maxCooldown: 30,
          isPlayer: false
        }
      ]
    };

    // Update game state with test data
    gameEngine.updateState(testState);

    // Start the game and run one cycle
    gameEngine.start();
    vi.advanceTimersByTime(16);

    // Verify the callback was called with updated state
    expect(updateCallback).toHaveBeenCalled();
    
    // Verify state changes - entity positions should update
    const updatedState = updateCallback.mock.calls[0][0];
    
    // Player position should have potentially changed based on input
    // This is harder to test precisely because input depends on the input system
    expect(updatedState).toBeDefined();
    
    // Game loop should continue running
    vi.advanceTimersByTime(16);
    expect(updateCallback).toHaveBeenCalledTimes(2);
  });

  it('should handle collisions correctly', () => {
    // Create a test state with a player and projectile about to collide
    const testState = {
      ...initialGameState,
      player: {
        ...initialGameState.player,
        position: { x: 100, y: 100 },
        width: 40,
        height: 40,
        health: 100
      },
      projectiles: [
        {
          position: { x: 105, y: 105 }, // Close enough to collide
          rotation: 0,
          width: 10,
          height: 10,
          speed: 5,
          damage: 20,
          isActive: true,
          distanceTraveled: 0,
          owner: 'enemy'
        }
      ]
    };

    // Update game state with test data
    gameEngine.updateState(testState);

    // Run one game cycle
    gameEngine.start();
    vi.advanceTimersByTime(16);

    // Verify player health is reduced due to collision
    const updatedState = updateCallback.mock.calls[0][0];
    expect(updatedState.player.health).toBeLessThan(100);
    
    // Projectile should become inactive after collision
    expect(updatedState.projectiles[0].isActive).toBe(false);
  });

  it('should handle entity spawning and removal', () => {
    // Start with empty state
    const testState = {
      ...initialGameState,
      enemies: [],
      projectiles: [],
      powerUps: []
    };

    gameEngine.updateState(testState);
    
    // Mock the entity manager to simulate entity creation
    const spawnEnemySpy = vi.spyOn(gameEngine['entityManager'], 'spawnEnemy');
    spawnEnemySpy.mockReturnValue({
      position: { x: 200, y: 200 },
      rotation: 0,
      width: 40,
      height: 40,
      health: 100,
      maxHealth: 100,
      speed: 2,
      rotationSpeed: 0.05,
      cooldown: 0,
      maxCooldown: 30,
      isPlayer: false
    });

    // Trigger a function that would spawn an enemy
    // This depends on implementation details, but could be:
    gameEngine['entityManager'].updateEntities(gameEngine['gameState'], 16);
    
    // Verify enemy was created
    expect(spawnEnemySpy).toHaveBeenCalled();
    
    // Run a game cycle
    gameEngine.start();
    vi.advanceTimersByTime(16);
    
    // Check that entities were updated in the state
    const updatedState = updateCallback.mock.calls[0][0];
    expect(updatedState).toBeDefined();
  });
});
```

##### 5. End-to-End Testing with React Component

```typescript
// /src/tests/components/GameWithEngine.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GameContainer from '../../components/game/GameContainer';
import { GameEngine } from '../../engine/GameEngine';

// Mock the Canvas component to avoid WebGL context issues
vi.mock('../../components/game/Canvas', () => ({
  default: ({ draw, width, height, onClick }) => (
    <canvas 
      data-testid="mock-canvas"
      width={width}
      height={height}
      onClick={onClick}
    />
  )
}));

// Mock the engine
vi.mock('../../engine/GameEngine');

describe('GameContainer with GameEngine', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock implementation for GameEngine
    (GameEngine as any).mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      updateState: vi.fn()
    }));
  });
  
  it('should create and start GameEngine when game starts', () => {
    render(<GameContainer />);
    
    // Find and click the start button
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Verify GameEngine was instantiated and started
    expect(GameEngine).toHaveBeenCalled();
    expect(GameEngine.mock.instances[0].start).toHaveBeenCalled();
  });
  
  it('should pause GameEngine when game is paused', () => {
    render(<GameContainer />);
    
    // Start the game
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Simulate pressing Escape to pause
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Verify GameEngine was paused
    expect(GameEngine.mock.instances[0].pause).toHaveBeenCalled();
  });
  
  it('should render game elements based on engine state', () => {
    // This is challenging to test and might require more specific mocking
    // of the game state and rendering pipeline
    
    // The idea would be to:
    // 1. Setup a specific game state with known entities
    // 2. Mock the engine to return this state
    // 3. Verify the Canvas draw function renders these entities
    
    // This level of testing might be better done manually or with 
    // more targeted rendering tests for specific game elements
  });
});
```

#### 6. Rollback Plan

If issues arise during implementation:
- Keep original code in separate files
- Toggle between implementations using feature flags
- Implement gradual migration for components that work correctly

## Implementation Strategy

1. **Incremental Approach**
   - Refactor one module at a time
   - Maintain working game at each step
   - Add comprehensive tests for each module

2. **Testing Strategy**
   - Create unit tests for game logic
   - Implement integration tests for component interaction
   - Manual testing for gameplay feel

3. **Documentation**
   - Add JSDoc comments to all functions and components
   - Create architecture documentation
   - Document control schemes and customization options

## Execution Timeline

1. **Phase 1** - Extract core game engine logic
2. **Phase 2** - Implement improved state management
3. **Phase 3** - Refactor UI components
4. **Phase 4** - Rebuild GameContainer.tsx
5. **Phase 5** - Enhance control schemes

This plan provides a structured approach to refactoring the GameContainer.tsx file while maintaining all functionality and adding support for multiple control schemes. Each phase builds on the previous one, allowing for incremental improvements without breaking the game.