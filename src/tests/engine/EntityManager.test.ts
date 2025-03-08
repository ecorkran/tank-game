import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityManager } from '../../engine/EntityManager';
import { GameState, Tank, Projectile, PowerUp, Position } from '../../types/game';

// Set up manual mocks for imported modules
import * as enemies from '@/lib/enemies';
import * as powerups from '@/lib/powerups';
import * as position from '@/utils/position';

// Mock createEnemy
vi.mock('@/lib/enemies', () => {
  return {
    createEnemy: vi.fn((position, width, height, speedIncrease) => ({
      position,
      rotation: 0,
      width: 40,
      height: 40,
      health: 100,
      maxHealth: 100,
      speed: 2 + speedIncrease,
      rotationSpeed: 0.05,
      cooldown: 0,
      maxCooldown: 30,
      isPlayer: false
    })),
    updateEnemy: vi.fn((enemy, playerPos, width, height, obstacles) => ({
      ...enemy,
      // Simulate enemy movement toward player
      position: {
        x: enemy.position.x + (playerPos.x > enemy.position.x ? 1 : -1),
        y: enemy.position.y + (playerPos.y > enemy.position.y ? 1 : -1)
      }
    }))
  };
});

// Mock power-ups
vi.mock('@/lib/powerups', () => {
  return {
    generateRandomPowerUp: vi.fn((width, height, obstacles) => ({
      position: { x: 200, y: 200 },
      width: 20,
      height: 20,
      rotation: 0,
      type: 'health' as 'health',
      duration: 5000,
      isActive: true
    }))
  };
});

// Mock position utilities
vi.mock('@/utils/position', () => {
  return {
    calculateWrappedPosition: vi.fn((x, y, threshold, dimensions) => ({ x, y }))
  };
});

describe('EntityManager', () => {
  let entityManager: EntityManager;
  let mockGameState: GameState;
  
  beforeEach(() => {
    entityManager = new EntityManager();
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Set up mock game state
    mockGameState = {
      player: {
        position: { x: 100, y: 100 },
        rotation: 0,
        width: 40,
        height: 40,
        health: 100,
        maxHealth: 100,
        speed: 5,
        rotationSpeed: 0.1,
        cooldown: 10,
        maxCooldown: 30,
        isPlayer: true
      },
      enemies: [
        {
          position: { x: 300, y: 300 },
          rotation: 0,
          width: 40,
          height: 40,
          health: 100,
          maxHealth: 100,
          speed: 2,
          rotationSpeed: 0.05,
          cooldown: 0,
          maxCooldown: 30,
          isPlayer: false
        }
      ],
      projectiles: [
        {
          position: { x: 150, y: 150 },
          rotation: 0,
          width: 5,
          height: 5,
          speed: 10,
          damage: 20,
          isActive: true,
          distanceTraveled: 0,
          owner: 'player'
        },
        {
          position: { x: 200, y: 200 },
          rotation: 0,
          width: 5,
          height: 5,
          speed: 10,
          damage: 20,
          isActive: false, // This one should be filtered out during cleanup
          distanceTraveled: 0,
          owner: 'player'
        }
      ],
      powerUps: [
        {
          position: { x: 250, y: 250 },
          rotation: 0,
          width: 20,
          height: 20,
          type: 'speed',
          duration: 5000,
          isActive: true
        }
      ],
      obstacles: [],
      score: 0,
      isGameOver: false,
      isPaused: false,
      powerUpEffects: {
        speed: 1,
        shield: false,
        rapidFire: false
      },
      controls: {
        scheme: 'keyboard',
        mouseSensitivity: 1,
        invertY: false
      },
      dimensions: {
        width: 800,
        height: 600
      }
    };
  });
  
  describe('spawnEnemy', () => {
    it('should create a new enemy with correct properties', () => {
      const position = { x: 100, y: 100 };
      const dimensions = { width: 800, height: 600 };
      const speedIncrease = 0.5;
      
      // Setup the mock implementation for this specific test
      const mockEnemy = {
        position,
        rotation: 0,
        width: 40,
        height: 40,
        health: 100,
        maxHealth: 100,
        speed: 2.5,
        rotationSpeed: 0.05,
        cooldown: 0,
        maxCooldown: 30,
        isPlayer: false
      };
      
      vi.mocked(enemies.createEnemy).mockReturnValueOnce(mockEnemy);
      
      const enemy = entityManager.spawnEnemy(position, dimensions, speedIncrease);
      
      expect(enemies.createEnemy).toHaveBeenCalledWith(
        position, 
        dimensions.width, 
        dimensions.height, 
        speedIncrease
      );
      expect(enemy).toBe(mockEnemy);
    });
  });
  
  describe('createProjectile', () => {
    it('should create a new projectile with correct properties', () => {
      const position = { x: 100, y: 100 };
      const rotation = 1.5;
      const owner = 'player';
      
      const projectile = entityManager.createProjectile(position, rotation, owner);
      
      // Position should be offset by rotation
      expect(projectile.position.x).not.toBe(position.x);
      expect(projectile.position.y).not.toBe(position.y);
      
      expect(projectile).toHaveProperty('rotation', rotation);
      expect(projectile).toHaveProperty('owner', owner);
      expect(projectile).toHaveProperty('isActive', true);
      expect(projectile).toHaveProperty('distanceTraveled', 0);
    });
  });
  
  describe('cleanup', () => {
    it('should remove inactive entities', () => {
      // Add an inactive power-up and a dead enemy to test cleanup
      mockGameState.powerUps.push({
        position: { x: 300, y: 300 },
        rotation: 0,
        width: 20,
        height: 20,
        type: 'health',
        duration: 5000,
        isActive: false
      });
      
      mockGameState.enemies.push({
        position: { x: 400, y: 400 },
        rotation: 0,
        width: 40,
        height: 40,
        health: 0, // Dead enemy
        maxHealth: 100,
        speed: 2,
        rotationSpeed: 0.05,
        cooldown: 0,
        maxCooldown: 30,
        isPlayer: false
      });
      
      const cleanedState = entityManager.cleanup(mockGameState);
      
      // Should only have active entities
      expect(cleanedState.projectiles.length).toBe(1);
      expect(cleanedState.projectiles.every(p => p.isActive)).toBe(true);
      
      expect(cleanedState.powerUps.length).toBe(1);
      expect(cleanedState.powerUps.every(p => p.isActive)).toBe(true);
      
      expect(cleanedState.enemies.length).toBe(1);
      expect(cleanedState.enemies.every(e => e.health > 0)).toBe(true);
    });
  });
  
  describe('updateEntities', () => {
    it('should update all entity types', () => {
      // Set up mocks for this specific test
      vi.mocked(position.calculateWrappedPosition).mockImplementation((x, y) => ({ x: x + 10, y: y + 10 }));
      
      vi.mocked(enemies.updateEnemy).mockImplementation((enemy) => ({
        ...enemy,
        position: {
          x: enemy.position.x + 5,
          y: enemy.position.y + 5
        }
      }));
      
      const updatedState = entityManager.updateEntities(mockGameState, 16);
      
      // Player cooldown should be reduced
      expect(updatedState.player.cooldown).toBe(9);
      
      // Enemy should be updated
      expect(vi.mocked(enemies.updateEnemy)).toHaveBeenCalled();
      
      // Projectile should have moved
      const originalProjectile = mockGameState.projectiles[0];
      const updatedProjectile = updatedState.projectiles[0];
      
      // We expect the projectile to have moved
      expect(updatedProjectile.position.x).not.toBe(originalProjectile.position.x);
      expect(updatedProjectile.position.y).not.toBe(originalProjectile.position.y);
      
      // Distance traveled should be updated
      expect(updatedProjectile.distanceTraveled).toBeGreaterThan(0);
    });
    
    it('should not update entities if game is paused', () => {
      const pausedState = { ...mockGameState, isPaused: true };
      const updatedState = entityManager.updateEntities(pausedState, 16);
      
      // No changes should happen when paused
      expect(updatedState.player.cooldown).toBe(10);
      
      // No update enemy calls
      expect(enemies.updateEnemy).not.toHaveBeenCalled();
      
      // Positions shouldn't change
      expect(updatedState.projectiles[0].position.x).toBe(pausedState.projectiles[0].position.x);
    });
  });
});