import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Plus, Minus, Loader2, SkipBack, Pause, Crosshair, Music } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';
import { parseScore, ScoreMetadata, NOTE_DURATION_STEPS, NoteDurationType } from './ScoreParser';

const MIN_STEPS = 32;
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3];
const KEY_LABEL_WIDTH = 64;
const CELL_WIDTH = 25;
const DEFAULT_BPM = 120;
const VISIBLE_STEP_BUFFER = 10; // Extra steps to render beyond visible area

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

// Duration options for note editor
const DURATION_OPTIONS: { value: NoteDurationType; label: string; steps: number }[] = [
  { value: 'sixteenth', label: '16分', steps: 1 },
  { value: 'eighth', label: '8分', steps: 2 },
  { value: 'quarter', label: '4分', steps: 4 },
  { value: 'half', label: '2分', steps: 8 },
  { value: 'whole', label: '全音符', steps: 16 },
];

interface PianoEditorProps {
  className?: string;
}

const PianoEditor: React.FC<PianoEditorProps> = ({ className }) => {
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

  // Play using Web Audio with object pool - works for both ABC and manual notes
  const startPlayback = useCallback(async () => {
    if (notes.length === 0) return;
    
    // Stop audio but keep position
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
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume();
    
    // Create audio pool
    const pool = new AudioNodePool(ctx);
    audioPoolRef.current = pool;
    
    const stepDurationSec = stepInterval / 1000;
    const startStep = currentStep >= 0 ? currentStep : 0;
    const startTime = ctx.currentTime;
    const currentPlaybackId = ++playbackIdRef.current;
    
    // Group notes by step for efficient scheduling
    const notesByStep = new Map<number, Note[]>();
    for (const note of notes) {
      if (!notesByStep.has(note.startTime)) notesByStep.set(note.startTime, []);
      notesByStep.get(note.startTime)!.push(note);
    }
    
    // Schedule all notes at once with piano-like ADSR envelope
    const useSustain = sustain;
    for (let step = startStep; step <= lastNoteEndTime; step++) {
      const notesAtStep = notesByStep.get(step);
      if (notesAtStep) {
        const stepTime = startTime + ((step - startStep) * stepDurationSec);
        for (const note of notesAtStep) {
          const midi = (note.octave + 1) * 12 + note.pitch;
          const freq = 440 * Math.pow(2, (midi - 69) / 12);
          const dur = note.duration * stepDurationSec;
          
          // Create multiple oscillators for richer piano sound
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // Use sine and triangle for piano-like timbre
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(freq, stepTime);
          osc2.frequency.setValueAtTime(freq * 2, stepTime); // Harmonic
          
          // Piano-like ADSR envelope
          const attackTime = 0.005; // Very fast attack
          const decayTime = 0.1;
          const sustainLevel = useSustain ? 0.3 : 0.1;
          const releaseTime = useSustain ? dur * 0.8 : 0.1;
          
          gain.gain.setValueAtTime(0, stepTime);
          gain.gain.linearRampToValueAtTime(0.4, stepTime + attackTime); // Attack
          gain.gain.exponentialRampToValueAtTime(sustainLevel, stepTime + attackTime + decayTime); // Decay
          
          if (useSustain) {
            // Sustain mode - gradual decay over note duration
            gain.gain.exponentialRampToValueAtTime(0.001, stepTime + dur);
          } else {
            // No sustain - quick release after decay
            gain.gain.exponentialRampToValueAtTime(0.001, stepTime + attackTime + decayTime + 0.15);
          }
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(stepTime);
          osc2.start(stepTime);
          osc1.stop(stepTime + dur + 0.2);
          osc2.stop(stepTime + dur + 0.2);
        }
      }
    }
    
    setIsPlaying(true);
    setIsUserScrolling(false); // Reset user scrolling state when starting playback
    isUserScrollingRef.current = false;
    
    // Animate playhead smoothly
    const updatePlayhead = () => {
      if (playbackIdRef.current !== currentPlaybackId || !audioContextRef.current) return;
      
      const elapsed = audioContextRef.current.currentTime - startTime;
      const pos = startStep + (elapsed / stepDurationSec);
      
      setPlayheadPosition(pos * CELL_WIDTH);
      setCurrentStep(Math.floor(pos));
      
      // Auto-scroll only if user hasn't manually scrolled
      if (scrollContainerRef.current) {
        const c = scrollContainerRef.current;
        const px = pos * CELL_WIDTH;
        const isPlayheadVisible = px >= c.scrollLeft && px <= c.scrollLeft + c.clientWidth - CELL_WIDTH * 2;
        
        // If playhead re-enters visible area after user scroll, resume following
        if (isPlayheadVisible && isUserScrollingRef.current) {
          setIsUserScrolling(false);
          isUserScrollingRef.current = false;
        }
        
        // Only auto-scroll if not user scrolling
        if (!isUserScrollingRef.current) {
          if (px > c.scrollLeft + c.clientWidth - CELL_WIDTH * 4 || px < c.scrollLeft) {
            c.scrollLeft = Math.max(0, px - c.clientWidth / 2);
          }
        }
      }
      
      if (pos > lastNoteEndTime) {
        // Playback finished - pause but keep at end position
        pausePlayback();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [notes, currentStep, lastNoteEndTime, stepInterval, sustain, pausePlayback]);

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

  // Cleanup
  useEffect(() => () => pausePlayback(), [pausePlayback]);

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
          {/* Note duration selector */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
            <Music size={14} style={{ color: 'var(--accent-3, #7C85EB)' }} />
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value as NoteDurationType)}
              className="text-xs bg-transparent border-none outline-none cursor-pointer"
              style={{ color: 'var(--accent-1, #deb99a)' }}
              title="音符时值"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
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
        <div className="relative border rounded" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-primary, #0f172a)' }}>
          {/* Key labels */}
          <div className="absolute left-0 top-0 bottom-0 z-20" style={{ width: `${KEY_LABEL_WIDTH}px` }}>
            <div className="h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-secondary, #1e293b)' }}></div>
            {OCTAVES.map((octave) => (
              <React.Fragment key={octave}>
                {PITCHES.map((noteName) => {
                  const isBlackKey = noteName.includes('#');
                  return (
                    <div 
                      key={`${octave}-${noteName}`}
                      className="flex items-center justify-end pr-2 text-xs border-b border-r h-8"
                      style={{ 
                        width: `${KEY_LABEL_WIDTH}px`,
                        backgroundColor: isBlackKey ? 'var(--bg-primary, #0f172a)' : 'var(--bg-secondary, #1e293b)',
                        color: isBlackKey ? 'var(--text-secondary, #64748b)' : 'var(--text-primary, #e2e8f0)',
                        borderColor: 'var(--bg-tertiary, #334155)'
                      }}
                    >
                      {noteName}{octave}
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
              <div className="relative h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)', width: `${totalSteps * CELL_WIDTH}px` }}>
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
                        onClick={() => { if (!isPlaying) setCurrentStep(i); }}
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
                                  className="absolute shadow-[0_0_10px_rgba(168,85,247,0.6)]" 
                                  style={{ 
                                    backgroundColor: isStart ? 'var(--accent-3, #a855f7)' : 'var(--accent-3, #9333ea)',
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
