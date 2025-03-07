import { Obstacle, Position } from '@/types/game';

export const createObstacle = (
  position: Position,
  width: number,
  height: number,
  isDestructible: boolean = false
): Obstacle => {
  return {
    position,
    rotation: 0,
    width,
    height,
    isDestructible,
    ...(isDestructible && { health: 100 })
  };
};

export const generateObstacles = (
  canvasWidth: number,
  canvasHeight: number,
  count: number = 10
): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const minSize = 40;
  const maxSize = 100;
  
  // Create border obstacles (invisible walls)
  obstacles.push(createObstacle(
    { x: canvasWidth / 2, y: -10 },
    canvasWidth,
    20,
    false
  ));
  
  obstacles.push(createObstacle(
    { x: canvasWidth / 2, y: canvasHeight + 10 },
    canvasWidth,
    20,
    false
  ));
  
  obstacles.push(createObstacle(
    { x: -10, y: canvasHeight / 2 },
    20,
    canvasHeight,
    false
  ));
  
  obstacles.push(createObstacle(
    { x: canvasWidth + 10, y: canvasHeight / 2 },
    20,
    canvasHeight,
    false
  ));
  
  // Create random obstacles
  for (let i = 0; i < count; i++) {
    const size = minSize + Math.random() * (maxSize - minSize);
    const isDestructible = Math.random() > 0.7; // 30% chance to be destructible
    
    const x = Math.random() * (canvasWidth - size) + size / 2;
    const y = Math.random() * (canvasHeight - size) + size / 2;
    
    // Check if obstacle is too close to player spawn
    const distToPlayerSpawn = Math.sqrt(
      Math.pow(x - 100, 2) + Math.pow(y - 100, 2)
    );
    
    if (distToPlayerSpawn < 150) {
      // Try again if too close
      i--;
      continue;
    }
    
    obstacles.push(createObstacle(
      { x, y },
      size,
      size,
      isDestructible
    ));
  }
  
  return obstacles;
};