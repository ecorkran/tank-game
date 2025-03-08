import { GameState, Projectile, PowerUp, Tank, Obstacle } from '@/types/game';
import { ControlScheme } from '@/types/controls';
import { PLAYFIELD_DIMENSIONS } from '@/constants/game';

/**
 * Draw the player tank
 */
export function drawPlayer(ctx: CanvasRenderingContext2D, player: Tank, shieldActive: boolean): void {
  const { position, rotation, width, health, maxHealth } = player;
  
  ctx.save();
  
  // Translate to tank position and rotate
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation);
  
  // Draw tank body
  ctx.fillStyle = '#3498db';
  ctx.fillRect(-width / 2, -width / 2, width, width);
  
  // Draw tank cannon
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(-2, -width / 2, 4, width / 2);
  
  // Draw shield if active
  if (shieldActive) {
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, width / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.restore();
  
  // Draw health bar above tank
  const healthBarWidth = width;
  const healthBarHeight = 5;
  const healthPercent = health / maxHealth;
  
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(
    position.x - healthBarWidth / 2,
    position.y - width / 2 - 10,
    healthBarWidth,
    healthBarHeight
  );
  
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(
    position.x - healthBarWidth / 2,
    position.y - width / 2 - 10,
    healthBarWidth * healthPercent,
    healthBarHeight
  );
}

/**
 * Draw an enemy tank
 */
export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Tank): void {
  const { position, rotation, width, health, maxHealth } = enemy;
  
  ctx.save();
  
  // Translate to tank position and rotate
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation);
  
  // Draw tank body
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-width / 2, -width / 2, width, width);
  
  // Draw tank cannon
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(-2, -width / 2, 4, width / 2);
  
  ctx.restore();
  
  // Draw health bar above tank
  const healthBarWidth = width;
  const healthBarHeight = 5;
  const healthPercent = health / maxHealth;
  
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(
    position.x - healthBarWidth / 2,
    position.y - width / 2 - 10,
    healthBarWidth,
    healthBarHeight
  );
  
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(
    position.x - healthBarWidth / 2,
    position.y - width / 2 - 10,
    healthBarWidth * healthPercent,
    healthBarHeight
  );
}

/**
 * Draw a projectile
 */
export function drawProjectile(ctx: CanvasRenderingContext2D, projectile: Projectile): void {
  const { position, rotation, width, height } = projectile;
  
  ctx.save();
  
  // Translate to projectile position and rotate
  ctx.translate(position.x, position.y);
  ctx.rotate(rotation);
  
  // Draw projectile
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(-width / 2, -height / 2, width, height);
  
  ctx.restore();
}

/**
 * Draw an obstacle
 */
export function drawObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle): void {
  const { position, width, height } = obstacle;
  
  ctx.fillStyle = '#7f8c8d';
  ctx.fillRect(
    position.x - width / 2,
    position.y - height / 2,
    width,
    height
  );
}

/**
 * Draw a power-up
 */
export function drawPowerUp(ctx: CanvasRenderingContext2D, powerUp: PowerUp): void {
  const { position, width, type } = powerUp;
  
  ctx.save();
  
  // Translate to power-up position
  ctx.translate(position.x, position.y);
  
  // Different colors for different power-up types
  switch (type) {
    case 'speed':
      ctx.fillStyle = '#3498db';
      break;
    case 'shield':
      ctx.fillStyle = '#2ecc71';
      break;
    case 'rapidFire':
      ctx.fillStyle = '#e67e22';
      break;
    default:
      ctx.fillStyle = '#9b59b6';
  }
  
  // Draw power-up as a circle
  ctx.beginPath();
  ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw power-up icon/symbol
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let symbol = '';
  switch (type) {
    case 'speed':
      symbol = 'S';
      break;
    case 'shield':
      symbol = 'P';
      break;
    case 'rapidFire':
      symbol = 'R';
      break;
  }
  
  ctx.fillText(symbol, 0, 0);
  
  ctx.restore();
}

/**
 * Draw the game score and active power-ups
 */
export function drawUI(
  ctx: CanvasRenderingContext2D,
  score: number,
  activePowerUps: string[],
  width: number,
  height: number
): void {
  // Draw score
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 30);
  
  // Draw active power-ups
  if (activePowerUps.length > 0) {
    ctx.fillText('Active Power-ups:', 20, 60);
    activePowerUps.forEach((powerUp, index) => {
      ctx.fillText(`- ${powerUp}`, 30, 90 + index * 25);
    });
  }
}

/**
 * Draw control instructions based on the current control scheme
 */
export function drawControlsText(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  controlScheme: ControlScheme
): void {
  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'right';
  
  if (controlScheme === 'keyboard') {
    ctx.fillText('W - Forward', width - 210, height - 75);
    ctx.fillText('S - Backward', width - 210, height - 55);
    ctx.fillText('A - Rotate Left', width - 210, height - 35);
    ctx.fillText('D - Rotate Right', width - 210, height - 15);
    ctx.fillText('Space/Click - Fire', width - 90, height - 75);
    ctx.fillText('ESC - Pause', width - 90, height - 55);
  } 
  else if (controlScheme === 'mouse') {
    ctx.fillText('Move Mouse - Aim', width - 210, height - 75);
    ctx.fillText('Mouse Distance - Move', width - 210, height - 55);
    ctx.fillText('Mouse Click/Space - Fire', width - 210, height - 35);
    ctx.fillText('ESC - Pause', width - 210, height - 15);
  }
}

/**
 * Draw the game over screen
 */
export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  score: number,
  highScore: number,
  width: number,
  height: number
): void {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);
  
  // Game over text
  ctx.fillStyle = '#fff';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', width / 2, height / 2 - 50);
  
  // Score
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score}`, width / 2, height / 2);
  
  // High score
  ctx.fillText(`High Score: ${highScore}`, width / 2, height / 2 + 40);
  
  // Restart instructions
  ctx.font = '18px Arial';
  ctx.fillText('Press Enter to Restart', width / 2, height / 2 + 100);
}
