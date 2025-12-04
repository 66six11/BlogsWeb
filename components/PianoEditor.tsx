import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Upload, FileText, Plus } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';

const MIN_STEPS = 32; // Minimum 2 bars of 16th notes
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4]; // 2 Octaves range
const KEY_LABEL_WIDTH = 64; // w-16 = 4rem = 64px

// Note name to pitch value mapping
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

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
  const audioContextRef = useRef<AudioContext | null>(null);
  
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

  const parseScoreFile = (content: string): Note[] => {
    const lines = content.split('\n');
    const parsedNotes: Note[] = [];
    let currentTime = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;

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
          currentTime += duration;
        }
      }
    }

    return parsedNotes;
  };

  const loadScore = async (scoreName: string) => {
    try {
      const response = await fetch(`${MEDIA_CONFIG.scores.folder}/${scoreName}`);
      if (!response.ok) {
        console.error('Failed to load score:', scoreName);
        return;
      }
      
      const content = await response.text();
      const parsedNotes = parseScoreFile(content);
      
      if (parsedNotes.length > 0) {
        setNotes(parsedNotes);
        setSelectedScore(scoreName);
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
    if (isPlaying) {
      let step = 0;
      interval = window.setInterval(() => {
        setCurrentStep(step);
        
        // Find notes at this step
        const notesToPlay = notes.filter(n => n.startTime === step);
        notesToPlay.forEach(n => {
          const freq = getFrequency(n.pitch, n.octave);
          playTone(freq, 0.5); // Fixed play duration for simplicity
        });

        step++;
        // Stop playback after the last note ends (not loop)
        if (step > lastNoteEndTime) {
          setIsPlaying(false);
          setCurrentStep(-1);
        }
      }, 200); // Speed
    } else {
      setCurrentStep(-1);
    }
    return () => clearInterval(interval);
  }, [isPlaying, notes, playTone, lastNoteEndTime]);

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
        <h3 className="text-xl font-serif flex items-center gap-2" style={{ color: 'var(--accent-3, #a78bfa)' }}>
          <span className="text-2xl">♪</span> 魔法乐谱编辑器
        </h3>
        <div className="flex gap-2">
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
          className="piano-scroll overflow-x-auto" 
          style={{ marginLeft: `${KEY_LABEL_WIDTH}px` }}
        >
          <div style={{ minWidth: `${totalSteps * 25}px` }}>
            {/* Grid Header - beat numbers */}
            <div className="flex h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)' }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i} 
                  className={`text-[10px] text-center flex items-center justify-center ${i % 4 === 0 ? 'font-bold' : ''}`} 
                  style={{ 
                    width: '25px', 
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
                              width: '25px',
                              left: `${currentStep * 25}px`,
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
                                width: '25px', 
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
      <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary, #64748b)' }}>
        点击网格添加/移除音符。网格会自动延长。播放将在最后一个音符结束后停止。
      </p>
    </div>
  );
};

export default PianoEditor;
