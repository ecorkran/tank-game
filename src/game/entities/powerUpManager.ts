import { PowerUp, Tank, PowerUpType } from '@/types/game';
import { isColliding } from '../physics/collisionHandler';

/**
 * Check for power-up collisions with the player
 */
export function checkPowerUpCollisions(
  powerUps: PowerUp[],
  player: Tank
): {
  remainingPowerUps: PowerUp[];
  collectedType: PowerUpType | null;
} {
  let collectedType: PowerUpType | null = null;
  const remainingPowerUps: PowerUp[] = [];
  
  for (const powerUp of powerUps) {
    if (isColliding(powerUp, player)) {
      collectedType = powerUp.type;
    } else {
      remainingPowerUps.push(powerUp);
    }
  }
  
  return { remainingPowerUps, collectedType };
}

/**
 * Apply power-up effects
 */
export function applyPowerUpEffect(
  type: PowerUpType,
  duration: number,
  onActivate: (type: PowerUpType) => void,
  onDeactivate: (type: PowerUpType) => void
): void {
  // Activate the power-up effect
  onActivate(type);
  
  // Set a timer to deactivate the effect after the duration
  setTimeout(() => {
    onDeactivate(type);
  }, duration);
}
