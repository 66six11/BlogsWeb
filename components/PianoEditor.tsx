import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';
import { parseScore, ParsedScore, ScoreMetadata, ScheduledNote, getFrequency, DEFAULT_BPM } from './ScoreParser';

const MIN_STEPS = 32;
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3];
const KEY_LABEL_WIDTH = 64;
const CELL_WIDTH = 25;

interface PianoEditorProps {
  className?: string;
}

const PianoEditor: React.FC<PianoEditorProps> = ({ className }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(-1); // Position in pixels for smooth animation
  const [currentStep, setCurrentStep] = useState(-1);
  const [availableScores, setAvailableScores] = useState<string[]>([]);
  const [selectedScore, setSelectedScore] = useState<string>('');
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [scoreMetadata, setScoreMetadata] = useState<ScoreMetadata>({ bpm: DEFAULT_BPM });
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for audio and playback management
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const playbackScheduleRef = useRef<ScheduledNote[]>([]);
  const notesByStepRef = useRef<Map<number, ScheduledNote[]>>(new Map());
  const playbackIdRef = useRef<number>(0); // Unique ID for each playback session
  const animationFrameRef = useRef<number>(0);
  
  // Calculate interval based on BPM (16th note duration in ms)
  const stepInterval = useMemo(() => {
    return Math.round(60000 / bpm / 4);
  }, [bpm]);
  
  // Calculate total steps dynamically based on notes
  const totalSteps = useMemo(() => {
    if (notes.length === 0) return MIN_STEPS;
    const maxEndTime = Math.max(...notes.map(n => n.startTime + n.duration));
    return Math.max(MIN_STEPS, Math.ceil(maxEndTime / 4) * 4 + 8);
  }, [notes]);

  // Calculate the last note end time for playback
  const lastNoteEndTime = useMemo(() => {
    if (notes.length === 0) return 0;
    return Math.max(...notes.map(n => n.startTime + n.duration));
  }, [notes]);

  // Pre-index notes by cell for O(1) lookup during grid rendering
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
  
  // Initialize with simple melody
  useEffect(() => {
    setNotes([
      { pitch: 4, octave: 4, startTime: 0, duration: 2 },
      { pitch: 8, octave: 4, startTime: 2, duration: 2 },
      { pitch: 11, octave: 4, startTime: 4, duration: 4 },
    ]);
    setAvailableScores(MEDIA_CONFIG.scores.files);
  }, []);

  // Stop playback function - cancels all scheduled audio and animations
  const stopPlayback = useCallback(() => {
    // Increment playback ID to invalidate any running playback loop
    playbackIdRef.current++;
    
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    // Close audio context to stop all scheduled sounds
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsPlaying(false);
    setCurrentStep(-1);
    setPlayheadPosition(-1);
  }, []);

  // Load score function
  const loadScore = useCallback(async (scoreName: string) => {
    // Stop any current playback first
    stopPlayback();
    
    if (!scoreName) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${MEDIA_CONFIG.scores.folder}/${scoreName}`);
      if (!response.ok) {
        console.error('Failed to load score:', scoreName);
        setIsLoading(false);
        return;
      }
      
      const content = await response.text();
      
      // Parse score and get pre-computed playback data
      const parsedScore: ParsedScore = parseScore(content);
      
      // Store playback schedule and index for later use
      playbackScheduleRef.current = parsedScore.playbackSchedule;
      notesByStepRef.current = parsedScore.notesByStep;
      
      // Update state
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

  const toggleNote = (octaveIndex: number, pitchIndex: number, step: number) => {
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
  };

  // Piano-like sound using multiple oscillators with ADSR envelope
  const playTone = useCallback((ctx: AudioContext, frequency: number, duration: number, scheduledTime: number) => {
    const now = scheduledTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const masterGain = ctx.createGain();
    
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(frequency, now);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(frequency * 3, now);
    
    gain1.gain.setValueAtTime(0.5, now);
    gain2.gain.setValueAtTime(0.2, now);
    gain3.gain.setValueAtTime(0.05, now);
    
    const attackTime = 0.01;
    const decayTime = 0.1;
    const sustainLevel = 0.3;
    const releaseTime = Math.min(duration * 0.7, 0.5);
    
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.4, now + attackTime);
    masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    masterGain.gain.setValueAtTime(sustainLevel, now + duration - releaseTime);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
    osc3.stop(now + duration + 0.1);
  }, []);

  // Start playback - schedules ALL notes at once using Web Audio API's precise timing
  const startPlayback = useCallback(() => {
    // Create fresh audio context for new playback
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    
    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const stepDurationSec = stepInterval / 1000;
    const startStep = currentStep >= 0 ? currentStep : 0;
    const startTime = ctx.currentTime;
    const currentPlaybackId = ++playbackIdRef.current;
    
    // Build playback schedule from current notes if not loaded from file
    if (notesByStepRef.current.size === 0) {
      notesByStepRef.current.clear();
      for (const note of notes) {
        const step = note.startTime;
        if (!notesByStepRef.current.has(step)) {
          notesByStepRef.current.set(step, []);
        }
        notesByStepRef.current.get(step)!.push({
          frequency: getFrequency(note.pitch, note.octave),
          startTime: note.startTime,
          duration: note.duration,
          pitch: note.pitch,
          octave: note.octave
        });
      }
    }
    
    // Schedule ALL notes at once - this prevents stuttering
    for (let step = startStep; step <= lastNoteEndTime; step++) {
      const notesAtStep = notesByStepRef.current.get(step);
      if (notesAtStep) {
        const stepTime = startTime + ((step - startStep) * stepDurationSec);
        for (const note of notesAtStep) {
          const durationSec = note.duration * stepDurationSec;
          playTone(ctx, note.frequency, Math.min(durationSec, 0.8), stepTime);
        }
      }
    }
    
    setIsPlaying(true);
    
    // Smooth animation loop for playhead
    const updatePlayhead = () => {
      // Check if this playback session is still valid
      if (playbackIdRef.current !== currentPlaybackId || !audioContextRef.current) {
        return;
      }
      
      const elapsed = audioContextRef.current.currentTime - startTime;
      const currentPosition = startStep + (elapsed / stepDurationSec);
      const pixelPosition = currentPosition * CELL_WIDTH;
      
      setPlayheadPosition(pixelPosition);
      setCurrentStep(Math.floor(currentPosition));
      
      // Auto-scroll to follow playhead
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const containerWidth = container.clientWidth;
        const scrollLeft = container.scrollLeft;
        
        if (pixelPosition > scrollLeft + containerWidth - CELL_WIDTH * 4) {
          container.scrollTo({
            left: pixelPosition - containerWidth / 2,
            behavior: 'smooth'
          });
        } else if (pixelPosition < scrollLeft) {
          container.scrollTo({
            left: Math.max(0, pixelPosition - CELL_WIDTH * 4),
            behavior: 'smooth'
          });
        }
      }
      
      // Check if playback should end
      if (currentPosition > lastNoteEndTime) {
        stopPlayback();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePlayhead);
  }, [currentStep, notes, lastNoteEndTime, stepInterval, playTone, stopPlayback]);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Update notesByStep when notes change (for manual editing)
  useEffect(() => {
    notesByStepRef.current.clear();
    for (const note of notes) {
      const step = note.startTime;
      if (!notesByStepRef.current.has(step)) {
        notesByStepRef.current.set(step, []);
      }
      notesByStepRef.current.get(step)!.push({
        frequency: getFrequency(note.pitch, note.octave),
        startTime: note.startTime,
        duration: note.duration,
        pitch: note.pitch,
        octave: note.octave
      });
    }
  }, [notes]);

  // Custom scrollbar styles
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
            onClick={() => { stopPlayback(); setNotes([]); }}
            className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
            title="清除"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={togglePlayback}
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

      {/* Loading overlay */}
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

      {/* Main grid container with fixed key labels */}
      {!isLoading && (
      <div className="relative border rounded" style={{ borderColor: 'var(--bg-tertiary, #334155)', backgroundColor: 'var(--bg-primary, #0f172a)' }}>
        {/* Fixed key labels column */}
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

        {/* Scrollable grid area */}
        <div 
          ref={scrollContainerRef}
          className="piano-scroll overflow-x-auto" 
          style={{ marginLeft: `${KEY_LABEL_WIDTH}px` }}
        >
          <div className="relative" style={{ minWidth: `${totalSteps * CELL_WIDTH}px` }}>
            {/* Smooth playhead - single element that spans all rows */}
            {playheadPosition >= 0 && (
              <div 
                className="absolute top-0 bottom-0 z-30 pointer-events-none"
                style={{ 
                  width: '2px',
                  left: `${playheadPosition}px`,
                  backgroundColor: 'rgba(251, 191, 36, 0.9)',
                  boxShadow: '0 0 12px rgba(251, 191, 36, 0.8)',
                  transition: 'none' // No transition for smooth animation
                }}
              />
            )}
            
            {/* Grid Header - clickable ruler for positioning */}
            <div className="flex h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)' }}>
              {Array.from({ length: totalSteps }).map((_, i) => {
                const isCurrentStep = currentStep === i;
                const isBeatStart = i % 4 === 0;
                return (
                  <div 
                    key={i} 
                    onClick={() => { if (!isPlaying) setCurrentStep(i); }}
                    className={`text-[10px] text-center flex items-center justify-center cursor-pointer transition-all hover:bg-white/10 ${isBeatStart ? 'font-bold' : ''}`} 
                    style={{ 
                      width: `${CELL_WIDTH}px`, 
                      flexShrink: 0,
                      color: isCurrentStep 
                        ? 'var(--accent-3, #7C85EB)' 
                        : isBeatStart 
                          ? 'var(--accent-1, #deb99a)' 
                          : 'var(--text-secondary, #475569)',
                      backgroundColor: isCurrentStep ? 'rgba(124, 133, 235, 0.2)' : 'transparent',
                      borderRight: i % 4 === 3 ? '2px solid var(--accent-1, #deb99a)' : '1px solid var(--bg-tertiary, #334155)'
                    }}
                    title={`点击定位到第 ${i + 1} 步`}
                  >
                    {isBeatStart ? i / 4 + 1 : '·'}
                  </div>
                );
              })}
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
                      <div className="flex-1 flex relative">
                        {Array.from({ length: totalSteps }).map((_, step) => {
                          const isActive = isNoteActive(octave, 11 - pIdx, step);
                          
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
      )}
      
      {/* Current position indicator */}
      {!isLoading && currentStep >= 0 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ 
            backgroundColor: 'var(--bg-secondary, #1e293b)', 
            color: 'var(--accent-3, #7C85EB)' 
          }}>
            当前位置: 第 {Math.floor(currentStep / 4) + 1} 拍 · 第 {(currentStep % 4) + 1} 步
          </span>
        </div>
      )}
      
      {!isLoading && (
      <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary, #64748b)' }}>
        点击网格添加/移除音符。点击上方标尺数字可定位播放位置。播放时视窗自动跟随。
      </p>
      )}
    </div>
  );
};

export default PianoEditor;
