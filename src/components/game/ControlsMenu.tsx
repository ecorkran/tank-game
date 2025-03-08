'use client';

import React from 'react';
import { ControlScheme, ControlSettings } from '@/types/controls';
import { CONTROLS } from '@/constants/game';
import styles from '@/styles/ControlsMenu.module.css';

interface ControlsMenuProps {
  controlSettings: ControlSettings;
  onControlChange: (newSettings: ControlSettings) => void;
  onClose: () => void;
}

const ControlsMenu: React.FC<ControlsMenuProps> = ({ 
  controlSettings, 
  onControlChange, 
  onClose 
}) => {
  const handleSchemeChange = (scheme: ControlScheme) => {
    onControlChange({ ...controlSettings, scheme });
  };

  const handleInvertYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onControlChange({ ...controlSettings, invertY: e.target.checked });
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sensitivity = parseFloat(e.target.value);
    onControlChange({ ...controlSettings, mouseSensitivity: sensitivity });
  };

  return (
    <div className={styles.controlsMenuOverlay}>
      <div className={styles.controlsMenu}>
        <h2>Control Settings</h2>
        
        <div className={styles.controlSection}>
          <h3>Control Scheme</h3>
          <div className={styles.controlOptions}>
            <button 
              className={`${styles.schemeButton} ${controlSettings.scheme === 'keyboard' ? styles.active : ''}`}
              onClick={() => handleSchemeChange('keyboard')}
            >
              <div className={styles.schemeIcon}>⌨️</div>
              <div className={styles.schemeName}>Keyboard</div>
              <div className={styles.schemeDesc}>WASD to move, rotate. Space to fire.</div>
            </button>
            
            <button 
              className={`${styles.schemeButton} ${controlSettings.scheme === 'mouse' ? styles.active : ''}`}
              onClick={() => handleSchemeChange('mouse')}
            >
              <div className={styles.schemeIcon}>🖱️</div>
              <div className={styles.schemeName}>Mouse</div>
              <div className={styles.schemeDesc}>Move mouse to aim and move. Click to fire.</div>
            </button>
            
            {/* Hybrid mode removed for simplicity */}
          </div>
        </div>
        
        {controlSettings.scheme === 'mouse' && (
          <div className={styles.controlSection}>
            <h3>Mouse Settings</h3>
            
            <div className={styles.settingRow}>
              <label htmlFor="invertY">Invert Y-Axis</label>
              <input 
                type="checkbox" 
                id="invertY" 
                checked={controlSettings.invertY}
                onChange={handleInvertYChange}
              />
            </div>
            
            <div className={styles.settingRow}>
              <label htmlFor="sensitivity">Mouse Sensitivity: {controlSettings.mouseSensitivity.toFixed(1)}</label>
              <input 
                type="range" 
                id="sensitivity" 
                min={CONTROLS.MOUSE_SENSITIVITY_MIN} 
                max={CONTROLS.MOUSE_SENSITIVITY_MAX} 
                step="0.1"
                value={controlSettings.mouseSensitivity}
                onChange={handleSensitivityChange}
              />
            </div>
          </div>
        )}
        
        <div className={styles.controlsFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsMenu;
