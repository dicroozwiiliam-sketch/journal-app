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
                  <h4 className="text-xs font-black uppercase tracking-wider text-cozy-text-dark leading-none">Dopamine Hub</h4>
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

            {/* Level progression widget */}
            <div className="p-5 border-b-3 border-cozy-text-dark bg-white space-y-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cozy-yellow/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-black text-cozy-text-muted uppercase tracking-wider">Level Rank</span>
                  <h5 className="text-sm font-black text-cozy-text-dark">{levelInfo.name}</h5>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-mono font-black text-cozy-text-muted uppercase tracking-wider">Cozy XP</span>
                  <span className="text-xs font-black text-cozy-orange">{xp} XP</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-4 bg-cozy-bg rounded-full border-2 border-cozy-text-dark p-0.5 overflow-hidden shadow-inner relative flex items-center justify-center">
                  <div 
                    className="absolute left-0.5 top-0.5 bottom-0.5 rounded-full bg-cozy-orange transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                  <span className="relative z-10 text-[8px] font-mono font-black text-cozy-text-dark uppercase">
                    Level {level} • {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="flex justify-between text-[8px] font-mono font-black text-cozy-text-muted uppercase">
                  <span>{levelInfo.minXp} XP</span>
                  <span>{xpNeededForNext < 10000 ? `${levelInfo.maxXp} XP` : 'MAX LEVEL'}</span>
                </div>
              </div>
            </div>

            {/* Desktop OS Native Notifications Request Widget */}
            <div className="p-4 bg-[#FAF6EB] border-b-3 border-cozy-text-dark flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cozy-orange/10 border border-cozy-text-dark/10 flex items-center justify-center text-cozy-orange shrink-0">
                  <Monitor size={14} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-[10px] font-black text-cozy-text-dark uppercase tracking-wide leading-tight">Desktop Notifications</h6>
                  <p className="text-[8.5px] font-bold text-cozy-text-muted leading-tight mt-0.5">
                    {nativeNotificationStatus === 'granted' 
                      ? 'Real system notifications are active and ready!' 
                      : nativeNotificationStatus === 'denied'
                      ? 'Notifications blocked by browser. Please enable in site settings.'
                      : nativeNotificationStatus === 'unsupported'
                      ? 'Not supported in your current browser environment.'
                      : 'Receive real outside-app alerts for check-ins & goals.'}
                  </p>
                </div>
              </div>

              {nativeNotificationStatus === 'default' && (
                <button
                  type="button"
                  onClick={requestNativePermission}
                  className="w-full mt-1.5 py-1.5 bg-cozy-orange hover:bg-cozy-orange/90 text-white font-black text-[9px] rounded-lg border-2 border-cozy-text-dark shadow-xs transition hover:scale-[1.01] active:scale-95 uppercase tracking-wider font-mono"
                >
                  Enable Real Desktop Alerts 🔔
                </button>
              )}

              {nativeNotificationStatus === 'granted' && (
                <div className="mt-1 flex items-center gap-1 text-[8.5px] font-mono font-black text-emerald-600 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>NATIVE SYSTEM NOTIFICATIONS: ACTIVE ✅</span>
                </div>
              )}
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

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                  <div className="w-16 h-16 bg-cozy-bg rounded-3xl border-3 border-cozy-text-dark flex items-center justify-center text-3xl shadow-sm rotate-3 animate-pulse">
                    🌸
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-cozy-text-dark uppercase">Your Mind is Serene</p>
                    <p className="text-[10px] text-cozy-text-muted font-bold max-w-[190px]">
                      Complete check-ins, ticks, and goals to unlock beautiful gamified dopamine hits.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => claimNotificationXp(n.id)}
                    className={`p-3.5 rounded-2xl border-2 border-cozy-text-dark/80 bg-white shadow-xs flex gap-3 transition-all cursor-pointer relative overflow-hidden group select-none ${
                      n.read ? 'opacity-65 hover:opacity-100 bg-white/70' : 'hover:scale-[1.01] hover:bg-cozy-orange/5 ring-1 ring-cozy-orange/10'
                    }`}
                  >
                    {/* Unread circle badge */}
                    {!n.read && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cozy-orange animate-ping" />
                    )}

                    <div className="w-8 h-8 rounded-xl bg-cozy-bg border border-cozy-text-dark/15 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                      {n.emoji}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-baseline gap-1">
                        <h6 className={`text-[10.5px] font-black uppercase tracking-tight truncate ${n.read ? 'text-cozy-text-dark/80' : 'text-cozy-text-dark'}`}>
                          {n.title}
                        </h6>
                        <span className="text-[8px] font-mono text-cozy-text-muted font-bold shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-cozy-text-muted font-bold leading-relaxed">
                        {n.message}
                      </p>
                      
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {n.xp && (
                          <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded-md border ${n.read ? 'border-cozy-text-dark/10 bg-cozy-bg text-cozy-text-muted' : 'border-cozy-text-dark bg-[#FFFBEB] text-[#D97706]'}`}>
                            +{n.xp} XP
                          </span>
                        )}
                        {!n.read && (
                          <span className="text-[8px] font-mono text-cozy-orange font-black flex items-center gap-0.5 animate-pulse">
                            ⚡ Tap to claim reward
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Funny addictive booster footer */}
            <div className="p-4 bg-cozy-card border-t-3 border-cozy-text-dark flex items-center justify-between text-xs font-black">
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
