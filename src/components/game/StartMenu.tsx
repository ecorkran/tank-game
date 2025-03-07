'use client';

import React from 'react';
import styles from '@/styles/StartMenu.module.css';

interface StartMenuProps {
  onStartGame: () => void;
  highScore: number;
}

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame, highScore }) => {
  return (
    <div className={styles.startMenu}>
      <h1 className={styles.title}>TANK BATTLE</h1>
      
      <div className={styles.instructions}>
        <h2>How to Play</h2>
        <ul>
          <li>Move with WASD or Arrow Keys</li>
          <li>Aim with Mouse</li>
          <li>Fire with Left Click</li>
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
    </div>
  );
};

export default StartMenu;