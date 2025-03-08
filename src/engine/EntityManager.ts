import { GameState, Tank, Projectile, PowerUp, Position, GameObject } from '@/types/game';
import { createEnemy, updateEnemy } from '@/lib/enemies';
import { generateRandomPowerUp } from '@/lib/powerups';
import { GAMEPLAY, SIZES } from '@/constants/game';
import { checkObstacleCollision, findSafeSpawnPosition } from '@/utils/collision';
import { calculateWrappedPosition } from '@/utils/position';

/**
 * Manages entity lifecycles including creation, updates, and cleanup
 */
export class EntityManager {
  /**
   * Updates all entities in the game state based on the current game conditions
   */
  public updateEntities(gameState: GameState, deltaTime: number): GameState {
    const newState = { ...gameState };
    
    // Skip updates if game is paused
    if (newState.isPaused) return newState;
    
    // Update player
    newState.player = this.updatePlayer(newState.player, deltaTime, newState);
    
    // Update enemies
    newState.enemies = this.updateEnemies(newState.enemies, newState.player, deltaTime, newState);
    
    // Update projectiles
    newState.projectiles = this.updateProjectiles(newState.projectiles, deltaTime, newState);
    
    // Update power-ups
    newState.powerUps = this.updatePowerUps(newState.powerUps, deltaTime);
    
    return newState;
  }

  /**
   * Creates a new enemy at the specified position
   */
  public spawnEnemy(
    position: Position,
    dimensions: { width: number; height: number },
    speedIncrease: number
  ): Tank {
    return createEnemy(position, dimensions.width, dimensions.height, speedIncrease);
  }

  /**
   * Creates a new projectile fired from a specific tank
   */
  public createProjectile(
    position: Position,
    rotation: number,
    owner: 'player' | 'enemy',
    damage: number = 20,
    speed: number = 10
  ): Projectile {
    return {
      position: {
        x: position.x + Math.cos(rotation) * 30,
        y: position.y + Math.sin(rotation) * 30
      },
      rotation,
      width: 5,
      height: 5,
      speed,
      damage,
      isActive: true,
      distanceTraveled: 0,
      owner
    };
  }

  /**
   * Generates a random power-up in a safe position
   */
  public generatePowerUp(
    dimensions: { width: number; height: number },
    obstacles: GameObject[]
  ): PowerUp | null {
    return generateRandomPowerUp(dimensions.width, dimensions.height, obstacles);
  }

  /**
   * Removes inactive or destroyed entities from the game state
   */
  public cleanup(gameState: GameState): GameState {
    return {
      ...gameState,
      projectiles: gameState.projectiles.filter(p => p.isActive),
      enemies: gameState.enemies.filter(e => e.health > 0),
      powerUps: gameState.powerUps.filter(p => p.isActive),
      obstacles: gameState.obstacles.filter(o => !o.isDestructible || !o.health || o.health > 0)
    };
  }

  /**
   * Updates the player tank's state
   * @private
   */
  private updatePlayer(player: Tank, deltaTime: number, gameState: GameState): Tank {
    // Basic player update - cooldown reduction
    const updatedPlayer = { ...player };
    
    if (updatedPlayer.cooldown > 0) {
      updatedPlayer.cooldown--;
    }
    
    return updatedPlayer;
  }

  /**
   * Updates all enemy tanks
   * @private
   */
  private updateEnemies(
    enemies: Tank[],
    player: Tank,
    deltaTime: number,
    gameState: GameState
  ): Tank[] {
    // Update each enemy using the updateEnemy function from enemies.ts
    return enemies.map(enemy => updateEnemy(
      enemy,
      { ...player.position }, // Clone to avoid direct mutation
      gameState.dimensions?.width || 800,
      gameState.dimensions?.height || 600,
      gameState.obstacles
    ));
  }

  /**
   * Updates all projectiles
   * @private
   */
  private updateProjectiles(
    projectiles: Projectile[],
    deltaTime: number,
    gameState: GameState
  ): Projectile[] {
    return projectiles
      .map(projectile => {
        if (!projectile.isActive) return projectile;
        
        // Calculate movement vector
        const moveX = Math.cos(projectile.rotation) * projectile.speed;
        const moveY = Math.sin(projectile.rotation) * projectile.speed;
        
        // Calculate distance traveled in this step
        const stepDistance = Math.sqrt(moveX * moveX + moveY * moveY);
        
        // Update total distance traveled
        const totalDistance = (projectile.distanceTraveled || 0) + stepDistance;
        
        // Check if projectile has exceeded max range
        if (totalDistance > GAMEPLAY.SHOT_RANGE) {
          return { ...projectile, isActive: false };
        }
        
        // Update position
        let newPosition = {
          x: projectile.position.x + moveX,
          y: projectile.position.y + moveY
        };
        
        // Apply position wrapping
        const dimensions = {
          width: gameState.dimensions?.width || 800,
          height: gameState.dimensions?.height || 600
        };
        
        const wrappedPosition = calculateWrappedPosition(
          newPosition.x, 
          newPosition.y, 
          SIZES.projectile, 
          dimensions
        );
        
        newPosition.x = wrappedPosition.x;
        newPosition.y = wrappedPosition.y;
        
        return {
          ...projectile,
          position: newPosition,
          distanceTraveled: totalDistance
        };
      });
  }

  /**
   * Updates all power-ups
   * @private
   */
  private updatePowerUps(powerUps: PowerUp[], deltaTime: number): PowerUp[] {
    // There's no ongoing update needed for power-ups in the current implementation
    // They're just static items waiting to be collected
    return powerUps;
  }
}