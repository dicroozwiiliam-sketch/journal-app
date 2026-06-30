/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JournalEntry {
  id: string;
  date: string; // ISO String
  duration: number; // in seconds
  transcript: string;
  summary: string;
  mood: string; // e.g. "Positive", "Calm", "Reflective", etc.
  moodEmoji: string; // 😊, 😐, 😔, 😡, 😴, 😍
  topics: string[];
  tags: string[];
  emotions: string[];
  takeaways: string[];
}

export interface Goal {
  id: string;
  title: string;
  category: 'Personal' | 'Fitness' | 'Reading' | 'Career' | 'Habit';
  progress: number; // 0 to 100
  deadline: string; // YYYY-MM-DD
  actions: string[]; // AI Suggested Actions
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  history: Record<string, boolean>; // 'YYYY-MM-DD' -> true/false
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  unlocked: boolean;
  unlockedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  audio?: string; // base64 audio if TTS is generated
}

export interface MoodLog {
  date: string; // YYYY-MM-DD
  emoji: string;
  score: number; // 1 to 5 or 1 to 10
}
