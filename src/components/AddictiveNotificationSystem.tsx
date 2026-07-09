import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Check, 
  Flame, 
  Award, 
  Sparkles, 
  X, 
  TrendingUp, 
  Trophy, 
  Heart,
  Gift,
  Coins,
  BrainCircuit,
  Monitor
} from 'lucide-react';
import { useDopamine, DopamineNotification } from '../context/DopamineNotificationContext';

export const DopamineToastsStack: React.FC = () => {
  const { activeToasts, removeToast, claimNotificationXp } = useDopamine();

  const getTypeStyles = (type: DopamineNotification['type']) => {
    switch (type) {
      case 'coin':
        return {
          border: 'border-[#F59E0B]',
          bg: 'bg-[#FFFDF5]',
          iconBg: 'bg-[#FEF3C7] text-[#D97706]',
          badge: 'bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]',
          shadow: 'shadow-[4px_4px_0px_0px_#D97706]'
        };
      case 'levelup':
        return {
          border: 'border-[#8B5CF6]',
          bg: 'bg-[#FAF5FF]',
          iconBg: 'bg-[#F3E8FF] text-[#7C3AED]',
          badge: 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]',
          shadow: 'shadow-[4px_4px_0px_0px_#7C3AED]'
        };
      case 'streak':
        return {
          border: 'border-[#EF4444]',
          bg: 'bg-[#FEF2F2]',
          iconBg: 'bg-[#FEE2E2] text-[#DC2626]',
          badge: 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]',
          shadow: 'shadow-[4px_4px_0px_0px_#DC2626]'
        };
      case 'affirmation':
        return {
          border: 'border-[#3B82F6]',
          bg: 'bg-[#EFF6FF]',
          iconBg: 'bg-[#DBEAFE] text-[#2563EB]',
          badge: 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]',
          shadow: 'shadow-[4px_4px_0px_0px_#2563EB]'
        };
      case 'badge':
        return {
          border: 'border-[#EC4899]',
          bg: 'bg-[#FDF2F8]',
          iconBg: 'bg-[#FCE7F3] text-[#DB2777]',
          badge: 'bg-[#FCE7F3] text-[#DB2777] border-[#FBCFE8]',
          shadow: 'shadow-[4px_4px_0px_0px_#DB2777]'
        };
      case 'pop':
      default:
        return {
          border: 'border-cozy-text-dark',
          bg: 'bg-[#FAF9F6]',
          iconBg: 'bg-cozy-bg text-cozy-text-dark',
          badge: 'bg-white text-cozy-text-dark border-cozy-text-dark/20',
          shadow: 'shadow-[4px_4px_0px_0px_#4A3D30]'
        };
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3.5 max-w-[340px] w-full pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const styles = getTypeStyles(toast.type);
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9, rotate: -1 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 50, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={() => claimNotificationXp(toast.id)}
              className={`pointer-events-auto cursor-pointer p-4 rounded-2xl border-3 border-cozy-text-dark ${toast.read ? 'opacity-85' : ''} ${styles.bg} ${styles.shadow} relative overflow-hidden transition-all duration-200 active:scale-95 group select-none`}
            >
              {/* Sparkly decorative ring */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-all pointer-events-none" />

              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl border-2 border-cozy-text-dark flex items-center justify-center shrink-0 text-xl font-bold ${styles.iconBg} group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                  {toast.emoji}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-[11.5px] font-black text-cozy-text-dark uppercase tracking-tight leading-none truncate pr-2">
                      {toast.title}
                    </h5>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeToast(toast.id);
                      }}
                      className="p-0.5 hover:bg-cozy-text-dark/5 rounded text-cozy-text-muted hover:text-cozy-text-dark transition cursor-pointer"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                  <p className="text-[10px] text-cozy-text-muted font-bold leading-relaxed line-clamp-2">
                    {toast.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {toast.xp && (
                      <span className="text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-md border border-cozy-text-dark bg-[#FFFBEB] text-[#D97706] flex items-center gap-0.5">
                        <Sparkles size={8} className="animate-pulse" />
                        +{toast.xp} XP
                      </span>
                    )}
                    {toast.multiplier && (
                      <span className="text-[8.5px] font-mono font-black uppercase px-2 py-0.5 rounded-md border border-cozy-text-dark bg-[#EFF6FF] text-[#2563EB]">
                        {toast.multiplier}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Little satisfying progress bar timer */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-cozy-text-dark/10">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4.5, ease: 'linear' }}
                  className="h-full bg-cozy-orange"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

interface DopaminePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DopamineLogPanel: React.FC<DopaminePanelProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    xp, 
    level, 
    levelInfo, 
    isMuted, 
    toggleMute, 
    markAllAsRead, 
    clearAll,
    claimNotificationXp,
    nativeNotificationStatus,
    requestNativePermission
  } = useDopamine();

  // Progress to next level
  const xpInCurrentLvl = xp - levelInfo.minXp;
  const xpNeededForNext = levelInfo.maxXp - levelInfo.minXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLvl / xpNeededForNext) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#4A3D30] z-40 cursor-pointer"
          />

          {/* Drawer body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full max-w-sm w-full bg-cozy-bg border-l-3 border-cozy-text-dark z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b-3 border-cozy-text-dark bg-cozy-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-cozy-orange/20 rounded-xl border-2 border-cozy-text-dark flex items-center justify-center text-cozy-orange shrink-0">
                  <Bell size={16} strokeWidth={3} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <p className="text-[9.5px] font-bold text-cozy-text-muted mt-1 font-mono">{unreadCount} unread triggers</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="p-2 bg-white hover:bg-cozy-orange hover:text-white border-2 border-cozy-text-dark rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs"
                  title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
                >
                  {isMuted ? <VolumeX size={14} strokeWidth={2.5} /> : <Volume2 size={14} strokeWidth={2.5} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 bg-white hover:bg-cozy-orange hover:text-white border-2 border-cozy-text-dark rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* List actions strip */}
            {notifications.length > 0 && (
              <div className="px-5 py-2.5 bg-[#FAF6EB] border-b border-cozy-text-dark/15 flex items-center justify-between text-[9px] font-mono font-black uppercase">
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-cozy-text-muted hover:text-cozy-text-dark cursor-pointer"
                >
                  <Check size={11} strokeWidth={3} />
                  <span>Mark read</span>
                </button>
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <Trash2 size={10} strokeWidth={3} />
                  <span>Clear all</span>
                </button>
              </div>
            )}

            {/* Funny addictive booster footer */}
            <div className="p-4 bg-cozy-card border-t-3 border-cozy-text-dark flex items-center justify-between text-xs font-black mt-auto">
              <span className="text-[9px] text-cozy-text-muted uppercase tracking-wider">Level Boost Multiplier:</span>
              <span className="bg-[#FFFCEB] text-cozy-accent border-2 border-cozy-text-dark px-2.5 py-1 rounded-xl shadow-xs text-[10px]">
                🚀 1.2x Spark Factor
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
