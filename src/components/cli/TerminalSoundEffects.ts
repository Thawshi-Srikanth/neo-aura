// Terminal Sound Effects System
export class TerminalSoundEffects {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  // Sound effects for different terminal actions
  public playKeyPress() {
    this.playTone(800, 0.05, 'square');
  }

  public playCommand() {
    this.playTone(1000, 0.1, 'sine');
  }

  public playSuccess() {
    // Success chord
    this.playTone(523, 0.2, 'sine'); // C5
    setTimeout(() => this.playTone(659, 0.2, 'sine'), 50); // E5
    setTimeout(() => this.playTone(784, 0.2, 'sine'), 100); // G5
  }

  public playError() {
    // Error sound
    this.playTone(200, 0.3, 'sawtooth');
  }

  public playWarning() {
    // Warning beep
    this.playTone(400, 0.15, 'triangle');
    setTimeout(() => this.playTone(300, 0.15, 'triangle'), 100);
  }

  public playDeflection() {
    // Deflection attempt sound
    this.playTone(600, 0.1, 'sine');
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 50);
    setTimeout(() => this.playTone(1000, 0.1, 'sine'), 100);
  }

  public playScan() {
    // Scanning sound
    this.playTone(300, 0.5, 'sawtooth');
  }

  public playAnalysis() {
    // Analysis sound
    this.playTone(500, 0.2, 'sine');
    setTimeout(() => this.playTone(600, 0.2, 'sine'), 100);
    setTimeout(() => this.playTone(700, 0.2, 'sine'), 200);
  }

  public playEmergency() {
    // Emergency alert
    this.playTone(800, 0.1, 'square');
    setTimeout(() => this.playTone(600, 0.1, 'square'), 150);
    setTimeout(() => this.playTone(800, 0.1, 'square'), 300);
    setTimeout(() => this.playTone(600, 0.1, 'square'), 450);
  }

  public playStartup() {
    // Startup sequence
    this.playTone(440, 0.1, 'sine'); // A4
    setTimeout(() => this.playTone(554, 0.1, 'sine'), 100); // C#5
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 200); // E5
    setTimeout(() => this.playTone(880, 0.2, 'sine'), 300); // A5
  }

  public playShutdown() {
    // Shutdown sequence
    this.playTone(880, 0.1, 'sine'); // A5
    setTimeout(() => this.playTone(659, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.playTone(554, 0.1, 'sine'), 200); // C#5
    setTimeout(() => this.playTone(440, 0.2, 'sine'), 300); // A4
  }

  public playNotification() {
    // Notification sound
    this.playTone(1000, 0.1, 'sine');
    setTimeout(() => this.playTone(1200, 0.1, 'sine'), 50);
  }

  public playTyping() {
    // Typing sound
    this.playTone(1200, 0.05, 'square');
  }

  public playConnection() {
    // Connection established
    this.playTone(800, 0.1, 'sine');
    setTimeout(() => this.playTone(1000, 0.1, 'sine'), 50);
  }

  public playDisconnection() {
    // Connection lost
    this.playTone(1000, 0.1, 'sine');
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 50);
  }
}

// Global sound effects instance
export const terminalSounds = new TerminalSoundEffects();
