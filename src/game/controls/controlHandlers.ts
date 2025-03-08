import { ControlScheme, ControlSettings } from '@/types/controls';
import { Position, Tank } from '@/types/game';
import { CONTROLS, GAMEPLAY } from '@/constants/game';

interface InputState {
  keys: { [key: string]: boolean };
  mousePosition: { x: number; y: number };
  mouseDown: boolean;
}

interface MovementDeltas {
  dx: number;
  dy: number;
}

/**
 * Handle keyboard controls for the player tank
 */
export function handleKeyboardControls(
  player: Tank,
  keys: { [key: string]: boolean },
  powerUpSpeedMultiplier: number
): MovementDeltas {
  let dx = 0;
  let dy = 0;

  // Movement with WASD/arrows
  if (keys['w'] || keys['arrowup']) {
    dx += Math.cos(player.rotation) * player.speed * powerUpSpeedMultiplier;
    dy += Math.sin(player.rotation) * player.speed * powerUpSpeedMultiplier;
  }
  if (keys['s'] || keys['arrowdown']) {
    dx -= Math.cos(player.rotation) * player.speed * powerUpSpeedMultiplier;
    dy -= Math.sin(player.rotation) * player.speed * powerUpSpeedMultiplier;
  }
  if (keys['a'] || keys['arrowleft']) {
    // Rotate left (counter-clockwise)
    player.rotation -= player.rotationSpeed;
  }
  if (keys['d'] || keys['arrowright']) {
    // Rotate right (clockwise)
    player.rotation += player.rotationSpeed;
  }

  return { dx, dy };
}

/**
 * Handle mouse controls for the player tank
 */
export function handleMouseControls(
  player: Tank,
  mousePosition: { x: number; y: number },
  powerUpSpeedMultiplier: number,
  mouseSensitivity: number,
  invertY: boolean
): MovementDeltas {
  let dx = 0;
  let dy = 0;

  // Mouse control mode - tank follows mouse cursor
  const canvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement;
  
  if (canvasElement) {
    const canvasRect = canvasElement.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    const relativeMouseX = mousePosition.x - canvasRect.left;
    const relativeMouseY = mousePosition.y - canvasRect.top;
    
    // Calculate angle to mouse position
    const angleToMouse = Math.atan2(
      relativeMouseY - player.position.y,
      relativeMouseX - player.position.x
    );
    
    // Set player rotation directly to face the mouse
    player.rotation = angleToMouse;
    
    // Calculate distance to mouse
    const distToMouse = Math.sqrt(
      Math.pow(relativeMouseX - player.position.x, 2) + 
      Math.pow(relativeMouseY - player.position.y, 2)
    );
    
    // Move toward mouse if it's far enough away
    if (distToMouse > CONTROLS.MOUSE_DISTANCE_THRESHOLD) {
      // Fixed speed for consistent movement
      const moveSpeed = player.speed * CONTROLS.MOUSE_FOLLOW_SPEED * powerUpSpeedMultiplier * mouseSensitivity;
      
      // Apply movement in the direction of the mouse
      dx = Math.cos(angleToMouse) * moveSpeed;
      dy = Math.sin(angleToMouse) * moveSpeed;
      
      // Apply inversion if needed
      if (invertY) {
        dy = -dy;
      }
    }
  }

  return { dx, dy };
}

/**
 * Determine if the player should fire based on input state and control scheme
 */
export function shouldPlayerFire(
  controlScheme: ControlScheme,
  keys: { [key: string]: boolean },
  mouseDown: boolean,
  cooldown: number
): boolean {
  // Allow firing with both space and mouse click in all control schemes
  return (keys[' '] || mouseDown) && cooldown <= 0;
}
