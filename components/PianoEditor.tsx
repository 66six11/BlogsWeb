import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, FileText, Upload, ChevronDown } from 'lucide-react';

const TOTAL_STEPS = 32; // 2 bars of 16th notes
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4]; // 2 Octaves range

// Pitch name to number conversion
const PITCH_MAP: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

interface SheetMusic {
  title: string;
  tempo: number;
  timeSignature: string;
  notes: Note[];
}

interface PianoEditorProps {
  className?: string;
  onBeat?: (intensity: number) => void; // Callback for particle animation
  analyserRef?: React.MutableRefObject<AnalyserNode | null>;
}

// Available sheet music files in public/sheets folder
const AVAILABLE_SHEETS = [
  { name: '魔女之旅 - 旅人之歌', file: 'wandering-witch.txt' },
  { name: '简单练习曲', file: 'simple-scale.txt' },
];

const PianoEditor: React.FC<PianoEditorProps> = ({ className, onBeat, analyserRef }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [loadingSheet, setLoadingSheet] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const internalAnalyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Initialize notes with a simple melody
  useEffect(() => {
    setNotes([
      { pitch: 4, octave: 4, startTime: 0, duration: 2 }, // E
      { pitch: 7, octave: 4, startTime: 2, duration: 2 }, // G
      { pitch: 9, octave: 4, startTime: 4, duration: 2 }, // A
      { pitch: 11, octave: 4, startTime: 6, duration: 2 }, // B
    ]);
  }, []);

  // Parse sheet music file content
  const parseSheetMusic = useCallback((content: string): SheetMusic => {
    const lines = content.split('\n');
    const result: SheetMusic = {
      title: 'Untitled',
      tempo: 120,
      timeSignature: '4/4',
      notes: []
    };

    let currentStep = 0;
    const stepsPerBeat = 4; // 16th notes

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      // Parse metadata
      if (trimmed.startsWith('TITLE:')) {
        result.title = trimmed.substring(6).trim();
        continue;
      }
      if (trimmed.startsWith('TEMPO:')) {
        result.tempo = parseInt(trimmed.substring(6).trim()) || 120;
        continue;
      }
      if (trimmed.startsWith('TIME_SIGNATURE:')) {
        result.timeSignature = trimmed.substring(15).trim();
        continue;
      }

      // Parse notes in the line
      const noteTokens = trimmed.split(/\s+/);
      
      for (const token of noteTokens) {
        if (token === '|') {
          // Bar line - align to next measure (8 steps = 2 beats in 4/4)
          const stepsPerMeasure = 8; 
          currentStep = Math.ceil(currentStep / stepsPerMeasure) * stepsPerMeasure;
          continue;
        }
        
        if (token === '-') {
          // Rest
          currentStep += 2;
          continue;
        }

        // Parse note format: C4:4 (pitch:duration)
        const match = token.match(/^([A-Ga-g][#b]?)(\d):(\d+)$/);
        if (match) {
          const pitchName = match[1].toUpperCase();
          const octave = parseInt(match[2]);
          const durationValue = parseInt(match[3]);

          const pitch = PITCH_MAP[pitchName];
          if (pitch !== undefined && octave >= 3 && octave <= 6) {
            // Convert duration value to steps (16=1, 8=2, 4=4, 2=8, 1=16)
            const duration = Math.max(1, Math.round(16 / durationValue));
            
            result.notes.push({
              pitch,
              octave,
              startTime: currentStep,
              duration
            });
            
            currentStep += duration;
          }
        }
      }
    }

    return result;
  }, []);

  // Load sheet music from file
  const loadSheetMusic = useCallback(async (filename: string) => {
    setLoadingSheet(true);
    try {
      const response = await fetch(`/sheets/${filename}`);
      if (!response.ok) throw new Error('Failed to load sheet music');
      
      const content = await response.text();
      const sheet = parseSheetMusic(content);
      
      // Filter notes to fit within our grid
      const filteredNotes = sheet.notes.filter(n => 
        n.startTime < TOTAL_STEPS && 
        OCTAVES.includes(n.octave)
      );
      
      setNotes(filteredNotes);
      setCurrentSheet(sheet.title);
      setSheetDropdownOpen(false);
    } catch (error) {
      console.error('Error loading sheet music:', error);
    } finally {
      setLoadingSheet(false);
    }
  }, [parseSheetMusic]);

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

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser for particle visualization
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      internalAnalyserRef.current = analyser;
      
      // Create gain node
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.3;
      gainNodeRef.current = gainNode;
      
      // Connect: gain -> analyser -> destination
      gainNode.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      
      // Share analyser with parent if ref is provided
      if (analyserRef) {
        analyserRef.current = analyser;
      }
    }
    return audioContextRef.current;
  }, [analyserRef]);

  const playTone = useCallback((frequency: number, duration: number, intensity: number = 1) => {
    const ctx = initAudioContext();
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    // Use a more musical waveform
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // ADSR envelope for more musical sound
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.6;
    const releaseTime = duration * 0.3;
    
    noteGain.gain.setValueAtTime(0, ctx.currentTime);
    noteGain.gain.linearRampToValueAtTime(intensity, ctx.currentTime + attackTime);
    noteGain.gain.linearRampToValueAtTime(sustainLevel * intensity, ctx.currentTime + attackTime + decayTime);
    noteGain.gain.linearRampToValueAtTime(sustainLevel * intensity, ctx.currentTime + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(noteGain);
    noteGain.connect(gainNodeRef.current || ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    
    // Notify parent about the beat for particle animation
    if (onBeat) {
      onBeat(intensity);
    }
  }, [initAudioContext, onBeat]);

  const getFrequency = (pitch: number, octave: number) => {
    const midi = (octave + 1) * 12 + pitch;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      let step = 0;
      interval = window.setInterval(() => {
        setCurrentStep(step);
        
        const notesToPlay = notes.filter(n => n.startTime === step);
        const intensity = Math.min(1, notesToPlay.length * 0.5 + 0.5);
        
        notesToPlay.forEach(n => {
          const freq = getFrequency(n.pitch, n.octave);
          playTone(freq, 0.4, intensity);
        });

        // Trigger beat callback even without notes for rhythm
        if (onBeat && notesToPlay.length > 0) {
          onBeat(intensity);
        }

        step++;
        if (step >= TOTAL_STEPS) {
          step = 0;
        }
      }, 150);
    } else {
      setCurrentStep(-1);
    }
    return () => clearInterval(interval);
  }, [isPlaying, notes, playTone, onBeat]);

  return (
    <div className={`bg-slate-900/80 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 shadow-2xl ${className}`}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-xl font-serif text-purple-300 flex items-center gap-2">
          <span className="text-2xl">♪</span> 魔法乐谱编辑器
          {currentSheet && (
            <span className="text-sm text-slate-400 font-normal">- {currentSheet}</span>
          )}
        </h3>
        <div className="flex gap-2 flex-wrap">
          {/* Sheet Music Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setSheetDropdownOpen(!sheetDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm border border-slate-600"
              title="加载乐谱"
            >
              <FileText size={16} />
              乐谱
              <ChevronDown size={14} className={`transition-transform ${sheetDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {sheetDropdownOpen && (
              <div className="absolute top-full mt-1 right-0 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 min-w-[200px]">
                {AVAILABLE_SHEETS.map((sheet) => (
                  <button
                    key={sheet.file}
                    onClick={() => loadSheetMusic(sheet.file)}
                    disabled={loadingSheet}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors disabled:opacity-50"
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
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
              : 'bg-purple-600 text-white hover:bg-purple-500'
            }`}
          >
            {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {isPlaying ? '停止' : '播放'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[800px]">
           {/* Grid Header */}
           <div className="flex ml-16 mb-2">
             {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
               <div key={i} className={`flex-1 text-[10px] text-center ${i % 4 === 0 ? 'text-slate-400 font-bold' : 'text-slate-700'}`}>
                 {i % 4 === 0 ? i / 4 + 1 : ''}
               </div>
             ))}
           </div>

          <div className="relative border border-slate-700 rounded bg-slate-950">
            {/* Playhead */}
            {currentStep >= 0 && (
              <div 
                className="absolute top-0 bottom-0 bg-amber-400/30 w-[calc(100%/32)] z-10 pointer-events-none transition-all duration-100"
                style={{ left: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            )}

            {OCTAVES.map((octave, oIdx) => (
              <React.Fragment key={octave}>
                {PITCHES.map((noteName, pIdx) => {
                  const isBlackKey = noteName.includes('#');
                  return (
                    <div key={`${octave}-${noteName}`} className="flex h-8 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      {/* Key Label */}
                      <div className={`w-16 flex-shrink-0 flex items-center justify-end pr-2 text-xs border-r border-slate-700 ${isBlackKey ? 'bg-slate-900 text-slate-500' : 'bg-slate-800 text-slate-300'}`}>
                        {noteName}{octave}
                      </div>
                      
                      {/* Cells */}
                      <div className="flex-1 flex relative">
                        {Array.from({ length: TOTAL_STEPS }).map((_, step) => {
                          const isActive = notes.some(n => 
                            n.octave === octave && 
                            n.pitch === (11 - pIdx) &&
                            n.startTime === step
                          );
                          const isCurrentlyPlaying = isActive && currentStep === step;
                          
                          return (
                            <div 
                              key={step} 
                              onClick={() => toggleNote(oIdx, pIdx, step)}
                              className={`flex-1 border-r border-slate-800/30 cursor-pointer transition-colors relative
                                ${step % 4 === 0 ? 'border-r-slate-700/50' : ''}
                              `}
                            >
                              {isActive && (
                                <div className={`absolute inset-0.5 rounded-sm transition-all duration-100
                                  ${isCurrentlyPlaying 
                                    ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-110' 
                                    : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]'
                                  }
                                `} />
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
      <p className="text-xs text-slate-500 mt-2 text-right">
        点击网格添加/移除音符 | 使用"乐谱"按钮加载预设曲目
      </p>
    </div>
  );
};

export default PianoEditor;
