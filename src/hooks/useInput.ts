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
    enterPressed: false,
    spacePressed: false
  });
  
  // Function to reset input state - useful for game restarts
  const resetInput = () => {
    setInputState({
      keys: {},
      mousePosition: { x: 0, y: 0 },
      mouseDown: false,
      enterPressed: false,
      spacePressed: false
    });
  };
  
  const throttle = useCallback((func, limit) => {
    let lastFunc;
    let lastRan;
    return function(...args) {
      if (!lastRan) {
        func(...args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(function() {
          if ((Date.now() - lastRan) >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
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
      setInputState(prev => ({
        ...prev,
        mouseDown: true
      }));
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      setInputState(prev => ({
        ...prev,
        mouseDown: false
      }));
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