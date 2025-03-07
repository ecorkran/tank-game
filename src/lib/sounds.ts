'use client';

// Define an interface for the sound effects collection
interface SoundEffects {
  [key: string]: HTMLAudioElement;
}

// SoundManager class to handle all game sounds
class SoundManager {
  private sounds: SoundEffects = {};
  private isMuted: boolean = false;
  
  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }
  
  private init() {
    // Create audio elements for each sound
    try {
      this.sounds = {
        shoot: new Audio('/assets/sounds/shoot.mp3'),
        explosion: new Audio('/assets/sounds/explosion.mp3'),
        hit: new Audio('/assets/sounds/hit.mp3'),
        gameOver: new Audio('/assets/sounds/game-over.mp3'),
        music: new Audio('/assets/sounds/background.mp3'),
        powerup: new Audio('/assets/sounds/powerup.mp3'),
        shield: new Audio('/assets/sounds/shield.mp3'),
      };
      
      // Configure background music
      if (this.sounds.music) {
        this.sounds.music.loop = true;
        this.sounds.music.volume = 0.5;
      }
    } catch (e) {
      console.error('Error initializing sounds:', e);
    }
  }
  
  public play(soundName: string) {
    if (this.isMuted || !this.sounds[soundName]) return;
    
    try {
      // Clone and play to allow overlapping sounds
      const sound = this.sounds[soundName].cloneNode(true) as HTMLAudioElement;
      sound.volume = this.sounds[soundName].volume;
      sound.play().catch(e => console.log('Error playing sound:', e));
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }
  
  public startMusic() {
    if (this.isMuted || !this.sounds.music) return;
    try {
      this.sounds.music.play().catch(e => console.log('Error playing music:', e));
    } catch (e) {
      console.error('Error playing music:', e);
    }
  }
  
  public stopMusic() {
    if (!this.sounds.music) return;
    try {
      this.sounds.music.pause();
      this.sounds.music.currentTime = 0;
    } catch (e) {
      console.error('Error stopping music:', e);
    }
  }
  
  public toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    
    return this.isMuted;
  }
  
  public isSoundMuted() {
    return this.isMuted;
  }
}

// Create singleton instance
export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null;