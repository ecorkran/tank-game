# Detailed Implementation Guide for Tank Game

## Task 1: Initialize a Next.js project with TypeScript

1. Open a terminal window
2. Navigate to the tank-game directory
3. Run the command: `npx create-next-app@latest .`
4. When prompted:
   - Would you like to use TypeScript? → Yes
   - Would you like to use ESLint? → Yes
   - Would you like to use Tailwind CSS? → Yes
   - Would you like to use `src/` directory? → Yes
   - Would you like to use App Router? → Yes
   - Would you like to customize the default import alias (@/*)? → No
5. Wait for installation to complete

## Task 2: Set up project structure

1. Create the following directories if they don't exist:
   - `src/components`
   - `src/components/game`
   - `src/lib`
   - `src/types`
   - `src/hooks`
   - `src/styles`
   - `public/assets`
   - `public/assets/sprites`
   - `public/assets/sounds`

2. Create a file named `src/types/game.ts` with the following content:
```typescript
export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  position: Position;
  rotation: number;
  width: number;
  height: number;
}

export interface Tank extends GameObject {
  health: number;
  maxHealth: number;
  speed: number;
  rotationSpeed: number;
  cooldown: number;
  maxCooldown: number;
  isPlayer: boolean;
}

export interface Projectile extends GameObject {
  speed: number;
  damage: number;
  isActive: boolean;
}

export interface Obstacle extends GameObject {
  isDestructible: boolean;
}

export interface GameState {
  player: Tank;
  enemies: Tank[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
}
```

## Task 3: Create a canvas component

1. Create file `src/components/game/Canvas.tsx` with:
```tsx
'use client';

import React, { useRef, useEffect } from 'react';
import styles from '@/styles/Canvas.module.css';

interface CanvasProps {
  draw: (context: CanvasRenderingContext2D, frameCount: number) => void;
  width?: number;
  height?: number;
}

const Canvas: React.FC<CanvasProps> = ({ draw, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    let frameCount = 0;
    let animationFrameId: number;
    
    const render = () => {
      frameCount++;
      draw(context, frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);
  
  return (
    <canvas 
      ref={canvasRef}
      width={width || window.innerWidth}
      height={height || window.innerHeight}
      className={styles.canvas}
    />
  );
};

export default Canvas;
```

2. Create file `src/styles/Canvas.module.css` with:
```css
.canvas {
  display: block;
  background-color: #222;
  touch-action: none;
}
```

## Task 4: Implement a responsive game container

1. Create file `src/components/game/GameContainer.tsx` with:
```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import { GameState } from '@/types/game';
import styles from '@/styles/GameContainer.module.css';

const initialGameState: GameState = {
  player: {
    position: { x: 100, y: 100 },
    rotation: 0,
    width: 40,
    height: 40,
    health: 100,
    maxHealth: 100,
    speed: 3,
    rotationSpeed: 0.05,
    cooldown: 0,
    maxCooldown: 30,
    isPlayer: true
  },
  enemies: [],
  projectiles: [],
  obstacles: [],
  score: 0,
  isGameOver: false,
  isPaused: false
};

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 800, 
    height: typeof window !== 'undefined' ? window.innerHeight : 600 
  });
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    // Clear the canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw player tank
    ctx.save();
    ctx.translate(gameState.player.position.x, gameState.player.position.y);
    ctx.rotate(gameState.player.rotation);
    ctx.fillStyle = 'green';
    ctx.fillRect(-20, -15, 40, 30);
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(0, -5, 30, 10);
    ctx.restore();
    
    // Draw basic text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 50);
    
  }, [gameState, dimensions]);
  
  return (
    <div className={styles.gameContainer}>
      <Canvas draw={draw} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default GameContainer;
```

2. Create file `src/styles/GameContainer.module.css` with:
```css
.gameContainer {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
```

## Task 5: Create the main page

1. Replace contents of `src/app/page.tsx` with:
```tsx
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the game component with no SSR
const GameContainer = dynamic(
  () => import('@/components/game/GameContainer'),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <GameContainer />
    </main>
  );
}
```

2. Replace contents of `src/app/globals.css` with:
```css
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-hidden;
  height: 100%;
}

body {
  background-color: #000;
  color: #fff;
}
```

## Task 6: Implement input handling

1. Create a new file `src/hooks/useInput.ts` with:
```typescript
import { useState, useEffect } from 'react';

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

export const useInput = () => {
  const [inputState, setInputState] = useState<InputState>({
    keys: {},
    mousePosition: { x: 0, y: 0 },
    mouseDown: false
  });
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setInputState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.key.toLowerCase()]: true }
      }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setInputState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.key.toLowerCase()]: false }
      }));
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setInputState(prev => ({
        ...prev,
        mousePosition: { x: e.clientX, y: e.clientY }
      }));
    };
    
    const handleMouseDown = () => {
      setInputState(prev => ({
        ...prev,
        mouseDown: true
      }));
    };
    
    const handleMouseUp = () => {
      setInputState(prev => ({
        ...prev,
        mouseDown: false
      }));
    };
    
    // Touch events for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setInputState(prev => ({
          ...prev,
          mousePosition: { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
          }
        }));
      }
    };
    
    const handleTouchStart = () => {
      setInputState(prev => ({
        ...prev,
        mouseDown: true
      }));
    };
    
    const handleTouchEnd = () => {
      setInputState(prev => ({
        ...prev,
        mouseDown: false
      }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  return inputState;
};
```

## Task 7: Update GameContainer with movement and rotation

1. Update `src/components/game/GameContainer.tsx` to include movement logic:
```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import { GameState, Projectile } from '@/types/game';
import { useInput } from '@/hooks/useInput';
import styles from '@/styles/GameContainer.module.css';

const initialGameState: GameState = {
  player: {
    position: { x: 100, y: 100 },
    rotation: 0,
    width: 40,
    height: 40,
    health: 100,
    maxHealth: 100,
    speed: 3,
    rotationSpeed: 0.05,
    cooldown: 0,
    maxCooldown: 30,
    isPlayer: true
  },
  enemies: [],
  projectiles: [],
  obstacles: [],
  score: 0,
  isGameOver: false,
  isPaused: false
};

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 800, 
    height: typeof window !== 'undefined' ? window.innerHeight : 600 
  });
  
  const inputState = useInput();
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Game update logic
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        const newState = { ...prevState };
        
        // Movement logic
        const { keys, mousePosition } = inputState;
        const player = { ...newState.player };
        
        // Keyboard movement (WASD or Arrow keys)
        let dx = 0;
        let dy = 0;
        
        if (keys['w'] || keys['arrowup']) dy -= player.speed;
        if (keys['s'] || keys['arrowdown']) dy += player.speed;
        if (keys['a'] || keys['arrowleft']) dx -= player.speed;
        if (keys['d'] || keys['arrowright']) dx += player.speed;
        
        // Apply diagonal movement normalization
        if (dx !== 0 && dy !== 0) {
          const factor = 1 / Math.sqrt(2);
          dx *= factor;
          dy *= factor;
        }
        
        player.position.x += dx;
        player.position.y += dy;
        
        // Keep player within boundaries
        player.position.x = Math.max(20, Math.min(dimensions.width - 20, player.position.x));
        player.position.y = Math.max(20, Math.min(dimensions.height - 20, player.position.y));
        
        // Calculate rotation to face mouse
        const dx2 = mousePosition.x - player.position.x;
        const dy2 = mousePosition.y - player.position.y;
        player.rotation = Math.atan2(dy2, dx2);
        
        // Handle shooting
        if (inputState.mouseDown && player.cooldown <= 0) {
          // Create new projectile
          const projectile: Projectile = {
            position: {
              x: player.position.x + Math.cos(player.rotation) * 30,
              y: player.position.y + Math.sin(player.rotation) * 30
            },
            rotation: player.rotation,
            width: 5,
            height: 5,
            speed: 10,
            damage: 20,
            isActive: true
          };
          
          newState.projectiles.push(projectile);
          player.cooldown = player.maxCooldown;
        }
        
        // Update cooldown
        if (player.cooldown > 0) {
          player.cooldown--;
        }
        
        // Update projectiles
        const updatedProjectiles = newState.projectiles
          .map(projectile => {
            if (!projectile.isActive) return projectile;
            
            const newPosition = {
              x: projectile.position.x + Math.cos(projectile.rotation) * projectile.speed,
              y: projectile.position.y + Math.sin(projectile.rotation) * projectile.speed
            };
            
            // Check if projectile is out of bounds
            if (
              newPosition.x < 0 ||
              newPosition.x > dimensions.width ||
              newPosition.y < 0 ||
              newPosition.y > dimensions.height
            ) {
              return { ...projectile, isActive: false };
            }
            
            return {
              ...projectile,
              position: newPosition
            };
          })
          .filter(projectile => projectile.isActive);
        
        newState.player = player;
        newState.projectiles = updatedProjectiles;
        
        return newState;
      });
    }, 1000 / 60); // 60 FPS
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [inputState, dimensions]);
  
  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    // Clear the canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw player tank
    ctx.save();
    ctx.translate(gameState.player.position.x, gameState.player.position.y);
    ctx.rotate(gameState.player.rotation);
    
    // Tank body
    ctx.fillStyle = 'green';
    ctx.fillRect(-20, -15, 40, 30);
    
    // Tank barrel
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(0, -5, 30, 10);
    
    ctx.restore();
    
    // Draw projectiles
    ctx.fillStyle = 'yellow';
    gameState.projectiles.forEach(projectile => {
      ctx.beginPath();
      ctx.arc(
        projectile.position.x,
        projectile.position.y,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    
    // Draw UI
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    
    // Health bar background
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 40, 100, 10);
    
    // Health bar foreground
    ctx.fillStyle = 'green';
    const healthWidth = (gameState.player.health / gameState.player.maxHealth) * 100;
    ctx.fillRect(10, 40, healthWidth, 10);
    
  }, [gameState, dimensions]);
  
  return (
    <div className={styles.gameContainer}>
      <Canvas draw={draw} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default GameContainer;
```

## Task 8: Add enemy tanks

1. Create a new file `src/lib/enemies.ts` with:
```typescript
import { Tank, Position } from '@/types/game';

export const createEnemy = (
  position: Position, 
  canvasWidth: number, 
  canvasHeight: number
): Tank => {
  return {
    position,
    rotation: Math.random() * Math.PI * 2,
    width: 40,
    height: 40,
    health: 50,
    maxHealth: 50,
    speed: 1 + Math.random(),
    rotationSpeed: 0.02 + Math.random() * 0.02,
    cooldown: Math.floor(Math.random() * 60),
    maxCooldown: 120,
    isPlayer: false
  };
};

export const updateEnemy = (
  enemy: Tank, 
  playerPosition: Position,
  canvasWidth: number,
  canvasHeight: number
): Tank => {
  const newEnemy = { ...enemy };
  
  // Calculate angle to player
  const dx = playerPosition.x - enemy.position.x;
  const dy = playerPosition.y - enemy.position.y;
  const angleToPlayer = Math.atan2(dy, dx);
  
  // Rotate towards player with some randomness
  const targetRotation = angleToPlayer + (Math.random() - 0.5) * 0.2;
  
  // Gradually rotate towards target rotation
  let rotationDiff = targetRotation - enemy.rotation;
  
  // Handle angle wrapping
  if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
  if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
  
  if (Math.abs(rotationDiff) < enemy.rotationSpeed) {
    newEnemy.rotation = targetRotation;
  } else {
    newEnemy.rotation += Math.sign(rotationDiff) * enemy.rotationSpeed;
  }
  
  // Movement
  const moveChance = 0.7; // 70% chance to move forward
  if (Math.random() < moveChance) {
    newEnemy.position.x += Math.cos(newEnemy.rotation) * newEnemy.speed;
    newEnemy.position.y += Math.sin(newEnemy.rotation) * newEnemy.speed;
  }
  
  // Keep within boundaries
  newEnemy.position.x = Math.max(20, Math.min(canvasWidth - 20, newEnemy.position.x));
  newEnemy.position.y = Math.max(20, Math.min(canvasHeight - 20, newEnemy.position.y));
  
  // Update cooldown
  if (newEnemy.cooldown > 0) {
    newEnemy.cooldown--;
  }
  
  return newEnemy;
};
```

2. Update `src/components/game/GameContainer.tsx` to include enemy logic:
```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import { GameState, Projectile, Tank } from '@/types/game';
import { useInput } from '@/hooks/useInput';
import { createEnemy, updateEnemy } from '@/lib/enemies';
import styles from '@/styles/GameContainer.module.css';

// ... (keep initialGameState the same)

const GameContainer: React.FC = () => {
  // ... (keep existing state and hooks)
  
  // Spawn enemies at random intervals
  useEffect(() => {
    const spawnEnemy = () => {
      setGameState(prevState => {
        // Don't spawn more than 5 enemies
        if (prevState.enemies.length >= 5) return prevState;
        
        // Spawn enemy at random edge position
        let position;
        const side = Math.floor(Math.random() * 4);
        
        switch (side) {
          case 0: // Top
            position = { x: Math.random() * dimensions.width, y: 0 };
            break;
          case 1: // Right
            position = { x: dimensions.width, y: Math.random() * dimensions.height };
            break;
          case 2: // Bottom
            position = { x: Math.random() * dimensions.width, y: dimensions.height };
            break;
          case 3: // Left
            position = { x: 0, y: Math.random() * dimensions.height };
            break;
          default:
            position = { x: 0, y: 0 };
        }
        
        const newEnemy = createEnemy(position, dimensions.width, dimensions.height);
        
        return {
          ...prevState,
          enemies: [...prevState.enemies, newEnemy]
        };
      });
    };
    
    // Spawn an enemy every 3-10 seconds
    const spawnInterval = setInterval(() => {
      spawnEnemy();
    }, 3000 + Math.random() * 7000);
    
    return () => {
      clearInterval(spawnInterval);
    };
  }, [dimensions]);
  
  // Game update logic
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        // If game is over, don't update
        if (prevState.isGameOver) return prevState;
        
        const newState = { ...prevState };
        
        // ... (keep existing player movement logic)
        
        // Update enemies
        const updatedEnemies = newState.enemies.map(enemy => {
          const updatedEnemy = updateEnemy(
            enemy,
            newState.player.position,
            dimensions.width,
            dimensions.height
          );
          
          // Enemy firing logic
          if (updatedEnemy.cooldown <= 0) {
            // Calculate distance to player
            const dx = newState.player.position.x - updatedEnemy.position.x;
            const dy = newState.player.position.y - updatedEnemy.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Fire if within range (with some randomness)
            if (distance < 300 && Math.random() < 0.3) {
              const projectile: Projectile = {
                position: {
                  x: updatedEnemy.position.x + Math.cos(updatedEnemy.rotation) * 30,
                  y: updatedEnemy.position.y + Math.sin(updatedEnemy.rotation) * 30
                },
                rotation: updatedEnemy.rotation,
                width: 5,
                height: 5,
                speed: 7,
                damage: 10,
                isActive: true
              };
              
              newState.projectiles.push(projectile);
              updatedEnemy.cooldown = updatedEnemy.maxCooldown;
            }
          }
          
          return updatedEnemy;
        });
        
        // ... (keep projectile update logic)
        
        // Check collision between projectiles and tanks
        const collidedProjectiles: number[] = [];
        const updatedPlayerHealth = { ...newState.player };
        const updatedEnemiesAfterCollision = updatedEnemies.map((enemy, enemyIndex) => {
          newState.projectiles.forEach((projectile, projectileIndex) => {
            if (!projectile.isActive) return;
            
            // Check if projectile hit player
            if (
              isColliding(projectile, newState.player) &&
              projectile.position.x !== newState.player.position.x && 
              projectile.position.y !== newState.player.position.y
            ) {
              updatedPlayerHealth.health -= projectile.damage;
              collidedProjectiles.push(projectileIndex);
            }
            
            // Check if projectile hit enemy
            if (
              isColliding(projectile, enemy) && 
              projectile.position.x !== enemy.position.x && 
              projectile.position.y !== enemy.position.y
            ) {
              enemy.health -= projectile.damage;
              collidedProjectiles.push(projectileIndex);
              
              // If enemy is killed, increase score
              if (enemy.health <= 0) {
                newState.score += 100;
                return { ...enemy, health: 0 };
              }
            }
          });
          
          return enemy;
        }).filter(enemy => enemy.health > 0);
        
        // Remove collided projectiles
        const updatedProjectiles = newState.projectiles.filter((_, index) => 
          !collidedProjectiles.includes(index)
        );
        
        // Check if player is dead
        if (updatedPlayerHealth.health <= 0) {
          newState.isGameOver = true;
          updatedPlayerHealth.health = 0;
        }
        
        newState.player = updatedPlayerHealth;
        newState.enemies = updatedEnemiesAfterCollision;
        newState.projectiles = updatedProjectiles;
        
        return newState;
      });
    }, 1000 / 60);
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [inputState, dimensions]);
  
  // Collision detection helper
  const isColliding = (obj1: GameObject, obj2: GameObject) => {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.width + obj2.width) / 2;
  };
  
  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    // Clear the canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw player tank
    // ... (keep existing player drawing code)
    
    // Draw enemy tanks
    gameState.enemies.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.position.x, enemy.position.y);
      ctx.rotate(enemy.rotation);
      
      // Enemy tank body
      ctx.fillStyle = 'red';
      ctx.fillRect(-20, -15, 40, 30);
      
      // Enemy tank barrel
      ctx.fillStyle = 'darkred';
      ctx.fillRect(0, -5, 30, 10);
      
      ctx.restore();
      
      // Enemy health bar
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.position.x - 20, enemy.position.y - 30, 40, 5);
      ctx.fillStyle = 'green';
      ctx.fillRect(enemy.position.x - 20, enemy.position.y - 30, 40 * healthPercent, 5);
    });
    
    // ... (keep existing projectile and UI drawing code)
    
    // Game over screen
    if (gameState.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', dimensions.width / 2, dimensions.height / 2 - 40);
      
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, dimensions.width / 2, dimensions.height / 2 + 10);
      
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(dimensions.width / 2 - 100, dimensions.height / 2 + 50, 200, 50);
      
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Play Again', dimensions.width / 2, dimensions.height / 2 + 80);
    }
    
  }, [gameState, dimensions]);
  
  // Add click handler for "Play Again" button
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameState.isGameOver) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is on "Play Again" button
      if (
        x > dimensions.width / 2 - 100 &&
        x < dimensions.width / 2 + 100 &&
        y > dimensions.height / 2 + 50 &&
        y < dimensions.height / 2 + 100
      ) {
        setGameState(initialGameState);
      }
    }
  };
  
  return (
    <div className={styles.gameContainer} onClick={handleCanvasClick}>
      <Canvas draw={draw} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default GameContainer;
```

## Task 9: Add obstacles

1. Create a new file `src/lib/obstacles.ts` with:
```typescript
import { Obstacle, Position } from '@/types/game';

export const createObstacle = (
  position: Position,
  width: number,
  height: number,
  isDestructible: boolean = false
): Obstacle => {
  return {
    position,
    rotation: 0,
    width,
    height,
    isDestructible
  };
};

export const generateObstacles = (
  canvasWidth: number,
  canvasHeight: number,
  count: number = 10
): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const minSize = 40;
  const maxSize = 100;
  
  // Create border obstacles
  obstacles.push(createObstacle(
    { x: canvasWidth / 2, y: -10 },
    canvasWidth,
    20,
    false
  ));
  
  obstacles.push(createObstacle(
    { x: canvasWidth / 2, y: canvasHeight + 10 },
    canvasWidth,
    20,
    false
  ));
  
  obstacles.push(createObstacle(
    { x: -10, y: canvasHeight / 2 },
    20,
    canvasHeight,
    false
  ));
  
  obstacles.push(createObstacle(
    { x: canvasWidth + 10, y: canvasHeight / 2 },
    20,
    canvasHeight,
    false
  ));
  
  // Create random obstacles
  for (let i = 0; i < count; i++) {
    const size = minSize + Math.random() * (maxSize - minSize);
    const isDestructible = Math.random() > 0.7; // 30% chance to be destructible
    
    const x = Math.random() * (canvasWidth - size) + size / 2;
    const y = Math.random() * (canvasHeight - size) + size / 2;
    
    // Check if obstacle is too close to player spawn
    const distToPlayerSpawn = Math.sqrt(
      Math.pow(x - 100, 2) + Math.pow(y - 100, 2)
    );
    
    if (distToPlayerSpawn < 150) {
      // Try again if too close
      i--;
      continue;
    }
    
    obstacles.push(createObstacle(
      { x, y },
      size,
      size,
      isDestructible
    ));
  }
  
  return obstacles;
};
```

2. Update `src/components/game/GameContainer.tsx` to include obstacles:
```tsx
// Add imports
import { generateObstacles } from '@/lib/obstacles';

// Update initialGameState
const initialGameState: GameState = {
  player: {
    // ... (keep the same)
  },
  enemies: [],
  projectiles: [],
  obstacles: [],
  score: 0,
  isGameOver: false,
  isPaused: false
};

const GameContainer: React.FC = () => {
  // ... (keep existing state and hooks)
  
  // Generate obstacles when component mounts
  useEffect(() => {
    if (gameState.obstacles.length === 0) {
      setGameState(prevState => ({
        ...prevState,
        obstacles: generateObstacles(dimensions.width, dimensions.height, 8)
      }));
    }
  }, [dimensions, gameState.obstacles.length]);
  
  // Update collision checks in gameLoop to include obstacles
  // In the gameLoop useEffect, add these checks:
  
  // Check collisions with obstacles for player
  const obstacleCollision = checkObstacleCollision(
    { x: player.position.x + dx, y: player.position.y + dy },
    player.width,
    newState.obstacles
  );
  
  if (!obstacleCollision.collided) {
    player.position.x += dx;
    player.position.y += dy;
  } else {
    // Allow sliding along obstacles
    if (!obstacleCollision.collidedX) player.position.x += dx;
    if (!obstacleCollision.collidedY) player.position.y += dy;
  }
  
  // Check projectile collision with obstacles
  newState.projectiles = newState.projectiles.map(projectile => {
    if (!projectile.isActive) return projectile;
    
    const newPosition = {
      x: projectile.position.x + Math.cos(projectile.rotation) * projectile.speed,
      y: projectile.position.y + Math.sin(projectile.rotation) * projectile.speed
    };
    
    // Check if projectile hits obstacle
    for (const obstacle of newState.obstacles) {
      if (isCollidingRectangles(
        { position: newPosition, width: projectile.width, height: projectile.height },
        obstacle
      )) {
        // If obstacle is destructible, damage it
        if (obstacle.isDestructible) {
          obstacle.health -= projectile.damage;
        }
        return { ...projectile, isActive: false };
      }
    }
    
    return {
      ...projectile,
      position: newPosition
    };
  });
  
  // Filter out destroyed obstacles
  newState.obstacles = newState.obstacles.filter(obstacle => 
    !obstacle.isDestructible || obstacle.health > 0
  );
  
  // Add helper functions for collision detection
  const isCollidingRectangles = (rect1, rect2) => {
    return (
      rect1.position.x - rect1.width/2 < rect2.position.x + rect2.width/2 &&
      rect1.position.x + rect1.width/2 > rect2.position.x - rect2.width/2 &&
      rect1.position.y - rect1.height/2 < rect2.position.y + rect2.height/2 &&
      rect1.position.y + rect1.height/2 > rect2.position.y - rect2.height/2
    );
  };
  
  const checkObstacleCollision = (position, size, obstacles) => {
    let collidedX = false;
    let collidedY = false;
    
    for (const obstacle of obstacles) {
      const halfWidth = size/2 + obstacle.width/2;
      const halfHeight = size/2 + obstacle.height/2;
      
      const dx = Math.abs(position.x - obstacle.position.x);
      const dy = Math.abs(position.y - obstacle.position.y);
      
      if (dx < halfWidth && dy < halfHeight) {
        // Collision detected
        collidedX = dx < halfWidth;
        collidedY = dy < halfHeight;
        break;
      }
    }
    
    return {
      collided: collidedX || collidedY,
      collidedX,
      collidedY
    };
  };
  
  // Update draw function to include obstacles
  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    // ... (keep existing clear and player drawing code)
    
    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      if (obstacle.isDestructible) {
        // Destructible obstacles
        ctx.fillStyle = '#8B4513'; // Brown
      } else {
        // Indestructible obstacles
        ctx.fillStyle = '#444';
      }
      
      ctx.fillRect(
        obstacle.position.x - obstacle.width/2,
        obstacle.position.y - obstacle.height/2,
        obstacle.width,
        obstacle.height
      );
      
      // Add texture/detail to obstacles
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        obstacle.position.x - obstacle.width/2,
        obstacle.position.y - obstacle.height/2,
        obstacle.width,
        obstacle.height
      );
    });
    
    // ... (keep existing enemy, projectile and UI drawing code)
  }, [gameState, dimensions]);
  
  // ... (keep rest of component the same)
};
```

## Task 10: Add a start menu and game state management

1. Create a new file `src/components/game/StartMenu.tsx`:
```tsx
import React from 'react';
import styles from '@/styles/StartMenu.module.css';

interface StartMenuProps {
  onStartGame: () => void;
  highScore: number;
}

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame, highScore }) => {
  return (
    <div className={styles.startMenu}>
      <h1 className={styles.title}>TANK BATTLE</h1>
      
      <div className={styles.instructions}>
        <h2>How to Play</h2>
        <ul>
          <li>Move with WASD or Arrow Keys</li>
          <li>Aim with Mouse</li>
          <li>Fire with Left Click</li>
          <li>Destroy enemy tanks to score points</li>
          <li>Avoid enemy fire</li>
        </ul>
      </div>
      
      {highScore > 0 && (
        <div className={styles.highScore}>
          High Score: {highScore}
        </div>
      )}
      
      <button 
        className={styles.startButton}
        onClick={onStartGame}
      >
        Start Game
      </button>
    </div>
  );
};

export default StartMenu;
```

2. Create `src/styles/StartMenu.module.css`:
```css
.startMenu {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.title {
  font-size: 64px;
  color: #fff;
  margin-bottom: 30px;
  text-shadow: 0 0 10px #88f, 0 0 20px #88f;
}

.instructions {
  background-color: rgba(0, 0, 0, 0.6);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  max-width: 400px;
}

.instructions h2 {
  color: #fff;
  margin-bottom: 10px;
  text-align: center;
}

.instructions ul {
  color: #fff;
  list-style-type: none;
  padding-left: 0;
}

.instructions li {
  margin: 8px 0;
  text-align: center;
}

.highScore {
  font-size: 24px;
  color: #ff0;
  margin-bottom: 20px;
}

.startButton {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 24px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 10px;
  transition: background-color 0.3s;
}

.startButton:hover {
  background-color: #45a049;
}
```

3. Update `src/components/game/GameContainer.tsx` to include game states:
```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Canvas from './Canvas';
import StartMenu from './StartMenu';
import { GameState, Projectile, Tank } from '@/types/game';
import { useInput } from '@/hooks/useInput';
import { createEnemy, updateEnemy } from '@/lib/enemies';
import { generateObstacles } from '@/lib/obstacles';
import styles from '@/styles/GameContainer.module.css';

// ... (keep initialGameState the same)

type GameScreen = 'start' | 'playing' | 'gameOver';

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameScreen, setGameScreen] = useState<GameScreen>('start');
  const [highScore, setHighScore] = useState<number>(0);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 800, 
    height: typeof window !== 'undefined' ? window.innerHeight : 600 
  });
  
  const inputState = useInput();
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('tankGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);
  
  // Handle game start
  const handleStartGame = () => {
    // Reset game state
    setGameState({
      ...initialGameState,
      obstacles: generateObstacles(dimensions.width, dimensions.height, 8)
    });
    setGameScreen('playing');
  };
  
  // Handle game over
  const handleGameOver = () => {
    // Update high score if needed
    if (gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('tankGameHighScore', gameState.score.toString());
    }
    
    setGameScreen('gameOver');
  };
  
  // Restart game from game over screen
  const handleRestartGame = () => {
    setGameScreen('start');
  };
  
  // ... (keep enemy spawning logic)
  
  // Game update logic - add condition to only run when playing
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    
    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        // ... (keep existing game logic)
        
        // Check if player is dead
        if (updatedPlayerHealth.health <= 0) {
          updatedPlayerHealth.health = 0;
          setTimeout(() => handleGameOver(), 500);
        }
        
        // ... (rest of the game logic)
        
        return newState;
      });
    }, 1000 / 60);
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [gameScreen, inputState, dimensions]);
  
  // ... (keep collision detection helpers)
  
  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    // Clear the canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw everything only if we're playing or on game over screen
    if (gameScreen === 'playing' || gameScreen === 'gameOver') {
      // ... (keep existing drawing code)
      
      // Draw game over screen
      if (gameScreen === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', dimensions.width / 2, dimensions.height / 2 - 40);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${gameState.score}`, dimensions.width / 2, dimensions.height / 2 + 10);
        
        if (gameState.score >= highScore) {
          ctx.fillStyle = '#ff0';
          ctx.fillText('NEW HIGH SCORE!', dimensions.width / 2, dimensions.height / 2 + 50);
        } else {
          ctx.fillText(`High Score: ${highScore}`, dimensions.width / 2, dimensions.height / 2 + 50);
        }
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(dimensions.width / 2 - 100, dimensions.height / 2 + 90, 200, 50);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Play Again', dimensions.width / 2, dimensions.height / 2 + 120);
      }
    }
  }, [gameState, dimensions, gameScreen, highScore]);
  
  // Handle clicks on game over screen
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameScreen === 'gameOver') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is on "Play Again" button
      if (
        x > dimensions.width / 2 - 100 &&
        x < dimensions.width / 2 + 100 &&
        y > dimensions.height / 2 + 90 &&
        y < dimensions.height / 2 + 140
      ) {
        handleRestartGame();
      }
    }
  };
  
  return (
    <div className={styles.gameContainer} onClick={handleCanvasClick}>
      <Canvas draw={draw} width={dimensions.width} height={dimensions.height} />
      
      {gameScreen === 'start' && (
        <StartMenu onStartGame={handleStartGame} highScore={highScore} />
      )}
    </div>
  );
};

export default GameContainer;
```

## Task 11: Add sound effects

1. First, create a file `src/lib/sounds.ts`:
```typescript
interface SoundEffects {
  [key: string]: HTMLAudioElement;
}

class SoundManager {
  private sounds: SoundEffects = {};
  private isMuted: boolean = false;
  
  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }
  
  private init() {
    // Create audio elements
    this.sounds = {
      shoot: new Audio('/assets/sounds/shoot.mp3'),
      explosion: new Audio('/assets/sounds/explosion.mp3'),
      hit: new Audio('/assets/sounds/hit.mp3'),
      gameOver: new Audio('/assets/sounds/game-over.mp3'),
      music: new Audio('/assets/sounds/background.mp3'),
    };
    
    // Configure background music
    if (this.sounds.music) {
      this.sounds.music.loop = true;
      this.sounds.music.volume = 0.5;
    }
  }
  
  public play(soundName: string) {
    if (this.isMuted || !this.sounds[soundName]) return;
    
    // Clone and play to allow overlapping sounds
    const sound = this.sounds[soundName].cloneNode(true) as HTMLAudioElement;
    sound.volume = this.sounds[soundName].volume;
    sound.play().catch(e => console.log('Error playing sound:', e));
  }
  
  public startMusic() {
    if (this.isMuted || !this.sounds.music) return;
    this.sounds.music.play().catch(e => console.log('Error playing music:', e));
  }
  
  public stopMusic() {
    if (!this.sounds.music) return;
    this.sounds.music.pause();
    this.sounds.music.currentTime = 0;
  }
  
  public toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    
    return this.isMuted;
  }
  
  public isSoundMuted() {
    return this.isMuted;
  }
}

// Create singleton instance
export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;
```

2. Update `src/components/game/GameContainer.tsx` to include sound effects:

```tsx
// Add import
import { soundManager } from '@/lib/sounds';

// Add useEffect to handle background music
useEffect(() => {
  if (gameScreen === 'playing' && soundManager) {
    soundManager.startMusic();
  } else if (soundManager) {
    soundManager.stopMusic();
  }
  
  return () => {
    if (soundManager) soundManager.stopMusic();
  };
}, [gameScreen]);

// Add sound effects to various game events:

// When player fires (in the gameLoop useEffect):
if (inputState.mouseDown && player.cooldown <= 0) {
  // Create new projectile...
  
  // Play sound effect
  if (soundManager) soundManager.play('shoot');
  
  player.cooldown = player.maxCooldown;
}

// When enemy fires:
if (updatedEnemy.cooldown <= 0) {
  // Firing logic...
  
  // Play sound effect (at lower volume)
  if (soundManager && Math.random() > 0.5) soundManager.play('shoot');
  
  updatedEnemy.cooldown = updatedEnemy.maxCooldown;
}

// When projectile hits something:
if (isColliding(projectile, newState.player)) {
  // Damage logic...
  
  // Play hit sound
  if (soundManager) soundManager.play('hit');
}

if (isColliding(projectile, enemy)) {
  // Damage logic...
  
  // Play hit or explosion sound
  if (soundManager) {
    if (enemy.health <= projectile.damage) {
      soundManager.play('explosion');
    } else {
      soundManager.play('hit');
    }
  }
}

// When game over:
if (updatedPlayerHealth.health <= 0) {
  if (soundManager) soundManager.play('gameOver');
  setTimeout(() => handleGameOver(), 500);
}

// Add a mute button:
const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
  // ... existing draw code
  
  // Draw mute button
  ctx.fillStyle = '#333';
  ctx.fillRect(dimensions.width - 50, 10, 40, 40);
  
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(dimensions.width - 50, 10, 40, 40);
  
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    soundManager && soundManager.isSoundMuted() ? '🔇' : '🔊', 
    dimensions.width - 30, 
    35
  );
  
}, [gameState, dimensions, gameScreen, highScore]);

// Handle mute button click:
const handleCanvasClick = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Check if click is on mute button
  if (
    x > dimensions.width - 50 &&
    x < dimensions.width - 10 &&
    y > 10 &&
    y < 50
  ) {
    if (soundManager) soundManager.toggleMute();
    return;
  }
  
  // ... rest of click handler
};
```

## Task 12: Implement power-ups

1. Create a new file `src/lib/powerups.ts`:
```typescript
import { Position } from '@/types/game';

export type PowerUpType = 'health' | 'speed' | 'rapidFire' | 'shield';

export interface PowerUp {
  position: Position;
  type: PowerUpType;
  width: number;
  height: number;
  duration: number; // in milliseconds
  isActive: boolean;
}

export const createPowerUp = (
  position: Position,
  type: PowerUpType
): PowerUp => {
  const size = 30;
  let duration = 5000; // 5 seconds default
  
  // Adjust duration based on type
  switch (type) {
    case 'health':
      duration = 0; // instant effect
      break;
    case 'speed':
      duration = 8000; // 8 seconds
      break;
    case 'rapidFire':
      duration = 6000; // 6 seconds
      break;
    case 'shield':
      duration = 7000; // 7 seconds
      break;
  }
  
  return {
    position,
    type,
    width: size,
    height: size,
    duration,
    isActive: true
  };
};

export const generateRandomPowerUp = (
  canvasWidth: number,
  canvasHeight: number,
  obstacles: any[]
): PowerUp | null => {
  // Define power-up types with weights
  const powerUpTypes: PowerUpType[] = ['health', 'speed', 'rapidFire', 'shield'];
  const weights = [0.4, 0.2, 0.2, 0.2]; // 40% health, 20% for others
  
  // Choose random type based on weights
  const random = Math.random();
  let cumulativeWeight = 0;
  let selectedType: PowerUpType = 'health';
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      selectedType = powerUpTypes[i];
      break;
    }
  }
  
  // Generate random position
  let position: Position;
  let isValidPosition = false;
  let attempts = 0;
  
  // Try to find a valid position
  while (!isValidPosition && attempts < 20) {
    attempts++;
    
    position = {
      x: Math.random() * (canvasWidth - 60) + 30,
      y: Math.random() * (canvasHeight - 60) + 30
    };
    
    // Check if position is far enough from obstacles
    isValidPosition = true;
    for (const obstacle of obstacles) {
      const dx = position.x - obstacle.position.x;
      const dy = position.y - obstacle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < obstacle.width / 2 + 40) {
        isValidPosition = false;
        break;
      }
    }
  }
  
  // If couldn't find valid position after max attempts
  if (!isValidPosition) return null;
  
  return createPowerUp(position!, selectedType);
};
```

2. Update `src/types/game.ts` to include power-up related types:
```typescript
// Add to GameState interface
export interface GameState {
  player: Tank;
  enemies: Tank[];
  projectiles: Projectile[];
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  powerUpEffects: {
    speed: number;
    shield: boolean;
    rapidFire: boolean;
  };
}

// Add PowerUp type
export interface PowerUp {
  position: Position;
  type: 'health' | 'speed' | 'rapidFire' | 'shield';
  width: number;
  height: number;
  duration: number;
  isActive: boolean;
}
```

3. Update `src/components/game/GameContainer.tsx` to include power-ups:
```tsx
// Add import
import { generateRandomPowerUp, PowerUp } from '@/lib/powerups';

// Update initialGameState
const initialGameState: GameState = {
  player: {
    // ...existing player properties
  },
  enemies: [],
  projectiles: [],
  obstacles: [],
  powerUps: [],
  score: 0,
  isGameOver: false,
  isPaused: false,
  powerUpEffects: {
    speed: 1,      // Multiplier
    shield: false,
    rapidFire: false
  }
};

// Add power-up spawning logic
useEffect(() => {
  if (gameScreen !== 'playing') return;
  
  const spawnPowerUp = () => {
    setGameState(prevState => {
      // Limit to 3 active power-ups at a time
      if (prevState.powerUps.filter(p => p.isActive).length >= 3) return prevState;
      
      const newPowerUp = generateRandomPowerUp(
        dimensions.width, 
        dimensions.height,
        prevState.obstacles
      );
      
      if (!newPowerUp) return prevState;
      
      return {
        ...prevState,
        powerUps: [...prevState.powerUps, newPowerUp]
      };
    });
  };
  
  // Spawn a power-up every 15-30 seconds
  const powerUpInterval = setInterval(() => {
    spawnPowerUp();
  }, 15000 + Math.random() * 15000);
  
  return () => {
    clearInterval(powerUpInterval);
  };
}, [gameScreen, dimensions]);

// Update game loop for power-ups
useEffect(() => {
  if (gameScreen !== 'playing') return;
  
  const gameLoop = setInterval(() => {
    setGameState(prevState => {
      const newState = { ...prevState };
      
      // Apply power-up effects to player
      const player = { ...newState.player };
      const effectiveSpeed = player.speed * newState.powerUpEffects.speed;
      
      // Set adjusted cooldown if rapid fire is active
      const effectiveCooldown = newState.powerUpEffects.rapidFire 
        ? Math.floor(player.maxCooldown / 3) 
        : player.maxCooldown;
      
      // Check for power-up collisions
      const collidedPowerUps: number[] = [];
      const updatedPowerUpEffects = { ...newState.powerUpEffects };
      
      newState.powerUps.forEach((powerUp, index) => {
        if (!powerUp.isActive) return;
        
        // Check collision with player
        const dx = player.position.x - powerUp.position.x;
        const dy = player.position.y - powerUp.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width + powerUp.width) / 2) {
          // Apply power-up effect
          switch (powerUp.type) {
            case 'health':
              player.health = Math.min(player.health + 30, player.maxHealth);
              if (soundManager) soundManager.play('powerup');
              break;
            case 'speed':
              updatedPowerUpEffects.speed = 1.5;
              if (soundManager) soundManager.play('powerup');
              
              // Set timeout to end effect
              setTimeout(() => {
                setGameState(state => ({
                  ...state,
                  powerUpEffects: {
                    ...state.powerUpEffects,
                    speed: 1
                  }
                }));
              }, powerUp.duration);
              break;
            case 'rapidFire':
              updatedPowerUpEffects.rapidFire = true;
              if (soundManager) soundManager.play('powerup');
              
              setTimeout(() => {
                setGameState(state => ({
                  ...state,
                  powerUpEffects: {
                    ...state.powerUpEffects,
                    rapidFire: false
                  }
                }));
              }, powerUp.duration);
              break;
            case 'shield':
              updatedPowerUpEffects.shield = true;
              if (soundManager) soundManager.play('powerup');
              
              setTimeout(() => {
                setGameState(state => ({
                  ...state,
                  powerUpEffects: {
                    ...state.powerUpEffects,
                    shield: false
                  }
                }));
              }, powerUp.duration);
              break;
          }
          
          collidedPowerUps.push(index);
        }
      });
      
      // Update powerUps
      const updatedPowerUps = newState.powerUps
        .map((powerUp, index) => {
          if (collidedPowerUps.includes(index)) {
            return { ...powerUp, isActive: false };
          }
          return powerUp;
        })
        .filter(powerUp => powerUp.isActive || collidedPowerUps.includes(newState.powerUps.indexOf(powerUp)));
      
      // Use effectiveSpeed for movement
      
      // When checking enemy projectile hit on player, apply shield
      if (
        isColliding(projectile, newState.player) &&
        projectile.position.x !== newState.player.position.x && 
        projectile.position.y !== newState.player.position.y
      ) {
        if (newState.powerUpEffects.shield) {
          // Shield absorbs damage
          collidedProjectiles.push(projectileIndex);
          if (soundManager) soundManager.play('shield');
        } else {
          // Normal damage
          updatedPlayerHealth.health -= projectile.damage;
          collidedProjectiles.push(projectileIndex);
          if (soundManager) soundManager.play('hit');
        }
      }
      
      // Apply rapid fire to player shooting
      if (inputState.mouseDown && player.cooldown <= 0) {
        // Create new projectile...
        
        player.cooldown = effectiveCooldown;
      }
      
      newState.player = player;
      newState.powerUps = updatedPowerUps;
      newState.powerUpEffects = updatedPowerUpEffects;
      
      return newState;
    });
  }, 1000 / 60);
  
  return () => {
    clearInterval(gameLoop);
  };
}, [gameScreen, inputState, dimensions]);

// Update draw function to include power-ups
const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
  // ... existing drawing code
  
  // Draw power-ups
  gameState.powerUps.forEach(powerUp => {
    if (!powerUp.isActive) return;
    
    // Set color based on type
    let color = '#fff';
    let innerColor = '#fff';
    
    switch (powerUp.type) {
      case 'health':
        color = '#ff5555';
        innerColor = '#ff0000';
        break;
      case 'speed':
        color = '#55ff55';
        innerColor = '#00ff00';
        break;
      case 'rapidFire':
        color = '#5555ff';
        innerColor = '#0000ff';
        break;
      case 'shield':
        color = '#ffff55';
        innerColor = '#ffff00';
        break;
    }
    
    // Draw power-up
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      powerUp.position.x,
      powerUp.position.y,
      powerUp.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw inner circle
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(
      powerUp.position.x,
      powerUp.position.y,
      powerUp.width / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw icon based on type
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let icon = '';
    switch (powerUp.type) {
      case 'health':
        icon = '+';
        break;
      case 'speed':
        icon = '→';
        break;
      case 'rapidFire':
        icon = '⚡';
        break;
      case 'shield':
        icon = '❖';
        break;
    }
    
    ctx.fillText(icon, powerUp.position.x, powerUp.position.y);
  });
  
  // Draw active power-up indicators
  if (gameState.powerUpEffects.shield) {
    // Draw shield effect around player
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      gameState.player.position.x,
      gameState.player.position.y,
      gameState.player.width / 2 + 10,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  
  // Display active power-up icons
  const activePowerUps = [];
  if (gameState.powerUpEffects.speed > 1) activePowerUps.push('Speed');
  if (gameState.powerUpEffects.rapidFire) activePowerUps.push('Rapid Fire');
  if (gameState.powerUpEffects.shield) activePowerUps.push('Shield');
  
  if (activePowerUps.length > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 60, 150, 20 + activePowerUps.length * 20);
    
    ctx.fillStyle = '#ffff00';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Active Power-ups:', 15, 75);
    
    ctx.fillStyle = '#ffffff';
    activePowerUps.forEach((powerUp, index) => {
      ctx.fillText(powerUp, 25, 95 + index * 20);
    });
  }
  
}, [gameState, dimensions, gameScreen, highScore]);
```

## Task 13: Add deployment setup for Vercel

1. Create a new file `next.config.js` in the root directory:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // If you're putting the project under a subdirectory on deployment
  // like yoursite.vercel.app/tank-game
  // basePath: '/tank-game',
  
  // For optimizing images
  images: {
    remotePatterns: [],
    unoptimized: true
  },
  
  // Generating proper static site
  output: 'export',
  
  // Disable server-side rendering features
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
```

2. Create a `vercel.json` file in the root directory:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "github": {
    "silent": true
  }
}
```

3. Update `package.json` to include a build script (create if it doesn't exist yet):
```json
{
  "name": "tank-game",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "autoprefixer": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest"
  }
}
```

4. Create a `.gitignore` file:
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

5. Create a `README.md` file:
```markdown
# Tank Game

A simple 2D tank battle game built with Next.js, TypeScript, and HTML5 Canvas.

## Features

- Player-controlled tank with keyboard and mouse controls
- Enemy tanks with basic AI
- Projectile shooting and collision detection
- Power-ups (health, speed, rapid fire, shield)
- Obstacles and map boundaries
- Score tracking and high score system
- Sound effects
- Responsive design

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

The game is configured for easy deployment to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy!

## Controls

- Move: WASD or Arrow Keys
- Aim: Mouse
- Shoot: Left Click
- Mute/Unmute: Click sound icon in top-right corner
```

## Task 14: Add placeholder assets

1. Create placeholder files for sound effects:
```
/public/assets/sounds/shoot.mp3
/public/assets/sounds/explosion.mp3
/public/assets/sounds/hit.mp3
/public/assets/sounds/game-over.mp3
/public/assets/sounds/background.mp3
/public/assets/sounds/powerup.mp3
/public/assets/sounds/shield.mp3
```

2. Create a basic favicon:
```
/public/favicon.ico
```

These placeholder files would need to be replaced with actual sound effects and images before deploying.