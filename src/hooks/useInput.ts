'use client';

import { useState, useEffect, useCallback } from 'react';

interface InputState {
  keys: {
    [key: string]: boolean;
  };
  mousePosition: {
    x: number;
    y: number;
  };
  mouseDown: boolean;
  rightMouseDown: boolean;
  enterPressed: boolean;
  spacePressed: boolean;
}

interface InputStateWithReset extends InputState {
  resetInput: () => void;
}

export const useInput = () => {
  const [inputState, setInputState] = useState<InputState>({
    keys: {},
    mousePosition: { x: 0, y: 0 },
    mouseDown: false,
    rightMouseDown: false,
    enterPressed: false,
    spacePressed: false
  });
  
  // Function to reset input state - useful for game restarts
  const resetInput = () => {
    setInputState({
      keys: {},
      mousePosition: { x: 0, y: 0 },
      mouseDown: false,
      rightMouseDown: false,
      enterPressed: false,
      spacePressed: false
    });
  };
  
  const throttle = useCallback(<T extends (...args: any[]) => void>(func: T, limit: number) => {
    let lastFunc: ReturnType<typeof setTimeout> | undefined;
    let lastRan: number | undefined;
    return function(this: any, ...args: Parameters<T>) {
      if (!lastRan) {
        func(...args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if (lastRan && (Date.now() - lastRan) >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        }, lastRan ? limit - (Date.now() - lastRan) : limit);
      }
    };
  }, []);
  
  const handleMouseMove = useCallback(throttle((e: MouseEvent) => {
    setInputState(prev => ({
      ...prev,
      mousePosition: { x: e.clientX, y: e.clientY }
    }));
  }, 100), []); // Throttle to 100ms
  
  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Special handling for Enter key and Space bar
      if (e.key === 'Enter') {
        setInputState(prev => ({
          ...prev,
          keys: { ...prev.keys, [e.key.toLowerCase()]: true },
          enterPressed: true
        }));
      } else if (e.key === ' ') {
        setInputState(prev => ({
          ...prev,
          keys: { ...prev.keys, [e.key.toLowerCase()]: true },
          spacePressed: true
        }));
      } else {
        setInputState(prev => ({
          ...prev,
          keys: { ...prev.keys, [e.key.toLowerCase()]: true }
        }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Reset special key states on key up
      if (e.key === 'Enter') {
        setInputState(prev => ({
          ...prev,
          keys: { ...prev.keys, [e.key.toLowerCase()]: false },
          enterPressed: false
        }));
      } else if (e.key === ' ') {
        setInputState(prev => ({
          ...prev,
          keys: { ...prev.keys, [e.key.toLowerCase()]: false },
          spacePressed: false
        }));
      } else {
        setInputState(prev => ({
          ...prev,
          keys: { ...prev.keys, [e.key.toLowerCase()]: false }
        }));
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        setInputState(prev => ({
          ...prev,
          mouseDown: true
        }));
      } else if (e.button === 2) { // Right mouse button
        setInputState(prev => ({
          ...prev,
          rightMouseDown: true
        }));
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        setInputState(prev => ({
          ...prev,
          mouseDown: false
        }));
      } else if (e.button === 2) { // Right mouse button
        setInputState(prev => ({
          ...prev,
          rightMouseDown: false
        }));
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);
  
  return { ...inputState, resetInput };
};