# Mouse Control Implementation Plan

This document outlines the detailed plan for adding mouse control to the tank game, along with UI settings and related features.

## Overview

We need to implement:
1. A control selector UI in the start menu
2. Mouse control functionality for tank movement
3. An in-game pause/options menu accessible with ESC key
4. Tests to ensure existing and new functionality works correctly

## Implementation Tasks

### 1. Control Type Selection UI

#### 1.1 Create Control Type Component
- Create a new component `ControlSelector.tsx` in the components/game directory
- Style with `ControlSelector.module.css` matching the StartMenu style
- Implement two large buttons (Keyboard or Mouse) with descriptions
- Use blue styling similar to the green start button but with a different color

#### 1.2 Integrate with Start Menu
- Modify StartMenu.tsx to include the ControlSelector component
- Add a state to track selected control type
- Add logic to only show the Start Game button after control type is selected

### 2. Game State Management for Control Type

#### 2.1 Extend Game State
- Modify the GameState interface in types/game.ts to include a `controlType` property
- Add a new string enum `ControlType` with values 'keyboard' and 'mouse'

#### 2.2 Update Initial Game State
- Modify the initial game state in GameContainer.tsx to include the controlType
- Pass the selected control type from StartMenu to GameContainer

### 3. Mouse Control Implementation

#### 3.1 Tank Movement with Mouse
- Update the game loop in GameContainer.tsx to check controlType
- For mouse control:
  - Calculate the angle between the tank and the mouse cursor
  - Rotate the tank to face the mouse cursor
  - Move the tank forward when the player holds left mouse button
  - Implement right-click for reverse movement
  - Keep space bar or left-click for firing

#### 3.2 Mouse Position Calculations
- Enhance the useInput hook to provide normalized mouse coordinates relative to the game canvas
- Add methods to calculate angles and distances between positions

### 4. In-Game Options Menu

#### 4.1 Create Options Menu Component
- Create a new component `OptionsMenu.tsx` in components/game directory
- Style with `OptionsMenu.module.css` similar to StartMenu
- Implement buttons for:
  - Resume Game (closes menu)
  - Change Controls (shows control selection)
  - Main Menu (returns to start menu)
  - Exit (placeholder for future implementation)

#### 4.2 Integrate with Game Container
- Add ESC key detection to toggle the options menu
- Implement pause functionality when options menu is open
- Add logic to switch between playing and options states

#### 4.3 Control Changing During Gameplay
- Implement ability to change control type during the game
- Ensure smooth transition between control types

### 5. Testing

#### 5.1 Current Controls Testing
- Create tests for existing keyboard controls
- Verify movement (WASD/arrow keys), rotation, and firing works as expected

#### 5.2 Mouse Controls Testing
- Test mouse movement implementation
- Verify rotation towards cursor works properly
- Test forward/backward movement and firing

#### 5.3 UI Testing
- Test start menu control selection UI
- Test in-game options menu
- Verify control switching works correctly

### 6. Polish and Refinement

#### 6.1 UI Polish
- Ensure consistent styling across all new UI elements
- Add hover/click effects to buttons
- Add simple animations for transitions

#### 6.2 Code Quality
- Keep functions under 50 lines
- Use meaningful variable and function names
- Add appropriate comments
- Ensure type safety throughout

## File Changes Required

1. `src/types/game.ts` - Add ControlType enum and update GameState interface
2. `src/components/game/StartMenu.tsx` - Add control type selection
3. `src/components/game/ControlSelector.tsx` - New component for control selection
4. `src/components/game/OptionsMenu.tsx` - New component for in-game options
5. `src/components/game/GameContainer.tsx` - Update gameloop for mouse control and options menu
6. `src/hooks/useInput.ts` - Enhance mouse position handling
7. `src/styles/ControlSelector.module.css` - Styling for control selector
8. `src/styles/OptionsMenu.module.css` - Styling for options menu
9. `src/constants/game.ts` - Add mouse control configuration constants

## Implementation Notes

- Focus on making changes in isolation without breaking existing functionality
- Test each feature individually before integration
- Maintain code clarity and structure
- Follow existing code patterns and styling
- Ensure all new UI elements match existing game aesthetics

## Future Enhancements (Out of Scope)

- Mouse sensitivity settings
- Custom keybinding configuration
- Touch screen support
- Game difficulty settings