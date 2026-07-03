/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Brain, Volume2, User, Play, Square, MessageSquare, AlertCircle } from 'lucide-react';
import { JournalEntry, ChatMessage } from '../types';

interface AiCoachProps {
  entries: JournalEntry[];
}

export default function AiCoach({ entries }: AiCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: "Hello! I am your AI Life Coach. I've analyzed your diary reflections. Ask me anything about your stress levels, habits, emotional trends, or how to improve your personal discipline.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Suggested Coaching Questions
  const suggestions = [
    "Why have I been stressed recently?",
    "What makes me happy?",
    "Summarize my month.",
    "How can I improve my discipline?",
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Gather relevant history
      const coachHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      // Call Express server-side /api/coach
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: coachHistory,
          entries: entries,
        }),
      });

      if (!response.ok) throw new Error("Coach API request failed");
      const data = await response.json();

      const coachMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'coach',
        text: data.reply || "I am reflecting on your entry. Let's work together to unlock self-understanding.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'error',
        sender: 'coach',
        text: "I encountered a slight friction in my digital synapses, but I'm here. How is your focus and physical energy feeling today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const speakReply = async (msg: ChatMessage) => {
    if (speakingMsgId === msg.id) {
      stopSpeaking();
      return;
    }

    setSpeakingMsgId(msg.id);

    const playLocalSpeechFallback = () => {
      console.log("Using browser SpeechSynthesis fallback");
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(msg.text);
        utterance.rate = 1.05;
        utterance.onend = () => {
          setSpeakingMsgId(null);
        };
        utterance.onerror = () => {
          setSpeakingMsgId(null);
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Local speech synthesis failed:", err);
        setSpeakingMsgId(null);
      }
    };

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text }),
      });

      if (!response.ok) throw new Error("TTS failed");
      const data = await response.json();

      if (data.audio && !data.fallback) {
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        let player = audioRef.current;
        if (!player) {
          player = new Audio();
          audioRef.current = player;
        }

        player.onerror = (e) => {
          console.warn("Audio element encountered source error, falling back to speech synthesis:", e);
          playLocalSpeechFallback();
        };

        player.onended = () => {
          setSpeakingMsgId(null);
        };

        player.src = audioSrc;
        player.play().catch((playError) => {
          console.warn("Audio playback promise rejected or aborted, falling back to speech synthesis:", playError);
          playLocalSpeechFallback();
        });
      } else {
        playLocalSpeechFallback();
      }
    } catch (err) {
      console.warn("TTS fetch or initialize failed, falling back to speech synthesis:", err);
      playLocalSpeechFallback();
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-4 md:p-8 pb-20" id="ai_coach_tab">
      
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-1.5 text-cozy-text-dark">
          <Brain className="text-cozy-orange w-6 h-6 animate-pulse" />
          <span>AI Life Coach</span>
        </h2>
        <p className="text-xs text-cozy-text-muted font-bold">Mindful guidance, backed by your journal data</p>
      </div>
 
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-3 pr-1 h-[420px] md:h-[550px] max-h-[50vh] md:max-h-[68vh]" id="coach_chat_box">
        {messages.map((msg) => {
          const isCoach = msg.sender === 'coach';
          const isSpeakingThis = speakingMsgId === msg.id;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isCoach ? 'justify-start' : 'justify-end'}`}
            >
              {/* Avatar Icon */}
              {isCoach && (
                <div className="w-8 h-8 rounded-xl bg-cozy-orange text-white border-2 border-cozy-text-dark flex items-center justify-center shrink-0 shadow-sm">
                  <Brain size={16} />
                </div>
              )}
 
              <div className="max-w-[80%] flex flex-col">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed border-2 border-cozy-text-dark font-semibold shadow-sm ${
                    isCoach
                      ? 'bg-cozy-card text-cozy-text-dark rounded-tl-sm'
                      : 'bg-cozy-orange text-white rounded-tr-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
 
                {/* Speaker TTS Trigger for Coach message */}
                <div className={`flex items-center gap-2 mt-1.5 px-1 text-[9px] text-cozy-text-muted font-bold ${!isCoach && 'justify-end'}`}>
                  <span>{msg.timestamp}</span>
                  {isCoach && (
                    <button
                      onClick={() => speakReply(msg)}
                      className={`flex items-center gap-1 font-black ${
                        isSpeakingThis ? 'text-cozy-accent animate-pulse' : 'text-cozy-accent hover:text-cozy-orange'
                      }`}
                    >
                      <Volume2 size={11} />
                      <span>{isSpeakingThis ? 'Speaking...' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
 
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cozy-orange text-white border-2 border-cozy-text-dark flex items-center justify-center shrink-0 shadow-sm">
              <Brain size={16} />
            </div>
            <div className="p-3 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cozy-orange animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cozy-orange animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-cozy-orange animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
 
        <div ref={messagesEndRef} />
      </div>
 
      {/* Suggestion Prompts */}
      {messages.length === 1 && !loading && (
        <div className="space-y-2 shrink-0 mb-3">
          <span className="text-[10px] uppercase font-black tracking-wider text-cozy-text-muted px-1">Ask your journal helper</span>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="p-3 bg-cozy-card hover:bg-white border-2 border-cozy-text-dark text-cozy-text-dark rounded-xl text-left text-[11px] leading-normal transition font-black shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
 
      {/* Form Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="flex gap-2.5 items-center shrink-0 border-t-2 border-cozy-text-dark/10 pt-3"
      >
        <input
          type="text"
          placeholder="Ask coach e.g., Why was I stressed on Tuesday?"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs text-cozy-text-dark font-semibold transition shadow-sm"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="p-3 bg-cozy-orange hover:bg-cozy-accent disabled:opacity-50 text-white rounded-xl border-2 border-cozy-text-dark transition shadow-sm shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
 
    </div>
  );
}
