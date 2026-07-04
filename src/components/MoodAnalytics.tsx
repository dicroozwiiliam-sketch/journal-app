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
  Plus
} from 'lucide-react';
import { JournalEntry } from '../types';

interface MoodAnalyticsProps {
  entries: JournalEntry[];
  onNavigateToEntry?: (id: string) => void;
  onCreatePageForDate?: (date: Date) => void;
  onSaveConvertedEntry?: (entry: JournalEntry) => void;
  initialSelectedDate?: Date | null;
}

export default function MoodAnalytics({ 
  entries,
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
    <div className="w-full max-w-3xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-4 md:p-8 pb-20" id="analytics_tab">
      
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Calendar & Insights</h2>
        <p className="text-xs text-cozy-text-muted font-bold">Your reflections calendar, agenda and cognitive emotional insights</p>
      </div>

      {/* RENDER COZY CALENDAR VIEW */}
      <div className="max-w-2xl mx-auto w-full bg-[#FCF8F2] border-2 xs:border-3 border-cozy-text-dark rounded-2xl xs:rounded-3xl p-2.5 xs:p-4 sm:p-5 md:p-6 shadow-sm">
            {/* Header of Calendar: Icon, Title & Top Controls */}
            <div className="flex flex-row items-center justify-between gap-2 border-b border-[#4A3D30]/10 pb-4 mb-4">
              <div className="flex items-center gap-2 xs:gap-3.5">
                {/* Cute Calendar Icon Sheet matching the image */}
                <div className="w-10 h-10 xs:w-12 xs:h-12 bg-[#FCF8F2] border-2 border-cozy-text-dark rounded-xl xs:rounded-2xl flex flex-col items-center justify-center p-0.5 xs:p-1 relative shadow-sm shrink-0">
                  <div className="absolute top-1 xs:top-1.5 flex gap-0.5 xs:gap-1 justify-center w-full">
                    <div className="w-0.5 xs:w-1 h-1.5 xs:h-2 bg-cozy-text-dark rounded-full" />
                    <div className="w-0.5 xs:w-1 h-1.5 xs:h-2 bg-cozy-text-dark rounded-full" />
                    <div className="w-0.5 xs:w-1 h-1.5 xs:h-2 bg-cozy-text-dark rounded-full" />
                  </div>
                  <div className="text-[8px] xs:text-[9px] text-[#E08E6D] font-black mt-1.5 xs:mt-2 leading-none uppercase tracking-wider">REF</div>
                  <div className="text-xs xs:text-sm font-black text-cozy-text-dark leading-none mt-0.5 xs:mt-1">{today.getDate()}</div>
                </div>
                
                <div>
                  <h3 className="text-base xs:text-xl font-black text-[#4A3D30] tracking-tight">Calendar</h3>
                  <p className="text-[10px] xs:text-xs text-[#7A6956] font-bold">Your reflections.</p>
                </div>
              </div>

              {/* Today, Left/Right controls */}
              <div className="flex items-center gap-1 xs:gap-1.5">
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
                  className="px-2.5 py-1 xs:px-4 xs:py-1.5 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-lg xs:rounded-xl text-[10px] xs:text-xs font-black text-cozy-text-dark transition hover:scale-102 active:scale-98 cursor-pointer shadow-xs"
                >
                  Today
                </button>
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 xs:p-1.5 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-lg xs:rounded-xl text-cozy-text-dark transition hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center shadow-xs"
                  title="Previous Month"
                >
                  <ChevronLeft size={12} strokeWidth={3} className="xs:hidden" />
                  <ChevronLeft size={14} strokeWidth={3} className="hidden xs:block" />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 xs:p-1.5 bg-white hover:bg-[#FDF8F1] border-2 border-cozy-text-dark rounded-lg xs:rounded-xl text-cozy-text-dark transition hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center shadow-xs"
                  title="Next Month"
                >
                  <ChevronRight size={12} strokeWidth={3} className="xs:hidden" />
                  <ChevronRight size={14} strokeWidth={3} className="hidden xs:block" />
                </button>
              </div>
            </div>

            {/* Current Month Banner */}
            <div className="flex items-center gap-1 mb-4 pl-1">
              <span className="text-base xs:text-lg font-black text-[#4A3D30] tracking-tight">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <ChevronRight size={14} strokeWidth={3} className="text-[#7A6956] opacity-60 mt-0.5" />
            </div>

            {/* Calendar Grid Headers */}
            <div className="grid grid-cols-7 gap-1 xs:gap-1.5 sm:gap-2.5 text-center mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayHead) => (
                <div key={dayHead} className="text-[10px] xs:text-xs font-black text-[#7A6956] uppercase tracking-wide">
                  <span className="inline xs:hidden">{dayHead[0]}</span>
                  <span className="hidden xs:inline">{dayHead}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1 xs:gap-1.5 sm:gap-2">
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

                // Determine blooming styling based on consecutive writing streak length
                let cellStyle = '';
                if (isSelected) {
                  cellStyle = 'border-cozy-orange bg-[#FFFDF9] scale-102 ring-3 ring-cozy-orange/25 font-black shadow-md';
                } else if (isToday) {
                  cellStyle = 'border-[#E08E6D] bg-[#FCF8F2] shadow-sm font-black';
                } else if (cell.isCurrentMonth) {
                  if (streakLength === 0) {
                    // Missed days are completely blank, quiet and peaceful
                    cellStyle = 'bg-white border-[#FAF6EB] hover:border-[#4A3D30]/15 text-[#7A6956]/40 hover:scale-[1.01]';
                  } else if (streakLength === 1) {
                    cellStyle = 'bg-[#F4F8F1] border-[#DFEBD5] text-emerald-950 hover:bg-[#EDF3E8] hover:border-[#D5E4C4] hover:scale-[1.01]';
                  } else if (streakLength <= 3) {
                    cellStyle = 'bg-[#EBF5EC] border-[#D3ECD6] text-emerald-950 hover:bg-[#DFF1E1] hover:border-[#C1E5C6] hover:scale-[1.01] font-black';
                  } else if (streakLength <= 5) {
                    cellStyle = 'bg-[#FAF0ED] border-[#F0D5CD] text-amber-950 hover:bg-[#F7E7E2] hover:border-[#E7C1B5] hover:scale-[1.01] font-black';
                  } else if (streakLength <= 7) {
                    cellStyle = 'bg-[#FCF9EC] border-[#F2E8BC] text-amber-950 hover:bg-[#FAF5E0] hover:border-[#EADAA0] hover:scale-[1.01] font-black';
                  } else {
                    cellStyle = 'bg-gradient-to-br from-[#F5F2FC] to-[#FAF8FD] border-[#DBCFF1] text-indigo-950 hover:from-[#EDE6F9] hover:border-[#CDBDE5] hover:scale-[1.01] font-black';
                  }
                } else {
                  cellStyle = 'bg-[#FAF6EB]/30 border-transparent text-[#7A6956]/20 pointer-events-none';
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
                    className={`min-h-[50px] xs:min-h-[60px] sm:min-h-[70px] flex flex-col justify-between p-1 xs:p-1.5 sm:p-2 rounded-xl xs:rounded-2xl border-2 transition-all duration-200 cursor-pointer relative ${cellStyle}`}
                  >
                    {/* Day Number and Bloom Flower */}
                    <div className="flex justify-between items-start w-full">
                      {isToday ? (
                        <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full bg-[#E08E6D] text-white flex items-center justify-center font-black text-[10px] xs:text-xs sm:text-sm shadow-xs">
                          {cell.day}
                        </div>
                      ) : (
                        <span className={`text-[10px] xs:text-xs font-black ${cell.isCurrentMonth ? 'text-[#4A3D30]' : 'text-[#7A6956]/20'}`}>
                          {cell.day}
                        </span>
                      )}

                      {/* Blooming flower matching streak length */}
                      {cell.isCurrentMonth && streakLength > 0 && (
                        <span 
                          className="text-xs sm:text-sm animate-bounce" 
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
                    <div className="space-y-1 mt-auto w-full">
                      {/* Emotion Dew Drops */}
                      {cell.isCurrentMonth && hasDots && (
                        <div className="flex justify-center gap-0.5 sm:gap-1 h-2 flex-wrap overflow-hidden">
                          {dateDetail.dots.map((dotColor, dotIdx) => (
                            <span
                              key={dotIdx}
                              className={`w-1 h-1 rounded-full ${
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
                        <div className="w-full pt-0.5">
                          <div className="flex justify-between items-center text-[7px] sm:text-[8px] font-mono font-bold text-emerald-800/80 mb-0.5 leading-none">
                            <span>📋</span>
                            <span>{cellProgress.completed}/{cellProgress.total}</span>
                          </div>
                          <div className="w-full h-1 bg-emerald-100 rounded-full overflow-hidden">
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

            {/* Legend at the bottom */}
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 sm:gap-x-5 mt-6 border-t border-[#4A3D30]/10 pt-4 text-[9px] xs:text-[10px] font-black text-[#7A6956] uppercase tracking-wide">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-[#94A87C]" />
                <span>Great</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-[#E6C585]" />
                <span>Good</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-[#C3B1E1]" />
                <span>Okay</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-[#E08E6D]" />
                <span>Hard</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-[#99BECC]" />
                <span>Notes Only</span>
              </div>
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
                      className="flex-1 text-center py-2.5 bg-cozy-orange hover:bg-cozy-accent text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs transition hover:scale-102 cursor-pointer uppercase tracking-wider font-mono"
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
                      className="flex-1 text-center py-2.5 bg-white hover:bg-[#FAF6EB] text-cozy-orange border-2 border-cozy-orange font-black text-xs rounded-xl shadow-xs transition hover:scale-102 cursor-pointer uppercase tracking-wider font-mono flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={11} className="text-cozy-orange animate-pulse" />
                      <span>Save as Real Entry</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-bold text-[#7A6956] italic mb-4">
                  "Your calendar is a blank page today. Savor the quiet space."
                </p>
                <p className="text-xs text-[#7A6956] leading-normal font-semibold mb-6">
                  No reflection has been spoken or typed for this date yet. Daily habits and slow, deliberate pauses are beautiful steps of mindfulness.
                </p>
                <button
                  onClick={() => {
                    const targetDate = new Date(selectedDateDetail.year, selectedDateDetail.month, selectedDateDetail.day, 12, 0, 0);
                    setSelectedDateDetail(null);
                    onCreatePageForDate?.(targetDate);
                  }}
                  className="px-5 py-2.5 bg-cozy-orange hover:bg-cozy-accent text-white font-black text-xs rounded-xl border-2 border-cozy-text-dark shadow-xs transition hover:scale-102 cursor-pointer"
                >
                  Create a New Reflection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
