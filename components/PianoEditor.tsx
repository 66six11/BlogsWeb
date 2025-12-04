import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Plus, Minus, Loader2, SkipBack, Pause, Crosshair, Music } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';
import { parseScore, ScoreMetadata, NOTE_DURATION_STEPS, NoteDurationType } from './ScoreParser';
import * as Tone from 'tone';

const MIN_STEPS = 32;
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
// Full 88-key piano range: A0 to C8 (octaves 0-8, but octave 0 only has A, A#, B, and octave 8 only has C)
// For simplicity, we use octaves 0-8 with all 12 notes, and the ABC parser will handle edge cases
const OCTAVES = [8, 7, 6, 5, 4, 3, 2, 1, 0];
const KEY_LABEL_WIDTH = 64;

// Octave colors - gradient from red (high) to blue (low)
const OCTAVE_COLORS: Record<number, string> = {
  8: '#ef4444', // C8 - highest - red
  7: '#f97316', // Orange
  6: '#eab308', // Yellow
  5: '#84cc16', // Lime
  4: '#22c55e', // Green (middle C)
  3: '#14b8a6', // Teal
  2: '#3b82f6', // Blue
  1: '#6366f1', // Indigo
  0: '#8b5cf6', // Purple - lowest - violet
};
const DURATION_PALETTE_WIDTH = 48; // Width for duration selector on left
const CELL_WIDTH = 25;
const DEFAULT_BPM = 120;
const VISIBLE_STEP_BUFFER = 10; // Extra steps to render beyond visible area
const MAX_CONCURRENT_NOTES = 32; // Limit concurrent oscillators for large scores

// Note colors by pitch - rainbow spectrum for different pitches
const PITCH_COLORS: Record<number, string> = {
  11: '#ef4444', // B - red
  10: '#f97316', // A# - orange
  9: '#f59e0b',  // A - amber
  8: '#eab308',  // G# - yellow
  7: '#84cc16',  // G - lime
  6: '#22c55e',  // F# - green
  5: '#14b8a6',  // F - teal
  4: '#06b6d4',  // E - cyan
  3: '#3b82f6',  // D# - blue
  2: '#6366f1',  // D - indigo
  1: '#8b5cf6',  // C# - violet
  0: '#a855f7',  // C - purple
};

// Duration options with visual icons
const DURATION_OPTIONS: { value: NoteDurationType; label: string; steps: number; icon: string }[] = [
  { value: 'sixteenth', label: '16分', steps: 1, icon: '𝅘𝅥𝅯' },
  { value: 'eighth', label: '8分', steps: 2, icon: '𝅘𝅥𝅮' },
  { value: 'quarter', label: '4分', steps: 4, icon: '𝅘𝅥' },
  { value: 'half', label: '2分', steps: 8, icon: '𝅗𝅥' },
  { value: 'whole', label: '全', steps: 16, icon: '𝅝' },
];

// Audio node object pool for performance
class AudioNodePool {
  private oscillatorPool: OscillatorNode[] = [];
  private gainPool: GainNode[] = [];
  private ctx: AudioContext;
  private poolSize = 50;
  
  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.prewarm();
  }
  
  prewarm() {
    // Pre-create nodes for pool
    for (let i = 0; i < this.poolSize; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine'; // Use sine for piano-like sound
      gain.gain.value = 0;
      this.oscillatorPool.push(osc);
      this.gainPool.push(gain);
    }
  }
  
  getNodes(): { osc: OscillatorNode; gain: GainNode } {
    // Reuse or create new
    let osc = this.oscillatorPool.pop();
    let gain = this.gainPool.pop();
    
    if (!osc || osc.context !== this.ctx) {
      osc = this.ctx.createOscillator();
      osc.type = 'sine'; // Piano-like sine wave
    }
    if (!gain || gain.context !== this.ctx) {
      gain = this.ctx.createGain();
    }
    
    return { osc, gain };
  }
  
  // Return nodes to pool after use (for future reuse)
  returnNodes(osc: OscillatorNode, gain: GainNode) {
    // Can't reuse stopped oscillators, but gains can be reused
    if (this.gainPool.length < this.poolSize) {
      try {
        gain.disconnect();
        this.gainPool.push(gain);
      } catch (e) {}
    }
  }
  
  clear() {
    this.oscillatorPool = [];
    this.gainPool = [];
  }
}

interface PianoEditorProps {
  className?: string;
  isVisible?: boolean; // Stop playback when not visible (page switched)
}

const PianoEditor: React.FC<PianoEditorProps> = ({ className, isVisible = true }) => {
  // Core state - Note[] displayed in grid, ABC used for playback
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // Start at 0, always visible
  const [playheadPosition, setPlayheadPosition] = useState(0); // Always visible at step 0
  const [abcContent, setAbcContent] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableScores, setAvailableScores] = useState<string[]>([]);
  const [selectedScore, setSelectedScore] = useState<string>('');
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [scoreMetadata, setScoreMetadata] = useState<ScoreMetadata>({ bpm: DEFAULT_BPM });
  const [isLoading, setIsLoading] = useState(false);
  const [sustain, setSustain] = useState(true); // Sustain/延音 toggle, default on
  const [isUserScrolling, setIsUserScrolling] = useState(false); // Track if user manually scrolled
  const [selectedVoice, setSelectedVoice] = useState<string>('all'); // Voice filter
  const [selectedDuration, setSelectedDuration] = useState<NoteDurationType>('eighth'); // Default to 8th note
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playbackIdRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPoolRef = useRef<AudioNodePool | null>(null);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserScrollingRef = useRef(false); // Ref version for use in animation loop
  const toneSynthRef = useRef<Tone.PolySynth | null>(null); // Tone.js synth
  
  // Virtual scroll state
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: MIN_STEPS });
  
  // Derived values
  const stepInterval = useMemo(() => Math.round(60000 / bpm / 4), [bpm]);
  
  const totalSteps = useMemo(() => {
    if (notes.length === 0) return MIN_STEPS;
    const maxEndTime = Math.max(...notes.map(n => n.startTime + n.duration));
    return Math.max(MIN_STEPS, Math.ceil(maxEndTime / 4) * 4 + 8);
  }, [notes]);

  const lastNoteEndTime = useMemo(() => {
    if (notes.length === 0) return 0;
    return Math.max(...notes.map(n => n.startTime + n.duration));
  }, [notes]);

  // Filter notes by selected voice
  const filteredNotes = useMemo(() => {
    if (selectedVoice === 'all') return notes;
    return notes.filter(n => (n.voice || 'V1') === selectedVoice);
  }, [notes, selectedVoice]);

  // O(1) note lookup for grid - includes duration info
  const activeNoteMap = useMemo(() => {
    const map = new Map<string, Note>();
    for (const note of filteredNotes) {
      map.set(`${note.octave}-${note.pitch}-${note.startTime}`, note);
    }
    return map;
  }, [filteredNotes]);

  const getNoteAt = useCallback((octave: number, pitch: number, step: number): Note | undefined => {
    return activeNoteMap.get(`${octave}-${pitch}-${step}`);
  }, [activeNoteMap]);

  // Check if a cell is part of a sustained note (for visual display)
  const isPartOfNote = useCallback((octave: number, pitch: number, step: number): { isStart: boolean; isMiddle: boolean; isEnd: boolean; note?: Note } => {
    // Check if this is the start of a note
    const startNote = activeNoteMap.get(`${octave}-${pitch}-${step}`);
    if (startNote) {
      const isEnd = startNote.duration <= 1;
      return { isStart: true, isMiddle: false, isEnd, note: startNote };
    }
    
    // Check if this step is part of a longer note that started earlier
    for (const note of filteredNotes) {
      if (note.octave === octave && note.pitch === pitch) {
        if (step > note.startTime && step < note.startTime + note.duration) {
          const isEnd = step === note.startTime + note.duration - 1;
          return { isStart: false, isMiddle: true, isEnd, note };
        }
      }
    }
    
    return { isStart: false, isMiddle: false, isEnd: false };
  }, [activeNoteMap, filteredNotes]);

  // Check if a note is active at a specific position (for grid display)
  const isNoteActive = useCallback((octave: number, pitch: number, step: number): boolean => {
    const result = isPartOfNote(octave, pitch, step);
    return result.isStart || result.isMiddle;
  }, [isPartOfNote]);
  
  // Initialize
  useEffect(() => {
    setNotes([
      { pitch: 4, octave: 4, startTime: 0, duration: 2 },
      { pitch: 8, octave: 4, startTime: 2, duration: 2 },
      { pitch: 11, octave: 4, startTime: 4, duration: 4 },
    ]);
    setAvailableScores(MEDIA_CONFIG.scores.files);
  }, []);

  // Update visible range on scroll for virtual scrolling
  const updateVisibleRange = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;
    
    const startStep = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - VISIBLE_STEP_BUFFER);
    const endStep = Math.min(totalSteps, Math.ceil((scrollLeft + clientWidth) / CELL_WIDTH) + VISIBLE_STEP_BUFFER);
    
    setVisibleRange({ start: startStep, end: endStep });
  }, [totalSteps]);

  // Handle user scroll - stop auto-follow when user manually scrolls
  const handleUserScroll = useCallback(() => {
    if (isPlaying) {
      setIsUserScrolling(true);
      isUserScrollingRef.current = true;
      
      // Clear existing timeout
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    }
    updateVisibleRange();
  }, [isPlaying, updateVisibleRange]);

  // Listen to scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    updateVisibleRange();
    container.addEventListener('scroll', handleUserScroll);
    return () => container.removeEventListener('scroll', handleUserScroll);
  }, [handleUserScroll, updateVisibleRange]);

  // Update visible range when totalSteps changes
  useEffect(() => {
    updateVisibleRange();
  }, [totalSteps, updateVisibleRange]);

  // Pause playback - keep position
  const pausePlayback = useCallback(() => {
    playbackIdRef.current++;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    if (audioPoolRef.current) {
      audioPoolRef.current.clear();
      audioPoolRef.current = null;
    }
    
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    
    // Stop Tone.js transport and synth
    try {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (toneSynthRef.current) {
        toneSynthRef.current.releaseAll();
      }
    } catch (e) {}
    
    setIsPlaying(false);
    // Keep currentStep and playheadPosition - don't reset
  }, []);

  // Stop and reset to beginning
  const stopPlayback = useCallback(() => {
    pausePlayback();
    setCurrentStep(0);
    setPlayheadPosition(0);
  }, [pausePlayback]);

  // Jump to beginning
  const jumpToStart = useCallback(() => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      pausePlayback();
    }
    setCurrentStep(0);
    setPlayheadPosition(0);
    setIsUserScrolling(false);
    isUserScrollingRef.current = false;
    // Scroll to start
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [isPlaying, pausePlayback]);

  // Jump to current playhead position
  const jumpToPlayhead = useCallback(() => {
    if (scrollContainerRef.current) {
      const c = scrollContainerRef.current;
      c.scrollLeft = Math.max(0, playheadPosition - c.clientWidth / 2);
      setIsUserScrolling(false);
      isUserScrollingRef.current = false;
    }
  }, [playheadPosition]);

  // Play using Tone.js for professional piano sound - can start from any step
  const startPlaybackFromStep = useCallback(async (fromStep?: number) => {
    if (notes.length === 0) return;
    
    // Stop any existing playback
    pausePlayback();
    
    // Start Tone.js
    await Tone.start();
    
    // Create piano-like synth with PolySynth for polyphony
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: MAX_CONCURRENT_NOTES,
      voice: Tone.Synth,
      options: {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.005,
          decay: 0.3,
          sustain: sustain ? 0.4 : 0.1,
          release: sustain ? 1.0 : 0.3,
        },
      }
    }).toDestination();
    toneSynthRef.current = synth;
    
    const stepDurationSec = stepInterval / 1000;
    const startStep = fromStep !== undefined ? fromStep : (currentStep >= 0 ? currentStep : 0);
    const currentPlaybackId = ++playbackIdRef.current;
    
    // Set BPM
    Tone.Transport.bpm.value = bpm;
    
    // Schedule notes with Tone.js Transport
    const now = Tone.now();
    for (const note of notes) {
      if (note.startTime >= startStep) {
        const midi = (note.octave + 1) * 12 + note.pitch;
        const freq = Tone.Frequency(midi, "midi").toFrequency();
        const offsetSec = (note.startTime - startStep) * stepDurationSec;
        const durSec = Math.max(0.05, note.duration * stepDurationSec);
        
        synth.triggerAttackRelease(freq, durSec, now + offsetSec);
      }
    }
    
    setIsPlaying(true);
    setIsUserScrolling(false);
    isUserScrollingRef.current = false;
    
    // Animate playhead smoothly using requestAnimationFrame
    const playStartTime = performance.now();
    const updatePlayhead = () => {
      if (playbackIdRef.current !== currentPlaybackId) return;
      
      const elapsed = (performance.now() - playStartTime) / 1000;
      const pos = startStep + (elapsed / stepDurationSec);
      
      setPlayheadPosition(pos * CELL_WIDTH);
      setCurrentStep(Math.floor(pos));
      
      // Auto-scroll
      if (scrollContainerRef.current) {
        const c = scrollContainerRef.current;
        const px = pos * CELL_WIDTH;
        const isPlayheadVisible = px >= c.scrollLeft && px <= c.scrollLeft + c.clientWidth - CELL_WIDTH * 2;
        
        if (isPlayheadVisible && isUserScrollingRef.current) {
          setIsUserScrolling(false);
          isUserScrollingRef.current = false;
        }
        
        if (!isUserScrollingRef.current) {
          if (px > c.scrollLeft + c.clientWidth - CELL_WIDTH * 4 || px < c.scrollLeft) {
            c.scrollLeft = Math.max(0, px - c.clientWidth / 2);
          }
        }
      }
      
      if (pos > lastNoteEndTime) {
        pausePlayback();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [notes, currentStep, lastNoteEndTime, stepInterval, sustain, pausePlayback, bpm]);

  // Wrapper for normal playback (from current position)
  const startPlayback = useCallback(() => {
    startPlaybackFromStep();
  }, [startPlaybackFromStep]);

  // Handle ruler click - move playhead, and if playing, restart from that position
  const handleRulerClick = useCallback((step: number) => {
    setCurrentStep(step);
    setPlayheadPosition(step * CELL_WIDTH);
    setIsUserScrolling(false);
    isUserScrollingRef.current = false;
    
    // If currently playing, restart from this position
    if (isPlaying) {
      startPlaybackFromStep(step);
    }
  }, [isPlaying, startPlaybackFromStep]);

  // Load score - always parse to Note[] for grid display
  const loadScore = useCallback(async (scoreName: string) => {
    pausePlayback();
    setCurrentStep(0);
    setPlayheadPosition(0);
    
    if (!scoreName) {
      setAbcContent('');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${MEDIA_CONFIG.scores.folder}/${scoreName}`);
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      
      const content = await response.text();
      
      // Parse to Note[] using ScoreParser - always display in grid
      const parsed = parseScore(content);
      setNotes(parsed.notes);
      setScoreMetadata(parsed.metadata);
      setBpm(parsed.metadata.bpm);
      setAbcContent(content);
      setSelectedScore(scoreName);
      setIsLoading(false);
    } catch (e) {
      console.error('Error loading score:', e);
      setIsLoading(false);
    }
  }, [stopPlayback]);

  // Toggle note in grid - uses selected duration
  const toggleNote = useCallback((octaveIndex: number, pitchIndex: number, step: number) => {
    const pitchVal = 11 - pitchIndex;
    const octaveVal = OCTAVES[octaveIndex];
    const duration = NOTE_DURATION_STEPS[selectedDuration];

    setNotes(prev => {
      // Check if clicking on any part of an existing note
      const existingNote = prev.find(n => 
        n.octave === octaveVal && n.pitch === pitchVal && 
        step >= n.startTime && step < n.startTime + n.duration
      );
      if (existingNote) return prev.filter(n => n !== existingNote);
      return [...prev, { pitch: pitchVal, octave: octaveVal, startTime: step, duration }];
    });
  }, [selectedDuration]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pausePlayback(); // Pause instead of stop - keep position
    } else {
      startPlayback();
    }
  }, [isPlaying, pausePlayback, startPlayback]);

  const clearAll = useCallback(() => {
    pausePlayback();
    setCurrentStep(0);
    setPlayheadPosition(0);
    setNotes([]);
    setAbcContent('');
    setSelectedScore('');
  }, [pausePlayback]);

  // Cleanup on unmount
  useEffect(() => () => pausePlayback(), [pausePlayback]);

  // Stop playback when page/view changes (isVisible becomes false)
  useEffect(() => {
    if (!isVisible && isPlaying) {
      pausePlayback();
    }
  }, [isVisible, isPlaying, pausePlayback]);

  const scrollbarStyles = `
    .piano-scroll::-webkit-scrollbar { height: 8px; }
    .piano-scroll::-webkit-scrollbar-track { background: var(--bg-secondary, #1e293b); }
    .piano-scroll::-webkit-scrollbar-thumb { background: var(--accent-3, #7C85EB); border-radius: 4px; }
  `;

  return (
    <div className={`piano-editor-container bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-2xl ${className}`}
         style={{ backgroundColor: 'var(--bg-tertiary, rgba(15, 23, 42, 0.8))' }}>
      <style>{scrollbarStyles}</style>
      
      {/* Header - fixed layout */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Title row */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-xl font-serif flex items-center gap-2 shrink-0" style={{ color: 'var(--accent-3, #a78bfa)' }}>
            <span className="text-2xl">♪</span> 魔法乐谱编辑器
          </h3>
          {scoreMetadata.title && (
            <span className="text-sm px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)', color: 'var(--accent-1, #deb99a)' }}>
              {scoreMetadata.title}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)', color: 'var(--text-secondary, #94a3b8)' }}>
            {notes.length} 音符
          </span>
        </div>
        
        {/* Controls row */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Sustain toggle */}
          <button
            onClick={() => setSustain(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sustain ? 'ring-2 ring-purple-400' : ''}`}
            style={{ 
              backgroundColor: sustain ? 'var(--accent-3, #7C85EB)' : 'var(--bg-secondary, #1e293b)',
              color: sustain ? 'white' : 'var(--text-secondary, #94a3b8)'
            }}
            title={sustain ? '延音开启 - 音符会自然衰减' : '延音关闭 - 音符快速停止'}
          >
            {sustain ? '延音 ✓' : '延音'}
          </button>
          
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
            <button onClick={() => setBpm(prev => Math.max(40, prev - 10))} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              <Minus size={14} />
            </button>
            <span className="text-xs font-mono w-16 text-center" style={{ color: 'var(--accent-1, #deb99a)' }}>{bpm} BPM</span>
            <button onClick={() => setBpm(prev => Math.min(240, prev + 10))} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              <Plus size={14} />
            </button>
          </div>
          
          {availableScores.length > 0 && (
            <select
              value={selectedScore}
              onChange={(e) => loadScore(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--bg-secondary, #1e293b)', borderColor: 'var(--bg-tertiary, #334155)', color: 'var(--text-secondary, #94a3b8)' }}
            >
              <option value="">加载乐谱...</option>
              {availableScores.map(score => <option key={score} value={score}>{score}</option>)}
            </select>
          )}
          
          <button onClick={clearAll} className="p-2 rounded-full hover:bg-red-500/20 text-red-400" title="清除">
            <Trash2 size={20} />
          </button>
          
          {/* Jump to start button */}
          <button
            onClick={jumpToStart}
            className="p-2 rounded-full hover:bg-white/10"
            style={{ color: 'var(--text-secondary, #94a3b8)' }}
            title="跳转到开头"
          >
            <SkipBack size={20} />
          </button>
          
          {/* Jump to playhead button - show when user has scrolled away */}
          {isUserScrolling && isPlaying && (
            <button
              onClick={jumpToPlayhead}
              className="p-2 rounded-full hover:bg-white/10 animate-pulse"
              style={{ color: 'var(--accent-3, #7C85EB)' }}
              title="跳转到播放位置"
            >
              <Crosshair size={20} />
            </button>
          )}
          
          <button 
            onClick={togglePlayback}
            disabled={notes.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
              isPlaying ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-white hover:opacity-90'
            } ${notes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: isPlaying ? undefined : 'var(--accent-3, #7C85EB)' }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? '暂停' : '播放'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-3, #7C85EB)' }} />
        </div>
      )}

      {/* Piano Grid - always shown */}
      {!isLoading && (
        <div className="flex border rounded" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-primary, #0f172a)' }}>
          {/* Duration selector panel - vertical on left */}
          <div className="flex flex-col border-r z-30" style={{ width: `${DURATION_PALETTE_WIDTH}px`, borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
            <div className="h-6 border-b flex items-center justify-center text-[10px]" style={{ borderColor: 'var(--bg-tertiary, #334155)', color: 'var(--text-secondary, #64748b)' }}>
              时值
            </div>
            <div className="flex flex-col flex-1 py-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDuration(opt.value)}
                  className={`flex flex-col items-center justify-center py-3 transition-all hover:bg-white/10 ${selectedDuration === opt.value ? 'ring-2 ring-inset ring-purple-400' : ''}`}
                  style={{ 
                    backgroundColor: selectedDuration === opt.value ? 'var(--accent-3, #7C85EB)' : 'transparent',
                    color: selectedDuration === opt.value ? 'white' : 'var(--text-secondary, #94a3b8)'
                  }}
                  title={`${opt.label}音符 (${opt.steps}步)`}
                >
                  <span className="text-xl leading-none">{opt.icon}</span>
                  <span className="text-[10px] mt-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Piano grid container with vertical scroll */}
          <div className="flex-1 relative overflow-hidden" style={{ maxHeight: '400px' }}>
            <div className="overflow-y-auto h-full" style={{ overflowX: 'hidden' }}>
              <div className="relative" style={{ minHeight: 'fit-content' }}>
                {/* Key labels - non-clickable */}
                <div className="absolute left-0 top-0 bottom-0 z-20" style={{ width: `${KEY_LABEL_WIDTH}px` }}>
                  <div className="h-6 border-b flex items-center justify-center text-[10px] sticky top-0" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-secondary, #1e293b)', color: 'var(--text-secondary, #64748b)' }}>
                    音符
                  </div>
                  {OCTAVES.map((octave) => (
                    <React.Fragment key={octave}>
                      {PITCHES.map((noteName, pIdx) => {
                        const isBlackKey = noteName.includes('#');
                        return (
                          <div 
                            key={`${octave}-${noteName}`}
                            className="flex items-center justify-end px-2 text-xs border-b border-r h-8"
                            style={{ 
                              width: `${KEY_LABEL_WIDTH}px`,
                              backgroundColor: isBlackKey ? 'var(--bg-primary, #0f172a)' : 'var(--bg-secondary, #1e293b)',
                              color: isBlackKey ? 'var(--text-secondary, #64748b)' : 'var(--text-primary, #e2e8f0)',
                              borderColor: 'var(--bg-tertiary, #334155)'
                            }}
                          >
                            <span>{noteName}{octave}</span>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {/* Scrollable grid */}
                <div ref={scrollContainerRef} className="piano-scroll overflow-x-auto" style={{ marginLeft: `${KEY_LABEL_WIDTH}px` }}>
                  <div className="relative" style={{ minWidth: `${totalSteps * CELL_WIDTH}px` }}>
                    {/* Playhead */}
                    {playheadPosition >= 0 && (
                      <div className="absolute top-0 bottom-0 z-30 pointer-events-none"
                        style={{ width: '2px', left: `${playheadPosition}px`, backgroundColor: 'rgba(251, 191, 36, 0.9)', boxShadow: '0 0 12px rgba(251, 191, 36, 0.8)' }}
                      />
                    )}
                    
                    {/* Ruler - virtual scrolling */}
                    <div className="relative h-6 border-b sticky top-0 z-10" style={{ borderColor: 'var(--bg-tertiary, #334155)', width: `${totalSteps * CELL_WIDTH}px`, backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
                      {/* Left spacer for virtual scroll */}
                      <div style={{ position: 'absolute', left: 0, width: `${visibleRange.start * CELL_WIDTH}px`, height: '100%' }} />
                      
                      {/* Visible ruler cells */}
                      <div className="absolute flex h-full" style={{ left: `${visibleRange.start * CELL_WIDTH}px` }}>
                        {Array.from({ length: visibleRange.end - visibleRange.start }).map((_, idx) => {
                          const i = visibleRange.start + idx;
                          const isBeatStart = i % 4 === 0;
                          return (
                            <div 
                              key={i} 
                              onClick={() => handleRulerClick(i)}
                              className={`text-[10px] text-center flex items-center justify-center cursor-pointer hover:bg-white/10 ${isBeatStart ? 'font-bold' : ''}`} 
                              style={{ 
                                width: `${CELL_WIDTH}px`, flexShrink: 0,
                                color: currentStep === i ? 'var(--accent-3, #7C85EB)' : isBeatStart ? 'var(--accent-1, #deb99a)' : 'var(--text-secondary, #475569)',
                                backgroundColor: currentStep === i ? 'rgba(124, 133, 235, 0.2)' : 'transparent',
                                borderRight: i % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                              }}
                            >
                              {isBeatStart ? i / 4 + 1 : '·'}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Note grid - virtual scrolling */}
                    {OCTAVES.map((octave, oIdx) => (
                      <React.Fragment key={octave}>
                        {PITCHES.map((noteName, pIdx) => (
                          <div key={`${octave}-${noteName}`} className="relative h-8 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)', width: `${totalSteps * CELL_WIDTH}px` }}>
                            {/* Left spacer for virtual scroll */}
                            <div style={{ position: 'absolute', left: 0, width: `${visibleRange.start * CELL_WIDTH}px`, height: '100%' }} />
                            
                            {/* Visible grid cells */}
                            <div className="absolute flex h-full" style={{ left: `${visibleRange.start * CELL_WIDTH}px` }}>
                              {Array.from({ length: visibleRange.end - visibleRange.start }).map((_, idx) => {
                                const step = visibleRange.start + idx;
                                const noteInfo = isPartOfNote(octave, 11 - pIdx, step);
                                const { isStart, isMiddle, isEnd, note } = noteInfo;
                                const isActive = isStart || isMiddle;
                                
                                // Get note color based on pitch (rainbow spectrum)
                                const pitchValue = 11 - pIdx;
                                const noteColor = PITCH_COLORS[pitchValue] || 'var(--accent-3, #a855f7)';
                                
                                // Determine border radius for unified note block appearance
                                let borderRadius = '0';
                                if (isStart && isEnd) {
                                  borderRadius = '4px'; // Single cell note
                                } else if (isStart) {
                                  borderRadius = '4px 0 0 4px'; // Start of multi-cell note
                                } else if (isEnd) {
                                  borderRadius = '0 4px 4px 0'; // End of multi-cell note
                                }
                                
                                return (
                                  <div 
                                    key={step} 
                                    onClick={() => toggleNote(oIdx, pIdx, step)}
                                    className="cursor-pointer hover:bg-white/5 relative"
                                    style={{ 
                                      width: `${CELL_WIDTH}px`, height: '100%', flexShrink: 0,
                                      borderRight: step % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                                    }}
                                  >
                                    {isActive && (
                                      <div 
                                        className="absolute" 
                                        style={{ 
                                          backgroundColor: noteColor,
                                          boxShadow: `0 0 10px ${noteColor}80`,
                                          borderRadius,
                                          top: '2px',
                                          bottom: '2px',
                                          left: isStart ? '2px' : '0',
                                          right: isEnd ? '2px' : '0',
                                          // Add visual indicator for note start
                                          borderLeft: isStart ? '3px solid rgba(255,255,255,0.5)' : 'none'
                                        }} 
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Position indicator */}
      {!isLoading && currentStep >= 0 && (
        <div className="mt-2 flex items-center justify-center">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)', color: 'var(--accent-3, #7C85EB)' }}>
            第 {Math.floor(currentStep / 4) + 1} 拍 · 第 {(currentStep % 4) + 1} 步
          </span>
        </div>
      )}
      
      {!isLoading && (
        <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary, #64748b)' }}>
          点击网格添加/移除音符。ABC乐谱自动解析为网格显示。
        </p>
      )}
    </div>
  );
};

export default PianoEditor;
