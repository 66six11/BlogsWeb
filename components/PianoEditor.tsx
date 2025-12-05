import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {Note} from '../types';
import {Play, Trash2, Plus, Minus, Loader2, SkipBack, Pause, Crosshair, Undo2, Redo2} from 'lucide-react';
import {SixteenthNoteIcon, EighthNoteIcon, QuarterNoteIcon, HalfNoteIcon, WholeNoteIcon} from './CustomIcons';
import {MEDIA_CONFIG} from '../config';
import {parseScore, ScoreMetadata, NOTE_DURATION_STEPS, NoteDurationType} from './ScoreParser';
import * as Tone from 'tone';

// Throttle helper for scroll performance
const THROTTLE_MS = 16; // ~60fps
function throttle<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return ((...args: Parameters<T>) => {
        const now = performance.now();
        const remaining = delay - (now - lastCall);
        if (remaining <= 0) {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            lastCall = now;
            fn(...args);
        } else if (!timeoutId) {
            timeoutId = setTimeout(() => {
                lastCall = performance.now();
                timeoutId = null;
                fn(...args);
            }, remaining);
        }
    }) as T;
}

const MIN_STEPS = 32;

// Standard 88-key piano range: A0 (MIDI 21) to C8 (MIDI 108)
// Octave 0: A, A#, B (3 keys)
// Octaves 1-7: C, C#, D, D#, E, F, F#, G, G#, A, A#, B (12 keys each = 84 keys)
// Octave 8: C (1 key)
// Total: 3 + 84 + 1 = 88 keys
interface PianoKey {
    name: string;
    pitch: number;  // 0-11 (C=0, C#=1, ..., B=11)
    octave: number; // 0-8
    isBlack: boolean;
}

// Generate the 88 keys from high to low for display
const PIANO_KEYS: PianoKey[] = (() => {
    const keys: PianoKey[] = [];
    const pitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Octave 8: only C (highest)
    keys.push({name: 'C', pitch: 0, octave: 8, isBlack: false});

    // Octaves 7-1: all 12 notes (B down to C)
    for (let octave = 7; octave >= 1; octave--) {
        for (let p = 11; p >= 0; p--) {
            keys.push({
                name: pitchNames[p],
                pitch: p,
                octave,
                isBlack: pitchNames[p].includes('#')
            });
        }
    }


    return keys;
})();

const TOTAL_KEYS = PIANO_KEYS.length; // 88
const KEY_LABEL_WIDTH = 64;
const DURATION_PALETTE_WIDTH = 48; // Width for duration selector on left
const CELL_WIDTH = 25;
const ROW_HEIGHT = 32;
const DEFAULT_BPM = 120;
const VISIBLE_STEP_BUFFER = 10; // Extra steps to render beyond visible area
const MAX_CONCURRENT_NOTES = 32; // Limit concurrent oscillators for large scores
const MAX_HISTORY_LENGTH = 50; // Maximum undo/redo history length
const DRAG_THRESHOLD = 5; // Pixel threshold to distinguish click from drag

// Salamander Grand Piano sampler configuration
const SALAMANDER_BASE_URL = "https://tonejs.github.io/audio/salamander/";
const SALAMANDER_SAMPLES: Record<string, string> = {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3"
};

// Convert pitch (0-11) and octave to note name string (e.g., "C4", "D#5")
const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const getNoteName = (pitch: number, octave: number): string => {
    return `${PITCH_NAMES[pitch]}${octave}`;
};

// 八度基础色相 (0-8 八度)
const OCTAVE_HUES: Record<number, number> = {
    0: 0,      // 红色系
    1: 30,     // 橙色系
    2: 60,     // 黄色系
    3: 120,    // 绿色系
    4: 180,    // 青色系
    5: 220,    // 蓝色系
    6: 270,    // 紫色系
    7: 320,    // 粉色系
    8: 340,    // 玫红色系
};

// 根据八度和音高生成颜色
// 每个八度有一个基础色，音符从该八度的颜色渐变到下一个八度的颜色
const getNoteColor = (octave: number, pitch: number): string => {
    const currentHue = OCTAVE_HUES[octave] ?? 0;
    const nextHue = OCTAVE_HUES[octave + 1] ?? currentHue;

    // pitch 0-11 映射到 0-1 的渐变比例
    const ratio = pitch / 12;

    // 计算色相差，处理色环回绕（如从 340° 到 0°）
    let hueDiff = nextHue - currentHue;
    if (hueDiff > 180) hueDiff -= 360;
    if (hueDiff < -180) hueDiff += 360;

    // 插值计算当前音符的色相
    let hue = currentHue + hueDiff * ratio;
    if (hue < 0) hue += 360;
    if (hue >= 360) hue -= 360;

    const saturation = 75;
    const lightness = 55; // 固定亮度
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Duration options with visual icons
const DURATION_OPTIONS: { value: NoteDurationType; label: string; steps: number; icon: JSX.Element }[] = [
    {value: 'sixteenth', label: '16分', steps: 1, icon: <SixteenthNoteIcon size={20}/>},
    {value: 'eighth', label: '8分', steps: 2, icon: <EighthNoteIcon size={20}/>},
    {value: 'quarter', label: '4分', steps: 4, icon: <QuarterNoteIcon size={20}/>},
    {value: 'half', label: '2分', steps: 8, icon: <HalfNoteIcon size={20}/>},
    {value: 'whole', label: '全', steps: 16, icon: <WholeNoteIcon size={10}/>},
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

        return {osc, gain};
    }

    // Return nodes to pool after use (for future reuse)
    returnNodes(osc: OscillatorNode, gain: GainNode) {
        // Can't reuse stopped oscillators, but gains can be reused
        if (this.gainPool.length < this.poolSize) {
            try {
                gain.disconnect();
                this.gainPool.push(gain);
            } catch (e) {
            }
        }
    }

    clear() {
        this.oscillatorPool = [];
        this.gainPool = [];
    }
}

// Visible note data structure for optimized rendering
interface VisibleNote {
    note: Note;
    rowIndex: number; // Index in PIANO_KEYS array
    left: number;     // Pixel position
    width: number;    // Pixel width
}

interface PianoEditorProps {
    className?: string;
    isVisible?: boolean; // Stop playback when not visible (page switched)
    onPlaybackChange?: (isPlaying: boolean) => void;  // 新增：通知父组件播放状态变化
}

const PianoEditor: React.FC<PianoEditorProps> = ({className, isVisible = true, onPlaybackChange}) => {
    // Core state - Note[] displayed in grid, ABC used for playback
    const [notes, setNotes] = useState<Note[]>([]);
    const [currentStep, setCurrentStep] = useState(0); // Start at 0, always visible
    const [playheadPosition, setPlayheadPosition] = useState(0); // Always visible at step 0
    const [abcContent, setAbcContent] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [availableScores, setAvailableScores] = useState<string[]>([]);
    const [selectedScore, setSelectedScore] = useState<string>('');
    const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
    const [scoreMetadata, setScoreMetadata] = useState<ScoreMetadata>({bpm: DEFAULT_BPM});
    const [isLoading, setIsLoading] = useState(false);
    const [isSamplerLoading, setIsSamplerLoading] = useState(true); // Sampler loading state
    const [sustain, setSustain] = useState(true); // Sustain/延音 toggle, default on
    const [isUserScrolling, setIsUserScrolling] = useState(false); // Track if user manually scrolled
    const [selectedVoice, setSelectedVoice] = useState<string>('all'); // Voice filter
    const [selectedDuration, setSelectedDuration] = useState<NoteDurationType>('eighth'); // Default to 8th note
    const [activeKeys, setActiveKeys] = useState<Map<string, { color: string; endTime: number }>>(new Map()); // Keys currently glowing

    // Refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const rulerContainerRef = useRef<HTMLDivElement>(null);
    const playbackIdRef = useRef<number>(0);
    const animationFrameRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioPoolRef = useRef<AudioNodePool | null>(null);
    const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isUserScrollingRef = useRef(false); // Ref version for use in animation loop
    const isProgrammaticScrollRef = useRef(false); // Flag to ignore scroll events during auto-follow playhead scrolling
    const toneSamplerRef = useRef<Tone.Sampler | null>(null); // Tone.js sampler for piano sound
    const playheadRef = useRef<HTMLDivElement>(null); // Playhead DOM ref for direct manipulation
    const lastStepRef = useRef<number>(-1); // Track last step to avoid redundant state updates
    const prevPlayheadViewportXRef = useRef<number | null>(null); // Track previous playhead viewport X for detecting left edge entry
    const [rulerScrollOffset, setRulerScrollOffset] = useState(0); // Track ruler scroll position

    // History for undo/redo
    const historyRef = useRef<{ states: Note[][]; cursor: number }>({states: [[]], cursor: 0});

    // Drag scroll state
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({x: 0, y: 0, scrollLeft: 0, scrollTop: 0});
    const hasDraggedRef = useRef(false); // Track if we've actually dragged (vs click)
    const [isDragging, setIsDragging] = useState(false); // For cursor style

    // Virtual scroll state
    const [visibleRange, setVisibleRange] = useState({start: 0, end: MIN_STEPS});

    // Helper to update playhead position via both ref and state
    const updatePlayheadPosition = useCallback((px: number) => {
        setPlayheadPosition(px);
        if (playheadRef.current) {
            playheadRef.current.style.transform = `translateX(${px}px)`;
        }
    }, []);

    // Push notes state to history (for undo/redo)
    const pushToHistory = useCallback((newNotes: Note[]) => {
        const history = historyRef.current;
        // Truncate any redo states if we're not at the end
        const newStates = history.states.slice(0, history.cursor + 1);
        newStates.push([...newNotes]);
        // Limit history length
        if (newStates.length > MAX_HISTORY_LENGTH) {
            newStates.shift();
        }
        historyRef.current = {states: newStates, cursor: newStates.length - 1};
    }, []);

    // Undo function
    const undo = useCallback(() => {
        const history = historyRef.current;
        if (history.cursor > 0) {
            history.cursor--;
            setNotes([...history.states[history.cursor]]);
        }
    }, []);

    // Redo function
    const redo = useCallback(() => {
        const history = historyRef.current;
        if (history.cursor < history.states.length - 1) {
            history.cursor++;
            setNotes([...history.states[history.cursor]]);
        }
    }, []);

    // Check if undo/redo is available
    const canUndo = historyRef.current.cursor > 0;
    const canRedo = historyRef.current.cursor < historyRef.current.states.length - 1;

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;

            if (modKey && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

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

    // Unified note index structure - combines all indexes in a single useMemo for reduced memory and computation
    const noteIndex = useMemo(() => {
        const byPosition = new Map<string, Note>();      // Start position index (octave-pitch-startTime -> Note)
        const byPitch = new Map<string, Note[]>();       // Pitch index (octave-pitch -> Note[]), sorted for binary search
        const byStep = new Map<number, Note[]>();        // Step index (step -> Note[]), for O(1) playback lookup

        for (const note of filteredNotes) {
            // Start position index
            byPosition.set(`${note.octave}-${note.pitch}-${note.startTime}`, note);

            // Pitch index
            const pitchKey = `${note.octave}-${note.pitch}`;
            if (!byPitch.has(pitchKey)) byPitch.set(pitchKey, []);
            byPitch.get(pitchKey)!.push(note);

            // Step index
            if (!byStep.has(note.startTime)) byStep.set(note.startTime, []);
            byStep.get(note.startTime)!.push(note);
        }

        // Sort pitch index arrays by startTime for binary search
        for (const arr of byPitch.values()) {
            arr.sort((a, b) => a.startTime - b.startTime);
        }

        return {byPosition, byPitch, byStep};
    }, [filteredNotes]);

    const getNoteAt = useCallback((octave: number, pitch: number, step: number): Note | undefined => {
        return noteIndex.byPosition.get(`${octave}-${pitch}-${step}`);
    }, [noteIndex]);

    // Binary search to find the note containing a step
    const findNoteAtStep = useCallback((notesArr: Note[], step: number): Note | undefined => {
        let left = 0;
        let right = notesArr.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const note = notesArr[mid];
            const noteEnd = note.startTime + note.duration;

            if (step >= note.startTime && step < noteEnd) {
                return note;
            } else if (step < note.startTime) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return undefined;
    }, []);

    // O(log n) check if a cell is part of a sustained note (for visual display)
    const isPartOfNote = useCallback((octave: number, pitch: number, step: number): {
        isStart: boolean;
        isMiddle: boolean;
        isEnd: boolean;
        note?: Note
    } => {
        const key = `${octave}-${pitch}`;
        const notesAtPitch = noteIndex.byPitch.get(key);

        if (!notesAtPitch || notesAtPitch.length === 0) {
            return {isStart: false, isMiddle: false, isEnd: false};
        }

        // Use binary search to find note at this step
        const note = findNoteAtStep(notesAtPitch, step);

        if (!note) {
            return {isStart: false, isMiddle: false, isEnd: false};
        }

        const isStart = step === note.startTime;
        const isEnd = step === note.startTime + note.duration - 1;
        const isMiddle = !isStart && step < note.startTime + note.duration;

        return {isStart, isMiddle, isEnd, note};
    }, [noteIndex, findNoteAtStep]);

    // Check if a note is active at a specific position (for grid display)
    const isNoteActive = useCallback((octave: number, pitch: number, step: number): boolean => {
        const result = isPartOfNote(octave, pitch, step);
        return result.isStart || result.isMiddle;
    }, [isPartOfNote]);

    // Create a map from octave-pitch to row index for O(1) lookup
    const keyRowIndex = useMemo(() => {
        const map = new Map<string, number>();
        PIANO_KEYS.forEach((key, idx) => {
            map.set(`${key.octave}-${key.pitch}`, idx);
        });
        return map;
    }, []);

    // Pre-compute visible notes with their rendering positions
    // Only notes that overlap with the visible range are included
    const visibleNotes = useMemo((): VisibleNote[] => {
        const result: VisibleNote[] = [];
        const {start, end} = visibleRange;

        for (const note of filteredNotes) {
            const noteEnd = note.startTime + note.duration;
            // Check if note overlaps with visible range
            if (noteEnd > start && note.startTime < end) {
                const rowIndex = keyRowIndex.get(`${note.octave}-${note.pitch}`);
                if (rowIndex !== undefined) {
                    result.push({
                        note,
                        rowIndex,
                        left: note.startTime * CELL_WIDTH,
                        width: note.duration * CELL_WIDTH
                    });
                }
            }
        }

        return result;
    }, [filteredNotes, visibleRange, keyRowIndex]);

    // Initialize sampler on component mount (preload strategy)
    useEffect(() => {
        let mounted = true;

        // Create sampler with Salamander Grand Piano samples
        // Initial release is set to 1.0 (sustain on by default)
        // The sustain effect hook below will update this if sustain state changes
        const sampler = new Tone.Sampler({
            urls: SALAMANDER_SAMPLES,
            baseUrl: SALAMANDER_BASE_URL,
            release: 1.0, // Default release, updated by sustain effect
            onload: () => {
                if (mounted) {
                    setIsSamplerLoading(false);
                }
            },
            onerror: (error) => {
                console.error('Error loading sampler:', error);
                if (mounted) {
                    setIsSamplerLoading(false);
                }
            }
        }).toDestination();

        toneSamplerRef.current = sampler;

        return () => {
            mounted = false;
        };
    }, []); // Only run once on mount

    // Update sampler release based on sustain setting
    useEffect(() => {
        if (toneSamplerRef.current) {
            toneSamplerRef.current.release = sustain ? 1.0 : 0.3;
        }
    }, [sustain]);

    // Initialize notes and available scores
    useEffect(() => {
        setAvailableScores(MEDIA_CONFIG.scores.files);
    }, []);

    // Update visible range on scroll for virtual scrolling - throttled for performance
    const updateVisibleRangeCore = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const clientWidth = container.clientWidth;

        const startStep = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - VISIBLE_STEP_BUFFER);
        const endStep = Math.min(totalSteps, Math.ceil((scrollLeft + clientWidth) / CELL_WIDTH) + VISIBLE_STEP_BUFFER);

        // Avoid redundant state updates
        setVisibleRange(prev => {
            if (prev.start === startStep && prev.end === endStep) {
                return prev;
            }
            return {start: startStep, end: endStep};
        });
    }, [totalSteps]);

    // Throttled version of updateVisibleRange (~60fps)
    const updateVisibleRange = useMemo(
        () => throttle(updateVisibleRangeCore, THROTTLE_MS),
        [updateVisibleRangeCore]
    );

    // Handle user scroll - stop auto-follow when user manually scrolls
    const handleUserScroll = useCallback(() => {
        // Ignore scroll events triggered by programmatic scrolling
        if (isProgrammaticScrollRef.current) {
            return;
        }
        
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

    // Internal function to stop playback sounds without disposing sampler
    // Only releases currently playing notes - sampler stays alive for reuse
    const cleanupSampler = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
        }

        if (audioPoolRef.current) {
            audioPoolRef.current.clear();
            audioPoolRef.current = null;
        }

        if (audioContextRef.current) {
            try {
                audioContextRef.current.close();
            } catch (e) {
            }
            audioContextRef.current = null;
        }

        // Stop Tone.js transport and release all notes, but keep sampler alive
        try {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            Tone.Transport.position = 0;
            if (toneSamplerRef.current) {
                // Release all playing notes immediately to prevent stuck sounds
                toneSamplerRef.current.releaseAll();
            }
        } catch (e) {
            console.error('Error stopping Tone.js:', e);
        }
    }, []);

    // Full cleanup function for component unmount - disposes the sampler
    const disposeSampler = useCallback(() => {
        cleanupSampler();
        try {
            if (toneSamplerRef.current) {
                toneSamplerRef.current.dispose();
                toneSamplerRef.current = null;
            }
        } catch (e) {
            console.error('Error disposing Tone.js sampler:', e);
        }
    }, [cleanupSampler]);

    // Pause playback - keep position
    const pausePlayback = useCallback(() => {
        playbackIdRef.current++;
        cleanupSampler();
        setIsPlaying(false);
        setActiveKeys(new Map()); // Clear active keys on pause
        onPlaybackChange?.(false);  // 通知父组件播放已暂停
        // Keep currentStep and playheadPosition - don't reset
    }, [cleanupSampler, onPlaybackChange]);


    // Stop and reset to beginning
    const stopPlayback = useCallback(() => {
        pausePlayback();
        setCurrentStep(0);
        updatePlayheadPosition(0);
    }, [pausePlayback, updatePlayheadPosition]);

    // Jump to beginning
    const jumpToStart = useCallback(() => {
        const wasPlaying = isPlaying;
        if (wasPlaying) {
            pausePlayback();
        }
        setCurrentStep(0);
        updatePlayheadPosition(0);
        setIsUserScrolling(false);
        isUserScrollingRef.current = false;
        setActiveKeys(new Map()); // Clear active keys
        // Scroll to start
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
        }
    }, [isPlaying, pausePlayback, updatePlayheadPosition]);

    // Jump to current playhead position
    const jumpToPlayhead = useCallback(() => {
        if (scrollContainerRef.current) {
            const c = scrollContainerRef.current;
            // Calculate scroll position to align playhead with target position
            const playheadTargetPosition = KEY_LABEL_WIDTH + CELL_WIDTH * 4;
            c.scrollLeft = Math.max(0, playheadPosition - playheadTargetPosition + KEY_LABEL_WIDTH);
            setIsUserScrolling(false);
            isUserScrollingRef.current = false;
        }
    }, [playheadPosition]);

    // Play using Tone.js Sampler for realistic piano sound - can start from any step
    // Uses real-time triggering instead of pre-scheduling for reliable jumps
    const startPlaybackFromStep = useCallback(async (fromStep?: number) => {
        if (notes.length === 0) return;

        // Check if sampler is loaded
        if (isSamplerLoading || !toneSamplerRef.current) {
            console.warn('Sampler not loaded yet');
            return;
        }

        // Clean up any currently playing notes first (but keep sampler)
        cleanupSampler();

        // Increment playback ID to invalidate any old callbacks
        const currentPlaybackId = ++playbackIdRef.current;

        // Start Tone.js context
        await Tone.start();

        // Small delay to ensure clean audio state
        await new Promise(resolve => setTimeout(resolve, 30));

        // Check if we're still the current playback
        if (playbackIdRef.current !== currentPlaybackId) return;

        // Use the existing sampler
        const sampler = toneSamplerRef.current;
        if (!sampler) return;

        const stepDurationMs = stepInterval;
        const startStep = fromStep !== undefined ? fromStep : (currentStep >= 0 ? currentStep : 0);

        // Track which notes have been triggered to avoid duplicates
        const triggeredNotes = new Set<string>();

        setIsPlaying(true);
        onPlaybackChange?.(true);  // 通知父组件播放已开始
        setIsUserScrolling(false);
        isUserScrollingRef.current = false;
        prevPlayheadViewportXRef.current = null; // Reset previous playhead position tracking

        // Real-time playback loop
        const playStartTime = performance.now();
        let lastProcessedStep = startStep - 1;
        // Track active notes for key glow effect
        const activeNoteEndTimes = new Map<string, { endTime: number; color: string }>();

        const updatePlayhead = () => {
            if (playbackIdRef.current !== currentPlaybackId) return;

            // Check if sampler is still valid
            if (!toneSamplerRef.current) return;

            const elapsed = performance.now() - playStartTime;
            const currentPos = startStep + (elapsed / stepDurationMs);
            const currentStepFloor = Math.floor(currentPos);

            // Trigger notes that should start at this step - O(1) lookup per step
            if (currentStepFloor > lastProcessedStep) {
                for (let step = lastProcessedStep + 1; step <= currentStepFloor; step++) {
                    const notesAtStep = noteIndex.byStep.get(step);
                    if (notesAtStep) {
                        for (const note of notesAtStep) {
                            const noteKey = `${note.octave}-${note.pitch}-${note.startTime}`;
                            if (!triggeredNotes.has(noteKey)) {
                                triggeredNotes.add(noteKey);

                                // Use note name instead of frequency for Sampler
                                const noteName = getNoteName(note.pitch, note.octave);
                                const durSec = Math.max(0.05, note.duration * stepDurationMs / 1000);

                                try {
                                    sampler.triggerAttackRelease(noteName, durSec);
                                } catch (e) {
                                    // Sampler may have been disposed
                                    return;
                                }

                                // Track active note for glow effect
                                const keyId = `${note.octave}-${note.pitch}`;
                                const endTimeMs = performance.now() + durSec * 1000;
                                const color = getNoteColor(note.octave, note.pitch);
                                activeNoteEndTimes.set(keyId, {endTime: endTimeMs, color});
                            }
                        }
                    }
                }
                lastProcessedStep = currentStepFloor;
            }

            // Update active keys for glow effect
            const now = performance.now();
            const newActiveKeys = new Map<string, { color: string; endTime: number }>();
            for (const [keyId, data] of activeNoteEndTimes) {
                if (data.endTime > now) {
                    newActiveKeys.set(keyId, data);
                }
            }
            // Only update state if changed
            setActiveKeys(prev => {
                if (prev.size !== newActiveKeys.size) return newActiveKeys;
                for (const [k, v] of prev) {
                    const newV = newActiveKeys.get(k);
                    if (!newV || newV.endTime !== v.endTime) return newActiveKeys;
                }
                return prev;
            });

            // Update playhead position directly via ref (no React re-render)
            const px = currentPos * CELL_WIDTH;
            if (playheadRef.current) {
                playheadRef.current.style.transform = `translateX(${px}px)`;
            }

            // Only update currentStep state when step actually changes (for position indicator)
            if (currentStepFloor !== lastStepRef.current) {
                lastStepRef.current = currentStepFloor;
                setCurrentStep(currentStepFloor);
            }

            // Smooth scroll during playback - playhead stays near left edge (after key labels)
            if (scrollContainerRef.current) {
                const c = scrollContainerRef.current;
                // Fixed playhead position relative to viewport: at KEY_LABEL_WIDTH (right edge of key labels)
                const playheadTargetPosition = KEY_LABEL_WIDTH; // A bit into the visible area

                // Calculate the scroll position to keep playhead at target position
                const targetScrollLeft = px - playheadTargetPosition + KEY_LABEL_WIDTH;

                // Calculate playhead position in viewport
                const playheadViewportX = px - c.scrollLeft + KEY_LABEL_WIDTH;
                const leftEdge = KEY_LABEL_WIDTH;
                
                // Detect if playhead is entering from the left side of the viewport
                // On first frame (prevX is null), we don't trigger to avoid false positives
                const prevX = prevPlayheadViewportXRef.current;
                const isEnteringFromLeft = prevX !== null && prevX < leftEdge && playheadViewportX >= leftEdge;
                
                // Update previous position for next frame
                prevPlayheadViewportXRef.current = playheadViewportX;

                if (isEnteringFromLeft && isUserScrollingRef.current) {
                    // Playhead entered viewport from left edge - resume auto-scroll
                    setIsUserScrolling(false);
                    isUserScrollingRef.current = false;
                }

                if (!isUserScrollingRef.current) {
                    // Smooth scroll to target position
                    const currentScroll = c.scrollLeft;
                    const scrollDiff = targetScrollLeft - currentScroll;
                    // Smooth interpolation for fluid motion
                    const smoothFactor = 0.15;
                    const newScroll = currentScroll + scrollDiff * smoothFactor;
                    if (Math.abs(scrollDiff) > 1) {
                        // Set flag to prevent scroll event from triggering user scroll detection during auto-follow
                        isProgrammaticScrollRef.current = true;
                        c.scrollLeft = Math.max(0, newScroll);
                        // Reset flag in next frame - scroll event fires synchronously, so it will be handled before this callback
                        requestAnimationFrame(() => {
                            isProgrammaticScrollRef.current = false;
                        });
                    }
                }
            }

            // Check if playback should end
            if (currentPos > lastNoteEndTime) {
                playbackIdRef.current++;
                cleanupSampler();
                setIsPlaying(false);
                setActiveKeys(new Map()); // Clear active keys on stop
                return;
            }

            animationFrameRef.current = requestAnimationFrame(updatePlayhead);
        };

        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }, [notes, noteIndex, currentStep, lastNoteEndTime, stepInterval, isSamplerLoading, cleanupSampler, onPlaybackChange]);

    // Wrapper for normal playback (from current position)
    const startPlayback = useCallback(() => {
        startPlaybackFromStep();
    }, [startPlaybackFromStep]);

    // Handle ruler click - move playhead, and if playing, restart from that position
    const handleRulerClick = useCallback((step: number) => {
        setCurrentStep(step);
        updatePlayheadPosition(step * CELL_WIDTH);
        setIsUserScrolling(false);
        isUserScrollingRef.current = false;

        // If currently playing, restart from this position
        if (isPlaying) {
            startPlaybackFromStep(step);
        }
    }, [isPlaying, startPlaybackFromStep, updatePlayheadPosition]);

    // Load score - always parse to Note[] for grid display
    const loadScore = useCallback(async (scoreName: string) => {
        pausePlayback();
        setCurrentStep(0);
        updatePlayheadPosition(0);

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
            // Reset history when loading a new score
            historyRef.current = {states: [[...parsed.notes]], cursor: 0};
            setScoreMetadata(parsed.metadata);
            setBpm(parsed.metadata.bpm);
            setAbcContent(content);
            setSelectedScore(scoreName);
            setIsLoading(false);

            // 加载完成后滚动到音符范围（最高音贴住视窗顶部）
            setTimeout(() => {
                if (scrollContainerRef.current && parsed.notes.length > 0) {
                    // 找到最高音
                    const highestNote = parsed.notes.reduce((highest, note) => {
                        const currentMidi = note.octave * 12 + note.pitch;
                        const highestMidi = highest.octave * 12 + highest.pitch;
                        return currentMidi > highestMidi ? note : highest;
                    }, parsed.notes[0]);

                    // 计算最高音在 PIANO_KEYS 中的索引 - 使用 O(1) Map 查找
                    const highestKeyIndex = keyRowIndex.get(`${highestNote.octave}-${highestNote.pitch}`);

                    if (highestKeyIndex !== undefined) {
                        const scrollTop = Math.max(0, highestKeyIndex * ROW_HEIGHT - 10);
                        scrollContainerRef.current.scrollTop = scrollTop;
                    }
                }
            }, 100);
        } catch (e) {
            console.error('Error loading score:', e);
            setIsLoading(false);
        }
    }, [pausePlayback, updatePlayheadPosition, keyRowIndex]);

    // Toggle note in grid - uses selected duration
    // rowIndex is the index into PIANO_KEYS, step is the horizontal position
    const toggleNote = useCallback((rowIndex: number, step: number) => {
        const key = PIANO_KEYS[rowIndex];
        if (!key) return;

        const {pitch, octave} = key;
        const duration = NOTE_DURATION_STEPS[selectedDuration];

        setNotes(prev => {
            // Check if clicking on any part of an existing note
            const existingNote = prev.find(n =>
                n.octave === octave && n.pitch === pitch &&
                step >= n.startTime && step < n.startTime + n.duration
            );
            let newNotes: Note[];
            if (existingNote) {
                newNotes = prev.filter(n => n !== existingNote);
            } else {
                newNotes = [...prev, {pitch, octave, startTime: step, duration}];
            }
            pushToHistory(newNotes);
            return newNotes;
        });
    }, [selectedDuration, pushToHistory]);

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
        updatePlayheadPosition(0);
        setNotes([]);
        pushToHistory([]);
        setAbcContent('');
        setSelectedScore('');
    }, [pausePlayback, updatePlayheadPosition, pushToHistory]);

    // Drag scroll handlers
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        // Only start drag on left mouse button and if not clicking on interactive elements
        if (e.button !== 0) return;

        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
            scrollTop: scrollContainerRef.current?.scrollTop || 0
        };
    }, []);

    const handleDragMove = useCallback((e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;

        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        // Check if we've moved enough to be considered a drag
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
            hasDraggedRef.current = true;
            setIsDragging(true);
        }

        if (hasDraggedRef.current) {
            scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
            scrollContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        isDraggingRef.current = false;
        setIsDragging(false);
        // hasDraggedRef is reset in handleGridClick, not here, because:
        // The click event fires after mouseUp, and we need hasDraggedRef to 
        // distinguish between a drag-release (should not toggle note) and
        // a simple click (should toggle note).
    }, []);

    // Handle grid click - only toggle note if not dragged
    const handleGridClick = useCallback((e: React.MouseEvent) => {
        // If we were dragging, don't toggle note
        if (hasDraggedRef.current) {
            hasDraggedRef.current = false;
            return;
        }

        // Event delegation: calculate which cell was clicked
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const step = Math.floor(x / CELL_WIDTH);
        const rowIndex = Math.floor(y / ROW_HEIGHT);
        if (rowIndex >= 0 && rowIndex < TOTAL_KEYS && step >= 0 && step < totalSteps) {
            toggleNote(rowIndex, step);
        }
    }, [totalSteps, toggleNote]);

    // Cleanup on unmount - properly dispose all audio resources
    useEffect(() => () => disposeSampler(), [disposeSampler]);

    // Stop playback when page/view changes (isVisible becomes false)
    useEffect(() => {
        if (!isVisible && isPlaying) {
            pausePlayback();
        }
    }, [isVisible, isPlaying, pausePlayback]);

    return (
        <div className={`piano-editor-container  border rounded-xl p-6 shadow-2xl ${className}`}>

            {/* Header - fixed layout */}
            <div className="flex flex-col gap-3 mb-4">
                {/* Title row */}
                <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-serif flex items-center gap-2 shrink-0 piano-text-accent3">
                        <span className="text-2xl">♪</span> 魔法乐谱编辑器
                    </h3>
                    {scoreMetadata.title && (
                        <span className="text-sm px-2 py-0.5 rounded shrink-0 piano-bg-secondary piano-text-accent1">
              {scoreMetadata.title}
            </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded shrink-0 piano-bg-secondary piano-text-secondary">
            {notes.length} 音符
          </span>
                </div>

                {/* Controls row */}
                <div className="flex gap-2 items-center flex-wrap justify-between">
                    {/* Sustain toggle */}
                    <div className="flex gap-2 items-center flex-wrap">
                        <button
                            onClick={() => setSustain(prev => !prev)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sustain ? 'ring-2 ring-purple-400 piano-btn-primary' : 'piano-btn-secondary'}`}
                            title={sustain ? '延音开启 - 音符会自然衰减' : '延音关闭 - 音符快速停止'}
                        >
                            {sustain ? '延音 ✓' : '延音'}
                        </button>

                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg piano-bg-secondary">
                            <button onClick={() => setBpm(prev => Math.max(40, prev - 10))}
                                    className="p-1 rounded hover:bg-white/10 piano-text-secondary">
                                <Minus size={14}/>
                            </button>
                            <span className="text-xs font-mono w-16 text-center piano-text-accent1">{bpm} BPM</span>
                            <button onClick={() => setBpm(prev => Math.min(240, prev + 10))}
                                    className="p-1 rounded hover:bg-white/10 piano-text-secondary">
                                <Plus size={14}/>
                            </button>
                        </div>

                        {availableScores.length > 0 && (
                            <select
                                value={selectedScore}
                                onChange={(e) => loadScore(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border text-sm piano-input"
                            >
                                <option value="">加载乐谱...</option>
                                {availableScores.map(score => <option key={score} value={score}>{score}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                        <button onClick={clearAll} className="p-2 rounded-full hover:bg-red-500/20 text-red-400"
                                title="清除">
                            <Trash2 size={20}/>
                        </button>

                        {/* Undo button */}
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className={`p-2 rounded-full hover:bg-white/10 piano-text-secondary ${!canUndo ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="撤销 (Ctrl+Z)"
                        >
                            <Undo2 size={20}/>
                        </button>

                        {/* Redo button */}
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className={`p-2 rounded-full hover:bg-white/10 piano-text-secondary ${!canRedo ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title="重做 (Ctrl+Shift+Z)"
                        >
                            <Redo2 size={20}/>
                        </button>

                        {/* Jump to start button */}
                        <button
                            onClick={jumpToStart}
                            className="p-2 rounded-full hover:bg-white/10 piano-text-secondary"
                            title="跳转到开头"
                        >
                            <SkipBack size={20}/>
                        </button>

                        {/* Jump to playhead button - show when user has scrolled away */}
                        {isUserScrolling && isPlaying && (
                            <button
                                onClick={jumpToPlayhead}
                                className="p-2 rounded-full hover:bg-white/10 animate-pulse piano-text-accent3"
                                title="跳转到播放位置"
                            >
                                <Crosshair size={20}/>
                            </button>

                        )}


                        {/* Sampler loading indicator */}
                        {isSamplerLoading && (
                            <span
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs piano-bg-secondary piano-text-secondary">
              <Loader2 size={14} className="animate-spin"/>
              加载钢琴音色中...
            </span>
                        )}

                        <button
                            onClick={togglePlayback}
                            disabled={notes.length === 0 || isSamplerLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-white hover:opacity-90 ${
                                isPlaying ? 'shadow-[0_0_15px_rgba(222,185,154,0.5)] piano-btn-active' : 'piano-btn-primary'
                            } ${(notes.length === 0 || isSamplerLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isSamplerLoading ? '正在加载钢琴音色...' : (notes.length === 0 ? '没有音符可播放' : (isPlaying ? '暂停' : '播放'))}
                        >
                            {isSamplerLoading ? <Loader2 size={16} className="animate-spin"/> : (isPlaying ?
                                <Pause size={16}/> : <Play size={16} fill="currentColor"/>)}
                            {isSamplerLoading ? '加载中' : (isPlaying ? '暂停' : '播放')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin piano-text-accent3"/>
                </div>
            )}

            {/* Piano Grid - always shown */}
            {!isLoading && (
                <div className="flex border rounded piano-border-subtle piano-bg-primary">
                    {/* Duration selector panel - vertical on left */}
                    <div className="flex flex-col border-r z-30 piano-border-subtle piano-bg-secondary"
                         style={{width: `${DURATION_PALETTE_WIDTH}px`}}>
                        <div
                            className="h-6 border-b flex items-center justify-center text-[10px] piano-border-subtle piano-text-secondary">
                            时值
                        </div>
                        <div className="flex flex-col flex-1 py-2">
                            {DURATION_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setSelectedDuration(opt.value)}
                                    className={`flex flex-col items-center justify-center py-3 transition-all hover:bg-white/10 ${selectedDuration === opt.value ? 'ring-2 ring-inset ring-purple-400 piano-btn-primary' : 'piano-text-secondary'}`}
                                    title={`${opt.label}音符 (${opt.steps}步)`}
                                >
                                    <span className="text-xl leading-none">{opt.icon}</span>
                                    <span className="text-[10px] mt-1">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Piano grid container */}
                    <div className="flex-1 flex flex-col overflow-hidden" style={{maxHeight: '800px'}}>
                        {/* Fixed ruler row - scrolls horizontally only */}
                        <div className="flex shrink-0" style={{height: '24px'}}>
                            {/* Key label header - fixed */}
                            <div
                                className="shrink-0 border-b border-r flex items-center justify-center text-[10px] piano-border-subtle piano-bg-secondary piano-text-secondary"
                                style={{width: `${KEY_LABEL_WIDTH}px`}}>
                                音符
                            </div>
                            {/* Ruler - scrolls with grid horizontally */}
                            <div
                                className="flex-1 overflow-hidden relative border-b piano-border-subtle piano-bg-secondary"
                            >
                                <div
                                    ref={rulerContainerRef}
                                    className="absolute h-full flex"
                                    style={{
                                        width: `${totalSteps * CELL_WIDTH}px`,
                                        transform: `translateX(-${rulerScrollOffset}px)`
                                    }}
                                >
                                    {/* Left spacer for virtual scroll */}
                                    <div style={{width: `${visibleRange.start * CELL_WIDTH}px`, flexShrink: 0}}/>

                                    {/* Visible ruler cells */}
                                    {Array.from({length: visibleRange.end - visibleRange.start}).map((_, idx) => {
                                        const i = visibleRange.start + idx;
                                        const isBeatStart = i % 4 === 0;
                                        return (
                                            <div
                                                key={i}
                                                onClick={() => handleRulerClick(i)}
                                                className={`text-[10px] text-center flex items-center justify-center cursor-pointer hover:bg-white/10 ${isBeatStart ? 'font-bold' : ''} piano-ruler-cell ${isBeatStart ? 'beat-start' : ''} ${currentStep === i ? 'current' : ''} ${i % 4 === 3 ? 'piano-ruler-border-beat' : 'piano-ruler-border-step'}`}
                                                style={{
                                                    width: `${CELL_WIDTH}px`, flexShrink: 0, height: '100%'
                                                }}
                                            >
                                                {isBeatStart ? i / 4 + 1 : '·'}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Scrollable content area - both vertical and horizontal scroll */}
                        <div
                            ref={scrollContainerRef}
                            className="piano-scroll flex-1 overflow-auto relative"
                            onScroll={() => {
                                // Sync ruler position with grid scroll using state
                                if (scrollContainerRef.current) {
                                    setRulerScrollOffset(scrollContainerRef.current.scrollLeft);
                                }
                                handleUserScroll();
                            }}
                        >
                            {/* Content wrapper - contains both key labels and grid for synchronized vertical scrolling */}
                            <div
                                className="relative"
                                style={{
                                    width: `${totalSteps * CELL_WIDTH + KEY_LABEL_WIDTH}px`,
                                    height: `${TOTAL_KEYS * ROW_HEIGHT}px`
                                }}
                            >
                                {/* Key labels column - sticky left, scrolls vertically with grid */}
                                <div
                                    className="absolute top-0 z-50"
                                    style={{
                                        position: 'sticky',
                                        left: 0,
                                        width: `${KEY_LABEL_WIDTH}px`,
                                        height: `${TOTAL_KEYS * ROW_HEIGHT}px`
                                    }}
                                >
                                    {PIANO_KEYS.map((key, idx) => {
                                        const keyId = `${key.octave}-${key.pitch}`;
                                        const activeData = activeKeys.get(keyId);
                                        const isActive = !!activeData;
                                        const glowColor = activeData?.color || getNoteColor(key.octave, key.pitch);

                                        return (
                                            <div
                                                key={keyId}
                                                className={`flex items-center text-xs border-b piano-border-subtle ${key.isBlack ? 'piano-key-black' : 'piano-key-white'}`}
                                                style={{
                                                    width: `${KEY_LABEL_WIDTH}px`,
                                                    height: `${ROW_HEIGHT}px`,
                                                    transition: 'box-shadow 0.15s ease-out, background-color 0.15s ease-out',
                                                    boxShadow: isActive ? `inset 0 0 20px ${glowColor}, 0 0 15px ${glowColor}` : 'none',
                                                    backgroundColor: isActive ? `${glowColor}30` : undefined
                                                }}
                                            >
                                                <span
                                                    className="flex-1 text-right pr-2"
                                                    style={{
                                                        transition: 'text-shadow 0.15s ease-out',
                                                        textShadow: isActive ? `0 0 10px ${glowColor}` : 'none'
                                                    }}
                                                >
                                                    {key.name}{key.octave}
                                                </span>
                                                {/* 右侧颜色指示条 */}
                                                <div
                                                    style={{
                                                        width: '4px',
                                                        height: '100%',
                                                        backgroundColor: glowColor,
                                                        transition: 'box-shadow 0.15s ease-out',
                                                        boxShadow: isActive ? `0 0 10px ${glowColor}` : 'none'
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Grid area - uses CSS background for grid lines */}
                                <div
                                    className={`absolute piano-grid ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                                    style={{
                                        left: `${KEY_LABEL_WIDTH}px`,
                                        top: 0,
                                        width: `${totalSteps * CELL_WIDTH}px`,
                                        height: `${TOTAL_KEYS * ROW_HEIGHT}px`
                                    }}
                                    onMouseDown={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                    onClick={handleGridClick}
                                >
                                    {/* Playhead - highest z-index, positioned via ref for performance */}
                                    <div
                                        ref={playheadRef}
                                        className="absolute top-0 bottom-0 z-20 pointer-events-none piano-playhead"
                                        style={{
                                            width: '2px',
                                            left: 0,
                                            transform: `translateX(${playheadPosition}px)`,
                                            willChange: 'transform'
                                        }}
                                    />

                                    {/* Only render visible notes - absolutely positioned */}
                                    {visibleNotes.map((vn, idx) => {
                                        const noteColor = getNoteColor(vn.note.octave, vn.note.pitch);
                                        return (
                                            <div
                                                key={`note-${idx}-${vn.note.octave}-${vn.note.pitch}-${vn.note.startTime}`}
                                                className="absolute z-10 pointer-events-none"
                                                style={{
                                                    left: `${vn.left + 2}px`,
                                                    top: `${vn.rowIndex * ROW_HEIGHT + 2}px`,
                                                    width: `${vn.width - 4}px`,
                                                    height: `${ROW_HEIGHT - 4}px`,
                                                    backgroundColor: noteColor,
                                                    boxShadow: `0 0 10px ${noteColor}80`,
                                                    borderRadius: '4px',
                                                    borderLeft: '3px solid rgba(255,255,255,0.5)'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Position indicator */}
            {!isLoading && currentStep >= 0 && (
                <div className="mt-2 flex items-center justify-center">
          <span className="text-xs font-mono px-2 py-1 rounded piano-bg-secondary piano-text-accent3">
            第 {Math.floor(currentStep / 4) + 1} 拍 · 第 {(currentStep % 4) + 1} 步
          </span>
                </div>
            )}

            {!isLoading && (
                <p className="text-xs mt-2 text-right piano-text-secondary">
                    点击网格添加/移除音符。ABC乐谱自动解析为网格显示。
                </p>
            )}
        </div>
    );
};

export default PianoEditor;
