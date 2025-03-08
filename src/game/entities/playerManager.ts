import { Tank, Projectile, Position } from '@/types/game';
import { calculateWrappedPosition } from '@/utils/position';
import { PLAYFIELD_DIMENSIONS, WRAPPING_THRESHOLDS } from '@/constants/game';

/**
 * Create a projectile fired by the player
 */
export function createPlayerProjectile(player: Tank): Projectile {
  const projectileSpeed = 10;
  
  return {
    position: {
      x: player.position.x + Math.cos(player.rotation) * (player.width / 2),
      y: player.position.y + Math.sin(player.rotation) * (player.width / 2)
    },
    rotation: player.rotation,
    width: 8,
    height: 4,
    speed: projectileSpeed,
    damage: 10,
    isActive: true,
    distanceTraveled: 0,
    owner: 'player'
  };
}

/**
 * Handle player cooldown for firing
 */
export function updatePlayerCooldown(player: Tank, rapidFire: boolean): Tank {
  // Create a new player object to avoid mutating the original
  const updatedPlayer = { ...player };
  
  // Reduce cooldown if it's active
  if (updatedPlayer.cooldown > 0) {
    // Faster cooldown reduction with rapid fire power-up
    updatedPlayer.cooldown -= rapidFire ? 2 : 1;
  }
  
  return updatedPlayer;
}

/**
 * Apply damage to the player
 */
export function damagePlayer(player: Tank, damage: number, shieldActive: boolean): Tank {
  // Create a new player object to avoid mutating the original
  const updatedPlayer = { ...player };
  
  // If shield is active, don't take damage
  if (!shieldActive) {
    updatedPlayer.health -= damage;
  }
  
  return updatedPlayer;
}

/**
 * Handle screen wrapping for the player
 */
export function handlePlayerWrapping(player: Tank): Tank {
  // Create a new player object to avoid mutating the original
  const updatedPlayer = { ...player };
  
  // Screen edge wrapping
  const { x, y } = calculateWrappedPosition(
    updatedPlayer.position.x,
    updatedPlayer.position.y,
    WRAPPING_THRESHOLDS.player,
    PLAYFIELD_DIMENSIONS
  );
  updatedPlayer.position.x = x;
  updatedPlayer.position.y = y;
  
  return updatedPlayer;
}
