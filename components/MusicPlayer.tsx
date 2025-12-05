import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import { MEDIA_CONFIG } from '../config';

interface MusicPlayerProps {
  onAnalyserReady?: (analyser: AnalyserNode) => void;
  className?: string;
  autoPlayTrigger?: boolean; // When this changes to true, auto-start playing
}

export interface MusicPlayerRef {
  play: () => void;
  pause: () => void;
  resume: () => void;
  isPlaying: () => boolean;
}

interface MusicTrack {
  name: string;
  url: string;
}

const MusicPlayer = forwardRef<MusicPlayerRef, MusicPlayerProps>(({ onAnalyserReady, className = '', autoPlayTrigger }, ref) => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [volume, setVolume] = useState(MEDIA_CONFIG.music.defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  
  // Initialize tracks from config
  useEffect(() => {
    // Load tracks from configuration
    const musicTracks: MusicTrack[] = MEDIA_CONFIG.music.tracks.map(track => ({
      name: track.name,
      url: `${MEDIA_CONFIG.music.folder}/${track.file}`
    }));
    setTracks(musicTracks);
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (tracks.length === 0) return;
    
    const audio = new Audio(tracks[currentTrackIndex].url);
    audio.loop = tracks.length === 1 && MEDIA_CONFIG.music.loop;
    audio.volume = volume;
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    // Handle track end for multi-track loop
    const handleEnded = () => {
      if (tracks.length > 1) {
        const nextIndex = (currentTrackIndex + 1) % tracks.length;
        setCurrentTrackIndex(nextIndex);
      }
    };

    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [tracks, currentTrackIndex]);

  // Update audio source when track changes
  useEffect(() => {
    if (!audioRef.current || tracks.length === 0) return;
    
    const wasPlaying = isPlaying;
    audioRef.current.src = tracks[currentTrackIndex].url;
    
    if (wasPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrackIndex, tracks]);

  const initializeAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const analyser = ctx.createAnalyser();
    const gainNode = ctx.createGain();
    analyser.fftSize = 256;

    const source = ctx.createMediaElementSource(audioRef.current);
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(ctx.destination);

    gainNode.gain.value = volume;

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    gainNodeRef.current = gainNode;
    setIsInitialized(true);
    
    if (onAnalyserReady && analyser) {
      onAnalyserReady(analyser);
    }
  }, [volume, onAnalyserReady]);

  const fadeVolume = useCallback((targetVolume: number, callback?: () => void) => {
    if (!gainNodeRef.current) {
      if (callback) callback();
      return;
    }

    const startVolume = gainNodeRef.current.gain.value;
    const step = (targetVolume - startVolume) / (MEDIA_CONFIG.music.fadeDuration / 16);
    let currentVolume = startVolume;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = window.setInterval(() => {
      currentVolume += step;
      
      if ((step > 0 && currentVolume >= targetVolume) || (step < 0 && currentVolume <= targetVolume)) {
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = targetVolume;
        }
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        if (callback) callback();
      } else if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = Math.max(0, Math.min(1, currentVolume));
      }
    }, 16);
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      fadeVolume(0, () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    } else {
      if (!isInitialized) {
        initializeAudioContext();
      }
      
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 0;
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        fadeVolume(isMuted ? 0 : volume);
      } catch (e) {
        console.error("Play failed:", e);
      }
    }
  };

  // Expose play, pause, resume functions to parent via ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      if (!audioRef.current || isPlaying) return;
      
      if (!isInitialized) {
        initializeAudioContext();
      }
      
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 0;
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        fadeVolume(isMuted ? 0 : volume);
      } catch (e) {
        console.error("Auto-play failed:", e);
      }
    },
    pause: () => {
      if (!audioRef.current || !isPlaying) return;
      fadeVolume(0, () => {
        audioRef.current?.pause();
        setIsPlaying(false);
      });
    },
    resume: async () => {
      if (!audioRef.current || isPlaying) return;
      
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 0;
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
        fadeVolume(isMuted ? 0 : volume);
      } catch (e) {
        console.error("Resume failed:", e);
      }
    },
    isPlaying: () => isPlaying
  }), [isPlaying, isInitialized, isMuted, volume, initializeAudioContext, fadeVolume]);

  // Auto-play when trigger changes to true
  useEffect(() => {
    if (autoPlayTrigger && !isPlaying && audioRef.current) {
      togglePlay();
    }
  }, [autoPlayTrigger]);

  const toggleMute = () => {
    if (!gainNodeRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (isPlaying) {
      fadeVolume(newMuted ? 0 : volume);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
    
    if (gainNodeRef.current && isPlaying) {
      gainNodeRef.current.gain.value = newVolume;
    }
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const nextTrack = () => {
    if (tracks.length <= 1) return;
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    if (tracks.length <= 1) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main toggle button */}
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition-all duration-300 border ${
          isPlaying
            ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
        }`}
        title={isPlaying ? '暂停音乐' : '播放音乐'}
      >
        {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {/* Expanded controls on hover - using pt-2 with invisible bridge to maintain hover */}
      {isHovered && (
        <div className="absolute right-0 top-full pt-2 z-50">
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-lg p-3 min-w-[200px] shadow-xl animate-fade-in-up">
            {/* Track info */}
            {currentTrack && (
              <div className="text-xs text-slate-300 mb-3 truncate text-center border-b border-white/10 pb-2">
                {currentTrack.name}
              </div>
            )}

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={prevTrack}
                disabled={tracks.length <= 1}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="上一首"
              >
                <SkipBack size={16} />
              </button>
              
              <button
                onClick={togglePlay}
                className={`p-2 rounded-full transition-colors ${
                  isPlaying 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-purple-600 text-white hover:bg-purple-500'
                }`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              
              <button
                onClick={nextTrack}
                disabled={tracks.length <= 1}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="下一首"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MusicPlayer;
