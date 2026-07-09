/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  Star, 
  Trash2, 
  Edit, 
  Target, 
  Calendar, 
  CheckSquare, 
  Layers, 
  Sliders, 
  Clock, 
  BookOpen, 
  Flame, 
  TrendingUp, 
  Zap, 
  Users, 
  FileText, 
  Plus, 
  Trash, 
  Play, 
  Pause, 
  RotateCcw, 
  Share2, 
  Paperclip, 
  MessageSquare,
  Sparkles,
  Award,
  Check
} from 'lucide-react';

interface PlanDetailsDashboardProps {
  plan: any;
  allPlans: any[];
  onBack: () => void;
  onUpdate: (updatedPlan: any) => void;
  onDelete: (planId: string) => void;
  onNavigateToPlan?: (planId: string) => void;
}

export default function PlanDetailsDashboard({ 
  plan, 
  allPlans, 
  onBack, 
  onUpdate, 
  onDelete, 
  onNavigateToPlan 
}: PlanDetailsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics' | 'automation' | 'notes'>('workspace');

  // Checklist state
  const [newChecklistItem, setNewChecklistItem] = useState('');
  // Milestone state
  const [newMilestoneItem, setNewMilestoneItem] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  
  // Tracker Clicker value state
  const [trackerValueInput, setTrackerValueInput] = useState('1');
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time Blocking hourly scheduler state
  const [timetableHour, setTimetableHour] = useState('09:00');
  const [timetableDesc, setTimetableDesc] = useState('');
  const [estHours, setEstHours] = useState(plan.modules?.time?.estimatedHours || 0);
  const [actHours, setActHours] = useState(plan.modules?.time?.actualHours || 0);

  // Automation Log
  const [automationLogs, setAutomationLogs] = useState<string[]>(['Automation engine loaded.']);

  // Notes state
  const [notesContent, setNotesContent] = useState(plan.modules?.notes?.content || '');

  // Collaboration comment
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    setNotesContent(plan.modules?.notes?.content || '');
    setEstHours(plan.modules?.time?.estimatedHours || 0);
    setActHours(plan.modules?.time?.actualHours || 0);
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [plan]);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleFavorite = () => {
    onUpdate({ ...plan, isFavorite: !plan.isFavorite });
  };

  const handleChangeStatus = (status: 'draft' | 'active' | 'completed' | 'archived') => {
    onUpdate({ ...plan, status });
  };

  // 1. Progress Metric handler
  const handleUpdateProgressCurrent = (val: number) => {
    if (!plan.modules.progress) return;
    const target = plan.modules.progress.target;
    const boundedVal = Math.max(0, Math.min(target, val));
    
    // Calculate new completion percentage
    const updatedPlan = {
      ...plan,
      modules: {
        ...plan.modules,
        progress: {
          ...plan.modules.progress,
          current: boundedVal
        }
      }
    };

    // Check Automation Rule for increasing progress
    triggerAutomationCheck('progress_updated', updatedPlan);
    onUpdate(updatedPlan);
  };

  // 2. Checklist items
  const handleToggleChecklistItem = (itemId: string) => {
    if (!plan.modules.checklist) return;
    const items = plan.modules.checklist.items.map((it: any) => 
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );

    const updatedPlan = {
      ...plan,
      modules: {
        ...plan.modules,
        checklist: { ...plan.modules.checklist, items }
      }
    };

    // Automation trigger
    const allCompleted = items.length > 0 && items.every((it: any) => it.completed);
    if (allCompleted) {
      triggerAutomationCheck('checklist_done', updatedPlan);
    }

    onUpdate(updatedPlan);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || !plan.modules.checklist) return;

    const newItem = {
      id: `task-${Date.now()}`,
      text: newChecklistItem.trim(),
      completed: false
    };

    const items = [...(plan.modules.checklist.items || []), newItem];
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        checklist: { ...plan.modules.checklist, items }
      }
    });
    setNewChecklistItem('');
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!plan.modules.checklist) return;
    const items = plan.modules.checklist.items.filter((it: any) => it.id !== itemId);
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        checklist: { ...plan.modules.checklist, items }
      }
    });
  };

  // 3. Milestones Manager
  const handleToggleMilestone = (milestoneId: string) => {
    if (!plan.modules.milestones) return;
    const items = plan.modules.milestones.items.map((ms: any) => 
      ms.id === milestoneId ? { ...ms, completed: !ms.completed } : ms
    );

    const updatedPlan = {
      ...plan,
      modules: {
        ...plan.modules,
        milestones: { ...plan.modules.milestones, items }
      }
    };

    triggerAutomationCheck('milestone_unlocked', updatedPlan);
    onUpdate(updatedPlan);
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneItem.trim() || !plan.modules.milestones) return;

    const newItem = {
      id: `ms-${Date.now()}`,
      title: newMilestoneItem.trim(),
      dueDate: newMilestoneDate || undefined,
      completed: false
    };

    const items = [...(plan.modules.milestones.items || []), newItem];
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        milestones: { ...plan.modules.milestones, items }
      }
    });
    setNewMilestoneItem('');
    setNewMilestoneDate('');
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!plan.modules.milestones) return;
    const items = plan.modules.milestones.items.filter((ms: any) => ms.id !== milestoneId);
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        milestones: { ...plan.modules.milestones, items }
      }
    });
  };

  // 4. Tracking Variables
  const handleAddTrackingLog = (val: number | boolean | string) => {
    if (!plan.modules.tracking) return;
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      value: val
    };
    const logs = [...(plan.modules.tracking.logs || []), newLog];
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        tracking: { ...plan.modules.tracking, logs }
      }
    });
  };

  // 5. Habits tracking
  const handleToggleHabitDay = (dayKey: string) => {
    if (!plan.modules.habits) return;
    const history = { ...(plan.modules.habits.history || {}) };
    const existed = !!history[dayKey];

    if (existed) {
      delete history[dayKey];
    } else {
      history[dayKey] = true;
    }

    // Calculate streaks
    const historyKeys = Object.keys(history).sort();
    let streak = 0;
    if (historyKeys.length > 0) {
      let currentStreak = 0;
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Calculate simple consecutive streak
      let checkDate = new Date();
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (history[checkStr]) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // If we skipped just today, look back one day
          if (checkStr === todayStr) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
      streak = currentStreak;
    }

    const longest = Math.max(plan.modules.habits.longestStreak || 0, streak);

    const updatedPlan = {
      ...plan,
      modules: {
        ...plan.modules,
        habits: {
          ...plan.modules.habits,
          history,
          streak,
          longestStreak: longest
        }
      }
    };

    if (!existed) {
      triggerAutomationCheck('habit_completed', updatedPlan);
    }

    onUpdate(updatedPlan);
  };

  // 6. Time Blocking hourly timetable
  const handleAddTimetableBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableDesc.trim() || !plan.modules.time) return;

    const newBlock = {
      time: timetableHour,
      activity: timetableDesc.trim()
    };

    const timetable = [...(plan.modules.time.timetable || []), newBlock].sort((a, b) => a.time.localeCompare(b.time));
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        time: { ...plan.modules.time, timetable }
      }
    });
    setTimetableDesc('');
  };

  const handleUpdateTimeHours = (field: 'est' | 'act', val: number) => {
    if (!plan.modules.time) return;
    const updatedTime = {
      ...plan.modules.time,
      estimatedHours: field === 'est' ? val : estHours,
      actualHours: field === 'act' ? val : actHours
    };
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        time: updatedTime
      }
    });
  };

  // 7. Automation Check & Trigger simulation
  const triggerAutomationCheck = (triggerKey: string, currentPlan: any) => {
    if (!currentPlan.modules.automation?.rules) return;
    const activeRules = currentPlan.modules.automation.rules.filter((r: any) => r.trigger === triggerKey && r.enabled);

    activeRules.forEach((rule: any) => {
      const logMsg = `[Rule Triggered] "IF ${rule.trigger}" matched! Performing Action: "${rule.action}"`;
      setAutomationLogs(prev => [...prev, logMsg]);

      // Execute Action
      if (rule.action === 'increase_progress' && currentPlan.modules.progress) {
        const curr = currentPlan.modules.progress.current;
        const target = currentPlan.modules.progress.target;
        const nextVal = Math.min(target, curr + Math.round(target * 0.1));
        currentPlan.modules.progress.current = nextVal;
        setAutomationLogs(prev => [...prev, `[Action executed] Boosted Plan Progress current from ${curr} to ${nextVal} ${currentPlan.modules.progress.unit} (+10%)`]);
      }
      if (rule.action === 'increment_streak' && currentPlan.modules.habits) {
        currentPlan.modules.habits.streak = (currentPlan.modules.habits.streak || 0) + 1;
        setAutomationLogs(prev => [...prev, `[Action executed] Extended Habit Streak to ${currentPlan.modules.habits.streak} days!`]);
      }
      if (rule.action === 'create_celebration_journal' && currentPlan.modules.journal) {
        currentPlan.modules.journal.prompts.push(`Phenomenal work achieving a trigger on ${currentPlan.title}! Express your gratitude in today's entry.`);
        setAutomationLogs(prev => [...prev, `[Action executed] Generated a specialized celebration journal prompt!`]);
      }
    });
  };

  const handleSaveNotes = () => {
    if (!plan.modules.notes) return;
    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        notes: {
          ...plan.modules.notes,
          content: notesContent
        }
      }
    });
    setAutomationLogs(prev => [...prev, '[System] Rich notes saved successfully.']);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !plan.modules.collaboration) return;

    const activityLog = [
      `[User Comment] "${newComment.trim()}"`,
      ...(plan.modules.collaboration.activityLog || [])
    ];

    onUpdate({
      ...plan,
      modules: {
        ...plan.modules,
        collaboration: {
          ...plan.modules.collaboration,
          activityLog
        }
      }
    });
    setNewComment('');
  };

  // Helper values for Progress
  const pct = plan.modules?.progress 
    ? Math.round((plan.modules.progress.current / plan.modules.progress.target) * 100) 
    : 0;

  // Render Emojis matching colors
  const colorTheme = plan.color || 'cozy-orange';
  const themeAccentClass = 
    colorTheme === 'cozy-orange' ? 'bg-[#E08E6D] text-white border-cozy-text-dark' :
    colorTheme === 'cozy-yellow' ? 'bg-[#E6C585] text-cozy-text-dark border-cozy-text-dark' :
    colorTheme === 'cozy-green' ? 'bg-[#94A87C] text-white border-cozy-text-dark' :
    colorTheme === 'cozy-blue' ? 'bg-[#99BECC] text-white border-cozy-text-dark' :
    colorTheme === 'cozy-lavender' ? 'bg-[#C3B1E1] text-white border-cozy-text-dark' :
    colorTheme === 'cozy-rose' ? 'bg-[#EAA1A4] text-white border-cozy-text-dark' :
    'bg-[#4A3D30] text-white border-cozy-text-dark';

  const themeTextClass = 
    colorTheme === 'cozy-orange' ? 'text-[#E08E6D]' :
    colorTheme === 'cozy-yellow' ? 'text-[#C99E55]' :
    colorTheme === 'cozy-green' ? 'text-[#7B8F63]' :
    colorTheme === 'cozy-blue' ? 'text-[#6C9EAF]' :
    colorTheme === 'cozy-lavender' ? 'text-[#A088C3]' :
    colorTheme === 'cozy-rose' ? 'text-[#CE7A7E]' :
    'text-cozy-text-dark';

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-xs font-black uppercase tracking-wider text-cozy-text-dark cursor-pointer select-none shadow-sm tactile-btn-retro"
        >
          <ArrowLeft size={13} strokeWidth={3} />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <motion.button
            onClick={handleToggleFavorite}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: plan.isFavorite ? [1, 1.25, 1] : 1, rotate: plan.isFavorite ? [0, 15, -15, 0] : 0 }}
            transition={{ duration: 0.3 }}
            className={`p-2 border-2 rounded-xl cursor-pointer select-none tactile-btn-retro ${
              plan.isFavorite 
                ? 'bg-cozy-rose text-white border-cozy-text-dark shadow-sm' 
                : 'bg-white text-cozy-text-muted border-cozy-text-dark border-dashed hover:bg-[#FAF6EB]'
            }`}
            title="Mark as Favorite"
          >
            <Heart size={14} fill={plan.isFavorite ? 'currentColor' : 'none'} strokeWidth={2.5} />
          </motion.button>

          {/* Delete button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to completely delete this Plan?')) {
                onDelete(plan.id);
              }
            }}
            className="p-2 bg-white text-red-500 border-2 border-cozy-text-dark rounded-xl cursor-pointer tactile-btn-retro hover:bg-red-50"
            title="Delete Plan"
          >
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Main Profile Banner Card */}
      <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 md:p-6 relative overflow-hidden cozy-shadow flex flex-col md:flex-row gap-5 items-start">
        {/* Dynamic theme colored background element */}
        <div className={`absolute top-0 right-0 w-36 h-36 rounded-bl-full opacity-10 pointer-events-none ${themeAccentClass.split(' ')[0]}`} />
        
        {/* Large Emoji icon */}
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 select-none border-3 border-cozy-text-dark shadow-sm ${themeAccentClass}`}>
          {plan.icon || '🧩'}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border-2 border-cozy-text-dark ${themeAccentClass}`}>
              {plan.category || 'Custom'}
            </span>
            <span className="text-[9px] font-mono font-bold bg-[#F4EDE2] border border-cozy-text-dark/15 px-2 py-0.5 rounded-md text-cozy-text-muted uppercase">
              {plan.priority || 'medium'} PRIORITY
            </span>
            
            {/* Status indicators */}
            <div className="flex rounded-lg border-2 border-cozy-text-dark overflow-hidden p-0.5 bg-[#FAF6EB]">
              {(['draft', 'active', 'completed', 'archived'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => handleChangeStatus(st)}
                  className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md transition cursor-pointer ${
                    plan.status === st 
                      ? 'bg-cozy-orange text-white' 
                      : 'text-cozy-text-muted hover:text-cozy-text-dark'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-cozy-text-dark tracking-tight leading-none">
            {plan.title}
          </h2>

          <p className="text-xs font-semibold text-cozy-text-muted leading-relaxed">
            {plan.description || 'No focus description logged. Add one using the modular customizer.'}
          </p>

          {plan.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {plan.tags.map((tg: string) => (
                <span key={tg} className="text-[9px] font-bold text-cozy-orange bg-cozy-yellow/20 px-2 py-0.5 rounded-md border border-cozy-orange/15">
                  #{tg}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Tabbed Controller */}
      <div className="flex border-b border-cozy-text-dark/10 gap-1 overflow-x-auto pb-0.5 font-mono">
        {([
          { id: 'workspace', label: '🛠️ modular workspace' },
          { id: 'analytics', label: '📊 charts & trends' }
        ] as const).map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl border-t-3 border-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === tb.id 
                ? 'bg-cozy-card border-cozy-text-dark text-cozy-text-dark' 
                : 'border-transparent text-cozy-text-muted hover:text-cozy-text-dark'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* 4. WORKSPACE TAB */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 leading-normal">
          
          {/* LEFT PANEL: Core checklists & Progress tracking */}
          <div className="lg:col-span-2 space-y-6">

            {/* A. Progress Metric Module */}
            {plan.modules?.progress && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Target className={themeTextClass} size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Metric Goal Progress</span>
                  </div>
                  <span className={`text-xs font-mono font-black ${themeTextClass}`}>
                    {plan.modules.progress.current} / {plan.modules.progress.target} {plan.modules.progress.unit}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Circle Wheel or horizontal slider depending on settings */}
                  {plan.modules.progress.type === 'circular' ? (
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#F0EDE4" strokeWidth="8" fill="transparent" className="stroke-cozy-bg" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          className={themeTextClass}
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * Math.min(100, pct)) / 100}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-black text-cozy-text-dark">{pct}%</span>
                        <span className="text-[7px] uppercase font-bold text-cozy-text-muted font-mono">COMPLETE</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 w-full space-y-2">
                      <div className="h-4 w-full bg-cozy-bg rounded-full border-2 border-cozy-text-dark overflow-hidden p-0.5 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${themeAccentClass.split(' ')[0]}`} 
                          style={{ width: `${Math.min(100, pct)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-cozy-text-muted font-mono uppercase">
                        <span>START (0%)</span>
                        <span className="text-cozy-orange">CURRENT VALUE: {pct}%</span>
                        <span>TARGET (100%)</span>
                      </div>
                    </div>
                  )}

                  {/* Interactive controller slider */}
                  <div className="flex-1 w-full space-y-2.5 bg-cozy-bg/50 p-3 rounded-2xl border-2 border-dashed border-cozy-text-dark/10">
                    <label className="text-[9px] uppercase font-black text-cozy-text-muted">Manually Adjust Metrics</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="0"
                        max={plan.modules.progress.target}
                        value={plan.modules.progress.current}
                        onChange={(e) => handleUpdateProgressCurrent(Number(e.target.value))}
                        className="flex-1 h-2 bg-cozy-bg rounded-lg border border-cozy-text-dark/15 appearance-none cursor-pointer accent-cozy-orange"
                      />
                      <input 
                        type="number"
                        min="0"
                        max={plan.modules.progress.target}
                        value={plan.modules.progress.current}
                        onChange={(e) => handleUpdateProgressCurrent(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-white border-2 border-cozy-text-dark rounded-lg text-xs font-black text-cozy-text-dark text-center"
                      />
                    </div>
                  </div>
                </div>

                {pct >= 100 && (
                  <div className="mt-4 bg-cozy-green/20 border-2 border-cozy-green text-cozy-text-dark p-3 rounded-2xl flex items-center gap-2.5">
                    <Award size={18} className="text-cozy-green animate-bounce" />
                    <div>
                      <h4 className="text-xs font-black">All Targets Smashed! 🎉</h4>
                      <p className="text-[9px] font-semibold text-cozy-text-muted">You have fully deployed and conquered this metrics planner!</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. Checklist & Subtasks Module */}
            {plan.modules?.checklist && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="text-cozy-orange" size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Modular Checklist Tasks</span>
                  </div>
                  <span className="text-[10px] font-mono font-black bg-cozy-yellow px-2.5 py-0.5 border border-cozy-text-dark rounded-full text-cozy-text-dark">
                    {plan.modules.checklist.items?.filter((i: any) => i.completed).length || 0} / {plan.modules.checklist.items?.length || 0}
                  </span>
                </div>

                {/* Task items list */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {(!plan.modules.checklist.items || plan.modules.checklist.items.length === 0) ? (
                    <div className="text-center py-6">
                      <p className="text-xs font-bold text-cozy-text-muted">Checklist is currently blank.</p>
                      <p className="text-[9px] text-cozy-text-muted">Input a task sub-objective below to organize structure!</p>
                    </div>
                  ) : (
                    plan.modules.checklist.items.map((it: any) => (
                      <div 
                        key={it.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition ${
                          it.completed 
                            ? 'bg-cozy-green/10 border-cozy-green/35 opacity-75' 
                            : 'bg-[#FAF6EB] border-cozy-text-dark/10 hover:border-cozy-text-dark/30'
                        }`}
                      >
                        <button
                          onClick={() => handleToggleChecklistItem(it.id)}
                          className="flex items-center gap-2.5 text-left cursor-pointer select-none"
                        >
                          <motion.div 
                            animate={{ scale: it.completed ? [1, 1.2, 1] : 1, rotate: it.completed ? [0, 8, -8, 0] : 0 }}
                            transition={{ duration: 0.25 }}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${
                              it.completed ? 'bg-cozy-green border-cozy-text-dark text-white' : 'bg-white border-cozy-text-dark/20'
                            }`}
                          >
                            {it.completed && '✓'}
                          </motion.div>
                          <span className={`text-xs font-bold ${it.completed ? 'line-through text-cozy-text-muted' : 'text-cozy-text-dark'}`}>
                            {it.text}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeleteChecklistItem(it.id)}
                          className="p-1 text-cozy-text-muted hover:text-red-500 rounded-lg cursor-pointer transition"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add input */}
                <form onSubmit={handleAddChecklistItem} className="flex gap-2 mt-4 pt-4 border-t border-cozy-text-dark/10">
                  <input
                    type="text"
                    placeholder="Assemble new action step..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="px-3 bg-cozy-orange border-2 border-cozy-text-dark rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer tactile-btn-retro"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            )}

            {/* C. Milestones Timeline Module */}
            {plan.modules?.milestones && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="text-cozy-orange" size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Phase Milestones Timeline</span>
                  </div>
                </div>

                {/* Milestones lists */}
                <div className="space-y-3.5 relative pl-4 before:absolute before:left-[21px] before:top-2 before:bottom-2 before:w-[3px] before:bg-cozy-text-dark/10">
                  {(!plan.modules.milestones.items || plan.modules.milestones.items.length === 0) ? (
                    <div className="text-center py-4 text-cozy-text-muted">
                      <p className="text-xs font-bold">No milestones defined.</p>
                    </div>
                  ) : (
                    plan.modules.milestones.items.map((ms: any) => (
                      <div key={ms.id} className="flex items-start gap-3 relative">
                        {/* Bullet circle */}
                        <button
                          onClick={() => handleToggleMilestone(ms.id)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition cursor-pointer ${
                            ms.completed 
                              ? 'bg-cozy-green border-cozy-text-dark text-white' 
                              : 'bg-white border-cozy-text-dark/25 hover:border-cozy-text-dark'
                          }`}
                        >
                          {ms.completed && <span className="text-[8px] font-black">✓</span>}
                        </button>

                        <div className="flex-1 bg-[#FAF6EB] p-2.5 rounded-xl border-2 border-cozy-text-dark/5 flex justify-between items-center">
                          <div>
                            <h5 className={`text-xs font-black ${ms.completed ? 'line-through text-cozy-text-muted' : 'text-cozy-text-dark'}`}>
                              {ms.title}
                            </h5>
                            {ms.dueDate && (
                              <p className="text-[8px] font-mono font-bold text-cozy-orange uppercase mt-0.5">
                                TARGET DEADLINE: {ms.dueDate}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="text-cozy-text-muted hover:text-red-500 p-1 cursor-pointer"
                          >
                            <Trash size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add milestone */}
                <form onSubmit={handleAddMilestone} className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-cozy-text-dark/10">
                  <input
                    type="text"
                    required
                    placeholder="Milestone title, e.g. Phase 2 launch"
                    value={newMilestoneItem}
                    onChange={(e) => setNewMilestoneItem(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-cozy-orange border-2 border-cozy-text-dark text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer tactile-btn-retro"
                  >
                    Add Phase
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: Specialty logs, tracking widget blocks, streaks, time blocking */}
          <div className="space-y-6">

            {/* D. Variable Tracking module */}
            {plan.modules?.tracking && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-cozy-orange" size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Variable clicker logger</span>
                  </div>
                  <span className="text-[8px] font-black uppercase bg-[#F3ECE0] px-2 py-0.5 rounded border border-[#4A3D30]/10 font-mono">
                    {plan.modules.tracking.type}
                  </span>
                </div>

                {/* Tracker interfaces */}
                {plan.modules.tracking.type === 'numeric' && (
                  <div className="text-center py-2 space-y-3">
                    <p className="text-xs font-bold text-cozy-text-muted">Enter or increment numeric counts:</p>
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => {
                          const val = Number(trackerValueInput) || 1;
                          handleAddTrackingLog(-val);
                        }}
                        className="w-10 h-10 bg-white border-2 border-cozy-text-dark rounded-xl font-black text-lg text-cozy-text-dark cursor-pointer shadow-xs select-none tactile-btn-retro"
                      >
                        -
                      </button>
                      
                      <input 
                        type="number"
                        value={trackerValueInput}
                        onChange={(e) => setTrackerValueInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = Number(trackerValueInput) || 1;
                            handleAddTrackingLog(val);
                          }
                        }}
                        className="w-16 py-1.5 bg-white border-2 border-cozy-text-dark rounded-xl text-center font-black text-xs focus:outline-none focus:border-cozy-orange"
                      />

                      <button 
                        onClick={() => {
                          const val = Number(trackerValueInput) || 1;
                          handleAddTrackingLog(val);
                        }}
                        className="w-10 h-10 bg-cozy-orange text-white border-2 border-cozy-text-dark rounded-xl font-black text-lg cursor-pointer shadow-xs select-none tactile-btn-retro"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-[10px] font-bold text-cozy-text-muted mt-2">
                      Recent: {plan.modules.tracking.logs?.slice(-3).map((l: any, i: number) => (
                        <span key={i} className="inline-block bg-[#FAF6EB] px-2 py-0.5 rounded border border-cozy-text-dark/10 mr-1 mt-1 font-mono">
                          {l.value > 0 ? `+${l.value}` : l.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {plan.modules.tracking.type === 'boolean' && (
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => handleAddTrackingLog(true)}
                      className="w-full py-2.5 bg-cozy-green text-white font-black text-xs uppercase border-2 border-cozy-text-dark rounded-xl cursor-pointer"
                    >
                      ✓ Mark Success Event
                    </button>
                    <button
                      onClick={() => handleAddTrackingLog(false)}
                      className="w-full py-2.5 bg-white text-cozy-text-muted font-black text-xs uppercase border-2 border-cozy-text-dark/15 hover:border-cozy-text-dark rounded-xl cursor-pointer"
                    >
                      ✗ Mark Skip/Failure Event
                    </button>
                  </div>
                )}

                {plan.modules.tracking.type === 'mood' && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-cozy-text-muted text-center uppercase">Rate today's impact index (1-5)</p>
                    <div className="flex justify-between p-1 bg-[#FAF6EB] border border-cozy-text-dark/10 rounded-xl">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => handleAddTrackingLog(score)}
                          className="w-8 h-8 rounded-lg font-black text-xs hover:bg-cozy-orange/15 hover:text-cozy-orange transition cursor-pointer"
                        >
                          {score}★
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {plan.modules.tracking.type === 'timer' && (
                  <div className="space-y-3.5 bg-cozy-bg/30 p-3 rounded-2xl border border-cozy-text-dark/10 text-center">
                    <div className="text-xl font-mono font-black text-cozy-text-dark tracking-wider">
                      {formatTime(elapsedSeconds)}
                    </div>

                    <div className="flex justify-center gap-2">
                      {!isTimerRunning ? (
                        <button
                          onClick={() => setIsTimerRunning(true)}
                          className="px-3 py-1.5 bg-cozy-orange text-white border-2 border-cozy-text-dark rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                        >
                          <Play size={10} fill="white" />
                          <span>Start Focus</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsTimerRunning(false)}
                          className="px-3 py-1.5 bg-[#E6C585] text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                        >
                          <Pause size={10} fill="currentColor" />
                          <span>Pause</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsTimerRunning(false);
                          if (elapsedSeconds > 0) {
                            const minutes = Math.round(elapsedSeconds / 60) || 1;
                            handleAddTrackingLog(`${minutes} mins Focus`);
                            setAutomationLogs(prev => [...prev, `[Stopwatch] Logged ${minutes} focused minutes to timeline.`]);
                          }
                          setElapsedSeconds(0);
                        }}
                        className="px-3 py-1.5 bg-white text-cozy-text-muted border-2 border-cozy-text-dark/10 hover:border-cozy-text-dark rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={10} />
                        <span>Log & Reset</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* E. Habits Streaks checklist tracker */}
            {plan.modules?.habits && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="text-cozy-orange animate-pulse" size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Streak consistency Log</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-cozy-bg/50 rounded-2xl border border-cozy-text-dark/10 text-center">
                  <div>
                    <div className="text-xl font-black text-cozy-orange flex items-center justify-center gap-1">
                      <span>{plan.modules.habits.streak || 0}</span>
                      <Flame size={16} className="text-cozy-orange" fill="currentColor" />
                    </div>
                    <span className="text-[7.5px] font-black text-cozy-text-muted uppercase">Current Streak</span>
                  </div>
                  <div>
                    <div className="text-xl font-black text-cozy-green flex items-center justify-center gap-1">
                      <span>{plan.modules.habits.longestStreak || 0}</span>
                      <Award size={16} className="text-cozy-green" />
                    </div>
                    <span className="text-[7.5px] font-black text-cozy-text-muted uppercase">Longest Streak</span>
                  </div>
                </div>

                {/* 7-Day checkboxes row */}
                <div className="space-y-2 mt-4">
                  <p className="text-[9.5px] font-black text-cozy-text-muted uppercase">Tick daily successes:</p>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const success = !!plan.modules.habits.history?.[dateStr];

                      return (
                        <motion.button
                          key={dateStr}
                          onClick={() => handleToggleHabitDay(dateStr)}
                          whileTap={{ scale: 0.9 }}
                          animate={{ scale: success ? [1, 1.15, 1] : 1, rotate: success ? [0, 8, -8, 0] : 0 }}
                          transition={{ duration: 0.25 }}
                          className={`flex flex-col items-center justify-between py-2 border-2 rounded-xl cursor-pointer transition select-none ${
                            success 
                              ? 'bg-cozy-orange text-white border-cozy-text-dark' 
                              : 'bg-white text-cozy-text-muted border-cozy-text-dark/10 hover:border-cozy-text-dark'
                          }`}
                          title={dateStr}
                        >
                          <span className="text-[7.5px] font-bold uppercase font-mono">{dayLabel}</span>
                          <span className={`text-xs font-black mt-1 ${success ? 'text-white' : 'text-cozy-text-muted'}`}>
                            {success ? '✓' : '○'}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* F. Time Blocking Daily timetable */}
            {plan.modules?.time && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="text-cozy-orange" size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Timetable & Blocks</span>
                  </div>
                </div>

                {/* Hourly counters */}
                <div className="grid grid-cols-2 gap-2 text-center pb-3">
                  <div className="bg-white p-2 rounded-xl border border-cozy-text-dark/10">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleUpdateTimeHours('est', Math.max(0, estHours - 1))} className="px-1 font-black cursor-pointer">-</button>
                      <span className="text-xs font-black font-mono">{estHours}h</span>
                      <button onClick={() => handleUpdateTimeHours('est', estHours + 1)} className="px-1 font-black cursor-pointer">+</button>
                    </div>
                    <div className="text-[7.5px] font-bold text-cozy-text-muted uppercase mt-1">Est. Duration</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-cozy-text-dark/10">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleUpdateTimeHours('act', Math.max(0, actHours - 1))} className="px-1 font-black cursor-pointer">-</button>
                      <span className="text-xs font-black font-mono">{actHours}h</span>
                      <button onClick={() => handleUpdateTimeHours('act', actHours + 1)} className="px-1 font-black cursor-pointer">+</button>
                    </div>
                    <div className="text-[7.5px] font-bold text-cozy-text-muted uppercase mt-1">Actual Logged</div>
                  </div>
                </div>

                {/* Timetable schedule row */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {(!plan.modules.time.timetable || plan.modules.time.timetable.length === 0) ? (
                    <p className="text-[10px] text-cozy-text-muted text-center py-2 italic font-bold">No hourly schedules plotted.</p>
                  ) : (
                    plan.modules.time.timetable.map((block: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-bold p-1.5 bg-[#FAF6EB] rounded-lg border border-cozy-text-dark/10">
                        <span className="font-mono bg-cozy-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-cozy-text-dark select-none">{block.time}</span>
                        <span className="text-cozy-text-dark flex-1 leading-tight">{block.activity}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Plot schedule block */}
                <form onSubmit={handleAddTimetableBlock} className="flex gap-1.5 mt-3 pt-3 border-t border-cozy-text-dark/10">
                  <input
                    type="time"
                    value={timetableHour}
                    onChange={(e) => setTimetableHour(e.target.value)}
                    className="w-18 px-2 py-1 bg-white border border-cozy-text-dark rounded-lg text-[10px] font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Task block..."
                    value={timetableDesc}
                    onChange={(e) => setTimetableDesc(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-cozy-text-dark rounded-lg text-[10px] font-bold focus:outline-none"
                  />
                  <button type="submit" className="px-2.5 bg-cozy-orange text-white border border-cozy-text-dark rounded-lg text-[10px] font-black uppercase">
                    Plot
                  </button>
                </form>
              </div>
            )}

            {/* G. Journal Integration Sync prompts */}
            {plan.modules?.journal && (
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow">
                <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-cozy-orange" size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Voice Reflection Prompts</span>
                  </div>
                </div>
                <div className="bg-[#FAF6EB] p-3 rounded-2xl border border-cozy-text-dark/10 italic text-[11px] font-bold text-cozy-text-dark leading-relaxed">
                  "{plan.modules.journal.prompts?.[0] || 'Reflect on this modular plan in today\'s voice recording.'}"
                </div>
                <p className="text-[8.5px] font-bold text-cozy-text-muted mt-2.5 leading-normal">
                  💡 *Vocal logs that contain keywords related to "{plan.title}" will automatically increment milestones here.*
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 5. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 leading-normal">
          
          <div className="md:col-span-2 bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b border-cozy-text-dark/10 pb-2 flex items-center gap-2">
              <TrendingUp size={16} className="text-cozy-orange animate-pulse" />
              <span>Aesthetic consistency trends</span>
            </h4>

            {/* Sparkline Visual Simulation (SVG) */}
            <div className="bg-[#FAF6EB] p-4 rounded-2xl border-2 border-dashed border-cozy-text-dark/15 h-44 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono font-black text-cozy-text-muted uppercase">Consistency Quotient Index (30D)</span>
                <span className="text-xs font-mono font-black text-cozy-orange">84.2% Satisfied</span>
              </div>

              {/* Decorative SVG graph */}
              <svg className="w-full h-24 stroke-cozy-orange stroke-3 fill-none mt-2 overflow-visible">
                <path d="M 0 50 Q 50 10 100 80 T 200 20 T 300 40 T 400 90 T 500 10 T 600 50" />
                {/* Dots */}
                <circle cx="100" cy="80" r="4" fill="currentColor" className="text-cozy-yellow stroke-2 stroke-cozy-text-dark" />
                <circle cx="300" cy="40" r="4" fill="currentColor" className="text-cozy-green stroke-2 stroke-cozy-text-dark" />
                <circle cx="500" cy="10" r="4" fill="currentColor" className="text-cozy-orange stroke-2 stroke-cozy-text-dark" />
              </svg>

              <div className="flex justify-between text-[8px] font-mono font-black text-cozy-text-muted uppercase pt-2">
                <span>3 Weeks Ago</span>
                <span>2 Weeks Ago</span>
                <span>Last Week</span>
                <span>Today (Live)</span>
              </div>
            </div>

            <p className="text-[10px] text-cozy-text-muted font-bold italic leading-relaxed text-center">
              "Your performance cycles peak on Tuesday mornings. Keep leveraging focus times during early week blocks!"
            </p>
          </div>

          {/* Quick Metrics stats cards */}
          <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b border-cozy-text-dark/10 pb-2">
              📊 Analytics Summary
            </h4>

            <div className="space-y-3 font-bold text-xs text-cozy-text-dark leading-normal">
              <div className="flex justify-between items-center p-2.5 bg-[#FAF6EB] rounded-xl border border-cozy-text-dark/5">
                <span>Total Active Days</span>
                <span className="font-mono text-cozy-orange">18 Days</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#FAF6EB] rounded-xl border border-cozy-text-dark/5">
                <span>Average Satisfaction Score</span>
                <span className="font-mono text-cozy-green">4.8 / 5</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#FAF6EB] rounded-xl border border-cozy-text-dark/5">
                <span>Task Completion Ratio</span>
                <span className="font-mono text-cozy-blue">92% Done</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-[#FAF6EB] rounded-xl border border-cozy-text-dark/5">
                <span>Integrations Score</span>
                <span className="font-mono text-cozy-lavender">A+ Smart</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* AI Workspace Coach Suggestions */}
      {activeTab === 'workspace' && plan.followUpQuestions && plan.followUpQuestions.length > 0 && (
        <div className="bg-gradient-to-r from-[#FAF6EB] to-[#FFFBF0] border-3 border-cozy-text-dark rounded-3xl p-5 md:p-6 cozy-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEF9C3]/40 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-cozy-orange animate-pulse" />
            <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">AI Workspace Recommendations</h4>
          </div>
          <p className="text-[11px] text-cozy-text-muted font-bold leading-relaxed mb-4">
            Click on any AI suggestion below to instantly extend, configure, or optimize your modular workspace with new fields and tracking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plan.followUpQuestions.map((q: string, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  // Execute dynamic workspace optimization based on selected question!
                  let alertMsg = '';
                  let updatedPlan = { ...plan };
                  
                  if (q.toLowerCase().includes('pomodoro') || q.toLowerCase().includes('timer')) {
                    if (updatedPlan.modules?.tracking) {
                      updatedPlan.modules.tracking.type = 'timer';
                      alertMsg = '⏱️ Pomodoro Stopwatch tracker activated for your workspace!';
                    }
                  } else if (q.toLowerCase().includes('reminder') || q.toLowerCase().includes('calendar') || q.toLowerCase().includes('schedule')) {
                    if (updatedPlan.modules?.time) {
                      updatedPlan.modules.time.timetable = [
                        { time: '08:00', activity: '⚡ Daily Workspace Review & Habit Tick' },
                        ...(updatedPlan.modules.time.timetable || [])
                      ];
                      alertMsg = '📅 Configured recurring daily review block in your timeline schedule!';
                    }
                  } else if (q.toLowerCase().includes('journal') || q.toLowerCase().includes('connect')) {
                    if (updatedPlan.modules?.automation) {
                      updatedPlan.modules.automation.rules = [
                        { trigger: 'journal_written', action: 'increase_progress', enabled: true },
                        ...(updatedPlan.modules.automation.rules || [])
                      ];
                      alertMsg = '🔗 Established a smart relationship linking your Voice Journal submissions to workspace progress!';
                    }
                  } else if (q.toLowerCase().includes('calorie') || q.toLowerCase().includes('water')) {
                    if (updatedPlan.modules?.progress) {
                      updatedPlan.modules.progress.target = 8;
                      updatedPlan.modules.progress.unit = 'Cups of Water';
                      alertMsg = '💧 Configured active hydration target: 8 Cups of Water daily!';
                    }
                  } else {
                    // Default fallback updates
                    if (updatedPlan.modules?.checklist) {
                      updatedPlan.modules.checklist.items.push({
                        id: `chk-ai-${Date.now()}`,
                        text: 'Leverage AI recommendations to optimize this milestone',
                        completed: false
                      });
                      alertMsg = '✨ Injected a new smart objective checklist item into your workspace!';
                    }
                  }

                  // Append a log to the activity feedback
                  if (updatedPlan.modules?.collaboration) {
                    updatedPlan.modules.collaboration.activityLog = [
                      `[AI System] Applied recommendation: "${q}"`,
                      ...(updatedPlan.modules.collaboration.activityLog || [])
                    ];
                  }

                  // Clear this followUpQuestion from the queue
                  updatedPlan.followUpQuestions = updatedPlan.followUpQuestions.filter((item: string) => item !== q);

                  // Update the plan state
                  onUpdate(updatedPlan);
                  alert(alertMsg);
                }}
                className="p-3.5 bg-white hover:bg-[#FFFDF6] hover:border-cozy-orange border-2 border-cozy-text-dark rounded-2xl text-left text-xs font-black text-cozy-text-dark leading-snug cursor-pointer transition shadow-xs hover:-translate-y-0.5 group flex flex-col justify-between"
              >
                <span>{q}</span>
                <span className="text-[9px] font-black text-cozy-orange uppercase font-mono tracking-wider mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Apply Suggestion →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. SMART AUTOMATION TAB */}
      {activeTab === 'automation' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 leading-normal">
          
          {/* Rules configurations */}
          <div className="md:col-span-2 bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b border-cozy-text-dark/10 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-cozy-orange animate-pulse" />
                <span>Active Automation Triggers</span>
              </div>
              <span className="text-[8px] bg-cozy-yellow text-cozy-text-dark border border-cozy-text-dark font-mono px-2 py-0.5 rounded font-black">LEGOS ENGINE</span>
            </h4>

            {(!plan.modules.automation?.rules || plan.modules.automation.rules.length === 0) ? (
              <p className="text-xs text-cozy-text-muted text-center py-6">No triggers/actions defined for this plan. Toggle "Action Rules" module in builder settings to activate.</p>
            ) : (
              <div className="space-y-3">
                {plan.modules.automation.rules.map((rule: any, idx: number) => (
                  <div key={idx} className="bg-white p-3.5 rounded-2xl border-2 border-cozy-text-dark flex items-start gap-3 relative justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-cozy-orange/15 rounded-lg text-cozy-orange border border-cozy-orange/20 shrink-0">
                        <Zap size={14} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-cozy-text-muted">Active Rule {idx+1}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-cozy-green border border-cozy-text-dark animate-pulse" />
                        </div>
                        <h5 className="text-xs font-black text-cozy-text-dark mt-1 leading-normal">
                          IF <span className="text-cozy-orange">"{rule.trigger.replace(/_/g, ' ')}"</span> THEN <span className="text-cozy-green">"{rule.action.replace(/_/g, ' ')}"</span>
                        </h5>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Simulated Rule Testing button */}
            <div className="pt-2">
              <button 
                onClick={() => {
                  setAutomationLogs(prev => [...prev, `[Manual Fire] Testing logic Rule triggers...`]);
                  if (plan.modules.automation?.rules?.[0]) {
                    triggerAutomationCheck(plan.modules.automation.rules[0].trigger, plan);
                  } else {
                    setAutomationLogs(prev => [...prev, `[Warn] No rules present to execute!`]);
                  }
                }}
                className="w-full py-2.5 bg-cozy-orange hover:bg-cozy-accent text-white border-2 border-cozy-text-dark font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Zap size={13} strokeWidth={2.5} />
                <span>Test & Fire First Automation Rule 🔥</span>
              </button>
            </div>
          </div>

          {/* Real-time Automation Console Logger */}
          <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow flex flex-col justify-between min-h-[250px]">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b border-cozy-text-dark/10 pb-2">
                🖥️ Automation Output Console
              </h4>
              <div className="mt-3.5 space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {automationLogs.map((log, idx) => (
                  <div key={idx} className="text-[9.5px] font-mono leading-relaxed font-bold border-b border-cozy-text-dark/5 pb-1">
                    <span className="text-cozy-text-muted select-none">❯ </span>
                    <span className={log.includes('Triggered') ? 'text-cozy-orange' : log.includes('executed') ? 'text-cozy-green' : 'text-cozy-text-dark'}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setAutomationLogs(['Console cleared.'])}
              className="mt-3.5 self-end text-[8px] font-mono font-black text-cozy-text-muted hover:text-cozy-text-dark uppercase tracking-wide cursor-pointer"
            >
              Clear Logs
            </button>
          </div>

        </div>
      )}

      {/* 7. NOTES & MEMOS TAB */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 leading-normal">
          
          {/* Notes Workspace editor */}
          <div className="md:col-span-2 bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-cozy-orange" />
                <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Rich text notes & quotes</span>
              </div>
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 bg-cozy-green hover:bg-cozy-green/90 text-white border-2 border-cozy-text-dark rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer"
              >
                Save Note
              </button>
            </div>

            <textarea
              placeholder="Jot down rich quotes, outline chapters, map coordinates, draft budget summaries, track recipes, or capture thoughts..."
              value={notesContent}
              onChange={(e) => setNotesContent(e.target.value)}
              rows={9}
              className="w-full px-4 py-3 bg-white border-2 border-cozy-text-dark rounded-2xl text-xs font-semibold text-cozy-text-dark focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Media attachments & Voice memos */}
          <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b border-cozy-text-dark/10 pb-2">
              📁 Simulated Attachments
            </h4>

            {/* Audio visualization memo widget */}
            <div className="bg-cozy-bg/50 p-3 rounded-2xl border border-cozy-text-dark/10 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cozy-green border border-cozy-text-dark animate-pulse" />
                <span className="text-[10px] font-black uppercase text-cozy-text-dark">Linked Voice memo.webm</span>
              </div>

              {/* Decorative Audio wave bars */}
              <div className="flex justify-between items-center h-6 px-4">
                {[12, 18, 14, 22, 10, 16, 24, 12, 14, 8, 18, 15, 20, 12].map((h, i) => (
                  <div key={i} className="w-[3px] bg-cozy-orange rounded-full" style={{ height: `${h}px` }} />
                ))}
              </div>

              <div className="flex justify-between items-center text-[8.5px] font-black text-cozy-text-muted uppercase font-mono">
                <span>0:00 / 0:15</span>
                <span className="text-cozy-orange hover:underline cursor-pointer">Play Recording →</span>
              </div>
            </div>

            {/* Mock Attachment uploads */}
            <div className="space-y-2">
              <button className="w-full py-2 bg-white hover:bg-cozy-bg border border-cozy-text-dark/15 hover:border-cozy-text-dark rounded-xl text-[10px] font-bold text-cozy-text-dark text-center cursor-pointer transition flex items-center justify-center gap-1.5">
                <Paperclip size={11} />
                <span>Upload attachment file</span>
              </button>
              <button className="w-full py-2 bg-white hover:bg-cozy-bg border border-cozy-text-dark/15 hover:border-cozy-text-dark rounded-xl text-[10px] font-bold text-cozy-text-dark text-center cursor-pointer transition flex items-center justify-center gap-1.5">
                <Share2 size={11} />
                <span>Export Markdown file</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 8. COLLABORATION (RENDERED IF RELEVANT MODULE ENABLED) */}
      {activeTab === 'workspace' && plan.modules?.collaboration && (
        <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow leading-normal font-sans">
          <div className="flex items-center gap-2 border-b border-[#4A3D30]/10 pb-2 mb-4">
            <Users className="text-cozy-orange" size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Collaboration Feed & Comments</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or log team comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                />
                <button type="submit" className="px-4 bg-cozy-orange hover:bg-cozy-accent border-2 border-cozy-text-dark text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer">
                  Comment
                </button>
              </form>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {(plan.modules.collaboration.activityLog || []).map((log: string, i: number) => (
                  <div key={i} className="bg-[#FAF6EB] p-2.5 rounded-xl border border-cozy-text-dark/5 flex gap-2 items-start text-xs font-semibold text-cozy-text-dark">
                    <span className="text-cozy-orange select-none">💬</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FAF6EB] p-3.5 rounded-2xl border border-cozy-text-dark/10 space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-cozy-text-muted">Assigned Members</h5>
              <div className="space-y-1.5 text-xs font-bold text-cozy-text-dark">
                {(plan.modules.collaboration.members || []).map((m: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-cozy-orange text-white text-[9px] font-black flex items-center justify-center border border-cozy-text-dark uppercase select-none">
                      {m.substring(0, 2)}
                    </div>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. RELATIONSHIPS & DEPENDENCIES LINKS (RENDERED IF RELEVANT MODULE ENABLED) */}
      {activeTab === 'workspace' && plan.modules?.relationships && (
        <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-5 relative overflow-hidden cozy-shadow leading-normal">
          <div className="flex items-center gap-2 border-b border-[#4A3D30]/10 pb-2 mb-3">
            <Users className="text-cozy-orange" size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Modular Plan Relationships & Dependencies</span>
          </div>

          {(!plan.modules.relationships.linkedPlanIds || plan.modules.relationships.linkedPlanIds.length === 0) ? (
            <p className="text-xs font-bold text-cozy-text-muted">No external relationships mapped for this plan yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {plan.modules.relationships.linkedPlanIds.map((lid: string) => {
                const targetPlan = allPlans.find(p => p.id === lid);
                if (!targetPlan) return null;
                return (
                  <button
                    key={lid}
                    onClick={() => onNavigateToPlan && onNavigateToPlan(lid)}
                    className="px-3.5 py-2 bg-white hover:bg-[#FFFDF9] hover:border-cozy-orange border-2 border-cozy-text-dark rounded-2xl transition cursor-pointer select-none flex items-center gap-2 cozy-shadow-sm font-bold text-xs text-cozy-text-dark"
                  >
                    <span className="text-base">{targetPlan.icon}</span>
                    <span>Dependent Link: <strong>{targetPlan.title}</strong></span>
                    <span className="text-[8px] bg-cozy-yellow px-1 border border-cozy-text-dark rounded font-mono font-black">NAVIGATE</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
