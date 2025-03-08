import { Tank, Position } from '@/types/game';
import { calculateWrappedPosition } from '@/utils/position';
import { checkObstacleCollision, isStuckAgainstObstacle } from '@/utils/collision';
import { WRAPPING_THRESHOLDS, SIZES, GAMEPLAY } from '@/constants/game';

export const createEnemy = (
  position: Position, 
  canvasWidth: number, 
  canvasHeight: number,
  speedIncrease: number = 0 // New parameter for progressive difficulty
): Tank => {
  // Calculate base speed range with the speed increase applied
  const minSpeed = Math.min(
    GAMEPLAY.ENEMY_SPEED_MIN + speedIncrease, 
    GAMEPLAY.ENEMY_SPEED_MAX_CAP
  );
  
  const maxSpeed = Math.min(
    GAMEPLAY.ENEMY_SPEED_MAX + speedIncrease, 
    GAMEPLAY.ENEMY_SPEED_MAX_CAP
  );
  
  // Add randomness factor to make each enemy more unique
  // This adds or subtracts a small random amount to the speed increase
  const randomFactor = (Math.random() * 2 - 1) * GAMEPLAY.ENEMY_SPEED_RANDOMNESS;
  
  // Calculate random speed within the adjusted range
  // Apply the random factor to create more variation between enemies
  const speed = Math.max(
    GAMEPLAY.ENEMY_SPEED_MIN,
    Math.min(
      minSpeed + Math.random() * (maxSpeed - minSpeed) + randomFactor,
      GAMEPLAY.ENEMY_SPEED_MAX_CAP
    )
  );
  
  // Add some randomness to health
  const randomizedHealth = Math.round(GAMEPLAY.ENEMY_BASE_HEALTH * (1 - GAMEPLAY.ENEMY_HEALTH_RANDOMNESS/2 + Math.random() * GAMEPLAY.ENEMY_HEALTH_RANDOMNESS));
  
  return {
    position,
    rotation: Math.random() * Math.PI * 2,
    width: SIZES.enemy,
    height: SIZES.enemy,
    health: randomizedHealth,
    maxHealth: randomizedHealth,
    speed,
    // Add some randomness to rotation speed
    rotationSpeed: GAMEPLAY.ENEMY_ROTATION_SPEED * (1 - GAMEPLAY.ENEMY_ROTATION_RANDOMNESS/2 + Math.random() * GAMEPLAY.ENEMY_ROTATION_RANDOMNESS),
    cooldown: Math.floor(Math.random() * 60),
    maxCooldown: 120,
    isPlayer: false
  };
};

// Debug flag to track if enemies are moving
let enemyMoveCount = 0;

export const updateEnemy = (
  enemy: Tank, 
  playerPosition: Position,
  canvasWidth: number,
  canvasHeight: number,
  obstacles: any[] = [] // Default to empty array if no obstacles provided
): Tank => {
  // Log movement for debugging
  const startPos = { ...enemy.position };
  const newEnemy = { ...enemy };
  
  // Calculate angle to player
  const dx = playerPosition.x - enemy.position.x;
  const dy = playerPosition.y - enemy.position.y;
  const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
  const angleToPlayer = Math.atan2(dy, dx);
  
  // Only change direction occasionally to reduce jitter
  // Add time-based variation using current time
  const currentTime = Date.now();
  const shouldChangeDirection = (currentTime % 1000 < 100) || Math.random() < 0.05;
  
  if (shouldChangeDirection) {
    // Rotate towards player with some randomness, but keep it stable most of the time
    // Less random steering when close to player
    const randomFactor = distanceToPlayer < 200 ? 0.1 : 0.3;
    newEnemy.targetRotation = angleToPlayer + (Math.random() - 0.5) * randomFactor;
  }
  
  // If we don't have a target rotation yet, set it
  if (newEnemy.targetRotation === undefined) {
    newEnemy.targetRotation = angleToPlayer;
  }
  
  // Gradually rotate towards target rotation
  let rotationDiff = newEnemy.targetRotation - enemy.rotation;
  
  // Handle angle wrapping
  if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
  if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
  
  if (Math.abs(rotationDiff) < enemy.rotationSpeed) {
    newEnemy.rotation = newEnemy.targetRotation;
  } else {
    newEnemy.rotation += Math.sign(rotationDiff) * enemy.rotationSpeed;
  }
  
  // ALWAYS MOVE FORWARD - no random chance
  const shouldMove = true;
  
  if (shouldMove) {
    // Calculate movement direction based on tank's rotation - exactly like player movement
    const moveX = Math.cos(newEnemy.rotation) * newEnemy.speed;
    const moveY = Math.sin(newEnemy.rotation) * newEnemy.speed;
    
    // Check obstacle collisions BEFORE moving - exactly like player movement
    const obstacleCollision = checkObstacleCollision(
      { x: newEnemy.position.x + moveX, y: newEnemy.position.y + moveY },
      newEnemy.width,
      obstacles
    );
    
    // Apply movement with obstacle sliding - exactly like player movement
    if (!obstacleCollision.collided) {
      // No collision, move normally
      newEnemy.position.x += moveX;
      newEnemy.position.y += moveY;
    } else if (obstacleCollision.correctedPosition) {
      // Use the corrected position from collision detection to prevent penetration
      newEnemy.position = obstacleCollision.correctedPosition;
    } else {
      // Fallback to sliding behavior if no corrected position is available
      if (!obstacleCollision.collidedX) {
        newEnemy.position.x += moveX;
      }
      
      if (!obstacleCollision.collidedY) {
        newEnemy.position.y += moveY;
      }
      
      // Check if enemy is stuck (can't move forward)
      const isStuck = isStuckAgainstObstacle(
        newEnemy.position,
        newEnemy.width,
        newEnemy.rotation,
        obstacles
      );
      
      // If enemy is stuck or completely blocked, try to get unstuck or change direction
      if (isStuck || (obstacleCollision.collidedX && obstacleCollision.collidedY)) {
        // Calculate perpendicular directions to try to nudge the enemy
        const perpX = Math.sin(newEnemy.rotation) * 2;
        const perpY = -Math.cos(newEnemy.rotation) * 2;
        
        // Try nudging in both perpendicular directions
        const nudgePos1 = { x: newEnemy.position.x + perpX, y: newEnemy.position.y + perpY };
        const nudgePos2 = { x: newEnemy.position.x - perpX, y: newEnemy.position.y - perpY };
        
        const collision1 = checkObstacleCollision(nudgePos1, newEnemy.width, obstacles);
        const collision2 = checkObstacleCollision(nudgePos2, newEnemy.width, obstacles);
        
        // Apply the nudge if one direction is clear
        if (!collision1.collided) {
          newEnemy.position.x = nudgePos1.x;
          newEnemy.position.y = nudgePos1.y;
        } else if (!collision2.collided) {
          newEnemy.position.x = nudgePos2.x;
          newEnemy.position.y = nudgePos2.y;
        } else {
          // If still stuck, change direction significantly
          const currentAngle = newEnemy.rotation;
          const turnAngles = [Math.PI/2, -Math.PI/2, Math.PI]; // 90° left, 90° right, or 180°
          
          // Pick one of the angles based on current time to avoid random jitter
          const angleIndex = Math.floor(currentTime / 1000) % turnAngles.length;
          newEnemy.targetRotation = currentAngle + turnAngles[angleIndex];
        }
      }
    }
  }
  
  // Screen edge wrapping using the shared utility function
  const wrappedPosition = calculateWrappedPosition(
    newEnemy.position.x, 
    newEnemy.position.y, 
    WRAPPING_THRESHOLDS.enemy, 
    { width: canvasWidth, height: canvasHeight }
  );
  newEnemy.position.x = wrappedPosition.x;
  newEnemy.position.y = wrappedPosition.y;
  
  // If enemy is near edge, more strongly encourage moving inward
  const edgeMargin = 70;
  if (
    newEnemy.position.x < edgeMargin || 
    newEnemy.position.x > canvasWidth - edgeMargin ||
    newEnemy.position.y < edgeMargin || 
    newEnemy.position.y > canvasHeight - edgeMargin
  ) {
    // Use time-based check instead of random to avoid jitter
    const shouldTurnToCenter = (currentTime % 2000 < 500); // 25% of the time in a 2-second cycle
    
    if (shouldTurnToCenter) {
      // Target center of screen
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      // Calculate angle to center
      const dx = centerX - newEnemy.position.x;
      const dy = centerY - newEnemy.position.y;
      // Set target rotation so turning is smooth
      newEnemy.targetRotation = Math.atan2(dy, dx);
    }
  }
  
  // Update cooldown
  if (newEnemy.cooldown > 0) {
    newEnemy.cooldown--;
  }
  
  // Check if we actually moved
  const endPos = newEnemy.position;
  const didMove = (
    Math.abs(endPos.x - startPos.x) > 0.1 || 
    Math.abs(endPos.y - startPos.y) > 0.1
  );
  
  if (didMove) {
    enemyMoveCount++;
    if (enemyMoveCount % 10 === 0) {
      console.log(`Enemy moved: ${startPos.x.toFixed(1)},${startPos.y.toFixed(1)} -> ${endPos.x.toFixed(1)},${endPos.y.toFixed(1)}`);
    }
  }
  
  return newEnemy;
};