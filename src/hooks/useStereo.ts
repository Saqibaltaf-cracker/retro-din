import { useState, useEffect, useRef } from 'react';
import { AudioEngine, EqBand, EQ_BANDS } from '../audio/AudioEngine';
import { YouTubeManager, extractYouTubeId } from '../audio/YouTubeManager';

export type StereoMode = 'RADIO' | 'TAPE' | 'CD' | 'AUX' | 'USB';
export type StereoTheme = 
  | 'green' 
  | 'amber' 
  | 'cyan' 
  | 'blue' 
  | 'full-blue' 
  | 'ice-blue' 
  | 'purple' 
  | 'pink' 
  | 'sunset' 
  | 'red' 
  | 'ruby' 
  | 'orange' 
  | 'gold' 
  | 'yellow' 
  | 'mint' 
  | 'laser-lime' 
  | 'white' 
  | 'vintage-silver'
  | 'rgb';
export type VisualizerMode = 
  | 'BARS' 
  | 'PEAK_FALL' 
  | 'OSCILLOSCOPE' 
  | 'ANALOG_VU' 
  | 'DOT_MATRIX' 
  | 'FIRE_SPECTRUM' 
  | 'DISC' 
  | 'TUNNEL' 
  | 'RETRO_CASSETTE' 
  | 'JDM_CAR_DOTS' 
  | 'JDM_TANDEM_DOTS'
  | 'JDM_CAR_OLED'
  | 'SERENE_JAPAN';

export const EQ_PRESETS = [
  { name: 'ROCK', curves: { 63: 6, 125: 4, 250: -1, 500: 0, 1000: 2, 3500: 5, 10000: 7 } },
  { name: 'JAZZ', curves: { 63: 4, 125: 3, 250: 1, 500: 2, 1000: 2, 3500: 3, 10000: 2 } },
  { name: 'VOCAL', curves: { 63: -2, 125: 0, 250: 2, 500: 6, 1000: 5, 3500: 3, 10000: 1 } },
  { name: 'POP', curves: { 63: 5, 125: 3, 250: 0, 500: 1, 1000: 3, 3500: 5, 10000: 6 } },
  { name: 'EDM BASS', curves: { 63: 9, 125: 7, 250: 2, 500: -1, 1000: 1, 3500: 4, 10000: 8 } },
  { name: 'HIP-HOP', curves: { 63: 10, 125: 6, 250: 1, 500: 0, 1000: 2, 3500: 3, 10000: 4 } },
  { name: 'CLASSICAL', curves: { 63: 3, 125: 2, 250: 1, 500: 1, 1000: 2, 3500: 4, 10000: 6 } },
  { name: 'JDM CRUISE', curves: { 63: 7, 125: 5, 250: 2, 500: 1, 1000: 3, 3500: 5, 10000: 7 } },
  { name: 'ACOUSTIC', curves: { 63: 2, 125: 3, 250: 3, 500: 4, 1000: 3, 3500: 3, 10000: 4 } },
  { name: 'CLUB', curves: { 63: 8, 125: 6, 250: 0, 500: -2, 1000: 2, 3500: 6, 10000: 8 } }
];

// 90s JDM FM Stations (using high-fidelity streams with full CORS support for Web Audio Analyzer)
export const JDM_STATIONS = [
  { preset: 1, freq: 76.1, name: 'INTER FM 76.1', url: 'https://ice1.somafm.com/vaporwaves-128-mp3' }, // Vaporwaves / City Pop
  { preset: 2, freq: 80.0, name: 'TOKYO FM 80.0', url: 'https://ice1.somafm.com/groovesalad-128-mp3' }, // Chill beats
  { preset: 3, freq: 81.3, name: '90S ENGLISH HITS 81.3', url: 'https://dancewave.online/retrodance.mp3' }, // English Old 90s Hits
  { preset: 4, freq: 82.5, name: 'ENGLISH HITS LATEST 82.5', url: 'https://ice1.somafm.com/poptron-128-mp3' }, // English Hits Latest
  { preset: 5, freq: 84.7, name: '2000S BOLLYWOOD 84.7', url: 'https://drive.uber.radio/uber/bollywood2000s/icecast.audio' }, // 2000s Bollywood Hits
  { preset: 6, freq: 89.7, name: 'INDIAN RETRO 89.7', url: '/api/proxy?url=' + encodeURIComponent('https://stream.zeno.fm/v2zfmxef798uv') } // 24/7 Indian Retro Bollywood Classics
];

const isSilverInitial = () => {
  // Always start in black theme on fresh startup as requested
  return false;
};

export function useStereo() {
  const initialSilver = isSilverInitial();
  const [powered, setPowered] = useState(false);
  const [mode, setMode] = useState<StereoMode>('RADIO');
  const [theme, setTheme] = useState<StereoTheme>(initialSilver ? 'blue' : 'pink');
  const [playing, setPlaying] = useState(false);
  
  const [volume, setVolume] = useState(0.6);
  const [attenuated, setAttenuated] = useState(false);
  const [loudness, setLoudness] = useState(false);
  const [dimmerLevel, setDimmerLevel] = useState(1); 
  const [backlitLevel, setBacklitLevel] = useState<0 | 1 | 2 | 3>(initialSilver ? 0 : 3);
  const [frequency, setFrequency] = useState(80.0);

  const [mtl, setMtl] = useState(false);
  const [tps, setTps] = useState(false);
  const [bSkip, setBSkip] = useState(false);
  const [rep, setRep] = useState(false);
  const [auto, setAuto] = useState(false);
  const [memory, setMemory] = useState<number | null>(2);

  const [isBooting, setIsBooting] = useState(false);

  const [bass, setBassState] = useState(0);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('FIRE_SPECTRUM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);
  const [speakerBalance, setSpeakerBalance] = useState<'FRONT' | 'REAR' | 'CENTER'>('CENTER');
  const [displayInfoIndex, setDisplayInfoIndex] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  const [eqMode, setEqMode] = useState<'USER' | 'PRESET' | 'DEFEAT' | 'FLAT' | 'BASS_EXT'>('PRESET');
  const [presetIndex, setPresetIndex] = useState(5);
  const [activePresetName, setActivePresetName] = useState('HIP-HOP');
  const [showStreamDialog, setShowStreamDialog] = useState(false);
  const [activeStreamEmbed, setActiveStreamEmbed] = useState<{
    type: 'spotify' | 'apple' | 'soundcloud' | 'direct' | 'none';
    embedUrl: string;
    rawUrl: string;
  } | null>(null);

  const openStreamDialog = () => {
    if (!powered) setPowered(true);
    setShowStreamDialog(true);
  };
  const closeStreamDialog = () => setShowStreamDialog(false);

  const [eq, setEq] = useState<Record<EqBand, number>>({
    63: 10, 125: 6, 250: 1, 500: 0, 1000: 2, 3500: 3, 10000: 4
  });

  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [ytTitle, setYtTitle] = useState('');

  const engine = useRef<AudioEngine>(AudioEngine.getInstance());
  const ytManager = useRef<YouTubeManager>(YouTubeManager.getInstance());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme !== 'rgb') {
      document.documentElement.style.removeProperty('--color-lcd-primary');
      document.documentElement.style.removeProperty('--color-lcd-primary-rgb');
      document.documentElement.style.removeProperty('--color-lcd-secondary');
      document.documentElement.style.removeProperty('--color-lcd-secondary-rgb');
      document.documentElement.style.removeProperty('--color-lcd-danger');
      return;
    }

    let animId: number;
    const start = performance.now();

    const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color);
      };
      return [f(0), f(8), f(4)];
    };

    const toHex = ([r, g, b]: [number, number, number]) =>
      `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    const tick = () => {
      const elapsed = performance.now() - start;
      const h1 = (elapsed * 0.06) % 360;
      const h2 = (h1 + 80) % 360;
      const h3 = (h1 + 160) % 360;

      const rgb1 = hslToRgb(h1, 100, 60);
      const rgb2 = hslToRgb(h2, 100, 62);
      const rgb3 = hslToRgb(h3, 100, 65);

      const pCol = toHex(rgb1);
      const sCol = toHex(rgb2);
      const dCol = toHex(rgb3);

      document.documentElement.style.setProperty('--color-lcd-primary', pCol);
      document.documentElement.style.setProperty('--color-lcd-primary-rgb', `${rgb1[0]}, ${rgb1[1]}, ${rgb1[2]}`);
      document.documentElement.style.setProperty('--color-lcd-secondary', sCol);
      document.documentElement.style.setProperty('--color-lcd-secondary-rgb', `${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}`);
      document.documentElement.style.setProperty('--color-lcd-danger', dCol);

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      document.documentElement.style.removeProperty('--color-lcd-primary');
      document.documentElement.style.removeProperty('--color-lcd-primary-rgb');
      document.documentElement.style.removeProperty('--color-lcd-secondary');
      document.documentElement.style.removeProperty('--color-lcd-secondary-rgb');
      document.documentElement.style.removeProperty('--color-lcd-danger');
    };
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-backlit-level', String(backlitLevel));
    const multipliers = [0.12, 0.42, 0.75, 1.0];
    document.documentElement.style.setProperty('--backlight-multiplier', String(multipliers[backlitLevel]));
  }, [backlitLevel]);

  // Listen to YT Manager state changes
  useEffect(() => {
    const unsub = ytManager.current.onStateChange(state => {
      setPlaying(state.isPlaying);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (powered) {
      setIsBooting(true);
      // HARDWARE MUTE IMMEDIATELY
      engine.current.setHardwareMute(true);
      ytManager.current.setHardwareMute(true);
      try {
        ytManager.current.stop();
        engine.current.stop();
      } catch (e) {}
      setPlaying(false);

      try {
        engine.current.initialize();
        if (engine.current.context?.state === 'suspended') {
          engine.current.context.resume();
        }
      } catch (e) {
        console.error("Audio init failed", e);
      }
      
      // Authentic power on delay: keep audio strictly silent while boot animation runs, then trigger relay & unmute
      const timer = setTimeout(() => {
        setIsBooting(false);
        engine.current.setHardwareMute(false);
        ytManager.current.setHardwareMute(false);
        engine.current.setVolume(volume, attenuated);
        ytManager.current.setVolume(volume, attenuated);
        try {
          engine.current.playRelayClick();
        } catch {}
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsBooting(false);
      engine.current.setHardwareMute(true);
      ytManager.current.setHardwareMute(true);
      try {
        ytManager.current.stop();
        engine.current.stop();
      } catch (e) {}
      setPlaying(false);
    }
  }, [powered]);

  useEffect(() => {
    if (powered) {
      if (isBooting) {
        engine.current.setVolume(0, false);
        ytManager.current.setVolume(0, false);
      } else {
        engine.current.setVolume(volume, attenuated);
        ytManager.current.setVolume(volume, attenuated);
      }
    }
  }, [volume, attenuated, powered, isBooting]);

  useEffect(() => {
    if (powered) {
      EQ_BANDS.forEach(band => {
        engine.current.setEq(band, eq[band]);
      });
    }
  }, [eq, powered]);

  useEffect(() => {
    const audio = engine.current.audioElement;
    
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => { setPlaying(false); setCurrentTime(0); };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePower = () => {
    setPowered(prev => {
      const next = !prev;
      if (!next) {
        try {
          ytManager.current.stop();
          engine.current.stop();
          setActiveStreamEmbed(null);
        } catch (e) {}
        setPlaying(false);
      }
      return next;
    });
  };
  
  useEffect(() => {
    // When frequency changes in Radio mode or when boot completes, play the stream AFTER boot delay!
    if (powered && !isBooting && mode === 'RADIO') {
      ytManager.current.stop();
      const station = JDM_STATIONS.find(s => Math.abs(s.freq - frequency) < 0.05);
      if (station) {
        setYtTitle(station.name);
        engine.current.playStream(station.url);
        setPlaying(true);
      } else {
        setYtTitle('STATIC');
        engine.current.pause();
        setPlaying(false);
      }
    }
  }, [frequency, mode, powered, isBooting]);

  const loadFile = (file: File) => {
    if (isBooting) return;
    if (!powered) setPowered(true);
    ytManager.current.stop();
    setMode('AUX'); 
    setYtTitle(`AUX: ${file.name.replace(/\.[^/.]+$/, "").toUpperCase()}`);
    engine.current.loadFile(file);
    setCurrentTrack(1);
    
    setTimeout(() => {
      if (!isBooting) {
        engine.current.audioElement.play().catch(() => {});
        setPlaying(true);
      }
    }, 150);
  };

  const loadUsbFile = (file: File) => {
    if (isBooting) return;
    if (!powered) setPowered(true);
    ytManager.current.stop();
    setMode('USB'); 
    setYtTitle(`USB: ${file.name.replace(/\.[^/.]+$/, "").toUpperCase()}`);
    engine.current.loadFile(file);
    setCurrentTrack(1);
    
    setTimeout(() => {
      if (!isBooting) {
        engine.current.audioElement.play().catch(() => {});
        setPlaying(true);
      }
    }, 150);
  };

  const loadYoutubeUrl = async (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    if (isBooting) return;
    if (!powered) setPowered(true);
    setMode('CD');
    setShowStreamDialog(false);

    // 1. Check for Spotify URLs
    if (cleanUrl.includes('spotify.com')) {
      ytManager.current.stop();
      engine.current.pause();

      let embedUrl = cleanUrl;
      // Convert standard spotify URL (e.g. open.spotify.com/track/... or open.spotify.com/playlist/...) into embed
      if (!cleanUrl.includes('/embed/')) {
        embedUrl = cleanUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
      }
      if (!embedUrl.includes('utm_source')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'utm_source=generator&theme=0';
      }

      setActiveStreamEmbed({ type: 'spotify', embedUrl, rawUrl: cleanUrl });
      
      // Extract clean identifier for LCD display
      let titleGuess = 'SPOTIFY TRACK';
      if (cleanUrl.includes('/playlist/')) titleGuess = 'SPOTIFY PLAYLIST';
      else if (cleanUrl.includes('/album/')) titleGuess = 'SPOTIFY ALBUM';
      else if (cleanUrl.includes('/artist/')) titleGuess = 'SPOTIFY ARTIST';
      
      setYtTitle(titleGuess);
      setPlaying(true);
      setCurrentTrack(1);
      showToast('SPOTIFY STREAM CONNECTED');
      return;
    }

    // 2. Check for Apple Music URLs
    if (cleanUrl.includes('music.apple.com')) {
      ytManager.current.stop();
      engine.current.pause();

      let embedUrl = cleanUrl;
      if (!cleanUrl.includes('embed.music.apple.com')) {
        embedUrl = cleanUrl.replace('music.apple.com', 'embed.music.apple.com');
      }

      setActiveStreamEmbed({ type: 'apple', embedUrl, rawUrl: cleanUrl });
      let titleGuess = 'APPLE MUSIC STREAM';
      if (cleanUrl.includes('/playlist/')) titleGuess = 'APPLE MUSIC PLAYLIST';
      else if (cleanUrl.includes('/album/')) titleGuess = 'APPLE MUSIC ALBUM';
      
      setYtTitle(titleGuess);
      setPlaying(true);
      setCurrentTrack(1);
      showToast('APPLE MUSIC CONNECTED');
      return;
    }

    // 3. Check for SoundCloud URLs
    if (cleanUrl.includes('soundcloud.com')) {
      ytManager.current.stop();
      engine.current.pause();

      const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
      setActiveStreamEmbed({ type: 'soundcloud', embedUrl, rawUrl: cleanUrl });
      setYtTitle('SOUNDCLOUD STREAM');
      setPlaying(true);
      setCurrentTrack(1);
      showToast('SOUNDCLOUD CONNECTED');
      return;
    }

    // 4. Check for YouTube (Video ID, youtu.be, or youtube.com)
    const videoId = extractYouTubeId(cleanUrl);
    if (videoId) {
      setActiveStreamEmbed(null);
      // Pause native engine
      engine.current.pause();
      setYtTitle('TUNING IN YOUTUBE...');
      
      try {
        // Fetch official title via oEmbed
        const infoRes = await fetch(`/api/yt/info?url=${encodeURIComponent(cleanUrl)}`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          setYtTitle(info.title ? info.title.toUpperCase() : `YT: ${videoId}`);
        } else {
          setYtTitle(`YT: ${videoId}`);
        }
      } catch {
        setYtTitle(`YT: ${videoId}`);
      }

      ytManager.current.loadVideo(videoId);
      ytManager.current.setVolume(volume, attenuated);
      setPlaying(true);
      setCurrentTrack(1);
      return;
    }

    // 5. It is a direct web audio, radio stream, podcast, MP3/AAC, or arbitrary web stream URL
    setActiveStreamEmbed(null);
    ytManager.current.stop();
    try {
      const streamUrl = cleanUrl.startsWith('http') ? `/api/proxy?url=${encodeURIComponent(cleanUrl)}` : cleanUrl;
      engine.current.playStream(streamUrl);
      setYtTitle('WEB AUDIO STREAM');
      setCurrentTrack(1);
      setPlaying(true);
      showToast('WEB STREAM PLAYING');
    } catch (err) {
      console.error(err);
      setYtTitle('STREAM ERROR');
    }
  };

  const playPause = () => {
    if (!powered || isBooting) return;
    if (activeStreamEmbed) {
      setPlaying(prev => !prev);
      return;
    }
    if (ytManager.current.isYtActive) {
      if (playing) {
        ytManager.current.pause();
        setPlaying(false);
      } else {
        ytManager.current.play();
        setPlaying(true);
      }
    } else {
      if (playing) {
        engine.current.pause();
        setPlaying(false);
      } else {
        engine.current.play();
        setPlaying(true);
      }
    }
  };

  const seekFwd = () => {
    if (!powered || isBooting) return;
    if (ytManager.current.isYtActive) {
      ytManager.current.seek(10);
    } else {
      engine.current.seek(10);
    }
  };

  const seekRev = () => {
    if (!powered || isBooting) return;
    if (ytManager.current.isYtActive) {
      ytManager.current.seek(-10);
    } else {
      engine.current.seek(-10);
    }
  };

  const setDirectVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
    showToast(`VOL: ${Math.round(clamped * 40)}`);
  };

  const adjustBass = (val: number) => {
    const clamped = Math.max(-12, Math.min(12, val));
    setBassState(clamped);
    const midBass = Math.round(clamped * 0.75);
    engine.current.setEq(63, clamped);
    engine.current.setEq(125, midBass);
    setEq(prev => ({
      ...prev,
      63: clamped,
      125: midBass
    }));
    showToast(`BASS: ${clamped > 0 ? `+${clamped}` : clamped} dB`);
  };

  const cycleVisualizerMode = () => {
    const modes: VisualizerMode[] = [
      'BARS', 
      'PEAK_FALL', 
      'OSCILLOSCOPE', 
      'ANALOG_VU', 
      'DOT_MATRIX', 
      'FIRE_SPECTRUM', 
      'DISC', 
      'TUNNEL', 
      'RETRO_CASSETTE', 
      'JDM_CAR_DOTS', 
      'JDM_TANDEM_DOTS',
      'JDM_CAR_OLED', 
      'SERENE_JAPAN'
    ];
    setVisualizerMode(prev => {
      const nextIdx = (modes.indexOf(prev) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      const names: Record<VisualizerMode, string> = {
        BARS: 'SPEC BARS',
        PEAK_FALL: 'PEAK FALL',
        OSCILLOSCOPE: 'OSCILLO',
        ANALOG_VU: 'VU METERS',
        DOT_MATRIX: 'LED MATRIX',
        FIRE_SPECTRUM: 'FIRE SPEC',
        DISC: 'DISC OPTIC',
        TUNNEL: '3D TUNNEL',
        RETRO_CASSETTE: 'RETRO TAPE',
        JDM_CAR_DOTS: 'DRIFT MATRIX 1',
        JDM_TANDEM_DOTS: 'TANDEM MATRIX 2',
        JDM_CAR_OLED: 'JDM DRIFT OLED',
        SERENE_JAPAN: 'MT FUJI (SERENE)'
      };
      showToast(`VISUAL: ${names[nextMode]}`);
      return nextMode;
    });
  };

  const toggleSpeakerBalance = () => {
    setSpeakerBalance(b => {
      const next = b === 'CENTER' ? 'FRONT' : (b === 'FRONT' ? 'REAR' : 'CENTER');
      showToast(`SPK BAL: ${next}`);
      return next;
    });
  };

  const selectDisplayMode = () => {
    setDisplayInfoIndex(i => (i + 1) % 4);
    const names = ['STATION / TRACK', 'CLOCK & DATE', 'AUDIO BITRATE', 'DSP MATRIX'];
    showToast(`INFO: ${names[(displayInfoIndex + 1) % 4]}`);
  };

  const adjustVolume = (delta: number) => {
    setVolume(v => {
      const next = Math.max(0, Math.min(1, v + delta));
      showToast(`VOL: ${Math.round(next * 40)}`);
      return next;
    });
  };

  const adjustEq = (band: EqBand, delta: number) => {
    setEqMode('USER');
    setEq(prev => {
      const nextVal = Math.max(-12, Math.min(12, prev[band] + delta));
      engine.current.setEq(band, nextVal);
      showToast(`${band}Hz: ${nextVal > 0 ? `+${nextVal}` : nextVal}dB`);
      return { ...prev, [band]: nextVal };
    });
  };

  const applyEqPreset = (type: 'PRESET' | 'USER' | 'DEFEAT' | 'BASS_EXT' | 'FLAT') => {
    setEqMode(type);
    let targetCurves: Record<EqBand, number>;
    if (type === 'FLAT') {
      targetCurves = { 63: 0, 125: 0, 250: 0, 500: 0, 1000: 0, 3500: 0, 10000: 0 };
      setActivePresetName('FLAT');
      showToast('EQ: FLAT (0dB)');
    } else if (type === 'BASS_EXT') {
      targetCurves = { 63: 8, 125: 5, 250: 2, 500: 0, 1000: 1, 3500: 2, 10000: 3 };
      setActivePresetName('BASS EXT');
      showToast('EQ: BASS EXT (+8dB)');
    } else if (type === 'DEFEAT') {
      targetCurves = { 63: 0, 125: 0, 250: 0, 500: 0, 1000: 0, 3500: 0, 10000: 0 };
      setActivePresetName('DEFEAT');
      showToast('EQ: DEFEAT (BYPASS)');
    } else if (type === 'USER') {
      targetCurves = { ...eq };
      setActivePresetName('USER');
      showToast('EQ: USER CUSTOM');
    } else {
      const nextIdx = (presetIndex + 1) % EQ_PRESETS.length;
      setPresetIndex(nextIdx);
      const chosen = EQ_PRESETS[nextIdx];
      targetCurves = chosen.curves;
      setActivePresetName(chosen.name);
      showToast(`EQ: ${chosen.name}`);
    }
    setEq(targetCurves);
    EQ_BANDS.forEach(band => {
      engine.current.setEq(band, targetCurves[band]);
    });
  };

  const cycleDimmer = () => {
    const isSilver = typeof document !== 'undefined' && document.documentElement.getAttribute('data-chassis') === 'silver';
    if (isSilver) {
      setDimmerLevel(1);
      showToast('DIMMER: 100% (MAX LOCKED)');
      return;
    }
    setDimmerLevel(d => {
      const next = d === 1 ? 0.6 : 1;
      showToast(`DIMMER: ${next === 1 ? '100%' : '60%'}`);
      return next;
    });
  };

  const cycleBacklitLevel = () => {
    const isSilver = typeof document !== 'undefined' && document.documentElement.getAttribute('data-chassis') === 'silver';
    setBacklitLevel(lvl => {
      const next = (lvl === 3 ? 0 : lvl + 1) as 0 | 1 | 2 | 3;
      const labels: Record<number, string> = {
        0: 'BKLT: OFF',
        1: 'BKLT: LEVEL 1',
        2: 'BKLT: LEVEL 2',
        3: 'BKLT: LEVEL 3'
      };
      showToast(labels[next]);
      if (isSilver) {
        // In silver mode, keep display brightness constant at max
        setDimmerLevel(1);
      } else {
        const dimmerMap: Record<number, number> = { 0: 0.35, 1: 0.55, 2: 0.8, 3: 1.0 };
        setDimmerLevel(dimmerMap[next]);
      }
      return next;
    });
  };

  const cycleTheme = () => {
    const themes: StereoTheme[] = [
      'pink',
      'green',
      'amber',
      'cyan',
      'blue',
      'full-blue',
      'ice-blue',
      'purple',
      'sunset',
      'red',
      'ruby',
      'orange',
      'gold',
      'yellow',
      'mint',
      'laser-lime',
      'white',
      'vintage-silver',
      'rgb'
    ];

    const themeLabels: Record<StereoTheme, string> = {
      'pink': 'COLOR: LIGHT PINK',
      'green': 'COLOR: JDM GREEN',
      'amber': 'COLOR: RETRO AMBER',
      'cyan': 'COLOR: ICE AQUA',
      'blue': 'COLOR: ALPINE BLUE',
      'full-blue': 'COLOR: COBALT BLUE',
      'ice-blue': 'COLOR: ARCTIC ICE',
      'purple': 'COLOR: NIGHT VIOLET',
      'sunset': 'COLOR: 80s SUNSET',
      'red': 'COLOR: REDLINE',
      'ruby': 'COLOR: NISMO RUBY',
      'orange': 'COLOR: HIGH-VIS ORANGE',
      'gold': 'COLOR: 24K GOLD',
      'yellow': 'COLOR: SOLAR YELLOW',
      'mint': 'COLOR: NEON MINT',
      'laser-lime': 'COLOR: LASER LIME',
      'white': 'COLOR: PURE WHITE',
      'vintage-silver': 'COLOR: VINTAGE SILVER',
      'rgb': 'COLOR: RGB SPECTRUM'
    };

    setTheme(t => {
      const next = themes[(themes.indexOf(t) + 1) % themes.length];
      showToast(themeLabels[next] || `COLOR: ${next.toUpperCase()}`);
      return next;
    });
  };

  const tuneUp = () => { 
    if (!powered || isBooting) return;
    if (mode === 'RADIO') {
      setFrequency(f => {
        const next = Math.min(90.0, Math.round((f + 0.1)*10)/10);
        showToast(`FM ${next.toFixed(1)} MHz`);
        return next;
      }); 
    }
  };

  const tuneDown = () => { 
    if (!powered || isBooting) return;
    if (mode === 'RADIO') {
      setFrequency(f => {
        const next = Math.max(76.0, Math.round((f - 0.1)*10)/10);
        showToast(`FM ${next.toFixed(1)} MHz`);
        return next;
      }); 
    }
  };

  const toggleMtl = () => {
    setMtl(v => {
      showToast(`MTL TAPE: ${!v ? '70µs CrO2' : '120µs NORM'}`);
      return !v;
    });
  };
  const toggleTps = () => {
    setTps(v => {
      showToast(`TPS: ${!v ? 'ON (SCAN)' : 'OFF'}`);
      return !v;
    });
  };
  const toggleBSkip = () => {
    setBSkip(v => {
      showToast(`B-SKIP: ${!v ? 'ENABLED' : 'DISABLED'}`);
      return !v;
    });
  };
  const toggleRep = () => {
    setRep(v => {
      showToast(`REPEAT: ${!v ? 'TRACK 1' : 'OFF'}`);
      return !v;
    });
  };
  const toggleAuto = () => {
    setAuto(v => {
      showToast(`AUTO REV: ${!v ? 'AUTO' : 'MANUAL'}`);
      return !v;
    });
  };

  const autoScanRadio = () => {
    if (!powered || isBooting) return;
    if (mode !== 'RADIO') {
      setMode('RADIO');
    }
    const currentIdx = JDM_STATIONS.findIndex(s => Math.abs(s.freq - frequency) < 0.1);
    const nextIdx = (currentIdx + 1) % JDM_STATIONS.length;
    const nextStation = JDM_STATIONS[nextIdx];
    
    showToast(`SCAN: ${nextStation.freq.toFixed(1)} MHz`);
    setMemory(nextStation.preset);
    setFrequency(nextStation.freq);
    setYtTitle(nextStation.name);
    ytManager.current.stop();
    engine.current.playStream(nextStation.url);
    setPlaying(true);
  };

  const selectMemory = (preset: number) => {
    if (!powered || isBooting) return;
    setMemory(preset);
    const station = JDM_STATIONS.find(s => s.preset === preset);
    if (station) {
      if (mode !== 'RADIO') {
        setMode('RADIO');
      }
      setFrequency(station.freq);
      setYtTitle(station.name);
      ytManager.current.stop();
      engine.current.playStream(station.url);
      setPlaying(true);
      showToast(`PRESET ${preset}: ${station.name}`);
    } else {
      showToast(`CH ${preset} RECALLED`);
    }
  };

  return {
    powered, togglePower,
    isBooting,
    mode, setMode,
    theme, cycleTheme, setTheme,
    playing, playPause, seekFwd, seekRev,
    volume, adjustVolume, setDirectVolume,
    bass, adjustBass,
    visualizerMode, cycleVisualizerMode,
    toastMessage,
    speakerBalance, toggleSpeakerBalance,
    displayInfoIndex, selectDisplayMode,
    attenuated, setAttenuated: (v: boolean) => {
      setAttenuated(v);
      showToast(`ATT: ${v ? '-20dB' : '0dB'}`);
    },
    loudness, setLoudness: (v: boolean) => {
      setLoudness(v);
      showToast(`LOUDNESS: ${v ? 'ON' : 'OFF'}`);
    },
    dimmerLevel, cycleDimmer, setDimmerLevel,
    backlitLevel, cycleBacklitLevel, setBacklitLevel,
    frequency, tuneUp, tuneDown,
    eq, adjustEq, eqMode, applyEqPreset, activePresetName,
    currentTrack, currentTime, ytTitle,
    loadFile, loadUsbFile, loadYoutubeUrl,
    engine: engine.current,
    isYtPlaying: playing && ytManager.current.isYtActive,
    mtl, toggleMtl,
    tps, toggleTps,
    bSkip, toggleBSkip,
    rep, toggleRep,
    auto, toggleAuto,
    autoScanRadio,
    memory, selectMemory,
    showStreamDialog, setShowStreamDialog, openStreamDialog, closeStreamDialog,
    activeStreamEmbed, setActiveStreamEmbed
  };
}
