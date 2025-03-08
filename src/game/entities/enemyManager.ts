import { Tank, Projectile, Position, Obstacle } from '@/types/game';
import { updateEnemy } from '@/lib/enemies';
import { calculateWrappedPosition } from '@/utils/position';
import { PLAYFIELD_DIMENSIONS, WRAPPING_THRESHOLDS } from '@/constants/game';

/**
 * Update all enemies in the game
 */
export function updateEnemies(
  enemies: Tank[],
  player: Tank,
  obstacles: Obstacle[],
  deltaTime: number
): Tank[] {
  return enemies.map(enemy => {
    // Update enemy behavior using the existing updateEnemy function
    const updatedEnemy = updateEnemy(enemy, player.position, PLAYFIELD_DIMENSIONS.width, PLAYFIELD_DIMENSIONS.height, obstacles);
    
    // Apply screen wrapping
    const { x, y } = calculateWrappedPosition(
      updatedEnemy.position.x,
      updatedEnemy.position.y,
      WRAPPING_THRESHOLDS.enemy,
      PLAYFIELD_DIMENSIONS
    );
    updatedEnemy.position.x = x;
    updatedEnemy.position.y = y;
    
    return updatedEnemy;
  });
}

/**
 * Create a projectile fired by an enemy
 */
export function createEnemyProjectile(enemy: Tank): Projectile {
  const projectileSpeed = 8; // Slightly slower than player projectiles
  
  return {
    position: {
      x: enemy.position.x + Math.cos(enemy.rotation) * (enemy.width / 2),
      y: enemy.position.y + Math.sin(enemy.rotation) * (enemy.width / 2)
    },
    rotation: enemy.rotation,
    width: 6,
    height: 3,
    speed: projectileSpeed,
    damage: 5,
    isActive: true,
    distanceTraveled: 0,
    owner: 'enemy'
  };
}

/**
 * Handle enemy cooldown for firing
 */
export function updateEnemyCooldowns(enemies: Tank[]): Tank[] {
  return enemies.map(enemy => {
    // Create a new enemy object to avoid mutating the original
    const updatedEnemy = { ...enemy };
    
    // Reduce cooldown if it's active
    if (updatedEnemy.cooldown > 0) {
      updatedEnemy.cooldown -= 1;
    }
    
    return updatedEnemy;
  });
}

/**
 * Apply damage to an enemy
 */
export function damageEnemy(enemy: Tank, damage: number): Tank {
  // Create a new enemy object to avoid mutating the original
  const updatedEnemy = { ...enemy };
  
  updatedEnemy.health -= damage;
  
  return updatedEnemy;
}
