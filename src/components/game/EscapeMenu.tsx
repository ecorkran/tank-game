'use client';

import React from 'react';
import styles from '@/styles/EscapeMenu.module.css';

interface EscapeMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
  onExit: () => void;
}

const EscapeMenu: React.FC<EscapeMenuProps> = ({ onResume, onMainMenu, onExit }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.menuContainer}>
        <h2 className={styles.title}>Game Paused</h2>
        
        <div className={styles.buttonContainer}>
          <button 
            className={styles.menuButton}
            onClick={onResume}
          >
            Resume Game
          </button>
          
          <button 
            className={styles.menuButton}
            onClick={onMainMenu}
          >
            Main Menu
          </button>
          
          <button 
            className={styles.menuButton}
            onClick={onExit}
          >
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default EscapeMenu;
