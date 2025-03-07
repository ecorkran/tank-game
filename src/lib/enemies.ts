import { Tank, Position } from '@/types/game';
import { calculateWrappedPosition } from '@/utils/position';

export const createEnemy = (
  position: Position, 
  canvasWidth: number, 
  canvasHeight: number
): Tank => {
  return {
    position,
    rotation: Math.random() * Math.PI * 2,
    width: 40,
    height: 40,
    health: 50,
    maxHealth: 50,
    speed: 1.2 + Math.random() * 0.8, // Increased speed so movement is more obvious
    rotationSpeed: 0.03, // Fixed rotation speed for more predictable turning
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
  // We'll always move forward unless there's an obstacle
  const shouldMove = true;
  
  if (shouldMove) {
    const newPosX = newEnemy.position.x + Math.cos(newEnemy.rotation) * newEnemy.speed;
    const newPosY = newEnemy.position.y + Math.sin(newEnemy.rotation) * newEnemy.speed;
    
    // Check for obstacle collisions
    let canMove = true;
    
    for (const obstacle of obstacles) {
      const dx = Math.abs(newPosX - obstacle.position.x);
      const dy = Math.abs(newPosY - obstacle.position.y);
      const collisionDist = newEnemy.width/2 + obstacle.width/2;
      
      if (dx < collisionDist && dy < collisionDist) {
        canMove = false;
        break;
      }
    }
    
    if (canMove) {
      newEnemy.position.x = newPosX;
      newEnemy.position.y = newPosY;
    } else {
      // If collision detected, pick a specific new direction instead of random jitter
      // Turn perpendicular to obstacle
      const currentAngle = newEnemy.rotation;
      const turnAngles = [Math.PI/2, -Math.PI/2, Math.PI]; // 90° left, 90° right, or 180°
      
      // Pick one of the angles based on current time to avoid random jitter
      const angleIndex = Math.floor(currentTime / 1000) % turnAngles.length;
      newEnemy.targetRotation = currentAngle + turnAngles[angleIndex];
    }
  }
  
  // Screen edge wrapping using the shared utility function
  const L = 21; // Same threshold as player for consistency
  const wrappedPosition = calculateWrappedPosition(
    newEnemy.position.x, 
    newEnemy.position.y, 
    L, 
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