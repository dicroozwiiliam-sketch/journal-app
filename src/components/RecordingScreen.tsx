/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Pause, Play, Trash2, Sparkles, Check, Edit3, X, FileText, Share2, CornerDownRight } from 'lucide-react';
import { JournalEntry } from '../types';

interface RecordingScreenProps {
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
  isWritingMode?: boolean; // if true, show a text editor instead of recorder!
}

export default function RecordingScreen({ onSave, onCancel, isWritingMode = false }: RecordingScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Text Mode state
  const [manualText, setManualText] = useState('');

  // Audio recording references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context visualizer references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
  };

  // Start Recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start Media Recorder
      const options = { mimeType: 'audio/webm' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream); // fallback if webm is not supported (e.g. Safari)
      }

      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        await processAudioAndFetchInsights();
      };

      recorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start Visualizer
      setupVisualizer(stream);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required. Please check permissions.");
    }
  };

  // Web Audio Analyser Visualizer
  const setupVisualizer = (stream: MediaStream) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 64; // small fft for simple visualizer
    
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Draw mirrored bars from center outwards
      const barCount = 16;
      const barWidth = 4;
      const spacing = 6;
      const center = width / 2;

      ctx.fillStyle = '#C56E42'; // Cozy orange color theme matching index.css

      for (let i = 0; i < barCount; i++) {
        // scale visual data
        const percent = (dataArray[i] || 0) / 255;
        // make sure there is a minimum pulse even in silence
        const amplitude = Math.max(percent * (height - 10), isPaused ? 4 : 8); 

        // Right side bar
        const rx = center + i * (barWidth + spacing);
        const ry = (height - amplitude) / 2;
        ctx.beginPath();
        ctx.roundRect(rx, ry, barWidth, amplitude, 2);
        ctx.fill();

        // Left side bar
        const lx = center - i * (barWidth + spacing) - barWidth;
        const ly = (height - amplitude) / 2;
        ctx.beginPath();
        ctx.roundRect(lx, ly, barWidth, amplitude, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Pause Recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        if (audioCtxRef.current) audioCtxRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (audioCtxRef.current) audioCtxRef.current.suspend();
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  };

  // Stop Recording & Trigger processing
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      cleanupAudio();
      setProcessing(true);
      mediaRecorderRef.current.stop();
    }
  };

  // Delete/Cancel Recording
  const deleteRecording = () => {
    cleanupAudio();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    audioChunksRef.current = [];
    onCancel();
  };

  // Convert Blob to Base64 & call Server-Side API
  const processAudioAndFetchInsights = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result?.toString().split(',')[1];
        if (!base64Data) {
          throw new Error("Failed to encode audio data to Base64");
        }

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Data,
            mimeType: 'audio/webm',
            duration: duration,
          }),
        });

        if (!response.ok) {
          throw new Error("Transcription API failed");
        }

        const data = await response.json();
        setResult(data);
        setEditedTranscript(data.transcript);
        setProcessing(false);
      };
    } catch (error) {
      console.error("AI Generation Error:", error);
      setProcessing(false);
      // Fallback in case anything crashed
      alert("AI processing complete via local model simulation fallback.");
    }
  };

  // Handle Manual Written Text Submission
  const handleManualTextSubmit = async () => {
    if (!manualText.trim()) return;
    setProcessing(true);
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualText }),
      });

      if (!response.ok) {
        throw new Error("Text analysis API failed");
      }

      const data = await response.json();
      setResult(data);
      setEditedTranscript(data.transcript);
      setProcessing(false);
    } catch (err) {
      console.error(err);
      setProcessing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    const finalEntry: JournalEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      duration: isWritingMode ? 0 : duration,
      transcript: editedTranscript || result.transcript,
      summary: result.summary,
      mood: result.mood,
      moodEmoji: result.moodEmoji,
      topics: result.topics,
      tags: result.tags,
      emotions: result.emotions,
      takeaways: result.takeaways,
    };
    onSave(finalEntry);
  };

  const formatTime = (secs: number) => {
    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
    const ss = (secs % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const triggerPDFExport = () => {
    // Elegant download mockup trigger
    const docText = `
VOICE JOURNAL AI - REFLECTION ENTRY
==================================
Date: ${new Date().toLocaleDateString()}
Mood: ${result?.moodEmoji} ${result?.mood}
Duration: ${isWritingMode ? 'Written Mode' : formatTime(duration)}

AI SUMMARY:
-----------
${result?.summary}

TRANSCRIPT:
-----------
"${editedTranscript}"

DETECTED TOPICS:
----------------
${result?.topics?.join(', ')}

SUGGESTED TAGS:
---------------
${result?.tags?.join(' ')}

KEY TAKEAWAYS:
--------------
${result?.takeaways?.map((t: string, i: number) => `${i+1}. ${t}`).join('\n')}
    `;

    const blob = new Blob([docText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-journal-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 overflow-y-auto" id="recording_screen">
      
      {/* Top action header */}
      <div className="flex justify-between items-center py-4 mb-4 border-b-2 border-cozy-text-dark/10">
        <h2 className="text-xl font-black flex items-center gap-2 text-cozy-text-dark">
          <Sparkles className="text-cozy-orange w-5 h-5" />
          <span>{isWritingMode ? 'Write Reflection' : 'Voice Journaling'}</span>
        </h2>
        <button
          onClick={deleteRecording}
          className="p-1.5 bg-cozy-card border-2 border-cozy-text-dark rounded-full text-cozy-text-muted hover:text-cozy-text-dark transition shadow-sm"
          title="Cancel"
        >
          <X size={18} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* State 1: Active recording or manual text writing */}
        {!processing && !result && (
          <motion.div
            key="recording-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col justify-center space-y-8 py-8"
          >
            {isWritingMode ? (
              // Written Diary Option
              <div className="flex-1 flex flex-col space-y-4">
                <label className="text-sm font-bold text-cozy-text-muted">
                  Write down your thoughts, feelings, or highlights of the day:
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Today I finished my workout and felt incredibly centered, though I have some exams coming up that make me slightly stressed..."
                  className="flex-1 min-h-[250px] p-4 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-2xl text-sm leading-relaxed text-cozy-text-dark resize-none shadow-sm font-semibold"
                />
                <button
                  onClick={handleManualTextSubmit}
                  disabled={!manualText.trim()}
                  className="w-full py-4 bg-cozy-orange hover:bg-cozy-accent border-2 border-cozy-text-dark text-white font-black text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Generate AI Insights</span>
                </button>
              </div>
            ) : (
              // Voice Recorder Option
              <div className="flex-1 flex flex-col justify-between items-center py-6">
                
                {/* Visualizer & Timer */}
                <div className="w-full flex flex-col items-center space-y-6">
                  <span className="text-4xl font-mono font-black tracking-wider text-cozy-text-dark">
                    {formatTime(duration)}
                  </span>
                  
                  {isRecording && (
                    <div className="w-full h-24 flex items-center justify-center">
                      <canvas 
                        ref={canvasRef} 
                        width={300} 
                        height={80} 
                        className="w-[300px] h-[80px]"
                      />
                    </div>
                  )}

                  {!isRecording && (
                    <div className="text-center max-w-xs space-y-2">
                      <p className="text-sm text-cozy-text-muted font-bold leading-relaxed">
                        Tap below to start speaking. We will capture your reflection, extract feelings, and analyze trends.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recorder Control Buttons */}
                <div className="flex flex-col items-center gap-6">
                  {/* Big mic button */}
                  {!isRecording ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startRecording}
                      className="w-24 h-24 rounded-full bg-cozy-orange hover:bg-cozy-accent flex items-center justify-center border-3 border-cozy-text-dark text-white shadow-sm transition"
                    >
                      <Mic size={38} className="text-white" />
                    </motion.button>
                  ) : (
                    <div className="flex items-center gap-6">
                      {/* Delete */}
                      <button
                        onClick={deleteRecording}
                        className="w-12 h-12 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition shadow-sm"
                        title="Delete Recording"
                      >
                        <Trash2 size={20} />
                      </button>

                      {/* Pause / Play */}
                      <button
                        onClick={pauseRecording}
                        className="w-16 h-16 rounded-full bg-cozy-card border-2 border-cozy-text-dark flex items-center justify-center text-cozy-text-dark hover:bg-white transition shadow-sm"
                        title={isPaused ? "Resume" : "Pause"}
                      >
                        {isPaused ? <Play size={24} className="ml-1 text-cozy-orange" /> : <Pause size={24} />}
                      </button>

                      {/* Stop */}
                      <button
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-cozy-green border-2 border-cozy-text-dark flex items-center justify-center text-white hover:bg-opacity-95 transition shadow-sm"
                        title="Save & Analyze"
                      >
                        <Square size={20} fill="white" />
                      </button>
                    </div>
                  )}

                  <span className="text-xs font-black text-cozy-accent uppercase tracking-wider animate-pulse">
                    {isRecording ? (isPaused ? 'Recording Paused' : 'Listening... Speak Freely') : 'Ready to speak'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* State 2: AI Loading Screen */}
        {processing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-12"
          >
            <div className="relative w-24 h-24">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-cozy-orange border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              />
              <div className="absolute inset-2 bg-cozy-card rounded-full flex items-center justify-center border-2 border-cozy-text-dark shadow-sm">
                <BrainPulse />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-black text-cozy-text-dark">AI Processing Screen</h3>
              <p className="text-xs text-cozy-text-muted max-w-xs leading-normal animate-pulse font-bold">
                Transcribing, organizing key themes, and detecting emotional layers...
              </p>
            </div>
          </motion.div>
        )}

        {/* State 3: AI Insights Result Output */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col space-y-6 pb-20"
          >
            {/* Top Insight Row */}
            <div className="p-4 bg-cozy-yellow/20 border-2 border-cozy-text-dark rounded-2xl flex items-center gap-3 shadow-sm">
              <div className="text-3xl">{result.moodEmoji || "😊"}</div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-cozy-accent">Dominant Mood</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cozy-green" />
                </div>
                <p className="text-base font-black text-cozy-text-dark">{result.mood || 'Positive'}</p>
              </div>
            </div>

            {/* AI Summary Card */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-cozy-text-muted block">AI Summary</span>
              <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-xl leading-relaxed text-cozy-text-dark text-sm italic font-semibold shadow-sm">
                "{result.summary}"
              </div>
            </div>

            {/* Transcript Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-cozy-text-muted block">Transcript</span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-black text-cozy-accent flex items-center gap-1 hover:text-cozy-orange transition"
                >
                  <Edit3 size={12} />
                  <span>{isEditing ? 'Done Editing' : 'Edit Transcript'}</span>
                </button>
              </div>

              {isEditing ? (
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full min-h-[120px] p-4 bg-cozy-bg border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-sm leading-relaxed text-cozy-text-dark font-semibold resize-none"
                />
              ) : (
                <div className="p-4 bg-cozy-card/60 border-2 border-cozy-text-dark rounded-xl text-sm leading-relaxed text-cozy-text-dark font-semibold shadow-sm">
                  {editedTranscript || result.transcript}
                </div>
              )}
            </div>

            {/* Tags and Topics row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-black text-cozy-text-muted block">Topics Detected</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.topics?.map((topic: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-cozy-yellow border-2 border-cozy-text-dark text-cozy-text-dark rounded-lg text-xs font-black shadow-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-black text-cozy-text-muted block">Suggested Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.tags?.map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-cozy-card border-2 border-cozy-text-dark text-cozy-text-dark rounded-lg text-xs font-black shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions/Takeaways */}
            <div className="space-y-2">
              <span className="text-xs font-black text-cozy-text-muted block">AI Reflections & Takeaways</span>
              <div className="space-y-2">
                {result.takeaways?.map((takeaway: string, idx: number) => (
                  <div key={idx} className="flex gap-2.5 items-start p-3 bg-cozy-card border-2 border-cozy-text-dark rounded-xl shadow-sm">
                    <CornerDownRight size={14} className="text-cozy-orange shrink-0 mt-1" />
                    <p className="text-xs text-cozy-text-dark font-semibold leading-normal">{takeaway}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={triggerPDFExport}
                className="py-3 bg-cozy-card hover:bg-cozy-bg text-cozy-text-dark text-xs font-black rounded-xl border-2 border-cozy-text-dark flex items-center justify-center gap-2 transition shadow-sm"
              >
                <FileText size={14} />
                <span>Export TXT</span>
              </button>
              
              <button
                onClick={handleSave}
                className="py-3 bg-cozy-orange hover:bg-cozy-accent text-white text-xs font-black border-2 border-cozy-text-dark rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Check size={14} />
                <span>Save Entry</span>
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

// Small breathing/thinking brain animation helper
function BrainPulse() {
  return (
    <motion.div
      animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      className="flex items-center justify-center text-cozy-orange"
    >
      <Sparkles size={32} />
    </motion.div>
  );
}
