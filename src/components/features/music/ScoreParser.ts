/**
 * Score Parser Module
 * Parses ABC notation and legacy score formats into playable note data
 */

import { Note } from '../../../types';

const DEFAULT_BPM = 120;

// Note name to pitch value mapping (for legacy format)
const NOTE_TO_PITCH: Record<string, number> = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5,
  'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

// ABC notation note to pitch mapping (based on ABC v2.1 standard)
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
export interface ScoreMetadata {
  title?: string;
  bpm: number;
  timeSignature?: string;
  key?: string;
  defaultNoteLength?: string;
  voices?: string[]; // List of voice/track names
}

// Scheduled note for playback - contains timing and frequency info
export interface ScheduledNote {
  frequency: number;
  startTime: number; // in steps
  duration: number;  // in steps
  pitch: number;
  octave: number;
  voice?: string; // Track/voice identifier
}

// Note duration types for professional editing
export type NoteDurationType = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirtysecond';

// Note duration in steps (based on 16th note = 1 step)
export const NOTE_DURATION_STEPS: Record<NoteDurationType, number> = {
  'whole': 16,      // 全音符
  'half': 8,        // 二分音符
  'quarter': 4,     // 四分音符
  'eighth': 2,      // 八分音符
  'sixteenth': 1,   // 十六分音符
  'thirtysecond': 0.5 // 三十二分音符
};

// Parsed score result
export interface ParsedScore {
  notes: Note[];
  metadata: ScoreMetadata;
  // Pre-computed playback schedule sorted by start time
  playbackSchedule: ScheduledNote[];
  // Notes indexed by step for O(1) lookup
  notesByStep: Map<number, ScheduledNote[]>;
  // Notes indexed by voice
  notesByVoice: Map<string, Note[]>;
  // Total duration in steps
  totalSteps: number;
}

// Convert pitch and octave to frequency
export const getFrequency = (pitch: number, octave: number): number => {
  const midi = (octave + 1) * 12 + pitch;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// Detect if content is ABC notation
export const isABCNotation = (content: string): boolean => {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[XTMKLCQP]:/.test(trimmed)) return true;
    if (trimmed && !trimmed.startsWith('%')) {
      break;
    }
  }
  return false;
};

// Parse ABC duration string per ABC v2.1 standard
// Supports: numbers (A2), fractions (A/2, A3/4), dots (A., A..), slashes (A/, A//)
const parseABCDurationV2 = (durationStr: string, baseNoteDuration: number): number => {
  if (!durationStr) return baseNoteDuration;
  
  const cleanStr = durationStr.replace(/[><]/g, '');
  if (!cleanStr) return baseNoteDuration;
  
  // Count dots at the end for dotted notes
  let dotCount = 0;
  let mainDuration = cleanStr;
  while (mainDuration.endsWith('.')) {
    dotCount++;
    mainDuration = mainDuration.slice(0, -1);
  }
  
  // Parse the main duration part (without dots)
  let baseDuration = baseNoteDuration;
  
  if (/^\/+$/.test(mainDuration)) {
    // Only slashes: A/, A//, etc.
    const slashCount = mainDuration.length;
    baseDuration = Math.max(1, Math.round(baseNoteDuration / Math.pow(2, slashCount)));
  } else if (mainDuration.includes('/')) {
    // Fraction: A/2, A3/4, etc.
    const parts = mainDuration.split('/');
    const numerator = parts[0] ? parseInt(parts[0], 10) : 1;
    const denominator = parts[1] ? parseInt(parts[1], 10) : 2;
    baseDuration = Math.max(1, Math.round(baseNoteDuration * numerator / denominator));
  } else if (mainDuration) {
    // Plain number: A2, A3, etc.
    const multiplier = parseInt(mainDuration, 10);
    if (!isNaN(multiplier) && multiplier > 0) {
      baseDuration = baseNoteDuration * multiplier;
    }
  }
  
  // Apply dots: each dot adds half of the previous value
  // Single dot: 1.5x (adds 0.5x), Double dot: 1.75x (adds 0.5x + 0.25x)
  let finalDuration = baseDuration;
  let addedValue = baseDuration;
  for (let i = 0; i < dotCount; i++) {
    addedValue = addedValue / 2;
    finalDuration += addedValue;
  }
  
  return Math.max(1, Math.round(finalDuration));
};

// Parse a single ABC note
const parseABCSingleNote = (
  line: string, 
  startIdx: number, 
  baseNoteDuration: number, 
  startTime: number,
  keySignature: Record<string, number>,
  barAccidentals: Map<string, number>,
  accidental: number,
  hasExplicitAccidental: boolean
): { note: Note | null; nextIndex: number; hasTie: boolean } => {
  let i = startIdx;
  
  const noteChar = line[i];
  if (!/[A-Ga-g]/.test(noteChar)) {
    return { note: null, nextIndex: i + 1 };
  }
  
  let octave = noteChar === noteChar.toUpperCase() ? 4 : 5;
  const baseNote = noteChar.toUpperCase();
  i++;
  
  while (i < line.length && (line[i] === "'" || line[i] === ',')) {
    if (line[i] === "'") octave++;
    else if (line[i] === ',') octave--;
    i++;
  }
  
  let pitch = ABC_NOTE_TO_SEMITONE[baseNote];
  if (pitch === undefined) {
    return { note: null, nextIndex: i };
  }
  
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
  
  // Support full 88-key piano range: A0 (MIDI 21) to C8 (MIDI 108)
  octave = Math.max(0, Math.min(8, octave));
  
  let durationStr = '';
  while (i < line.length && (/\d|\/|>|<|\./.test(line[i]))) {
    durationStr += line[i];
    i++;
  }
  
  // Check for tie marker after duration
  let hasTie = false;
  if (i < line.length && line[i] === '-') {
    hasTie = true;
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
    nextIndex: i,
    hasTie
  };
};

// Parse ABC chord content
// Returns notes with optional tie markers (stored temporarily in a custom property)
const parseABCChordV2 = (
  content: string, 
  baseNoteDuration: number, 
  startTime: number,
  keySignature: Record<string, number>,
  barAccidentals: Map<string, number>
): { chordNotes: (Note & { _hasTie?: boolean })[], maxDuration: number } => {
  const chordNotes: Note[] = [];
  let maxDuration = baseNoteDuration;
  let i = 0;
  
  while (i < content.length) {
    const char = content[i];
    
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
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
      
      while (i < content.length && (content[i] === "'" || content[i] === ',')) {
        if (content[i] === "'") octave++;
        else if (content[i] === ',') octave--;
        i++;
      }
      
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
      
      // Support full 88-key piano range: A0 (MIDI 21) to C8 (MIDI 108)
      octave = Math.max(0, Math.min(8, octave));
      
      let noteDurationStr = '';
      while (i < content.length && /\d|\/|\./.test(content[i])) {
        noteDurationStr += content[i];
        i++;
      }
      
      // Check for tie marker on this note within the chord
      let hasTie = false;
      if (i < content.length && content[i] === '-') {
        hasTie = true;
        i++;
      }
      
      const noteDuration = noteDurationStr ? parseABCDurationV2(noteDurationStr, baseNoteDuration) : baseNoteDuration;
      maxDuration = Math.max(maxDuration, noteDuration);
      
      const note: Note & { _hasTie?: boolean } = {
        pitch,
        octave,
        startTime,
        duration: noteDuration
      };
      if (hasTie) {
        note._hasTie = true;
      }
      chordNotes.push(note);
    } else {
      i++;
    }
  }
  
  return { chordNotes, maxDuration };
};

// Parse ABC notation
const parseABCNotation = (content: string): { notes: Note[], metadata: ScoreMetadata } => {
  const rawLines = content.split('\n');
  const parsedNotes: Note[] = [];
  const metadata: ScoreMetadata = { bpm: DEFAULT_BPM, defaultNoteLength: '1/8', voices: [] };
  
  let defaultNoteLength = 1/8;
  let baseNoteDuration = 2;
  let inBody = false;
  let keySignature: Record<string, number> = {};
  
  const voicePositions: Map<string, number> = new Map();
  const voiceSet: Set<string> = new Set();
  let currentVoice = 'V1';
  voicePositions.set(currentVoice, 0);
  voiceSet.add(currentVoice);
  
  let barAccidentals: Map<string, number> = new Map();

  // Pre-process: join lines ending with backslash
  const lines: string[] = [];
  let pendingLine = '';
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trimEnd();
    if (trimmed.endsWith('\\')) {
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
    
    if (!trimmed) continue;
    if (trimmed.startsWith('%')) continue;
    
    if (!inBody && /^[A-Za-z]:/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(':');
      const field = trimmed.substring(0, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();
      
      switch (field.toUpperCase()) {
        case 'T':
          metadata.title = value;
          break;
        case 'M':
          metadata.timeSignature = value;
          break;
        case 'L':
          metadata.defaultNoteLength = value;
          const lengthMatch = value.match(/(\d+)\/(\d+)/);
          if (lengthMatch) {
            defaultNoteLength = parseInt(lengthMatch[1]) / parseInt(lengthMatch[2]);
            baseNoteDuration = Math.round(defaultNoteLength * 16);
          }
          break;
        case 'Q':
          const tempoMatch = value.match(/(\d+)\/(\d+)\s*=\s*(\d+)/);
          if (tempoMatch) {
            const tempoNoteLength = parseInt(tempoMatch[1]) / parseInt(tempoMatch[2]);
            const tempoBpm = parseInt(tempoMatch[3], 10);
            metadata.bpm = Math.round(tempoBpm * tempoNoteLength * 4) || DEFAULT_BPM;
          } else {
            const simpleTempo = value.match(/(\d+)/);
            if (simpleTempo) {
              metadata.bpm = parseInt(simpleTempo[1], 10) || DEFAULT_BPM;
            }
          }
          break;
        case 'K':
          metadata.key = value;
          const keyMatch = value.match(/^([A-G][b#]?)(m|min|maj|major|minor|mix|dor|phr|lyd|loc)?/i);
          if (keyMatch) {
            let keyName = keyMatch[1];
            const mode = keyMatch[2]?.toLowerCase() || '';
            if (mode === 'm' || mode === 'min' || mode === 'minor') {
              keyName += 'm';
            }
            keySignature = KEY_SIGNATURES[keyName] || {};
          }
          inBody = true;
          break;
        case 'V':
          currentVoice = value.split(/\s+/)[0] || 'V1';
          if (!voicePositions.has(currentVoice)) {
            voicePositions.set(currentVoice, 0);
          }
          voiceSet.add(currentVoice);
          break;
      }
      continue;
    }
    
    if (!inBody) continue;
    
    let musicContent = trimmed;
    const inlineFieldRegex = /\[([A-Za-z]):([^\]]*)\]/g;
    let match;
    while ((match = inlineFieldRegex.exec(trimmed)) !== null) {
      const field = match[1].toUpperCase();
      const value = match[2];
      if (field === 'V') {
        currentVoice = value.split(/\s+/)[0] || 'V1';
        if (!voicePositions.has(currentVoice)) {
          voicePositions.set(currentVoice, 0);
        }
        voiceSet.add(currentVoice);
      } else if (field === 'K') {
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
    musicContent = musicContent.replace(/\[[A-Za-z]:[^\]]*\]/g, '');
    
    let currentTime = voicePositions.get(currentVoice) || 0;
    
    let i = 0;
    while (i < musicContent.length) {
      const char = musicContent[i];
      
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      if (char === '|' || char === ':') {
        barAccidentals.clear();
        i++;
        while (i < musicContent.length && /[\|\]:1-9\[]/.test(musicContent[i])) {
          i++;
        }
        continue;
      }
      
      if ('~.HLMOPSTuv!+'.includes(char)) {
        if (char === '!' || char === '+') {
          i++;
          while (i < musicContent.length && musicContent[i] !== char) i++;
        }
        i++;
        continue;
      }
      
      // Tuplets: (3ABC means 3 notes in 2 beats, (5ABCDE means 5 notes in 4 beats
      if (char === '(' && i + 1 < musicContent.length && /\d/.test(musicContent[i + 1])) {
        i++;
        let tupletNum = 0;
        while (i < musicContent.length && /\d/.test(musicContent[i])) {
          tupletNum = tupletNum * 10 + parseInt(musicContent[i], 10);
          i++;
        }
        
        // Skip optional colon and ratio (e.g., (3:2:4)
        if (i < musicContent.length && musicContent[i] === ':') {
          i++;
          while (i < musicContent.length && /\d:/.test(musicContent[i])) i++;
        }
        
        // Calculate tuplet duration scaling factor
        // Standard tuplet rules: (3 = 3 notes in time of 2, (5 = 5 notes in time of 4
        let tupletIntoTime = 2;
        if (tupletNum === 2 || tupletNum === 3) tupletIntoTime = 2;
        else if (tupletNum === 4 || tupletNum === 5 || tupletNum === 6 || tupletNum === 7) tupletIntoTime = 4;
        else if (tupletNum === 8 || tupletNum === 9) tupletIntoTime = 8;
        else tupletIntoTime = Math.floor(tupletNum * 2 / 3);
        
        const tupletFactor = tupletIntoTime / tupletNum;
        
        // Parse notes within tuplet
        const tupletStartTime = currentTime;
        let notesInTuplet = 0;
        const tupletNotes: Note[] = [];
        
        while (i < musicContent.length && notesInTuplet < tupletNum) {
          const tupletChar = musicContent[i];
          
          if (/\s/.test(tupletChar)) {
            i++;
            continue;
          }
          
          // Skip ornaments
          if ('~.HLMOPSTuv!+'.includes(tupletChar)) {
            i++;
            continue;
          }
          
          // Parse note
          let accidental = 0;
          let hasExplicitAccidental = false;
          while (i < musicContent.length && (musicContent[i] === '^' || musicContent[i] === '_' || musicContent[i] === '=')) {
            hasExplicitAccidental = true;
            if (musicContent[i] === '^') accidental++;
            else if (musicContent[i] === '_') accidental--;
            else if (musicContent[i] === '=') accidental = 0;
            i++;
          }
          
          if (i < musicContent.length && /[A-Ga-g]/.test(musicContent[i])) {
            const noteResult = parseABCSingleNote(
              musicContent, i, baseNoteDuration, currentTime,
              keySignature, barAccidentals, accidental, hasExplicitAccidental
            );
            
            if (noteResult.note) {
              // Apply tuplet scaling to duration
              noteResult.note.duration = Math.max(1, Math.round(noteResult.note.duration * tupletFactor));
              noteResult.note.voice = currentVoice;
              
              if (noteResult.hasTie) {
                (noteResult.note as any)._hasTie = true;
              }
              
              tupletNotes.push(noteResult.note);
              currentTime += noteResult.note.duration;
              notesInTuplet++;
            }
            i = noteResult.nextIndex;
          } else {
            break;
          }
        }
        
        parsedNotes.push(...tupletNotes);
        continue;
      }
      
      // Slurs and other parentheses (for legato markings, not tuplets)
      if ('()-'.includes(char)) {
        i++;
        continue;
      }
      
      if (char === '"') {
        i++;
        while (i < musicContent.length && musicContent[i] !== '"') i++;
        i++;
        continue;
      }
      
      // Grace notes: {g}A or {ab}C etc.
      if (char === '{') {
        const closeBrace = musicContent.indexOf('}', i);
        if (closeBrace > i) {
          const graceContent = musicContent.substring(i + 1, closeBrace);
          const graceNoteDuration = 0.5; // Very short duration for grace notes
          
          // Parse each grace note character
          for (let g = 0; g < graceContent.length; g++) {
            const graceChar = graceContent[g];
            if (/[A-Ga-g]/.test(graceChar)) {
              let graceOctave = graceChar === graceChar.toUpperCase() ? 4 : 5;
              const graceBaseNote = graceChar.toUpperCase();
              let gracePitch = ABC_NOTE_TO_SEMITONE[graceBaseNote];
              
              if (gracePitch !== undefined) {
                // Apply key signature to grace note
                const keyAcc = keySignature[graceBaseNote];
                if (keyAcc !== undefined) {
                  gracePitch = (gracePitch + keyAcc + 12) % 12;
                }
                
                graceOctave = Math.max(0, Math.min(8, graceOctave));
                
                parsedNotes.push({
                  pitch: gracePitch,
                  octave: graceOctave,
                  startTime: currentTime,
                  duration: graceNoteDuration,
                  voice: currentVoice
                });
                
                currentTime += graceNoteDuration;
              }
            }
          }
          
          i = closeBrace + 1;
          continue;
        }
      }
      
      if (char === '[') {
        const closeBracket = musicContent.indexOf(']', i);
        const colonPos = musicContent.indexOf(':', i);
        const isInlineField = colonPos > i && colonPos < closeBracket && 
                             (colonPos - i) <= 2 && 
                             /^[A-Za-z]$/.test(musicContent[i + 1]);
        
        if (!isInlineField && closeBracket > i) {
          const chordContent = musicContent.substring(i + 1, closeBracket);
          const { chordNotes, maxDuration } = parseABCChordV2(chordContent, baseNoteDuration, currentTime, keySignature, barAccidentals);
          
          // Add voice to chord notes
          chordNotes.forEach(n => n.voice = currentVoice);
          parsedNotes.push(...chordNotes);
          
          let durationStr = '';
          let j = closeBracket + 1;
          while (j < musicContent.length && (/\d|\/|>|<|\./.test(musicContent[j]))) {
            durationStr += musicContent[j];
            j++;
          }
          
          let duration = parseABCDurationV2(durationStr, baseNoteDuration);
          if (durationStr === '') duration = maxDuration || baseNoteDuration;
          
          chordNotes.forEach(n => n.duration = duration);
          currentTime += duration;
          i = j;
          continue;
        }
        i++;
        continue;
      }
      
      if (char === 'z' || char === 'Z' || char === 'x' || char === 'X') {
        let durationStr = '';
        i++;
        while (i < musicContent.length && (/\d|\/|\./.test(musicContent[i]))) {
          durationStr += musicContent[i];
          i++;
        }
        const duration = char === 'Z' ? baseNoteDuration * 4 : parseABCDurationV2(durationStr, baseNoteDuration);
        currentTime += duration;
        continue;
      }
      
      let accidental = 0;
      let hasExplicitAccidental = false;
      while (i < musicContent.length && (musicContent[i] === '^' || musicContent[i] === '_' || musicContent[i] === '=')) {
        hasExplicitAccidental = true;
        if (musicContent[i] === '^') accidental++;
        else if (musicContent[i] === '_') accidental--;
        else if (musicContent[i] === '=') accidental = 0;
        i++;
      }
      
      if (i < musicContent.length && /[A-Ga-g]/.test(musicContent[i])) {
        const noteResult = parseABCSingleNote(
          musicContent, i, baseNoteDuration, currentTime, 
          keySignature, barAccidentals, accidental, hasExplicitAccidental
        );
        if (noteResult.note) {
          noteResult.note.voice = currentVoice;
          
          // Handle tie: if this note has a tie marker, we'll mark it for merging
          // We store it temporarily with a special property
          if (noteResult.hasTie) {
            (noteResult.note as any)._hasTie = true;
          }
          
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

  // Store voices in metadata
  metadata.voices = Array.from(voiceSet);

  // Post-process: merge tied notes
  // Tied notes are consecutive notes of the same pitch/octave where the first has a tie marker
  const mergedNotes: Note[] = [];
  let i = 0;
  while (i < parsedNotes.length) {
    const note = parsedNotes[i] as Note & { _hasTie?: boolean };
    
    // If this note has a tie marker, look for the next note with matching pitch/octave
    if (note._hasTie) {
      let totalDuration = note.duration;
      let j = i + 1;
      
      // Find all consecutive tied notes with same pitch/octave/voice
      while (j < parsedNotes.length) {
        const nextNote = parsedNotes[j] as Note & { _hasTie?: boolean };
        
        // Check if next note is the tied continuation (same pitch, octave, voice, and starts where previous ends)
        if (nextNote.pitch === note.pitch && 
            nextNote.octave === note.octave &&
            (nextNote.voice || 'V1') === (note.voice || 'V1') &&
            nextNote.startTime === note.startTime + totalDuration) {
          
          totalDuration += nextNote.duration;
          j++;
          
          // If this continuation doesn't have a tie, we're done with this tie chain
          if (!nextNote._hasTie) {
            break;
          }
        } else {
          break;
        }
      }
      
      // Create merged note without the internal _hasTie property
      const mergedNote: Note = {
        pitch: note.pitch,
        octave: note.octave,
        startTime: note.startTime,
        duration: totalDuration,
        voice: note.voice,
        slur: note.slur
      };
      mergedNotes.push(mergedNote);
      
      // Skip the notes we merged
      i = j;
    } else {
      // No tie, just copy the note (without internal _hasTie property)
      const cleanNote: Note = {
        pitch: note.pitch,
        octave: note.octave,
        startTime: note.startTime,
        duration: note.duration,
        voice: note.voice,
        slur: note.slur
      };
      mergedNotes.push(cleanNote);
      i++;
    }
  }

  return { notes: mergedNotes, metadata };
};

// Parse legacy score format
const parseLegacyFormat = (content: string): { notes: Note[], metadata: ScoreMetadata } => {
  const lines = content.split('\n');
  const parsedNotes: Note[] = [];
  const metadata: ScoreMetadata = { bpm: DEFAULT_BPM };
  
  const trackPositions: Map<string, number> = new Map();
  let currentTrack = 'default';
  trackPositions.set(currentTrack, 0);

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
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
    
    if (trimmed.startsWith('#')) continue;
    
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
    
    const syncMatch = trimmed.match(/^@(\d+)$/);
    if (syncMatch) {
      trackPositions.set(currentTrack, parseInt(syncMatch[1], 10));
      continue;
    }
    
    const currentTime = trackPositions.get(currentTrack) || 0;

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

/**
 * Parse score content and return a fully prepared playback schedule
 * This pre-computes everything needed for playback at load time
 */
export const parseScore = (content: string): ParsedScore => {
  // Parse notes based on format
  const { notes, metadata } = isABCNotation(content) 
    ? parseABCNotation(content) 
    : parseLegacyFormat(content);
  
  // Create scheduled notes with pre-computed frequencies
  const playbackSchedule: ScheduledNote[] = notes.map(note => ({
    frequency: getFrequency(note.pitch, note.octave),
    startTime: note.startTime,
    duration: note.duration,
    pitch: note.pitch,
    octave: note.octave,
    voice: note.voice
  }));
  
  // Sort by start time for sequential playback
  playbackSchedule.sort((a, b) => a.startTime - b.startTime);
  
  // Pre-index notes by step for O(1) lookup
  const notesByStep = new Map<number, ScheduledNote[]>();
  for (const note of playbackSchedule) {
    const step = note.startTime;
    if (!notesByStep.has(step)) {
      notesByStep.set(step, []);
    }
    notesByStep.get(step)!.push(note);
  }
  
  // Pre-index notes by voice
  const notesByVoice = new Map<string, Note[]>();
  for (const note of notes) {
    const voice = note.voice || 'V1';
    if (!notesByVoice.has(voice)) {
      notesByVoice.set(voice, []);
    }
    notesByVoice.get(voice)!.push(note);
  }
  
  // Calculate total steps
  const totalSteps = notes.length > 0 
    ? Math.max(...notes.map(n => n.startTime + n.duration))
    : 0;
  
  return {
    notes,
    metadata,
    playbackSchedule,
    notesByStep,
    notesByVoice,
    totalSteps
  };
};

export { DEFAULT_BPM };
