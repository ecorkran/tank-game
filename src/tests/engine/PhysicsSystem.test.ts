import { describe, it, expect, vi } from 'vitest';
import { PhysicsSystem } from '../../engine/PhysicsSystem';
import { GameObject, Position } from '../../types/game';

describe('PhysicsSystem', () => {
  let physicsSystem: PhysicsSystem;
  
  beforeEach(() => {
    physicsSystem = new PhysicsSystem();
  });
  
  describe('collision detection', () => {
    it('should correctly detect circular collision between two objects', () => {
      const obj1: GameObject = {
        position: { x: 100, y: 100 },
        width: 40,
        height: 40,
        rotation: 0
      };
      
      const obj2: GameObject = {
        position: { x: 120, y: 120 },
        width: 40,
        height: 40,
        rotation: 0
      };
      
      expect(physicsSystem.isColliding(obj1, obj2)).toBe(true);
      
      // Test non-colliding objects
      const obj3: GameObject = {
        position: { x: 200, y: 200 },
        width: 40,
        height: 40,
        rotation: 0
      };
      
      expect(physicsSystem.isColliding(obj1, obj3)).toBe(false);
    });
    
    it('should correctly detect rectangular collision', () => {
      const rect1: GameObject = {
        position: { x: 100, y: 100 },
        width: 50,
        height: 50,
        rotation: 0
      };
      
      const rect2: GameObject = {
        position: { x: 125, y: 125 },
        width: 50,
        height: 50,
        rotation: 0
      };
      
      expect(physicsSystem.isCollidingRectangles(rect1, rect2)).toBe(true);
      
      // Test non-colliding rectangles
      const rect3: GameObject = {
        position: { x: 200, y: 200 },
        width: 50,
        height: 50,
        rotation: 0
      };
      
      expect(physicsSystem.isCollidingRectangles(rect1, rect3)).toBe(false);
    });
  });
  
  describe('position wrapping', () => {
    it('should wrap positions correctly at screen boundaries', () => {
      const dimensions = { width: 800, height: 600 };
      
      // Test wrapping beyond right edge
      const pos1 = physicsSystem.calculateWrappedPosition(850, 300, 40, dimensions);
      expect(pos1).toEqual({ x: -40, y: 300 });
      
      // Test wrapping beyond left edge
      const pos2 = physicsSystem.calculateWrappedPosition(-50, 300, 40, dimensions);
      expect(pos2).toEqual({ x: 800 + 40, y: 300 });
      
      // Test wrapping beyond bottom edge
      const pos3 = physicsSystem.calculateWrappedPosition(400, 650, 40, dimensions);
      expect(pos3).toEqual({ x: 400, y: -40 });
      
      // Test wrapping beyond top edge
      const pos4 = physicsSystem.calculateWrappedPosition(400, -50, 40, dimensions);
      expect(pos4).toEqual({ x: 400, y: 600 + 40 });
    });
  });
  
  describe('obstacle collision', () => {
    it('should detect collisions with obstacles', () => {
      const position: Position = { x: 100, y: 100 };
      const width = 40;
      const obstacles: GameObject[] = [
        { 
          position: { x: 120, y: 120 }, 
          width: 50, 
          height: 50,
          rotation: 0 
        }
      ];
      
      const result = physicsSystem.checkObstacleCollision(position, width, obstacles);
      expect(result.collided).toBe(true);
      
      // Test non-colliding position
      const nonCollidingPosition: Position = { x: 200, y: 200 };
      const nonCollidingResult = physicsSystem.checkObstacleCollision(
        nonCollidingPosition, 
        width, 
        obstacles
      );
      expect(nonCollidingResult.collided).toBe(false);
    });

    it('should handle stuck objects correctly', () => {
      const position: Position = { x: 100, y: 100 };
      const width = 40;
      const rotation = 0;
      const obstacles: GameObject[] = [
        // Place obstacles in front and behind the object
        { 
          position: { x: 120, y: 100 }, // In front (based on rotation 0)
          width: 50, 
          height: 50,
          rotation: 0 
        },
        { 
          position: { x: 80, y: 100 }, // Behind (based on rotation 0)
          width: 50, 
          height: 50,
          rotation: 0 
        }
      ];
      
      const isStuck = physicsSystem.isStuckAgainstObstacle(
        position, 
        width, 
        rotation, 
        obstacles
      );
      
      expect(isStuck).toBe(true);
      
      // Test non-stuck position
      const nonStuckPosition: Position = { x: 200, y: 200 };
      const nonStuckResult = physicsSystem.isStuckAgainstObstacle(
        nonStuckPosition, 
        width, 
        rotation, 
        obstacles
      );
      
      expect(nonStuckResult).toBe(false);
    });
  });
});