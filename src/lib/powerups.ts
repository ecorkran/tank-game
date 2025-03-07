import { Position, PowerUp, PowerUpType, Obstacle } from '@/types/game';

export const createPowerUp = (
  position: Position,
  type: PowerUpType
): PowerUp => {
  const size = 30;
  let duration = 5000; // 5 seconds default
  
  // Adjust duration based on type
  switch (type) {
    case 'health':
      duration = 0; // instant effect
      break;
    case 'speed':
      duration = 8000; // 8 seconds
      break;
    case 'rapidFire':
      duration = 6000; // 6 seconds
      break;
    case 'shield':
      duration = 7000; // 7 seconds
      break;
  }
  
  return {
    position,
    rotation: 0, // Power-ups don't rotate but need this for GameObject
    type,
    width: size,
    height: size,
    duration,
    isActive: true
  };
};

export const generateRandomPowerUp = (
  canvasWidth: number,
  canvasHeight: number,
  obstacles: Obstacle[]
): PowerUp | null => {
  // Define power-up types with weights
  const powerUpTypes: PowerUpType[] = ['health', 'speed', 'rapidFire', 'shield'];
  const weights = [0.4, 0.2, 0.2, 0.2]; // 40% health, 20% for others
  
  // Choose random type based on weights
  const random = Math.random();
  let cumulativeWeight = 0;
  let selectedType: PowerUpType = 'health';
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      selectedType = powerUpTypes[i];
      break;
    }
  }
  
  // Generate random position
  let position: Position;
  let isValidPosition = false;
  let attempts = 0;
  
  // Try to find a valid position
  while (!isValidPosition && attempts < 20) {
    attempts++;
    
    position = {
      x: Math.random() * (canvasWidth - 60) + 30,
      y: Math.random() * (canvasHeight - 60) + 30
    };
    
    // Check if position is far enough from obstacles
    isValidPosition = true;
    for (const obstacle of obstacles) {
      const dx = position!.x - obstacle.position.x;
      const dy = position!.y - obstacle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < obstacle.width / 2 + 40) {
        isValidPosition = false;
        break;
      }
    }
  }
  
  // If couldn't find valid position after max attempts
  if (!isValidPosition) return null;
  
  return createPowerUp(position!, selectedType);
};