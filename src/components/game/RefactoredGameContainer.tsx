'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Canvas from './Canvas';
import StartMenu from './StartMenu';
import ControlsMenu from './ControlsMenu';
import EscapeMenu from './EscapeMenu';
import { GameState, Tank, Projectile, PowerUpType } from '@/types/game';
import { ControlSettings, DEFAULT_CONTROL_SETTINGS } from '@/types/controls';
import { useInput } from '@/hooks/useInput';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameState } from '@/hooks/useGameState';
import { handleKeyboardControls, handleMouseControls, shouldPlayerFire } from '@/game/controls/controlHandlers';
import { handlePlayerMovement, tryUnstickPlayer } from '@/game/physics/collisionHandler';
import { createPlayerProjectile, updatePlayerCooldown, damagePlayer, handlePlayerWrapping } from '@/game/entities/playerManager';
import { updateEnemies, createEnemyProjectile, updateEnemyCooldowns, damageEnemy } from '@/game/entities/enemyManager';
import { updateProjectiles, checkProjectileCollisions } from '@/game/entities/projectileManager';
import { checkPowerUpCollisions, applyPowerUpEffect } from '@/game/entities/powerUpManager';
import { drawPlayer, drawEnemy, drawProjectile, drawObstacle, drawPowerUp, drawUI, drawControlsText, drawGameOver } from '@/game/rendering/gameRenderer';
import { soundManager } from '@/lib/sounds';
import { GAMEPLAY, PLAYFIELD_DIMENSIONS } from '@/constants/game';
import styles from '@/styles/GameContainer.module.css';

// Define game screen states
enum GameScreen {
  START = 'start',
  GAME = 'game',
  CONTROLS = 'controls',
  PAUSE = 'pause'
}

const RefactoredGameContainer: React.FC = () => {
  // Get game state and methods from custom hook
  const {
    gameState,
    highScore,
    gameScreen,
    setGameScreen,
    initGame,
    updatePlayer,
    addProjectile,
    updateProjectiles: updateProjectilesState,
    addEnemy,
    updateEnemies: updateEnemiesState,
    addPowerUp,
    updatePowerUps,
    activatePowerUp,
    deactivatePowerUp,
    updateScore,
    setGameOver,
    togglePause,
    resetGame,
    updateControlSettings
  } = useGameState();

  // Get input state from custom hook
  const inputState = useInput();
  
  // Canvas ref for rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Timers for spawning enemies and power-ups
  const enemySpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const powerUpSpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Game loop update function
  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.isGameOver || gameState.isPaused) return;
    
    // Extract values from game state
    const { player, enemies, projectiles, obstacles, powerUps, powerUpEffects, controls } = gameState;
    const { scheme: controlScheme, mouseSensitivity, invertY } = controls;
    const { keys, mousePosition, mouseDown } = inputState;
    

    
    // Create a new game state to update
    const newState = { ...gameState };
    
    // Update player cooldown
    const updatedPlayer = updatePlayerCooldown(player, powerUpEffects.rapidFire);
    
    // Handle player movement based on control scheme
    let dx = 0;
    let dy = 0;
    
    if (controlScheme === 'keyboard') {
      // Keyboard controls
      const keyboardDeltas = handleKeyboardControls(updatedPlayer, keys, powerUpEffects.speed);
      dx = keyboardDeltas.dx;
      dy = keyboardDeltas.dy;
    } else if (controlScheme === 'mouse') {
      // Mouse controls
      const mouseDeltas = handleMouseControls(updatedPlayer, mousePosition, powerUpEffects.speed, mouseSensitivity, invertY);
      dx = mouseDeltas.dx;
      dy = mouseDeltas.dy;
    }
    
    // Apply speed boost if shift is held
    if (keys['shift']) {
      dx *= 5;
      dy *= 5;
    }
    
    // Apply movement with obstacle collision detection
    updatedPlayer.position = handlePlayerMovement(updatedPlayer, dx, dy, obstacles);
    
    // Try to unstick player if needed
    const unstuckPosition = tryUnstickPlayer(updatedPlayer, keys, obstacles);
    if (unstuckPosition) {
      updatedPlayer.position = unstuckPosition;
    }
    
    // Handle screen wrapping for player
    const wrappedPlayer = handlePlayerWrapping(updatedPlayer);
    
    // Update player state
    updatePlayer(wrappedPlayer);
    
    // Handle player firing
    if (shouldPlayerFire(controlScheme, keys, mouseDown, wrappedPlayer.cooldown)) {
      // Create and add projectile
      const newProjectile = createPlayerProjectile(wrappedPlayer);
      addProjectile(newProjectile);
      
      // Reset cooldown
      wrappedPlayer.cooldown = powerUpEffects.rapidFire ? 
        wrappedPlayer.maxCooldown / 2 : 
        wrappedPlayer.maxCooldown;
      
      // Play sound
      soundManager?.play('shoot');
    }
    
    // Update projectiles
    const updatedProjectiles = updateProjectiles(projectiles);
    
    // Check projectile collisions
    const { remainingProjectiles, hitPlayer, hitEnemies } = checkProjectileCollisions(
      updatedProjectiles,
      wrappedPlayer,
      enemies,
      obstacles
    );
    
    // Update projectiles state
    updateProjectilesState(remainingProjectiles);
    
    // Handle player hit
    if (hitPlayer) {
      const damagedPlayer = damagePlayer(wrappedPlayer, 10, powerUpEffects.shield);
      updatePlayer(damagedPlayer);
      
      // Play sound
      soundManager?.play('hit');
      
      // Check for game over
      if (damagedPlayer.health <= 0) {
        setGameOver();
        soundManager?.play('explosion');
      }
    }
    
    // Handle enemy hits
    if (hitEnemies.length > 0) {
      // Update enemies with damage
      const updatedEnemies = enemies.map(enemy => {
        const hitEnemy = hitEnemies.find(hit => hit === enemy);
        if (hitEnemy) {
          const damagedEnemy = damageEnemy(enemy, 10);
          
          // Check if enemy is destroyed
          if (damagedEnemy.health <= 0) {
            // Increase score
            updateScore(100);
            soundManager?.play('explosion');
            return null; // Remove destroyed enemy
          }
          
          return damagedEnemy;
        }
        return enemy;
      }).filter(Boolean) as Tank[];
      
      // Update enemies state
      updateEnemiesState(updatedEnemies);
      
      // Play sound
      soundManager?.play('hit');
    }
    
    // Update enemies
    const updatedEnemies = updateEnemies(enemies, wrappedPlayer, obstacles, deltaTime);
    updateEnemiesState(updatedEnemies);
    
    // Handle enemy firing
    const enemiesWithUpdatedCooldowns = updateEnemyCooldowns(updatedEnemies);
    enemiesWithUpdatedCooldowns.forEach(enemy => {
      if (enemy.cooldown <= 0 && Math.random() < 0.01) { // 1% chance to fire each frame
        // Create and add enemy projectile
        const newProjectile = createEnemyProjectile(enemy);
        addProjectile(newProjectile);
        
        // Reset enemy cooldown
        enemy.cooldown = enemy.maxCooldown;
      }
    });
    
    // Check power-up collisions
    const { remainingPowerUps, collectedType } = checkPowerUpCollisions(powerUps, wrappedPlayer);
    
    // Handle collected power-up
    if (collectedType) {
      // Update power-ups state
      updatePowerUps(remainingPowerUps);
      
      // Apply power-up effect
      applyPowerUpEffect(
        collectedType,
        10000, // Power-up duration in milliseconds
        activatePowerUp,
        deactivatePowerUp
      );
      
      // Play sound
      soundManager?.play('powerup');
      
      // Increase score
      updateScore(50);
    }
  }, [gameState, inputState, activatePowerUp, deactivatePowerUp, addProjectile, updatePlayer, updateProjectilesState, updateEnemiesState, updatePowerUps, updateScore, setGameOver]);
  
  // Game loop render function
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Extract values from game state
    const { player, enemies, projectiles, obstacles, powerUps, score, isGameOver, powerUpEffects, controls } = gameState;
    
    // Draw obstacles
    obstacles.forEach(obstacle => drawObstacle(ctx, obstacle));
    
    // Draw power-ups
    powerUps.forEach(powerUp => drawPowerUp(ctx, powerUp));
    
    // Draw projectiles
    projectiles.forEach(projectile => drawProjectile(ctx, projectile));
    
    // Draw enemies
    enemies.forEach(enemy => drawEnemy(ctx, enemy));
    
    // Draw player
    drawPlayer(ctx, player, powerUpEffects.shield);
    
    // Draw UI
    const activePowerUps = [];
    if (powerUpEffects.speed > 1) activePowerUps.push('Speed Boost');
    if (powerUpEffects.shield) activePowerUps.push('Shield');
    if (powerUpEffects.rapidFire) activePowerUps.push('Rapid Fire');
    
    drawUI(ctx, score, activePowerUps, canvas.width, canvas.height);
    
    // Draw control instructions
    drawControlsText(ctx, canvas.width, canvas.height, controls.scheme);
    
    // Draw game over screen if game is over
    if (isGameOver) {
      drawGameOver(ctx, score, highScore, canvas.width, canvas.height);
    }
  }, [gameState, highScore]);
  
  // Get game loop control functions from custom hook
  const { startGameLoop, stopGameLoop } = useGameLoop(updateGame, renderGame, GAMEPLAY.GAME_FPS);
  
  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctxRef.current = ctx;
      }
    }
  }, []);
  
  // Handle game start
  const handleStartGame = useCallback(() => {
    // Initialize game with control settings
    initGame(gameState.controls);
    
    // Start game loop
    startGameLoop();
    
    // Start enemy spawn timer
    enemySpawnTimerRef.current = setInterval(() => {
      addEnemy();
    }, Math.floor(Math.random() * (GAMEPLAY.ENEMY_SPAWN_INTERVAL_MAX - GAMEPLAY.ENEMY_SPAWN_INTERVAL_MIN) + GAMEPLAY.ENEMY_SPAWN_INTERVAL_MIN));
    
    // Start power-up spawn timer
    powerUpSpawnTimerRef.current = setInterval(() => {
      addPowerUp();
    }, Math.floor(Math.random() * (GAMEPLAY.POWERUP_INTERVAL_MAX - GAMEPLAY.POWERUP_INTERVAL_MIN) + GAMEPLAY.POWERUP_INTERVAL_MIN));
    
    // Play sound
    soundManager?.play('start');
  }, [initGame, startGameLoop, addEnemy, addPowerUp]);
  
  // Handle game restart
  const handleRestartGame = useCallback(() => {
    // Reset game state
    resetGame();
    
    // Reset input
    inputState.resetInput();
    
    // Start game loop
    startGameLoop();
    
    // Restart timers
    if (enemySpawnTimerRef.current) {
      clearInterval(enemySpawnTimerRef.current);
    }
    if (powerUpSpawnTimerRef.current) {
      clearInterval(powerUpSpawnTimerRef.current);
    }
    
    enemySpawnTimerRef.current = setInterval(() => {
      addEnemy();
    }, Math.floor(Math.random() * (GAMEPLAY.ENEMY_SPAWN_INTERVAL_MAX - GAMEPLAY.ENEMY_SPAWN_INTERVAL_MIN) + GAMEPLAY.ENEMY_SPAWN_INTERVAL_MIN));
    
    powerUpSpawnTimerRef.current = setInterval(() => {
      addPowerUp();
    }, Math.floor(Math.random() * (GAMEPLAY.POWERUP_INTERVAL_MAX - GAMEPLAY.POWERUP_INTERVAL_MIN) + GAMEPLAY.POWERUP_INTERVAL_MIN));
    
    // Play sound
    soundManager?.play('start');
  }, [resetGame, inputState.resetInput, startGameLoop, addEnemy, addPowerUp]);
  
  // Handle escape key for pause menu
  useEffect(() => {
    if (gameScreen === GameScreen.GAME && inputState.keys['escape']) {
      togglePause();
      setGameScreen(GameScreen.PAUSE);
    }
  }, [gameScreen, inputState.keys, togglePause, setGameScreen]);
  
  // Handle enter key for restart after game over
  useEffect(() => {
    if (gameState.isGameOver && inputState.enterPressed) {
      handleRestartGame();
    }
  }, [gameState.isGameOver, inputState.enterPressed, handleRestartGame]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (enemySpawnTimerRef.current) {
        clearInterval(enemySpawnTimerRef.current);
      }
      if (powerUpSpawnTimerRef.current) {
        clearInterval(powerUpSpawnTimerRef.current);
      }
      stopGameLoop();
    };
  }, [stopGameLoop]);
  
  // Load control settings from localStorage on mount
  useEffect(() => {
    const savedControls = localStorage.getItem('tankGameControls');
    if (savedControls) {
      try {
        const parsedControls = JSON.parse(savedControls) as ControlSettings;
        updateControlSettings(parsedControls);
      } catch (error) {
        console.error('Error parsing saved controls:', error);
        // Fallback to default controls with keyboard scheme
        updateControlSettings({
          ...DEFAULT_CONTROL_SETTINGS,
          scheme: 'keyboard'
        });
      }
    } else {
      // No saved controls, use default with keyboard scheme
      updateControlSettings({
        ...DEFAULT_CONTROL_SETTINGS,
        scheme: 'keyboard'
      });
    }
  }, [updateControlSettings]);
  
  // Render different screens based on game state
  return (
    <div className={styles.gameContainer}>
      {gameScreen === GameScreen.START && (
        <StartMenu onStartGame={handleStartGame} onOpenControls={() => setGameScreen(GameScreen.CONTROLS)} highScore={highScore} />
      )}
      
      {gameScreen === GameScreen.CONTROLS && (
        <ControlsMenu
          controlSettings={gameState.controls}
          onControlChange={updateControlSettings}
          onClose={() => setGameScreen(GameScreen.START)}
        />
      )}
      
      {gameScreen === GameScreen.PAUSE && (
        <EscapeMenu
          onResume={() => {
            togglePause();
            setGameScreen(GameScreen.GAME);
          }}
          onMainMenu={() => {
            togglePause();
            setGameScreen(GameScreen.START);
          }}
          onExit={() => {
            togglePause();
            setGameScreen(GameScreen.START);
          }}
        />
      )}
      
      <Canvas
        draw={(ctx) => {}}
        width={PLAYFIELD_DIMENSIONS.width}
        height={PLAYFIELD_DIMENSIONS.height}
        className={styles.gameCanvas}
        id="gameCanvas"
      />
    </div>
  );
};

export default RefactoredGameContainer;
