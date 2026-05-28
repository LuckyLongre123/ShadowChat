/**
 * soundService — Singleton audio manager for notification sounds.
 *
 * Design:
 * - Lazy-initializes Audio only in the browser (SSR-safe)
 * - Debounces rapid plays — no matter how many messages arrive simultaneously,
 *   the sound plays at most once per DEBOUNCE_MS window
 * - Respects user preferences passed at call time (no need to re-init)
 */

const SOUND_PATH = '/sounds/whatsapp_notification.mp3';
const DEBOUNCE_MS = 1500;

class SoundService {
  private audio: HTMLAudioElement | null = null;
  private lastPlayTime = 0;

  private getAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audio) {
      this.audio = new Audio(SOUND_PATH);
      this.audio.volume = 0.6;
      this.audio.preload = 'auto';
    }
    return this.audio;
  }

  /**
   * Play the notification sound.
   * Silently skips if:
   *  - soundEnabled is false
   *  - muted is true
   *  - played within the last DEBOUNCE_MS milliseconds
   */
  play(soundEnabled: boolean, muted: boolean): void {
    if (!soundEnabled || muted) return;

    const now = Date.now();
    if (now - this.lastPlayTime < DEBOUNCE_MS) return;
    this.lastPlayTime = now;

    const audio = this.getAudio();
    if (!audio) return;

    try {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay may be blocked — silently ignore
        // (browser requires a prior user gesture before playing audio)
      });
    } catch {
      // Ignore any other errors
    }
  }

  /** Pre-load the audio file so the first play has no delay */
  preload(): void {
    this.getAudio();
  }
}

/** Singleton instance — import this directly in any file */
export const soundService = new SoundService();
