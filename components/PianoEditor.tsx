import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Note } from '../types';
import { Play, Square, Trash2, Upload, FileText, Plus, Minus, Loader2 } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';

const MIN_STEPS = 32; // Minimum 2 bars of 16th notes
const PITCHES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const OCTAVES = [5, 4, 3]; // 3 Octaves range for more range
const KEY_LABEL_WIDTH = 64; // w-16 = 4rem = 64px
const CELL_WIDTH = 25; // Width of each cell in pixels
const DEFAULT_BPM = 120;

// Note name to pitch value mapping (for legacy format)
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5,
  'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

// ABC notation note to pitch mapping (based on ABC v2.1 standard)
// In ABC: C D E F G A B c d e f g a b
// Uppercase notes are in octave 4, lowercase in octave 5
// Apostrophes (') raise one octave, commas (,) lower one octave
const ABC_NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

// Key signature accidentals (sharps/flats applied automatically per ABC v2.1)
const KEY_SIGNATURES: Record<string, Record<string, number>> = {
  // Major keys
  'C': {},
  'G': { 'F': 1 },
  'D': { 'F': 1, 'C': 1 },
  'A': { 'F': 1, 'C': 1, 'G': 1 },
  'E': { 'F': 1, 'C': 1, 'G': 1, 'D': 1 },
  'B': { 'F': 1, 'C': 1, 'G': 1, 'D': 1, 'A': 1 },
  'F#': { 'F': 1, 'C': 1, 'G': 1, 'D': 1, 'A': 1, 'E': 1 },
  'C#': { 'F': 1, 'C': 1, 'G': 1, 'D': 1, 'A': 1, 'E': 1, 'B': 1 },
  'F': { 'B': -1 },
  'Bb': { 'B': -1, 'E': -1 },
  'Eb': { 'B': -1, 'E': -1, 'A': -1 },
  'Ab': { 'B': -1, 'E': -1, 'A': -1, 'D': -1 },
  'Db': { 'B': -1, 'E': -1, 'A': -1, 'D': -1, 'G': -1 },
  'Gb': { 'B': -1, 'E': -1, 'A': -1, 'D': -1, 'G': -1, 'C': -1 },
  'Cb': { 'B': -1, 'E': -1, 'A': -1, 'D': -1, 'G': -1, 'C': -1, 'F': -1 },
  // Minor keys (same accidentals as relative major)
  'Am': {},
  'Em': { 'F': 1 },
  'Bm': { 'F': 1, 'C': 1 },
  'F#m': { 'F': 1, 'C': 1, 'G': 1 },
  'C#m': { 'F': 1, 'C': 1, 'G': 1, 'D': 1 },
  'G#m': { 'F': 1, 'C': 1, 'G': 1, 'D': 1, 'A': 1 },
  'D#m': { 'F': 1, 'C': 1, 'G': 1, 'D': 1, 'A': 1, 'E': 1 },
  'A#m': { 'F': 1, 'C': 1, 'G': 1, 'D': 1, 'A': 1, 'E': 1, 'B': 1 },
  'Dm': { 'B': -1 },
  'Gm': { 'B': -1, 'E': -1 },
  'Cm': { 'B': -1, 'E': -1, 'A': -1 },
  'Fm': { 'B': -1, 'E': -1, 'A': -1, 'D': -1 },
  'Bbm': { 'B': -1, 'E': -1, 'A': -1, 'D': -1, 'G': -1 },
  'Ebm': { 'B': -1, 'E': -1, 'A': -1, 'D': -1, 'G': -1, 'C': -1 },
  'Abm': { 'B': -1, 'E': -1, 'A': -1, 'D': -1, 'G': -1, 'C': -1, 'F': -1 },
};

// Score metadata interface
interface ScoreMetadata {
  title?: string;
  bpm: number;
  timeSignature?: string;
  key?: string;
  defaultNoteLength?: string;
}

interface PianoEditorProps {
  className?: string;
}

const PianoEditor: React.FC<PianoEditorProps> = ({ className }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [availableScores, setAvailableScores] = useState<string[]>([]);
  const [selectedScore, setSelectedScore] = useState<string>('');
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [scoreMetadata, setScoreMetadata] = useState<ScoreMetadata>({ bpm: DEFAULT_BPM });
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scheduledNotesRef = useRef<Set<number>>(new Set());
  const playbackStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  
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

  // Detect if content is ABC notation (starts with X: or has ABC headers)
  const isABCNotation = (content: string): boolean => {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // ABC files typically start with X: (tune number) or have header fields like T:, M:, K:
      if (/^[XTMKLCQP]:/.test(trimmed)) return true;
      // Skip empty lines and comments
      if (trimmed && !trimmed.startsWith('%')) {
        // If first non-empty, non-comment line is not ABC header, it's likely not ABC
        break;
      }
    }
    return false;
  };

  // Parse ABC notation following ABC v2.1 standard (https://abcnotation.com/wiki/abc:standard:v2.1)
  const parseABCNotation = (content: string): { notes: Note[], metadata: ScoreMetadata } => {
    const rawLines = content.split('\n');
    const parsedNotes: Note[] = [];
    const metadata: ScoreMetadata = { bpm: DEFAULT_BPM, defaultNoteLength: '1/8' };
    
    let defaultNoteLength = 1/8; // L:1/8 default (eighth note = 2 in our 16th note system)
    let baseNoteDuration = 2; // Default duration in 16th notes for L:1/8
    let inBody = false;
    let keySignature: Record<string, number> = {}; // Current key signature accidentals
    
    // Voice/track management for multi-voice ABC
    const voicePositions: Map<string, number> = new Map();
    let currentVoice = 'default';
    voicePositions.set(currentVoice, 0);
    
    // Per-bar accidentals (reset at each bar line per ABC v2.1 standard)
    let barAccidentals: Map<string, number> = new Map();

    // Pre-process: join lines ending with backslash (line continuation per ABC v2.1)
    const lines: string[] = [];
    let pendingLine = '';
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trimEnd();
      if (trimmed.endsWith('\\')) {
        // Line continuation - append without the backslash
        pendingLine += trimmed.slice(0, -1);
      } else {
        lines.push(pendingLine + trimmed);
        pendingLine = '';
      }
    }
    if (pendingLine) {
      lines.push(pendingLine);
    }

    for (const line of lines) {
      let trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Skip ABC comments (% at start of line per v2.1) and %% directives
      if (trimmed.startsWith('%')) continue;
      
      // Parse ABC header fields (before K: field ends header)
      if (!inBody && /^[A-Za-z]:/.test(trimmed)) {
        const colonIdx = trimmed.indexOf(':');
        const field = trimmed.substring(0, colonIdx).trim();
        const value = trimmed.substring(colonIdx + 1).trim();
        
        switch (field.toUpperCase()) {
          case 'T': // Title
            metadata.title = value;
            break;
          case 'M': // Meter/Time signature
            metadata.timeSignature = value;
            break;
          case 'L': // Default note length (unit note length per v2.1)
            metadata.defaultNoteLength = value;
            // Parse fraction like 1/8, 1/4, 1/16
            const lengthMatch = value.match(/(\d+)\/(\d+)/);
            if (lengthMatch) {
              defaultNoteLength = parseInt(lengthMatch[1]) / parseInt(lengthMatch[2]);
              // Convert to 16th notes: 1/16=1, 1/8=2, 1/4=4, 1/2=8, 1=16
              baseNoteDuration = Math.round(defaultNoteLength * 16);
            }
            break;
          case 'Q': // Tempo
            // ABC v2.1 tempo format: Q:1/4=120 or Q:120 or Q:"allegro" 1/4=120
            const tempoMatch = value.match(/(\d+)\/(\d+)\s*=\s*(\d+)/);
            if (tempoMatch) {
              // e.g., Q:1/4=120 means 120 quarter notes per minute
              const tempoNoteLength = parseInt(tempoMatch[1]) / parseInt(tempoMatch[2]);
              const tempoBpm = parseInt(tempoMatch[3], 10);
              // Convert to BPM relative to quarter note
              metadata.bpm = Math.round(tempoBpm * tempoNoteLength * 4) || DEFAULT_BPM;
            } else {
              const simpleTempo = value.match(/(\d+)/);
              if (simpleTempo) {
                metadata.bpm = parseInt(simpleTempo[1], 10) || DEFAULT_BPM;
              }
            }
            break;
          case 'K': // Key signature (marks end of header, start of tune body per v2.1)
            metadata.key = value;
            // Parse key to get accidentals
            const keyMatch = value.match(/^([A-G][b#]?)(m|min|maj|major|minor|mix|dor|phr|lyd|loc)?/i);
            if (keyMatch) {
              let keyName = keyMatch[1];
              const mode = keyMatch[2]?.toLowerCase() || '';
              // Handle minor mode
              if (mode === 'm' || mode === 'min' || mode === 'minor') {
                keyName += 'm';
              }
              keySignature = KEY_SIGNATURES[keyName] || {};
            }
            inBody = true;
            break;
          case 'V': // Voice definition
            currentVoice = value.split(/\s+/)[0]; // First word is voice ID
            if (!voicePositions.has(currentVoice)) {
              voicePositions.set(currentVoice, 0);
            }
            break;
        }
        continue;
      }
      
      if (!inBody) continue;
      
      // Check for inline field [X:value] per ABC v2.1
      // Handle voice switch [V:name] and other inline fields
      let musicContent = trimmed;
      const inlineFieldRegex = /\[([A-Za-z]):([^\]]*)\]/g;
      let match;
      while ((match = inlineFieldRegex.exec(trimmed)) !== null) {
        const field = match[1].toUpperCase();
        const value = match[2];
        if (field === 'V') {
          currentVoice = value.split(/\s+/)[0];
          if (!voicePositions.has(currentVoice)) {
            voicePositions.set(currentVoice, 0);
          }
        } else if (field === 'K') {
          // Inline key change
          const keyMatch = value.match(/^([A-G][b#]?)(m|min|maj|major|minor)?/i);
          if (keyMatch) {
            let keyName = keyMatch[1];
            const mode = keyMatch[2]?.toLowerCase() || '';
            if (mode === 'm' || mode === 'min' || mode === 'minor') {
              keyName += 'm';
            }
            keySignature = KEY_SIGNATURES[keyName] || {};
          }
        }
      }
      // Remove inline fields from music content
      musicContent = musicContent.replace(/\[[A-Za-z]:[^\]]*\]/g, '');
      
      // Parse music body
      let currentTime = voicePositions.get(currentVoice) || 0;
      
      // Process the music line character by character
      let i = 0;
      while (i < musicContent.length) {
        const char = musicContent[i];
        
        // Skip whitespace
        if (/\s/.test(char)) {
          i++;
          continue;
        }
        
        // Bar line - reset bar accidentals per ABC v2.1
        if (char === '|' || char === ':') {
          barAccidentals.clear();
          i++;
          // Skip multi-character bar lines like |], |:, :|, etc.
          while (i < musicContent.length && /[\|\]:1-9\[]/.test(musicContent[i])) {
            i++;
          }
          continue;
        }
        
        // Skip decorations and grace notes per v2.1 (~, ., H, L, M, O, P, S, T, u, v, !)
        if ('~.HLMOPSTuv!+'.includes(char)) {
          if (char === '!' || char === '+') {
            // Skip to closing ! or +
            i++;
            while (i < musicContent.length && musicContent[i] !== char) i++;
          }
          i++;
          continue;
        }
        
        // Skip slurs, ties, and beaming
        if ('()-'.includes(char)) {
          // Check for tuplet notation (3 for triplet, etc.
          if (char === '(' && i + 1 < musicContent.length && /\d/.test(musicContent[i + 1])) {
            // Skip tuplet notation for now (3CDE)
            i++;
            while (i < musicContent.length && /\d/.test(musicContent[i])) i++;
            continue;
          }
          i++;
          continue;
        }
        
        // Handle chord symbols enclosed in quotes (skip them)
        if (char === '"') {
          i++;
          while (i < musicContent.length && musicContent[i] !== '"') i++;
          i++;
          continue;
        }
        
        // Handle guitar chords and annotations in quotes
        if (char === '"') {
          i++;
          while (i < musicContent.length && musicContent[i] !== '"') i++;
          i++;
          continue;
        }
        
        // Handle chords [CEG] per ABC v2.1
        if (char === '[') {
          // Check if this is an inline field [X:...] - look for single letter followed by colon
          const closeBracket = musicContent.indexOf(']', i);
          const colonPos = musicContent.indexOf(':', i);
          const isInlineField = colonPos > i && colonPos < closeBracket && 
                               (colonPos - i) <= 2 && // Single letter before colon
                               /^[A-Za-z]$/.test(musicContent[i + 1]);
          
          if (!isInlineField && closeBracket > i) {
            const chordContent = musicContent.substring(i + 1, closeBracket);
            const { chordNotes, maxDuration } = parseABCChordV2(chordContent, baseNoteDuration, currentTime, keySignature, barAccidentals);
            parsedNotes.push(...chordNotes);
            
            // Check for duration after chord
            let durationStr = '';
            let j = closeBracket + 1;
            while (j < musicContent.length && (/\d|\/|>|</.test(musicContent[j]))) {
              durationStr += musicContent[j];
              j++;
            }
            
            let duration = parseABCDurationV2(durationStr, baseNoteDuration);
            if (durationStr === '') duration = maxDuration || baseNoteDuration;
            
            // Update all chord notes with the proper duration
            chordNotes.forEach(n => n.duration = duration);
            currentTime += duration;
            i = j;
            continue;
          }
          i++;
          continue;
        }
        
        // Rest (z or Z per ABC v2.1)
        if (char === 'z' || char === 'Z' || char === 'x' || char === 'X') {
          let durationStr = '';
          i++;
          while (i < musicContent.length && (/\d|\//.test(musicContent[i]))) {
            durationStr += musicContent[i];
            i++;
          }
          const duration = char === 'Z' ? baseNoteDuration * 4 : parseABCDurationV2(durationStr, baseNoteDuration);
          currentTime += duration;
          continue;
        }
        
        // Accidentals before note per ABC v2.1 standard: ^=sharp, ^^=double sharp, _=flat, __=double flat, ==natural
        let accidental = 0;
        let hasExplicitAccidental = false;
        while (i < musicContent.length && (musicContent[i] === '^' || musicContent[i] === '_' || musicContent[i] === '=')) {
          hasExplicitAccidental = true;
          if (musicContent[i] === '^') accidental++;
          else if (musicContent[i] === '_') accidental--;
          else if (musicContent[i] === '=') accidental = 0; // Natural cancels key signature
          i++;
        }
        
        // Note (A-G or a-g)
        if (i < musicContent.length && /[A-Ga-g]/.test(musicContent[i])) {
          const noteResult = parseABCSingleNote(
            musicContent, i, baseNoteDuration, currentTime, 
            keySignature, barAccidentals, accidental, hasExplicitAccidental
          );
          if (noteResult.note) {
            parsedNotes.push(noteResult.note);
            currentTime += noteResult.note.duration;
          }
          i = noteResult.nextIndex;
          continue;
        }
        
        i++;
      }
      
      voicePositions.set(currentVoice, currentTime);
    }

    return { notes: parsedNotes, metadata };
  };

  // Parse a single ABC note starting at position i (after any accidentals have been parsed)
  const parseABCSingleNote = (
    line: string, 
    startIdx: number, 
    baseNoteDuration: number, 
    startTime: number,
    keySignature: Record<string, number>,
    barAccidentals: Map<string, number>,
    accidental: number,
    hasExplicitAccidental: boolean
  ): { note: Note | null; nextIndex: number } => {
    let i = startIdx;
    
    // Get note letter
    const noteChar = line[i];
    if (!/[A-Ga-g]/.test(noteChar)) {
      return { note: null, nextIndex: i + 1 };
    }
    
    // Determine base octave from case per ABC v2.1
    // Uppercase (C D E F G A B) = octave 4 (middle octave)
    // Lowercase (c d e f g a b) = octave 5 (one octave higher)
    let octave = noteChar === noteChar.toUpperCase() ? 4 : 5;
    const baseNote = noteChar.toUpperCase();
    i++;
    
    // Check for octave modifiers per ABC v2.1
    // ' (apostrophe) raises pitch by one octave
    // , (comma) lowers pitch by one octave
    while (i < line.length && (line[i] === "'" || line[i] === ',')) {
      if (line[i] === "'") octave++;
      else if (line[i] === ',') octave--;
      i++;
    }
    
    // Get base pitch from note name
    let pitch = ABC_NOTE_TO_SEMITONE[baseNote];
    if (pitch === undefined) {
      return { note: null, nextIndex: i };
    }
    
    // Apply accidental per ABC v2.1 rules
    if (hasExplicitAccidental) {
      // Explicit accidental - use it and remember for rest of bar
      pitch = (pitch + accidental + 12) % 12;
      barAccidentals.set(baseNote + octave, accidental);
    } else {
      // Check bar accidentals first (applies to specific note+octave per v2.1)
      const barAcc = barAccidentals.get(baseNote + octave);
      if (barAcc !== undefined) {
        pitch = (pitch + barAcc + 12) % 12;
      } else {
        // Apply key signature accidental (applies to all octaves)
        const keyAcc = keySignature[baseNote];
        if (keyAcc !== undefined) {
          pitch = (pitch + keyAcc + 12) % 12;
        }
      }
    }
    
    // Clamp octave to supported range
    octave = Math.max(3, Math.min(5, octave));
    
    // Parse duration multiplier per ABC v2.1
    let durationStr = '';
    while (i < line.length && (/\d|\/|>|</.test(line[i]))) {
      durationStr += line[i];
      i++;
    }
    
    const duration = parseABCDurationV2(durationStr, baseNoteDuration);
    
    return {
      note: {
        pitch,
        octave,
        startTime,
        duration
      },
      nextIndex: i
    };
  };

  // Parse ABC chord content (without brackets) per ABC v2.1
  const parseABCChordV2 = (
    content: string, 
    baseNoteDuration: number, 
    startTime: number,
    keySignature: Record<string, number>,
    barAccidentals: Map<string, number>
  ): { chordNotes: Note[], maxDuration: number } => {
    const chordNotes: Note[] = [];
    let maxDuration = baseNoteDuration;
    let i = 0;
    
    while (i < content.length) {
      const char = content[i];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      // Handle accidental prefix per ABC v2.1
      let accidental = 0;
      let hasExplicitAccidental = false;
      while (i < content.length && (content[i] === '^' || content[i] === '_' || content[i] === '=')) {
        hasExplicitAccidental = true;
        if (content[i] === '^') accidental++;
        else if (content[i] === '_') accidental--;
        else if (content[i] === '=') accidental = 0;
        i++;
      }
      
      if (i >= content.length) break;
      
      const noteChar = content[i];
      if (!/[A-Ga-g]/.test(noteChar)) {
        i++;
        continue;
      }
      
      let octave = noteChar === noteChar.toUpperCase() ? 4 : 5;
      const baseNote = noteChar.toUpperCase();
      let pitch = ABC_NOTE_TO_SEMITONE[baseNote];
      
      if (pitch !== undefined) {
        i++;
        
        // Check for octave modifiers
        while (i < content.length && (content[i] === "'" || content[i] === ',')) {
          if (content[i] === "'") octave++;
          else if (content[i] === ',') octave--;
          i++;
        }
        
        // Apply accidentals
        if (hasExplicitAccidental) {
          pitch = (pitch + accidental + 12) % 12;
          barAccidentals.set(baseNote + octave, accidental);
        } else {
          const barAcc = barAccidentals.get(baseNote + octave);
          if (barAcc !== undefined) {
            pitch = (pitch + barAcc + 12) % 12;
          } else {
            const keyAcc = keySignature[baseNote];
            if (keyAcc !== undefined) {
              pitch = (pitch + keyAcc + 12) % 12;
            }
          }
        }
        
        octave = Math.max(3, Math.min(5, octave));
        
        // Parse individual note duration within chord
        let noteDurationStr = '';
        while (i < content.length && /\d|\//.test(content[i])) {
          noteDurationStr += content[i];
          i++;
        }
        const noteDuration = noteDurationStr ? parseABCDurationV2(noteDurationStr, baseNoteDuration) : baseNoteDuration;
        maxDuration = Math.max(maxDuration, noteDuration);
        
        chordNotes.push({
          pitch,
          octave,
          startTime,
          duration: noteDuration
        });
      } else {
        i++;
      }
    }
    
    return { chordNotes, maxDuration };
  };

  // Parse ABC duration string per ABC v2.1 standard
  // Handles: 2 (double), /2 (half), 3/2 (1.5x), / (half), // (quarter), > (dotted, following note halved), < (reverse)
  const parseABCDurationV2 = (durationStr: string, baseNoteDuration: number): number => {
    if (!durationStr) return baseNoteDuration;
    
    // Remove broken rhythm markers for now (>, <)
    const cleanStr = durationStr.replace(/[><]/g, '');
    if (!cleanStr) return baseNoteDuration;
    
    // Handle / alone = /2, // = /4, etc.
    if (/^\/+$/.test(cleanStr)) {
      const slashCount = cleanStr.length;
      return Math.max(1, Math.round(baseNoteDuration / Math.pow(2, slashCount)));
    }
    
    // Handle fractions like /2, /4, 3/2
    if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      const numerator = parts[0] ? parseInt(parts[0], 10) : 1;
      const denominator = parts[1] ? parseInt(parts[1], 10) : 2;
      return Math.max(1, Math.round(baseNoteDuration * numerator / denominator));
    }
    
    // Simple multiplier like 2, 4
    const multiplier = parseInt(cleanStr, 10);
    if (!isNaN(multiplier) && multiplier > 0) {
      return baseNoteDuration * multiplier;
    }
    
    return baseNoteDuration;
  };

  const parseScoreFile = (content: string): { notes: Note[], metadata: ScoreMetadata } => {
    // Check if this is ABC notation
    if (isABCNotation(content)) {
      return parseABCNotation(content);
    }
    
    // Legacy format parsing
    const lines = content.split('\n');
    const parsedNotes: Note[] = [];
    const metadata: ScoreMetadata = { bpm: DEFAULT_BPM };
    
    // Track management for multi-track support
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
          const startPos = trackMatch[2] ? parseInt(trackMatch[2], 10) : 0;
          trackPositions.set(currentTrack, startPos);
        } else if (trackMatch[2]) {
          trackPositions.set(currentTrack, parseInt(trackMatch[2], 10));
        }
        continue;
      }
      
      // Sync command: @position
      const syncMatch = trimmed.match(/^@(\d+)$/);
      if (syncMatch) {
        trackPositions.set(currentTrack, parseInt(syncMatch[1], 10));
        continue;
      }
      
      const currentTime = trackPositions.get(currentTrack) || 0;

      // Check if this is a chord (multiple notes joined by +)
      if (trimmed.includes('+')) {
        const chordParts = trimmed.split('+').map(p => p.trim());
        const chordNotes: { noteName: string; octave: number }[] = [];
        let chordDuration = 4;

        for (let i = 0; i < chordParts.length; i++) {
          const parts = chordParts[i].split(/\s+/);
          if (parts.length >= 2) {
            const noteName = parts[0].toUpperCase();
            const octave = parseInt(parts[1], 10);
            const pitch = NOTE_TO_PITCH[noteName];
            
            if (pitch !== undefined && !isNaN(octave)) {
              chordNotes.push({ noteName, octave });
              if (parts.length >= 3) {
                chordDuration = parseInt(parts[2], 10) || 4;
              }
            }
          }
        }

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
      // Reset playback state when loading new score
      setIsPlaying(false);
      setCurrentStep(-1);
      setIsLoading(true);
      
      const response = await fetch(`${MEDIA_CONFIG.scores.folder}/${scoreName}`);
      if (!response.ok) {
        console.error('Failed to load score:', scoreName);
        setIsLoading(false);
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
      setIsLoading(false);
    } catch (e) {
      console.error('Error loading score:', e);
      setIsLoading(false);
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

  // Piano-like sound using multiple oscillators with ADSR envelope
  // Supports scheduled time for precise Web Audio API timing
  const playTone = useCallback((frequency: number, duration: number, scheduledTime?: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = scheduledTime ?? ctx.currentTime;
    
    // Create main oscillator (fundamental)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    
    // Create gains for each oscillator
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const masterGain = ctx.createGain();
    
    // Piano-like waveform (fundamental + harmonics)
    osc1.type = 'triangle'; // Fundamental
    osc1.frequency.setValueAtTime(frequency, now);
    
    osc2.type = 'sine'; // 2nd harmonic (octave)
    osc2.frequency.setValueAtTime(frequency * 2, now);
    
    osc3.type = 'sine'; // 3rd harmonic (fifth)
    osc3.frequency.setValueAtTime(frequency * 3, now);
    
    // Mix harmonics (piano timbre)
    gain1.gain.setValueAtTime(0.5, now);
    gain2.gain.setValueAtTime(0.2, now);
    gain3.gain.setValueAtTime(0.05, now);
    
    // ADSR envelope for piano-like attack and decay
    const attackTime = 0.01;
    const decayTime = 0.1;
    const sustainLevel = 0.3;
    const releaseTime = Math.min(duration * 0.7, 0.5);
    
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.4, now + attackTime); // Attack
    masterGain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime); // Decay to sustain
    masterGain.gain.setValueAtTime(sustainLevel, now + duration - releaseTime); // Hold
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
    
    // Connect
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
    osc3.stop(now + duration + 0.1);
  }, []);

  const getFrequency = (pitch: number, octave: number) => {
    // A4 = 440Hz. A4 is octave 4, pitch 9 (A).
    // Midi Note Number: (Octave + 1) * 12 + Pitch
    const midi = (octave + 1) * 12 + pitch;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  // Pre-schedule notes using Web Audio API's precise timing
  // This prevents stuttering on large scores by scheduling notes ahead of time
  const scheduleNotesAhead = useCallback((startStep: number, currentAudioTime: number, stepDurationSec: number) => {
    const LOOK_AHEAD_STEPS = 16; // Schedule 16 steps ahead (1 bar)
    const ctx = audioContextRef.current;
    if (!ctx) return;

    for (let i = 0; i < LOOK_AHEAD_STEPS; i++) {
      const step = startStep + i;
      if (step > lastNoteEndTime) break;
      
      // Skip already scheduled notes
      if (scheduledNotesRef.current.has(step)) continue;
      scheduledNotesRef.current.add(step);
      
      const stepTime = currentAudioTime + (i * stepDurationSec);
      const notesToPlay = notes.filter(n => n.startTime === step);
      
      notesToPlay.forEach(n => {
        const freq = getFrequency(n.pitch, n.octave);
        const durationSec = (n.duration * stepDurationSec);
        playTone(freq, Math.min(durationSec, 0.8), stepTime);
      });
    }
  }, [notes, lastNoteEndTime, playTone]);

  useEffect(() => {
    if (isPlaying) {
      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Resume context if suspended
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const stepDurationSec = stepInterval / 1000;
      const startStep = currentStep >= 0 ? currentStep : 0;
      playbackStartTimeRef.current = ctx.currentTime;
      scheduledNotesRef.current.clear();
      
      // Initial scheduling
      scheduleNotesAhead(startStep, ctx.currentTime, stepDurationSec);
      
      // Use requestAnimationFrame for smooth visual updates and continuous scheduling
      let lastScheduledStep = startStep;
      
      const updatePlayback = () => {
        if (!audioContextRef.current) return;
        
        const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
        const currentPlayStep = startStep + Math.floor(elapsed / stepDurationSec);
        
        // Update visual step
        setCurrentStep(currentPlayStep);
        
        // Schedule more notes ahead as we progress
        if (currentPlayStep > lastScheduledStep) {
          scheduleNotesAhead(currentPlayStep, audioContextRef.current.currentTime, stepDurationSec);
          lastScheduledStep = currentPlayStep;
        }
        
        // Auto-scroll to follow playhead
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const playheadPosition = currentPlayStep * CELL_WIDTH;
          const containerWidth = container.clientWidth;
          const scrollLeft = container.scrollLeft;
          
          if (playheadPosition > scrollLeft + containerWidth - CELL_WIDTH * 4) {
            container.scrollTo({
              left: playheadPosition - containerWidth / 2,
              behavior: 'smooth'
            });
          } else if (playheadPosition < scrollLeft) {
            container.scrollTo({
              left: Math.max(0, playheadPosition - CELL_WIDTH * 4),
              behavior: 'smooth'
            });
          }
        }
        
        // Stop playback after the last note ends
        if (currentPlayStep > lastNoteEndTime) {
          setIsPlaying(false);
          setCurrentStep(-1);
          scheduledNotesRef.current.clear();
          return;
        }
        
        animationFrameRef.current = requestAnimationFrame(updatePlayback);
      };
      
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // Cleanup when stopped
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      scheduledNotesRef.current.clear();
    }
  }, [isPlaying, notes, lastNoteEndTime, stepInterval, scheduleNotesAhead]);

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
            {/* Grid Header - clickable ruler for positioning */}
            <div className="flex h-6 border-b" style={{ borderColor: 'var(--bg-tertiary, #334155)' }}>
              {Array.from({ length: totalSteps }).map((_, i) => {
                const isCurrentStep = currentStep === i;
                const isBeatStart = i % 4 === 0;
                return (
                  <div 
                    key={i} 
                    onClick={() => setCurrentStep(i)}
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
                      {/* Note cells */}
                      <div className="flex-1 flex relative">
                        {/* Playhead - thin vertical line at the left edge of current step */}
                        {currentStep >= 0 && (
                          <div 
                            className="absolute top-0 bottom-0 z-10 pointer-events-none"
                            style={{ 
                              width: '2px',
                              left: `${currentStep * CELL_WIDTH}px`,
                              backgroundColor: 'rgba(251, 191, 36, 0.9)',
                              boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)'
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
