export type EqBand = 63 | 125 | 250 | 500 | 1000 | 3500 | 10000;
export const EQ_BANDS: EqBand[] = [63, 125, 250, 500, 1000, 3500, 10000];

export class AudioEngine {
  private static instance: AudioEngine;
  
  public context: AudioContext | null = null;
  public audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  
  public analyser: AnalyserNode | null = null;
  public masterGain: GainNode | null = null;
  private synthGain: GainNode | null = null;
  private synthInterval: any = null;
  private synthStep = 0;
  
  private eqFilters: Map<EqBand, BiquadFilterNode> = new Map();
  private eqGains: Map<EqBand, number> = new Map();
  private isInitialized = false;
  public isSynthPlaying = false;
  public isHardwareMuted = false;
  private snareNoiseBuffer: AudioBuffer | null = null;
  private hihatNoiseBuffer: AudioBuffer | null = null;

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.preload = "auto";
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public initialize() {
    if (this.isInitialized) return;
    
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioCtx({ latencyHint: 'interactive' });
      this.initNoiseBuffers();
      this.sourceNode = this.context.createMediaElementSource(this.audioElement);
      
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.masterGain = this.context.createGain();
      this.synthGain = this.context.createGain();
      this.synthGain.gain.value = 0.5;

      let prevNode: AudioNode = this.sourceNode;
      
      for (const freq of EQ_BANDS) {
        const filter = this.context.createBiquadFilter();
        if (freq === 63) {
          filter.type = "lowshelf";
        } else if (freq === 10000) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        const initialGain = this.eqGains.get(freq) || 0;
        filter.gain.value = initialGain;
        
        this.eqFilters.set(freq, filter);
        prevNode.connect(filter);
        prevNode = filter;
      }
      
      // Connect synth into the EQ chain at the first filter (63Hz)
      const firstFilter = this.eqFilters.get(63);
      if (firstFilter) {
        this.synthGain.connect(firstFilter);
      }
      
      prevNode.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      
      this.isInitialized = true;
      this.resume();
    } catch (err) {
      console.warn("AudioContext init error:", err);
    }
  }

  private initNoiseBuffers() {
    if (!this.context) return;
    try {
      const snareLen = Math.floor(this.context.sampleRate * 0.12);
      this.snareNoiseBuffer = this.context.createBuffer(1, snareLen, this.context.sampleRate);
      const snareData = this.snareNoiseBuffer.getChannelData(0);
      for (let i = 0; i < snareLen; i++) snareData[i] = Math.random() * 2 - 1;

      const hatLen = Math.floor(this.context.sampleRate * 0.05);
      this.hihatNoiseBuffer = this.context.createBuffer(1, hatLen, this.context.sampleRate);
      const hatData = this.hihatNoiseBuffer.getChannelData(0);
      for (let i = 0; i < hatLen; i++) hatData[i] = Math.random() * 2 - 1;
    } catch (e) {}
  }

  public async resume() {
    if (this.context && this.context.state === 'suspended') {
      try {
        await this.context.resume();
      } catch (e) {
        // user gesture required
      }
    }
  }

  public loadFile(file: File) {
    this.stopSynth();
    this.resume();
    const url = URL.createObjectURL(file);
    this.audioElement.src = url;
    this.audioElement.load();
  }

  public setHardwareMute(mute: boolean) {
    this.isHardwareMuted = mute;
    this.audioElement.muted = mute;
    if (mute) {
      try {
        this.audioElement.pause();
        this.stopSynth();
      } catch (e) {}
      if (this.masterGain && this.context) {
        try {
          this.masterGain.gain.cancelScheduledValues(0);
          this.masterGain.gain.setValueAtTime(0, this.context.currentTime);
        } catch (e) {}
      }
    }
  }

  public playStream(url: string) {
    if (!url || this.isHardwareMuted) return;
    this.resume();
    this.audioElement.src = url;
    this.audioElement.load();
    this.audioElement.play().catch(e => {
      if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && !this.isHardwareMuted) {
        console.warn("AudioEngine playStream fallback to synth:", e);
        // Fallback to retro synth on network/CORS error
        this.startSynth();
      }
    });
  }

  public play() {
    if (this.isHardwareMuted) return;
    this.resume();
    if (this.audioElement.src && !this.audioElement.src.endsWith('/')) {
      this.audioElement.play().catch(e => {
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError' && !this.isHardwareMuted) {
          this.startSynth();
        }
      });
    } else {
      this.startSynth();
    }
  }

  public pause() {
    this.audioElement.pause();
    this.stopSynth();
  }

  public stop() {
    try {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    } catch (e) {}
    this.stopSynth();
    if (this.context && this.synthGain) {
      try {
        this.synthGain.gain.cancelScheduledValues(this.context.currentTime);
        this.synthGain.gain.setValueAtTime(0, this.context.currentTime);
      } catch (e) {}
    }
    if (this.context && this.masterGain) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
        this.masterGain.gain.setValueAtTime(0, this.context.currentTime);
      } catch (e) {}
    }
    if (this.context && this.context.state === 'running') {
      try {
        this.context.suspend();
      } catch (e) {}
    }
  }

  public startSynth(style: string = 'JDM_BEAT') {
    if (this.isSynthPlaying || this.isHardwareMuted) return;
    this.resume();
    if (!this.context || !this.synthGain) return;

    this.isSynthPlaying = true;
    this.synthStep = 0;

    // 120 BPM 16th-note step sequencer: 60 / 120 / 4 = 125ms per step
    const stepTime = 125;
    
    // 90s City Pop / Eurobeat Pentatonic Bassline & Chords
    const bassNotes = [55, 55, 65.4, 55, 73.4, 55, 65.4, 49]; // A1, C2, D2, G1
    const chordFrequencies = [
      [220, 261.6, 329.6, 392], // Am7
      [174.6, 220, 261.6, 329.6], // Fmaj7
      [196, 246.9, 293.7, 349.2], // G7
      [164.8, 207.7, 246.9, 329.6] // E7
    ];

    this.synthInterval = setInterval(() => {
      if (!this.context || !this.isSynthPlaying) return;
      const ctx = this.context;
      const now = ctx.currentTime;
      const step = this.synthStep % 16;
      this.synthStep++;

      // 1. Kick Drum on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(this.synthGain!);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      // 2. Snare / Clack on beats 4, 12
      if ((step === 4 || step === 12) && this.snareNoiseBuffer) {
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = this.snareNoiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.synthGain!);
        whiteNoise.start(now);
      }

      // 3. Hi-Hat on every 2 steps (8th and 16th notes)
      if (step % 2 === 0 && this.hihatNoiseBuffer) {
        const hat = ctx.createBufferSource();
        hat.buffer = this.hihatNoiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 8500;
        const gain = ctx.createGain();
        const isAccent = step % 4 === 2;
        gain.gain.setValueAtTime(isAccent ? 0.25 : 0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        hat.connect(filter);
        filter.connect(gain);
        gain.connect(this.synthGain!);
        hat.start(now);
      }

      // 4. Bassline
      if (step % 2 === 0) {
        const noteIdx = (Math.floor(this.synthStep / 2)) % bassNotes.length;
        const freq = bassNotes[noteIdx];
        const bassOsc = ctx.createOscillator();
        bassOsc.type = "sawtooth";
        bassOsc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(120, now + 0.18);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        bassOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.synthGain!);
        bassOsc.start(now);
        bassOsc.stop(now + 0.22);
      }

      // 5. Synth Chord Pad Arpeggio on selected 16th steps
      if (step % 4 === 1 || step % 4 === 3) {
        const chordIdx = Math.floor((this.synthStep / 16) % 4);
        const notes = chordFrequencies[chordIdx];
        const note = notes[(step * 3) % notes.length];

        const leadOsc = ctx.createOscillator();
        leadOsc.type = "square";
        leadOsc.frequency.setValueAtTime(note, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        leadOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.synthGain!);
        leadOsc.start(now);
        leadOsc.stop(now + 0.16);
      }
    }, stepTime);
  }

  public stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public seek(delta: number) {
    if (!isNaN(this.audioElement.duration)) {
      this.audioElement.currentTime = Math.max(0, Math.min(this.audioElement.duration, this.audioElement.currentTime + delta));
    }
  }

  public setVolume(volume: number, attenuated: boolean = false) {
    this.resume();
    if (!this.masterGain) return;
    let val = this.isHardwareMuted ? 0 : Math.max(0, Math.min(1, volume));
    if (!this.isHardwareMuted && attenuated) val *= 0.2; 
    
    this.masterGain.gain.cancelScheduledValues(0);
    this.masterGain.gain.value = val;
    if (this.context && this.context.state === 'running') {
      this.masterGain.gain.setValueAtTime(val, this.context.currentTime);
    }
  }

  public setEq(freq: EqBand, gain: number) {
    this.eqGains.set(freq, gain);
    if (!this.isInitialized) {
      this.initialize();
    }
    this.resume();
    const filter = this.eqFilters.get(freq);
    if (filter) {
      filter.gain.cancelScheduledValues(0);
      filter.gain.value = gain;
      if (this.context && this.context.state === 'running') {
        filter.gain.setValueAtTime(gain, this.context.currentTime);
      }
    }
  }

  public getEqGain(freq: EqBand): number {
    return this.eqGains.get(freq) ?? 0;
  }

  public playRelayClick() {
    try {
      this.resume();
      if (!this.context) return;
      const ctx = this.context;
      const now = ctx.currentTime;

      // Click 1: Coil energize snap
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.018);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
      osc1.connect(gain1);
      gain1.connect(this.masterGain || ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.025);

      // Click 2: Heavy mechanical copper contact snap 35ms later
      const click2Time = now + 0.035;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(950, click2Time);
      osc2.frequency.exponentialRampToValueAtTime(80, click2Time + 0.028);
      gain2.gain.setValueAtTime(0.24, click2Time);
      gain2.gain.exponentialRampToValueAtTime(0.001, click2Time + 0.032);
      osc2.connect(gain2);
      gain2.connect(this.masterGain || ctx.destination);
      osc2.start(click2Time);
      osc2.stop(click2Time + 0.035);
    } catch {}
  }
}
