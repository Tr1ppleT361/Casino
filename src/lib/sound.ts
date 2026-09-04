/**
 * All audio is synthesised with the Web Audio API, so the project ships no
 * binary sound assets and no third-party samples.
 */

export type SoundName =
  | "bet"
  | "spin"
  | "tick"
  | "card"
  | "chip"
  | "reveal"
  | "win"
  | "bigwin"
  | "cashout"
  | "crash"
  | "lose"
  | "roulette"
  | "click";

interface Tone {
  freq: number;
  /** seconds */
  duration: number;
  type?: OscillatorType;
  /** start offset in seconds */
  at?: number;
  gain?: number;
  /** slide to this frequency across the tone */
  slideTo?: number;
}

const RECIPES: Record<SoundName, Tone[]> = {
  click: [{ freq: 620, duration: 0.05, type: "triangle", gain: 0.16 }],
  bet: [
    { freq: 480, duration: 0.07, type: "triangle", gain: 0.2 },
    { freq: 720, duration: 0.09, type: "triangle", at: 0.05, gain: 0.18 },
  ],
  chip: [
    { freq: 1400, duration: 0.04, type: "square", gain: 0.08 },
    { freq: 900, duration: 0.07, type: "triangle", at: 0.03, gain: 0.12 },
  ],
  card: [
    { freq: 240, duration: 0.06, type: "sawtooth", gain: 0.07, slideTo: 120 },
  ],
  tick: [{ freq: 1100, duration: 0.028, type: "square", gain: 0.05 }],
  spin: [
    { freq: 300, duration: 0.5, type: "sawtooth", gain: 0.08, slideTo: 620 },
  ],
  roulette: [
    { freq: 180, duration: 0.9, type: "triangle", gain: 0.1, slideTo: 90 },
  ],
  reveal: [
    { freq: 880, duration: 0.06, type: "sine", gain: 0.15 },
    { freq: 1320, duration: 0.08, type: "sine", at: 0.05, gain: 0.13 },
  ],
  cashout: [
    { freq: 660, duration: 0.09, type: "sine", gain: 0.2 },
    { freq: 990, duration: 0.11, type: "sine", at: 0.07, gain: 0.18 },
    { freq: 1320, duration: 0.16, type: "sine", at: 0.15, gain: 0.16 },
  ],
  win: [
    { freq: 523.25, duration: 0.11, type: "sine", gain: 0.2 },
    { freq: 659.25, duration: 0.11, type: "sine", at: 0.09, gain: 0.19 },
    { freq: 783.99, duration: 0.18, type: "sine", at: 0.18, gain: 0.18 },
  ],
  bigwin: [
    { freq: 523.25, duration: 0.12, type: "sine", gain: 0.22 },
    { freq: 659.25, duration: 0.12, type: "sine", at: 0.1, gain: 0.22 },
    { freq: 783.99, duration: 0.12, type: "sine", at: 0.2, gain: 0.22 },
    { freq: 1046.5, duration: 0.3, type: "sine", at: 0.3, gain: 0.24 },
    { freq: 1318.5, duration: 0.4, type: "triangle", at: 0.36, gain: 0.16 },
  ],
  crash: [
    { freq: 320, duration: 0.35, type: "sawtooth", gain: 0.18, slideTo: 60 },
  ],
  lose: [
    { freq: 300, duration: 0.14, type: "triangle", gain: 0.12, slideTo: 200 },
  ],
};

let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.6;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    master = context.createGain();
    master.gain.value = volume;
    master.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

export function configureSound(next: { enabled?: boolean; volume?: number }) {
  if (typeof next.enabled === "boolean") enabled = next.enabled;
  if (typeof next.volume === "number") {
    volume = Math.min(Math.max(next.volume, 0), 1);
    if (master) master.gain.value = volume;
  }
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx || !master) return;

  const now = ctx.currentTime;
  for (const tone of RECIPES[name]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + (tone.at ?? 0);
    const peak = tone.gain ?? 0.15;

    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(tone.slideTo, 1),
        start + tone.duration,
      );
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + tone.duration + 0.02);
  }
}

/** Rising "tick" used by crash / wheel while a value climbs. */
export function playPitchedTick(progress: number) {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx || !master) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = "square";
  osc.frequency.setValueAtTime(420 + Math.min(progress, 1) * 900, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(gain);
  gain.connect(master);
  osc.start(now);
  osc.stop(now + 0.07);
}

/* --------------------------------------------------------------------- */
/* Ambient background music (three-voice generative loop)                 */
/* --------------------------------------------------------------------- */

let musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let musicTimer: ReturnType<typeof setInterval> | null = null;

const PROGRESSION = [
  [110, 164.81, 220],
  [98, 146.83, 196],
  [123.47, 185, 246.94],
  [87.31, 130.81, 174.61],
];

export function startMusic(level = 0.18) {
  const ctx = ensureContext();
  if (!ctx || !master || musicTimer) return;

  let step = 0;
  const bus = ctx.createGain();
  bus.gain.value = level;
  bus.connect(master);

  const play = () => {
    const chord = PROGRESSION[step % PROGRESSION.length];
    step += 1;
    const now = ctx.currentTime;
    for (const [i, freq] of chord.entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09 / (i + 1), now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(now);
      osc.stop(now + 3.8);
      musicNodes.push({ osc, gain });
    }
    musicNodes = musicNodes.slice(-24);
  };

  play();
  musicTimer = setInterval(play, 3600);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  for (const node of musicNodes) {
    try {
      node.osc.stop();
    } catch {
      /* already stopped */
    }
  }
  musicNodes = [];
}
