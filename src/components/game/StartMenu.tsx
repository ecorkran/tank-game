'use client';

import ControlSelector from './ControlSelector';  

import React, { useEffect, useState } from 'react';
import styles from '@/styles/StartMenu.module.css';
import { useInput } from '@/hooks/useInput';
import { ControlType } from '@/types/game';

interface StartMenuProps {
  onStartGame: (controlType: ControlType) => void;
  highScore: number;
}

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame, highScore }) => {
  // Use the input hook to detect Enter key press
  const inputState = useInput();
  
  // Handle Enter key or Space bar press to start the game
  useEffect(() => {
    if (inputState.enterPressed || inputState.spacePressed) {
      onStartGame(ControlType.Keyboard); // default control type
    }
  }, [inputState.enterPressed, inputState.spacePressed, onStartGame]);
  
  const [controlType, setControlType] = useState<ControlType | null>(null);

  return (
    <div className={styles.startMenu}>
      <h1 className={styles.title}>MANTA'S TANK BATTLE</h1>
      <div className={styles.startButtonContainer}>
        <button 
          className={styles.battleButton}
          onClick={() => onStartGame(controlType || ControlType.Keyboard)}
        >
          Battle
        </button>
      </div>
      
      <ControlSelector onSelect={setControlType} />
      
      <div className={styles.highScore}>
        High Score: {highScore}
      </div>
      
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
      

    </div>
  );
};

export default StartMenu;