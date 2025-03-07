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
  ENEMY_SPAWN_INTERVAL: 2000,
  MAX_ENEMIES: 5,
  ENEMY_SPEED_MIN: 0.8,
  ENEMY_SPEED_MAX: 1.2,
  ENEMY_ROTATION_SPEED: 0.03,
  SHOT_RANGE: 420
};
