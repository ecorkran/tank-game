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
}

export const useInput = () => {
  const [inputState, setInputState] = useState<InputState>({
    keys: {},
    mousePosition: { x: 0, y: 0 },
    mouseDown: false
  });
  
  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      setInputState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.key.toLowerCase()]: true }
      }));
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      setInputState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.key.toLowerCase()]: false }
      }));
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