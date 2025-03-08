import { GameObject, Obstacle, Position, Tank } from '@/types/game';
import { checkObstacleCollision, isStuckAgainstObstacle } from '@/utils/collision';

interface CollisionResult {
  collided: boolean;
  position: Position;
}

/**
 * Handle player movement with obstacle collision detection
 */
export function handlePlayerMovement(
  player: Tank,
  dx: number,
  dy: number,
  obstacles: Obstacle[]
): Position {
  // Check obstacle collisions
  const obstacleCollision = checkObstacleCollision(
    { x: player.position.x + dx, y: player.position.y + dy },
    player.width,
    obstacles
  );
  
  // Create a new position object to avoid mutating the original
  const newPosition = { ...player.position };
  
  // Apply movement with obstacle sliding
  if (!obstacleCollision.collided) {
    newPosition.x += dx;
    newPosition.y += dy;
  } else if (obstacleCollision.correctedPosition) {
    // Use the corrected position from collision detection to prevent penetration
    newPosition.x = obstacleCollision.correctedPosition.x;
    newPosition.y = obstacleCollision.correctedPosition.y;
  } else {
    // Fallback to sliding behavior if no corrected position is available
    if (!obstacleCollision.collidedX) newPosition.x += dx;
    if (!obstacleCollision.collidedY) newPosition.y += dy;
  }
  
  return newPosition;
}

/**
 * Try to unstick the player if they're stuck against an obstacle
 */
export function tryUnstickPlayer(
  player: Tank,
  keys: { [key: string]: boolean },
  obstacles: Obstacle[]
): Position | null {
  // Check if player is stuck (can't move forward or backward)
  const isStuck = isStuckAgainstObstacle(
    player.position,
    player.width,
    player.rotation,
    obstacles
  );
  
  // If player is stuck, try to help them get unstuck by applying a small nudge
  if (isStuck && (keys['w'] || keys['s'] || keys['arrowup'] || keys['arrowdown'])) {
    // Calculate perpendicular direction to try to nudge the player
    const perpX = Math.sin(player.rotation) * 2;
    const perpY = -Math.cos(player.rotation) * 2;
    
    // Try nudging in both perpendicular directions
    const nudgePos1 = { x: player.position.x + perpX, y: player.position.y + perpY };
    const nudgePos2 = { x: player.position.x - perpX, y: player.position.y - perpY };
    
    const collision1 = checkObstacleCollision(nudgePos1, player.width, obstacles);
    const collision2 = checkObstacleCollision(nudgePos2, player.width, obstacles);
    
    // Apply the nudge if one direction is clear
    if (!collision1.collided) {
      return nudgePos1;
    } else if (!collision2.collided) {
      return nudgePos2;
    }
  }
  
  return null;
}

/**
 * Check if two game objects are colliding
 */
export function isColliding(obj1: GameObject, obj2: GameObject): boolean {
  const halfWidth1 = obj1.width / 2;
  const halfHeight1 = obj1.height / 2;
  const halfWidth2 = obj2.width / 2;
  const halfHeight2 = obj2.height / 2;
  
  // Simple AABB collision detection
  return (
    Math.abs(obj1.position.x - obj2.position.x) < halfWidth1 + halfWidth2 &&
    Math.abs(obj1.position.y - obj2.position.y) < halfHeight1 + halfHeight2
  );
}
