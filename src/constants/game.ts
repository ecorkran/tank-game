// Game constants

/**
 * Default playfield dimensions
 */
export const PLAYFIELD_DIMENSIONS = {
  width: 1280,
  height: 1024
};

/**
 * Game object sizes
 */
export const SIZES = {
  player: 40,
  enemy: 40,
  projectile: 5,
  powerUp: 20
};

/**
 * Wrapping thresholds for different game objects
 */
export const WRAPPING_THRESHOLDS = {
  player: 21,
  enemy: 21,
  projectile: 5
};

export const GAMEPLAY = {
  // Player constants
  PLAYER_SPEED: 2.75,  // Increased from 1.5 to make it more noticeable
  PLAYER_ROTATION_SPEED: 0.08,
  
  // Enemy spawning
  ENEMY_SPAWN_INTERVAL_MIN: 4000,  // Minimum time between enemy spawns (ms)
  ENEMY_SPAWN_INTERVAL_MAX: 10000, // Maximum time between enemy spawns (ms)
  MAX_ENEMIES: 5,
  MIN_ENEMIES: 2,       // Minimum number of enemies to maintain
  
  // Enemy movement
  ENEMY_SPEED_MIN: 0.30,  // Starting minimum speed (slower than player)
  ENEMY_SPEED_MAX: 0.90,  // Starting maximum speed (slower than player)
  ENEMY_ROTATION_SPEED: 0.02,
  ENEMY_ROTATION_RANDOMNESS: 0.2,  // Rotation speed randomness factor (±20%)
  
  // Enemy attributes
  ENEMY_BASE_HEALTH: 50,
  ENEMY_HEALTH_RANDOMNESS: 0.2,  // Health randomness factor (±20%)
  
  // Enemy speed progression
  ENEMY_SPEED_INCREASE_PER_KILL: 0.02,  // How much to increase speed per enemy killed
  ENEMY_SPEED_MAX_CAP: 2.0,  // Maximum possible enemy speed after increases
  ENEMY_SPEED_RANDOMNESS: 0.02,  // Random variation in speed increase
  ENEMY_POINT_VALUE: 150,
  ENEMY_POINT_MULTIPLER: 1.0,
  ENEMY_RAM_MULTIPLIER: 0.8,
  
  // Projectiles
  SHOT_RANGE: 600,

  // Power-up spawning
  POWERUP_INTERVAL_MIN: 5000,  // Minimum time between power-up spawns (ms)
  POWERUP_INTERVAL_MAX: 12000,  // Maximum time between power-up spawns (ms)
  MAX_ACTIVE_POWERUPS: 3,      // Maximum number of active power-ups at once

  // Game loop
  GAME_FPS: 60,            // Frames per second

  DEBUG_OUTPUT: false,
};
