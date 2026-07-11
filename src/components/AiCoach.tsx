/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
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
  X,
  Grid,
  List,
  Columns,
  BarChart2,
  Search,
  Sliders,
  Filter,
  Zap,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { JournalEntry, Goal, Habit } from '../types';
import PlanBuilderModal from './PlanBuilderModal';
import PlanDetailsDashboard from './PlanDetailsDashboard';

interface AiCoachProps {
  entries: JournalEntry[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  onNavigateToEntry?: (id: string) => void;
  onCreatePageForDate?: (date: Date) => void;
}

// Predefined high-fidelity templates for simulated AI creation
const MOCK_AI_PLANS: Record<string, any> = {
  wedding: {
    title: 'Dream Wedding Planner 💍',
    description: 'Construct milestones, checklist items, budget trackers, and collaboration feeds for the big day.',
    icon: '💍',
    category: 'Social',
    priority: 'high',
    color: 'cozy-rose',
    modules: {
      progress: { target: 10, current: 3, unit: 'Milestones', type: 'circular' },
      milestones: {
        items: [
          { id: 'ms-w-1', title: 'Secure Venue Location', completed: true },
          { id: 'ms-w-2', title: 'Catering Tastings & Menu Selection', completed: false },
          { id: 'ms-w-3', title: 'Send invitations and RSVPs', completed: false },
          { id: 'ms-w-4', title: 'Wedding Day Dress Rehearsal', completed: false }
        ]
      },
      checklist: {
        items: [
          { id: 'chk-w-1', text: 'Select florist designer', completed: true },
          { id: 'chk-w-2', text: 'Draft guest seating arrangement chart', completed: false },
          { id: 'chk-w-3', text: 'Book live music acoustic band', completed: false },
          { id: 'chk-w-4', text: 'Finalize wedding cake flavor profile', completed: false }
        ]
      },
      tracking: { type: 'numeric', logs: [{ date: '2026-07-06', value: -1200 }] },
      collaboration: {
        members: ['Cozy Bride', 'Wedding Coordinator Sarah'],
        activityLog: ['Wedding project initialized.', 'Venue deposit secured!']
      }
    }
  },
  french: {
    title: '10-Week French Sprint 🇫🇷',
    description: 'Immersive modular system to speak fluid conversational French via checklists and weekly listening hours.',
    icon: '🇫🇷',
    category: 'Reading',
    priority: 'medium',
    color: 'cozy-blue',
    modules: {
      progress: { target: 100, current: 15, unit: 'Hours Practiced', type: 'bar' },
      habits: { streak: 4, longestStreak: 12, history: { '2026-07-05': true, '2026-07-06': true } },
      time: {
        estimatedHours: 40,
        actualHours: 6,
        timetable: [
          { time: '08:00', activity: 'Read French news article (Le Monde)' },
          { time: '13:00', activity: 'Listen to spoken French podcast' },
          { time: '20:00', activity: 'Practice verb conjugations' }
        ]
      },
      journal: { prompts: ['Speak about what you learned in French today in your voice recording!'] }
    }
  },
  workout: {
    title: 'Immersion Strength Routine 🏋️',
    description: 'Track custom push/pull days, log total water consumption counts, and run focus stopwatches.',
    icon: '🏋️',
    category: 'Fitness',
    priority: 'high',
    color: 'cozy-green',
    modules: {
      progress: { target: 30, current: 8, unit: 'Workouts Completed', type: 'bar' },
      scheduling: { startDate: '2026-07-06', recurring: 'weekly', repeatDays: ['Mon', 'Wed', 'Fri'] },
      tracking: { type: 'timer', logs: [] },
      checklist: {
        items: [
          { id: 'chk-wo-1', text: '3x10 Barbell Squats', completed: true },
          { id: 'chk-wo-2', text: '3x12 Romanian Deadlifts', completed: false },
          { id: 'chk-wo-3', text: 'Pullup progressive overload reps', completed: false }
        ]
      }
    }
  },
  book: {
    title: 'Aesthetic Novel Draft ✍️',
    description: 'Modular system to outline chapters, write daily wordcounts, and trigger automations.',
    icon: '✍️',
    category: 'Career',
    priority: 'medium',
    color: 'cozy-lavender',
    modules: {
      progress: { target: 50000, current: 12500, unit: 'Words Written', type: 'numeric' },
      checklist: {
        items: [
          { id: 'chk-b-1', text: 'Draft Chapter 1 character profiles', completed: true },
          { id: 'chk-b-2', text: 'Outline Chapter 2 climax arc', completed: false }
        ]
      },
      automation: {
        rules: [
          { trigger: 'habit_completed', action: 'increase_progress', enabled: true }
        ]
      }
    }
  }
};

export default function AiCoach({ 
  entries, 
  goals, 
  setGoals, 
  habits, 
  setHabits, 
  onNavigateToEntry, 
  onCreatePageForDate 
}: AiCoachProps) {

  // Active Layout views: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modular Builder Modal state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Selected Open Plan for detail viewing
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);

  // AI Prompt Planner state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [isBuilderView, setIsBuilderView] = useState(false);
  const [aiStep, setAiStep] = useState(0);

  // Interval effect to cycle through dynamic AI architecting steps
  useEffect(() => {
    if (isAiGenerating) {
      const interval = setInterval(() => {
        setAiStep(prev => (prev + 1) % 6);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setAiStep(0);
    }
  }, [isAiGenerating]);

  // Primary plans database (loaded from localStorage or translated from goals/habits)
  const [customPlans, setCustomPlans] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('daynest_modular_plans');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Keep customPlans persistent
  useEffect(() => {
    localStorage.setItem('daynest_modular_plans', JSON.stringify(customPlans));
  }, [customPlans]);

  // Escape key listener for closing builder and plan details
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPlan) {
          setSelectedPlan(null);
        } else if (isBuilderOpen) {
          setIsBuilderOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlan, isBuilderOpen]);

  // COMBINE AND TRANSLATE GOALS/HABITS INTO UNIFIED MODULAR PLANS
  const allPlans = useMemo(() => {
    // 1. Converted legacy goals
    const convertedGoals = goals.map(g => {
      // Map actions to checklists
      const items = (g.actions || []).map((act, i) => ({
        id: `task-${g.id}-${i}`,
        text: act,
        completed: false // state tracked by completed_goal_tasks if we want to be safe, but let's check localStorage
      }));

      // Pull completed tasks from voice journal config
      const savedTasks = localStorage.getItem('voice_journal_completed_goal_tasks');
      if (savedTasks) {
        try {
          const parsed = JSON.parse(savedTasks);
          items.forEach((it, idx) => {
            if (parsed[`${g.id}-${idx}`]) {
              it.completed = true;
            }
          });
        } catch (_) {}
      }

      return {
        id: g.id,
        title: g.title,
        description: `Legacy Goal mapped to the Universal Builder Engine. Due date is set to ${g.deadline}.`,
        icon: '🎯',
        category: g.category || 'Personal',
        tags: ['goal', g.category?.toLowerCase() || 'general'],
        priority: 'medium',
        color: 'cozy-orange',
        status: g.progress >= 100 ? 'completed' : 'active',
        isFavorite: false,
        modules: {
          progress: { target: 100, current: g.progress || 0, unit: 'Percent', type: 'bar' },
          checklist: { items },
          scheduling: { dueDate: g.deadline, recurring: 'none' }
        }
      };
    });

    // 2. Converted legacy habits
    const convertedHabits = habits.filter(h => h && h.name).map(h => {
      return {
        id: h.id,
        title: h.name,
        description: `Legacy Habit converted into the Universal Builder Engine. Maintain streaks and check off daily ticks.`,
        icon: '⚡',
        category: 'Habit',
        tags: ['habit', 'routine'],
        priority: 'medium',
        color: 'cozy-yellow',
        status: 'active',
        isFavorite: false,
        modules: {
          habits: {
            streak: h.streak || 0,
            longestStreak: h.streak || 0,
            history: h.history || {}
          },
          scheduling: { recurring: 'daily' }
        }
      };
    });

    // Combine custom modular builder plans plus the translated elements
    // Deduplicate so if custom plans override IDs they are not duplicated
    const legacyIds = new Set([...convertedGoals.map(cg => cg.id), ...convertedHabits.map(ch => ch.id)]);
    const filteredCustom = customPlans.filter(p => !legacyIds.has(p.id));

    return [...convertedGoals, ...convertedHabits, ...filteredCustom];
  }, [goals, habits, customPlans]);

  // Synchronize dynamic details of detail-viewed plan if it updates inside Details component
  useEffect(() => {
    if (selectedPlan) {
      const live = allPlans.find(p => p.id === selectedPlan.id);
      if (live) setSelectedPlan(live);
    }
  }, [allPlans]);

  // SEARCH AND FILTER INTERFACE
  const filteredPlans = useMemo(() => {
    return allPlans.filter(p => {
      const matchSearch = 
        p.title?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(deferredSearchTerm.toLowerCase()));
      
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchPriority = priorityFilter === 'all' || p.priority === priorityFilter;

      return matchSearch && matchCategory && matchPriority;
    });
  }, [allPlans, searchTerm, categoryFilter, priorityFilter]);

  // PROP SYNCHRONIZATION BACK TO PARENT APP
  // Ensures that changes in the Builder Engine are propagated back to the parent React context
  const handleUpdatePlan = (updatedPlan: any) => {
    let finalPlan = { ...updatedPlan };

    // If the plan has both checklist and progress modules, sync them dynamically in real-time
    if (finalPlan.modules?.checklist?.items && finalPlan.modules?.progress) {
      const items = finalPlan.modules.checklist.items;
      const total = items.length || 1;
      const done = items.filter((it: any) => it.completed).length;
      
      if (finalPlan.modules.progress.target === 100) {
        finalPlan.modules.progress.current = Math.round((done / total) * 100);
      } else if (finalPlan.modules.progress.target === total) {
        finalPlan.modules.progress.current = done;
      }
    }

    // 1. Check if legacy Goal
    const isGoal = goals.some(g => g.id === finalPlan.id);
    if (isGoal) {
      // Re-serialize checklist items back to actions
      const actions = (finalPlan.modules?.checklist?.items || []).map((it: any) => it.text);
      // Calculate progress %
      const total = actions.length || 1;
      const done = (finalPlan.modules?.checklist?.items || []).filter((it: any) => it.completed).length;
      const progress = Math.round((done / total) * 100);

      if (finalPlan.modules?.progress) {
        finalPlan.modules.progress.current = progress;
      }

      setGoals(prev => prev.map(g => {
        if (g.id === finalPlan.id) {
          // Update completed tasks file helper in localStorage
          const savedTasks = localStorage.getItem('voice_journal_completed_goal_tasks');
          let parsed: Record<string, boolean> = {};
          if (savedTasks) {
            try { parsed = JSON.parse(savedTasks); } catch (_) {}
          }
          // Clean up legacy keys
          Object.keys(parsed).forEach(k => {
            if (k.startsWith(`${g.id}-`)) delete parsed[k];
          });
          // Insert updated
          (finalPlan.modules?.checklist?.items || []).forEach((it: any, i: number) => {
            if (it.completed) {
              parsed[`${g.id}-${i}`] = true;
            }
          });
          localStorage.setItem('voice_journal_completed_goal_tasks', JSON.stringify(parsed));

          return {
            ...g,
            title: finalPlan.title,
            progress: progress,
            actions: actions.length > 0 ? actions : g.actions
          };
        }
        return g;
      }));
    }

    // 2. Check if legacy Habit
    const isHabit = habits.some(h => h.id === finalPlan.id);
    if (isHabit) {
      setHabits(prev => prev.map(h => {
        if (h.id === finalPlan.id) {
          return {
            ...h,
            name: finalPlan.title,
            streak: finalPlan.modules?.habits?.streak || 0,
            history: finalPlan.modules?.habits?.history || {}
          };
        }
        return h;
      }));
    }

    // 3. Update custom modular plan list
    setCustomPlans(prev => {
      const exists = prev.some(p => p.id === finalPlan.id);
      if (exists) {
        return prev.map(p => p.id === finalPlan.id ? finalPlan : p);
      } else {
        return [...prev, finalPlan];
      }
    });

    // Update detail screen state immediately
    if (selectedPlan && selectedPlan.id === finalPlan.id) {
      setSelectedPlan(finalPlan);
    }
  };

  const handleDeletePlan = (planId: string) => {
    // 1. Delete legacy Goals
    setGoals(prev => prev.filter(g => g.id !== planId));
    // 2. Delete legacy Habits
    setHabits(prev => prev.filter(h => h.id !== planId));
    // 3. Delete custom modular plan
    setCustomPlans(prev => prev.filter(p => p.id !== planId));

    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
    }
  };

  // AI SIMULATOR ASSISTANT SUBMISSION (Real Integration Calling Server API)
  const handleAiPromptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiGenerating(true);
    setAiSuccessMessage('');
    
    try {
      const response = await fetch('/api/generate-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt.trim() })
      });
      
      if (!response.ok) {
        throw new Error('Workspace generation failed');
      }
      
      const data = await response.json();
      
      const newPlan = {
        ...data,
        id: `plan-${Date.now()}`,
        status: 'active'
      };

      setCustomPlans(prev => [newPlan, ...prev]);
      
      // Select the generated workspace immediately to open it
      setSelectedPlan(newPlan);
      
      // Close the workspace builder view to land directly on the newly generated workspace
      setIsBuilderView(false);
      
      setAiPrompt('');
      setAiSuccessMessage(`✨ Generated your AI Workspace "${newPlan.title}" successfully with ${Object.keys(newPlan.modules || {}).length} active modules!`);
      
      // Flash success off after 6 seconds
      setTimeout(() => setAiSuccessMessage(''), 6000);

    } catch (err: any) {
      console.error('Error generating workspace via API, using high-fidelity local template fallback:', err);
      
      // Fallback local simulation in case of API failure, network offline, or missing keys
      const promptLower = aiPrompt.toLowerCase();
      let selectedTemplateKey = 'french'; // Default fallback

      if (promptLower.includes('wedding') || promptLower.includes('marriage') || promptLower.includes('ring') || promptLower.includes('marry')) {
        selectedTemplateKey = 'wedding';
      } else if (promptLower.includes('workout') || promptLower.includes('gym') || promptLower.includes('fitness') || promptLower.includes('strength') || promptLower.includes('lose') || promptLower.includes('kg') || promptLower.includes('weight')) {
        selectedTemplateKey = 'workout';
      } else if (promptLower.includes('novel') || promptLower.includes('book') || promptLower.includes('writing') || promptLower.includes('draft') || promptLower.includes('write')) {
        selectedTemplateKey = 'book';
      }

      const generatedTemplate = MOCK_AI_PLANS[selectedTemplateKey];
      
      // Customize fallback content based on user's prompt slightly to make it feel amazing
      const customTitle = aiPrompt.length < 40 
        ? aiPrompt.trim() 
        : generatedTemplate.title;
        
      const newPlan = {
        ...generatedTemplate,
        id: `plan-${Date.now()}`,
        title: customTitle,
        status: 'active',
        // Make sure it includes rich dynamic follow-up questions
        followUpQuestions: [
          'Would you like daily calendar reminders to stay on track?',
          'Should we connect this to your journaling habit for automatic progress updates?',
          'Would you like to connect a Pomodoro Timer tracker to your study blocks?'
        ]
      };

      setCustomPlans(prev => [newPlan, ...prev]);
      setSelectedPlan(newPlan);
      setIsBuilderView(false);
      setAiPrompt('');
      
      setAiSuccessMessage(`✨ Generated your fallback AI Workspace "${newPlan.title}" successfully!`);
      setTimeout(() => setAiSuccessMessage(''), 6000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Theme-synced color config mapper for visual alignment
  const getPlanColorConfig = (color: string) => {
    switch (color) {
      case 'cozy-rose':
        return {
          bg: 'bg-[#FFF0F2]',
          border: 'border-[#FCA5A5]',
          hoverBorder: 'group-hover:border-[#EF4444]',
          text: 'text-[#E11D48]',
          badge: 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]',
          lightBg: 'bg-[#FFF5F6]',
          glow: 'shadow-[0_0_15px_rgba(252,165,165,0.2)]',
          progressBar: 'bg-[#EF4444]'
        };
      case 'cozy-blue':
        return {
          bg: 'bg-[#EFF6FF]',
          border: 'border-[#93C5FD]',
          hoverBorder: 'group-hover:border-[#3B82F6]',
          text: 'text-[#1D4ED8]',
          badge: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
          lightBg: 'bg-[#F8FAFC]',
          glow: 'shadow-[0_0_15px_rgba(147,197,253,0.2)]',
          progressBar: 'bg-[#2563EB]'
        };
      case 'cozy-green':
        return {
          bg: 'bg-[#F0FDF4]',
          border: 'border-[#86EFAC]',
          hoverBorder: 'group-hover:border-[#16A34A]',
          text: 'text-[#15803D]',
          badge: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
          lightBg: 'bg-[#F4FBF7]',
          glow: 'shadow-[0_0_15px_rgba(134,239,172,0.2)]',
          progressBar: 'bg-[#16A34A]'
        };
      case 'cozy-yellow':
        return {
          bg: 'bg-[#FEFCE8]',
          border: 'border-[#FDE047]',
          hoverBorder: 'group-hover:border-[#CA8A04]',
          text: 'text-[#A16207]',
          badge: 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]',
          lightBg: 'bg-[#FFFDF4]',
          glow: 'shadow-[0_0_15px_rgba(253,224,71,0.25)]',
          progressBar: 'bg-[#CA8A04]'
        };
      case 'cozy-lavender':
        return {
          bg: 'bg-[#FAF5FF]',
          border: 'border-[#D8B4FE]',
          hoverBorder: 'group-hover:border-[#8B5CF6]',
          text: 'text-[#6D28D9]',
          badge: 'bg-[#F3E8FF] text-[#6D28D9] border-[#E9D5FF]',
          lightBg: 'bg-[#FAF9FF]',
          glow: 'shadow-[0_0_15px_rgba(216,180,254,0.2)]',
          progressBar: 'bg-[#8B5CF6]'
        };
      case 'cozy-orange':
      default:
        return {
          bg: 'bg-[#FFF7ED]',
          border: 'border-[#FDBA74]',
          hoverBorder: 'group-hover:border-[#EA580C]',
          text: 'text-[#C2410C]',
          badge: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]',
          lightBg: 'bg-[#FFF9F5]',
          glow: 'shadow-[0_0_15px_rgba(253,186,116,0.2)]',
          progressBar: 'bg-cozy-orange'
        };
    }
  };

  if (isBuilderView) {
    return (
      <div className="w-full max-w-7xl mx-auto min-h-screen bg-[#FDFBF7] text-cozy-text-dark flex flex-col items-center justify-center p-6 md:p-8 pb-24" id="workspace_ai_generator">
        <div className="w-full max-w-2xl bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 md:p-10 relative overflow-hidden cozy-shadow text-center space-y-6">
          <button
            onClick={() => setIsBuilderView(false)}
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EB] border-2 border-cozy-text-dark rounded-xl text-[10px] font-black uppercase tracking-wider text-cozy-text-dark cursor-pointer select-none shadow-sm hover:bg-[#FFF] transition animate-fadeIn"
          >
            <ArrowLeft size={11} strokeWidth={3} />
            <span>Cancel</span>
          </button>

          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEF9C3]/40 rounded-full blur-3xl pointer-events-none" />

          {isAiGenerating ? (
            <div className="py-12 space-y-6 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-cozy-orange/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-cozy-orange border-t-transparent rounded-full animate-spin" />
                <Sparkles size={28} className="text-cozy-orange animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-black tracking-tight text-cozy-text-dark uppercase">Architecting Workspace...</h3>
                <p className="text-xs text-cozy-text-muted font-bold animate-pulse">
                  {
                    aiStep === 0 ? "Analyzing your goals & intentions..." :
                    aiStep === 1 ? "Selecting optimal workspace category & colors..." :
                    aiStep === 2 ? "Designing initial checkpoints, checklists, and milestones..." :
                    aiStep === 3 ? "Establishing default time blocks and timetables..." :
                    aiStep === 4 ? "Injecting customized AI journaling reflection prompts..." :
                    "Configuring automation rules for seamless habit tracking..."
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2.5 pt-6">
                <div className="mx-auto w-12 h-12 bg-cozy-orange/10 rounded-2xl border-2 border-cozy-text-dark flex items-center justify-center text-cozy-orange">
                  <Sparkles size={22} className="animate-bounce" />
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-cozy-text-dark">Create Workspace ✨</h2>
                <p className="text-xs text-cozy-text-muted font-bold max-w-md mx-auto leading-relaxed">
                  Describe what you want to achieve or build in plain English. The AI Planner will automatically determine optimal layouts, tracking metrics, habit checklists, and smart automations.
                </p>
              </div>

              <form onSubmit={(e) => handleAiPromptSubmit(e)} className="space-y-4">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Describe your goal (e.g., 'I want to prepare for my UPSC exam in 8 months' or 'I want to lose 10kg in 6 months')"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiPromptSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border-3 border-cozy-text-dark rounded-2xl text-xs font-bold text-cozy-text-dark placeholder-cozy-text-muted/65 focus:outline-none focus:border-cozy-orange transition-all resize-none shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!aiPrompt.trim()}
                  className="w-full py-3.5 bg-cozy-orange disabled:opacity-55 text-white font-black text-xs uppercase tracking-wider border-3 border-cozy-text-dark rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm tactile-btn-retro"
                >
                  <Sparkles size={14} fill="currentColor" />
                  <span>Generate Workspace ✨</span>
                </button>
              </form>

              {/* Preset suggestors */}
              <div className="space-y-3 pt-4 border-t border-cozy-text-dark/10">
                <h4 className="text-[10px] font-black text-cozy-text-muted uppercase tracking-wider text-left">💡 Preset Examples & Launchers:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {[
                    { label: 'UPSC Preparation 📚', text: 'I want to prepare for my UPSC exam in 8 months.' },
                    { label: 'Weight Loss Journey 🏋️', text: 'I want to lose 10kg in 6 months.' },
                    { label: 'Write a Novel ✍️', text: 'Help me write a novel.' },
                    { label: 'Japan Travel Planner 🗺️', text: 'Plan my trip to Japan.' },
                    { label: 'Reading Tracker 📚', text: 'Create a reading tracker.' },
                    { label: 'Startup Roadmap 🚀', text: 'Build a startup roadmap.' },
                    { label: 'Wedding Planner 💍', text: 'I need a wedding planner.' },
                    { label: 'Track Water Intake 💧', text: 'I want to track my water intake.' },
                    { label: 'Daily Planner ⏱️', text: 'I want a daily planner.' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAiPrompt(preset.text)}
                      className="p-3 bg-[#FAF6EB] hover:bg-cozy-orange hover:text-white border-2 border-cozy-text-dark rounded-2xl text-left cursor-pointer transition shadow-xs flex flex-col justify-between group"
                    >
                      <span className="text-[11px] font-black">{preset.label}</span>
                      <span className="text-[9px] font-bold opacity-75 mt-1 line-clamp-1 group-hover:text-white/90">{preset.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 md:p-8 pb-24" id="daynest_builder_engine">
      
      {/* 1. Header Section */}
      <div className="mb-6 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cozy-orange/10 text-cozy-orange border border-cozy-orange/20">
            <Target size={11} strokeWidth={2.5} />
            <span>Builder & Coaching</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">
            DayNest Builder Space
          </h2>
          <p className="text-xs text-cozy-text-muted font-bold">
            Construct modular checklists, streaks, schedules, and custom automation rules for aligned self-improvement.
          </p>
        </div>

        {/* Create Workspace Button */}
        <button
          onClick={() => {
            setAiPrompt('');
            setIsBuilderView(true);
          }}
          className="self-start md:self-center flex items-center gap-2 px-5 py-3 bg-cozy-orange text-white font-black text-xs uppercase tracking-wider border-3 border-cozy-text-dark rounded-2xl cozy-shadow tactile-btn-retro cursor-pointer select-none"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Create Workspace</span>
        </button>
      </div>

      {/* 2. Step-by-Step Modular Builder Modal */}
      <PlanBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSave={handleUpdatePlan}
        existingPlan={editingPlan}
        allPlans={allPlans}
      />

      {/* 3. Render Dashboard Detail View OR Lists */}
      {selectedPlan ? (
        <PlanDetailsDashboard
          plan={selectedPlan}
          allPlans={allPlans}
          onBack={() => setSelectedPlan(null)}
          onUpdate={handleUpdatePlan}
          onDelete={handleDeletePlan}
          onNavigateToPlan={(id) => {
            const match = allPlans.find(p => p.id === id);
            if (match) setSelectedPlan(match);
          }}
        />
      ) : (
        <div className="space-y-6">

          {/* AI Prompt Life Planner assistant */}
          <div className="bg-[#FFFDF9] border-3 border-cozy-text-dark rounded-3xl p-6 relative overflow-hidden cozy-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FEF9C3]/40 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 bg-cozy-orange/20 rounded-lg border border-cozy-orange/30">
                <Sparkles size={15} className="text-cozy-orange animate-pulse" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">AI Plan Architect & Assistant</h4>
            </div>

            <form onSubmit={handleAiPromptSubmit} className="flex flex-col sm:flex-row gap-2.5 relative z-10">
              <div className="relative flex-1">
                <input
                  type="text"
                  disabled={isAiGenerating}
                  placeholder="Type your growth focus, e.g. 'Build a 10-week French sprint' or 'Wedding schedule'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-3 border-cozy-text-dark rounded-2xl text-xs font-bold text-cozy-text-dark placeholder-cozy-text-muted/65 focus:outline-none focus:border-cozy-orange focus:ring-2 focus:ring-cozy-orange/15 transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="px-6 py-3 bg-cozy-orange disabled:opacity-55 text-white font-black text-xs uppercase tracking-wider border-3 border-cozy-text-dark rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 tactile-btn-retro"
              >
                {isAiGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Structuring Modules...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} fill="currentColor" />
                    <span>Generate AI Plan ✨</span>
                  </>
                )}
              </button>
            </form>



            <AnimatePresence>
              {aiSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  className="mt-4 bg-[#ECFDF5] border-3 border-cozy-green p-3 rounded-2xl text-[11px] font-bold text-cozy-text-dark leading-normal flex items-start gap-2"
                >
                  <span className="text-base">✨</span>
                  <div>{aiSuccessMessage}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>



          {/* Filtering & View Switcher Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#FAF6EB] p-4 border-3 border-cozy-text-dark rounded-3xl shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cozy-text-muted" />
                <input
                  type="text"
                  placeholder="Search plan modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border-2 border-cozy-text-dark rounded-2xl text-xs font-bold text-cozy-text-dark focus:outline-none focus:border-cozy-orange focus:ring-2 focus:ring-cozy-orange/10 w-full sm:w-[220px] transition-all shadow-xs"
                />
              </div>

              {/* Filters */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border-2 border-cozy-text-dark rounded-2xl text-xs font-black text-cozy-text-dark cursor-pointer focus:outline-none hover:bg-cozy-bg focus:border-cozy-orange transition-all shadow-xs"
              >
                <option value="all">📁 All Categories</option>
                <option value="Personal">Personal Growth</option>
                <option value="Fitness">Fitness</option>
                <option value="Reading">Reading</option>
                <option value="Career">Career</option>
                <option value="Social">Events & Social</option>
                <option value="Habit">Habit Ticks</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border-2 border-cozy-text-dark rounded-2xl text-xs font-black text-cozy-text-dark cursor-pointer focus:outline-none hover:bg-cozy-bg focus:border-cozy-orange transition-all shadow-xs"
              >
                <option value="all">⚡ All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            {/* View Switcher buttons */}
            <div className="flex rounded-2xl border-2 border-cozy-text-dark overflow-hidden p-1 bg-white shrink-0 shadow-xs self-start md:self-auto">
              {([
                { id: 'grid', label: Grid },
                { id: 'list', label: List }
              ] as const).map(v => {
                const IconComp = v.label;
                return (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={`p-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                      viewMode === v.id 
                        ? 'bg-cozy-orange text-white scale-102 shadow-xs' 
                        : 'text-cozy-text-muted hover:text-cozy-text-dark hover:bg-cozy-orange/10'
                    }`}
                    title={`${v.id.toUpperCase()} View`}
                  >
                    <IconComp size={15} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.length === 0 ? (
                <div className="col-span-full py-12 text-center text-cozy-text-muted bg-white border-3 border-cozy-text-dark rounded-3xl p-8 max-w-xl mx-auto space-y-4 shadow-sm">
                  <div className="w-16 h-16 bg-cozy-orange/10 rounded-full border-2 border-dashed border-cozy-orange flex items-center justify-center text-3xl mx-auto animate-pulse">
                    🧩
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-cozy-text-dark">Your Workspace collection is empty</p>
                    <p className="text-xs font-bold text-cozy-text-muted">
                      Start by spawning an AI-powered workspace block. Describe any goal, prep schedule, or tracker and watch it assemble instantly.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAiPrompt('');
                      setIsBuilderView(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-cozy-orange text-white font-black text-xs uppercase tracking-wider border-3 border-cozy-text-dark rounded-2xl cozy-shadow tactile-btn-retro cursor-pointer select-none"
                  >
                    <Plus size={15} strokeWidth={3} />
                    <span>Create Workspace</span>
                  </button>
                </div>
              ) : (
                filteredPlans.map((plan, index) => {
                  const activeCount = Object.keys(plan.modules || {}).length;
                  const cfg = getPlanColorConfig(plan.color);
                  
                  return (
                    <motion.div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 15,
                        delay: index * 0.05 
                      }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 12px 0px 0px rgba(74, 61, 48, 0.12)',
                      }}
                      className={`border-3 border-cozy-text-dark rounded-3xl p-5 md:p-6 cursor-pointer transition-all flex flex-col justify-between min-h-[225px] relative overflow-hidden cozy-shadow group select-none ${cfg.lightBg}`}
                    >
                      {/* Sync background & colors */}
                      <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-40 ${cfg.bg}`} />
 
                      <div className="space-y-3.5 relative z-10 leading-normal">
                        <div className="flex justify-between items-start">
                          <span className="text-2xl bg-white w-11 h-11 rounded-xl border-2 border-cozy-text-dark flex items-center justify-center shadow-xs group-hover:rotate-6 transition-transform">
                            {plan.icon || '🧩'}
                          </span>
 
                          <div className="flex gap-1.5 items-center">
                            {plan.isFavorite && (
                              <Heart size={13} fill="currentColor" className="text-cozy-orange animate-pulse" />
                            )}
                            <span className={`text-[9px] border-2 border-cozy-text-dark px-2.5 py-1 rounded-xl uppercase font-mono font-black shadow-xs ${cfg.badge}`}>
                              {plan.category}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete the "${plan.title}" workspace?`)) {
                                  handleDeletePlan(plan.id);
                                }
                              }}
                              className="p-1 rounded-lg border-2 border-cozy-text-dark bg-white hover:bg-red-50 text-red-500 transition-all shadow-xs hover:scale-110 cursor-pointer flex items-center justify-center shrink-0"
                              title="Delete Plan"
                            >
                              <Trash2 size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
 
                        <div>
                          <h4 className="text-sm font-black text-cozy-text-dark group-hover:text-cozy-orange transition-colors leading-snug tracking-tight">
                            {plan.title}
                          </h4>
                          <p className="text-xs text-cozy-text-muted/90 font-bold leading-relaxed mt-1.5 line-clamp-2">
                            {plan.description}
                          </p>
                        </div>
 
                        {/* Inline progress display */}
                        {plan.modules?.progress && (
                          <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-[9px] font-mono font-black uppercase text-cozy-text-dark">
                              <span>📈 Progress</span>
                              <span>{plan.modules.progress.current} / {plan.modules.progress.target} {plan.modules.progress.unit}</span>
                            </div>
                            <div className="w-full h-3 bg-white rounded-full border-2 border-cozy-text-dark overflow-hidden p-0.5 shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 shadow-sm ${cfg.progressBar}`} 
                                style={{ width: `${Math.min(100, (plan.modules.progress.current / plan.modules.progress.target) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
 
                        {/* Checklist quick summary */}
                        {plan.modules?.checklist?.items?.length > 0 && !plan.modules?.progress && (
                          <div className="flex items-center gap-1.5 bg-white border-2 border-cozy-text-dark/15 px-3 py-1.5 rounded-xl w-fit shadow-xs">
                            <CheckSquare size={11} className="text-cozy-orange" />
                            <span className="text-[9.5px] font-black text-cozy-text-dark font-mono">
                              {plan.modules.checklist.items.filter((it: any) => it.completed).length}/{plan.modules.checklist.items.length} Checked
                            </span>
                          </div>
                        )}
 
                        {/* Habit quick summary */}
                        {plan.modules?.habits && (
                          <div className="flex items-center gap-1.5 bg-white border-2 border-[#FDE047] px-3 py-1.5 rounded-xl w-fit shadow-xs">
                            <Flame size={12} fill="currentColor" className="text-[#CA8A04] animate-pulse" />
                            <span className="text-[9.5px] font-black text-[#CA8A04] font-mono">
                              {plan.modules.habits.streak}d Active Streak
                            </span>
                          </div>
                        )}
                      </div>
 
                      {/* Footer indicators */}
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-cozy-text-dark/10 flex items-center justify-between text-[9px] font-mono font-black text-cozy-text-muted uppercase tracking-wider relative z-10">
                        <span className="flex items-center gap-1.5">
                          <Zap size={11} className="text-cozy-orange" />
                          <span>{activeCount} modules active</span>
                        </span>
                        
                        <div className="flex items-center gap-1 text-cozy-orange font-black group-hover:text-cozy-text-dark transition-colors">
                          <span>Configure</span>
                          <ChevronRight size={11} strokeWidth={3.5} className="group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="space-y-3 leading-normal">
              {filteredPlans.length === 0 ? (
                <div className="py-12 text-center text-cozy-text-muted bg-white border-3 border-cozy-text-dark rounded-3xl p-6">
                  <p className="text-xs font-black">No matching plans available in list.</p>
                </div>
              ) : (
                filteredPlans.map((plan, index) => {
                  const cfg = getPlanColorConfig(plan.color);
                  return (
                    <motion.div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 15,
                        delay: index * 0.04 
                      }}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="bg-cozy-card border-3 border-cozy-text-dark hover:border-cozy-orange rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-2xl shrink-0 w-10 h-10 bg-[#FAF6EB] rounded-lg border-2 border-cozy-text-dark flex items-center justify-center">{plan.icon || '🧩'}</span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-cozy-text-dark group-hover:text-cozy-orange transition-colors truncate">{plan.title}</h4>
                          <p className="text-[9.5px] text-cozy-text-muted font-bold truncate max-w-md mt-0.5">{plan.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[8.5px] font-mono font-black uppercase">
                        <span className={`border-2 border-cozy-text-dark px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{plan.category}</span>
                        <span className="bg-cozy-orange/15 text-cozy-orange px-2.5 py-0.5 rounded-full border-2 border-cozy-text-dark">{Object.keys(plan.modules || {}).length} LEGO blocks</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete the "${plan.title}" workspace?`)) {
                              handleDeletePlan(plan.id);
                            }
                          }}
                          className="p-1 rounded-lg border-2 border-cozy-text-dark bg-white hover:bg-red-50 text-red-500 transition-all shadow-xs hover:scale-110 cursor-pointer flex items-center justify-center shrink-0"
                          title="Delete Plan"
                        >
                          <Trash2 size={11} strokeWidth={2.5} />
                        </button>
                        <ChevronRight size={13} className="text-cozy-text-muted group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 leading-normal">
              {(['draft', 'active', 'completed', 'archived'] as const).map(colStatus => {
                const colPlans = filteredPlans.filter(p => p.status === colStatus);
                const colColor = 
                  colStatus === 'active' ? 'border-[#EF9A7A]' : 
                  colStatus === 'completed' ? 'border-[#96A376]' : 
                  colStatus === 'draft' ? 'border-[#F6D285]' : 'border-cozy-text-muted/30';

                return (
                  <div key={colStatus} className="bg-[#FAF6EB] p-4 border-3 border-cozy-text-dark rounded-3xl space-y-3.5 min-h-[420px] flex flex-col">
                    <div className="border-b-2 border-[#4A3D30]/10 pb-2.5 flex justify-between items-center shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cozy-text-dark flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full border border-cozy-text-dark ${
                          colStatus === 'active' ? 'bg-cozy-orange' : 
                          colStatus === 'completed' ? 'bg-cozy-green' : 
                          colStatus === 'draft' ? 'bg-cozy-yellow' : 'bg-cozy-text-muted'
                        }`} />
                        <span>{colStatus}</span>
                      </span>
                      <span className="text-[9px] font-mono font-black bg-white border-2 border-cozy-text-dark px-2.5 py-0.5 rounded-lg shadow-xs">
                        {colPlans.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[50vh] pr-1">
                      {colPlans.length === 0 ? (
                        <p className="text-[9px] text-cozy-text-muted text-center py-10 font-bold">Column empty.</p>
                      ) : (
                        colPlans.map((plan, index) => {
                          const cfg = getPlanColorConfig(plan.color);
                          return (
                            <motion.div
                              key={plan.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 100, 
                                damping: 15,
                                delay: index * 0.06 
                              }}
                              whileHover={{ scale: 1.02 }}
                              className={`bg-white border-2 border-cozy-text-dark hover:border-cozy-orange rounded-2xl p-3.5 cursor-pointer shadow-sm transition-all group space-y-3.5 relative ${cfg.glow}`}
                            >
                              <div onClick={() => setSelectedPlan(plan)} className="space-y-2">
                                <div className="flex justify-between items-start gap-1">
                                  <span className="text-xl w-7 h-7 bg-[#FAF6EB] border border-cozy-text-dark/10 rounded-lg flex items-center justify-center">{plan.icon}</span>
                                  <div className="flex gap-1.5 items-center">
                                    <span className="text-[8px] font-black text-cozy-orange bg-cozy-orange/10 px-2 py-0.5 border border-cozy-orange/25 rounded-full uppercase">#{plan.priority}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete the "${plan.title}" workspace?`)) {
                                          handleDeletePlan(plan.id);
                                        }
                                      }}
                                      className="p-1 rounded bg-white hover:bg-red-50 text-red-500 transition-all border border-cozy-text-dark/20 hover:scale-110 cursor-pointer flex items-center justify-center shrink-0"
                                      title="Delete Plan"
                                    >
                                      <Trash2 size={10} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </div>
                                <h5 className="text-[11px] font-black text-cozy-text-dark group-hover:text-cozy-orange leading-tight">{plan.title}</h5>
                              </div>

                              {/* Arrow Status controls */}
                              <div className="flex justify-between border-t border-cozy-text-dark/5 pt-2.5 text-[8.5px] font-mono font-black uppercase text-cozy-text-muted">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const list = ['draft', 'active', 'completed', 'archived'] as const;
                                    const idx = list.indexOf(plan.status);
                                    if (idx > 0) handleUpdatePlan({ ...plan, status: list[idx - 1] });
                                  }}
                                  disabled={colStatus === 'draft'}
                                  className="hover:text-cozy-orange disabled:opacity-20 cursor-pointer select-none"
                                >
                                  ◀ Move Left
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const list = ['draft', 'active', 'completed', 'archived'] as const;
                                    const idx = list.indexOf(plan.status);
                                    if (idx < list.length - 1) handleUpdatePlan({ ...plan, status: list[idx + 1] });
                                  }}
                                  disabled={colStatus === 'archived'}
                                  className="hover:text-cozy-orange disabled:opacity-20 cursor-pointer select-none"
                                >
                                  Move Right ▶
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STATISTICS OVERVIEW */}
          {viewMode === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-normal animate-fadeIn">
              
              {/* Consistency chart */}
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 relative overflow-hidden cozy-shadow space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b-2 border-cozy-text-dark/10 pb-2.5 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-cozy-orange" />
                  <span>Modular Analytics Core (All Plans)</span>
                </h4>
                
                <div className="flex items-center gap-4.5 bg-[#FAF6EB] p-4 border-2 border-cozy-text-dark rounded-2xl">
                  <div className="w-16 h-16 rounded-full border-4 border-cozy-orange flex items-center justify-center text-base font-mono font-black text-cozy-text-dark bg-white shadow-inner shrink-0">
                    86%
                  </div>
                  <div>
                    <h5 className="text-xs font-black">Cohesive Performance Score</h5>
                    <p className="text-[10px] text-cozy-text-muted leading-relaxed font-bold mt-1">
                      Your habit ticks, active timers, checklist triggers, and milestones achieved show extraordinary growth consistency!
                    </p>
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border-2 border-cozy-text-dark text-[9px] font-black text-cozy-text-muted font-mono uppercase">
                  <div className="flex justify-between">
                    <span>Active Plan blocks:</span>
                    <span className="text-cozy-text-dark">{allPlans.length} Conceived</span>
                  </div>
                  <div className="flex justify-between border-t border-cozy-text-dark/5 pt-1.5 mt-1.5">
                    <span>Goal completion ratio:</span>
                    <span className="text-cozy-text-dark">74% Conquered</span>
                  </div>
                </div>
              </div>

              {/* Category distribution */}
              <div className="bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 relative overflow-hidden cozy-shadow space-y-4.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b-2 border-cozy-text-dark/10 pb-2.5">
                  📁 Category Mapped Distribution
                </h4>

                <div className="space-y-3 pt-1 font-black text-[10px] text-cozy-text-dark leading-none">
                  {[
                    { cat: 'Personal', color: 'bg-cozy-orange', count: allPlans.filter(p => p.category === 'Personal').length },
                    { cat: 'Fitness', color: 'bg-cozy-green', count: allPlans.filter(p => p.category === 'Fitness').length },
                    { cat: 'Reading', color: 'bg-cozy-blue', count: allPlans.filter(p => p.category === 'Reading').length },
                    { cat: 'Career', color: 'bg-[#96A376]', count: allPlans.filter(p => p.category === 'Career').length }
                  ].map(item => {
                    const pctVal = allPlans.length > 0 ? (item.count / allPlans.length) * 100 : 0;
                    return (
                      <div key={item.cat} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="uppercase tracking-wider text-[9px]">{item.cat}</span>
                          <span className="font-mono text-xs">{item.count} block{item.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-full h-3 bg-[#FAF6EB] rounded-full overflow-hidden p-0.5 border-2 border-cozy-text-dark">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pctVal}%` }}
                            transition={{ duration: 0.6 }}
                            className={`h-full rounded-full ${item.color}`} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inspiring Growth Quote widget */}
              <div className="col-span-full bg-cozy-yellow/20 border-3 border-cozy-text-dark rounded-3xl p-5 flex items-center gap-4">
                <div className="text-3xl shrink-0">🌸</div>
                <div className="min-w-0">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-cozy-accent mb-0.5">Mindful Reflection</h5>
                  <p className="text-xs font-black italic text-cozy-text-dark">
                    "Do not wait for perfect conditions to start. Designing your habits is like organizing lego blocks - start with one, click it in, and let alignment build over time."
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

