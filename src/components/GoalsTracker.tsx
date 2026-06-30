/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Target, CheckCircle2, Award, Sparkles, Plus, Calendar, Trash2, Zap, Hourglass, Check } from 'lucide-react';
import { Goal, Habit } from '../types';

interface GoalsTrackerProps {
  goals: Goal[];
  habits: Habit[];
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onToggleHabit: (id: string, date: string) => void;
  onAddHabit: (name: string) => void;
}

export default function GoalsTracker({
  goals,
  habits,
  onAddGoal,
  onDeleteGoal,
  onToggleHabit,
  onAddHabit,
}: GoalsTrackerProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  
  // Create Goal fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Personal' | 'Fitness' | 'Reading' | 'Career' | 'Habit'>('Career');
  const [deadline, setDeadline] = useState('');

  // Create Custom Habit field
  const [customHabitName, setCustomHabitName] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Generate smart mock suggestions from the AI Goal Assistant based on the goal category!
    let actions: string[] = [];
    if (category === 'Fitness') {
      actions = ["Exercise for 20 minutes today.", "Drink 3 liters of water.", "Stretch for 5 minutes before bed."];
    } else if (category === 'Reading') {
      actions = ["Read 10 pages of your current book.", "Reflect on one key concept.", "Set a quiet 15-minute reading slot."];
    } else if (category === 'Career') {
      actions = ["Review your core resume or CV.", "Practice answering 2 mock interviews.", "Connect with one industry peer."];
    } else if (category === 'Habit') {
      actions = ["Avoid screen time first 30 mins.", "Log your habit in your journal.", "Keep an offline habit log."];
    } else {
      actions = ["Dedicate 10 minutes to mindfulness.", "Do one task you've been delaying.", "Write down three things you are grateful for."];
    }

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      progress: 0,
      deadline: deadline || "2026-12-31",
      actions,
    };

    onAddGoal(newGoal);
    setTitle('');
    setDeadline('');
    setShowAddGoal(false);

    // Celebrate goal creation!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6C63FF', '#A78BFA', '#F59E0B']
    });
  };

  const handleHabitToggle = (habit: Habit) => {
    onToggleHabit(habit.id, todayStr);
    
    // If we completed it, let's trigger confetti and play a pleasant visual effect
    const isNowCompleted = !habit.history[todayStr];
    if (isNowCompleted) {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10B981', '#6C63FF']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10B981', '#6C63FF']
      });
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHabitName.trim()) return;
    onAddHabit(customHabitName.trim());
    setCustomHabitName('');
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 pb-20" id="goals_tab">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Focus & Goals</h2>
          <p className="text-xs text-cozy-text-muted font-bold">Track goals & build daily habits</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="p-2.5 bg-cozy-orange hover:bg-cozy-accent rounded-xl transition text-white border-2 border-cozy-text-dark shadow-sm"
          id="add_goal_btn"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>
 
      {/* Goal Creation Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-[#4A3D30]/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xs bg-cozy-card border-2 border-cozy-text-dark rounded-2xl p-5 shadow-lg relative text-cozy-text-dark"
          >
            <h3 className="text-base font-black text-cozy-text-dark mb-4">Create New Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-[10px] text-cozy-text-muted font-black uppercase tracking-wider block mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="Learn French"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-cozy-bg border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs text-cozy-text-dark font-semibold transition"
                  required
                />
              </div>
 
              <div>
                <label className="text-[10px] text-cozy-text-muted font-black uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-cozy-bg border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs text-cozy-text-dark font-semibold transition"
                >
                  <option value="Personal">Personal Goal</option>
                  <option value="Fitness">Fitness Goal</option>
                  <option value="Reading">Reading Goal</option>
                  <option value="Career">Career Goal</option>
                  <option value="Habit">Habit Goal</option>
                </select>
              </div>
 
              <div>
                <label className="text-[10px] text-cozy-text-muted font-black uppercase tracking-wider block mb-1">Target Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-cozy-bg border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs text-cozy-text-dark font-semibold transition"
                />
              </div>
 
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 py-2 bg-cozy-card border-2 border-cozy-text-dark hover:bg-cozy-bg text-cozy-text-dark font-black text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-cozy-orange hover:bg-cozy-accent border-2 border-cozy-text-dark text-white font-black text-xs rounded-xl transition"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
 
      {/* Goal Cards */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-black text-cozy-text-muted uppercase tracking-wider px-1">Active Targets</h3>
        
        {goals.map((goal) => {
          const isCompleted = goal.progress >= 100;
          return (
            <div
              key={goal.id}
              className="p-4 bg-cozy-card border-2 border-cozy-text-dark rounded-2xl relative overflow-hidden shadow-sm"
            >
              {/* Category tag */}
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-cozy-yellow border-2 border-cozy-text-dark text-cozy-text-dark rounded-full shadow-sm">
                  {goal.category}
                </span>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="p-1 hover:bg-cozy-bg text-cozy-text-muted hover:text-rose-600 rounded-lg transition"
                  title="Remove Goal"
                >
                  <Trash2 size={13} />
                </button>
              </div>
 
              {/* Goal Title */}
              <h4 className="text-sm font-black text-cozy-text-dark mb-2">{goal.title}</h4>
 
              {/* Progress Slider Bar */}
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-cozy-text-muted">Progress</span>
                  <span className="text-cozy-accent font-black">{goal.progress}%</span>
                </div>
                <div className="w-full h-3 bg-cozy-bg border-2 border-cozy-text-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cozy-orange rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
 
              {/* AI Suggestions Accordion */}
              {goal.actions && goal.actions.length > 0 && (
                <div className="p-3 bg-cozy-yellow/20 border-2 border-cozy-text-dark rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-cozy-accent uppercase tracking-wider">
                    <Sparkles size={11} />
                    <span>AI Goal Assistant Tips</span>
                  </div>
                  <div className="space-y-1.5">
                    {goal.actions.map((act, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-cozy-text-dark font-semibold">
                        <span className="text-cozy-green font-black shrink-0">✓</span>
                        <p className="text-[11px] leading-relaxed text-cozy-text-muted">{act}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
 
              {/* Goal Status Footer */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-cozy-text-dark/10 text-[10px] text-cozy-text-muted font-bold">
                <span className="flex items-center gap-1">
                  <Hourglass size={11} />
                  <span>Deadline: {goal.deadline}</span>
                </span>
                {isCompleted && (
                  <span className="text-cozy-green font-black flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Goal Completed</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
 
      {/* Habits Tracker */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black text-cozy-text-muted uppercase tracking-wider">Habit Tracker</h3>
          <span className="text-[10px] font-black text-cozy-green">Streak Mode</span>
        </div>
 
        {/* Daily habits checklist */}
        <div className="space-y-2">
          {habits.map((habit) => {
            const isCompletedToday = !!habit.history[todayStr];
            return (
              <div
                key={habit.id}
                onClick={() => handleHabitToggle(habit)}
                className={`p-3.5 border-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                  isCompletedToday
                    ? 'bg-cozy-green/25 border-cozy-text-dark text-cozy-text-dark shadow-sm'
                    : 'bg-cozy-card border-cozy-text-dark hover:border-cozy-text-dark text-cozy-text-dark'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Custom checkbox */}
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition ${
                    isCompletedToday 
                      ? 'bg-cozy-green border-cozy-text-dark text-white' 
                      : 'border-cozy-text-dark bg-cozy-bg'
                  }`}>
                    {isCompletedToday && <Check size={12} className="stroke-[3]" />}
                  </div>
                  <div>
                    <p className="text-xs font-black">{habit.name}</p>
                    <p className="text-[10px] text-cozy-text-muted mt-0.5 font-bold">Today's Check-in</p>
                  </div>
                </div>
 
                <div className="flex items-center gap-1.5 bg-cozy-bg border-2 border-cozy-text-dark px-2 py-0.5 rounded-lg shadow-sm">
                  <Zap size={12} className={isCompletedToday ? "text-cozy-orange fill-cozy-orange" : "text-cozy-text-muted"} />
                  <span className="text-[10px] font-black text-cozy-text-dark">{habit.streak}d</span>
                </div>
              </div>
            );
          })}
        </div>
 
        {/* Add custom habit form */}
        <form onSubmit={handleCreateHabit} className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Add Custom Habit (e.g. Code 1 hour)"
            value={customHabitName}
            onChange={(e) => setCustomHabitName(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs text-cozy-text-dark font-semibold transition shadow-sm"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-cozy-orange hover:bg-cozy-accent border-2 border-cozy-text-dark font-black text-xs rounded-xl transition text-white shrink-0 shadow-sm"
          >
            Add
          </button>
        </form>
      </div>
 
    </div>
  );
}
