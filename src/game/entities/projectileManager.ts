import { Projectile, Tank, Obstacle } from '@/types/game';
import { isColliding } from '../physics/collisionHandler';
import { calculateWrappedPosition } from '@/utils/position';
import { PLAYFIELD_DIMENSIONS, WRAPPING_THRESHOLDS } from '@/constants/game';

/**
 * Update all projectiles in the game
 */
export function updateProjectiles(projectiles: Projectile[]): Projectile[] {
  return projectiles.map(projectile => {
    // Create a new projectile object to avoid mutating the original
    const updatedProjectile = { ...projectile };
    
    // Move projectile forward
    updatedProjectile.position.x += Math.cos(projectile.rotation) * projectile.speed;
    updatedProjectile.position.y += Math.sin(projectile.rotation) * projectile.speed;
    
    // Apply screen wrapping
    const { x, y } = calculateWrappedPosition(
      updatedProjectile.position.x,
      updatedProjectile.position.y,
      WRAPPING_THRESHOLDS.projectile,
      PLAYFIELD_DIMENSIONS
    );
    updatedProjectile.position.x = x;
    updatedProjectile.position.y = y;
    
    return updatedProjectile;
  });
}

/**
 * Check for projectile collisions with tanks and obstacles
 */
export function checkProjectileCollisions(
  projectiles: Projectile[],
  player: Tank,
  enemies: Tank[],
  obstacles: Obstacle[]
): {
  remainingProjectiles: Projectile[];
  hitPlayer: boolean;
  hitEnemies: Tank[];
} {
  let hitPlayer = false;
  const hitEnemies: Tank[] = [];
  const remainingProjectiles: Projectile[] = [];
  
  projectiles.forEach(projectile => {
    let hasCollided = false;
    
    // Check collision with obstacles
    for (const obstacle of obstacles) {
      if (isColliding(projectile, obstacle)) {
        hasCollided = true;
        break;
      }
    }
    
    // Check collision with player (only enemy projectiles can hit player)
    if (!hasCollided && projectile.owner === 'enemy' && isColliding(projectile, player)) {
      hitPlayer = true;
      hasCollided = true;
    }
    
    // Check collision with enemies (only player projectiles can hit enemies)
    if (!hasCollided && projectile.owner === 'player') {
      for (const enemy of enemies) {
        if (isColliding(projectile, enemy)) {
          hitEnemies.push(enemy);
          hasCollided = true;
          break;
        }
      }
    }
    
    // Keep projectile if it hasn't collided with anything
    if (!hasCollided) {
      remainingProjectiles.push(projectile);
    }
  });
  
  return { remainingProjectiles, hitPlayer, hitEnemies };
}
