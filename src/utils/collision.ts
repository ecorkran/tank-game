import { GameObject, Position } from '@/types/game';

/**
 * Checks if a position would collide with any obstacles
 * @param position - The position to check
 * @param size - The size of the object
 * @param obstacles - Array of obstacles to check against
 * @returns Object with collision information
 */
export const checkObstacleCollision = (
  position: Position, 
  size: number, 
  obstacles: GameObject[]
): { collided: boolean; collidedX: boolean; collidedY: boolean; correctedPosition?: Position } => {
  let collidedX = false;
  let collidedY = false;
  let correctedPosition: Position | undefined = undefined;
  
  // Increase safety margin to be more conservative with collision detection
  const safetyMargin = 1.0;
  
  for (const obstacle of obstacles) {
    const halfWidth = (size/2 + obstacle.width/2) + safetyMargin;
    const halfHeight = (size/2 + obstacle.height/2) + safetyMargin;
    
    const dx = Math.abs(position.x - obstacle.position.x);
    const dy = Math.abs(position.y - obstacle.position.y);
    
    // Check if we're inside or touching the obstacle
    if (dx < halfWidth && dy < halfHeight) {
      // Calculate penetration depth on each axis
      const overlapX = halfWidth - dx;
      const overlapY = halfHeight - dy;
      
      // Create a corrected position that pushes the object outside the obstacle
      if (!correctedPosition) {
        correctedPosition = { ...position };
      }
      
      // Determine which axis has the smaller overlap and push out in that direction
      if (overlapX <= overlapY) {
        collidedX = true;
        // Push out horizontally in the correct direction
        const pushDirection = position.x < obstacle.position.x ? -1 : 1;
        correctedPosition.x = position.x + pushDirection * overlapX;
      } else {
        collidedY = true;
        // Push out vertically in the correct direction
        const pushDirection = position.y < obstacle.position.y ? -1 : 1;
        correctedPosition.y = position.y + pushDirection * overlapY;
      }
      
      // If the overlap is very small on both axes, block movement on both
      // This prevents corner-case penetrations
      if (overlapX < 2 && overlapY < 2) {
        collidedX = true;
        collidedY = true;
      }
      
      // We've found a collision, no need to check other obstacles
      break;
    }
  }
  
  return {
    collided: collidedX || collidedY,
    collidedX,
    collidedY,
    correctedPosition: (collidedX || collidedY) ? correctedPosition : undefined
  };
};

/**
 * Finds a safe position for spawning that doesn't collide with obstacles
 * @param width - Canvas width
 * @param height - Canvas height
 * @param objectSize - Size of the object to spawn
 * @param obstacles - Array of obstacles to avoid
 * @param margin - Optional margin from edges (default: 100)
 * @returns A safe position for spawning
 */
export const findSafeSpawnPosition = (
  width: number,
  height: number,
  objectSize: number,
  obstacles: GameObject[],
  margin: number = 100
): Position => {
  // Try up to 50 times to find a safe position
  for (let attempts = 0; attempts < 50; attempts++) {
    // Generate a random position within the playfield, respecting margins
    const x = margin + Math.random() * (width - 2 * margin);
    const y = margin + Math.random() * (height - 2 * margin);
    
    // Check if this position collides with any obstacles
    const collision = checkObstacleCollision({ x, y }, objectSize, obstacles);
    
    // If no collision, return this position
    if (!collision.collided) {
      return { x, y };
    }
  }
  
  // If we couldn't find a safe position after 50 attempts, use a default position
  // in the center of the playfield (this should rarely happen)
  return { x: width / 2, y: height / 2 };
};

/**
 * Detects if an object is stuck against obstacles
 * @param currentPosition - Current position of the object
 * @param size - Size of the object
 * @param rotation - Rotation angle in radians
 * @param obstacles - Array of obstacles to check against
 * @returns Whether the object is stuck
 */
export const isStuckAgainstObstacle = (
  currentPosition: Position,
  size: number,
  rotation: number,
  obstacles: GameObject[]
): boolean => {
  // Check forward and backward movement
  const forwardX = currentPosition.x + Math.cos(rotation) * 5;
  const forwardY = currentPosition.y + Math.sin(rotation) * 5;
  const backwardX = currentPosition.x - Math.cos(rotation) * 5;
  const backwardY = currentPosition.y - Math.sin(rotation) * 5;
  
  // Check if both forward and backward movements would cause collisions
  const forwardCollision = checkObstacleCollision(
    { x: forwardX, y: forwardY },
    size,
    obstacles
  );
  
  const backwardCollision = checkObstacleCollision(
    { x: backwardX, y: backwardY },
    size,
    obstacles
  );
  
  // If both forward and backward movements cause collisions, the object is stuck
  return forwardCollision.collided && backwardCollision.collided;
};
