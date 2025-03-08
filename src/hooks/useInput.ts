'use client';

import { useState, useEffect } from 'react';

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

export const useInput = () => {
  const [inputState, setInputState] = useState<InputState>({
    keys: {},
    mousePosition: { x: 0, y: 0 },
    mouseDown: false,
    enterPressed: false,
    spacePressed: false
  });
  
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
    
    const handleMouseMove = (e: MouseEvent) => {
      setInputState(prev => ({
        ...prev,
        mousePosition: { x: e.clientX, y: e.clientY }
      }));
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
  }, []);
  
  return inputState;
};