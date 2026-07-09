/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Target,
  MessageSquare,
  Heart,
  Award,
  PlusCircle,
  Calendar,
  Compass,
  CheckSquare,
  Bookmark
} from 'lucide-react';
import { JournalEntry, Habit, Goal } from '../types';

interface MoodAnalyticsProps {
  entries: JournalEntry[];
  habits?: Habit[];
  goals?: Goal[];
  setGoals?: React.Dispatch<React.SetStateAction<Goal[]>>;
  setEntries?: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  onNavigateToEntry?: (id: string) => void;
  onCreatePageForDate?: (date: Date) => void;
  onSaveConvertedEntry?: (entry: JournalEntry) => void;
  initialSelectedDate?: Date | null;
}

export default function MoodAnalytics({ 
  entries,
  habits = [],
  goals = [],
  setGoals,
  setEntries,
  onNavigateToEntry,
  onCreatePageForDate,
  onSaveConvertedEntry,
  initialSelectedDate
}: MoodAnalyticsProps) {
  const today = new Date();
  const defaultDate = initialSelectedDate ? new Date(initialSelectedDate) : today;

  const [selectedYear, setSelectedYear] = useState<number>(defaultDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultDate.getMonth());
  
  const [selectedDate, setSelectedDate] = useState<{ day: number; month: number; year: number }>({
    day: defaultDate.getDate(),
    month: defaultDate.getMonth(),
    year: defaultDate.getFullYear()
  });

  const [selectedDateDetail, setSelectedDateDetail] = useState<{
    day: number;
    month: number;
    year: number;
    dots: string[];
    simulatedContent?: {
      transcript: string;
      summary: string;
      mood: string;
      moodEmoji: string;
      emotions: string[];
      takeaways: string[];
    };
    realEntry?: JournalEntry;
  } | null>(null);

  // Active index for Monthly Takeaways carousel
  const [activeTakeawayIndex, setActiveTakeawayIndex] = useState<number>(0);

  // States for AI Life Analyst Insights
  const [insightsTimeframe, setInsightsTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [insights, setInsights] = useState<{
    summary: string;
    improvements: string[];
    activities: string[];
    emotionalTrend: string;
    suggestions: string[];
    growthScore: number;
  } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [errorInsights, setErrorInsights] = useState<string | null>(null);

  const fetchInsights = async (tf: 'day' | 'week' | 'month' | 'year') => {
    setLoadingInsights(true);
    setErrorInsights(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          timeframe: tf,
          entries: entries,
          habits: habits,
          goals: goals
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      } else {
        const errData = await res.json();
        setErrorInsights(errData.error || "Failed to load insights.");
      }
    } catch (err) {
      setErrorInsights("Network or server connection issue.");
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchInsights(insightsTimeframe);
  }, [insightsTimeframe, entries.length, habits.length, goals.length]);

  // States for Quick Goal Planning and Intention Scheduling within the modal
  const [activeModalTab, setActiveModalTab] = useState<'info' | 'intention' | 'goal'>('info');
  const [scheduledIntentionText, setScheduledIntentionText] = useState<string>('');
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<'Personal' | 'Fitness' | 'Reading' | 'Career' | 'Habit'>('Personal');

  // Filter entries to only real entries within the visible month
  const monthlyEntries = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Calculate most frequent emotion
  const emotionCounts: Record<string, number> = {};
  monthlyEntries.forEach(e => {
    (e.emotions || []).forEach(emo => {
      emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
    });
  });
  let mostFrequentEmotion = 'None yet';
  let maxCount = 0;
  Object.entries(emotionCounts).forEach(([emo, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentEmotion = emo;
    }
  });

  // Calculate habit completion rate for the visible month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const todayDate = new Date();
  let daysToCheck = daysInMonth;
  if (selectedYear === todayDate.getFullYear() && selectedMonth === todayDate.getMonth()) {
    daysToCheck = todayDate.getDate();
  } else if (selectedYear > todayDate.getFullYear() || (selectedYear === todayDate.getFullYear() && selectedMonth > todayDate.getMonth())) {
    daysToCheck = 0; // Future month has 0 elapsed days
  }

  let totalPossible = habits.length * daysToCheck;
  let completedCount = 0;
  if (totalPossible > 0) {
    habits.forEach(habit => {
      for (let d = 1; d <= daysToCheck; d++) {
        const yyyy = selectedYear;
        const mm = String(selectedMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        if (habit.history[dateKey]) {
          completedCount++;
        }
      }
    });
  }
  const habitCompletionRate = totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0;

  // Calculate unique monthly takeaways
  const monthlyTakeaways: string[] = [];
  monthlyEntries.forEach(e => {
    (e.takeaways || []).forEach(t => {
      if (t && !monthlyTakeaways.includes(t)) {
        monthlyTakeaways.push(t);
      }
    });
  });

  // Filter active goals due in the visible month
  const targetPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthlyGoals = (goals || []).filter(g => g.deadline.startsWith(targetPrefix));

  // Reset modal state when the selected date changes
  useEffect(() => {
    setActiveModalTab('info');
    setScheduledIntentionText('');
    setNewGoalTitle('');
    setNewGoalCategory('Personal');
  }, [selectedDateDetail?.day, selectedDateDetail?.month, selectedDateDetail?.year]);

  // Sync calendar view when a specific target date is passed (e.g., when clicking "View on Calendar" from a journal page)
  useEffect(() => {
    if (initialSelectedDate) {
      const d = new Date(initialSelectedDate);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDate({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear()
      });
      
      const details = getReflectionsForDate(d.getDate(), d.getMonth(), d.getFullYear());
      setSelectedDateDetail({
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        dots: details.dots,
        realEntry: details.realEntry,
        simulatedContent: details.simulatedContent
      });
    }
  }, [initialSelectedDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };



  // HIGH-FIDELITY PRESET REFLECTIONS FOR JUNE 2026 (MATCHING USER IMAGE)
  const SEED_JUNE_2026_DOTS: Record<number, string[]> = {
    1: ['yellow'],
    2: ['green', 'yellow'],
    4: ['yellow'],
    5: ['green', 'yellow'],
    7: ['grey'],
    8: ['yellow'],
    9: ['yellow'],
    10: ['green', 'purple'],
    11: ['purple', 'grey'],
    12: ['green', 'yellow'],
    13: ['blue', 'yellow'],
    14: ['red', 'yellow'],
    15: ['green', 'grey'],
    16: ['green', 'yellow'],
    19: ['red', 'yellow'],
    20: ['green', 'yellow'],
    21: ['red', 'grey'],
    22: ['yellow', 'red'],
    23: ['green', 'yellow'],
    25: ['green', 'yellow'],
    26: ['grey', 'green'],
    27: ['red', 'yellow'],
    28: ['purple', 'grey'],
    29: ['yellow', 'grey'],
    30: ['purple', 'red', 'yellow'],
  };

  const getSimulatedContent = (day: number) => {
    const contents: Record<number, any> = {
      1: {
        transcript: "Woke up early and felt incredibly focused starting June. I sat in quiet contemplation for 10 minutes and then outlined my development milestones for the week.",
        summary: "Highly productive morning meditation followed by clear weekly goal structures.",
        mood: "Peaceful",
        moodEmoji: "😊",
        emotions: ["Focus", "Clarity", "Calm"],
        takeaways: ["Morning planning sets an incredible vibe for the whole week.", "Keep tea handy!"]
      },
      2: {
        transcript: "Hit an outstanding milestone today completing my 5K speed run. Afterward, I refactored the sidebar menu of Daynest. I felt so energized and proud of the visual updates.",
        summary: "Achieved personal best speed run. Refactored workspace sidebar layouts with high energy.",
        mood: "Great",
        moodEmoji: "😍",
        emotions: ["Exhilaration", "Confidence", "Pride"],
        takeaways: ["Physical movement heavy boosts creativity.", "Document progress to celebrate small wins."]
      },
      5: {
        transcript: "Worked on client feedback and added custom interactive popups. Spent the evening with some relaxing background lo-fi music and cozy journaling. Life feels balanced.",
        summary: "Completed responsive interactions and feedback loops. Balanced evening journaling.",
        mood: "Great",
        moodEmoji: "😊",
        emotions: ["Satisfaction", "Tranquility", "Joy"],
        takeaways: ["Lofi music helps ease focus block periods.", "Always celebrate beautiful, polished code lines."]
      },
      8: {
        transcript: "A calm, gentle Monday. Dealt with standard admin work but stayed super grounded by pausing for 3 mindful deep breath loops between emails.",
        summary: "Handled busy inbox with composed focus and multiple mini-meditations.",
        mood: "Good",
        moodEmoji: "😊",
        emotions: ["Balance", "Patience", "Composure"],
        takeaways: ["Pausing for 3 breaths before opening a difficult email is a superpower."]
      },
      9: {
        transcript: "Felt very content today. Did some deep research into responsive layouts, worked on the styling of the calendar grids, and drank a perfect lavender-chamomile blend.",
        summary: "Tranquil afternoon designing CSS layout cells and savoring floral tea.",
        mood: "Good",
        moodEmoji: "😊",
        emotions: ["Contentment", "Artistry", "Quiet"],
        takeaways: ["Designing visual systems is meditative when you take your time."]
      },
      10: {
        transcript: "Enjoyed a lovely fresh walk in the neighborhood park. I got some exciting creative startup ideas and felt very happy to design beautiful UI components today.",
        summary: "Pleasant outdoor walk sparked innovative startup ideas and design excitement.",
        mood: "Great",
        moodEmoji: "😍",
        emotions: ["Inspiration", "Cheerfulness", "Creativity"],
        takeaways: ["Leave the phone at home during park runs to unlock true brain storming space."]
      },
      12: {
        transcript: "Fantastic coding session! Solved a complex state dependency issue that was causing re-renders. Celebrated by brewing a gorgeous hot mug of herbal tea.",
        summary: "Resolved a major React performance bug and enjoyed premium cozy tea.",
        mood: "Great",
        moodEmoji: "😊",
        emotions: ["Relief", "Accomplishment", "Comfort"],
        takeaways: ["Break complex dependency arrays down to simple primitives."]
      },
      14: {
        transcript: "Felt some startup pitch pressure today. Preparing slides is always stressful, but I focused on breaking down my pitch deck into 3 core value propositions.",
        summary: "Overcoming pitch slide anxiety by chunking and structuring presentations.",
        mood: "Hard",
        moodEmoji: "😔",
        emotions: ["Anxiety", "Vulnerability", "Determination"],
        takeaways: ["Focus strictly on what you control, not the investor's immediate decision."]
      },
      19: {
        transcript: "Had a difficult day sleeping last night, which left me feeling exhausted during afternoon syncs. Compensated by drinking too much espresso. Need a solid sleep reset.",
        summary: "Exhausted after poor overnight sleep. Plan a screen-free evening wind down.",
        mood: "Hard",
        moodEmoji: "😴",
        emotions: ["Fatigue", "Restlessness", "Slight Stress"],
        takeaways: ["Coffee is not a substitute for deep REM sleep. Reset your bedroom routine."]
      },
      22: {
        transcript: "Felt slightly overwhelmed with the upcoming exams. Resolved it by organizing all French words in a cozy, beautiful color-coded spreadsheet. Step by step, I got it.",
        summary: "Exam stress successfully managed via neat, structured revision files.",
        mood: "Good",
        moodEmoji: "😐",
        emotions: ["Stress", "Relief", "Confidence"],
        takeaways: ["When tasks look like mountains, turn them into little modular steps."]
      },
      30: {
        transcript: "I completed the ultimate reflections calendar view! It looks exactly like my vision—cozy, neat, and highly interactive. Enjoying a tranquil sunset feeling extremely grateful.",
        summary: "Successful calendar launch! Filled with deep gratitude and creative joy.",
        mood: "Great",
        moodEmoji: "😍",
        emotions: ["Gratitude", "Creative Joy", "Tranquility"],
        takeaways: ["A beautiful design is a form of self-care. Craft is worth the extra mile."]
      }
    };

    return contents[day] || {
      transcript: "A lovely peaceful day of journaling and mindfulness. Sat by the window watching the summer breeze.",
      summary: "Spent quiet time reflecting and breathing mindfully.",
      mood: "Good",
      moodEmoji: "😊",
      emotions: ["Calm", "Peace", "Gratitude"],
      takeaways: ["Taking things slowly is a beautiful rhythm of living."]
    };
  };

  const getProgressForDate = (day: number, month: number, year: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateKey = `${year}-${m}-${d}`;
    const saved = localStorage.getItem(`cozy_chk_${dateKey}`);
    if (saved) {
      try {
        const items = JSON.parse(saved);
        const total = items.length;
        if (total === 0) return null;
        const completed = items.filter((it: any) => it.completed).length;
        return { completed, total };
      } catch (e) {
        return null;
      }
    }
    // If June 30, 2026, return a mock default state if not modified yet
    if (dateKey === '2026-06-30') {
      return { completed: 3, total: 6 };
    }
    return null;
  };

  const isDateActive = (day: number, month: number, year: number): boolean => {
    const hasReal = entries.some(e => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
    if (hasReal) return true;
    if (year === 2026 && month === 5) {
      return !!SEED_JUNE_2026_DOTS[day];
    }
    return false;
  };

  const getStreakLengthAtDate = (day: number, month: number, year: number): number => {
    if (!isDateActive(day, month, year)) return 0;
    
    let streak = 0;
    const current = new Date(year, month, day);
    
    while (true) {
      const d = current.getDate();
      const m = current.getMonth();
      const y = current.getFullYear();
      
      if (isDateActive(d, m, y)) {
        streak++;
        // go back 1 day
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getActiveDatesSet = (): Set<string> => {
    const activeDates = new Set<string>();
    
    // Real entries
    entries.forEach(e => {
      const d = new Date(e.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      activeDates.add(`${y}-${m}-${day}`);
    });
    
    // June 2026 simulated entries
    Object.keys(SEED_JUNE_2026_DOTS).forEach(dayStr => {
      const dayNum = parseInt(dayStr, 10);
      const day = String(dayNum).padStart(2, '0');
      activeDates.add(`2026-06-${day}`);
    });
    
    return activeDates;
  };

  const getReflectionsForDate = (day: number, month: number, year: number) => {
    // Check if there is a real entry
    const realMatched = entries.find(e => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

    if (realMatched) {
      // Map mood of real entry to appropriate dot category
      const mood = realMatched.mood || 'Calm';
      let dot = 'blue'; // default Notes Only
      if (mood === 'Happy' || mood === 'Excited') {
        dot = 'green';
      } else if (mood === 'Peaceful' || mood === 'Calm') {
        dot = 'yellow';
      } else if (mood === 'Stressed' || mood === 'Anxious' || mood === 'Sad') {
        dot = 'red';
      } else if (mood === 'Tired') {
        dot = 'purple';
      }

      return {
        realEntry: realMatched,
        dots: [dot]
      };
    }

    // If June 2026, return simulated seed dots and content to match image!
    if (year === 2026 && month === 5) {
      const dots = SEED_JUNE_2026_DOTS[day] || [];
      if (dots.length > 0) {
        return {
          dots,
          simulatedContent: getSimulatedContent(day)
        };
      }
    }

    return {
      dots: []
    };
  };

  const getMoodCategory = (moodStr?: string): 'peaceful' | 'excited' | 'tired' | 'stressed' | 'neutral' => {
    if (!moodStr) return 'neutral';
    const m = moodStr.toLowerCase();
    if (m.includes('peaceful') || m.includes('calm') || m.includes('good') || m.includes('reflective') || m.includes('positive') || m.includes('balance') || m.includes('content') || m.includes('tranquil') || m.includes('satisfaction') || m.includes('patience') || m.includes('composure') || m.includes('serene')) {
      return 'peaceful';
    }
    if (m.includes('excited') || m.includes('happy') || m.includes('great') || m.includes('joy') || m.includes('energetic') || m.includes('focus') || m.includes('creative') || m.includes('pride') || m.includes('inspiration')) {
      return 'excited';
    }
    if (m.includes('tired') || m.includes('exhausted') || m.includes('hard') || m.includes('fatigue') || m.includes('muted') || m.includes('sluggish') || m.includes('weak')) {
      return 'tired';
    }
    if (m.includes('stressed') || m.includes('anxious') || m.includes('sad') || m.includes('overwhelmed') || m.includes('vulnerable') || m.includes('anxiety') || m.includes('fear') || m.includes('worry')) {
      return 'stressed';
    }
    return 'peaceful'; // Default fallback for general positive/reflective mood
  };

  const getDaysForMonthGrid = (year: number, month: number) => {
    // get number of days in the current month
    const numDays = new Date(year, month + 1, 0).getDate();
    // get day of the week of the 1st of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    let startDayOfWeek = new Date(year, month, 1).getDay();
    // Convert starting day of week to Mon-first index:
    // Sun: 0 -> 6, Mon: 1 -> 0, Tue: 2 -> 1, ..., Sat: 6 -> 5
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const daysGrid = [];

    // Trailing previous month days
    const prevMonthNumDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      daysGrid.push({
        day: prevMonthNumDays - i,
        isCurrentMonth: false,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year
      });
    }

    // Current month days
    for (let i = 1; i <= numDays; i++) {
      daysGrid.push({
        day: i,
        isCurrentMonth: true,
        month: month,
        year: year
      });
    }

    // Next month days to fill grid
    const totalCells = daysGrid.length > 35 ? 42 : 35;
    const remaining = totalCells - daysGrid.length;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthVal = month === 11 ? 0 : month + 1;
    for (let i = 1; i <= remaining; i++) {
      daysGrid.push({
        day: i,
        isCurrentMonth: false,
        month: nextMonthVal,
        year: nextMonthYear
      });
    }

    return daysGrid;
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 md:p-8 pb-20" id="analytics_tab">
      
      {/* Header */}
      <div className="mb-6 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cozy-orange/10 text-cozy-orange border border-cozy-orange/20">
          <Calendar size={11} strokeWidth={2.5} />
          <span>Analytics & History</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Calendar & Insights</h2>
        <p className="text-xs text-cozy-text-muted font-bold">Your reflections calendar, agenda and cognitive emotional insights</p>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column: Calendar (col-span-7/8) */}
        <div className="lg:col-span-7 xl:col-span-8 w-full relative mt-6 pt-8 bg-[#FCF8F2] border-3 border-cozy-text-dark rounded-3xl p-3.5 xs:p-5 sm:p-6 md:p-8 shadow-md cozy-shadow" style={{ backgroundImage: 'radial-gradient(#E2D1C3 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
            {/* Spiral Binder Rings Aesthetic */}
            <div className="absolute -top-3.5 left-4 right-4 sm:left-6 sm:right-6 flex justify-between pointer-events-none z-10 select-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-2.5 h-6 bg-gradient-to-r from-gray-400 via-gray-100 to-gray-500 rounded-full border border-cozy-text-dark shadow-xs" />
                  <div className="w-1.5 h-1.5 bg-[#4A3E31] rounded-full -mt-0.5" />
                </div>
              ))}
            </div>

            {/* Header of Calendar: Icon, Title & Top Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#4A3D30]/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                {/* Cute Calendar Icon Sheet matching the image */}
                <div className="w-12 h-12 bg-[#FCF8F2] border-2 border-cozy-text-dark rounded-2xl flex flex-col items-center justify-center p-1 relative shadow-sm shrink-0">
                  <div className="absolute top-1.5 flex gap-1 justify-center w-full">
                    <div className="w-1 h-2 bg-cozy-text-dark rounded-full" />
                    <div className="w-1 h-2 bg-cozy-text-dark rounded-full" />
                    <div className="w-1 h-2 bg-cozy-text-dark rounded-full" />
                  </div>
                  <div className="text-[9px] text-[#E08E6D] font-black mt-2 leading-none uppercase tracking-wider font-mono">REF</div>
                  <div className="text-sm font-black text-cozy-text-dark leading-none mt-1">{today.getDate()}</div>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-[#4A3D30] tracking-tight">Calendar</h3>
                  <p className="text-xs text-[#7A6956] font-bold">Your reflections.</p>
                </div>
              </div>

              {/* Today, Left/Right controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button 
                  onClick={() => {
                    const t = new Date();
                    setSelectedYear(t.getFullYear());
                    setSelectedMonth(t.getMonth());
                    setSelectedDate({ day: t.getDate(), month: t.getMonth(), year: t.getFullYear() });
                    const details = getReflectionsForDate(t.getDate(), t.getMonth(), t.getFullYear());
                    setSelectedDateDetail({
                      day: t.getDate(),
                      month: t.getMonth(),
                      year: t.getFullYear(),
                      dots: details.dots,
                      realEntry: details.realEntry,
                      simulatedContent: details.simulatedContent
                    });
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-xl text-xs font-black text-cozy-text-dark transition hover:scale-105 active:scale-95 cursor-pointer shadow-xs cozy-shadow-sm"
                >
                  Today
                </button>
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-xl text-cozy-text-dark transition hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-xs cozy-shadow-sm"
                  title="Previous Month"
                >
                  <ChevronLeft size={14} strokeWidth={3} />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-xl text-cozy-text-dark transition hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-xs cozy-shadow-sm"
                  title="Next Month"
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Current Month Banner */}
            <div className="flex items-center gap-1 mb-4 pl-1">
              <span className="text-lg xs:text-xl font-black text-[#4A3D30] tracking-tight">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <ChevronRight size={16} strokeWidth={3} className="text-cozy-orange/80 mt-0.5" />
            </div>

            {/* Calendar Grid Headers */}
            <div className="grid grid-cols-7 gap-1.5 xs:gap-2 text-center mb-3 bg-[#4A3D30]/5 border border-[#4A3D30]/10 rounded-2xl py-2 px-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayHead) => (
                <div key={dayHead} className="text-xs font-black text-[#6C5943] uppercase tracking-wider font-sans truncate">
                  <span className="inline md:hidden">{dayHead.slice(0, 3)}</span>
                  <span className="hidden md:inline">{dayHead}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5 xs:gap-2.5">
              {getDaysForMonthGrid(selectedYear, selectedMonth).map((cell, idx) => {
                const isToday = cell.isCurrentMonth && 
                                cell.day === today.getDate() && 
                                cell.month === today.getMonth() && 
                                cell.year === today.getFullYear();
                const dateDetail = getReflectionsForDate(cell.day, cell.month, cell.year);
                const hasDots = dateDetail.dots && dateDetail.dots.length > 0;
                const isSelected = selectedDate.day === cell.day && selectedDate.month === cell.month && selectedDate.year === cell.year;
                const cellProgress = getProgressForDate(cell.day, cell.month, cell.year);
                const streakLength = getStreakLengthAtDate(cell.day, cell.month, cell.year);

                // Determine styling based on daily mood heatmap or streak length
                const isActive = isDateActive(cell.day, cell.month, cell.year);
                const moodValue = dateDetail.realEntry?.mood || dateDetail.simulatedContent?.mood;
                const moodCategory = isActive ? getMoodCategory(moodValue) : 'neutral';

                let cellStyle = '';
                if (isSelected) {
                  cellStyle = 'border-cozy-orange bg-[#FFFDFC] scale-102 ring-4 ring-cozy-orange/30 font-black shadow-md z-20';
                } else if (isToday) {
                  cellStyle = 'border-[#E08E6D] bg-[#FCF8F2] shadow-sm font-black z-15 ring-2 ring-cozy-orange/15';
                } else if (cell.isCurrentMonth) {
                  if (isActive) {
                    if (moodCategory === 'peaceful') {
                      cellStyle = 'bg-[#FAF1D6] border-[#DCC393] text-[#5D4E3C] shadow-xs hover:bg-[#FAF1D6]/90 hover:scale-[1.02] active:scale-[0.98]';
                    } else if (moodCategory === 'excited') {
                      cellStyle = 'bg-[#FFE3CE] border-[#F1B18C] text-[#7C4015] shadow-xs hover:bg-[#FFE3CE]/90 hover:scale-[1.02] active:scale-[0.98] font-black';
                    } else if (moodCategory === 'tired') {
                      cellStyle = 'bg-[#E3E8EE] border-[#B0BECF] text-[#414E5E] shadow-xs hover:bg-[#E3E8EE]/90 hover:scale-[1.02] active:scale-[0.98]';
                    } else if (moodCategory === 'stressed') {
                      cellStyle = 'bg-[#FEDBDD] border-[#EB9CA0] text-[#823337] shadow-xs hover:bg-[#FEDBDD]/90 hover:scale-[1.02] active:scale-[0.98] font-black';
                    } else {
                      cellStyle = 'bg-white border-[#EADFC9] text-[#7A6956]/70 hover:border-[#4A3D30]/30 hover:scale-[1.02] active:scale-[0.98]';
                    }
                  } else {
                    // Missed days are clean and quiet
                    cellStyle = 'bg-white/95 border-[#EADFC9] text-[#7A6956]/50 hover:bg-[#FCFBF7] hover:border-[#4A3D30]/30 hover:scale-[1.02] active:scale-[0.98]';
                  }
                } else {
                  // Out of bounds month days get an elegant subtle hatch pattern
                  cellStyle = 'bg-[#FAF6EB]/20 border-transparent text-[#7A6956]/15 pointer-events-none opacity-40';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate({ day: cell.day, month: cell.month, year: cell.year });
                      const details = getReflectionsForDate(cell.day, cell.month, cell.year);
                      setSelectedDateDetail({
                        day: cell.day,
                        month: cell.month,
                        year: cell.year,
                        dots: details.dots,
                        realEntry: details.realEntry,
                        simulatedContent: details.simulatedContent
                      });
                    }}
                    style={!cell.isCurrentMonth ? {
                      backgroundImage: 'repeating-linear-gradient(45deg, #FAF6EB 0px, #FAF6EB 3px, transparent 3px, transparent 6px)',
                      backgroundColor: '#FCFBF9'
                    } : undefined}
                    className={`min-h-[58px] xs:min-h-[64px] sm:min-h-[76px] flex flex-col justify-between p-1.5 xs:p-2 sm:p-2.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${cellStyle}`}
                  >
                    {/* Selected Indicator - Paper Clip Emoji */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-1 text-xs select-none rotate-12 z-30" title="Selected Date">
                        📎
                      </div>
                    )}

                    {/* Day Number and Bloom Flower */}
                    <div className="flex justify-between items-start w-full">
                      <div className="flex flex-col items-start gap-1">
                        {isToday ? (
                          <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full bg-[#E08E6D] text-white flex items-center justify-center font-black text-[10px] xs:text-xs sm:text-sm shadow-xs border border-cozy-text-dark/20">
                            {cell.day}
                          </div>
                        ) : (
                          <span className={`text-[10px] xs:text-xs sm:text-sm font-black ${cell.isCurrentMonth ? 'text-[#4A3D30]' : 'text-[#7A6956]/20'}`}>
                            {cell.day}
                          </span>
                        )}

                        {/* Miniature visual track of daily habits */}
                        {cell.isCurrentMonth && habits.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 max-w-[36px] xs:max-w-[48px] sm:max-w-[60px] mt-1 p-0.5 bg-[#4A3D30]/5 rounded-full px-1.5 items-center justify-center" title="Daily Habits Consistency">
                            {habits.map((habit) => {
                              const yyyy = cell.year;
                              const mm = String(cell.month + 1).padStart(2, '0');
                              const dd = String(cell.day).padStart(2, '0');
                              const dateKey = `${yyyy}-${mm}-${dd}`;
                              const isCompleted = !!habit.history[dateKey];
                              return (
                                <span
                                  key={habit.id}
                                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 border ${
                                    isCompleted 
                                      ? 'bg-emerald-500 border-emerald-600/30 shadow-xs' 
                                      : 'bg-[#4A3D30]/10 border-transparent opacity-20'
                                  }`}
                                  title={`${habit.name}: ${isCompleted ? '✓ Completed' : '✗ Incomplete'}`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Blooming flower matching streak length */}
                      {cell.isCurrentMonth && streakLength > 0 && (
                        <span 
                          className="text-xs sm:text-sm animate-bounce inline-block transform origin-bottom hover:scale-110 transition-transform duration-200" 
                          style={{ animationDuration: '3s' }}
                          title={`Day ${streakLength} of your writing streak`}
                        >
                          {streakLength === 1 ? '🌱' :
                           streakLength <= 3 ? '🌷' :
                           streakLength <= 5 ? '🌸' :
                           streakLength <= 7 ? '🌻' : '🌺'}
                        </span>
                      )}
                    </div>

                    {/* Footer Row: Emotional Dew Drops & Checklist mini-progress */}
                    <div className="space-y-1 mt-auto w-full pt-1">
                      {/* Emotion Dew Drops */}
                      {cell.isCurrentMonth && hasDots && (
                        <div className="flex justify-center gap-0.5 sm:gap-1 h-3 flex-wrap overflow-hidden pt-0.5">
                          {dateDetail.dots.map((dotColor, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`w-1.5 h-1.5 rounded-full border border-black/5 shadow-inner transform hover:scale-125 transition-transform duration-100 ${
                                dotColor === 'green' ? 'bg-[#94A87C]' :
                                dotColor === 'yellow' ? 'bg-[#E6C585]' :
                                dotColor === 'purple' ? 'bg-[#C3B1E1]' :
                                dotColor === 'red' ? 'bg-[#E08E6D]' :
                                dotColor === 'blue' ? 'bg-[#99BECC]' :
                                dotColor === 'grey' ? 'bg-[#A3B19B]' : 'bg-gray-400'
                              }`}
                              title="Emotional Dew Drop"
                            />
                          ))}
                        </div>
                      )}

                      {/* Cozy Checklist progress bar */}
                      {cell.isCurrentMonth && cellProgress && cellProgress.total > 0 && (
                        <div className="w-full pt-1">
                          <div className="flex justify-between items-center text-[7px] sm:text-[8px] font-bold text-emerald-800/90 mb-0.5 leading-none font-mono">
                            <span>📋</span>
                            <span>{cellProgress.completed}/{cellProgress.total}</span>
                          </div>
                          <div className="w-full h-1 bg-emerald-100/80 rounded-full overflow-hidden border border-emerald-600/10">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${(cellProgress.completed / cellProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>


        </div>

        {/* Right Column: AI Life Insights Panel */}
        <div className="lg:col-span-5 xl:col-span-4 w-full relative mt-6 bg-[#FCF8F2] border-3 border-cozy-text-dark rounded-3xl p-5 shadow-md cozy-shadow" style={{ backgroundImage: 'radial-gradient(#E2D1C3 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
          
          {/* Spiral Binder Rings Aesthetic for Right Column */}
          <div className="absolute -top-3.5 left-4 right-4 flex justify-between pointer-events-none z-10 select-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-2.5 h-6 bg-gradient-to-r from-gray-400 via-gray-100 to-gray-500 rounded-full border border-cozy-text-dark shadow-xs" />
                <div className="w-1.5 h-1.5 bg-[#4A3E31] rounded-full -mt-0.5" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-b border-[#4A3D30]/10 pb-3 mb-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#4A3D30] tracking-tight">AI Life Analyst</h3>
                <p className="text-[9px] text-[#7A6956] font-bold">Real-time lifestyle & growth metrics</p>
              </div>
            </div>
            {insights && (
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black uppercase text-[#E08E6D] tracking-widest font-mono">Growth Score</span>
                <span className="text-sm font-black text-emerald-600 font-mono leading-none">{insights.growthScore || 85}%</span>
              </div>
            )}
          </div>

          {/* Timeframe selector tabs */}
          <div className="grid grid-cols-4 gap-1 bg-[#4A3D30]/5 p-1 rounded-xl mb-4 border border-[#4A3D30]/10">
            {(['day', 'week', 'month', 'year'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setInsightsTimeframe(tf)}
                className={`text-[9px] font-black uppercase py-1.5 rounded-lg transition-all cursor-pointer ${
                  insightsTimeframe === tf
                    ? 'bg-[#E08E6D] text-white shadow-xs'
                    : 'text-[#4A3D30]/70 hover:text-[#4A3D30] hover:bg-[#4A3D30]/5'
                }`}
              >
                {tf === 'day' ? 'Day' : tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>

          {loadingInsights ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="relative">
                <Sparkles size={28} className="text-[#E08E6D] animate-spin" />
                <span className="absolute -top-1 -right-1 text-xs animate-pulse">🐣</span>
              </div>
              <p className="text-xs text-[#7A6956] font-black">AI is analyzing your voice files, habits and milestone logs...</p>
              <p className="text-[10px] text-[#7A6956]/60 italic font-medium">Drafting emotional climate charts</p>
            </div>
          ) : errorInsights ? (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-2xl text-center space-y-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-xs font-black">{errorInsights}</p>
              <button
                onClick={() => fetchInsights(insightsTimeframe)}
                className="px-3 py-1.5 bg-white border border-red-300 rounded-lg text-[10px] font-black hover:bg-red-50"
              >
                Try Again
              </button>
            </div>
          ) : insights ? (
            <div className="space-y-4 text-xs">
              {/* Climate Summary */}
              <div className="bg-white/70 border-2 border-[#4A3D30]/15 rounded-2xl p-3.5 shadow-xs">
                <h4 className="text-[10px] font-black uppercase text-[#E08E6D] tracking-wider mb-1.5 flex items-center gap-1">
                  <span>🍃</span>
                  <span>Cognitive Climate Summary</span>
                </h4>
                <p className="text-[#4A3D30] font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: insights.summary }} />
              </div>

              {/* improvements tracking */}
              <div className="bg-white/70 border-2 border-[#4A3D30]/15 rounded-2xl p-3.5 shadow-xs">
                <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-2 flex items-center gap-1">
                  <span>📈</span>
                  <span>Life Improvements & Resilience</span>
                </h4>
                <ul className="space-y-1.5">
                  {(insights.improvements || []).map((imp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 font-bold text-[#4A3D30]">
                      <span className="text-emerald-500 shrink-0">✓</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* emotional trend */}
              <div className="bg-white/70 border-2 border-[#4A3D30]/15 rounded-2xl p-3.5 shadow-xs">
                <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1.5 flex items-center gap-1">
                  <span>🌊</span>
                  <span>Emotional Climate Trend</span>
                </h4>
                <p className="text-[#4A3D30] font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: insights.emotionalTrend }} />
              </div>

              {/* suggestions */}
              <div className="bg-amber-50/50 border-2 border-amber-500/20 rounded-2xl p-3.5 shadow-xs">
                <h4 className="text-[10px] font-black uppercase text-amber-700 tracking-wider mb-2 flex items-center gap-1">
                  <span>🌻</span>
                  <span>AI Suggestions & Ideas for Growth</span>
                </h4>
                <ul className="space-y-2">
                  {(insights.suggestions || []).map((sug: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 font-bold text-amber-900/90 bg-amber-500/5 p-1.5 rounded-lg border border-amber-500/10">
                      <span className="text-amber-500 shrink-0 text-sm">💡</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => fetchInsights(insightsTimeframe)}
                className="w-full py-2.5 bg-cozy-orange hover:bg-cozy-orange/95 text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 tactile-btn-retro mt-2"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span>Recalculate Real-Time Insights</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <p className="text-xs text-[#7A6956] font-semibold">No insights calculated yet.</p>
              <button
                onClick={() => fetchInsights(insightsTimeframe)}
                className="px-4 py-2 bg-[#E08E6D] text-white font-black text-xs rounded-xl"
              >
                Generate Insights
              </button>
            </div>
          )}

        </div>

      </div>

      {/* DETAIL MODAL POPUP FOR SELECTED DATE */}
      {selectedDateDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF6EB] border-3 border-[#4A3D30] rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setSelectedDateDetail(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-black/5 rounded-xl text-cozy-text-dark transition cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <h3 className="text-base font-black text-[#4A3D30] uppercase tracking-wide font-mono mb-1">
              Reflections Detail
            </h3>
            <p className="text-xs text-[#7A6956] font-bold border-b border-[#4A3D30]/10 pb-3 mb-4">
              {monthNames[selectedDateDetail.month]} {selectedDateDetail.day}, {selectedDateDetail.year}
            </p>

            {/* Habits of the Day Section */}
            {habits.length > 0 && (
              <div className="mb-4 bg-white/60 border-2 border-[#4A3D30]/15 rounded-2xl p-3">
                <h4 className="text-[10px] font-black text-[#7A6956] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>🎯</span>
                  <span>Habits Tracked for this Day</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {habits.map((habit) => {
                    const yyyy = selectedDateDetail.year;
                    const mm = String(selectedDateDetail.month + 1).padStart(2, '0');
                    const dd = String(selectedDateDetail.day).padStart(2, '0');
                    const dateKey = `${yyyy}-${mm}-${dd}`;
                    const isCompleted = !!habit.history[dateKey];
                    return (
                      <div
                        key={habit.id}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black transition-all ${
                          isCompleted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                        }`}
                      >
                        <span className="text-xs leading-none">{isCompleted ? '🟢' : '⚪'}</span>
                        <span>{habit.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDateDetail.dots.length > 0 ? (
              <div className="space-y-4">
                {/* Mood Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-cozy-text-muted">Day Status:</span>
                  <div className="flex items-center gap-1.5 bg-white border-2 border-cozy-text-dark px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
                    <span>{selectedDateDetail.realEntry?.moodEmoji || selectedDateDetail.simulatedContent?.moodEmoji || '😊'}</span>
                    <span>{selectedDateDetail.realEntry?.mood || selectedDateDetail.simulatedContent?.mood || 'Peaceful'}</span>
                  </div>
                </div>

                {/* Spoken Reflection Text Block */}
                <div>
                  <h4 className="text-xs font-black text-cozy-text-muted uppercase tracking-wider mb-1.5">Spoken Reflection:</h4>
                  <div className="bg-white border-2 border-cozy-text-dark p-3.5 rounded-2xl text-xs text-cozy-text-dark leading-relaxed font-semibold shadow-inner max-h-36 overflow-y-auto italic">
                    "{selectedDateDetail.realEntry?.transcript || selectedDateDetail.simulatedContent?.transcript}"
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-xs font-black text-cozy-text-muted uppercase tracking-wider mb-1">AI Daily Summary:</h4>
                  <p className="text-xs text-cozy-text-dark font-bold leading-normal">
                    {selectedDateDetail.realEntry?.summary || selectedDateDetail.simulatedContent?.summary}
                  </p>
                </div>

                {/* Emotion chips */}
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDateDetail.realEntry?.emotions || selectedDateDetail.simulatedContent?.emotions || []).map((emo: string, i: number) => (
                    <span key={i} className="text-[10px] font-black bg-cozy-yellow/30 border border-cozy-yellow text-amber-900 px-2 py-0.5 rounded-full">
                      ✨ {emo}
                    </span>
                  ))}
                </div>

                {/* Takeaways list */}
                {((selectedDateDetail.realEntry?.takeaways || selectedDateDetail.simulatedContent?.takeaways || []).length > 0) && (
                  <div>
                    <h4 className="text-xs font-black text-cozy-text-muted uppercase tracking-wider mb-1">Takeaways:</h4>
                    <ul className="space-y-1.5">
                      {(selectedDateDetail.realEntry?.takeaways || selectedDateDetail.simulatedContent?.takeaways || []).map((take: string, i: number) => (
                        <li key={i} className="text-xs text-cozy-text-dark font-semibold leading-normal flex items-start gap-1.5">
                          <span className="text-cozy-orange shrink-0">✔</span>
                          <span>{take}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Direct Action Link to the Journal Editor */}
                <div className="pt-4 border-t border-[#4A3D30]/10 flex gap-2">
                  {selectedDateDetail.realEntry ? (
                    <button
                      onClick={() => {
                        setSelectedDateDetail(null);
                        onNavigateToEntry?.(selectedDateDetail.realEntry!.id);
                      }}
                      className="flex-1 text-center py-2.5 bg-cozy-orange text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs cursor-pointer uppercase tracking-wider font-mono tactile-btn-retro"
                    >
                      📖 Open in Journal Editor
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedDateDetail(null);
                        // Convert simulated entry to a real one!
                        const newId = `entry-${Date.now()}`;
                        const simDate = new Date(selectedDateDetail.year, selectedDateDetail.month, selectedDateDetail.day, 12, 0, 0);
                        const newPage: JournalEntry = {
                          id: newId,
                          date: simDate.toISOString(),
                          duration: 120,
                          transcript: selectedDateDetail.simulatedContent!.transcript,
                          summary: selectedDateDetail.simulatedContent!.summary,
                          mood: selectedDateDetail.simulatedContent!.mood,
                          moodEmoji: selectedDateDetail.simulatedContent!.moodEmoji,
                          topics: ["Simulated Sync"],
                          tags: ["Archive", "June2026"],
                          emotions: selectedDateDetail.simulatedContent!.emotions || [],
                          takeaways: selectedDateDetail.simulatedContent!.takeaways || [],
                          ...({
                            blocks: [
                              { id: 'b-title', type: 'h1', content: selectedDateDetail.simulatedContent!.summary },
                              { id: 'b-p1', type: 'paragraph', content: selectedDateDetail.simulatedContent!.transcript },
                              { id: 'b-h2', type: 'h2', content: 'Simulated Takeaways' },
                              ...(selectedDateDetail.simulatedContent!.takeaways || []).map((t: string, idx: number) => ({
                                id: `b-tk-${idx}`,
                                type: 'bullet',
                                content: t
                              }))
                            ]
                          })
                        } as any;
                        onSaveConvertedEntry?.(newPage);
                      }}
                      className="flex-1 text-center py-2.5 bg-white text-cozy-orange border-2 border-cozy-orange font-black text-xs rounded-xl shadow-xs cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 tactile-btn-retro"
                    >
                      <Sparkles size={11} className="text-cozy-orange animate-pulse" />
                      <span>Save as Real Entry</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode Tabs */}
                <div className="flex border-2 border-[#4A3D30] rounded-xl overflow-hidden bg-white shadow-xs">
                  <button
                    onClick={() => setActiveModalTab('info')}
                    className={`flex-1 text-[10px] font-black uppercase py-2 transition-all cursor-pointer ${
                      activeModalTab === 'info' 
                        ? 'bg-cozy-orange text-white' 
                        : 'bg-white hover:bg-[#FCF8F2] text-[#4A3D30]'
                    }`}
                  >
                    💡 Overview
                  </button>
                  <button
                    onClick={() => setActiveModalTab('intention')}
                    className={`flex-1 text-[10px] font-black uppercase py-2 transition-all cursor-pointer border-l-2 border-r-2 border-[#4A3D30] ${
                      activeModalTab === 'intention' 
                        ? 'bg-cozy-orange text-white' 
                        : 'bg-white hover:bg-[#FCF8F2] text-[#4A3D30]'
                    }`}
                  >
                    📝 Schedule
                  </button>
                  <button
                    onClick={() => setActiveModalTab('goal')}
                    className={`flex-1 text-[10px] font-black uppercase py-2 transition-all cursor-pointer ${
                      activeModalTab === 'goal' 
                        ? 'bg-cozy-orange text-white' 
                        : 'bg-white hover:bg-[#FCF8F2] text-[#4A3D30]'
                    }`}
                  >
                    🎯 Goal
                  </button>
                </div>

                {/* Tab content */}
                {activeModalTab === 'info' && (
                  <div className="text-center py-2 space-y-4">
                    <p className="text-sm font-bold text-[#7A6956] italic">
                      "Your calendar is a blank page today. Savor the quiet space."
                    </p>
                    <p className="text-xs text-[#7A6956] leading-normal font-semibold">
                      No reflection has been spoken or typed for this date yet. Savor this blank canvas, schedule future intentions, or set milestone goals!
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          const targetDate = new Date(selectedDateDetail.year, selectedDateDetail.month, selectedDateDetail.day, 12, 0, 0);
                          setSelectedDateDetail(null);
                          onCreatePageForDate?.(targetDate);
                        }}
                        className="w-full py-2.5 bg-cozy-orange text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 tactile-btn-retro"
                      >
                        <Plus size={14} strokeWidth={3} />
                        <span>Create Blank Reflection Page</span>
                      </button>
                      <button
                        onClick={() => setActiveModalTab('intention')}
                        className="w-full py-2.5 bg-white text-[#4A3D30] font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs cursor-pointer uppercase tracking-wider font-mono tactile-btn-retro"
                      >
                        ✍ Schedule Spoken Diary Intention
                      </button>
                    </div>
                  </div>
                )}

                {activeModalTab === 'intention' && (
                  <div className="space-y-4 py-1">
                    <div>
                      <h4 className="text-xs font-black text-[#4A3D30] uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Bookmark size={12} className="text-cozy-orange" />
                        <span>Schedule Spoken Intention</span>
                      </h4>
                      <p className="text-[11px] text-[#7A6956] leading-normal font-semibold">
                        Write a future placeholder topic or thought. This creates a glowing calendar placeholder target you can record later!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={scheduledIntentionText}
                        onChange={(e) => setScheduledIntentionText(e.target.value)}
                        placeholder="e.g., Speak about mindfulness, Career plan, Weekly wrap-up"
                        className="w-full bg-white border-2 border-[#4A3D30] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-cozy-text-dark outline-none transition"
                      />
                      
                      <button
                        onClick={() => {
                          if (!scheduledIntentionText.trim()) return;
                          const simDate = new Date(selectedDateDetail.year, selectedDateDetail.month, selectedDateDetail.day, 12, 0, 0);
                          const newEntry: JournalEntry = {
                            id: `entry-scheduled-${Date.now()}`,
                            date: simDate.toISOString(),
                            duration: 0,
                            transcript: `[Scheduled Spoken Diary]`,
                            summary: scheduledIntentionText.trim(),
                            mood: 'Peaceful',
                            moodEmoji: '🌱',
                            topics: ['Intention', 'Scheduled'],
                            tags: ['Scheduled'],
                            emotions: ['Intentional'],
                            takeaways: [`Scheduled: "${scheduledIntentionText.trim()}"`]
                          };

                          setEntries?.(prev => [newEntry, ...prev]);
                          setSelectedDateDetail(null);
                        }}
                        disabled={!scheduledIntentionText.trim()}
                        className="w-full py-2.5 bg-cozy-orange disabled:opacity-50 text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 tactile-btn-retro"
                      >
                        <PlusCircle size={14} />
                        <span>Schedule Intention</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeModalTab === 'goal' && (
                  <div className="space-y-4 py-1">
                    <div>
                      <h4 className="text-xs font-black text-[#4A3D30] uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Target size={12} className="text-cozy-orange" />
                        <span>Set Milestone Goal Target</span>
                      </h4>
                      <p className="text-[11px] text-[#7A6956] leading-normal font-semibold">
                        Create a Milestone Goal. Its deadline will automatically be locked to this date!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-[#7A6956] tracking-wider mb-1 block">Goal Title</label>
                        <input
                          type="text"
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          placeholder="e.g., Run 5 Miles, Finish Reading Chapter 4"
                          className="w-full bg-white border-2 border-[#4A3D30] rounded-xl px-3 py-2 text-xs font-semibold text-cozy-text-dark outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-[#7A6956] tracking-wider mb-1 block">Category</label>
                        <select
                          value={newGoalCategory}
                          onChange={(e: any) => setNewGoalCategory(e.target.value)}
                          className="w-full bg-white border-2 border-[#4A3D30] rounded-xl px-3 py-2 text-xs font-black text-[#4A3D30] outline-none transition cursor-pointer"
                        >
                          <option value="Personal">🌱 Personal</option>
                          <option value="Fitness">💪 Fitness</option>
                          <option value="Reading">📚 Reading</option>
                          <option value="Career">💼 Career</option>
                          <option value="Habit">⭐ Habit</option>
                        </select>
                      </div>

                      <div className="bg-white/45 border border-[#4A3D30]/10 rounded-xl p-2.5">
                        <div className="text-[9px] font-black uppercase text-[#7A6956] tracking-wide">Automatic Deadline</div>
                        <div className="text-xs font-black text-[#4A3D30] font-mono mt-0.5">
                          {selectedDateDetail.year}-{String(selectedDateDetail.month + 1).padStart(2, '0')}-{String(selectedDateDetail.day).padStart(2, '0')}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!newGoalTitle.trim()) return;
                          const mm = String(selectedDateDetail.month + 1).padStart(2, '0');
                          const dd = String(selectedDateDetail.day).padStart(2, '0');
                          const formattedDeadline = `${selectedDateDetail.year}-${mm}-${dd}`;
                          const newGoal: Goal = {
                            id: `goal-${Date.now()}`,
                            title: newGoalTitle.trim(),
                            category: newGoalCategory,
                            progress: 0,
                            deadline: formattedDeadline,
                            actions: [
                              'Break this milestone goal down into 3 simple daily steps',
                              'Speak about this goal in your voice journal to log thoughts',
                              'Review progress each Sunday evening'
                            ]
                          };

                          setGoals?.(prev => [newGoal, ...prev]);
                          setSelectedDateDetail(null);
                        }}
                        disabled={!newGoalTitle.trim()}
                        className="w-full py-2.5 bg-cozy-orange disabled:opacity-50 text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 tactile-btn-retro"
                      >
                        <PlusCircle size={14} />
                        <span>Save Milestone Goal</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}



    </div>
  );
}
