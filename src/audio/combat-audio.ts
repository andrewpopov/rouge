(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  let ctx: AudioContext | null = null;
  let muted = false;
  let masterVolume = 0.3;

  function getContext(): AudioContext | null {
    if (muted) { return null; }
    if (!ctx) {
      try {
        ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function createGain(audioCtx: AudioContext, volume: number): GainNode {
    const gain = audioCtx.createGain();
    gain.gain.value = volume * masterVolume;
    gain.connect(audioCtx.destination);
    return gain;
  }

  function playTone(frequency: number, duration: number, volume = 0.5, type: OscillatorType = "triangle") {
    const audioCtx = getContext();
    if (!audioCtx) { return; }
    const osc = audioCtx.createOscillator();
    const gain = createGain(audioCtx, volume);
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume * masterVolume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playNoise(duration: number, volume = 0.3) {
    const audioCtx = getContext();
    if (!audioCtx) { return; }
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = createGain(audioCtx, volume);
    source.connect(gain);
    source.start();
  }

  function cardPlay() {
    playTone(220, 0.08, 0.4, "square");
    playNoise(0.06, 0.15);
    setTimeout(() => playTone(330, 0.06, 0.2, "triangle"), 30);
  }

  function hit(damage: number) {
    const big = damage >= 10;
    playNoise(big ? 0.12 : 0.07, big ? 0.35 : 0.2);
    playTone(big ? 110 : 160, big ? 0.15 : 0.1, big ? 0.4 : 0.25, "sawtooth");
    if (big) {
      setTimeout(() => playTone(80, 0.1, 0.3, "sawtooth"), 40);
    }
  }

  function guardBlock() {
    playTone(800, 0.06, 0.25, "square");
    setTimeout(() => playTone(600, 0.08, 0.2, "square"), 25);
    playNoise(0.04, 0.1);
  }

  function guardBreak() {
    playTone(400, 0.05, 0.3, "square");
    playNoise(0.1, 0.25);
    setTimeout(() => playTone(200, 0.12, 0.25, "sawtooth"), 40);
    setTimeout(() => playTone(100, 0.15, 0.2, "sawtooth"), 80);
  }

  function enemyDeath() {
    playNoise(0.15, 0.3);
    playTone(300, 0.08, 0.3, "sawtooth");
    setTimeout(() => playTone(200, 0.1, 0.25, "sawtooth"), 50);
    setTimeout(() => playTone(120, 0.15, 0.2, "triangle"), 100);
  }

  function heal() {
    playTone(523, 0.1, 0.2, "sine");
    setTimeout(() => playTone(659, 0.1, 0.2, "sine"), 60);
    setTimeout(() => playTone(784, 0.08, 0.15, "sine"), 120);
  }

  function statusApply() {
    playTone(440, 0.06, 0.2, "square");
    setTimeout(() => playTone(520, 0.08, 0.15, "square"), 40);
    playNoise(0.04, 0.08);
  }

  function turnStart() {
    playTone(392, 0.08, 0.15, "sine");
    setTimeout(() => playTone(523, 0.06, 0.12, "sine"), 70);
  }

  function victory() {
    playTone(523, 0.15, 0.25, "sine");
    setTimeout(() => playTone(659, 0.15, 0.25, "sine"), 120);
    setTimeout(() => playTone(784, 0.15, 0.25, "sine"), 240);
    setTimeout(() => playTone(1047, 0.3, 0.3, "sine"), 360);
  }

  function defeat() {
    playTone(293, 0.2, 0.25, "triangle");
    setTimeout(() => playTone(261, 0.2, 0.2, "triangle"), 200);
    setTimeout(() => playTone(220, 0.3, 0.2, "triangle"), 400);
    setTimeout(() => playTone(174, 0.5, 0.15, "sine"), 600);
  }

  function skillUse() {
    playTone(440, 0.06, 0.2, "sine");
    setTimeout(() => playTone(660, 0.08, 0.2, "sine"), 30);
    playNoise(0.03, 0.08);
  }

  function meleeStrike() {
    playNoise(0.08, 0.25);
    playTone(150, 0.1, 0.3, "sawtooth");
  }

  function potionUse() {
    playTone(600, 0.06, 0.15, "sine");
    setTimeout(() => playTone(800, 0.06, 0.15, "sine"), 50);
    setTimeout(() => playTone(1000, 0.04, 0.1, "sine"), 100);
  }

  function summon() {
    playTone(220, 0.15, 0.15, "sine");
    setTimeout(() => playTone(330, 0.12, 0.15, "sine"), 80);
    setTimeout(() => playTone(440, 0.1, 0.2, "sine"), 160);
    playNoise(0.05, 0.06);
  }

  runtimeWindow.__ROUGE_COMBAT_AUDIO = {
    cardPlay,
    hit,
    guardBlock,
    guardBreak,
    enemyDeath,
    heal,
    statusApply,
    turnStart,
    victory,
    defeat,
    skillUse,
    meleeStrike,
    potionUse,
    summon,
    setMuted(value: boolean) { muted = value; },
    setVolume(value: number) { masterVolume = Math.max(0, Math.min(1, value)); },
    isMuted() { return muted; },
  };
})();
