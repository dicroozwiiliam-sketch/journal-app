/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Heart, Activity, Target, ShieldAlert, Award, Brain, TrendingUp, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { JournalEntry } from '../types';

interface MoodAnalyticsProps {
  entries: JournalEntry[];
}

export default function MoodAnalytics({ entries }: MoodAnalyticsProps) {
  const [activeChart, setActiveChart] = useState<'Weekly' | 'Monthly' | 'Trends'>('Weekly');

  // Map mood emoji to a score out of 5 for charting
  const getMoodScore = (emoji: string): number => {
    switch (emoji) {
      case '😍': return 5; // Excited
      case '😊': return 4; // Happy
      case '😐': return 3; // Neutral
      case '😴': return 2; // Tired
      case '😔': return 1; // Sad
      case '😡': return 1; // Angry
      default: return 3;
    }
  };

  const getMoodEmojiByScore = (score: number) => {
    if (score >= 4.5) return '😍';
    if (score >= 3.5) return '😊';
    if (score >= 2.5) return '😐';
    if (score >= 1.5) return '😴';
    return '😔';
  };

  // Generate chart data based on real entries or defaults if empty
  const getChartData = () => {
    if (activeChart === 'Weekly') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day, idx) => {
        // Mock default to show nice trends, but try to match real entries if possible
        const matched = entries.find(e => {
          const d = new Date(e.date);
          return d.getDay() === (idx + 1) % 7;
        });
        const score = matched ? getMoodScore(matched.moodEmoji) : [3, 4, 3, 2, 4, 5, 4][idx];
        return { name: day, score };
      });
    } else if (activeChart === 'Monthly') {
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      return weeks.map((week, idx) => {
        return { name: week, score: [3.4, 4.0, 3.1, 4.2][idx] };
      });
    } else {
      // Trends: composite of sleep, energy, stress
      return [
        { name: 'Mon', stress: 3, energy: 4, focus: 3 },
        { name: 'Tue', stress: 4, energy: 3, focus: 4 },
        { name: 'Wed', stress: 2, energy: 5, focus: 5 },
        { name: 'Thu', stress: 5, energy: 2, focus: 2 },
        { name: 'Fri', stress: 3, energy: 4, focus: 4 },
        { name: 'Sat', stress: 1, energy: 5, focus: 5 },
        { name: 'Sun', stress: 2, energy: 4, focus: 3 },
      ];
    }
  };

  const chartData = getChartData();

  // Last 30 days grid data for mood logs calendar
  const getCalendarDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      
      // Match entry
      const entry = entries.find(e => new Date(e.date).toDateString() === d.toDateString());
      days.push({
        date: d.getDate(),
        isToday: d.toDateString() === now.toDateString(),
        emoji: entry ? entry.moodEmoji : (i % 7 === 0 ? '😐' : (i % 11 === 0 ? '😴' : '😊')),
        hasEntry: !!entry
      });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 pb-20" id="analytics_tab">
      
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Emotional Health</h2>
        <p className="text-xs text-cozy-text-muted font-bold">Personal analytics, trends & AI patterns</p>
      </div>
 
      {/* 4 Score Cards Bento-Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Emotional Health */}
        <div className="p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-pink-100 text-pink-600 border border-pink-200 rounded-lg shrink-0">
            <Heart size={18} fill="currentColor" className="fill-pink-500/20" />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-cozy-text-muted">Emotional</p>
            <p className="text-lg font-black text-cozy-text-dark">88%</p>
          </div>
        </div>
 
        {/* Productivity */}
        <div className="p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-cozy-text-muted">Productivity</p>
            <p className="text-lg font-black text-cozy-text-dark">72%</p>
          </div>
        </div>
 
        {/* Confidence */}
        <div className="p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-amber-100 text-amber-600 border border-amber-200 rounded-lg shrink-0">
            <Target size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-cozy-text-muted">Confidence</p>
            <p className="text-lg font-black text-cozy-text-dark">81%</p>
          </div>
        </div>
 
        {/* Stress */}
        <div className="p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl flex items-center gap-3 shadow-sm">
          <div className="p-2 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-black tracking-wider text-cozy-text-muted">Stress Level</p>
            <p className="text-lg font-black text-cozy-text-dark">Low</p>
          </div>
        </div>
      </div>
 
      {/* Chart Selector Tab bar */}
      <div className="bg-cozy-card p-1 rounded-xl flex gap-1 mb-4 border-2 border-cozy-text-dark shadow-sm">
        {(['Weekly', 'Monthly', 'Trends'] as const).map((chartType) => (
          <button
            key={chartType}
            onClick={() => setActiveChart(chartType)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition border-2 ${
              activeChart === chartType 
                ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                : 'text-cozy-text-muted border-transparent hover:text-cozy-text-dark'
            }`}
          >
            {chartType}
          </button>
        ))}
      </div>
 
      {/* Chart Canvas Area */}
      <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl mb-6 shadow-sm">
        <h4 className="text-xs font-black text-cozy-text-dark mb-4 flex items-center gap-1.5">
          <TrendingUp size={14} className="text-cozy-orange" />
          <span>{activeChart === 'Weekly' ? 'Weekly Mood Timeline' : activeChart === 'Monthly' ? 'Monthly Average Mood' : 'Stress & Energy Trends'}</span>
        </h4>
 
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            {activeChart === 'Weekly' || activeChart === 'Monthly' ? (
              <LineChart data={chartData as any} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#7A6956" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#7A6956" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[1, 5]}
                  tickFormatter={(val) => {
                    if (val === 5) return '😍';
                    if (val === 4) return '😊';
                    if (val === 3) return '😐';
                    if (val === 2) return '😴';
                    if (val === 1) return '😔';
                    return '';
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FAF6EB', borderColor: '#4A3D30', borderRadius: '12px', border: '2px solid #4A3D30' }}
                  labelStyle={{ color: '#4A3D30', fontWeight: 'bold' }}
                  itemStyle={{ color: '#4A3D30' }}
                  formatter={(value: any) => [`Score: ${value} (${getMoodEmojiByScore(value)})`, 'Mood']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#E08E6D" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, stroke: '#4A3D30', fill: '#E6C585' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData as any} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#7A6956" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#7A6956" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FAF6EB', borderColor: '#4A3D30', borderRadius: '12px', border: '2px solid #4A3D30' }} />
                <Area type="monotone" dataKey="stress" stroke="#E08E6D" fill="rgba(224, 142, 109, 0.1)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="energy" stroke="#96A376" fill="rgba(150, 163, 118, 0.1)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="focus" stroke="#E6C585" fill="rgba(230, 197, 133, 0.1)" strokeWidth={2.5} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
 
      {/* Mood Grid Calendar View */}
      <div className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl mb-6 shadow-sm">
        <h4 className="text-xs font-black text-cozy-text-dark mb-3 flex items-center gap-1.5">
          <CalendarIcon size={14} className="text-cozy-orange" />
          <span>Last 30 Days Mood Grid</span>
        </h4>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border-2 text-center transition ${
                day.isToday 
                  ? 'bg-cozy-yellow/30 border-cozy-text-dark font-black shadow-sm' 
                  : 'bg-cozy-bg border-cozy-text-dark/20 hover:border-cozy-text-dark'
              }`}
            >
              <span className="text-[8px] text-cozy-text-muted font-bold mb-1">{day.date}</span>
              <span className="text-base select-none">{day.emoji}</span>
            </div>
          ))}
        </div>
      </div>
 
      {/* AI Observations Panel */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-cozy-text-dark flex items-center gap-1.5 px-1">
          <Brain size={14} className="text-cozy-orange" />
          <span>AI Insights & Observations</span>
        </h4>
 
        <div className="space-y-2.5">
          {/* Observation 1 */}
          <div className="p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl flex gap-3 items-start shadow-sm">
            <span className="text-lg">📈</span>
            <div>
              <p className="text-xs font-black text-cozy-text-dark">Trigger Pattern Detected</p>
              <p className="text-[11px] text-cozy-text-muted mt-1 leading-normal font-bold">
                Your confidence and emotional health index increases by <span className="text-cozy-orange font-black">14%</span> after discussing physical fitness and hitting your goals.
              </p>
            </div>
          </div>
 
          {/* Observation 2 */}
          <div className="p-3.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl flex gap-3 items-start shadow-sm">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-xs font-black text-cozy-text-dark">Stress Correlation</p>
              <p className="text-[11px] text-cozy-text-muted mt-1 leading-normal font-bold">
                You frequently mention 'exams' and 'startup ideas' in consecutive entries, leading to elevated stress. Try taking a deep breathing pause.
              </p>
            </div>
          </div>
 
          {/* Observation 3 */}
          <div className="p-3.5 bg-cozy-yellow/20 border-2 border-cozy-text-dark rounded-xl flex gap-3 items-start shadow-sm">
            <Sparkles size={16} className="text-cozy-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-cozy-accent">Habit Suggestion</p>
              <p className="text-[11px] text-cozy-text-dark mt-1 leading-normal font-semibold">
                "You feel happier on weekends and more creative during early-morning recordings. Try establishing a 5-minute meditation streak."
              </p>
            </div>
          </div>
        </div>
      </div>
 
    </div>
  );
}
