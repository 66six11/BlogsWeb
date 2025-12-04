import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Upload, FileText, Plus, Minus } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';

const MIN_STEPS = 32; // Minimum 2 bars of 16th notes
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3]; // 3 Octaves range for more range
const KEY_LABEL_WIDTH = 64; // w-16 = 4rem = 64px
const CELL_WIDTH = 25; // Width of each cell in pixels
const DEFAULT_BPM = 120;

// Note name to pitch value mapping
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5,
  'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

// Score metadata interface
interface ScoreMetadata {
  title?: string;
  bpm: number;
  timeSignature?: string;
  key?: string;
}

interface PianoEditorProps {
  className?: string;
  onNotePlay?: (frequency: number, intensity: number) => void;
}

const PianoEditor: React.FC<PianoEditorProps> = ({ className, onNotePlay }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [availableScores, setAvailableScores] = useState<string[]>([]);
  const [selectedScore, setSelectedScore] = useState<string>('');
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [scoreMetadata, setScoreMetadata] = useState<ScoreMetadata>({ bpm: DEFAULT_BPM });
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Calculate interval based on BPM (16th note duration in ms)
  const stepInterval = useMemo(() => {
    // BPM is beats per minute, a beat is a quarter note = 4 sixteenth notes
    // 60000ms / BPM = ms per quarter note
    // Divide by 4 for 16th note
    return Math.round(60000 / bpm / 4);
  }, [bpm]);
  
  // Calculate total steps dynamically based on notes
  const totalSteps = useMemo(() => {
    if (notes.length === 0) return MIN_STEPS;
    const maxEndTime = Math.max(...notes.map(n => n.startTime + n.duration));
    // Round up to nearest 4 steps (quarter note) and add some buffer
    return Math.max(MIN_STEPS, Math.ceil(maxEndTime / 4) * 4 + 8);
  }, [notes]);

  // Calculate the last note end time for playback
  const lastNoteEndTime = useMemo(() => {
    if (notes.length === 0) return 0;
    return Math.max(...notes.map(n => n.startTime + n.duration));
  }, [notes]);
  
  // Initialize notes with a simple melody
  useEffect(() => {
    setNotes([
      { pitch: 4, octave: 4, startTime: 0, duration: 2 }, // E
      { pitch: 8, octave: 4, startTime: 2, duration: 2 }, // G#
      { pitch: 11, octave: 4, startTime: 4, duration: 4 }, // B
    ]);
    
    // Load available scores from config
    loadAvailableScores();
  }, []);

  const loadAvailableScores = async () => {
    // Load scores from configuration
    setAvailableScores(MEDIA_CONFIG.scores.files);
  };

  const parseScoreFile = (content: string): { notes: Note[], metadata: ScoreMetadata } => {
    const lines = content.split('\n');
    const parsedNotes: Note[] = [];
    const metadata: ScoreMetadata = { bpm: DEFAULT_BPM };
    
    // Track management for multi-track support
    // Key: track name, Value: current time position for that track
    const trackPositions: Map<string, number> = new Map();
    let currentTrack = 'default';
    trackPositions.set(currentTrack, 0);

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Parse metadata comments (special format: #@ key: value)
      if (trimmed.startsWith('#@')) {
        const metaMatch = trimmed.match(/^#@\s*(\w+)\s*:\s*(.+)$/i);
        if (metaMatch) {
          const [, key, value] = metaMatch;
          switch (key.toLowerCase()) {
            case 'bpm':
            case 'tempo':
              metadata.bpm = parseInt(value, 10) || DEFAULT_BPM;
              break;
            case 'title':
              metadata.title = value.trim();
              break;
            case 'time':
            case 'timesignature':
              metadata.timeSignature = value.trim();
              break;
            case 'key':
              metadata.key = value.trim();
              break;
          }
        }
        continue;
      }
      
      // Skip regular comments
      if (trimmed.startsWith('#')) continue;
      
      // Track switch command: [TrackName] or [TrackName:position]
      const trackMatch = trimmed.match(/^\[(\w+)(?::(\d+))?\]$/);
      if (trackMatch) {
        currentTrack = trackMatch[1];
        if (!trackPositions.has(currentTrack)) {
          // If position specified, use it; otherwise start at 0
          const startPos = trackMatch[2] ? parseInt(trackMatch[2], 10) : 0;
          trackPositions.set(currentTrack, startPos);
        } else if (trackMatch[2]) {
          // Reset track to specified position
          trackPositions.set(currentTrack, parseInt(trackMatch[2], 10));
        }
        continue;
      }
      
      // Sync command: @position - sets current track to absolute position
      const syncMatch = trimmed.match(/^@(\d+)$/);
      if (syncMatch) {
        trackPositions.set(currentTrack, parseInt(syncMatch[1], 10));
        continue;
      }
      
      const currentTime = trackPositions.get(currentTrack) || 0;

      // Check if this is a chord (multiple notes joined by +)
      if (trimmed.includes('+')) {
        // Parse chord: "C 4 + E 4 + G 4 4" - last number is duration for all
        const chordParts = trimmed.split('+').map(p => p.trim());
        const chordNotes: { noteName: string; octave: number }[] = [];
        let chordDuration = 4; // default duration

        for (let i = 0; i < chordParts.length; i++) {
          const parts = chordParts[i].split(/\s+/);
          if (parts.length >= 2) {
            const noteName = parts[0].toUpperCase();
            const octave = parseInt(parts[1], 10);
            const pitch = NOTE_TO_PITCH[noteName];
            
            if (pitch !== undefined && !isNaN(octave)) {
              chordNotes.push({ noteName, octave });
              // Check if this part has a duration (last note in chord should have it)
              if (parts.length >= 3) {
                chordDuration = parseInt(parts[2], 10) || 4;
              }
            }
          }
        }

        // Add all chord notes at the same start time
        for (const cn of chordNotes) {
          const pitch = NOTE_TO_PITCH[cn.noteName];
          if (pitch !== undefined) {
            parsedNotes.push({
              pitch,
              octave: cn.octave,
              startTime: currentTime,
              duration: chordDuration
            });
          }
        }
        trackPositions.set(currentTrack, currentTime + chordDuration);
      } else {
        // Single note parsing
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          const noteName = parts[0].toUpperCase();
          const octave = parseInt(parts[1], 10);
          const duration = parseInt(parts[2], 10);

          const pitch = NOTE_TO_PITCH[noteName];
          
          if (pitch !== undefined && !isNaN(octave) && !isNaN(duration)) {
            parsedNotes.push({
              pitch,
              octave,
              startTime: currentTime,
              duration
            });
            trackPositions.set(currentTrack, currentTime + duration);
          }
        }
      }
    }

    return { notes: parsedNotes, metadata };
  };

  const loadScore = async (scoreName: string) => {
    try {
      const response = await fetch(`${MEDIA_CONFIG.scores.folder}/${scoreName}`);
      if (!response.ok) {
        console.error('Failed to load score:', scoreName);
        return;
      }
      
      const content = await response.text();
      const { notes: parsedNotes, metadata } = parseScoreFile(content);
      
      if (parsedNotes.length > 0) {
        setNotes(parsedNotes);
        setSelectedScore(scoreName);
        setScoreMetadata(metadata);
        setBpm(metadata.bpm);
      }
    } catch (e) {
      console.error('Error loading score:', e);
    }
  };

  const toggleNote = (octaveIndex: number, pitchIndex: number, step: number) => {
    // Pitch calc: PITCHES array index 0 is high (B), 11 is low (C).
    // We need to convert visual row to actual pitch value relative to C.
    // In PITCHES: B=0 ... C=11. 
    // Real Pitch value (0-11): C=0, C#=1 ... B=11.
    const pitchVal = 11 - pitchIndex;
    const octaveVal = OCTAVES[octaveIndex];

    setNotes(prev => {
      const existing = prev.find(n => 
        n.octave === octaveVal && 
        n.pitch === pitchVal && 
        n.startTime === step
      );

      if (existing) {
        return prev.filter(n => n !== existing);
      } else {
        return [...prev, {
          pitch: pitchVal,
          octave: octaveVal,
          startTime: step,
          duration: 2 // default duration
        }];
      }
    });
  };

  const addMoreSteps = () => {
    // This is just a visual helper - the grid extends automatically
    // We can add a dummy note at the end to force extension
    const newStartTime = totalSteps;
    setNotes(prev => [...prev, {
      pitch: 0,
      octave: 4,
      startTime: newStartTime,
      duration: 1
    }]);
  };

  const playTone = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
    
    // Notify parent for particle effects
    if (onNotePlay) {
      onNotePlay(frequency, 0.5);
    }
  }, [onNotePlay]);

  const getFrequency = (pitch: number, octave: number) => {
    // A4 = 440Hz. A4 is octave 4, pitch 9 (A).
    // Midi Note Number: (Octave + 1) * 12 + Pitch
    const midi = (octave + 1) * 12 + pitch;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  useEffect(() => {
    let interval: number;
    if (isPlaying && !isDraggingProgress) {
      let step = currentStep >= 0 ? currentStep : 0;
      interval = window.setInterval(() => {
        setCurrentStep(step);
        
        // Auto-scroll to follow playhead
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const playheadPosition = step * CELL_WIDTH;
          const containerWidth = container.clientWidth;
          const scrollLeft = container.scrollLeft;
          
          // If playhead is about to go out of view on the right, scroll
          if (playheadPosition > scrollLeft + containerWidth - CELL_WIDTH * 4) {
            container.scrollTo({
              left: playheadPosition - containerWidth / 2,
              behavior: 'smooth'
            });
          }
          // If playhead is out of view on the left, scroll
          else if (playheadPosition < scrollLeft) {
            container.scrollTo({
              left: Math.max(0, playheadPosition - CELL_WIDTH * 4),
              behavior: 'smooth'
            });
          }
        }
        
        // Find notes at this step
        const notesToPlay = notes.filter(n => n.startTime === step);
        notesToPlay.forEach(n => {
          const freq = getFrequency(n.pitch, n.octave);
          // Duration based on note's duration in 16th notes
          const durationSec = (n.duration * stepInterval) / 1000;
          playTone(freq, Math.min(durationSec, 0.5)); // Cap at 0.5s for smooth sound
        });

        step++;
        // Stop playback after the last note ends (not loop)
        if (step > lastNoteEndTime) {
          setIsPlaying(false);
          setCurrentStep(-1);
        }
      }, stepInterval); // Use dynamic interval based on BPM
    } else if (!isPlaying && !isDraggingProgress) {
      setCurrentStep(-1);
    }
    return () => clearInterval(interval);
  }, [isPlaying, notes, playTone, lastNoteEndTime, stepInterval, isDraggingProgress]);

  // Handle progress bar click/drag
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || lastNoteEndTime === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newStep = Math.floor(percentage * lastNoteEndTime);
    setCurrentStep(newStep);
  }, [lastNoteEndTime]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    handleProgressClick(e);
  }, [handleProgressClick]);

  const handleProgressMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingProgress || !progressBarRef.current || lastNoteEndTime === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newStep = Math.floor(percentage * lastNoteEndTime);
    setCurrentStep(newStep);
  }, [isDraggingProgress, lastNoteEndTime]);

  const handleProgressMouseUp = useCallback(() => {
    setIsDraggingProgress(false);
  }, []);

  useEffect(() => {
    if (isDraggingProgress) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleProgressMouseMove);
      document.removeEventListener('mouseup', handleProgressMouseUp);
    };
  }, [isDraggingProgress, handleProgressMouseMove, handleProgressMouseUp]);

  // Custom scrollbar styles for piano editor
  const scrollbarStyles = `
    .piano-scroll::-webkit-scrollbar {
      height: 8px;
    }
    .piano-scroll::-webkit-scrollbar-track {
      background: var(--bg-secondary, #1e293b);
      border-radius: 4px;
    }
    .piano-scroll::-webkit-scrollbar-thumb {
      background: var(--accent-3, #7C85EB);
      border-radius: 4px;
    }
    .piano-scroll::-webkit-scrollbar-thumb:hover {
      background: var(--accent-2, #c493b1);
    }
  `;

  return (
    <div className={`piano-editor-container bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-2xl ${className}`}
         style={{ backgroundColor: 'var(--bg-tertiary, rgba(15, 23, 42, 0.8))' }}>
      <style>{scrollbarStyles}</style>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-serif flex items-center gap-2" style={{ color: 'var(--accent-3, #a78bfa)' }}>
            <span className="text-2xl">♪</span> 魔法乐谱编辑器
          </h3>
          {scoreMetadata.title && (
            <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)', color: 'var(--accent-1, #deb99a)' }}>
              {scoreMetadata.title}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* BPM Control */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
            <button
              onClick={() => setBpm(prev => Math.max(40, prev - 10))}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary, #94a3b8)' }}
              title="减速"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-mono w-16 text-center" style={{ color: 'var(--accent-1, #deb99a)' }}>
              {bpm} BPM
            </span>
            <button
              onClick={() => setBpm(prev => Math.min(240, prev + 10))}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary, #94a3b8)' }}
              title="加速"
            >
              <Plus size={14} />
            </button>
          </div>
          {/* Score loader */}
          {availableScores.length > 0 && (
            <select
              value={selectedScore}
              onChange={(e) => loadScore(e.target.value)}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={{ 
                backgroundColor: 'var(--bg-secondary, #1e293b)', 
                borderColor: 'var(--bg-tertiary, #334155)',
                color: 'var(--text-secondary, #94a3b8)'
              }}
            >
              <option value="">加载乐谱...</option>
              {availableScores.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => setNotes([])}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
            title="清除"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
              isPlaying 
              ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
              : 'text-white hover:opacity-90'
            }`}
            style={{ backgroundColor: isPlaying ? undefined : 'var(--accent-3, #7C85EB)' }}
          >
            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? '停止' : '播放'}
          </button>
        </div>
      </div>

      {/* Main grid container with fixed key labels */}
      <div className="relative border rounded" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-primary, #0f172a)' }}>
        {/* Fixed key labels column */}
        <div className="absolute left-0 top-0 bottom-0 z-20" style={{ width: `${KEY_LABEL_WIDTH}px` }}>
          {/* Header spacer for key labels */}
          <div className="h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-secondary, #1e293b)' }}></div>
          {/* Key labels */}
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

        {/* Scrollable grid area */}
        <div 
          ref={scrollContainerRef}
          className="piano-scroll overflow-x-auto" 
          style={{ marginLeft: `${KEY_LABEL_WIDTH}px` }}
        >
          <div style={{ minWidth: `${totalSteps * CELL_WIDTH}px` }}>
            {/* Grid Header - beat numbers */}
            <div className="flex h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)' }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i} 
                  className={`text-[10px] text-center flex items-center justify-center ${i % 4 === 0 ? 'font-bold' : ''}`} 
                  style={{ 
                    width: `${CELL_WIDTH}px`, 
                    flexShrink: 0,
                    color: i % 4 === 0 ? 'var(--accent-1, #deb99a)' : 'var(--text-secondary, #475569)',
                    borderRight: i % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                  }}
                >
                  {i % 4 === 0 ? i / 4 + 1 : ''}
                </div>
              ))}
            </div>

            {/* Note grid */}
            {OCTAVES.map((octave, oIdx) => (
              <React.Fragment key={octave}>
                {PITCHES.map((noteName, pIdx) => {
                  return (
                    <div 
                      key={`${octave}-${noteName}`} 
                      className="flex h-8 border-b transition-colors"
                      style={{ borderColor: 'var(--bg-tertiary, #334155)' }}
                    >
                      {/* Note cells */}
                      <div className="flex-1 flex relative">
                        {/* Playhead */}
                        {currentStep >= 0 && (
                          <div 
                            className="absolute top-0 bottom-0 z-10 pointer-events-none transition-all duration-100"
                            style={{ 
                              width: `${CELL_WIDTH}px`,
                              left: `${currentStep * CELL_WIDTH}px`,
                              backgroundColor: 'rgba(251, 191, 36, 0.3)'
                            }}
                          />
                        )}
                        {Array.from({ length: totalSteps }).map((_, step) => {
                          const isActive = notes.some(n => 
                            n.octave === octave && 
                            n.pitch === (11 - pIdx) &&
                            n.startTime === step
                          );
                          
                          return (
                            <div 
                              key={step} 
                              onClick={() => toggleNote(oIdx, pIdx, step)}
                              className="cursor-pointer transition-colors relative hover:bg-white/5"
                              style={{ 
                                width: `${CELL_WIDTH}px`, 
                                flexShrink: 0,
                                borderRight: step % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                              }}
                            >
                              {isActive && (
                                <div 
                                  className={`absolute inset-0.5 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.6)] ${isPlaying && currentStep === step ? 'animate-pulse scale-110' : ''}`}
                                  style={{ backgroundColor: 'var(--accent-3, #a855f7)' }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      {lastNoteEndTime > 0 && (
        <div className="mt-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              {currentStep >= 0 ? Math.floor((currentStep / 4) + 1) : 0}
            </span>
            <div 
              ref={progressBarRef}
              className="flex-1 h-2 rounded-full cursor-pointer relative"
              style={{ backgroundColor: 'var(--bg-secondary, #1e293b)' }}
              onMouseDown={handleProgressMouseDown}
            >
              {/* Progress fill */}
              <div 
                className="absolute left-0 top-0 bottom-0 rounded-full transition-all"
                style={{ 
                  width: `${currentStep >= 0 ? (currentStep / lastNoteEndTime) * 100 : 0}%`,
                  backgroundColor: 'var(--accent-3, #7C85EB)',
                  transition: isDraggingProgress ? 'none' : 'width 0.1s ease-out'
                }}
              />
              {/* Progress handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg transition-all hover:scale-110"
                style={{ 
                  left: `calc(${currentStep >= 0 ? (currentStep / lastNoteEndTime) * 100 : 0}% - 8px)`,
                  backgroundColor: 'var(--accent-1, #deb99a)',
                  transition: isDraggingProgress ? 'none' : 'left 0.1s ease-out'
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              {Math.floor((lastNoteEndTime / 4) + 1)}
            </span>
          </div>
        </div>
      )}
      
      <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary, #64748b)' }}>
        点击网格添加/移除音符。拖拽进度条可跳转播放位置。播放时视窗自动跟随。
      </p>
    </div>
  );
};

export default PianoEditor;
