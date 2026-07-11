import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playSound, getMuteState, setMuteState as setSoundMute } from '../utils/sound';

export interface DopamineNotification {
  id: string;
  title: string;
  message: string;
  xp?: number;
  multiplier?: string;
  emoji: string;
  type: 'coin' | 'levelup' | 'pop' | 'streak' | 'affirmation' | 'badge';
  timestamp: string;
  read: boolean;
}

interface DopamineContextType {
  notifications: DopamineNotification[];
  activeToasts: DopamineNotification[];
  unreadCount: number;
  xp: number;
  level: number;
  levelInfo: { name: string; minXp: number; maxXp: number; color: string; bg: string };
  isMuted: boolean;
  toggleMute: () => void;
  addNotification: (
    title: string,
    message: string,
    emoji: string,
    type: DopamineNotification['type'],
    xp?: number,
    multiplier?: string
  ) => void;
  removeToast: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  triggerConfetti: (intensity?: 'mild' | 'wild') => void;
  claimNotificationXp: (id: string) => void;
  nativeNotificationStatus: 'default' | 'granted' | 'denied' | 'unsupported';
  requestNativePermission: () => Promise<boolean>;
}

const DopamineNotificationContext = createContext<DopamineContextType | undefined>(undefined);

const LEVELS = [
  { name: 'Cozy Dreamer', minXp: 0, maxXp: 100, color: 'text-emerald-600 border-emerald-500', bg: 'bg-emerald-50' },
  { name: 'Habit Hero', minXp: 100, maxXp: 300, color: 'text-blue-600 border-blue-500', bg: 'bg-blue-50' },
  { name: 'Zen Master', minXp: 300, maxXp: 600, color: 'text-indigo-600 border-indigo-500', bg: 'bg-indigo-50' },
  { name: 'Mindfulness Wizard', minXp: 600, maxXp: 1000, color: 'text-purple-600 border-purple-500', bg: 'bg-purple-50' },
  { name: 'Dopamine Legend 👑', minXp: 1000, maxXp: 100000, color: 'text-amber-600 border-amber-500', bg: 'bg-amber-50' }
];

export const DopamineNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<DopamineNotification[]>(() => {
    try {
      const saved = localStorage.getItem('daynest_dopamine_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [activeToasts, setActiveToasts] = useState<DopamineNotification[]>([]);

  const [xp, setXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('daynest_dopamine_xp');
      return saved ? parseInt(saved, 10) : 15; // start with 15 XP for good measure
    } catch (_) {
      return 15;
    }
  });

  const [level, setLevel] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(getMuteState());
  const [nativeNotificationStatus, setNativeNotificationStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as 'default' | 'granted' | 'denied';
  });

  // Automatically request device permission on load if default
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNativeNotificationStatus(permission as 'default' | 'granted' | 'denied');
        });
      }
    }
  }, []);

  const requestNativePermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setNativeNotificationStatus(permission as 'default' | 'granted' | 'denied');
      if (permission === 'granted') {
        new Notification('Daynest 🌸', {
          body: 'Real desktop notifications are active!',
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌸</text></svg>'
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  // Level computation
  useEffect(() => {
    let currentLvl = 1;
    for (let i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i].minXp) {
        currentLvl = i + 1;
      }
    }
    
    if (currentLvl > level && level > 0) {
      // LEVEL UP TRIGGERS FANFARE!
      setTimeout(() => {
        playSound('levelup');
        triggerConfetti('wild');
        
        // Push Level Up Notification
        const lvlName = LEVELS[currentLvl - 1].name;
        addNotification(
          'LEVEL UP! 🎉',
          `You unlocked Rank Level ${currentLvl}: ${lvlName}! Enjoy the ultimate peace multiplier.`,
          '👑',
          'levelup',
          50,
          'x2 EXP'
        );
      }, 300);
    }
    setLevel(currentLvl);
    try {
      localStorage.setItem('daynest_dopamine_xp', String(xp));
    } catch (_) {}
  }, [xp]);

  // Sync notifications to local storage
  useEffect(() => {
    try {
      localStorage.setItem('daynest_dopamine_notifications', JSON.stringify(notifications));
    } catch (_) {}
  }, [notifications]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMute(next);
    playSound('pop');
  };

  const triggerConfetti = (intensity: 'mild' | 'wild' = 'mild') => {
    if (intensity === 'wild') {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#F97316', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA']
      });
    } else {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#F97316', '#FBBF24']
      });
    }
  };

  const addNotification = (
    title: string,
    message: string,
    emoji: string,
    type: DopamineNotification['type'],
    rewardXp: number = 15,
    multiplier?: string
  ) => {
    const id = `noti-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newNoti: DopamineNotification = {
      id,
      title,
      message,
      xp: rewardXp,
      multiplier,
      emoji,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNoti, ...prev].slice(0, 50)); // limit log to last 50
    setActiveToasts(prev => [...prev, newNoti].slice(-3)); // limit visible toasts to last 3
    setXp(prev => prev + rewardXp);

    // Play synthesized sound contextually
    playSound(type);

    // Trigger HTML5 Native Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`${emoji} ${title}`, {
          body: message,
          icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${encodeURIComponent(emoji)}</text></svg>`
        });
      } catch (err) {
        console.error('Failed to trigger native notification:', err);
      }
    }

    // Auto-remove toast from screen after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    playSound('pop');
  };

  const clearAll = () => {
    setNotifications([]);
    playSound('pop');
  };

  const claimNotificationXp = (id: string) => {
    const target = notifications.find(n => n.id === id);
    if (target && !target.read) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      // Give additional 5 XP dynamic click reward! Very satisfying!
      setXp(prev => prev + 5);
      playSound('coin');
      triggerConfetti('mild');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const levelInfo = LEVELS[level - 1] || LEVELS[0];

  return (
    <DopamineNotificationContext.Provider
      value={{
        notifications,
        activeToasts,
        unreadCount,
        xp,
        level,
        levelInfo,
        isMuted,
        toggleMute,
        addNotification,
        removeToast,
        markAllAsRead,
        clearAll,
        triggerConfetti,
        claimNotificationXp,
        nativeNotificationStatus,
        requestNativePermission
      }}
    >
      {children}
    </DopamineNotificationContext.Provider>
  );
};

export const useDopamine = () => {
  const context = useContext(DopamineNotificationContext);
  if (!context) {
    throw new Error('useDopamine must be used within a DopamineNotificationProvider');
  }
  return context;
};
