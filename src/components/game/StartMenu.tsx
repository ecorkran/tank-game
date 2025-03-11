'use client';

import ControlSelector from './ControlSelector';  

import React, { useEffect, useState } from 'react';
import styles from '@/styles/StartMenu.module.css';
import { useInput } from '@/hooks/useInput';
import { ControlType } from '@/types/game';

interface StartMenuProps {
  onStartGame: (controlType: ControlType) => void;
  highScore: number;
  initialControlType?: ControlType; // Optional prop to set initial control type
}

const StartMenu: React.FC<StartMenuProps> = ({ onStartGame, highScore, initialControlType }) => {
  // Use the input hook to detect Enter key press
  const inputState = useInput();
  const [controlType, setControlType] = useState<ControlType | null>(null);
  
  // Set control type when component mounts, using initialControlType if provided
  useEffect(() => {
    setControlType(initialControlType || ControlType.Mouse);
  }, [initialControlType]);

  // Handle Enter key or Space bar press to start the game
  useEffect(() => {
    if (inputState.enterPressed || inputState.spacePressed) {
      onStartGame(controlType || ControlType.Mouse);
    }
  }, [inputState.enterPressed, inputState.spacePressed, onStartGame, controlType]);

  return (
    <div className={styles.startMenu}>
      <h1 className={styles.title}>MANTA'S TANK BATTLE</h1>
      <div className={styles.startButtonContainer}>
        <button 
          className={styles.battleButton}
          onClick={() => onStartGame(controlType || ControlType.Mouse)}
        >
          Battle
        </button>
      </div>
      
      <ControlSelector onSelect={setControlType} selectedType={controlType} />
      
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