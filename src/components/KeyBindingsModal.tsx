/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Search,
  Sliders, 
  Volume2, 
  Radio, 
  Disc, 
  CassetteTape, 
  Sparkles, 
  Zap, 
  Layers,
  Activity,
  SlidersHorizontal,
  Music,
  Maximize2
} from 'lucide-react';

interface PlayerControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StereoControlItem {
  id: string;
  name: string;
  badge: string;
  location: string;
  section: 'left' | 'right' | 'eq' | 'display';
  sectionTitle: string;
  action: string;
  functionDesc: string;
  operation: string;
  tag: string;
}

const STEREO_CONTROLS: StereoControlItem[] = [
  // LEFT PANEL CONTROLS
  {
    id: 'power',
    name: 'POWER',
    badge: 'POWER',
    location: 'Bottom of Left Control Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Master 12V Power Toggle',
    functionDesc: 'Turns the main stereo 12-Volt electrical circuit on or off. Cold-boots the system with authentic mechanical relay click sound and amber phosphor display startup.',
    operation: 'Click the heavy tactile button to switch between Standby and Active Power.',
    tag: 'Hardware Switch'
  },
  {
    id: 'volume',
    name: 'VOLUME Rotary Dial',
    badge: 'VOLUME',
    location: 'Center of Left Control Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Master Output Level Control (VOL 00 – 40)',
    functionDesc: 'Dual-ganged analog potentiometer rotary dial that scales output wattage smoothly across both audio channels with real-time level readout.',
    operation: 'Click and drag the knurled metal dial up/down or left/right to adjust sound volume.',
    tag: 'Rotary Dial'
  },
  {
    id: 'play-pause',
    name: 'PLAY / PAUSE (▶ / ❚❚)',
    badge: '▶ ❚❚',
    location: 'Lower Half of Left Control Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Audio Transport Start & Pause',
    functionDesc: 'Primary logic transport control for starting, pausing, or resuming audio across Cassette Tape, Compact Disc, Web Stream, and USB/AUX files.',
    operation: 'Click to start playback. Click again to pause audio without losing track position.',
    tag: 'Transport Button'
  },
  {
    id: 'rew-ff',
    name: 'REW ◀◀ & FF ▶▶',
    badge: '◀◀ REW / FF ▶▶',
    location: 'Top Row of Left Control Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: '10-Second Track Seek (Backward & Forward)',
    functionDesc: 'Direct transport seek buttons. Skips playback position backwards or forwards by 10 seconds in digital audio and cassette tracks.',
    operation: 'Click ◀◀ REW to jump 10s backward; click FF ▶▶ to jump 10s forward.',
    tag: 'Seek Buttons'
  },
  {
    id: 'tune-keys',
    name: 'TUNE ◀ & TUNE ▶',
    badge: '◀ TUNE v / TUNE ^ ▶',
    location: 'Second Row of Left Control Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'FM/AM Radio Frequency Step Tuning',
    functionDesc: 'Incremental frequency tuning synthesizer. Adjusts radio reception in precise 0.1 MHz increments (e.g., from 80.0 MHz to 80.1 MHz).',
    operation: 'In Radio mode, click ◀ TUNE to step frequency down, or TUNE ▶ to step frequency up.',
    tag: 'Tuner Buttons'
  },
  {
    id: 'att',
    name: 'ATT -20dB',
    badge: 'ATT -20dB',
    location: 'Below Volume Dial on Left Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Instant 20-Decibel Sound Attenuator',
    functionDesc: 'Classic automotive audio muting circuit. Drops volume down by -20dB for conversation or phone calls without disturbing the volume knob position.',
    operation: 'Click once to attenuate volume (button illuminates). Click again to instantly restore previous volume.',
    tag: 'Audio Safety'
  },
  {
    id: 'loudness',
    name: 'LOUDNESS',
    badge: 'LOUDNESS',
    location: 'Next to ATT on Left Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Fletcher-Munson Psychoacoustic Bass/Treble Contour',
    functionDesc: 'Compensates for the human ear\'s reduced sensitivity to low and high frequencies at lower listening levels, delivering full-bodied bass punch.',
    operation: 'Click to toggle on/off. When active, LOUD indicator lights up on the LCD display.',
    tag: 'Tone Filter'
  },
  {
    id: 'bklt',
    name: 'BKLT (Backlight)',
    badge: 'BKLT: 1/2/3/OFF',
    location: 'Above Power Switch on Left Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Button Illumination Brightness Dimmer',
    functionDesc: 'Adjusts illumination intensity of all physical buttons and translucent rocker switches across 4 levels (OFF, Dim, Medium, Maximum).',
    operation: 'Click repeatedly to cycle between OFF, Level 1, Level 2, and Level 3 brightness.',
    tag: 'Lighting Control'
  },
  {
    id: 'select',
    name: 'SELECT',
    badge: 'SELECT',
    location: 'Next to BKLT on Left Panel',
    section: 'left',
    sectionTitle: 'Left Panel Controls',
    action: 'Display Telemetry Mode Selector',
    functionDesc: 'Cycles the on-screen digital telemetry readout between station frequency, elapsed track timer, and status parameters.',
    operation: 'Click to cycle information modes on the main vacuum-fluorescent display.',
    tag: 'Display Key'
  },

  // RIGHT PANEL CONTROLS
  {
    id: 'tuner-mode',
    name: 'TUNER',
    badge: 'TUNER FM/AM',
    location: 'Top Left of Right Control Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'FM/AM Radio Receiver Source',
    functionDesc: 'Engages high-sensitivity PLL synthesized radio tuner. Connects to Tokyo & international streaming radio stations.',
    operation: 'Click to switch stereo source to Radio. The button stays illuminated when active.',
    tag: 'Source Selector'
  },
  {
    id: 'cd-stream',
    name: 'CD / STREAM',
    badge: 'CD STREAM [LED]',
    location: 'Top Center of Right Control Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Compact Disc & Web Audio Streaming',
    functionDesc: 'Switches to Compact Disc digital audio. Includes an integrated LED beacon that pulses in player colour during live streaming.',
    operation: 'Click once to select CD mode. Click again or click the small STREAM label to open the Web Stream / YouTube audio loader dialog.',
    tag: 'Source Selector'
  },
  {
    id: 'tape-mode',
    name: 'TAPE',
    badge: 'TAPE DECK',
    location: 'Top Right of Right Control Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Cassette Tape Deck Source',
    functionDesc: 'Engages the analog cassette tape logic transport deck. Plays authentic lo-fi vaporwave and vintage Japanese city pop tape reels.',
    operation: 'Click to activate cassette tape playback. Spindles inside the cassette bay spin automatically.',
    tag: 'Source Selector'
  },
  {
    id: 'bass-knob',
    name: 'BASS Rotary Dial',
    badge: 'BASS (dB)',
    location: 'Center of Right Control Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Dedicated Sub-Bass Dial (-12dB to +12dB)',
    functionDesc: 'Hardware low-shelf analog filter centered at 63Hz. Lets you boost punchy kick drums or attenuate boomy bass in real time.',
    operation: 'Click and drag the knurled metal rotary dial to adjust sub-bass level from -12dB to +12dB.',
    tag: 'Rotary Dial'
  },
  {
    id: 'mtl',
    name: 'MTL (Metal Tape)',
    badge: 'MTL',
    location: 'Below Bass Dial on Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Type IV Metal Tape Equalization Bias',
    functionDesc: 'Switches tape equalization time constant from 120µs (Normal Type I) to 70µs (Metal Type IV) for extended high-frequency tape headroom.',
    operation: 'Click to toggle Metal tape bias on or off. The MTL indicator illuminates on the display.',
    tag: 'Tape Bias'
  },
  {
    id: 'tps',
    name: 'TPS (Tape Program Sensor)',
    badge: 'TPS',
    location: 'Next to MTL on Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Music Search Sensor',
    functionDesc: 'Enables microprocessor tape head sensor that detects blank 4-second pauses between tracks during fast forward or rewind.',
    operation: 'Click to activate or deactivate the tape track scanner.',
    tag: 'Logic Sensor'
  },
  {
    id: 'rep',
    name: 'REP (Repeat)',
    badge: 'REP',
    location: 'Third Row of Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Continuous Repeat Playback',
    functionDesc: 'Locks playback into a continuous loop for the current track or cassette side without stopping.',
    operation: 'Click to toggle repeat loop on or off. Shows REP on the LCD screen.',
    tag: 'Playback Mode'
  },
  {
    id: 'auto-rev',
    name: 'AUTO (Auto-Reverse)',
    badge: 'AUTO',
    location: 'Next to REP on Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Bi-Directional Auto-Reverse Mechanism',
    functionDesc: 'Simulates automatic tape head rotation to play Side B automatically when Side A finishes without ejecting the tape.',
    operation: 'Click to enable or disable automatic reverse playback.',
    tag: 'Playback Mode'
  },
  {
    id: 'color-btn',
    name: 'COLOR Master Switch',
    badge: 'COLOR',
    location: 'Above Ports on Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Period-Accurate Illumination Palette Cycle',
    functionDesc: 'Changes the complete lighting theme of the entire unit across 18 authentic JDM factory hues (Tokyo Amber, Midnight Green, Ice Aqua, Cyber Pink, Alpine Blue, Rainbow RGB, etc.).',
    operation: 'Click repeatedly to cycle all backlit buttons, indicators, and display phosphors to your favorite color.',
    tag: 'Illumination'
  },
  {
    id: 'usb-port',
    name: 'USB-A Port',
    badge: 'USB PORT',
    location: 'Bottom Left Port of Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Local MP3 / WAV Flash Drive Reader',
    functionDesc: 'Authentic illuminated USB-A female jack. Lets you connect and play local audio files directly from your computer or phone.',
    operation: 'Click the glowing USB socket to open your file browser and choose any audio track to play instantly.',
    tag: 'Hardware Port'
  },
  {
    id: 'aux-jack',
    name: '3.5mm AUX Jack',
    badge: '3.5mm AUX IN',
    location: 'Bottom Right Port of Right Panel',
    section: 'right',
    sectionTitle: 'Right Panel Controls',
    action: 'Auxiliary Stereo Audio Input',
    functionDesc: 'Bezel-mounted 3.5mm mini-jack port with illuminated LED ring. Connects external stereo line-level audio files.',
    operation: 'Click the AUX jack to select and load audio files from your device storage into the stereo deck.',
    tag: 'Hardware Port'
  },

  // 7-BAND GRAPHIC EQUALIZER
  {
    id: 'eq-preset',
    name: 'EQ PRESET',
    badge: 'PRESET',
    location: 'Left Side of Graphic Equalizer',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Calibrated DSP Equalizer Curves',
    functionDesc: 'Cycles through 8 professionally tuned hardware DSP curves: ROCK, POP, JAZZ, VOCAL, CLUB, HIP-HOP, FLAT, and BASS EXT.',
    operation: 'Click PRESET to cycle through curves. The active preset name displays on the LCD screen.',
    tag: 'DSP Preset'
  },
  {
    id: 'eq-user',
    name: 'EQ USER',
    badge: 'USER',
    location: 'Next to PRESET on Equalizer Bar',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Custom User Equalizer Profile',
    functionDesc: 'Recalls your own custom equalizer curve created by adjusting the 7 individual frequency band rocker switches.',
    operation: 'Click USER to engage your customized curve.',
    tag: 'DSP Memory'
  },
  {
    id: 'eq-defeat',
    name: 'EQ DEFEAT',
    badge: 'DEFEAT',
    location: 'Third Button in Equalizer Bar',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Hardware Equalizer Bypass',
    functionDesc: 'Bypasses tone shaping circuits completely for flat studio reference playback directly from the master audio track.',
    operation: 'Click DEFEAT to hear uncolored audio.',
    tag: 'Bypass Switch'
  },
  {
    id: 'auto-scan',
    name: 'AUTO SCAN',
    badge: 'AUTO SCAN',
    location: 'Right Cluster of Equalizer Bar',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Automatic Radio Station Seeker',
    functionDesc: 'Initiates high-speed PLL frequency scan across the FM spectrum to automatically lock onto the next active station.',
    operation: 'In Radio mode, click AUTO SCAN to let the receiver search and tune to the next broadcasting station automatically.',
    tag: 'Radio Tool'
  },
  {
    id: 'bass-ext',
    name: 'BASS EXT',
    badge: 'BASS EXT',
    location: 'Next to AUTO SCAN on Equalizer Bar',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Subwoofer Bass Extension (+8dB at 63Hz)',
    functionDesc: 'One-touch low-end boost tailored for car stereo subwoofer systems. Injects a rich +8dB resonant peak into the 63Hz band.',
    operation: 'Click BASS EXT to instantly activate heavy sub-bass response.',
    tag: 'Bass Boost'
  },
  {
    id: 'eq-flat',
    name: 'FLAT',
    badge: 'FLAT',
    location: 'Far Right of Equalizer Bar',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Reset All Faders to 0dB',
    functionDesc: 'Instantly resets all 7 equalizer frequency sliders to dead-center 0dB flat response.',
    operation: 'Click FLAT to re-center all 7 frequency bands simultaneously.',
    tag: 'Reset Key'
  },
  {
    id: 'eq-faders',
    name: '7-Band Rocker Switches',
    badge: '63Hz to 10kHz ▲ ▼',
    location: 'Center Row of Graphic Equalizer',
    section: 'eq',
    sectionTitle: '7-Band Graphic Equalizer',
    action: 'Individual Frequency Band Boost & Cut (-12dB to +12dB)',
    functionDesc: '7 dual-direction rocker switches controlling 63Hz, 125Hz, 250Hz, 500Hz, 1kHz, 3.5kHz, and 10kHz bands with illuminated center dots.',
    operation: 'Click the top half (▲) of any band to boost frequency (+1dB). Click bottom half (▼) to cut frequency (-1dB).',
    tag: 'Acoustic Tuning'
  },

  // DISPLAY CONSOLE & TOP SLOTS
  {
    id: 'cd-inlet',
    name: 'Motorized CD Slot',
    badge: 'CD INLET / STREAM',
    location: 'Top Bezel of Center Display',
    section: 'display',
    sectionTitle: 'Display Console & Deck Slots',
    action: 'Disc Loader & Web Stream Aperture',
    functionDesc: 'Motorized compact disc tray slot with felt dust wipers and LED alignment diode. Doubles as a direct click trigger for Web Stream audio.',
    operation: 'Click directly on the horizontal CD slot to open the Web Stream / YouTube audio URL popup.',
    tag: 'Drive Slot'
  },
  {
    id: 'cassette-bay',
    name: 'Cassette Tape Bay',
    badge: 'CASSETTE BAY',
    location: 'Below CD Slot on Center Console',
    section: 'display',
    sectionTitle: 'Display Console & Deck Slots',
    action: 'Authentic Dual-Spindle Tape Cavity',
    functionDesc: 'Deep, pitch-black tape cavity with geared drive hubs and center magnetic guide. Spindles visibly rotate when tape playback is active.',
    operation: 'Displays motorized tape rotation during playback.',
    tag: 'Mechanical Deck'
  },
  {
    id: 'fader-speakers',
    name: 'FRONT & REAR Fader Buttons',
    badge: 'FRONT / REAR',
    location: 'Bottom Left Below Display Glass',
    section: 'display',
    sectionTitle: 'Display Console & Deck Slots',
    action: 'Cockpit Acoustic Speaker Balance',
    functionDesc: 'Toggles audio staging between FRONT cockpit speakers, REAR parcel shelf speakers, or CENTER balance.',
    operation: 'Click FRONT or REAR to adjust spatial acoustics in the cabin.',
    tag: 'Acoustic Balance'
  },
  {
    id: 'visualiser-btn',
    name: 'VISUALISER',
    badge: 'VISUALISER',
    location: 'Below Display Glass beside Speaker Buttons',
    section: 'display',
    sectionTitle: 'Display Console & Deck Slots',
    action: '13-Engine OLED & CRT Graphics Visualizer',
    functionDesc: 'Cycles through 13 authentic Japanese audio display animations: Fire Spectrum, JDM Drift Matrix, Mt. Fuji Reflection, Analog VU Meters, 3D Horizon Tunnel, CRT Oscilloscope, and Peak Fall Bars.',
    operation: 'Click VISUALISER repeatedly to cycle through all 13 graphics screens.',
    tag: 'Display Engine'
  },
  {
    id: 'presets-1-6',
    name: 'Memory Presets 1 to 6',
    badge: '1 CH to 6 CH',
    location: 'Bottom Right Below Display Glass',
    section: 'display',
    sectionTitle: 'Display Console & Deck Slots',
    action: 'Direct Radio Station Recall Keys',
    functionDesc: '6 illuminated micro-switch keys for immediate recall of pre-programmed FM radio stations: 1: InterFM (76.1), 2: TokyoFM (80.0), 3: DanceWave (81.3), 4: PopTron (82.5), 5: Bollywood (84.7), 6: Retro JDM (89.7).',
    operation: 'Click any channel key (1 to 6) to instantly tune the radio to that saved frequency.',
    tag: 'Preset Memory'
  }
];

export const KeyBindingsModal: React.FC<PlayerControlsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'left' | 'right' | 'eq' | 'display'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredControls = STEREO_CONTROLS.filter(ctrl => {
    const matchesTab = activeTab === 'all' || ctrl.section === activeTab;
    const matchesSearch = 
      ctrl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctrl.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctrl.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctrl.functionDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ctrl.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border bg-[#0b0c10] text-zinc-200 shadow-[0_12px_45px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.45)',
          boxShadow: '0 0 25px rgba(var(--color-lcd-primary-rgb), 0.2), 0 20px 40px rgba(0,0,0,0.95)'
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#101218]/90">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                borderColor: 'var(--color-lcd-primary)',
                backgroundColor: 'rgba(var(--color-lcd-primary-rgb), 0.15)',
                color: 'var(--color-lcd-primary)'
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 
                className="text-xs sm:text-sm font-bold tracking-wider uppercase font-mono flex items-center gap-2"
                style={{ color: 'var(--color-lcd-primary)' }}
              >
                <span>RETRO DIN // PLAYER CONTROLS MANUAL</span>
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Function guide for every physical button, dial, port, and switch on the stereo deck
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs & Search Row */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0c0d12] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Controls' },
              { id: 'left', label: 'Left Panel' },
              { id: 'right', label: 'Right Panel' },
              { id: 'eq', label: 'Graphic EQ' },
              { id: 'display', label: 'Display & Slots' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer border ${
                  activeTab === tab.id
                    ? 'border-[var(--color-lcd-primary)] text-[var(--color-lcd-primary)] bg-[rgba(var(--color-lcd-primary-rgb),0.18)] shadow-[0_0_8px_rgba(var(--color-lcd-primary-rgb),0.3)]'
                    : 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by button name or function..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#14161f] border border-white/10 rounded-md pl-8 pr-2.5 py-1 text-[10px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[var(--color-lcd-primary)]"
            />
          </div>
        </div>

        {/* Scrollable Controls Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 custom-scrollbar">
          {filteredControls.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-mono text-xs">
              No stereo buttons match your search query "{searchQuery}".
            </div>
          ) : (
            filteredControls.map(ctrl => (
              <div
                key={ctrl.id}
                className="rounded-lg p-3 sm:p-3.5 bg-[#12141c]/90 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
              >
                {/* Left Column: Visual Badge & Identity */}
                <div className="flex items-start gap-3 min-w-[200px] sm:max-w-[240px]">
                  <div 
                    className="px-2.5 py-1.5 rounded bg-black/90 border font-mono text-[10px] font-black tracking-wider flex-shrink-0 text-center min-w-[70px] shadow"
                    style={{
                      borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.65)',
                      color: 'var(--color-lcd-primary)',
                      textShadow: '0 0 4px rgba(var(--color-lcd-primary-rgb), 0.4)'
                    }}
                  >
                    {ctrl.badge}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 font-mono tracking-wide">
                      {ctrl.name}
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">
                      📍 {ctrl.location}
                    </span>
                    <span className="inline-block mt-1 text-[8px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-zinc-400 uppercase">
                      {ctrl.tag}
                    </span>
                  </div>
                </div>

                {/* Right Column: Function Description & How to Operate */}
                <div className="flex-1 text-[10.5px] font-sans text-zinc-300 leading-relaxed border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-4">
                  <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-lcd-primary)' }}
                    />
                    <span>{ctrl.action}</span>
                  </div>
                  <p className="mt-1 text-zinc-300 text-[10.5px] leading-snug">
                    {ctrl.functionDesc}
                  </p>
                  <p className="mt-1 text-emerald-400/90 text-[9.5px] font-mono">
                    <strong className="text-zinc-400 uppercase">How to operate:</strong> {ctrl.operation}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#0e1017] border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-zinc-400">
          <span>Total physical controls documented: {STEREO_CONTROLS.length}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors cursor-pointer"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
