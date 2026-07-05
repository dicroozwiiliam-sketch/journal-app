import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Edit2, 
  Upload, 
  Check, 
  X, 
  Volume2, 
  RefreshCw, 
  Zap, 
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalBlock } from './JournalTimeline';

// 1-second base64 silent audio to boot the player fallback gracefully
const SILENT_AUDIO_BASE64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

interface VoiceBlockProps {
  block: JournalBlock;
  index: number;
  onUpdate: (blockId: string, updatedFields: Partial<JournalBlock>) => void;
  onDuplicate: (index: number) => void;
  onDelete: (blockId: string) => void;
  showToast: (msg: string) => void;
}

export default function VoiceBlock({
  block,
  index,
  onUpdate,
  onDuplicate,
  onDelete,
  showToast
}: VoiceBlockProps) {
  // Audio state values
  const audioUrl = block.content || '';
  const meta = block.meta || {};
  const voiceName = meta.title || `Voice Journal Memo #${index}`;
  const savedDuration = meta.duration || 0;
  const savedWaveform = meta.waveform || [];
  const playbackSpeed = meta.speed || 1;

  // Recording status
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>(Array(40).fill(5));
  const [isSimulated, setIsSimulated] = useState(false);

  // Playback status
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(savedDuration || 0);
  const [speed, setSpeed] = useState(playbackSpeed);

  // Edit / Rename status
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(voiceName);

  // Media references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simulatedIntervalRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync internal state with block updates
  useEffect(() => {
    setTempName(voiceName);
  }, [voiceName]);

  useEffect(() => {
    if (savedDuration > 0) {
      setDuration(savedDuration);
    }
  }, [savedDuration]);

  // Handle active timer for recording
  useEffect(() => {
    let interval: any;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const cleanupRecording = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (simulatedIntervalRef.current) clearInterval(simulatedIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
  };

  // Generate a pristine aesthetic static waveform
  const generateStaticWaveform = (length = 40): number[] => {
    const wave: number[] = [];
    for (let i = 0; i < length; i++) {
      const x = i / (length - 1);
      const envelope = Math.sin(x * Math.PI); // Sine curve peak envelope
      const variation = 0.35 + Math.random() * 0.65;
      const height = Math.round(envelope * 85 * variation) + 12;
      wave.push(Math.min(100, Math.max(12, height)));
    }
    return wave;
  };

  // Start Voice Recording
  const startRecording = async () => {
    setIsPlaying(false);
    setRecordingTime(0);
    setIsPaused(false);
    setRecordingWaveform(Array(40).fill(6));
    audioChunksRef.current = [];

    try {
      // Prompt for real microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsSimulated(false);

      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        finishRecording(url);
      };

      // Set up standard AudioContext analyser for active waveform
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtxClass();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 64;
        
        analyserRef.current = analyser;
        audioCtxRef.current = audioCtx;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (recorder.state === 'recording') {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const normalized = Math.min(100, Math.max(8, Math.round((average / 255) * 120)));
            
            setRecordingWaveform(prev => {
              const next = [...prev.slice(1), normalized];
              return next;
            });
          }
          animationFrameRef.current = requestAnimationFrame(draw);
        };
        animationFrameRef.current = requestAnimationFrame(draw);
      } catch (err) {
        startSimulatedVisualizer();
      }

      recorder.start(150);
      setIsRecording(true);
      showToast("Recording started");
    } catch (err) {
      console.warn("Microphone access denied or unavailable. Loading simulated recording sandbox.", err);
      // Fail-soft simulated recording flow so user is never blocked
      setIsSimulated(true);
      setIsRecording(true);
      startSimulatedVisualizer();
      showToast("Simulated recording active");
    }
  };

  const startSimulatedVisualizer = () => {
    if (simulatedIntervalRef.current) clearInterval(simulatedIntervalRef.current);
    simulatedIntervalRef.current = setInterval(() => {
      const level = Math.floor(Math.random() * 65) + 15;
      setRecordingWaveform(prev => {
        const next = [...prev.slice(1), level];
        return next;
      });
    }, 150);
  };

  // Pause / Resume recording controls
  const pauseRecording = () => {
    if (isSimulated) {
      setIsPaused(true);
      if (simulatedIntervalRef.current) clearInterval(simulatedIntervalRef.current);
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    showToast("Recording paused");
  };

  const resumeRecording = () => {
    if (isSimulated) {
      setIsPaused(false);
      startSimulatedVisualizer();
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume real visualizer draw loop
      if (analyserRef.current) {
        const draw = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const normalized = Math.min(100, Math.max(8, Math.round((average / 255) * 120)));
            setRecordingWaveform(prev => [...prev.slice(1), normalized]);
          }
          animationFrameRef.current = requestAnimationFrame(draw);
        };
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    }
    showToast("Recording resumed");
  };

  // Stop & finish recording
  const stopRecording = () => {
    setIsRecording(false);
    cleanupRecording();

    if (isSimulated) {
      // Generate simulated finished recording
      finishRecording(SILENT_AUDIO_BASE64, Math.max(5, recordingTime));
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const finishRecording = (url: string, finalDuration?: number) => {
    const calculatedDuration = finalDuration || recordingTime || 12;
    const finalWave = generateStaticWaveform();

    onUpdate(block.id, {
      content: url,
      meta: {
        ...meta,
        title: voiceName,
        duration: calculatedDuration,
        waveform: finalWave,
        speed: 1
      }
    });

    setDuration(calculatedDuration);
    setCurrentTime(0);
    setIsPlaying(false);
    showToast("Recording saved successfully");
  };

  // Upload custom file / replace
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const wave = generateStaticWaveform();
      onUpdate(block.id, {
        content: dataUrl,
        meta: {
          ...meta,
          title: file.name.split('.')[0] || "Uploaded Audio",
          duration: 45, // Default estimated duration
          waveform: wave,
          speed: 1
        }
      });
      setDuration(45);
      setCurrentTime(0);
      setIsPlaying(false);
      showToast("Audio replaced with file");
    };
    reader.readAsDataURL(file);
  };

  // Audio Playback Events
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn("Real playback blocked by browser security. Simulating audio timeline.", err);
          // Fallback playback visual simulation
          setIsPlaying(true);
        });
    }
  };

  // Playback ticker simulation & event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setDuration(audio.duration);
        onUpdate(block.id, {
          meta: {
            ...meta,
            duration: audio.duration
          }
        });
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  // Handle simulation play progress tick (in case of browsers restricting playback, or SILENT fallback)
  useEffect(() => {
    let playInterval: any;
    if (isPlaying && (audioUrl === SILENT_AUDIO_BASE64 || isSimulated)) {
      playInterval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            clearInterval(playInterval);
            return 0;
          }
          return prev + 0.1 * speed;
        });
      }, 100);
    }
    return () => {
      if (playInterval) clearInterval(playInterval);
    };
  }, [isPlaying, audioUrl, duration, speed, isSimulated]);

  // Adjust speeds cycle
  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.5];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);
    
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }

    onUpdate(block.id, {
      meta: {
        ...meta,
        speed: nextSpeed
      }
    });
    showToast(`Speed set to ${nextSpeed}x`);
  };

  // Seek audio via Soundwave clicking
  const handleSeek = (percentage: number) => {
    const targetTime = (percentage / 100) * duration;
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    handleSeek(percentage);
  };

  // Format second timestamps to 0:00
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Save inline title rename
  const handleSaveName = () => {
    const title = tempName.trim() || `Voice Journal Memo #${index}`;
    onUpdate(block.id, {
      meta: {
        ...meta,
        title
      }
    });
    setIsEditingName(false);
    showToast("Voice memo renamed");
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-[#FAF9F6]/20 border border-[#E2D1C3]/60 rounded-2xl p-2 transition-all duration-300 hover:border-cozy-orange/45">
      <div className="w-full bg-white border border-[#E2D1C3]/40 p-4 sm:p-5 rounded-xl shadow-xs font-sans">
      
      {/* Hidden audio element */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          preload="auto"
          className="hidden"
        />
      )}

      {/* Hidden file input for replacement uploads */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="audio/*" 
        className="hidden" 
      />

      {/* Header bar: Icon, editable title, and state pill */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
          <div className={`p-2 rounded-xl transition-colors ${
            isRecording ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-[#D28C5C]/10 text-[#D28C5C]'
          }`}>
            <Mic size={16} />
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 w-full max-w-sm">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="w-full bg-[#FDF8F1] text-xs font-bold text-cozy-text-dark border border-[#E2D1C3] px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D28C5C]"
                  autoFocus
                />
                <button 
                  onClick={handleSaveName}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => {
                    setTempName(voiceName);
                    setIsEditingName(false);
                  }}
                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h4 
                  onClick={() => setIsEditingName(true)}
                  className="font-extrabold text-sm text-cozy-text-dark cursor-pointer hover:text-[#D28C5C] select-none truncate"
                  title="Click to rename"
                >
                  {voiceName}
                </h4>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-0.5 text-cozy-text-muted hover:text-cozy-text-dark opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Rename audio memo"
                >
                  <Edit2 size={11} />
                </button>
              </div>
            )}
            <p className="text-[10px] text-cozy-text-muted mt-0.5 select-none font-medium">
              {isRecording 
                ? (isSimulated ? 'Simulating mic recording...' : 'Recording high-fidelity audio...') 
                : audioUrl 
                  ? `Voice diary note • ${formatTime(duration)}`
                  : 'Empty audio block • Ready to record'
              }
            </p>
          </div>
        </div>

        {/* Action controls panel: Duplicate, Delete, Replace */}
        <div className="flex items-center gap-1 shrink-0">
          {audioUrl && !isRecording && (
            <button
              onClick={handleFileUploadClick}
              className="p-1.5 text-cozy-text-muted hover:text-[#D28C5C] hover:bg-[#FDF8F1] rounded-lg transition"
              title="Replace Audio file"
            >
              <Upload size={13} />
            </button>
          )}
          <button
            onClick={() => onDuplicate(index)}
            className="p-1.5 text-cozy-text-muted hover:text-[#D28C5C] hover:bg-[#FDF8F1] rounded-lg transition"
            title="Duplicate Block"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1.5 text-cozy-text-muted hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
            title="Delete Block"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main interaction content */}
      {!audioUrl && !isRecording ? (
        // IDLE INITIAL STATE: Clean and simple click-to-record uploader style
        <div className="space-y-3">
          <div 
            onClick={startRecording}
            className="border border-dashed border-[#E2D1C3] bg-[#FAF8F1]/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FAF8F1]/80 hover:border-cozy-orange/50 transition-all duration-200 min-h-[140px] space-y-2.5 group/box w-full"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50/80 flex items-center justify-center text-cozy-orange border border-amber-100/60 group-hover/box:scale-110 transition-transform duration-200">
              <Mic size={18} strokeWidth={2.5} />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black text-cozy-text-dark block uppercase tracking-wide font-mono">Record your voice</span>
              <span className="text-[10px] text-cozy-text-muted block">Click here to start recording using your microphone</span>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleFileUploadClick}
              className="text-[10px] font-bold text-cozy-text-muted hover:text-[#D28C5C] transition flex items-center gap-1 cursor-pointer"
            >
              <Upload size={11} className="text-cozy-orange" />
              <span>Or upload an audio file (.mp3, .wav, .m4a)</span>
            </button>
          </div>
        </div>
      ) : isRecording ? (
        // ACTIVE RECORDING MODE
        <div className="bg-[#FFF8F1] border border-[#F5E6D3] rounded-xl p-4 flex flex-col items-center">
          
          {/* Active wave visualization */}
          <div className="w-full flex items-end justify-center gap-[3px] h-12 mb-4 px-2 select-none overflow-hidden">
            {recordingWaveform.map((val, idx) => {
              const pulse = isRecording && !isPaused;
              return (
                <div
                  key={idx}
                  style={{ height: `${val}%` }}
                  className={`w-1 sm:w-[5px] rounded-full transition-all duration-150 ${
                    pulse ? 'bg-rose-500/80 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Active ticker timer */}
          <div className="flex items-center gap-1.5 mb-4">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500 animate-ping'}`} />
            <span className="font-mono text-xs font-bold text-cozy-text-dark select-none">
              {formatTime(recordingTime)}
            </span>
            {isSimulated && (
              <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-bold select-none flex items-center gap-0.5">
                <Zap size={8} /> Fallback
              </span>
            )}
          </div>

          {/* Recording buttons: Pause, Resume, Stop */}
          <div className="flex items-center gap-4">
            {isPaused ? (
              <button
                type="button"
                onClick={resumeRecording}
                className="px-4 py-1.5 bg-cozy-orange text-white text-xs font-bold rounded-full shadow-xs hover:opacity-95 transition"
              >
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                className="px-4 py-1.5 bg-[#E2D1C3]/60 text-cozy-text-dark text-xs font-bold rounded-full hover:bg-[#E2D1C3]/80 transition"
              >
                Pause
              </button>
            )}

            <button
              type="button"
              onClick={stopRecording}
              className="w-10 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-xs transition transform hover:scale-105"
              title="Stop and save recording"
            >
              <Square size={14} fill="currentColor" />
            </button>
          </div>
        </div>
      ) : (
        // PLAYBACK AUDIO PLAYER MODE
        <div className="bg-[#FDF8F1] border border-[#E2D1C3]/60 rounded-xl p-3 flex flex-col md:flex-row items-center gap-4">
          
          {/* Play / Pause trigger button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePlayPause}
              className={`text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition duration-200 cursor-pointer ${
                isPlaying ? 'bg-cozy-orange hover:bg-cozy-orange/95 ring-4 ring-cozy-orange/10 animate-pulse' : 'bg-[#D28C5C] hover:opacity-95 hover:scale-105'
              }`}
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} className="ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Playback speed control badge */}
            <button
              type="button"
              onClick={toggleSpeed}
              className="px-2.5 py-1 text-[10px] font-black tracking-wide border-2 border-cozy-text-dark rounded-lg hover:bg-white text-cozy-text-dark transition select-none shrink-0"
              title="Change playback speed"
            >
              {speed}x
            </button>
          </div>

          {/* Waveform Seek Container */}
          <div className="flex-1 w-full min-w-0">
            <div 
              onClick={handleWaveClick}
              className="w-full flex items-end gap-[2px] sm:gap-[3px] h-10 select-none cursor-ew-resize group/wave relative py-1"
            >
              {/* Individual waveform bars */}
              {(savedWaveform.length > 0 ? savedWaveform : generateStaticWaveform()).map((heightVal, idx, arr) => {
                const barPercent = (idx / arr.length) * 100;
                const active = progressPercent >= barPercent;
                return (
                  <div
                    key={idx}
                    style={{ height: `${heightVal}%` }}
                    className={`flex-1 rounded-full transition-all duration-150 ${
                      active 
                        ? 'bg-[#D28C5C] group-hover/wave:bg-[#D28C5C]/95' 
                        : 'bg-[#E2D1C3] group-hover/wave:bg-[#E2D1C3]/80'
                    }`}
                  />
                );
              })}
            </div>

            {/* Timestamps */}
            <div className="flex justify-between items-center mt-1 text-[9px] text-cozy-text-muted font-mono font-bold select-none">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Re-record toggle option */}
          <button
            onClick={startRecording}
            className="text-[10px] font-bold text-cozy-text-muted hover:text-[#D28C5C] hover:bg-white border border-transparent hover:border-[#E2D1C3] rounded-lg px-2.5 py-1.5 transition flex items-center gap-1 self-stretch md:self-auto justify-center select-none"
            title="Re-record memo over existing"
          >
            <RefreshCw size={10} />
            <span>Re-record</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
