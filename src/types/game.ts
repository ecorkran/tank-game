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
  targetRotation?: number; // Optional target rotation for enemy AI
}

export interface Projectile extends GameObject {
  speed: number;
  damage: number;
  isActive: boolean;
}

export interface Obstacle extends GameObject {
  isDestructible: boolean;
  health?: number;
}

export type PowerUpType = 'health' | 'speed' | 'rapidFire' | 'shield';

export interface PowerUp extends GameObject {
  type: PowerUpType;
  duration: number;
  isActive: boolean;
}

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