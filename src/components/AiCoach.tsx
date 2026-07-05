/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Flame, 
  BookOpen, 
  Award, 
  PenTool, 
  Check, 
  RotateCcw, 
  Info, 
  ListTodo,
  TrendingUp,
  X
} from 'lucide-react';
import { JournalEntry, Goal, Habit } from '../types';

interface AiCoachProps {
  entries: JournalEntry[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  onNavigateToEntry?: (id: string) => void;
  onCreatePageForDate?: (date: Date) => void;
}

export default function AiCoach({ 
  entries, 
  goals, 
  setGoals, 
  habits, 
  setHabits, 
  onNavigateToEntry, 
  onCreatePageForDate 
}: AiCoachProps) {
  
  // State for forms
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'Personal' | 'Fitness' | 'Reading' | 'Career' | 'Habit'>('Personal');
  const [goalDeadline, setGoalDeadline] = useState('2026-07-31');
  const [goalActionsInput, setGoalActionsInput] = useState('');

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [habitName, setHabitName] = useState('');

  // AI Sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Persistent track of checked subtasks of goals
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('voice_journal_completed_goal_tasks');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('voice_journal_completed_goal_tasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  // Helpers for past dates
  const past7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  }, []);

  const formatDateKey = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDayLabel = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  // Streak calculator
  const calculateStreak = (history: Record<string, boolean>) => {
    let streak = 0;
    const d = new Date();
    const todayKey = formatDateKey(d);
    let checkDate = d;

    // If today is not done, check if yesterday was done. If neither is done, streak is 0.
    if (!history[todayKey]) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = formatDateKey(yesterday);
      if (!history[yesterdayKey]) {
        return 0;
      }
      checkDate = yesterday;
    }

    while (true) {
      const key = formatDateKey(checkDate);
      if (history[key]) {
        streak++;
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // Toggle subtask within a goal
  const handleToggleGoalTask = (goalId: string, taskIdx: number) => {
    const taskKey = `${goalId}-${taskIdx}`;
    const wasChecked = !!completedTasks[taskKey];
    const newCompleted = { ...completedTasks, [taskKey]: !wasChecked };
    setCompletedTasks(newCompleted);

    // Recalculate goal progress
    setGoals(prevGoals => {
      return prevGoals.map(g => {
        if (g.id === goalId) {
          const totalTasks = g.actions.length || 1;
          const completedCount = g.actions.filter((_, idx) => {
            const currentKey = `${g.id}-${idx}`;
            // account for the toggling state that is not in state yet
            return currentKey === taskKey ? !wasChecked : !!newCompleted[currentKey];
          }).length;
          const progress = Math.round((completedCount / totalTasks) * 100);
          return { ...g, progress };
        }
        return g;
      });
    });
  };

  // Toggle habit on a specific date
  const handleToggleHabitDay = (habitId: string, dateKey: string) => {
    setHabits(prevHabits => {
      return prevHabits.map(h => {
        if (h.id === habitId) {
          const wasChecked = !!h.history[dateKey];
          const newHistory = { ...h.history, [dateKey]: !wasChecked };
          const streak = calculateStreak(newHistory);
          return {
            ...h,
            streak,
            history: newHistory
          };
        }
        return h;
      });
    });
  };

  // Add new Goal
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const actionList = goalActionsInput
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: goalTitle,
      category: goalCategory,
      progress: 0,
      deadline: goalDeadline,
      actions: actionList.length > 0 ? actionList : ["Initiate action steps"]
    };

    setGoals(prev => [newGoal, ...prev]);
    setGoalTitle('');
    setGoalActionsInput('');
    setShowAddGoal(false);
  };

  // Add new Habit
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      name: habitName,
      streak: 0,
      history: {}
    };

    setHabits(prev => [newHabit, ...prev]);
    setHabitName('');
    setShowAddHabit(false);
  };

  // Delete handlers
  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    // Clean up task completions
    setCompletedTasks(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(key => {
        if (key.startsWith(`${id}-`)) {
          delete copy[key];
        }
      });
      return copy;
    });
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // Journal Connections Search Pattern matching
  const getConnectedJournalsForGoal = (goal: Goal) => {
    const titleWords = goal.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return entries.filter(entry => {
      const text = (entry.transcript + ' ' + entry.summary + ' ' + entry.topics.join(' ') + ' ' + entry.tags.join(' ')).toLowerCase();
      const categoryMatch = entry.topics.some(t => t.toLowerCase() === goal.category.toLowerCase());
      const wordMatch = titleWords.some(w => text.includes(w)) || text.includes(goal.title.toLowerCase());
      return categoryMatch || wordMatch;
    });
  };

  const getConnectedJournalsForHabit = (habit: Habit) => {
    const nameWords = habit.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return entries.filter(entry => {
      const text = (entry.transcript + ' ' + entry.summary + ' ' + entry.topics.join(' ') + ' ' + entry.tags.join(' ')).toLowerCase();
      const wordMatch = nameWords.some(w => text.includes(w)) || text.includes(habit.name.toLowerCase());
      return wordMatch;
    });
  };

  // AI Journal Scanning to automatically sync completions!
  const runJournalSync = () => {
    setIsSyncing(true);
    setSyncLogs([]);
    
    setTimeout(() => {
      const logs: string[] = [];
      const updatedHabits = [...habits];
      const updatedGoals = [...goals];
      const newCompletedTasks = { ...completedTasks };
      let changedHabits = false;
      let changedGoals = false;

      // Scan entries from last 7 days
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 7);

      const recentEntries = entries.filter(e => new Date(e.date) >= limitDate);

      recentEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dateKey = formatDateKey(entryDate);
        const text = (entry.transcript + ' ' + entry.summary + ' ' + entry.topics.join(' ') + ' ' + entry.tags.join(' ')).toLowerCase();

        // 1. Habit syncing
        updatedHabits.forEach((habit) => {
          const nameLower = habit.name.toLowerCase();
          
          // Determine matches based on habit themes
          let isMatch = false;
          if (nameLower.includes("meditation") || nameLower.includes("meditate")) {
            isMatch = text.includes("meditation") || text.includes("meditate") || text.includes("calm") || text.includes("breathe") || text.includes("mindfulness");
          } else if (nameLower.includes("read") || nameLower.includes("pages")) {
            isMatch = text.includes("read") || text.includes("reading") || text.includes("book") || text.includes("pages") || text.includes("literature");
          } else if (nameLower.includes("code") || nameLower.includes("hour") || nameLower.includes("typescript")) {
            isMatch = text.includes("code") || text.includes("coding") || text.includes("developer") || text.includes("typescript") || text.includes("app") || text.includes("programming");
          } else {
            // General word match
            const mainWords = nameLower.split(/\s+/).filter(w => w.length > 3);
            isMatch = mainWords.some(w => text.includes(w));
          }

          if (isMatch && !habit.history[dateKey]) {
            habit.history[dateKey] = true;
            habit.streak = calculateStreak(habit.history);
            changedHabits = true;
            const formattedDate = entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            logs.push(`🧘 Detected "${habit.name}" completed on ${formattedDate} via journal!`);
          }
        });

        // 2. Goal Action step syncing
        updatedGoals.forEach((goal) => {
          goal.actions.forEach((action, idx) => {
            const actionKey = `${goal.id}-${idx}`;
            if (!newCompletedTasks[actionKey]) {
              const actionWords = action.toLowerCase().split(/\s+/).filter(w => w.length > 3);
              const isMatch = actionWords.some(w => text.includes(w)) || text.includes(goal.title.toLowerCase());
              
              if (isMatch) {
                newCompletedTasks[actionKey] = true;
                changedGoals = true;
                const formattedDate = entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                logs.push(`🎯 Checked off action "${action}" for Goal: "${goal.title}" based on journal on ${formattedDate}!`);
              }
            }
          });
        });
      });

      if (changedHabits) {
        setHabits(updatedHabits);
      }
      if (changedGoals) {
        setCompletedTasks(newCompletedTasks);
        // re-calculate progress
        const newlyProgressed = updatedGoals.map(g => {
          const total = g.actions.length || 1;
          const done = g.actions.filter((_, idx) => !!newCompletedTasks[`${g.id}-${idx}`]).length;
          const progress = Math.round((done / total) * 100);
          return { ...g, progress };
        });
        setGoals(newlyProgressed);
      }

      if (logs.length === 0) {
        logs.push("🔍 Scanned last 7 days of journals. No unlogged habits or goals were detected, but your self-reflection consistency looks fantastic!");
      }

      setSyncLogs(logs);
      setIsSyncing(false);
      setShowSyncSuccess(true);
    }, 1600);
  };

  // Pre-fill a journal reflection related to a goal or habit
  const handleWriteJournalReflection = (type: 'goal' | 'habit', name: string) => {
    if (!onCreatePageForDate) return;
    const prefilledDate = new Date();
    onCreatePageForDate(prefilledDate);
  };

  return (
    <div className="w-full max-w-6xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-4 md:p-8 pb-24" id="goals_habits_tracker">
      
      {/* Header */}
      <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2 text-cozy-text-dark">
            <Target className="text-cozy-orange w-7 h-7" />
            <span>Goals & Habits Tracker</span>
          </h2>
          <p className="text-xs text-cozy-text-muted font-bold mt-1">
            Build bulletproof routines and track key milestones synced with your vocal diaries.
          </p>
        </div>

        {/* AI Sync Button */}
        <button
          onClick={runJournalSync}
          disabled={isSyncing}
          className="self-start md:self-center flex items-center gap-2 px-4 py-2.5 bg-cozy-orange hover:bg-cozy-accent text-white font-black text-xs uppercase tracking-wider border-2 border-cozy-text-dark rounded-xl transition shadow-sm cursor-pointer select-none disabled:opacity-75"
        >
          <Sparkles size={14} className={isSyncing ? "animate-spin" : "animate-pulse"} />
          <span>{isSyncing ? "AI Sync Analysis..." : "AI Sync with Journal"}</span>
        </button>
      </div>

      {/* AI Sync Modal/Banner */}
      <AnimatePresence>
        {showSyncSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-[#FAF6EB] border-3 border-cozy-text-dark rounded-2xl cozy-shadow-sm flex flex-col relative"
          >
            <button 
              onClick={() => setShowSyncSuccess(false)}
              className="absolute top-3 right-3 p-1 text-cozy-text-muted hover:text-cozy-text-dark transition cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-cozy-orange animate-bounce" />
              <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Journal AI Sync Complete</h4>
            </div>

            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2">
              {syncLogs.map((log, i) => (
                <p key={i} className="text-xs font-semibold text-cozy-text-dark/90 pl-1.5 border-l-2 border-cozy-orange leading-relaxed">
                  {log}
                </p>
              ))}
            </div>

            <button
              onClick={() => setShowSyncSuccess(false)}
              className="self-end mt-3 text-[10px] font-black uppercase tracking-wider text-cozy-orange hover:text-cozy-accent"
            >
              Close Log
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* ================= COLUMN 1: GOALS & TASKS ================= */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-cozy-text-muted px-1 flex items-center gap-1.5">
              <Target size={12} className="text-cozy-orange" />
              <span>Milestone Goals & Tasks</span>
            </span>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="p-1 px-2.5 hover:bg-cozy-card bg-white rounded-lg border-2 border-cozy-text-dark text-cozy-text-dark font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={11} strokeWidth={3} />
              <span>Add Goal</span>
            </button>
          </div>

          {/* Add Goal Expandable form */}
          <AnimatePresence>
            {showAddGoal && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateGoal}
                className="bg-white border-3 border-cozy-text-dark rounded-2xl p-4 flex flex-col gap-3 overflow-hidden cozy-shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Set New Milestone Goal</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowAddGoal(false)}
                    className="p-1 text-cozy-text-muted hover:text-cozy-text-dark cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-black text-cozy-text-muted">Goal Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Run a 10K Marathon" 
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      className="px-3 py-2 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-black text-cozy-text-muted">Category</label>
                    <select
                      value={goalCategory}
                      onChange={(e: any) => setGoalCategory(e.target.value)}
                      className="px-3 py-2 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none cursor-pointer"
                    >
                      <option value="Personal">Personal Growth</option>
                      <option value="Fitness">Fitness & Health</option>
                      <option value="Reading">Reading & Knowledge</option>
                      <option value="Career">Career & Startup</option>
                      <option value="Habit">Routine Habit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-black text-cozy-text-muted">Target Deadline</label>
                    <input 
                      type="date" 
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                      className="px-3 py-2 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-black text-cozy-text-muted">Action Steps / Tasks (One per line)</label>
                    <textarea
                      placeholder="e.g. Buy running shoes&#10;Run 3K trail&#10;Register for local race"
                      value={goalActionsInput}
                      onChange={(e) => setGoalActionsInput(e.target.value)}
                      rows={3}
                      className="px-3 py-2 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!goalTitle.trim()}
                  className="mt-1 py-2 bg-cozy-orange hover:bg-cozy-accent disabled:opacity-55 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-cozy-text-dark transition shadow-sm cursor-pointer"
                >
                  Confirm & Initialize Goal
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Goal Cards */}
          <div className="flex flex-col gap-4">
            {goals.length === 0 ? (
              <div className="bg-cozy-card border-2 border-dashed border-cozy-text-dark/40 rounded-2xl p-8 text-center">
                <Target size={24} className="mx-auto text-cozy-text-muted opacity-60 mb-2" />
                <p className="text-xs font-bold text-cozy-text-muted">No milestone goals set yet.</p>
                <p className="text-[10px] text-cozy-text-muted mt-1">Set a goal and break it down into micro-tasks to align your daily focus.</p>
              </div>
            ) : (
              goals.map((goal) => {
                const connectedJournals = getConnectedJournalsForGoal(goal);
                
                return (
                  <div 
                    key={goal.id}
                    className="bg-cozy-card border-3 border-cozy-text-dark rounded-2xl p-5 relative overflow-hidden cozy-shadow-sm flex flex-col gap-4"
                  >
                    {/* Goal category banner background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cozy-orange/5 rounded-full blur-xl pointer-events-none" />

                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border-2 border-cozy-text-dark ${
                            goal.category === 'Career' ? 'bg-cozy-orange text-white' :
                            goal.category === 'Fitness' ? 'bg-[#95b89c] text-cozy-text-dark' :
                            goal.category === 'Reading' ? 'bg-cozy-yellow text-cozy-text-dark' :
                            goal.category === 'Habit' ? 'bg-cozy-accent text-white' :
                            'bg-white text-cozy-text-dark'
                          }`}>
                            {goal.category}
                          </span>
                          <span className="text-[10px] font-bold text-cozy-text-muted">
                            Due: {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-cozy-text-dark leading-tight">{goal.title}</h3>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 hover:bg-white hover:text-rose-500 border border-transparent hover:border-cozy-text-dark rounded-lg text-cozy-text-muted transition cursor-pointer"
                        title="Delete goal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative z-10">
                      <div className="flex justify-between items-center text-[10px] font-black text-cozy-text-muted mb-1 uppercase tracking-wider">
                        <span>Milestone Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full h-4 bg-white border-2 border-cozy-text-dark rounded-full overflow-hidden flex shadow-inner">
                        <motion.div 
                          className="h-full bg-cozy-orange border-r-2 border-cozy-text-dark"
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Action Items List */}
                    <div className="bg-white/50 border-2 border-cozy-text-dark/10 rounded-xl p-3 relative z-10">
                      <span className="text-[9px] uppercase font-black text-cozy-text-muted mb-2 block tracking-wider">Micro Action Steps</span>
                      <div className="space-y-2">
                        {goal.actions.map((action, idx) => {
                          const taskKey = `${goal.id}-${idx}`;
                          const isDone = !!completedTasks[taskKey];
                          return (
                            <label 
                              key={idx}
                              className="flex items-start gap-2.5 text-xs font-semibold text-cozy-text-dark/90 cursor-pointer select-none hover:text-cozy-orange transition"
                            >
                              <input 
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleGoalTask(goal.id, idx)}
                                className="mt-0.5 rounded border-2 border-cozy-text-dark text-cozy-orange focus:ring-0 cursor-pointer"
                              />
                              <span className={isDone ? "line-through text-cozy-text-muted/60 font-medium" : ""}>
                                {action}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Journal Connection Area */}
                    <div className="border-t border-cozy-text-dark/10 pt-3 flex flex-col gap-2 relative z-10">
                      <div className="flex items-center justify-between text-[10px] font-black text-cozy-text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={11} className="text-cozy-orange" />
                          <span>Connected Diaries ({connectedJournals.length})</span>
                        </span>
                        <button
                          onClick={() => handleWriteJournalReflection('goal', goal.title)}
                          className="text-[9px] font-black text-cozy-orange hover:text-cozy-accent uppercase flex items-center gap-0.5 cursor-pointer"
                        >
                          <PenTool size={10} />
                          <span>Log reflection</span>
                        </button>
                      </div>

                      {connectedJournals.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
                          {connectedJournals.map((entry) => {
                            const entryDate = new Date(entry.date);
                            return (
                              <button
                                key={entry.id}
                                onClick={() => onNavigateToEntry?.(entry.id)}
                                className="px-2 py-1 bg-white hover:bg-[#FAF6EB] border-2 border-cozy-text-dark/15 hover:border-cozy-orange rounded-lg text-[10px] font-bold text-cozy-text-dark flex items-center gap-1 transition cursor-pointer select-none"
                              >
                                <span>{entry.moodEmoji}</span>
                                <span>{entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                <ChevronRight size={10} className="text-cozy-text-muted" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-cozy-text-muted italic">
                          No journal entries mention this goal yet. Record a spoken diary to auto-link.
                        </p>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= COLUMN 2: HABIT BUILDER ================= */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-cozy-text-muted px-1 flex items-center gap-1.5">
              <Flame size={12} className="text-cozy-orange" />
              <span>Daily Rituals & Habits</span>
            </span>
            <button
              onClick={() => setShowAddHabit(!showAddHabit)}
              className="p-1 px-2.5 hover:bg-cozy-card bg-white rounded-lg border-2 border-cozy-text-dark text-cozy-text-dark font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={11} strokeWidth={3} />
              <span>New Habit</span>
            </button>
          </div>

          {/* Add Habit inline form */}
          <AnimatePresence>
            {showAddHabit && (
              <motion.form
                initial={{ opacity: 0, scaleY: 0.9 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.9 }}
                onSubmit={handleCreateHabit}
                className="bg-white border-3 border-cozy-text-dark rounded-2xl p-4 flex flex-col gap-3 overflow-hidden cozy-shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Build New Daily Ritual</h4>
                  <button 
                    type="button" 
                    onClick={() => setShowAddHabit(false)}
                    className="p-1 text-cozy-text-muted hover:text-cozy-text-dark cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-cozy-text-muted">Habit Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Drink 3L Water, 15m Meditation" 
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    className="px-3 py-2 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!habitName.trim()}
                  className="py-2 bg-cozy-orange hover:bg-cozy-accent disabled:opacity-55 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-cozy-text-dark transition shadow-sm cursor-pointer"
                >
                  Create Habit
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Habits Cards */}
          <div className="flex flex-col gap-4">
            {habits.length === 0 ? (
              <div className="bg-cozy-card border-2 border-dashed border-cozy-text-dark/40 rounded-2xl p-8 text-center">
                <Flame size={24} className="mx-auto text-cozy-text-muted opacity-60 mb-2" />
                <p className="text-xs font-bold text-cozy-text-muted">No habits defined yet.</p>
                <p className="text-[10px] text-cozy-text-muted mt-1">Create habits and track consistency with simple checkboxes or vocal syncs.</p>
              </div>
            ) : (
              habits.map((habit) => {
                const connectedJournals = getConnectedJournalsForHabit(habit);
                
                return (
                  <div 
                    key={habit.id}
                    className="bg-cozy-card border-3 border-cozy-text-dark rounded-2xl p-4.5 relative overflow-hidden cozy-shadow-sm flex flex-col gap-3.5"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-xs font-black text-cozy-text-dark leading-tight">{habit.name}</h4>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-cozy-orange uppercase tracking-wider">
                          <Flame size={12} className="animate-pulse fill-cozy-orange" />
                          <span>{habit.streak} Day Streak</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-1 hover:bg-white hover:text-rose-500 border border-transparent hover:border-cozy-text-dark rounded-lg text-cozy-text-muted transition cursor-pointer"
                        title="Delete habit"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* 7 Day Habit Checklist Grid */}
                    <div className="bg-white border-2 border-cozy-text-dark rounded-xl p-3">
                      <span className="text-[9px] uppercase font-black text-cozy-text-muted mb-2 block tracking-wider text-center">Last 7 Days</span>
                      <div className="grid grid-cols-7 gap-1">
                        {past7Days.map((date) => {
                          const dateKey = formatDateKey(date);
                          const isCompleted = !!habit.history[dateKey];
                          const isToday = dateKey === formatDateKey(new Date());

                          return (
                            <button
                              key={dateKey}
                              onClick={() => handleToggleHabitDay(habit.id, dateKey)}
                              className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition cursor-pointer select-none ${
                                isCompleted 
                                  ? 'bg-cozy-orange border-cozy-text-dark text-white' 
                                  : isToday 
                                    ? 'bg-[#FAF6EB] border-cozy-orange text-cozy-orange'
                                    : 'bg-[#FAF6EB] border-cozy-text-dark/15 text-cozy-text-muted'
                              }`}
                              title={`${habit.name}: ${isCompleted ? 'Completed' : 'Incomplete'} on ${dateKey}`}
                            >
                              <span className="text-[8px] font-black uppercase leading-none mb-1">
                                {getDayLabel(date).charAt(0)}
                              </span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[8px] font-bold ${
                                isCompleted 
                                  ? 'bg-white border-cozy-text-dark text-cozy-orange' 
                                  : 'bg-white border-cozy-text-dark/15 text-cozy-text-muted'
                              }`}>
                                {isCompleted ? '✓' : date.getDate()}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Linked Journals Section */}
                    <div className="border-t border-cozy-text-dark/10 pt-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[9px] font-black text-cozy-text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <BookOpen size={10} className="text-cozy-orange" />
                          <span>Mentioned in ({connectedJournals.length})</span>
                        </span>
                        <button
                          onClick={() => handleWriteJournalReflection('habit', habit.name)}
                          className="text-[8px] font-black text-cozy-orange hover:text-cozy-accent uppercase flex items-center gap-0.5 cursor-pointer"
                        >
                          <PenTool size={9} />
                          <span>Reflect</span>
                        </button>
                      </div>

                      {connectedJournals.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                          {connectedJournals.map((entry) => {
                            const entryDate = new Date(entry.date);
                            return (
                              <button
                                key={entry.id}
                                onClick={() => onNavigateToEntry?.(entry.id)}
                                className="px-1.5 py-0.5 bg-white hover:bg-[#FAF6EB] border border-cozy-text-dark/15 hover:border-cozy-orange rounded text-[9px] font-bold text-cozy-text-dark flex items-center gap-0.5 transition cursor-pointer select-none"
                              >
                                <span>{entry.moodEmoji}</span>
                                <span>{entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[9px] font-semibold text-cozy-text-muted italic leading-relaxed">
                          No matching spoken keywords found in diaries yet. Keep reflecting.
                        </p>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
