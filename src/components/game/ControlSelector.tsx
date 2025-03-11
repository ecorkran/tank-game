import { ControlType } from '@/types/game';
import styles from '../../styles/ControlSelector.module.css';

export default function ControlSelector({
  onSelect
}: {
  onSelect: (type: ControlType) => void;
}) {
  return (
    <div className={styles.container}>
      <h2>Select Control Type</h2>
      <div className={styles.buttons}>
        <button 
          className={styles.button} 
          onClick={() => onSelect(ControlType.Keyboard)}
        >
          Keyboard Controls
          <span>WASD/Arrow Keys + Space</span>
        </button>
        <button
          className={styles.button}
          onClick={() => onSelect(ControlType.Mouse)}
        >
          Mouse Controls
          <span>Click + Move + Right Click</span>
        </button>
      </div>
    </div>
  );
}
