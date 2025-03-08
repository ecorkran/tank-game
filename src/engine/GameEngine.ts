import { GameState } from '@/types/game';
import { PhysicsSystem } from './PhysicsSystem';
import { EntityManager } from './EntityManager';

/**
 * Central class that coordinates the game loop and manages other systems
 */
export class GameEngine {
  private gameState: GameState;
  private lastTimestamp: number = 0;
  private isRunning: boolean = false;
  private updateCallback: (state: GameState) => void;
  private physics: PhysicsSystem;
  private entityManager: EntityManager;
  private animationFrameId: number | null = null;

  /**
   * Creates a new GameEngine instance
   * @param initialState Initial game state
   * @param updateCallback Callback function to send updated state to React component
   */
  constructor(initialState: GameState, updateCallback: (state: GameState) => void) {
    this.gameState = { ...initialState };
    this.updateCallback = updateCallback;
    this.physics = new PhysicsSystem();
    this.entityManager = new EntityManager();
  }

  /**
   * Starts the game loop
   */
  public start(): void {
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.gameLoop(this.lastTimestamp);
  }

  /**
   * Stops the game loop
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pauses the game
   */
  public pause(): void {
    this.gameState = {
      ...this.gameState,
      isPaused: true
    };
  }

  /**
   * Resumes the game from a paused state
   */
  public resume(): void {
    this.gameState = {
      ...this.gameState,
      isPaused: false
    };
  }

  /**
   * Updates the game state with partial new state
   * @param partialState The new state to merge with current state
   */
  public updateState(partialState: Partial<GameState>): void {
    this.gameState = { ...this.gameState, ...partialState };
  }

  /**
   * Gets the current game state (for testing and debugging)
   */
  public getState(): GameState {
    return this.gameState;
  }

  /**
   * Main game loop that runs on animation frame
   * @param timestamp Current time from requestAnimationFrame
   */
  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Skip updates if game is over or paused
    if (!this.gameState.isGameOver && !this.gameState.isPaused) {
      // Update game state
      this.update(deltaTime);
    }

    // Notify React component of state changes
    this.updateCallback(this.gameState);

    // Continue the loop
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Updates all game systems
   * @param deltaTime Time elapsed since last frame in milliseconds
   */
  private update(deltaTime: number): void {
    // Process input and update entities
    this.processInput();
    this.updateEntities(deltaTime);
    this.checkCollisions();
    this.cleanupEntities();
  }

  /**
   * Processes user input (to be expanded)
   * @private
   */
  private processInput(): void {
    // This is a placeholder for input processing
    // In a real implementation, this would process keyboard/mouse input
    // and update the game state accordingly
  }

  /**
   * Updates all game entities
   * @param deltaTime Time elapsed since last frame in milliseconds
   * @private
   */
  private updateEntities(deltaTime: number): void {
    // Update all entities using the EntityManager
    this.gameState = this.entityManager.updateEntities(this.gameState, deltaTime);
  }

  /**
   * Checks for collisions between game objects
   * @private
   */
  private checkCollisions(): void {
    // Handle collisions using the PhysicsSystem
    this.gameState = this.physics.handleCollisions(this.gameState);
  }

  /**
   * Removes inactive entities
   * @private
   */
  private cleanupEntities(): void {
    // Clean up inactive entities using the EntityManager
    this.gameState = this.entityManager.cleanup(this.gameState);
  }
}