'use client';

import React, { useRef, useEffect } from 'react';
import styles from '@/styles/Canvas.module.css';

interface CanvasProps {
  draw: (context: CanvasRenderingContext2D, frameCount: number) => void;
  width?: number;
  height?: number;
  onClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

const Canvas: React.FC<CanvasProps> = ({ draw, width, height, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    let frameCount = 0;
    let animationFrameId: number;
    
    const render = () => {
      frameCount++;
      draw(context, frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);
  
  // Prevent the context menu from showing on right-click
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  };

  return (
    <canvas 
      ref={canvasRef}
      width={width || 800}
      height={height || 600}
      className={styles.canvas}
      onClick={onClick}
      onContextMenu={handleContextMenu}
    />
  );
};

export default Canvas;