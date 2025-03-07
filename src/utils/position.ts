// Position utility functions for the game

/**
 * Calculates a wrapped position for game objects when they reach screen boundaries
 * @param x - Current x coordinate
 * @param y - Current y coordinate
 * @param L - Threshold value for wrapping (depends on object size)
 * @param space - Screen dimensions {width, height}
 * @returns New wrapped position {x, y}
 */
export const calculateWrappedPosition = (
  x: number, 
  y: number, 
  L: number, 
  space: { width: number, height: number } = { width: 800, height: 600 } // Default fallback dimensions
): { x: number, y: number } => {
  // Ensure space is defined and has width/height properties
  if (!space || typeof space.width !== 'number' || typeof space.height !== 'number') {
    console.error('Invalid space dimensions provided to calculateWrappedPosition', { space, x, y, L });
    return { x, y }; // Return original position if space is invalid
  }
  
  // Debug log to trace what's happening
  console.log('calculateWrappedPosition called with:', { x, y, L, spaceWidth: space.width, spaceHeight: space.height });
  let newX = x;
  let newY = y;
  
  // Horizontal wrapping
  if (newX <= L) {
    newX = space.width - L - 2;
  } else if (newX >= space.width - L - 1) {
    newX = L + 1;
  }
  
  // Vertical wrapping
  if (newY <= L) {
    newY = space.height - L - 2;
  } else if (newY >= space.height - L - 1) {
    newY = L + 1;
  }
  
  return { x: newX, y: newY };
};
