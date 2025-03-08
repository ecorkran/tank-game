/**
 * Control scheme types for the game
 */
export type ControlScheme = 'keyboard' | 'mouse';

/**
 * Control settings interface
 */
export interface ControlSettings {
  scheme: ControlScheme;
  invertY: boolean;
  mouseSensitivity: number;
}

/**
 * Default control settings
 */
export const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  scheme: 'keyboard',
  invertY: false,
  mouseSensitivity: 1.0
};
