'use client';

import { useState, useCallback } from 'react';
import { GameState, Tank, Projectile, PowerUp, PowerUpType } from '@/types/game';
import { ControlSettings, DEFAULT_CONTROL_SETTINGS } from '@/types/controls';
import { createEnemy } from '@/lib/enemies';
import { generateObstacles } from '@/lib/obstacles';
import { generateRandomPowerUp } from '@/lib/powerups';
import { findSafeSpawnPosition } from '@/utils/collision';
import { GAMEPLAY, PLAYFIELD_DIMENSIONS } from '@/constants/game';

// Initial game state
const initialGameState: GameState = {
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
  },
  controls: DEFAULT_CONTROL_SETTINGS
};

/**
 * Custom hook for managing game state
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [highScore, setHighScore] = useState<number>(0);
  const [gameScreen, setGameScreen] = useState<string>('start');
  
  // Initialize the game
  const initGame = useCallback((controlSettings: ControlSettings) => {
    // Generate obstacles
    const obstacles = generateObstacles(
      10, // Number of obstacles
      PLAYFIELD_DIMENSIONS.width,
      PLAYFIELD_DIMENSIONS.height
    );
    
    // Find a safe spawn position for the player
    const safePosition = findSafeSpawnPosition(
      PLAYFIELD_DIMENSIONS.width,
      PLAYFIELD_DIMENSIONS.height,
      40, // Player width
      obstacles,
      50 // Margin
    );
    
    // Create initial game state
    setGameState({
      ...initialGameState,
      player: {
        ...initialGameState.player,
        position: safePosition
      },
      obstacles,
      controls: controlSettings
    });
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('tankGameHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
    
    setGameScreen('game');
  }, []);
  
  // Update player state
  const updatePlayer = useCallback((updatedPlayer: Tank) => {
    setGameState(prevState => ({
      ...prevState,
      player: updatedPlayer
    }));
  }, []);
  
  // Add a projectile
  const addProjectile = useCallback((projectile: Projectile) => {
    setGameState(prevState => ({
      ...prevState,
      projectiles: [...prevState.projectiles, projectile]
    }));
  }, []);
  
  // Update all projectiles
  const updateProjectiles = useCallback((updatedProjectiles: Projectile[]) => {
    setGameState(prevState => ({
      ...prevState,
      projectiles: updatedProjectiles
    }));
  }, []);
  
  // Add an enemy
  const addEnemy = useCallback(() => {
    setGameState(prevState => {
      const newEnemy = createEnemy(
        prevState.player.position,
        PLAYFIELD_DIMENSIONS.width,
        PLAYFIELD_DIMENSIONS.height,
        0 // No speed increase for regular enemy spawns
      );
      
      return {
        ...prevState,
        enemies: [...prevState.enemies, newEnemy]
      };
    });
  }, []);
  
  // Update all enemies
  const updateEnemies = useCallback((updatedEnemies: Tank[]) => {
    setGameState(prevState => ({
      ...prevState,
      enemies: updatedEnemies
    }));
  }, []);
  
  // Add a power-up
  const addPowerUp = useCallback(() => {
    setGameState(prevState => {
      const newPowerUp = generateRandomPowerUp(
        PLAYFIELD_DIMENSIONS.width,
        PLAYFIELD_DIMENSIONS.height,
        prevState.obstacles
      );
      
      if (newPowerUp) {
        return {
          ...prevState,
          powerUps: [...prevState.powerUps, newPowerUp]
        };
      }
      return prevState;
    });
  }, []);
  
  // Update all power-ups
  const updatePowerUps = useCallback((updatedPowerUps: PowerUp[]) => {
    setGameState(prevState => ({
      ...prevState,
      powerUps: updatedPowerUps
    }));
  }, []);
  
  // Activate a power-up effect
  const activatePowerUp = useCallback((type: PowerUpType) => {
    setGameState(prevState => {
      const newPowerUpEffects = { ...prevState.powerUpEffects };
      
      switch (type) {
        case 'speed':
          newPowerUpEffects.speed = 2;
          break;
        case 'shield':
          newPowerUpEffects.shield = true;
          break;
        case 'rapidFire':
          newPowerUpEffects.rapidFire = true;
          break;
      }
      
      return {
        ...prevState,
        powerUpEffects: newPowerUpEffects
      };
    });
  }, []);
  
  // Deactivate a power-up effect
  const deactivatePowerUp = useCallback((type: PowerUpType) => {
    setGameState(prevState => {
      const newPowerUpEffects = { ...prevState.powerUpEffects };
      
      switch (type) {
        case 'speed':
          newPowerUpEffects.speed = 1;
          break;
        case 'shield':
          newPowerUpEffects.shield = false;
          break;
        case 'rapidFire':
          newPowerUpEffects.rapidFire = false;
          break;
      }
      
      return {
        ...prevState,
        powerUpEffects: newPowerUpEffects
      };
    });
  }, []);
  
  // Update score
  const updateScore = useCallback((points: number) => {
    setGameState(prevState => {
      const newScore = prevState.score + points;
      
      // Update high score if needed
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('tankGameHighScore', newScore.toString());
      }
      
      return {
        ...prevState,
        score: newScore
      };
    });
  }, [highScore]);
  
  // Set game over
  const setGameOver = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isGameOver: true
    }));
  }, []);
  
  // Toggle pause state
  const togglePause = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isPaused: !prevState.isPaused
    }));
  }, []);
  
  // Reset the game
  const resetGame = useCallback(() => {
    // Preserve control settings when resetting
    const currentControls = gameState.controls;
    initGame(currentControls);
  }, [gameState.controls, initGame]);
  
  // Update control settings
  const updateControlSettings = useCallback((newSettings: ControlSettings) => {
    setGameState(prevState => {
      return {
        ...prevState,
        controls: newSettings
      };
    });
    
    // Save to localStorage
    localStorage.setItem('tankGameControls', JSON.stringify(newSettings));
  }, []);
  
  return {
    gameState,
    highScore,
    gameScreen,
    setGameScreen,
    initGame,
    updatePlayer,
    addProjectile,
    updateProjectiles,
    addEnemy,
    updateEnemies,
    addPowerUp,
    updatePowerUps,
    activatePowerUp,
    deactivatePowerUp,
    updateScore,
    setGameOver,
    togglePause,
    resetGame,
    updateControlSettings
  };
}
