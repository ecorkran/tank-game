'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Canvas from './Canvas';
import StartMenu from './StartMenu';
import { GameState, Tank, Projectile, GameObject, PowerUpType, Position, ControlType } from '@/types/game';
import { useInput } from '@/hooks/useInput';
import { createEnemy, updateEnemy } from '@/lib/enemies';
import { generateObstacles } from '@/lib/obstacles';
import { generateRandomPowerUp } from '@/lib/powerups';
import { soundManager } from '@/lib/sounds';
import { calculateWrappedPosition } from '@/utils/position';
import { checkObstacleCollision, findSafeSpawnPosition, isStuckAgainstObstacle } from '@/utils/collision';
import { PLAYFIELD_DIMENSIONS, WRAPPING_THRESHOLDS, SIZES, GAMEPLAY } from '@/constants/game';
import styles from '@/styles/GameContainer.module.css';

// Initial game state
const initialGameState: GameState = {
  controlType: ControlType.Keyboard,
  player: {
    position: { x: 100, y: 100 },
    rotation: 0,
    width: 40,
    height: 40,
    health: 100,
    maxHealth: 100,
    speed: GAMEPLAY.PLAYER_SPEED,
    rotationSpeed: GAMEPLAY.PLAYER_ROTATION_SPEED,
    cooldown: 0,
    maxCooldown: 30,
    isPlayer: true
  },
  enemies: [],
  projectiles: [],
  obstacles: [],
  powerUps: [],
  score: 0,
  isGameOver: false,
  isPaused: false,
  powerUpEffects: {
    speed: 1,
    shield: false,
    rapidFire: false
  }
};

// Game screen states
type GameScreen = 'start' | 'playing' | 'gameOver';

// Function to draw control instructions
const drawControlsText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(width - 220, height - 120, 210, 110);
  
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Controls:', width - 210, height - 95);
  ctx.font = '14px Arial';
  ctx.fillText('W - Forward', width - 210, height - 75);
  ctx.fillText('S - Backward', width - 210, height - 55);
  ctx.fillText('A - Rotate Left', width - 210, height - 35);
  ctx.fillText('D - Rotate Right', width - 210, height - 15);
  ctx.fillText('Space/Click - Fire', width - 90, height - 75);
};

const EscapeMenu: React.FC<{ onClose: () => void, onMainMenu: () => void }> = ({ onClose, onMainMenu }) => {
  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <h2>Pause Menu</h2>
        <button className={styles.controlButton} onClick={onMainMenu}>Main Menu</button>
        <button className={styles.exitButton} onClick={() => window.close()}>Exit</button>
        <button onClick={onClose}>Resume</button>
      </div>
    </div>
  );
};

const GameContainer: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameScreen, setGameScreen] = useState<GameScreen>('start');
  // Ref to track enemy count without causing rerenders
  const enemyCountRef = useRef<number>(0);
  // Track enemy speed increase as the game progresses
  const [enemySpeedIncrease, setEnemySpeedIncrease] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Set the playfield size to the window size and update it on resize
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  let debouncedResizeHandler: () => void;

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    if (typeof window !== 'undefined') {
      updateDimensions();
      debouncedResizeHandler = debounce(() => {
        updateDimensions();
      }, 300); // 300ms delay
      window.addEventListener('resize', debouncedResizeHandler);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', debouncedResizeHandler);
      }
    };
  }, []);

  useEffect(() => {
    // Only create a resize handler for obstacle regeneration
    // Do not call it immediately
    const handleResize = () => {
      if (gameScreen === 'playing') {
        const newObstacles = generateObstacles(dimensions.width, dimensions.height, 8);
        setGameState(prevState => ({
          ...prevState,
          obstacles: newObstacles
        }));
      }
    };

    // Create the debounced version
    const debouncedObstacleRegeneration = debounce(handleResize, 300);

    // Only add the event listener if we're in the playing state
    if (typeof window !== 'undefined' && gameScreen === 'playing') {
      window.addEventListener('resize', debouncedObstacleRegeneration);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', debouncedObstacleRegeneration);
      }
    };
  }, [dimensions, gameScreen]);

  // Input handling
  const inputState = useInput();
  
  // Listen for Enter key or Space bar on game over screen
  useEffect(() => {
    if (gameScreen === 'gameOver' && (inputState.enterPressed || inputState.spacePressed)) {
      handleRestartGame();
    }
  }, [gameScreen, inputState.enterPressed, inputState.spacePressed]);
  
  // Load high score from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHighScore = localStorage.getItem('tankGameHighScore');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }
    }
  }, []);
  
  // Start background music when game is playing
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
  
  // Handle game start
  const handleStartGame = () => {
    // Reset game state with new obstacles
    const newObstacles = generateObstacles(dimensions.width, dimensions.height, 8);
    
    // Find a safe spawn position for the player that doesn't collide with obstacles
    const safePlayerPosition = findSafeSpawnPosition(
      dimensions.width,
      dimensions.height,
      SIZES.player,
      newObstacles,
      100 // Margin from edges
    );
    
    // Create initial enemies at safe positions
    // Find safe spawn positions for enemies that don't collide with obstacles
    const safeEnemyPosition1 = findSafeSpawnPosition(
      dimensions.width,
      dimensions.height,
      SIZES.enemy,
      newObstacles,
      100 // Margin from edges
    );
    
    const safeEnemyPosition2 = findSafeSpawnPosition(
      dimensions.width,
      dimensions.height,
      SIZES.enemy,
      newObstacles,
      100 // Margin from edges
    );
    
    const initialEnemies = [
      createEnemy(safeEnemyPosition1, dimensions.width, dimensions.height, enemySpeedIncrease),
      createEnemy(safeEnemyPosition2, dimensions.width, dimensions.height, enemySpeedIncrease)
    ];
    
    setGameState({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        position: safePlayerPosition,
        cooldown: 30  // Add initial cooldown to prevent immediate firing
      },
      obstacles: newObstacles,
      enemies: initialEnemies,
      projectiles: []  // Ensure projectiles are cleared
    });
    
    setGameScreen('playing');
  };
  
  // Handle game over
  const handleGameOver = () => {
    // Update high score if needed
    if (gameState.score > highScore) {
      setHighScore(gameState.score);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tankGameHighScore', gameState.score.toString());
      }
    }
    
    setGameScreen('gameOver');
  };
  
  // Handle restart game
  const handleRestartGame = () => {
    // Clear any existing projectiles and reset game state
    setGameState(prevState => ({
      ...prevState,
      projectiles: []  // Clear all projectiles
    }));
    
    // Reset input state to prevent key states from persisting
    inputState.resetInput();
    
    // Add a small delay before starting a new game to prevent immediate firing
    setTimeout(() => {
      // Start a new game directly instead of going back to the start screen
      handleStartGame();
    }, 100);  // 100ms delay
  };
  
  // Spawn enemies at random intervals
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    
      // We don't need this anymore - handling in handleStartGame
    
    const spawnEnemy = () => {
      setGameState(prevState => {
        // Don't spawn more than MAX_ENEMIES
        if (prevState.enemies.length >= GAMEPLAY.MAX_ENEMIES) return prevState;
        
        // Find a safe spawn position for the enemy that doesn't collide with obstacles
        // First try to spawn at the edges
        let initialPosition;
        const side = Math.floor(Math.random() * 4);
        
        switch (side) {
          case 0: // Top
            initialPosition = { x: Math.random() * dimensions.width, y: 0 };
            break;
          case 1: // Right
            initialPosition = { x: dimensions.width, y: Math.random() * dimensions.height };
            break;
          case 2: // Bottom
            initialPosition = { x: Math.random() * dimensions.width, y: dimensions.height };
            break;
          case 3: // Left
            initialPosition = { x: 0, y: Math.random() * dimensions.height };
            break;
          default:
            initialPosition = { x: 0, y: 0 };
        }
        
        // Move the initial position slightly inward to avoid immediate wrapping
        if (side === 0) initialPosition.y += SIZES.enemy;
        if (side === 1) initialPosition.x -= SIZES.enemy;
        if (side === 2) initialPosition.y -= SIZES.enemy;
        if (side === 3) initialPosition.x += SIZES.enemy;
        
        // Check if the initial position is safe
        const initialCollision = checkObstacleCollision(
          initialPosition,
          SIZES.enemy,
          prevState.obstacles
        );
        
        // If the initial position is safe, use it; otherwise find a safe position
        const safePosition = initialCollision.collided 
          ? findSafeSpawnPosition(dimensions.width, dimensions.height, SIZES.enemy, prevState.obstacles, 50)
          : initialPosition;
        
        // Create enemy with current speed increase for progressive difficulty
        const newEnemy = createEnemy(safePosition, dimensions.width, dimensions.height, enemySpeedIncrease);
        
        return {
          ...prevState,
          enemies: [...prevState.enemies, newEnemy]
        };
      });
    };
    
    // Use a recursive setTimeout approach to get a new random interval after each spawn
    let enemySpawnTimer: NodeJS.Timeout;
    
    const scheduleEnemySpawn = () => {
      // Calculate a new random interval each time
      const randomEnemyInterval = GAMEPLAY.ENEMY_SPAWN_INTERVAL_MIN + Math.random() * (GAMEPLAY.ENEMY_SPAWN_INTERVAL_MAX - GAMEPLAY.ENEMY_SPAWN_INTERVAL_MIN);
      
      enemySpawnTimer = setTimeout(() => {
        spawnEnemy();
        
        // Also check if we need more enemies
        if (enemyCountRef.current < GAMEPLAY.MIN_ENEMIES) {
          // No need for console log in production code
          spawnEnemy();
        }
        
        // Schedule the next spawn with a new random interval
        scheduleEnemySpawn();
      }, randomEnemyInterval);
    };
    
    // Start the first enemy spawn cycle
    scheduleEnemySpawn();
    
    return () => {
      // Clean up the timeout when component unmounts or effect re-runs
      if (enemySpawnTimer) {
        clearTimeout(enemySpawnTimer);
      }
    };
  }, [dimensions, gameScreen]);
  
  // Keep track of enemy count without console spam
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    enemyCountRef.current = gameState.enemies.length;
  }, [gameState.enemies.length, gameScreen]);
  
  // Spawn power-ups at random intervals
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    
    const spawnPowerUp = () => {
      setGameState(prevState => {
        // Limit to MAX_ACTIVE_POWERUPS active power-ups at a time
        if (prevState.powerUps.filter(p => p.isActive).length >= GAMEPLAY.MAX_ACTIVE_POWERUPS) return prevState;
        
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
    
    // Use a recursive setTimeout approach to get a new random interval after each spawn
    let powerUpTimer: NodeJS.Timeout;
    
    const schedulePowerUpSpawn = () => {
      // Calculate a new random interval each time
      const randomInterval = GAMEPLAY.POWERUP_INTERVAL_MIN + Math.random() * (GAMEPLAY.POWERUP_INTERVAL_MAX - GAMEPLAY.POWERUP_INTERVAL_MIN);
      
      powerUpTimer = setTimeout(() => {
        spawnPowerUp();
        // Schedule the next spawn with a new random interval
        schedulePowerUpSpawn();
      }, randomInterval);
    };
    
    // Start the first power-up spawn cycle
    schedulePowerUpSpawn();
    
    return () => {
      // Clean up the timeout when component unmounts or effect re-runs
      if (powerUpTimer) {
        clearTimeout(powerUpTimer);
      }
    };
  }, [gameScreen, dimensions]);
  
  // We're now using the calculateWrappedPosition function from utils/position.ts
  
  // Collision detection utilities
  const isColliding = (obj1: GameObject, obj2: GameObject): boolean => {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.width + obj2.width) / 2;
  };
  
  const isCollidingRectangles = (rect1: GameObject, rect2: GameObject): boolean => {
    return (
      rect1.position.x - rect1.width/2 < rect2.position.x + rect2.width/2 &&
      rect1.position.x + rect1.width/2 > rect2.position.x - rect2.width/2 &&
      rect1.position.y - rect1.height/2 < rect2.position.y + rect2.height/2 &&
      rect1.position.y + rect1.height/2 > rect2.position.y - rect2.height/2
    );
  };
  
  // Note: checkObstacleCollision has been moved to utils/collision.ts
  
  // Main game loop
  useEffect(() => {
    if (gameScreen !== 'playing') return;
    
    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        const newState = { ...prevState };
        
        // Player movement and rotation
        const { keys, mousePosition } = inputState;
        const player = { ...newState.player };
        
        // Calculate movement direction based on tank's rotation
        let dx = 0;
        let dy = 0;
        
        // Forward and backward movement relative to tank rotation
        if (keys['w'] || keys['arrowup']) {
          dx += Math.cos(player.rotation) * player.speed * newState.powerUpEffects.speed;
          dy += Math.sin(player.rotation) * player.speed * newState.powerUpEffects.speed;
        }
        if (keys['s'] || keys['arrowdown']) {
          dx -= Math.cos(player.rotation) * player.speed * newState.powerUpEffects.speed;
          dy -= Math.sin(player.rotation) * player.speed * newState.powerUpEffects.speed;
        }
        
        // Test keys for screen edge teleportation to test wrapping
        // These keys will teleport the player to just outside the screen edges
        if (keys['1']) { // Left edge
          player.position.x = -player.width;
          console.log("Player teleported to left edge for wrap testing");
        }
        if (keys['2']) { // Right edge
          player.position.x = dimensions.width + player.width;
          console.log("Player teleported to right edge for wrap testing");
        }
        if (keys['3']) { // Top edge
          player.position.y = -player.width;
          console.log("Player teleported to top edge for wrap testing");
        }
        if (keys['4']) { // Bottom edge
          player.position.y = dimensions.height + player.width;
          console.log("Player teleported to bottom edge for wrap testing");
        }
        
        // Boost mode - hold Shift for faster movement to test wrapping
        if (keys['shift']) {
          // Boost the player's speed by 5x when shift is held
          dx *= 5;
          dy *= 5;
          console.log("Speed boost active");
        }
        
        // Rotation controls
        if (keys['a'] || keys['arrowleft']) {
          player.rotation -= player.rotationSpeed;
        }
        if (keys['d'] || keys['arrowright']) {
          player.rotation += player.rotationSpeed;
        }
        
        // Check obstacle collisions
        const obstacleCollision = checkObstacleCollision(
          { x: player.position.x + dx, y: player.position.y + dy },
          player.width,
          newState.obstacles
        );
        
        // Apply movement with obstacle sliding
        if (!obstacleCollision.collided) {
          player.position.x += dx;
          player.position.y += dy;
        } else if (obstacleCollision.correctedPosition) {
          // Use the corrected position from collision detection to prevent penetration
          player.position = obstacleCollision.correctedPosition;
        } else {
          // Fallback to sliding behavior if no corrected position is available
          if (!obstacleCollision.collidedX) player.position.x += dx;
          if (!obstacleCollision.collidedY) player.position.y += dy;
          
          // Check if player is stuck (can't move forward or backward)
          const isStuck = isStuckAgainstObstacle(
            player.position,
            player.width,
            player.rotation,
            newState.obstacles
          );
          
          // If player is stuck, try to help them get unstuck by applying a small nudge
          if (isStuck && (keys['w'] || keys['s'] || keys['arrowup'] || keys['arrowdown'])) {
            // Calculate perpendicular direction to try to nudge the player
            const perpX = Math.sin(player.rotation) * 2;
            const perpY = -Math.cos(player.rotation) * 2;
            
            // Try nudging in both perpendicular directions
            const nudgePos1 = { x: player.position.x + perpX, y: player.position.y + perpY };
            const nudgePos2 = { x: player.position.x - perpX, y: player.position.y - perpY };
            
            const collision1 = checkObstacleCollision(nudgePos1, player.width, newState.obstacles);
            const collision2 = checkObstacleCollision(nudgePos2, player.width, newState.obstacles);
            
            // Apply the nudge if one direction is clear
            if (!collision1.collided) {
              player.position.x = nudgePos1.x;
              player.position.y = nudgePos1.y;
              console.log('Unstuck player with nudge direction 1');
            } else if (!collision2.collided) {
              player.position.x = nudgePos2.x;
              player.position.y = nudgePos2.y;
              console.log('Unstuck player with nudge direction 2');
            }
          }
        }
        
        // Screen edge wrapping - match the enemy wrapping code exactly
        const tankSize = player.width;
        
        // Add debug logging to see player position and thresholds
        if (keys['0']) {
          console.log(`Player position: x=${player.position.x}, y=${player.position.y}`);
          console.log(`Screen dimensions: width=${dimensions.width}, height=${dimensions.height}`);
          console.log(`Wrapping thresholds: left=${-tankSize}, right=${dimensions.width + tankSize}`);
          console.log(`Wrapping thresholds: top=${-tankSize}, bottom=${dimensions.height + tankSize}`);
        }
        
        // Apply position wrapping using our utility function
        const wrappedPosition = calculateWrappedPosition(
          player.position.x, 
          player.position.y, 
          WRAPPING_THRESHOLDS.player, 
          dimensions
        );
        player.position.x = wrappedPosition.x;
        player.position.y = wrappedPosition.y;
        
        // IMPORTANT: Ensure there are no boundary constraints elsewhere
        // Force the player to stay within the wrapping thresholds, not the screen bounds
        
        // Remove any edge constraints that might be preventing wrapping
        // The enemy code doesn't have these constraints
        
        // No debug logging needed
        // We're not using mouse for rotation anymore - rotation is handled by A/D keys
        
        // Handle player shooting
        const effectiveCooldown = newState.powerUpEffects.rapidFire 
          ? Math.floor(player.maxCooldown / 3) 
          : player.maxCooldown;
        
        if ((inputState.mouseDown || keys[' ']) && player.cooldown <= 0) {
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
            isActive: true,
            distanceTraveled: 0
          };
          
          newState.projectiles.push(projectile);
          player.cooldown = effectiveCooldown;
          
          // Play sound effect
          if (soundManager) soundManager.play('shoot');
        }
        
        // Update player cooldown
        if (player.cooldown > 0) {
          player.cooldown--;
        }
        
        // Update enemies
        const updatedEnemies = newState.enemies.map(enemy => {
          let updatedEnemy = updateEnemy(
            enemy,
            { ...newState.player.position }, // Clone to avoid direct mutation
            dimensions.width,
            dimensions.height,
            newState.obstacles // Pass obstacles for collision avoidance
          );
          
          // IMPORTANT: Ensure enemies are moving by forcing position changes
          // This is a failsafe to prevent stalling
          updatedEnemy = {
            ...updatedEnemy,
            position: {
              x: updatedEnemy.position.x + Math.cos(updatedEnemy.rotation) * 0.5,
              y: updatedEnemy.position.y + Math.sin(updatedEnemy.rotation) * 0.5
            }
          };
          
          // Enemy firing logic
          if (updatedEnemy.cooldown <= 0) {
            // Calculate distance to player
            const dx = newState.player.position.x - updatedEnemy.position.x;
            const dy = newState.player.position.y - updatedEnemy.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Fire if within range (with some randomness)
            if (distance < GAMEPLAY.SHOT_RANGE && Math.random() < 0.3) {
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
                isActive: true,
                distanceTraveled: 0
              };
              
              newState.projectiles.push(projectile);
              updatedEnemy.cooldown = updatedEnemy.maxCooldown;
              
              // Play sound effect (at lower volume, and not every time)
              if (soundManager && Math.random() > 0.5) soundManager.play('shoot');
            }
          }
          
          return updatedEnemy;
        });
        
        // Update projectiles
        let updatedProjectiles = newState.projectiles
          .map(projectile => {
            if (!projectile.isActive) return projectile;
            
            // Calculate movement vector
            const moveX = Math.cos(projectile.rotation) * projectile.speed;
            const moveY = Math.sin(projectile.rotation) * projectile.speed;
            
            // Calculate distance traveled in this step
            const stepDistance = Math.sqrt(moveX * moveX + moveY * moveY);
            
            // Update total distance traveled
            const totalDistance = (projectile.distanceTraveled || 0) + stepDistance;
            
            // Check if projectile has exceeded max range
            if (totalDistance > GAMEPLAY.SHOT_RANGE) {
              return { ...projectile, isActive: false };
            }
            
            let newPosition = {
              x: projectile.position.x + moveX,
              y: projectile.position.y + moveY
            };
            
            // Apply position wrapping using our utility function
            const wrappedPosition = calculateWrappedPosition(
              newPosition.x, 
              newPosition.y, 
              WRAPPING_THRESHOLDS.projectile, 
              dimensions
            );
            newPosition.x = wrappedPosition.x;
            newPosition.y = wrappedPosition.y;
            
            // Check collision with obstacles
            for (const obstacle of newState.obstacles) {
              if (isCollidingRectangles(
                { position: newPosition, width: projectile.width, height: projectile.height, rotation: 0 },
                obstacle
              )) {
                // If obstacle is destructible, damage it
                if (obstacle.isDestructible && obstacle.health) {
                  obstacle.health -= projectile.damage;
                }
                return { ...projectile, isActive: false };
              }
            }
            
            return {
              ...projectile,
              position: newPosition,
              distanceTraveled: totalDistance
            };
          })
          .filter(projectile => projectile.isActive);
        
        // Filter out destroyed obstacles
        const updatedObstacles = newState.obstacles.filter(obstacle => 
          !obstacle.isDestructible || !obstacle.health || obstacle.health > 0
        );
        
        // Check collisions for projectiles with tanks
        const collidedProjectiles: number[] = [];
        const updatedPlayerHealth = { ...player };
        const updatedEnemiesAfterCollision = updatedEnemies.map(enemy => {
          updatedProjectiles.forEach((projectile, projectileIndex) => {
            // Check if projectile hit enemy
            if (
              isColliding(projectile, enemy) && 
              projectile.position.x !== enemy.position.x && 
              projectile.position.y !== enemy.position.y
            ) {
              enemy.health -= projectile.damage;
              collidedProjectiles.push(projectileIndex);
              
              // Play hit or explosion sound
              if (soundManager) {
                if (enemy.health <= projectile.damage) {
                  soundManager.play('explosion');
                } else {
                  soundManager.play('hit');
                }
              }
              
              // If enemy is killed by projectile, increase score and enemy speed
              if (enemy.health <= 0) {
                newState.score += GAMEPLAY.ENEMY_POINT_VALUE * GAMEPLAY.ENEMY_POINT_MULTIPLER; // Points for projectile kill
                
                // Increase enemy speed for progressive difficulty
                const randomVariation = (Math.random() * 2 - 1) * GAMEPLAY.ENEMY_SPEED_RANDOMNESS;
                const speedIncrease = GAMEPLAY.ENEMY_SPEED_INCREASE_PER_KILL + randomVariation;
                setEnemySpeedIncrease(prev => Math.min(prev + speedIncrease, GAMEPLAY.ENEMY_SPEED_MAX_CAP));
                
                return { ...enemy, health: 0 };
              }
            }
            
            // Check if projectile hit player
            if (
              isColliding(projectile, newState.player) &&
              projectile.position.x !== newState.player.position.x && 
              projectile.position.y !== newState.player.position.y
            ) {
              // Check if player has shield
              if (newState.powerUpEffects.shield) {
                // Shield absorbs damage
                if (soundManager) soundManager.play('shield');
              } else {
                // Normal damage
                updatedPlayerHealth.health -= projectile.damage;
                if (soundManager) soundManager.play('hit');
              }
              collidedProjectiles.push(projectileIndex);
            }
          });
          
          return enemy;
        }).filter(enemy => enemy.health > 0);
        
        // Remove collided projectiles
        updatedProjectiles = updatedProjectiles.filter((_, index) => 
          !collidedProjectiles.includes(index)
        );
        
        // Check for tank-to-tank collisions
        // First, player vs enemy tanks
        updatedEnemiesAfterCollision.forEach(enemy => {
          if (isColliding(player, enemy)) {
            // Calculate relative velocity for damage calculation
            const playerVelX = Math.cos(player.rotation) * player.speed * newState.powerUpEffects.speed;
            const playerVelY = Math.sin(player.rotation) * player.speed * newState.powerUpEffects.speed;
            const enemyVelX = Math.cos(enemy.rotation) * enemy.speed;
            const enemyVelY = Math.sin(enemy.rotation) * enemy.speed;
            
            // Calculate relative velocity magnitude
            const relVelX = playerVelX - enemyVelX;
            const relVelY = playerVelY - enemyVelY;
            const relVelocity = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
            
            // Base damage from initial collision plus velocity-dependent component
            const initialImpactDamage = 5; // Base damage just for colliding
            const velocityDamage = Math.floor(relVelocity * 3); // Additional damage based on speed
            const collisionDamage = initialImpactDamage + velocityDamage;
            const damageMitigation = 0.30;
            
            // Apply damage to both tanks
            // Check if player has shield active
            if (newState.powerUpEffects.shield) {
              // Shield absorbs all damage to player
              if (soundManager) soundManager.play('shield');
              // Enemy still takes full damage
              enemy.health -= collisionDamage;
            } else {
              // Normal damage to both
              updatedPlayerHealth.health -= (collisionDamage * (1.0 - damageMitigation));
              enemy.health -= collisionDamage;
            }
            
            // Simplified physics - push away from each other
            const dx = player.position.x - enemy.position.x;
            const dy = player.position.y - enemy.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize and apply push force
            if (distance > 0) {
              const pushForce = 20; // Stronger push force for better separation
              const nx = dx / distance;
              const ny = dy / distance;
              
              player.position.x += nx * pushForce;
              player.position.y += ny * pushForce;
              enemy.position.x -= nx * pushForce;
              enemy.position.y -= ny * pushForce;
            }
            
            // Check if enemy is destroyed by the collision
            if (enemy.health <= 0) {
              // Award points for destroying enemy by ramming
              newState.score += GAMEPLAY.ENEMY_POINT_VALUE * GAMEPLAY.ENEMY_POINT_MULTIPLER * GAMEPLAY.ENEMY_RAM_MULTIPLIER; // Points for ramming kill
              if (soundManager) soundManager.play('explosion');
              
              // Increase enemy speed for progressive difficulty
              const randomVariation = (Math.random() * 2 - 1) * GAMEPLAY.ENEMY_SPEED_RANDOMNESS;
              const speedIncrease = GAMEPLAY.ENEMY_SPEED_INCREASE_PER_KILL + randomVariation;
              setEnemySpeedIncrease(prev => Math.min(prev + speedIncrease, GAMEPLAY.ENEMY_SPEED_MAX_CAP));
            } else {
              // Just a hit sound for non-fatal collisions
              if (soundManager) soundManager.play('hit');
            }
          }
        });
        
        // Enemy vs enemy collisions
        for (let i = 0; i < updatedEnemiesAfterCollision.length; i++) {
          for (let j = i + 1; j < updatedEnemiesAfterCollision.length; j++) {
            const enemy1 = updatedEnemiesAfterCollision[i];
            const enemy2 = updatedEnemiesAfterCollision[j];
            
            if (isColliding(enemy1, enemy2)) {
              // Calculate relative velocity for damage (similar to player-enemy collisions)
              const enemy1VelX = Math.cos(enemy1.rotation) * enemy1.speed;
              const enemy1VelY = Math.sin(enemy1.rotation) * enemy1.speed;
              const enemy2VelX = Math.cos(enemy2.rotation) * enemy2.speed;
              const enemy2VelY = Math.sin(enemy2.rotation) * enemy2.speed;
              
              // Calculate relative velocity magnitude
              const relVelX = enemy1VelX - enemy2VelX;
              const relVelY = enemy1VelY - enemy2VelY;
              const relVelocity = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
              
              // Damage is less for enemy-enemy collisions
              const baseDamage = 2;
              const velocityDamage = Math.floor(relVelocity);
              const collisionDamage = baseDamage + velocityDamage;
              
              enemy1.health -= collisionDamage;
              enemy2.health -= collisionDamage;
              
              // Push away
              const dx = enemy1.position.x - enemy2.position.x;
              const dy = enemy1.position.y - enemy2.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance > 0) {
                const pushForce = 3; // Stronger push to prevent sticking
                const nx = dx / distance;
                const ny = dy / distance;
                
                enemy1.position.x += nx * pushForce;
                enemy1.position.y += ny * pushForce;
                enemy2.position.x -= nx * pushForce;
                enemy2.position.y -= ny * pushForce;
              }
            }
          }
        }
        
        // Check for power-up collisions
        const collidedPowerUps: number[] = [];
        const updatedPowerUpEffects = { ...newState.powerUpEffects };
        
        newState.powerUps.forEach((powerUp, index) => {
          if (!powerUp.isActive) return;
          
          // Check collision with player
          if (isColliding(powerUp, player)) {
            // Apply power-up effect
            switch (powerUp.type) {
              case 'health':
                updatedPlayerHealth.health = Math.min(updatedPlayerHealth.health + 30, updatedPlayerHealth.maxHealth);
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
        
        // Update power-ups
        const updatedPowerUps = newState.powerUps
          .map((powerUp, index) => {
            if (collidedPowerUps.includes(index)) {
              return { ...powerUp, isActive: false };
            }
            return powerUp;
          })
          .filter(powerUp => powerUp.isActive || collidedPowerUps.includes(newState.powerUps.indexOf(powerUp)));
        
        // Check if player is dead
        if (updatedPlayerHealth.health <= 0) {
          updatedPlayerHealth.health = 0;
          if (soundManager) soundManager.play('gameOver');
          setTimeout(() => handleGameOver(), 500);
        }
        
        // Update enemy count ref
        enemyCountRef.current = updatedEnemiesAfterCollision.length;
        
        // If no enemies left, spawn new ones after a delay
        if (updatedEnemiesAfterCollision.length === 0) {
          console.log("All enemies destroyed, spawning new enemies in 3 seconds");
          setTimeout(() => {
            setGameState(state => {
              // Only spawn if still no enemies
              if (state.enemies.length === 0) {
                const newEnemies = [
                  createEnemy({ x: 50, y: 50 }, dimensions.width, dimensions.height, enemySpeedIncrease),
                  createEnemy({ x: dimensions.width - 50, y: 50 }, dimensions.width, dimensions.height, enemySpeedIncrease)
                ];
                return {
                  ...state,
                  enemies: newEnemies
                };
              }
              return state;
            });
          }, 3000);
        }
        
        // Update state
        return {
          ...newState,
          player: updatedPlayerHealth,
          enemies: updatedEnemiesAfterCollision,
          projectiles: updatedProjectiles,
          obstacles: updatedObstacles,
          powerUps: updatedPowerUps,
          powerUpEffects: updatedPowerUpEffects
        };
      });
    }, 1000 / GAMEPLAY.GAME_FPS); // Game loop at specified FPS
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [gameScreen, inputState, dimensions]);

  const handleEscapePress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleEscapePress);
    return () => {
      window.removeEventListener('keydown', handleEscapePress);
    };
  }, [handleEscapePress]);

  const handleMainMenu = () => {
    setGameState(initialGameState);
    setGameScreen('start');
    setIsMenuOpen(false);
  };

  // Drawing function for canvas
  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    // Clear the canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Only draw if playing or game over
    if (gameScreen === 'playing' || gameScreen === 'gameOver') {
      // Draw obstacles
      gameState.obstacles.forEach(obstacle => {
        if (obstacle.isDestructible) {
          // Destructible obstacles
          ctx.fillStyle = '#8B4513'; // Brown
        } else {
          // Indestructible obstacles (invisible boundary walls)
          ctx.fillStyle = '#444';
        }
        
        // Only draw visible obstacles
        if (
          obstacle.position.x > -obstacle.width/2 && 
          obstacle.position.x < dimensions.width + obstacle.width/2 &&
          obstacle.position.y > -obstacle.height/2 && 
          obstacle.position.y < dimensions.height + obstacle.height/2
        ) {
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
        }
      });
      
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
      
      // Draw shield effect if active
      if (gameState.powerUpEffects.shield) {
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
      
      // Draw debug visualization for screen boundaries
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw debug visualization for player position
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(gameState.player.position.x, gameState.player.position.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw debug text showing player position
      if (GAMEPLAY.DEBUG_OUTPUT) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Player: x=${Math.round(gameState.player.position.x)}, y=${Math.round(gameState.player.position.y)}`, 10, 80);
        ctx.fillText(`Width: ${dimensions.width}, Height: ${dimensions.height}`, 10, 95);
        ctx.fillText(`Wrap thresholds: x < ${-gameState.player.width} or x > ${dimensions.width + gameState.player.width}`, 10, 110);
      }
              
      // Draw UI
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${gameState.score}`, 10, 30);
      
      // Health bar background
      ctx.fillStyle = 'red';
      ctx.fillRect(10, 40, 100, 10);
      
      // Health bar foreground
      ctx.fillStyle = 'green';
      const healthWidth = (gameState.player.health / gameState.player.maxHealth) * 100;
      ctx.fillRect(10, 40, healthWidth, 10);
      
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
      
      // Draw control instructions
      if (gameScreen === 'playing') {
        drawControlsText(ctx, dimensions.width, dimensions.height);
      }
      
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
        
        // Add hint about using Enter key or Space bar
        ctx.font = '16px Arial';
        ctx.fillText('Press Enter, Space, or click to restart', dimensions.width / 2, dimensions.height / 2 + 150);
      }
    }
  }, [gameState, dimensions, gameScreen, highScore]);
  
  // Handle canvas clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    
    // Check if game over screen is showing and click is on "Play Again" button
    if (gameScreen === 'gameOver') {
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
    <div className={styles.gameContainer}>
      {gameScreen === 'playing' && isMenuOpen && (
        <EscapeMenu onClose={() => setIsMenuOpen(false)} onMainMenu={handleMainMenu} />
      )}
      <Canvas 
        draw={draw} 
        width={dimensions.width} 
        height={dimensions.height} 
        onClick={handleCanvasClick}
      />
      
      {gameScreen === 'start' && (
        <StartMenu onStartGame={handleStartGame} highScore={highScore} />
      )}
    </div>
  );
};

export default GameContainer;