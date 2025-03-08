import { GameObject, GameState, Position, Projectile, PowerUp, CollisionResult } from '@/types/game';
import { WRAPPING_THRESHOLDS } from '@/constants/game';

/**
 * Handles all physics-related operations including collision detection and position wrapping
 */
export class PhysicsSystem {
  /**
   * Handles all collisions in the game state and returns updated state
   */
  public handleCollisions(gameState: GameState): GameState {
    const newState = { ...gameState };
    
    // Handle projectile collisions with tanks and obstacles
    newState.projectiles = this.handleProjectileCollisions(newState);
    
    // Handle tank-to-tank collisions
    this.handleTankCollisions(newState);
    
    // Handle power-up collisions with player
    newState.powerUps = this.handlePowerUpCollisions(newState);
    
    return newState;
  }

  /**
   * Checks if an object at given position collides with any obstacles
   */
  public checkObstacleCollision(
    position: Position,
    width: number,
    obstacles: GameObject[]
  ): CollisionResult {
    // Default result with no collision
    const result: CollisionResult = {
      collided: false,
      collidedX: false,
      collidedY: false,
      correctedPosition: null
    };
    
    for (const obstacle of obstacles) {
      const testObj: GameObject = {
        position,
        width,
        height: width, // Assuming width = height for circular object
        rotation: 0
      };
      
      if (this.isCollidingRectangles(testObj, obstacle)) {
        result.collided = true;
        
        // Calculate overlap on each axis to determine which direction had collision
        const overlapX = Math.min(
          testObj.position.x + testObj.width/2 - (obstacle.position.x - obstacle.width/2),
          obstacle.position.x + obstacle.width/2 - (testObj.position.x - testObj.width/2)
        );
        
        const overlapY = Math.min(
          testObj.position.y + testObj.height/2 - (obstacle.position.y - obstacle.height/2),
          obstacle.position.y + obstacle.height/2 - (testObj.position.y - testObj.height/2)
        );
        
        // Determine which axis had the smaller overlap and set collided flags
        if (overlapX < overlapY) {
          result.collidedX = true;
        } else {
          result.collidedY = true;
        }
        
        // Attempt to calculate a corrected position to prevent object from getting stuck
        const dx = testObj.position.x - obstacle.position.x;
        const dy = testObj.position.y - obstacle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const minDistance = (testObj.width + obstacle.width) / 2;
          if (distance < minDistance) {
            const pushFactor = (minDistance - distance) / distance;
            result.correctedPosition = {
              x: testObj.position.x + dx * pushFactor,
              y: testObj.position.y + dy * pushFactor
            };
          }
        }
        
        return result;
      }
    }
    
    return result;
  }

  /**
   * Checks if two objects with circular collision areas are colliding
   */
  public isColliding(obj1: GameObject, obj2: GameObject): boolean {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.width + obj2.width) / 2;
  }

  /**
   * Checks if two rectangular objects are colliding
   */
  public isCollidingRectangles(rect1: GameObject, rect2: GameObject): boolean {
    return (
      rect1.position.x - rect1.width/2 < rect2.position.x + rect2.width/2 &&
      rect1.position.x + rect1.width/2 > rect2.position.x - rect2.width/2 &&
      rect1.position.y - rect1.height/2 < rect2.position.y + rect2.height/2 &&
      rect1.position.y + rect1.height/2 > rect2.position.y - rect2.height/2
    );
  }

  /**
   * Calculates the wrapped position for an object that moves beyond screen boundaries
   */
  public calculateWrappedPosition(
    x: number,
    y: number,
    threshold: number,
    dimensions: { width: number; height: number }
  ): Position {
    let newX = x;
    let newY = y;
    
    // Wrap horizontally
    if (x < -threshold) {
      newX = dimensions.width + threshold;
    } else if (x > dimensions.width + threshold) {
      newX = -threshold;
    }
    
    // Wrap vertically
    if (y < -threshold) {
      newY = dimensions.height + threshold;
    } else if (y > dimensions.height + threshold) {
      newY = -threshold;
    }
    
    return { x: newX, y: newY };
  }

  /**
   * Checks if an entity is stuck against obstacles and can't move
   */
  public isStuckAgainstObstacle(
    position: Position,
    width: number,
    rotation: number,
    obstacles: GameObject[]
  ): boolean {
    // Check if moving forward or backward would cause collision
    const forwardX = position.x + Math.cos(rotation) * 5;
    const forwardY = position.y + Math.sin(rotation) * 5;
    const backwardX = position.x - Math.cos(rotation) * 5;
    const backwardY = position.y - Math.sin(rotation) * 5;
    
    const forwardCollision = this.checkObstacleCollision(
      { x: forwardX, y: forwardY },
      width,
      obstacles
    );
    
    const backwardCollision = this.checkObstacleCollision(
      { x: backwardX, y: backwardY },
      width,
      obstacles
    );
    
    // Stuck if can't move in either direction
    return forwardCollision.collided && backwardCollision.collided;
  }

  /**
   * Handles collisions between projectiles and other entities
   * @private
   */
  private handleProjectileCollisions(gameState: GameState): Projectile[] {
    const updatedProjectiles = [...gameState.projectiles];
    const collidedProjectiles: number[] = [];
    
    // Check projectile collisions with obstacles
    updatedProjectiles.forEach((projectile, index) => {
      if (!projectile.isActive) return;
      
      // Check collision with obstacles
      for (const obstacle of gameState.obstacles) {
        if (this.isCollidingRectangles(
          { position: projectile.position, width: projectile.width, height: projectile.height, rotation: 0 },
          obstacle
        )) {
          // If obstacle is destructible, damage it
          if (obstacle.isDestructible && obstacle.health) {
            obstacle.health -= projectile.damage;
          }
          collidedProjectiles.push(index);
          break;
        }
      }
    });
    
    // Check projectile collisions with tanks
    updatedProjectiles.forEach((projectile, index) => {
      if (!projectile.isActive || collidedProjectiles.includes(index)) return;
      
      // Check if projectile hit an enemy
      if (projectile.owner === 'player') {
        gameState.enemies.forEach(enemy => {
          if (
            this.isColliding(projectile, enemy) && 
            projectile.position.x !== enemy.position.x && 
            projectile.position.y !== enemy.position.y
          ) {
            enemy.health -= projectile.damage;
            collidedProjectiles.push(index);
          }
        });
      }
      
      // Check if projectile hit player
      if (projectile.owner === 'enemy') {
        if (
          this.isColliding(projectile, gameState.player) &&
          projectile.position.x !== gameState.player.position.x && 
          projectile.position.y !== gameState.player.position.y
        ) {
          // Check if player has shield
          if (!gameState.powerUpEffects.shield) {
            gameState.player.health -= projectile.damage;
          }
          collidedProjectiles.push(index);
        }
      }
    });
    
    // Mark collided projectiles as inactive
    collidedProjectiles.forEach(index => {
      updatedProjectiles[index] = {
        ...updatedProjectiles[index],
        isActive: false
      };
    });
    
    return updatedProjectiles;
  }

  /**
   * Handles collisions between tanks
   * @private
   */
  private handleTankCollisions(gameState: GameState): void {
    // Player vs enemy tanks
    gameState.enemies.forEach(enemy => {
      if (this.isColliding(gameState.player, enemy)) {
        // Calculate relative velocity for damage calculation
        const playerVelX = Math.cos(gameState.player.rotation) * gameState.player.speed * gameState.powerUpEffects.speed;
        const playerVelY = Math.sin(gameState.player.rotation) * gameState.player.speed * gameState.powerUpEffects.speed;
        const enemyVelX = Math.cos(enemy.rotation) * enemy.speed;
        const enemyVelY = Math.sin(enemy.rotation) * enemy.speed;
        
        // Calculate relative velocity magnitude
        const relVelX = playerVelX - enemyVelX;
        const relVelY = playerVelY - enemyVelY;
        const relVelocity = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
        
        // Base damage from initial collision plus velocity-dependent component
        const initialImpactDamage = 5; // Base damage just for colliding
        const velocityDamage = Math.floor(relVelocity * 3); // Additional damage based on speed
        const collisionDamage = initialImpactDamage + velocityDamage;
        const damageMitigation = 0.30;
        
        // Apply damage to both tanks
        // Check if player has shield active
        if (!gameState.powerUpEffects.shield) {
          gameState.player.health -= (collisionDamage * (1.0 - damageMitigation));
        }
        enemy.health -= collisionDamage;
        
        // Simplified physics - push away from each other
        const dx = gameState.player.position.x - enemy.position.x;
        const dy = gameState.player.position.y - enemy.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize and apply push force
        if (distance > 0) {
          const pushForce = 20; // Stronger push force for better separation
          const nx = dx / distance;
          const ny = dy / distance;
          
          gameState.player.position.x += nx * pushForce;
          gameState.player.position.y += ny * pushForce;
          enemy.position.x -= nx * pushForce;
          enemy.position.y -= ny * pushForce;
        }
      }
    });
    
    // Enemy vs enemy collisions
    for (let i = 0; i < gameState.enemies.length; i++) {
      for (let j = i + 1; j < gameState.enemies.length; j++) {
        const enemy1 = gameState.enemies[i];
        const enemy2 = gameState.enemies[j];
        
        if (this.isColliding(enemy1, enemy2)) {
          // Calculate relative velocity for damage
          const enemy1VelX = Math.cos(enemy1.rotation) * enemy1.speed;
          const enemy1VelY = Math.sin(enemy1.rotation) * enemy1.speed;
          const enemy2VelX = Math.cos(enemy2.rotation) * enemy2.speed;
          const enemy2VelY = Math.sin(enemy2.rotation) * enemy2.speed;
          
          // Calculate relative velocity magnitude
          const relVelX = enemy1VelX - enemy2VelX;
          const relVelY = enemy1VelY - enemy2VelY;
          const relVelocity = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
          
          // Damage is less for enemy-enemy collisions
          const baseDamage = 2;
          const velocityDamage = Math.floor(relVelocity);
          const collisionDamage = baseDamage + velocityDamage;
          
          enemy1.health -= collisionDamage;
          enemy2.health -= collisionDamage;
          
          // Push away
          const dx = enemy1.position.x - enemy2.position.x;
          const dy = enemy1.position.y - enemy2.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const pushForce = 3; // Push force to prevent sticking
            const nx = dx / distance;
            const ny = dy / distance;
            
            enemy1.position.x += nx * pushForce;
            enemy1.position.y += ny * pushForce;
            enemy2.position.x -= nx * pushForce;
            enemy2.position.y -= ny * pushForce;
          }
        }
      }
    }
  }

  /**
   * Handles collisions between player and power-ups
   * @private
   */
  private handlePowerUpCollisions(gameState: GameState): PowerUp[] {
    const updatedPowerUps = [...gameState.powerUps];
    const collidedPowerUps: number[] = [];
    
    updatedPowerUps.forEach((powerUp, index) => {
      if (!powerUp.isActive) return;
      
      // Check collision with player
      if (this.isColliding(powerUp, gameState.player)) {
        collidedPowerUps.push(index);
      }
    });
    
    // Mark collided power-ups as inactive
    collidedPowerUps.forEach(index => {
      updatedPowerUps[index] = {
        ...updatedPowerUps[index],
        isActive: false
      };
    });
    
    return updatedPowerUps;
  }
}