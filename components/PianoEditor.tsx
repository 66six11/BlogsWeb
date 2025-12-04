import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';
import { parseScore, ScoreMetadata, getFrequency, DEFAULT_BPM } from './ScoreParser';
import abcjs from 'abcjs';

const MIN_STEPS = 32;
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3];
const KEY_LABEL_WIDTH = 64;
const CELL_WIDTH = 25;

// Pitch number to ABC note name mapping
const PITCH_TO_ABC: Record<number, string> = {
  0: 'C', 1: '^C', 2: 'D', 3: '^D', 4: 'E', 5: 'F',
  6: '^F', 7: 'G', 8: '^G', 9: 'A', 10: '^A', 11: 'B'
};

interface PianoEditorProps {
  className?: string;
}

const PianoEditor: React.FC<PianoEditorProps> = ({ className }) => {
  // Core state - Note[] is the single source of truth
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(-1);
  const [currentStep, setCurrentStep] = useState(-1);
  const [availableScores, setAvailableScores] = useState<string[]>([]);
  const [selectedScore, setSelectedScore] = useState<string>('');
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [scoreMetadata, setScoreMetadata] = useState<ScoreMetadata>({ bpm: DEFAULT_BPM });
  const [isLoading, setIsLoading] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playbackIdRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const synthControlRef = useRef<any>(null);
  const abcAudioContextRef = useRef<AudioContext | null>(null);
  
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

  // Pre-index for O(1) grid lookup
  const activeNoteSet = useMemo(() => {
    const set = new Set<string>();
    for (const note of notes) {
      set.add(`${note.octave}-${note.pitch}-${note.startTime}`);
    }
    return set;
  }, [notes]);

  const isNoteActive = useCallback((octave: number, pitch: number, step: number) => {
    return activeNoteSet.has(`${octave}-${pitch}-${step}`);
  }, [activeNoteSet]);

  // Convert Note[] to ABC notation for abcjs playback
  const notesToAbc = useCallback((noteList: Note[], tempo: number): string => {
    if (noteList.length === 0) return '';
    
    // Group notes by startTime for chords
    const notesByTime = new Map<number, Note[]>();
    for (const note of noteList) {
      if (!notesByTime.has(note.startTime)) {
        notesByTime.set(note.startTime, []);
      }
      notesByTime.get(note.startTime)!.push(note);
    }
    
    // Sort by time
    const times = Array.from(notesByTime.keys()).sort((a, b) => a - b);
    
    let abc = `X:1\nT:Piano Roll\nM:4/4\nL:1/16\nQ:1/4=${tempo}\nK:C\n`;
    
    let currentTime = 0;
    for (const time of times) {
      // Add rests for gaps
      if (time > currentTime) {
        const restDuration = time - currentTime;
        abc += `z${restDuration} `;
      }
      
      const notesAtTime = notesByTime.get(time)!;
      
      // Convert notes to ABC
      if (notesAtTime.length === 1) {
        const note = notesAtTime[0];
        abc += noteToAbc(note);
      } else {
        // Chord
        abc += '[';
        for (const note of notesAtTime) {
          abc += noteToAbc(note, true);
        }
        abc += ']';
        abc += notesAtTime[0].duration;
      }
      abc += ' ';
      
      // Update current time
      const maxDuration = Math.max(...notesAtTime.map(n => n.duration));
      currentTime = time + maxDuration;
    }
    
    abc += '|]\n';
    return abc;
  }, []);

  // Convert single note to ABC
  const noteToAbc = (note: Note, inChord: boolean = false): string => {
    let abc = PITCH_TO_ABC[note.pitch] || 'C';
    
    // Octave modifiers
    if (note.octave === 5) {
      abc = abc.toLowerCase();
    } else if (note.octave === 3) {
      abc = abc + ',';
    }
    // octave 4 is default (uppercase)
    
    // Duration (only if not in chord)
    if (!inChord) {
      abc += note.duration;
    }
    
    return abc;
  };
  
  // Initialize
  useEffect(() => {
    setNotes([
      { pitch: 4, octave: 4, startTime: 0, duration: 2 },
      { pitch: 8, octave: 4, startTime: 2, duration: 2 },
      { pitch: 11, octave: 4, startTime: 4, duration: 4 },
    ]);
    setAvailableScores(MEDIA_CONFIG.scores.files);
  }, []);

  // Stop playback
  const stopPlayback = useCallback(() => {
    playbackIdRef.current++;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    // Stop abcjs synth
    if (synthControlRef.current) {
      try {
        synthControlRef.current.stop();
      } catch (e) {}
      synthControlRef.current = null;
    }
    
    if (abcAudioContextRef.current) {
      try {
        abcAudioContextRef.current.close();
      } catch (e) {}
      abcAudioContextRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentStep(-1);
    setPlayheadPosition(-1);
    setPlaybackProgress(0);
  }, []);

  // Play using abcjs - converts Note[] to ABC and plays
  const startPlayback = useCallback(async () => {
    if (notes.length === 0) return;
    
    stopPlayback();
    
    try {
      // Create audio context
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      abcAudioContextRef.current = ctx;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Convert notes to ABC
      const abcString = notesToAbc(notes, bpm);
      
      // Parse with abcjs
      const visualObj = abcjs.renderAbc('abc-hidden', abcString, { 
        add_classes: true,
        responsive: 'resize' 
      })[0];
      
      if (!visualObj) {
        console.error('Failed to parse ABC');
        return;
      }
      
      // Create synth
      const synth = new abcjs.synth.CreateSynth();
      await synth.init({
        audioContext: ctx,
        visualObj: visualObj,
        millisecondsPerMeasure: visualObj.millisecondsPerMeasure?.() || 2000
      });
      
      await synth.prime();
      
      // Create synth control for playback management
      const synthControl = new abcjs.synth.SynthController();
      synthControlRef.current = synthControl;
      
      synthControl.load('#abc-hidden', null, {
        displayLoop: false,
        displayRestart: false,
        displayPlay: false,
        displayProgress: false,
        displayWarp: false
      });
      
      synthControl.setTune(visualObj, false, {
        audioContext: ctx
      });
      
      const currentPlaybackId = ++playbackIdRef.current;
      setIsPlaying(true);
      
      // Get duration info
      const totalDurationMs = lastNoteEndTime * stepInterval;
      const startTime = performance.now();
      const startStep = currentStep >= 0 ? currentStep : 0;
      
      // Start synth
      synthControl.play();
      
      // Animation loop for smooth playhead
      const updatePlayhead = () => {
        if (playbackIdRef.current !== currentPlaybackId) return;
        
        const elapsed = performance.now() - startTime;
        const currentPosition = startStep + (elapsed / stepInterval);
        const pixelPosition = currentPosition * CELL_WIDTH;
        
        setPlayheadPosition(pixelPosition);
        setCurrentStep(Math.floor(currentPosition));
        setPlaybackProgress((elapsed / totalDurationMs) * 100);
        
        // Auto-scroll (direct assignment, no smooth)
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const containerWidth = container.clientWidth;
          const scrollLeft = container.scrollLeft;
          
          if (pixelPosition > scrollLeft + containerWidth - CELL_WIDTH * 4 ||
              pixelPosition < scrollLeft + CELL_WIDTH * 2) {
            container.scrollLeft = Math.max(0, pixelPosition - containerWidth / 2);
          }
        }
        
        if (currentPosition > lastNoteEndTime) {
          stopPlayback();
          return;
        }
        
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      };
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      
    } catch (e) {
      console.error('Playback error:', e);
      stopPlayback();
    }
  }, [notes, bpm, currentStep, lastNoteEndTime, stepInterval, notesToAbc, stopPlayback]);

  // Load score
  const loadScore = useCallback(async (scoreName: string) => {
    stopPlayback();
    
    if (!scoreName) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${MEDIA_CONFIG.scores.folder}/${scoreName}`);
      if (!response.ok) {
        setIsLoading(false);
        return;
      }
      
      const content = await response.text();
      
      // Parse to Note[] - this is now our single source of truth
      const parsedScore = parseScore(content);
      
      setNotes(parsedScore.notes);
      setSelectedScore(scoreName);
      setScoreMetadata(parsedScore.metadata);
      setBpm(parsedScore.metadata.bpm);
      setIsLoading(false);
    } catch (e) {
      console.error('Error loading score:', e);
      setIsLoading(false);
    }
  }, [stopPlayback]);

  // Toggle note in grid
  const toggleNote = useCallback((octaveIndex: number, pitchIndex: number, step: number) => {
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
          duration: 2
        }];
      }
    });
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);

  const clearNotes = useCallback(() => {
    stopPlayback();
    setNotes([]);
    setSelectedScore('');
  }, [stopPlayback]);

  // Cleanup
  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const scrollbarStyles = `
    .piano-scroll::-webkit-scrollbar { height: 8px; }
    .piano-scroll::-webkit-scrollbar-track { background: var(--bg-secondary, #1e293b); border-radius: 4px; }
    .piano-scroll::-webkit-scrollbar-thumb { background: var(--accent-3, #7C85EB); border-radius: 4px; }
  `;

  return (
    <div className={`piano-editor-container bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-2xl ${className}`}
         style={{ backgroundColor: 'var(--bg-tertiary, rgba(15, 23, 42, 0.8))' }}>
      <style>{scrollbarStyles}</style>
      
      {/* Hidden div for abcjs */}
      <div id="abc-hidden" style={{ display: 'none' }}></div>
      
      {/* Header */}
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
          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)', color: 'var(--text-secondary, #94a3b8)' }}>
            {notes.length} 音符
          </span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* BPM Control */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
            <button
              onClick={() => setBpm(prev => Math.max(40, prev - 10))}
              className="p-1 rounded hover:bg-white/10"
              style={{ color: 'var(--text-secondary, #94a3b8)' }}
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-mono w-16 text-center" style={{ color: 'var(--accent-1, #deb99a)' }}>
              {bpm} BPM
            </span>
            <button
              onClick={() => setBpm(prev => Math.min(240, prev + 10))}
              className="p-1 rounded hover:bg-white/10"
              style={{ color: 'var(--text-secondary, #94a3b8)' }}
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
            onClick={clearNotes}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-400"
            title="清除"
          >
            <Trash2 size={20} />
          </button>
          
          <button 
            onClick={togglePlayback}
            disabled={notes.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
              isPlaying 
              ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
              : 'text-white hover:opacity-90'
            } ${notes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: isPlaying ? undefined : 'var(--accent-3, #7C85EB)' }}
          >
            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? '停止' : '播放'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isPlaying && (
        <div className="mb-3">
          <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary, #1e293b)' }}>
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${Math.min(playbackProgress, 100)}%`,
                backgroundColor: 'var(--accent-3, #7C85EB)',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-3, #7C85EB)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary, #94a3b8)' }}>
              正在加载乐谱...
            </span>
          </div>
        </div>
      )}

      {/* Piano Grid */}
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
          <div 
            ref={scrollContainerRef}
            className="piano-scroll overflow-x-auto" 
            style={{ marginLeft: `${KEY_LABEL_WIDTH}px` }}
          >
            <div className="relative" style={{ minWidth: `${totalSteps * CELL_WIDTH}px` }}>
              {/* Smooth playhead */}
              {playheadPosition >= 0 && (
                <div 
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{ 
                    width: '2px',
                    left: `${playheadPosition}px`,
                    backgroundColor: 'rgba(251, 191, 36, 0.9)',
                    boxShadow: '0 0 12px rgba(251, 191, 36, 0.8)'
                  }}
                />
              )}
              
              {/* Ruler */}
              <div className="flex h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)' }}>
                {Array.from({ length: totalSteps }).map((_, i) => {
                  const isCurrentStep = currentStep === i;
                  const isBeatStart = i % 4 === 0;
                  return (
                    <div 
                      key={i} 
                      onClick={() => { if (!isPlaying) setCurrentStep(i); }}
                      className={`text-[10px] text-center flex items-center justify-center cursor-pointer hover:bg-white/10 ${isBeatStart ? 'font-bold' : ''}`} 
                      style={{ 
                        width: `${CELL_WIDTH}px`, 
                        flexShrink: 0,
                        color: isCurrentStep ? 'var(--accent-3, #7C85EB)' : isBeatStart ? 'var(--accent-1, #deb99a)' : 'var(--text-secondary, #475569)',
                        backgroundColor: isCurrentStep ? 'rgba(124, 133, 235, 0.2)' : 'transparent',
                        borderRight: i % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                      }}
                    >
                      {isBeatStart ? i / 4 + 1 : '·'}
                    </div>
                  );
                })}
              </div>

              {/* Note grid */}
              {OCTAVES.map((octave, oIdx) => (
                <React.Fragment key={octave}>
                  {PITCHES.map((noteName, pIdx) => (
                    <div 
                      key={`${octave}-${noteName}`} 
                      className="flex h-8 border-b"
                      style={{ borderColor: 'var(--bg-tertiary, #334155)' }}
                    >
                      <div className="flex-1 flex">
                        {Array.from({ length: totalSteps }).map((_, step) => {
                          const isActive = isNoteActive(octave, 11 - pIdx, step);
                          return (
                            <div 
                              key={step} 
                              onClick={() => toggleNote(oIdx, pIdx, step)}
                              className="cursor-pointer hover:bg-white/5 relative"
                              style={{ 
                                width: `${CELL_WIDTH}px`, 
                                flexShrink: 0,
                                borderRight: step % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                              }}
                            >
                              {isActive && (
                                <div 
                                  className="absolute inset-0.5 rounded-sm shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                                  style={{ backgroundColor: 'var(--accent-3, #a855f7)' }}
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
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ 
            backgroundColor: 'var(--bg-secondary, #1e293b)', 
            color: 'var(--accent-3, #7C85EB)' 
          }}>
            第 {Math.floor(currentStep / 4) + 1} 拍 · 第 {(currentStep % 4) + 1} 步
          </span>
        </div>
      )}
      
      {!isLoading && (
        <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary, #64748b)' }}>
          点击网格添加/移除音符。ABC乐谱将解析为音符数据并可编辑。
        </p>
      )}
    </div>
  );
};

export default PianoEditor;
