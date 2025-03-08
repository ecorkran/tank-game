'use client';

import React, { useEffect } from 'react';
import styles from '@/styles/StartMenu.module.css';
import { useInput } from '@/hooks/useInput';

interface StartMenuProps {
  onStartGame: () => void;
  highScore: number;
}

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame, highScore }) => {
  // Use the input hook to detect Enter key press
  const inputState = useInput();
  
  // Handle Enter key or Space bar press to start the game
  useEffect(() => {
    if (inputState.enterPressed || inputState.spacePressed) {
      onStartGame();
    }
  }, [inputState.enterPressed, inputState.spacePressed, onStartGame]);
  
  return (
    <div className={styles.startMenu}>
      <h1 className={styles.title}>MANTA'S TANK BATTLE</h1>
      
      <div className={styles.instructions}>
        <h2>How to Play</h2>
        <ul>
          <li>Move with WASD or Arrow Keys</li>
          <li>Fire with Space or Left Click</li>
          <li>Destroy enemy tanks to score points</li>
          <li>Avoid enemy fire</li>
          <li>Collect power-ups for advantages</li>
        </ul>
      </div>
      
      {highScore > 0 && (
        <div className={styles.highScore}>
          High Score: {highScore}
        </div>
      )}
      
      <button 
        className={styles.startButton}
        onClick={onStartGame}
      >
        Start Game
      </button>
      <p className={styles.hint}>Press <strong>Enter</strong>, <strong>Space</strong>, or click the button to start</p>
    </div>
  );
};

export default StartMenu;