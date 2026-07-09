/**
 * Web Audio API Sound Generator
 * Generates retro arcade, bubbly, and ambient sound effects on the fly
 * without any external assets. Safe, local, and incredibly satisfying.
 */

let isMuted = false;

try {
  const savedMute = localStorage.getItem('daynest_notifications_muted');
  if (savedMute) {
    isMuted = savedMute === 'true';
  }
} catch (_) {}

export function setMuteState(muted: boolean) {
  isMuted = muted;
  try {
    localStorage.setItem('daynest_notifications_muted', String(muted));
  } catch (_) {}
}

export function getMuteState(): boolean {
  return isMuted;
}

function getAudioContext(): AudioContext | null {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

/**
 * Play a synthesized sound effect
 */
export function playSound(type: 'coin' | 'levelup' | 'pop' | 'streak' | 'affirmation' | 'badge') {
  if (isMuted) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser security rules)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  switch (type) {
    case 'coin': {
      // Classic 8-bit retro dual-tone coin sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // First short note (B5), then higher note (E6)
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      osc2.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
      break;
    }

    case 'levelup': {
      // Ascending series of golden chimes
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      gainNode.connect(ctx.destination);

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        osc.connect(gainNode);
        osc.start(now + idx * 0.08);
        osc.stop(now + 0.8);
      });
      break;
    }

    case 'pop': {
      // Cute bubble click / pop sound
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
      break;
    }

    case 'streak': {
      // Whooshing upward positive streak synthesizer
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.45);

      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }

    case 'affirmation': {
      // Warm, beautiful cozy synthesizer pad swell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(329.63, now); // E4
      osc1.frequency.linearRampToValueAtTime(349.23, now + 1.2); // F4 swell

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.00, now); // A4
      osc2.frequency.linearRampToValueAtTime(523.25, now + 1.2); // C5 swell

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1500, now + 1.2);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.4);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.8);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
      break;
    }

    case 'badge': {
      // Grand celebratory sound
      const osc = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(1046.50, now);
      oscHarmonic.frequency.setValueAtTime(1318.51, now + 0.1);
      oscHarmonic.frequency.setValueAtTime(1567.98, now + 0.2);
      oscHarmonic.frequency.setValueAtTime(2093.00, now + 0.3);

      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.setValueAtTime(0.15, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gainNode);
      oscHarmonic.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      oscHarmonic.start(now);
      osc.stop(now + 0.9);
      oscHarmonic.stop(now + 0.9);
      break;
    }
  }
}
