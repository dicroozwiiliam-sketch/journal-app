/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Target, 
  Calendar, 
  CheckSquare, 
  Flame, 
  Clock, 
  Sparkles, 
  Layers, 
  Paperclip, 
  Plus, 
  TrendingUp, 
  Zap, 
  Users, 
  BookOpen, 
  FileText,
  HelpCircle,
  Sliders,
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';

interface PlanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: any) => void;
  existingPlan?: any;
  allPlans: any[];
}

export const TEMPLATES = [
  { id: 'goal', name: 'Goal', icon: '🎯', desc: 'Accomplish milestones and track metrics.', modules: ['progress', 'milestones', 'scheduling', 'journal', 'analytics'] },
  { id: 'habit', name: 'Habit', icon: '⚡', desc: 'Build daily consistencies & track streaks.', modules: ['habits', 'scheduling', 'analytics'] },
  { id: 'routine', name: 'Routine', icon: '☀️', desc: 'Sequence checklists and daily time blocks.', modules: ['checklist', 'time', 'habits'] },
  { id: 'tracker', name: 'Tracker', icon: '📈', desc: 'Log numeric variables or mood values.', modules: ['tracking', 'analytics', 'scheduling'] },
  { id: 'project', name: 'Project', icon: '📋', desc: 'Manage nested subtasks and milestones.', modules: ['checklist', 'milestones', 'scheduling', 'progress'] },
  { id: 'workout', name: 'Workout Plan', icon: '🏋️', desc: 'Track physical progress, timers, and exercises.', modules: ['tracking', 'time', 'scheduling', 'notes'] },
  { id: 'reading', name: 'Reading List', icon: '📚', desc: 'Track books, page targets, and daily progress.', modules: ['progress', 'checklist', 'notes'] },
  { id: 'wedding', name: 'Wedding Planner', icon: '💍', desc: 'Manage budget tracker, guests, checklist, milestones.', modules: ['checklist', 'milestones', 'tracking', 'media'] },
  { id: 'book_writing', name: 'Book Writing', icon: '✍️', desc: 'Outline chapters, track word count, set timers.', modules: ['progress', 'checklist', 'tracking', 'time', 'notes'] },
  { id: 'custom', name: 'Custom Plan', icon: '🧩', desc: 'Assemble your own modules from scratch.', modules: [] }
];

export const AVAILABLE_MODULES = [
  { id: 'progress', label: 'Progress Tracking', icon: Target, desc: 'Dynamic circular or linear bars to track numeric progress, percentages, or milestones.', cat: 'Core' },
  { id: 'scheduling', label: 'Scheduling & Duetime', icon: Calendar, desc: 'Define start, end, and custom repeat rules (daily, weekly, monthly, workdays).', cat: 'Time' },
  { id: 'checklist', label: 'Checklist & Subtasks', icon: CheckSquare, desc: 'Unlimited nested checkboxes, task dependencies, and automatic completion progress.', cat: 'Core' },
  { id: 'milestones', label: 'Milestones Manager', icon: Layers, desc: 'Set major target dates, journal link entries, and key phase achievements.', cat: 'Core' },
  { id: 'tracking', label: 'Variable Tracking', icon: Sliders, desc: 'Log water intake, weight, budget, timer-elapsed hours, or custom click counters.', cat: 'Core' },
  { id: 'time', label: 'Time Blocking Scheduler', icon: Clock, desc: 'Establish daily hourly timetables (estimated vs actual task duration logs).', cat: 'Time' },
  { id: 'journal', label: 'Spoken Journal Sync', icon: BookOpen, desc: 'Generate plan-specific daily reflections that scan vocal journals to sync completion.', cat: 'Reflect' },
  { id: 'habits', label: 'Habit & Streaks', icon: Flame, desc: 'Log daily checklists, calculate consecutive streak days, and view missed days.', cat: 'Reflect' },
  { id: 'analytics', label: 'Aesthetic Analytics', icon: TrendingUp, desc: 'View SVG sparkline trends, mood heatmap correlations, and AI trend logs.', cat: 'Reflect' },
  { id: 'automation', label: 'Action Rules (triggers)', icon: Zap, desc: 'Setup logic, e.g. "When Habit Completed" -> "Auto-advance Goal progress by 15%".', cat: 'Smart' },
  { id: 'relationships', label: 'Plan Relationships', icon: Users, desc: 'Link this plan to other plans, goals, projects, or calendar events.', cat: 'Smart' },
  { id: 'notes', label: 'Rich Notes & Media', icon: FileText, desc: 'Rich text fields, quotes, callouts, drawings, links, and simulated attachments.', cat: 'Core' }
];

export const EMOJIS = ['🎯', '⚡', '🧘', '🚀', '☀️', '✍️', '📚', '💍', '✈️', '🍳', '💼', '🎨', '🎵', '🥦', '💵', '🐾', '🔥', '💧', '🏆', '🧩', '💖'];

export const THEME_COLORS = [
  { name: 'Warm Orange', class: 'cozy-orange', bg: 'bg-[#E08E6D]', border: 'border-[#E08E6D]' },
  { name: 'Honey Yellow', class: 'cozy-yellow', bg: 'bg-[#E6C585]', border: 'border-[#E6C585]' },
  { name: 'Sage Green', class: 'cozy-green', bg: 'bg-[#94A87C]', border: 'border-[#94A87C]' },
  { name: 'Calm Blue', class: 'cozy-blue', bg: 'bg-[#99BECC]', border: 'border-[#99BECC]' },
  { name: 'Cozy Lavender', class: 'cozy-lavender', bg: 'bg-[#C3B1E1]', border: 'border-[#C3B1E1]' },
  { name: 'Rose Petal', class: 'cozy-rose', bg: 'bg-[#EAA1A4]', border: 'border-[#EAA1A4]' },
  { name: 'Cosmic Slate', class: 'cozy-text-dark', bg: 'bg-[#4A3D30]', border: 'border-[#4A3D30]' }
];

export default function PlanBuilderModal({ isOpen, onClose, onSave, existingPlan, allPlans }: PlanBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  // Plan Details State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [color, setColor] = useState('cozy-orange');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState('');
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  // Module Configuration States
  const [progressTarget, setProgressTarget] = useState(100);
  const [progressUnit, setProgressUnit] = useState('Percent');
  const [progressType, setProgressType] = useState<'bar' | 'circular' | 'numeric'>('bar');

  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly' | 'none'>('none');
  const [repeatDays, setRepeatDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [dueDate, setDueDate] = useState('');

  const [initialTasks, setInitialTasks] = useState('');
  const [initialMilestones, setInitialMilestones] = useState('');
  const [trackingType, setTrackingType] = useState<'numeric' | 'boolean' | 'mood' | 'timer'>('numeric');

  const [trigger, setTrigger] = useState('habit_completed');
  const [action, setAction] = useState('increase_progress');

  const [relatedPlanId, setRelatedPlanId] = useState('');

  // Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Escape key close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Validation Logic
  const validateStep = (currentStep: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (currentStep === 2) {
      if (!title.trim()) {
        newErrors.title = "Plan title is required to construct your system.";
      }
    }

    if (currentStep === 4) {
      if (enabledModules.includes('progress')) {
        if (!progressTarget || Number(progressTarget) <= 0 || isNaN(Number(progressTarget))) {
          newErrors.progressTarget = "Target goal must be a positive number greater than 0.";
        }
      }
      if (enabledModules.includes('scheduling')) {
        if (recurringType === 'weekly' && repeatDays.length === 0) {
          newErrors.repeatDays = "Please select at least one active repeat day for weekly recurrence.";
        }
        if (dueDate) {
          const selected = new Date(dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selected < today) {
            newErrors.dueDate = "Target due date cannot be set in the past.";
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(4, prev + 1));
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      handleSubmit(e);
    }
  };

  // Pre-populate if editing
  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title || '');
      setDescription(existingPlan.description || '');
      setEmoji(existingPlan.icon || '🧩');
      setColor(existingPlan.color || 'cozy-orange');
      setCategory(existingPlan.category || 'Personal');
      setPriority(existingPlan.priority || 'medium');
      setTags(existingPlan.tags?.join(', ') || '');
      
      const enabled = Object.keys(existingPlan.modules || {}).filter(k => !!existingPlan.modules[k]);
      setEnabledModules(enabled);

      if (existingPlan.modules?.progress) {
        setProgressTarget(existingPlan.modules.progress.target);
        setProgressUnit(existingPlan.modules.progress.unit);
        setProgressType(existingPlan.modules.progress.type || 'bar');
      }
      if (existingPlan.modules?.scheduling) {
        setRecurringType(existingPlan.modules.scheduling.recurring || 'none');
        setRepeatDays(existingPlan.modules.scheduling.repeatDays || []);
        setDueDate(existingPlan.modules.scheduling.dueDate || '');
      }
      if (existingPlan.modules?.tracking) {
        setTrackingType(existingPlan.modules.tracking.type || 'numeric');
      }
      setStep(2);
    } else {
      // Reset
      setTitle('');
      setDescription('');
      setEmoji('🎯');
      setColor('cozy-orange');
      setCategory('Personal');
      setPriority('medium');
      setTags('');
      setEnabledModules([]);
      setStep(1);
    }
    setErrors({});
  }, [existingPlan, isOpen]);

  if (!isOpen) return null;

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEnabledModules(template.modules);
      setEmoji(template.icon);
      setTitle(templateId === 'custom' ? '' : template.name);
      setDescription(template.desc);
    }
    setStep(2);
  };

  const handleToggleModule = (moduleId: string) => {
    setEnabledModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Build the clean Plan payload
    const modulesPayload: any = {};

    if (enabledModules.includes('progress')) {
      modulesPayload.progress = {
        target: Number(progressTarget) || 100,
        current: existingPlan?.modules?.progress?.current || 0,
        unit: progressUnit || 'Percent',
        type: progressType
      };
    }
    if (enabledModules.includes('scheduling')) {
      modulesPayload.scheduling = {
        startDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || undefined,
        recurring: recurringType,
        repeatDays: recurringType === 'weekly' ? repeatDays : []
      };
    }
    if (enabledModules.includes('checklist')) {
      const parsedTasks = initialTasks
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map((t, i) => ({ id: `task-${Date.now()}-${i}`, text: t, completed: false }));
      
      modulesPayload.checklist = {
        items: existingPlan?.modules?.checklist?.items || parsedTasks.length > 0 ? parsedTasks : []
      };
    }
    if (enabledModules.includes('milestones')) {
      const parsedMilestones = initialMilestones
        .split('\n')
        .map(m => m.trim())
        .filter(m => m.length > 0)
        .map((m, i) => ({ id: `milestone-${Date.now()}-${i}`, title: m, completed: false }));

      modulesPayload.milestones = {
        items: existingPlan?.modules?.milestones?.items || parsedMilestones.length > 0 ? parsedMilestones : []
      };
    }
    if (enabledModules.includes('tracking')) {
      modulesPayload.tracking = {
        type: trackingType,
        logs: existingPlan?.modules?.tracking?.logs || []
      };
    }
    if (enabledModules.includes('time')) {
      modulesPayload.time = {
        estimatedHours: 0,
        actualHours: 0,
        timetable: existingPlan?.modules?.time?.timetable || []
      };
    }
    if (enabledModules.includes('journal')) {
      modulesPayload.journal = {
        prompts: [`What specific breakthroughs did you achieve on ${title} today?`],
        linkedEntries: existingPlan?.modules?.journal?.linkedEntries || []
      };
    }
    if (enabledModules.includes('habits')) {
      modulesPayload.habits = {
        streak: existingPlan?.modules?.habits?.streak || 0,
        longestStreak: existingPlan?.modules?.habits?.longestStreak || 0,
        history: existingPlan?.modules?.habits?.history || {}
      };
    }
    if (enabledModules.includes('automation')) {
      modulesPayload.automation = {
        rules: existingPlan?.modules?.automation?.rules || [
          { trigger: trigger, action: action, enabled: true }
        ]
      };
    }
    if (enabledModules.includes('relationships')) {
      modulesPayload.relationships = {
        linkedPlanIds: relatedPlanId ? [relatedPlanId] : (existingPlan?.modules?.relationships?.linkedPlanIds || [])
      };
    }
    if (enabledModules.includes('notes')) {
      modulesPayload.notes = {
        content: existingPlan?.modules?.notes?.content || '',
        attachments: existingPlan?.modules?.notes?.attachments || []
      };
    }
    if (enabledModules.includes('analytics')) {
      modulesPayload.analytics = {
        consistencyScore: existingPlan?.modules?.analytics?.consistencyScore || 0
      };
    }
    if (enabledModules.includes('collaboration')) {
      modulesPayload.collaboration = {
        members: existingPlan?.modules?.collaboration?.members || ['Cozy Assistant'],
        activityLog: existingPlan?.modules?.collaboration?.activityLog || ['Plan initialized.']
      };
    }

    const payload = {
      id: existingPlan?.id || `plan-${Date.now()}`,
      title,
      description,
      icon: emoji,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      priority,
      color,
      status: existingPlan?.status || 'active',
      isFavorite: existingPlan?.isFavorite || false,
      notes: existingPlan?.notes || '',
      modules: modulesPayload
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#FAF6EB] border-3 border-cozy-text-dark rounded-3xl max-w-2xl w-full flex flex-col cozy-shadow relative max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-cozy-text-dark/10 flex justify-between items-center bg-[#F1ECE2] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cozy-orange rounded-lg flex items-center justify-center border-2 border-cozy-text-dark">
              <Sliders size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cozy-text-dark">
                {existingPlan ? 'Customize Modules' : 'Universal Plan Builder'}
              </h3>
              <p className="text-[10px] text-cozy-text-muted font-bold mt-0.5">
                {existingPlan ? 'Tweak settings for plan: ' + existingPlan.title : 'Build modular systems like LEGO'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 rounded-lg border border-transparent hover:border-cozy-text-dark text-cozy-text-muted hover:text-cozy-text-dark cursor-pointer transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="bg-[#FCF8F2] px-5 py-2.5 border-b border-cozy-text-dark/10 flex justify-between items-center text-[10px] font-black text-cozy-text-muted tracking-wide shrink-0 font-mono">
          <span>STEP {step} OF 4</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`w-4 h-1.5 rounded-full border border-cozy-text-dark/25 ${step === s ? 'bg-cozy-orange' : 'bg-white'}`} 
              />
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 leading-relaxed">
          
          {/* STEP 1: Select Template */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Choose a Template or Blank Slate</h4>
                <p className="text-[10px] text-cozy-text-muted font-semibold mt-1">Templates pre-select modular lego blocks. Customize anything later!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t.id)}
                    className="p-3 text-left bg-white hover:bg-[#FFFDF9] border-2 hover:border-cozy-orange border-cozy-text-dark rounded-2xl transition cursor-pointer select-none flex items-start gap-3 cozy-shadow-sm hover:-translate-y-0.5"
                  >
                    <span className="text-2xl bg-cozy-bg p-1.5 rounded-xl border border-cozy-text-dark/15 shrink-0 select-none">
                      {t.icon}
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-cozy-text-dark flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {t.id === 'custom' && (
                          <span className="text-[8px] px-1 bg-cozy-yellow text-cozy-text-dark rounded font-mono font-black border border-cozy-text-dark">BUILDER</span>
                        )}
                      </h5>
                      <p className="text-[9px] text-cozy-text-muted font-semibold leading-normal mt-1">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-black text-cozy-text-muted">Plan Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 10-Week French Sprint, Wedding Itinerary, Fitness Streak"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim() && errors.title) {
                      setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.title;
                        return copy;
                      });
                    }
                  }}
                  className={`px-3 py-2 bg-white border-2 rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none transition-all ${
                    errors.title ? 'border-cozy-orange focus:border-cozy-orange ring-1 ring-cozy-orange/20' : 'border-cozy-text-dark'
                  }`}
                />
                {errors.title && (
                  <div className="text-[10px] text-cozy-orange font-bold mt-1 flex items-center gap-1 bg-cozy-orange/10 px-2.5 py-1.5 rounded-lg border border-cozy-orange/20 animate-pulse">
                    <AlertCircle size={12} strokeWidth={2.5} />
                    <span>{errors.title}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-cozy-text-muted">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark cursor-pointer focus:outline-none"
                  >
                    <option value="Personal">Personal Growth</option>
                    <option value="Fitness">Fitness & Wellness</option>
                    <option value="Reading">Reading & Knowledge</option>
                    <option value="Career">Career & Business</option>
                    <option value="Travel">Travel & Explore</option>
                    <option value="Budget">Finance & Budget</option>
                    <option value="Social">Events & Social</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-cozy-text-muted">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition cursor-pointer ${
                          priority === p 
                            ? 'bg-cozy-orange text-white border-cozy-text-dark shadow-sm' 
                            : 'bg-white text-cozy-text-muted border-cozy-text-dark/15 hover:border-cozy-text-dark'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-black text-cozy-text-muted">Description & Goal Focus</label>
                <textarea
                  placeholder="Summarize what this system aims to help you track or construct..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="px-3 py-2 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark resize-none leading-relaxed focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Emoji Select */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-cozy-text-muted">Select Emoji Icon</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border-2 border-cozy-text-dark rounded-xl max-h-[85px] overflow-y-auto">
                    {EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setEmoji(em)}
                        className={`text-base p-1 hover:bg-[#FAF6EB] rounded transition cursor-pointer select-none ${emoji === em ? 'bg-cozy-orange/20 border border-cozy-orange' : 'border border-transparent'}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-black text-cozy-text-muted">Theme Label Color</label>
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-white border-2 border-cozy-text-dark rounded-xl">
                    {THEME_COLORS.map(tc => (
                      <button
                        key={tc.class}
                        type="button"
                        onClick={() => setColor(tc.class)}
                        className={`w-full h-7 rounded-lg border-2 flex items-center justify-center cursor-pointer transition hover:scale-105 ${tc.bg} ${color === tc.class ? 'border-cozy-orange shadow-md' : 'border-black/5'}`}
                        title={tc.name}
                      >
                        {color === tc.class && <span className="text-[8px] text-white">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-black text-cozy-text-muted">Tags (separated by commas)</label>
                <input 
                  type="text" 
                  placeholder="e.g. writing, daily-ritual, challenge"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="px-3 py-2 bg-white border-2 border-cozy-text-dark rounded-xl text-xs font-bold text-cozy-text-dark focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Assemble Modules */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark">Assemble Modular LEGO Blocks</h4>
                <p className="text-[10px] text-cozy-text-muted font-semibold mt-1">Combine, connect, and toggle any set of productivity modules.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[48vh] overflow-y-auto p-1">
                {AVAILABLE_MODULES.map(m => {
                  const IconComp = m.icon;
                  const isEnabled = enabledModules.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleModule(m.id)}
                      className={`p-2.5 text-left bg-white border-2 rounded-2xl transition cursor-pointer select-none flex items-start gap-2.5 relative group ${
                        isEnabled ? 'border-cozy-orange bg-[#FFFDF9] ring-2 ring-cozy-orange/20' : 'border-cozy-text-dark/15 hover:border-cozy-text-dark'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg border ${isEnabled ? 'bg-cozy-orange/10 text-cozy-orange border-cozy-orange/25' : 'bg-cozy-bg text-cozy-text-muted border-cozy-text-dark/10'}`}>
                        <IconComp size={15} />
                      </div>
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black text-cozy-text-dark leading-none">{m.label}</span>
                          <span className="text-[7px] px-1 bg-cozy-text-dark/5 text-cozy-text-muted rounded-sm uppercase font-mono font-bold leading-tight">{m.cat}</span>
                        </div>
                        <p className="text-[9px] text-cozy-text-muted font-semibold leading-normal mt-1">{m.desc}</p>
                      </div>

                      {/* Status indicator */}
                      <div className="absolute top-2.5 right-2.5">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                          isEnabled ? 'bg-cozy-orange border-cozy-text-dark text-white' : 'bg-white border-cozy-text-dark/10 text-transparent'
                        }`}>
                          ✓
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-cozy-yellow/20 p-2.5 border-2 border-dashed border-cozy-yellow rounded-xl text-center">
                <span className="text-[9px] font-black text-[#7A6956]">⚡ {enabledModules.length} Modules activated for this custom Plan type!</span>
              </div>
            </div>
          )}

          {/* STEP 4: Setup Settings for Enabled Modules */}
          {step === 4 && (
            <div className="space-y-5 max-h-[55vh] overflow-y-auto p-1 leading-normal">
              
              {enabledModules.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs font-bold text-cozy-text-muted">No specific configuration settings required!</p>
                  <p className="text-[10px] text-cozy-text-muted">You have selected a minimalistic custom model. You can hit publish now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark border-b border-cozy-text-dark/10 pb-1.5 flex items-center gap-1.5">
                    <Sliders size={13} className="text-cozy-orange" />
                    <span>Dynamic Module Settings</span>
                  </h4>

                  {/* Progress Module Settings */}
                  {enabledModules.includes('progress') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1">
                        <Target size={14} className="text-cozy-orange" />
                        <span>Progress Metric Setup</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">Target Numeric Goal</label>
                          <input 
                            type="number" 
                            value={progressTarget}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setProgressTarget(val);
                              if (val > 0 && errors.progressTarget) {
                                setErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.progressTarget;
                                  return copy;
                                });
                              }
                            }}
                            className={`px-2.5 py-1.5 bg-[#FAF6EB] border rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none transition-all ${
                              errors.progressTarget ? 'border-cozy-orange focus:border-cozy-orange ring-1 ring-cozy-orange/15' : 'border-cozy-text-dark/15'
                            }`}
                          />
                          {errors.progressTarget && (
                            <div className="text-[9px] text-cozy-orange font-bold mt-0.5 flex items-center gap-1 bg-cozy-orange/10 px-1.5 py-0.5 rounded border border-cozy-orange/20">
                              <AlertCircle size={10} strokeWidth={2.5} />
                              <span>{errors.progressTarget}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">Unit Label</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Liters, Words, Pages"
                            value={progressUnit}
                            onChange={(e) => setProgressUnit(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">Visual Theme</label>
                          <select 
                            value={progressType}
                            onChange={(e: any) => setProgressType(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none"
                          >
                            <option value="bar">Linear Progress Bar</option>
                            <option value="circular">Circular Goal Wheel</option>
                            <option value="numeric">Plain Numeric Fractions</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scheduling Module Settings */}
                  {enabledModules.includes('scheduling') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-2.5 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1">
                        <Calendar size={14} className="text-cozy-orange" />
                        <span>Schedule & Deadline Rules</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">Recurring Trigger Frequency</label>
                          <select 
                            value={recurringType}
                            onChange={(e: any) => setRecurringType(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none"
                          >
                            <option value="none">One-time (No Repeat)</option>
                            <option value="daily">Everyday (Daily)</option>
                            <option value="weekly">Custom Weekly Repeat Days</option>
                            <option value="monthly">Monthly Cycle</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">Target Finish Date</label>
                          <input 
                            type="date" 
                            value={dueDate}
                            onChange={(e) => {
                              setDueDate(e.target.value);
                              if (errors.dueDate) {
                                setErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy.dueDate;
                                  return copy;
                                });
                              }
                            }}
                            className={`px-2.5 py-1.5 bg-[#FAF6EB] border rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none transition-all ${
                              errors.dueDate ? 'border-cozy-orange focus:border-cozy-orange ring-1 ring-cozy-orange/15' : 'border-cozy-text-dark/15'
                            }`}
                          />
                          {errors.dueDate && (
                            <div className="text-[9px] text-cozy-orange font-bold mt-0.5 flex items-center gap-1 bg-cozy-orange/10 px-1.5 py-0.5 rounded border border-cozy-orange/20">
                              <AlertCircle size={10} strokeWidth={2.5} />
                              <span>{errors.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {recurringType === 'weekly' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">Select active repeat days</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => {
                              const active = repeatDays.includes(d);
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    const updated = active ? repeatDays.filter(x => x !== d) : [...repeatDays, d];
                                    setRepeatDays(updated);
                                    if (updated.length > 0 && errors.repeatDays) {
                                      setErrors(prev => {
                                        const copy = { ...prev };
                                        delete copy.repeatDays;
                                        return copy;
                                      });
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase font-mono transition-all ${
                                    active ? 'bg-cozy-orange border-cozy-text-dark text-white' : 'bg-white border-cozy-text-dark/10 text-cozy-text-muted'
                                  }`}
                                >
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                          {errors.repeatDays && (
                            <div className="text-[9px] text-cozy-orange font-bold mt-1.5 flex items-center gap-1 bg-cozy-orange/10 px-2 py-1 rounded-lg border border-cozy-orange/20 w-fit">
                              <AlertCircle size={10} strokeWidth={2.5} />
                              <span>{errors.repeatDays}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checklist & Tasks module pre-fills */}
                  {enabledModules.includes('checklist') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1 mb-1">
                        <CheckSquare size={14} className="text-cozy-orange" />
                        <span>Pre-populate Checklist Tasks</span>
                      </div>
                      <label className="text-[8px] uppercase font-black text-cozy-text-muted">Subtasks (One item per line)</label>
                      <textarea
                        placeholder="e.g. Design Wireframes&#10;Consult Mentor Alex&#10;Write clean unit tests"
                        value={initialTasks}
                        onChange={(e) => setInitialTasks(e.target.value)}
                        rows={2.5}
                        className="w-full px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Milestones module pre-fills */}
                  {enabledModules.includes('milestones') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1 mb-1">
                        <Layers size={14} className="text-cozy-orange" />
                        <span>Define Phases / Milestones</span>
                      </div>
                      <label className="text-[8px] uppercase font-black text-cozy-text-muted">Key Milestones (One per line)</label>
                      <textarea
                        placeholder="e.g. Milestone 1: Blueprint Ready&#10;Milestone 2: Prototype complete&#10;Milestone 3: Customer feedback logs"
                        value={initialMilestones}
                        onChange={(e) => setInitialMilestones(e.target.value)}
                        rows={2.5}
                        className="w-full px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none resize-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Tracking Variables module */}
                  {enabledModules.includes('tracking') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1">
                        <Sliders size={14} className="text-cozy-orange" />
                        <span>Tracker Variable Type</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { id: 'numeric', label: 'Numeric', desc: 'Water, Calories, Money' },
                          { id: 'boolean', label: 'Yes / No', desc: 'Completed or Not' },
                          { id: 'mood', label: 'Mood Score', desc: 'Scale 1 to 5 index' },
                          { id: 'timer', label: 'Duration Timer', desc: 'Stopwatch recorder' }
                        ] as const).map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setTrackingType(opt.id)}
                            className={`p-2 border-2 rounded-xl text-center cursor-pointer transition ${
                              trackingType === opt.id ? 'bg-cozy-orange/10 border-cozy-orange text-cozy-text-dark font-black' : 'bg-[#FAF6EB] border-cozy-text-dark/15 text-cozy-text-muted'
                            }`}
                          >
                            <div className="text-[10px] font-black">{opt.label}</div>
                            <div className="text-[7px] text-cozy-text-muted font-bold mt-1 leading-tight">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automation Module */}
                  {enabledModules.includes('automation') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1">
                        <Zap size={14} className="text-cozy-orange animate-pulse" />
                        <span>Modular Trigger Automations</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-normal font-bold text-cozy-text-dark">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">IF THIS HAPPENS (TRIGGER)</label>
                          <select 
                            value={trigger}
                            onChange={(e) => setTrigger(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none cursor-pointer"
                          >
                            <option value="habit_completed">When Habit is Completed</option>
                            <option value="checklist_done">When All Checklist subtasks done</option>
                            <option value="milestone_unlocked">When Milestone achieved</option>
                            <option value="duration_logged">When Focus Timer logged &gt; 1h</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase font-black text-cozy-text-muted">THEN DO THIS (ACTION)</label>
                          <select 
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none cursor-pointer"
                          >
                            <option value="increase_progress">Increase Progress bar +10%</option>
                            <option value="increment_streak">Increment streak counter +1</option>
                            <option value="create_celebration_journal">Auto-create celebration journal prompt</option>
                            <option value="log_to_analytics">Add correlation dot to Analytics</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Relationships Module */}
                  {enabledModules.includes('relationships') && (
                    <div className="bg-white border-2 border-cozy-text-dark/15 p-3.5 rounded-2xl space-y-2 shadow-xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cozy-text-dark border-b border-[#4A3D30]/5 pb-1">
                        <Users size={14} className="text-cozy-orange" />
                        <span>Link with existing Plans</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-black text-cozy-text-muted">Select Target plan link</label>
                        <select 
                          value={relatedPlanId}
                          onChange={(e) => setRelatedPlanId(e.target.value)}
                          className="px-2.5 py-1.5 bg-[#FAF6EB] border border-cozy-text-dark/15 rounded-lg text-xs font-bold text-cozy-text-dark focus:outline-none cursor-pointer"
                        >
                          <option value="">-- No link (Choose a plan to create a dependency link) --</option>
                          {allPlans.map(p => (
                            <option key={p.id} value={p.id}>{p.icon} {p.title} ({p.category})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-cozy-text-dark/10 flex justify-between items-center bg-[#F1ECE2] shrink-0">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white disabled:opacity-30 border-2 border-cozy-text-dark text-cozy-text-dark font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none tactile-btn-retro"
          >
            <ChevronLeft size={13} strokeWidth={3} />
            <span>Back</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cozy-orange text-white border-2 border-cozy-text-dark font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none shadow-sm tactile-btn-retro"
            >
              <span>Next</span>
              <ChevronRight size={13} strokeWidth={3} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-cozy-orange text-white border-3 border-cozy-text-dark font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer select-none shadow-md tactile-btn-retro"
            >
              <Sparkles size={13} className="animate-pulse" />
              <span>Deploy Plan ✨</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
