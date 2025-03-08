'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing a game loop with a fixed time step
 * @param update Function to call on each update frame
 * @param render Function to call on each render frame
 * @param fps Target frames per second (default: 60)
 */
export function useGameLoop(
  update: (deltaTime: number) => void,
  render: () => void,
  fps: number = 60
) {
  const requestRef = useRef<number | undefined>(undefined);
  const previousTimeRef = useRef<number | undefined>(undefined);
  const accumulatorRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  
  // Fixed time step in milliseconds
  const timeStep = 1000 / fps;
  
  // Define gameLoop first to avoid circular dependency
  const gameLoop = useCallback((timestamp: number = performance.now()) => {
    if (!isRunningRef.current) return;
    
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = timestamp;
    }
    
    // Calculate elapsed time since last frame
    const elapsed = timestamp - previousTimeRef.current;
    previousTimeRef.current = timestamp;
    
    // Add to accumulator
    accumulatorRef.current += elapsed;
    
    // Update game logic in fixed time steps
    while (accumulatorRef.current >= timeStep) {
      update(timeStep);
      accumulatorRef.current -= timeStep;
    }
    
    // Render the game
    render();
    
    // Schedule next frame
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [update, render, timeStep]);
  
  const startGameLoop = useCallback(() => {
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      // requestAnimationFrame automatically passes a timestamp to the callback
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);
  
  const stopGameLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      isRunningRef.current = false;
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  return { startGameLoop, stopGameLoop };
}
