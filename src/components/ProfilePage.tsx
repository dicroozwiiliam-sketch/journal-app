/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Shield, Key, Download, Trash2, Heart, Award, Sparkles, 
  Moon, Bell, CheckCircle2, Crown, Globe, Edit2, Check, X, Camera, 
  ChevronDown, Flame, BookOpen, AlertTriangle, HelpCircle, Lock, Info,
  Share2, Save, Leaf, Settings
} from 'lucide-react';
import { Badge, JournalEntry, Goal } from '../types';
import confetti from 'canvas-confetti';
import { useDopamine } from '../context/DopamineNotificationContext';

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  userAvatar?: string;
  userBio?: string;
  userAvatarBg?: string;
  avatarImageUrl?: string;
  avatarFrameId?: string;
  avatarAnimationId?: string;
  cardBorderStyle?: string;
  cardBorderRadius?: '12px' | '24px' | '48px';
  isPremium: boolean;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
  subscriptionCancelAtPeriodEnd?: number;
  subscriptionTrialEnd?: string;
  onTogglePremium: (plan: "monthly" | "yearly") => void;
  onManageBilling?: () => void;
  onUpdateProfile?: (updates: { 
    name?: string; 
    email?: string; 
    avatarEmoji?: string; 
    bio?: string; 
    avatarBg?: string;
    avatarImageUrl?: string;
    avatarFrameId?: string;
    avatarAnimationId?: string;
    cardBorderStyle?: string;
    cardBorderRadius?: '12px' | '24px' | '48px';
  }) => void;
  entries: JournalEntry[];
  badges: Badge[];
  goals?: Goal[];
  habits?: any[];
  onLogout: () => void;
  onOpenNotificationsLog?: () => void;
}

const AVATAR_EMOJIS = ["🐦", "🦉", "🐥", "🐧", "🦅", "🦆", "🦢", "🦜", "🦚", "🦩", "🐣", "🌸", "🌱", "🍂", "🐝"];

const AVATAR_BGS = [
  { value: 'bg-cozy-orange', label: 'Terracotta' },
  { value: 'bg-cozy-accent', label: 'Sunset' },
  { value: 'bg-cozy-green', label: 'Sage' },
  { value: 'bg-cozy-yellow', label: 'Honey' },
  { value: 'bg-[#5C6E58]', label: 'Pine Forest' },
  { value: 'bg-indigo-500', label: 'Twilight' },
  { value: 'bg-amber-700', label: 'Oak' },
];

const AVATAR_FRAMES = [
  { id: 'none', name: 'Standard Nestling', icon: '🥚', desc: 'No custom border overlay.' },
  { id: 'sage', name: 'Sage Garland 🌿', icon: '🌿', desc: 'Climbing green sprouts of growth.' },
  { id: 'starry', name: 'Dreamy Starlight ✨', icon: '✨', desc: 'Floating amber stars of mindfulness.' },
  { id: 'twigs', name: 'Cozy Twigs & Flowers 🌸', icon: '🌸', desc: 'Cherry blossoms over a wooden branch.' },
  { id: 'honey', name: 'Honey Bear Hive 🍯', icon: '🍯', desc: 'Amber honey glaze with honey bees.' },
  { id: 'midnight', name: 'Midnight Orbit 🌙', icon: '🌙', desc: 'Cozy crescent moon and dreaming clouds.' },
  { id: 'autumn', name: 'Autumn Woods 🍂', icon: '🍂', desc: 'Swirling yellow and crimson fall leaves.' },
  { id: 'winter', name: 'Winter Wonderland ❄️', icon: '❄️', desc: 'Chilling frost with sparkling snowflakes.' },
];

const AVATAR_ANIMATIONS = [
  { id: 'none', name: 'Static Beauty', desc: 'No background motion.' },
  { id: 'pulse', name: 'Pulse of Warmth 💓', desc: 'Gentle, breathing scale animation.' },
  { id: 'rainbow', name: 'Pastel Aura Glow 🌈', desc: 'Smooth shifting rainbow light path.' },
  { id: 'sway', name: 'Swaying Breeze 🍃', desc: 'Soft pendulum oscillation effect.' },
  { id: 'spin', name: 'Celestial Orbit 🌌', desc: 'Slow, peaceful rotational movement.' },
  { id: 'shimmer', name: 'Glimmer Sweep ⭐', desc: 'Light shine sweep across the image.' },
];

const COZY_CARD_BORDER_STYLES = [
  { id: 'standard', name: 'Classic Nest 🪹', icon: '🪹', desc: 'Handcrafted chocolate border.' },
  { id: 'woodland', name: 'Sage Woodland 🌿', icon: '🌿', desc: 'Sage wood with sprouting leaves.' },
  { id: 'starry', name: 'Stardust ✨', icon: '✨', desc: 'Soft warm gold with twinkles.' },
  { id: 'floral', name: 'Spring Blossom 🌸', icon: '🌸', desc: 'Rose pastel with flower buds.' },
  { id: 'honey', name: 'Sweet Honey Hive 🍯', icon: '🍯', desc: 'Honeycomb gold trim with honeybees.' },
  { id: 'midnight', name: 'Midnight Orbit 🌙', icon: '🌙', desc: 'Silent dark indigo dreamscape.' },
  { id: 'rainbow', name: 'Pastel Aura 🌈', icon: '🌈', desc: 'Shifting colors & magic glow.' },
  { id: 'cherry_blossom', name: 'Cherry Blossom 🌸', icon: '🌸', desc: 'Pink floral hoop with butterflies.' },
  { id: 'autumn_leaves', name: 'Autumn Crunch 🍁', icon: '🍁', desc: 'Warm orange and falling leaves.' },
  { id: 'ocean_breeze', name: 'Ocean Breeze 🌊', icon: '🌊', desc: 'Soft waves and seashells.' },
  { id: 'matcha_tea', name: 'Matcha Tea 🍵', icon: '🍵', desc: 'Calming soft green.' },
  { id: 'lavender_dreams', name: 'Lavender Dreams 🪻', icon: '🪻', desc: 'Soft purple and herbs.' },
  { id: 'strawberry_field', name: 'Strawberry Field 🍓', icon: '🍓', desc: 'Red berries and vines.' },
  { id: 'mushroom_glade', name: 'Mushroom Glade 🍄', icon: '🍄', desc: 'Toadstools in a magical forest.' },
  { id: 'cloud_nine', name: 'Cloud Nine ☁️', icon: '☁️', desc: 'Fluffy white clouds.' },
  { id: 'winter_frost', name: 'Winter Frost ❄️', icon: '❄️', desc: 'Ice crystals and snowflakes.' },
  { id: 'sunflower_path', name: 'Sunflower Path 🌻', icon: '🌻', desc: 'Bright yellow blooms.' },
  { id: 'coffee_shop', name: 'Coffee Shop ☕', icon: '☕', desc: 'Warm espresso and pastries.' },
  { id: 'peach_orchard', name: 'Peach Orchard 🍑', icon: '🍑', desc: 'Sweet pastel oranges.' },
  { id: 'lemon_drop', name: 'Lemon Drop 🍋', icon: '🍋', desc: 'Zesty yellow and fresh vibes.' },
  { id: 'rose_garden', name: 'Rose Garden 🌹', icon: '🌹', desc: 'Deep red and thorny stems.' },
  { id: 'cotton_candy', name: 'Cotton Candy 🍡', icon: '🍡', desc: 'Pink and blue sugar swirls.' },
  { id: 'bamboo_grove', name: 'Bamboo Grove 🎍', icon: '🎍', desc: 'Tall green stalks.' },
  { id: 'desert_oasis', name: 'Desert Oasis 🌵', icon: '🌵', desc: 'Succulents and warm sand.' },
  { id: 'crystal_cave', name: 'Crystal Cave 💎', icon: '💎', desc: 'Shining gems and amethyst.' },
  { id: 'pumpkin_patch', name: 'Pumpkin Patch 🎃', icon: '🎃', desc: 'Autumn gourds and vines.' },
  { id: 'fairy_tale', name: 'Fairy Tale 🧚', icon: '🧚', desc: 'Magic wands and sparkles.' },
  { id: 'mint_chocolate', name: 'Mint Choc 🍫', icon: '🍫', desc: 'Refreshing green and cocoa.' },
  { id: 'sakura_night', name: 'Sakura Night 🌸', icon: '🌸', desc: 'Dark pink blossoms under moon.' },
  { id: 'daisy_chain', name: 'Daisy Chain 🌼', icon: '🌼', desc: 'White petals and yellow centers.' },
  { id: 'berry_basket', name: 'Berry Basket 🫐', icon: '🫐', desc: 'Blueberries and blackberries.' },
];

const CARD_STYLE_MAP: Record<string, { classList: string, decor: React.ReactNode }> = {
  'standard': {
    classList: `bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-900 group/card`,
    decor: <div className="absolute top-3 right-4 flex gap-1 text-emerald-800/15 pointer-events-none select-none">
      <Leaf size={14} className="rotate-45" />
      <Leaf size={10} className="-rotate-12" />
    </div>
  },
  'woodland': {
    classList: `bg-[#F1ECE1] border-3 border-[#94A87C]/80 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#7C9065] group/card`,
    decor: <>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-35 select-none pointer-events-none animate-cozy-leaf-flutter">🌿</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-35 select-none pointer-events-none animate-cozy-leaf-flutter">🌱</div>
        <div className="absolute top-1/2 -right-1 text-sm opacity-25 select-none pointer-events-none rotate-45 animate-cozy-leaf-flutter">🍃</div>
      </>
  },
  'starry': {
    classList: `bg-[#FFF9E6] border-3 border-amber-400 rounded-3xl p-6 mb-5 shadow-md relative overflow-hidden transition-all duration-300 hover:border-amber-500 group/card`,
    decor: <>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
        <div className="absolute bottom-2.5 right-3 text-xs opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">⭐</div>
        <div className="absolute top-3 right-8 text-[10px] opacity-30 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>
  },
  'floral': {
    classList: `bg-[#FFF0F2] border-3 border-rose-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-rose-400 group/card`,
    decor: <>
        <div className="absolute top-2.5 left-3 text-xs opacity-50 select-none pointer-events-none animate-pulse">🌸</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-50 select-none pointer-events-none animate-bounce" style={{ animationDuration: '4s' }}>🌸</div>
        <div className="absolute top-3 right-8 text-[10px] opacity-40 select-none pointer-events-none">🌸</div>
      </>
  },
  'honey': {
    classList: `bg-[#FFF6E0] border-3 border-[#E6A11D] rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-600 group/card`,
    decor: <>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-50 select-none pointer-events-none animate-cozy-bee-flight">🐝</div>
        <div className="absolute bottom-2.5 right-3 text-xs opacity-50 select-none pointer-events-none">🍯</div>
        <div className="absolute top-4 right-10 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-bee-flight">🐝</div>
      </>
  },
  'midnight': {
    classList: `bg-[#16142c] border-3 border-indigo-400 text-indigo-50/90 rounded-3xl p-6 mb-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-indigo-300 group/card`,
    decor: <>
        <div className="absolute top-2.5 left-3 text-xs opacity-55 select-none pointer-events-none">🌙</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-50 select-none pointer-events-none animate-pulse">☁️</div>
        <div className="absolute top-3 right-10 text-[9px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>
  },
  'rainbow': {
    classList: `bg-[#FAF7FD] border-3 border-pink-400 rounded-3xl p-6 mb-5 shadow-md relative overflow-hidden transition-all duration-300 hover:border-purple-400 group/card animate-cozy-rainbow-card`,
    decor: <>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-55 select-none pointer-events-none">🌈</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-55 select-none pointer-events-none animate-pulse">⭐</div>
      </>
  },
  'cherry_blossom': {
    classList: `bg-[#FFF0F5] border-3 border-pink-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-pink-400 group/card`,
    decor: <>
        <div className="absolute top-2.5 left-3 text-xs opacity-60 select-none pointer-events-none animate-pulse">🦋</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-70 select-none pointer-events-none animate-cozy-leaf-flutter">🌸</div>
      </>
  },
  'autumn_leaves': {
    classList: `bg-[#FFF8F0] border-3 border-orange-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-orange-500 group/card`,
    decor: <>
        <div className="absolute top-3 right-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-leaf-flutter">🍂</div>
        <div className="absolute bottom-3 left-3 text-xs opacity-50 select-none pointer-events-none">🍁</div>
      </>
  },
  'ocean_breeze': {
    classList: `bg-[#F0F8FF] border-3 border-cyan-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-cyan-500 group/card`,
    decor: <>
        <div className="absolute top-2 right-4 text-xs opacity-50 select-none pointer-events-none animate-pulse">🐚</div>
        <div className="absolute bottom-2 left-4 text-xs opacity-40 select-none pointer-events-none">🌊</div>
      </>
  },
  'matcha_tea': {
    classList: `bg-[#F5FFFA] border-3 border-emerald-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-emerald-500 group/card`,
    decor: <>
        <div className="absolute top-3 left-3 text-xs opacity-50 select-none pointer-events-none animate-pulse">🍵</div>
        <div className="absolute bottom-3 right-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-leaf-flutter">🍃</div>
      </>
  },
  'lavender_dreams': {
    classList: `bg-[#F8F5FF] border-3 border-purple-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-purple-400 group/card`,
    decor: <>
        <div className="absolute top-2.5 right-2.5 text-xs opacity-50 select-none pointer-events-none animate-pulse">🪻</div>
        <div className="absolute bottom-2.5 left-2.5 text-xs opacity-50 select-none pointer-events-none">✨</div>
      </>
  },
  'strawberry_field': {
    classList: `bg-[#FFF0F2] border-3 border-red-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-red-400 group/card`,
    decor: <>
        <div className="absolute top-3 left-3 text-xs opacity-60 select-none pointer-events-none animate-bounce" style={{animationDuration: '5s'}}>🍓</div>
        <div className="absolute bottom-3 right-4 text-[10px] opacity-40 select-none pointer-events-none">🌿</div>
      </>
  },
  'mushroom_glade': {
    classList: `bg-[#FDF6E3] border-3 border-red-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-red-500 group/card`,
    decor: <>
        <div className="absolute bottom-2 left-2 text-xs opacity-60 select-none pointer-events-none">🍄</div>
        <div className="absolute top-2 right-2 text-[10px] opacity-50 select-none pointer-events-none animate-pulse">✨</div>
      </>
  },
  'cloud_nine': {
    classList: `bg-[#F0F8FF] border-3 border-blue-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-blue-300 group/card`,
    decor: <>
        <div className="absolute top-2 left-4 text-xs opacity-70 select-none pointer-events-none animate-pulse">☁️</div>
        <div className="absolute bottom-2 right-2 text-xs opacity-50 select-none pointer-events-none">☁️</div>
      </>
  },
  'winter_frost': {
    classList: `bg-[#F5FBFF] border-3 border-cyan-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-cyan-300 group/card`,
    decor: <>
        <div className="absolute top-2 right-2 text-xs opacity-60 select-none pointer-events-none animate-cozy-star-twinkle">❄️</div>
        <div className="absolute bottom-3 left-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">🧊</div>
      </>
  },
  'sunflower_path': {
    classList: `bg-[#FFFFF0] border-3 border-yellow-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-yellow-500 group/card`,
    decor: <>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none animate-cozy-leaf-flutter">🌻</div>
        <div className="absolute bottom-2 right-3 text-xs opacity-50 select-none pointer-events-none">☀️</div>
      </>
  },
  'coffee_shop': {
    classList: `bg-[#FAF5F0] border-3 border-[#8B4513] rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#A0522D] group/card`,
    decor: <>
        <div className="absolute top-2 right-3 text-xs opacity-60 select-none pointer-events-none animate-pulse">☕</div>
        <div className="absolute bottom-2 left-2 text-xs opacity-40 select-none pointer-events-none">🥐</div>
      </>
  },
  'peach_orchard': {
    classList: `bg-[#FFF5EE] border-3 border-orange-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-orange-400 group/card`,
    decor: <>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none animate-bounce" style={{animationDuration: '6s'}}>🍑</div>
        <div className="absolute bottom-3 right-3 text-xs opacity-50 select-none pointer-events-none">🌸</div>
      </>
  },
  'lemon_drop': {
    classList: `bg-[#FFFFE0] border-3 border-yellow-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-yellow-400 group/card`,
    decor: <>
        <div className="absolute top-2 right-2 text-xs opacity-60 select-none pointer-events-none">🍋</div>
        <div className="absolute bottom-2 left-2 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>
  },
  'rose_garden': {
    classList: `bg-[#FFF0F5] border-3 border-red-500 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-red-600 group/card`,
    decor: <>
        <div className="absolute bottom-2 right-2 text-xs opacity-60 select-none pointer-events-none">🌹</div>
        <div className="absolute top-3 left-3 text-[10px] opacity-50 select-none pointer-events-none animate-pulse">🥀</div>
      </>
  },
  'cotton_candy': {
    classList: `bg-[#FDF0F5] border-3 border-pink-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-pink-300 group/card`,
    decor: <>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none">🍡</div>
        <div className="absolute bottom-2 right-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">🍬</div>
      </>
  },
  'bamboo_grove': {
    classList: `bg-[#F0FFF0] border-3 border-green-500 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-green-600 group/card`,
    decor: <>
        <div className="absolute bottom-1 right-2 text-xs opacity-60 select-none pointer-events-none">🎍</div>
        <div className="absolute top-2 left-2 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-leaf-flutter">🍃</div>
      </>
  },
  'desert_oasis': {
    classList: `bg-[#FFF8DC] border-3 border-green-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-green-500 group/card`,
    decor: <>
        <div className="absolute bottom-2 left-2 text-xs opacity-60 select-none pointer-events-none">🌵</div>
        <div className="absolute top-2 right-2 text-[10px] opacity-40 select-none pointer-events-none animate-pulse">☀️</div>
      </>
  },
  'crystal_cave': {
    classList: `bg-[#F8F8FF] border-3 border-purple-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-purple-300 group/card`,
    decor: <>
        <div className="absolute top-2 left-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-star-twinkle">💎</div>
        <div className="absolute bottom-2 right-2 text-[10px] opacity-50 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>
  },
  'pumpkin_patch': {
    classList: `bg-[#FFF5EE] border-3 border-orange-500 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-orange-600 group/card`,
    decor: <>
        <div className="absolute bottom-2 right-2 text-xs opacity-60 select-none pointer-events-none">🎃</div>
        <div className="absolute top-2 left-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-leaf-flutter">🍂</div>
      </>
  },
  'fairy_tale': {
    classList: `bg-[#FFF0F5] border-3 border-pink-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-pink-400 group/card`,
    decor: <>
        <div className="absolute top-2 right-2 text-xs opacity-60 select-none pointer-events-none animate-pulse">🧚</div>
        <div className="absolute bottom-3 left-2 text-[10px] opacity-50 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>
  },
  'mint_chocolate': {
    classList: `bg-[#F5FFFA] border-3 border-[#6B4423] rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#8B4513] group/card`,
    decor: <>
        <div className="absolute bottom-2 right-3 text-xs opacity-60 select-none pointer-events-none">🍫</div>
        <div className="absolute top-2 left-2 text-[10px] opacity-40 select-none pointer-events-none">🌿</div>
      </>
  },
  'sakura_night': {
    classList: `bg-[#2C1A30] border-3 border-pink-400 text-pink-50/90 rounded-3xl p-6 mb-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-pink-300 group/card`,
    decor: <>
        <div className="absolute top-2 right-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-star-twinkle">🌙</div>
        <div className="absolute bottom-2 left-2 text-[10px] opacity-50 select-none pointer-events-none animate-pulse">🌸</div>
      </>
  },
  'daisy_chain': {
    classList: `bg-[#FFFFF0] border-3 border-yellow-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-yellow-300 group/card`,
    decor: <>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none animate-pulse">🌼</div>
        <div className="absolute bottom-2 right-3 text-[10px] opacity-50 select-none pointer-events-none">🌼</div>
      </>
  },
  'berry_basket': {
    classList: `bg-[#F0F8FF] border-3 border-indigo-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-indigo-400 group/card`,
    decor: <>
        <div className="absolute bottom-2 right-2 text-xs opacity-60 select-none pointer-events-none">🫐</div>
        <div className="absolute top-2 left-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-leaf-flutter">🍃</div>
      </>
  },
};

export default function ProfilePage({
  userName,
  userEmail,
  userAvatar = "🐦",
  userBio = "Feathering my reflective nest, one day at a time.",
  userAvatarBg = "bg-cozy-green",
  avatarImageUrl = "",
  avatarFrameId = "none",
  avatarAnimationId = "none",
  cardBorderStyle = "standard",
  cardBorderRadius = "24px",
  isPremium,
  subscriptionPlan = "free",
  subscriptionPeriodEnd,
  subscriptionCancelAtPeriodEnd = 0,
  subscriptionTrialEnd,
  onTogglePremium,
  onManageBilling,
  onUpdateProfile,
  entries,
  badges,
  goals = [],
  habits = [],
  onLogout,
  onOpenNotificationsLog
}: ProfilePageProps) {
  const { unreadCount, requestNativePermission, nativeNotificationStatus } = useDopamine();
  // Local States
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userName);
  const [editedEmail, setEditedEmail] = useState(userEmail);
  const [editedBio, setEditedBio] = useState(userBio);
  const [selectedEmoji, setSelectedEmoji] = useState(userAvatar);
  const [selectedBg, setSelectedBg] = useState(userAvatarBg);
  const [selectedImageUrl, setSelectedImageUrl] = useState(avatarImageUrl);
  const [selectedFrameId, setSelectedFrameId] = useState(avatarFrameId);
  const [selectedAnimationId, setSelectedAnimationId] = useState(avatarAnimationId);
  const [selectedCardBorderStyle, setSelectedCardBorderStyle] = useState(cardBorderStyle);
  const [selectedCardBorderRadius, setSelectedCardBorderRadius] = useState<'12px'|'24px'|'48px'>(cardBorderRadius as any);

  const renderAvatar = (
    emoji: string,
    bg: string,
    imageUrl: string,
    frameId: string,
    animationId: string,
    sizeClass: string = "w-20 h-20",
    textClass: string = "text-4xl"
  ) => {
    let animClass = "";
    if (animationId === 'pulse') animClass = "animate-cozy-pulse";
    else if (animationId === 'rainbow') animClass = "animate-cozy-rainbow";
    else if (animationId === 'sway') animClass = "animate-cozy-sway";
    else if (animationId === 'spin') animClass = "animate-cozy-spin";
    else if (animationId === 'shimmer') animClass = "relative overflow-hidden after:absolute after:inset-0 after:animate-cozy-shimmer after:pointer-events-none";

    const mainCircle = (
      <div className={`rounded-full ${bg} border-4 border-[#4A3D30]/80 bg-[#EAD8C0] flex items-center justify-center font-black select-none shadow-md overflow-hidden relative ${sizeClass} ${animClass}`}>
        {imageUrl && imageUrl !== "placeholder" ? (
          <img loading="lazy" 
            src={imageUrl} 
            alt="User Avatar" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`relative z-10 inline-block hover:animate-bounce cursor-help ${textClass}`}>
            {emoji}
          </span>
        )}
        <div className="absolute inset-0.5 rounded-full border border-dashed border-[#FAF6EB]/40 pointer-events-none" />
      </div>
    );

    if (!frameId || frameId === 'none') {
      return mainCircle;
    }

    let frameOverlay = null;

    if (frameId === 'sage') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#94A87C]" strokeWidth="3">
            <circle cx="50" cy="50" r="44" className="stroke-emerald-800/25" strokeWidth="2" />
            <circle cx="50" cy="50" r="44" strokeDasharray="6, 4" />
          </svg>
          <span className="absolute top-[-3px] left-[-3px] text-xs">🌱</span>
          <span className="absolute bottom-[-3px] right-[-3px] text-xs">🌿</span>
          <span className="absolute top-[-3px] right-[-3px] text-xs">🍃</span>
          <span className="absolute bottom-[-3px] left-[-3px] text-xs">🌱</span>
        </div>
      );
    } else if (frameId === 'starry') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-amber-400" strokeWidth="3">
            <circle cx="50" cy="50" r="44" className="stroke-amber-400/20" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="44" strokeDasharray="12, 6" />
          </svg>
          <span className="absolute top-[-5px] left-[50%] translate-x-[-50%] text-[10px] animate-pulse">✨</span>
          <span className="absolute bottom-[-3px] left-[15%] text-xs">⭐</span>
          <span className="absolute top-[20%] right-[-5px] text-xs">⭐</span>
          <span className="absolute bottom-[20%] left-[-5px] text-[10px]">✨</span>
        </div>
      );
    } else if (frameId === 'twigs') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-amber-800" strokeWidth="4">
            <circle cx="50" cy="50" r="43" className="stroke-amber-900/30" strokeWidth="5" />
            <circle cx="50" cy="50" r="44" />
          </svg>
          <span className="absolute bottom-[-5px] left-[50%] translate-x-[-50%] text-xs">🌸</span>
          <span className="absolute top-[-4px] right-[15%] text-[11px]">🌸</span>
          <span className="absolute top-[35%] left-[-6px] text-xs">🌸</span>
        </div>
      );
    } else if (frameId === 'honey') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#E6A11D]" strokeWidth="4">
            <path d="M 12 50 A 38 38 0 1 0 88 50 A 38 38 0 1 0 12 50" strokeDasharray="18, 5" />
          </svg>
          <span className="absolute top-[-5px] left-[-3px] text-xs">🍯</span>
          <span className="absolute bottom-[-4px] right-[15%] text-xs">🐝</span>
          <span className="absolute top-[40%] right-[-7px] text-[10px]">🍯</span>
          <div className="absolute bottom-[-1px] left-[10px] w-3 h-5 bg-[#F6D285] rounded-b-full border-b border-x border-[#E6A11D] opacity-90" />
        </div>
      );
    } else if (frameId === 'midnight') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-indigo-400" strokeWidth="2.5">
            <circle cx="50" cy="50" r="44" className="stroke-indigo-900/20" strokeWidth="2" />
            <circle cx="50" cy="50" r="44" strokeDasharray="15, 10" />
          </svg>
          <span className="absolute top-[-7px] right-[10%] text-xs rotate-12">🌙</span>
          <span className="absolute bottom-[-5px] left-[20%] text-xs">☁️</span>
          <span className="absolute bottom-[15%] right-[-5px] text-[10px]">☁️</span>
        </div>
      );
    } else if (frameId === 'autumn') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-amber-600" strokeWidth="3">
            <circle cx="50" cy="50" r="44" strokeDasharray="8, 6" />
          </svg>
          <span className="absolute top-[-5px] left-[20%] text-xs rotate-45">🍂</span>
          <span className="absolute bottom-[-4px] right-[20%] text-xs">🍁</span>
          <span className="absolute top-[40%] right-[-6px] text-xs -rotate-12">🍂</span>
          <span className="absolute bottom-[30%] left-[-6px] text-xs rotate-12">🍁</span>
        </div>
      );
    } else if (frameId === 'winter') {
      frameOverlay = (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-sky-300" strokeWidth="3">
            <circle cx="50" cy="50" r="44" strokeDasharray="14, 8" />
          </svg>
          <span className="absolute top-[-5px] left-[45%] text-[10px] animate-pulse">❄️</span>
          <span className="absolute bottom-[-5px] right-[35%] text-xs">❄️</span>
          <span className="absolute top-[30%] left-[-6px] text-[10px]">❄️</span>
        </div>
      );
    }

    return (
      <div className="relative flex items-center justify-center shrink-0">
        {mainCircle}
        {frameOverlay}
      </div>
    );
  };

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('cozy_dark_theme') === 'true';
  });
  const [notifications, setNotifications] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Time Picker for Reminders
  const [reminderTime, setReminderTime] = useState("21:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Security States (PIN code lock)
  const [securityEnabled, setSecurityEnabled] = useState(() => {
    return localStorage.getItem('cozy_pin_enabled') === 'true';
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinStage, setPinStage] = useState<'verify_off' | 'set_step1' | 'set_step2'>('set_step1');
  const [tempPin, setTempPin] = useState("");

  // Language States
  const [selectedLanguage, setSelectedLanguage] = useState("English (IN)");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Synchronize internal states if props change
  useEffect(() => {
    setEditedName(userName);
    setEditedEmail(userEmail);
    setEditedBio(userBio);
    setSelectedEmoji(userAvatar);
    setSelectedBg(userAvatarBg);
    setSelectedImageUrl(avatarImageUrl);
    setSelectedFrameId(avatarFrameId);
    setSelectedAnimationId(avatarAnimationId);
    setSelectedCardBorderStyle(cardBorderStyle);
    setSelectedCardBorderRadius(cardBorderRadius as any);
  }, [userName, userEmail, userBio, userAvatar, userAvatarBg, avatarImageUrl, avatarFrameId, avatarAnimationId, cardBorderStyle, cardBorderRadius]);

  // Streak calculations (consecutive writing days)
  const getStreakCount = (): number => {
    if (entries.length === 0) return 0;
    const activeDates = new Set<string>();
    entries.forEach(e => {
      const d = new Date(e.date);
      activeDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    });
    
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const getFormattedKey = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    let checkDate = new Date(today);
    // If today hasn't been written yet, verify yesterday
    if (!activeDates.has(getFormattedKey(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (activeDates.has(getFormattedKey(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return currentStreak || (entries.length > 0 ? 1 : 0);
  };

  const currentStreakVal = getStreakCount();

  // Badge Progress Calculation Helpers
  const getBadgeProgress = (badgeId: string): { completed: number; total: number; label: string } => {
    switch (badgeId) {
      case 'badge-1': // First Voice
        return {
          completed: Math.min(entries.length, 1),
          total: 1,
          label: entries.length >= 1 ? "Complete" : "Record 1 journal entry"
        };
      case 'badge-2': // 7-Day Spark
        return {
          completed: Math.min(currentStreakVal, 7),
          total: 7,
          label: `${currentStreakVal}/7 days streak`
        };
      case 'badge-3': // Goal Catalyst
        const maxProgress = goals.length > 0 ? Math.max(...goals.map(g => g.progress)) : 0;
        return {
          completed: Math.min(maxProgress, 75),
          total: 75,
          label: `Max goal progress: ${maxProgress}% / 75%`
        };
      case 'badge-4': // Zen Architect
        const medHabit = habits.find(h => h?.name?.toLowerCase().includes('meditation') || h?.name?.toLowerCase().includes('zen'));
        const medStreak = medHabit ? medHabit.streak : 0;
        return {
          completed: Math.min(medStreak, 5),
          total: 5,
          label: `Meditation streak: ${medStreak}/5 days`
        };
      case 'badge-5': // AI Coachee
        const hasCoachMessage = entries.length > 0; // if they have entries analyzed
        return {
          completed: hasCoachMessage ? 1 : 0,
          total: 1,
          label: hasCoachMessage ? "Complete" : "Engage with the AI Coach"
        };
      default:
        return { completed: 0, total: 1, label: "Unknown status" };
    }
  };

  const exportData = (format: 'txt' | 'md' | 'csv') => {
    let fileContent = '';
    let mimeType = 'text/plain';
    let fileExtension = format;

    if (format === 'txt') {
      fileContent = `DAYNEST JOURNAL - COMPLETE SECURE EXPORT
===========================================
User: ${userName} (${userEmail})
Backup Date: ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Streak Level: ${currentStreakVal} Days
Total Journal Pages: ${entries.length}

` + entries.map((entry, idx) => `
ENTRY #${entries.length - idx}
Date: ${new Date(entry.date).toLocaleString()}
Mood: ${entry.moodEmoji} ${entry.mood}
-------------------------------------------
Transcript: 
"${entry.transcript || "(No voice transcription)"}"

AI Synthesized Summary:
"${entry.summary || "(No summary generated)"}"

Action Items / Takeaways:
${entry.takeaways.map(t => `- ${t}`).join('\n') || "(No key takeaways)"}
===========================================
`).join('\n');
    } else if (format === 'md') {
      mimeType = 'text/markdown';
      fileContent = `# Daynest Archive Export - ${userName}
Exported securely on ${new Date().toLocaleDateString()}
Total Spoken Reflections: **${entries.length}** | Current Streak: **${currentStreakVal} Days**

${entries.map((entry, idx) => `
## Entry - ${new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- **Mood Rating:** ${entry.moodEmoji} *${entry.mood}*
- **Spoken Recording Length:** ${entry.duration} seconds

### 🎙️ Audio Transcript
> ${entry.transcript || "*No transcript recorded.*"}

### 🧠 Cozy Coach Summary & Insights
${entry.summary || "*No insights generated yet.*"}

### 📋 Suggested Action Items
${entry.takeaways.map(t => `- [ ] ${t}`).join('\n') || "*No items extracted.*"}

---
`).join('\n')}`;
    } else if (format === 'csv') {
      mimeType = 'text/csv';
      const headers = 'ID,Date,DurationSeconds,Mood,MoodEmoji,Transcript,Summary,Takeaways\n';
      const rows = entries.map(entry => {
        const cleanTranscript = (entry.transcript || '').replace(/"/g, '""');
        const cleanSummary = (entry.summary || '').replace(/"/g, '""');
        const cleanTakeaways = (entry.takeaways || []).join(' | ').replace(/"/g, '""');
        return `"${entry.id}","${entry.date}",${entry.duration},"${entry.mood}","${entry.moodEmoji}","${cleanTranscript}","${cleanSummary}","${cleanTakeaways}"`;
      }).join('\n');
      fileContent = headers + rows;
    }

    try {
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daynest_journal_backup_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerToast(`Backup successfully saved in ${format.toUpperCase()} format! 💾`, 'success');
    } catch (err) {
      triggerToast('Failed to export data file.', 'error');
    }
  };

  // Profile Save Action
  const handleSaveProfile = () => {
    if (!editedName.trim()) {
      triggerToast("Display name cannot be empty!", "error");
      return;
    }
    onUpdateProfile?.({
      name: editedName.trim(),
      email: editedEmail.trim(),
      bio: editedBio.trim(),
      avatarEmoji: selectedEmoji,
      avatarBg: selectedBg,
      avatarImageUrl: selectedImageUrl,
      avatarFrameId: selectedFrameId,
      avatarAnimationId: selectedAnimationId,
      cardBorderStyle: selectedCardBorderStyle,
      cardBorderRadius: selectedCardBorderRadius,
    });
    setIsEditing(false);
    triggerToast("Your profile updates have been saved! 🌸", "success");
  };

  // Premium Toggle Celebrations
  const handlePremiumAction = (plan: "monthly" | "yearly" = "monthly") => {
    if (!isPremium) {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#E08E6D', '#FFD700', '#F7D6C8', '#4A3D30']
      });
      onTogglePremium(plan);
      triggerToast("Welcome to Daynest Premium! ✨ Cloud Sync & AI coaching activated.", "success");
    } else {
      onTogglePremium(plan);
      triggerToast("Premium subscription cancelled. Returning to Standard Tier.", "info");
    }
  };

  // Time Picker Helper
  const handleSaveReminderTime = (time: string) => {
    setReminderTime(time);
    setShowTimePicker(false);
    triggerToast(`Daily reflection alerts set for ${time}! 🔔`, 'success');
  };

  // Secure PIN Dialog Handlers
  const openPinSetup = () => {
    if (securityEnabled) {
      setPinStage('verify_off');
      setPinInput("");
      setPinError("");
      setShowPinModal(true);
    } else {
      setPinStage('set_step1');
      setPinInput("");
      setPinError("");
      setShowPinModal(true);
    }
  };

  const handlePinNumClick = (num: string) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = () => {
    if (pinInput.length !== 4) {
      setPinError("Please enter a 4-digit PIN.");
      return;
    }

    if (pinStage === 'verify_off') {
      const savedPin = localStorage.getItem('cozy_security_pin');
      if (pinInput === savedPin) {
        localStorage.removeItem('cozy_security_pin');
        localStorage.setItem('cozy_pin_enabled', 'false');
        setSecurityEnabled(false);
        setShowPinModal(false);
        triggerToast("Passcode security disabled.", "info");
      } else {
        setPinError("Incorrect PIN. Please try again.");
        setPinInput("");
      }
    } else if (pinStage === 'set_step1') {
      setTempPin(pinInput);
      setPinInput("");
      setPinStage('set_step2');
      setPinError("");
    } else if (pinStage === 'set_step2') {
      if (pinInput === tempPin) {
        localStorage.setItem('cozy_security_pin', pinInput);
        localStorage.setItem('cozy_pin_enabled', 'true');
        setSecurityEnabled(true);
        setShowPinModal(false);
        triggerToast("Cozy PIN Lock securely enabled! 🔒", "success");
      } else {
        setPinError("PINs do not match. Start over.");
        setPinInput("");
        setPinStage('set_step1');
      }
    }
  };

  // Bird & Nest Helper functions to determine user species and nest quality
  const getBirdClass = () => {
    if (isPremium) return "Celestial Starling 🌟";
    const count = entries.length;
    if (count < 3) return "Fledgling Sparrow 🐣";
    if (count < 8) return "Singing Bluejay 🐦";
    if (count < 15) return "Cozy Robin 🪶";
    if (count < 30) return "Wise Forest Owl 🦉";
    return "Golden Phoenix 🔥";
  };

  const getNestState = () => {
    const streak = currentStreakVal;
    if (streak <= 2) return "Starting Nest (Twigs & Leaves) 🍂";
    if (streak <= 6) return "Cozy Moss Nest (Soft & Insulated) 🪹";
    if (streak <= 14) return "Safe Feathered Nest (Warm & Protective) 🪺";
    return "Luxurious Sanctuary (Daynest Masterpiece) ✨🪺";
  };

  // Dark Calming Theme Toggle with real persistence
  const handleDarkModeToggle = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem('cozy_dark_theme', String(nextVal));
    
    // Toggle class on document body or let global system know
    if (nextVal) {
      document.documentElement.classList.add('dark');
      triggerToast("Calming Dark Theme activated! 🌙", "success");
    } else {
      document.documentElement.classList.remove('dark');
      triggerToast("Gentle Sunlit Theme activated! ☀️", "success");
    }
  };

  const currentCardStyle = isEditing ? selectedCardBorderStyle : (cardBorderStyle || 'standard');
  let cardClassList = CARD_STYLE_MAP[currentCardStyle]?.classList || CARD_STYLE_MAP['standard'].classList;
  let cardDecor = CARD_STYLE_MAP[currentCardStyle]?.decor || CARD_STYLE_MAP['standard'].decor;
    return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-cozy-bg text-cozy-text-dark flex flex-col p-6 md:p-8 pb-24" id="profile_tab">
      <style>{`
        @keyframes cozy-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes cozy-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cozy-sway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes cozy-rainbow-glow {
          0% { border-color: #EF9A7A; box-shadow: 0 0 12px rgba(239, 154, 122, 0.5); }
          33% { border-color: #94A87C; box-shadow: 0 0 12px rgba(148, 168, 124, 0.5); }
          66% { border-color: #F6D285; box-shadow: 0 0 12px rgba(246, 210, 133, 0.5); }
          100% { border-color: #EF9A7A; box-shadow: 0 0 12px rgba(239, 154, 122, 0.5); }
        }
        @keyframes cozy-card-rainbow {
          0% { border-color: #EF9A7A; box-shadow: 0 4px 15px rgba(239, 154, 122, 0.2); }
          33% { border-color: #94A87C; box-shadow: 0 4px 15px rgba(148, 168, 124, 0.2); }
          66% { border-color: #F6D285; box-shadow: 0 4px 15px rgba(246, 210, 133, 0.2); }
          100% { border-color: #EF9A7A; box-shadow: 0 4px 15px rgba(239, 154, 122, 0.2); }
        }
        @keyframes cozy-card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes cozy-star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes cozy-leaf-flutter {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg) translateY(1px); }
        }
        @keyframes cozy-bee-flight {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(3px, -2px) rotate(5deg); }
        }
        @keyframes cozy-aurora-glow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cozy-shimmer-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-cozy-pulse {
          animation: cozy-pulse 3s ease-in-out infinite !important;
        }
        .animate-cozy-spin {
          animation: cozy-spin-slow 16s linear infinite !important;
        }
        .animate-cozy-sway {
          animation: cozy-sway 4s ease-in-out infinite !important;
        }
        .animate-cozy-rainbow {
          animation: cozy-rainbow-glow 6s linear infinite !important;
        }
        .animate-cozy-rainbow-card {
          animation: cozy-card-rainbow 10s linear infinite !important;
        }
        .animate-cozy-aurora-bg {
          background-size: 200% 200% !important;
          animation: cozy-aurora-glow 15s ease infinite !important;
        }
        .animate-cozy-card-float {
          animation: cozy-card-float 6s ease-in-out infinite;
        }
        .animate-cozy-star-twinkle {
          animation: cozy-star-twinkle 3s ease-in-out infinite;
        }
        .animate-cozy-leaf-flutter {
          animation: cozy-leaf-flutter 5s ease-in-out infinite;
        }
        .animate-cozy-bee-flight {
          animation: cozy-bee-flight 4s ease-in-out infinite;
        }
        .animate-cozy-shimmer {
          position: relative;
        }
        .animate-cozy-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: cozy-shimmer-sweep 2s infinite linear;
          pointer-events: none;
        }
      `}</style>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border-2 border-cozy-text-dark bg-[#FFFDF9] shadow-md flex items-center gap-2 text-xs font-mono font-black uppercase text-cozy-text-dark tracking-wide"
          >
            <span className="text-sm">
              {toast.type === 'success' ? '✨' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Row */}
      <div className="mb-6 flex justify-between items-start">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cozy-orange/10 text-cozy-orange border border-cozy-orange/20">
            <User size={11} strokeWidth={2.5} />
            <span>User Identity</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-cozy-text-dark">Your Profile</h2>
          <p className="text-xs text-cozy-text-muted font-bold">Customize your reflective nest, badges & data backup</p>
        </div>
        
        {/* Simple signout for header safety */}
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-[#FCF8F2] text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer shadow-xs tactile-btn-retro"
        >
          Sign Out
        </button>
      </div>

      {/* Profile Bio Card with full Edit support */}
      <div className={cardClassList}>
        {/* Decorative Nest branches and foliage patterns */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-800/5 to-amber-800/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-24 h-24 bg-gradient-to-tr from-[#94A87C]/10 to-transparent rounded-full blur-lg pointer-events-none" />
        
        {/* Dynamic Card Borders and Ornaments decoration overlay */}
        {cardDecor}

        {!isEditing ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 md:gap-6 relative z-10">
            {/* Avatar Bubble with Edit Trigger (Selector 1) */}
            <div className="relative group shrink-0 flex flex-col items-center">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-600/25 to-[#8F744B]/20 blur-sm group-hover:blur-md transition-all duration-300 pointer-events-none" />
              <div className="group-hover:scale-105 transition-all duration-300 relative">
                {renderAvatar(selectedEmoji, selectedBg, selectedImageUrl, selectedFrameId, selectedAnimationId, "w-20 h-20", "text-4xl")}
              </div>
              {/* Twig Nest Platform perched under the avatar */}
              <div className="absolute -bottom-2.5 z-20 text-xl pointer-events-none select-none drop-shadow-sm filter transition-transform duration-300 group-hover:translate-y-0.5" title="Cozy Nest Bowl">
                🪹
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-2 -right-1 bg-white p-1.5 rounded-xl text-cozy-text-dark shadow-sm border-2 border-cozy-text-dark hover:scale-110 transition cursor-pointer z-30"
                title="Edit Avatar & Bio"
              >
                <Edit2 size={10} strokeWidth={3} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                <h3 className="text-base font-black text-cozy-text-dark">{userName}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {isPremium ? (
                    <span className="inline-flex items-center gap-1 text-[8px] font-black text-amber-950 bg-[#FCF9EC] border-2 border-amber-800/30 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                      <Crown size={9} fill="currentColor" className="text-amber-600" />
                      <span>Celestial Starling</span>
                    </span>
                  ) : (
                    <span className="inline-block text-[8px] font-black text-cozy-text-muted bg-[#FAF6EB] border border-cozy-text-dark/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Free Flight Standard
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-black text-emerald-900 bg-[#E2ECE0] border-2 border-[#5C6E58]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    🍃 {currentStreakVal} Day Nest Warmth
                  </span>
                </div>
              </div>

              {/* Bird Species & Nest State Badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-950 bg-amber-50 border border-amber-800/20 px-2 py-1 rounded-lg shadow-3xs" title="Determined by total journal entries">
                  🐤 Bird Class: <strong className="text-[#8F5B34]">{getBirdClass()}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-950 bg-emerald-50/50 border border-emerald-800/15 px-2 py-1 rounded-lg shadow-3xs" title="Determined by day streak status">
                  🪺 Nest Build: <strong className="text-emerald-800">{getNestState()}</strong>
                </span>
              </div>
              
              <p className="text-[10.5px] font-semibold text-[#7A6956] italic leading-relaxed max-w-lg mt-1">
                "{editedBio}"
              </p>
              
              <p className="text-[10px] text-cozy-text-muted font-bold font-mono">{userEmail}</p>

              {/* Real Metrics Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-2 text-[10px] text-cozy-text-muted font-bold border-t border-dashed border-[#4A3D30]/10">
                <div className="flex items-center gap-1">
                  <span className="text-sm">📖</span>
                  <span><strong className="text-cozy-text-dark text-xs">{entries.length}</strong> Spoken Twigs (logs)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm">🏆</span>
                  <span><strong className="text-cozy-text-dark text-xs">{badges.filter(b => b.unlocked).length}</strong> / {badges.length} Shiny Pebbles (badges)</span>
                </div>
              </div>
            </div>

            {/* Visual Nest & Bird Perch Mini-Widget */}
            <div className="hidden md:flex flex-col items-center justify-center bg-[#FCFAF5] border-2 border-dashed border-[#8F744B]/20 rounded-2xl p-3.5 text-center shrink-0 w-32 relative overflow-hidden group/nest select-none shadow-3xs hover:border-[#8F744B]/40 transition-all duration-300">
              <div className="absolute top-0 right-0 w-12 h-12 bg-[#94A87C]/5 rounded-full blur-lg pointer-events-none" />
              <span className="text-xs font-black uppercase text-[#8F744B] tracking-wider text-[8px] font-mono mb-1">Nest Warmth</span>
              <div className="text-2xl mb-1 select-none">
                {currentStreakVal > 6 ? "🪺" : "🪹"}
              </div>
              <div className="text-xs font-bold text-cozy-text-dark flex items-center gap-0.5 font-mono mb-1">
                🔥 {currentStreakVal * 10 + 10}%
              </div>
              <div className="w-full bg-[#EAD8C0]/30 h-1.5 rounded-full overflow-hidden border border-[#4A3D30]/10">
                <div 
                  className="bg-cozy-orange h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((currentStreakVal * 10 + 10) / 100) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[7px] font-mono font-black uppercase text-cozy-text-muted mt-1 tracking-tight">
                {currentStreakVal > 14 ? "Cosy Hollow!" : "Keep Spoken Twigs!"}
              </span>
            </div>

            {/* Edit Profile button */}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 text-cozy-text-muted hover:text-cozy-orange hover:scale-105 transition hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-black uppercase cursor-pointer"
            >
              <Edit2 size={11} strokeWidth={2.5} />
              <span>Mend Nest</span>
            </button>
          </div>
        ) : (
          /* Profile Edit Fields Inside the Card */
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#4A3D30]/10">
              <span className="text-xs font-black uppercase font-mono text-[#7A6956] tracking-wider">Customize Your Profile Nest</span>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1 text-cozy-text-muted hover:text-rose-600 transition"
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Left Column: Interactive Avatar Customization Preview & Selector */}
              <div className="md:col-span-5 flex flex-col items-center p-4 bg-white/60 rounded-2xl border-2 border-dashed border-[#4A3D30]/15 text-center space-y-4">
                {/* Live Preview of the avatar with selected frame and animation */}
                <div className="relative p-4 flex flex-col items-center">
                  {renderAvatar(selectedEmoji, selectedBg, selectedImageUrl, selectedFrameId, selectedAnimationId, "w-24 h-24", "text-5xl")}
                  {/* Nest platform perched under the avatar */}
                  <div className="text-2.5xl mt-1 select-none pointer-events-none" title="Cozy Nest Bowl">🪹</div>
                  <span className="text-[10px] font-black font-mono text-[#7A6956] uppercase tracking-wider mt-1">Live Nestling Preview</span>
                </div>

                {/* Avatar Source Toggles: Emoji vs. Custom Image */}
                <div className="w-full space-y-2">
                  <div className="flex gap-2 p-1 bg-[#FAF6EB] rounded-xl border border-cozy-text-dark/15">
                    <button
                      type="button"
                      onClick={() => setSelectedImageUrl("")}
                      className={`flex-1 py-1 text-[10px] font-bold font-mono uppercase rounded-lg transition cursor-pointer ${!selectedImageUrl ? 'bg-[#94A87C] text-white shadow-xs' : 'text-[#7A6956] hover:bg-black/5'}`}
                    >
                      Emoji
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedImageUrl) {
                          setSelectedImageUrl("placeholder");
                        }
                      }}
                      className={`flex-1 py-1 text-[10px] font-bold font-mono uppercase rounded-lg transition cursor-pointer ${selectedImageUrl ? 'bg-[#94A87C] text-white shadow-xs' : 'text-[#7A6956] hover:bg-black/5'}`}
                    >
                      Photo Upload
                    </button>
                  </div>

                  {/* Dynamic sub-panels depending on selection */}
                  {!selectedImageUrl || selectedImageUrl === "placeholder" ? (
                    <div className="space-y-3.5 pt-1">
                      <span className="text-[9px] font-bold text-cozy-text-muted uppercase tracking-wider block">Pick an Emoji & Backing</span>
                      
                      {/* Horizontal Emoji Selection list */}
                      <div className="flex gap-1.5 overflow-x-auto w-full max-w-[240px] pb-2 scrollbar-thin scrollbar-thumb-amber-800/15 justify-start sm:justify-center mx-auto">
                        {AVATAR_EMOJIS.map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              setSelectedEmoji(em);
                              setSelectedImageUrl("");
                            }}
                            className={`text-xl p-1.5 hover:scale-115 active:scale-95 transition cursor-pointer shrink-0 rounded-md ${(!selectedImageUrl && selectedEmoji === em) ? 'bg-[#FFFDF9] ring-2 ring-cozy-orange/40 scale-110 shadow-xs' : ''}`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>

                      {/* Background color chips */}
                      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                        {AVATAR_BGS.map(bg => (
                          <button
                            key={bg.value}
                            type="button"
                            onClick={() => {
                              setSelectedBg(bg.value);
                              setSelectedImageUrl("");
                            }}
                            className={`w-5 h-5 rounded-full border border-cozy-text-dark/40 cursor-pointer transition ${bg.value} ${(!selectedImageUrl && selectedBg === bg.value) ? 'ring-2 ring-cozy-orange scale-115 shadow-xs' : 'hover:scale-105'}`}
                            title={bg.label}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1 bg-[#FCFAF5] p-3 rounded-xl border border-cozy-text-dark/10">
                      <span className="text-[9px] font-black text-cozy-text-muted uppercase tracking-wider block">Upload JPG Custom Picture</span>
                      
                      <div className="flex flex-col items-center gap-2">
                        <label className="w-full flex flex-col items-center justify-center py-2.5 px-3 bg-[#FCF8F2] hover:bg-[#FAF3E8] text-[#7A6956] border-2 border-dashed border-amber-800/20 rounded-xl cursor-pointer hover:border-amber-800/50 transition">
                          <span className="text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1">
                            📸 Choose JPG / PNG
                          </span>
                          <span className="text-[8px] text-cozy-text-muted font-bold font-mono mt-0.5">Under 1MB for cozy storage</span>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/jpg" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const compressImage = (imageFile) => {
                                  const img = new Image();
                                  img.src = URL.createObjectURL(imageFile);
                                  img.onload = () => {
                                    const canvas = document.createElement("canvas");
                                    const MAX_WIDTH = 256;
                                    const MAX_HEIGHT = 256;
                                    let width = img.width;
                                    let height = img.height;

                                    if (width > height) {
                                      if (width > MAX_WIDTH) {
                                        height = Math.round((height *= MAX_WIDTH / width));
                                        width = MAX_WIDTH;
                                      }
                                    } else {
                                      if (height > MAX_HEIGHT) {
                                        width = Math.round((width *= MAX_HEIGHT / height));
                                        height = MAX_HEIGHT;
                                      }
                                    }

                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext("2d");
                                    ctx.drawImage(img, 0, 0, width, height);

                                    // Compress to JPEG with 0.8 quality
                                    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
                                    setSelectedImageUrl(compressedDataUrl);
                                    triggerToast("Cozy custom photo optimized and uploaded successfully! 📸", "success");
                                  };
                                };
                                compressImage(file);
                              }
                            }}
                          />
                        </label>

                        {selectedImageUrl && selectedImageUrl !== "placeholder" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImageUrl("");
                              triggerToast("Reverted back to your cozy emoji bird! 🐦", "info");
                            }}
                            className="text-[9px] font-black text-rose-600 font-mono uppercase tracking-wider hover:underline"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Name, Bio and Custom Steam-style cozy border/animations layout */}
              <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1">Your Name</label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value.slice(0, 24))}
                        placeholder="Enter display name"
                        className="w-full px-3 py-1.5 text-xs font-bold text-cozy-text-dark bg-white border-2 border-cozy-text-dark rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cozy-orange/20"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1">Bio / Daily Intention</label>
                      <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value.slice(0, 90))}
                        placeholder="What is your mindful goal?"
                        rows={1}
                        className="w-full px-3 py-1.5 text-xs font-bold text-cozy-text-dark bg-white border-2 border-cozy-text-dark rounded-xl focus:outline-hidden focus:ring-2 focus:ring-cozy-orange/20 resize-none"
                      />
                    </div>
                  </div>

                  {/* Borders (Cozy Avatar Frames) Section */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1.5 flex items-center gap-1">
                      <span>🖼️ Cozy Avatar Frames</span>
                      <span className="text-[8px] font-normal text-cozy-text-muted capitalize font-sans">(Steam Profile templates)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[145px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-800/10">
                      {AVATAR_FRAMES.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFrameId(f.id)}
                          className={`p-2 rounded-xl text-left border-2 transition relative flex flex-col justify-between gap-1 select-none cursor-pointer ${
                            selectedFrameId === f.id
                              ? 'bg-[#FCF9EC] border-cozy-orange shadow-xs'
                              : 'bg-white/40 border-cozy-text-dark/10 hover:border-[#4A3D30]/30 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm">{f.icon}</span>
                            {selectedFrameId === f.id && (
                              <span className="w-3.5 h-3.5 rounded-full bg-cozy-orange flex items-center justify-center text-[8px] text-white font-black">
                                ✓
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[9.5px] font-black text-cozy-text-dark truncate leading-none">{f.name}</p>
                            <p className="text-[7.5px] text-cozy-text-muted font-bold truncate mt-0.5">{f.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Borders Animations Section */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1.5 flex items-center gap-1">
                      <span>✨ Nestling Aura Animations</span>
                      <span className="text-[8px] font-normal text-cozy-text-muted capitalize font-sans">(Aesthetic visual effects)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-800/10">
                      {AVATAR_ANIMATIONS.map((an) => (
                        <button
                          key={an.id}
                          type="button"
                          onClick={() => setSelectedAnimationId(an.id)}
                          className={`p-2 rounded-xl text-left border-2 transition relative flex flex-col justify-between gap-1 select-none cursor-pointer ${
                            selectedAnimationId === an.id
                              ? 'bg-[#FCF9EC] border-cozy-orange shadow-xs'
                              : 'bg-white/40 border-cozy-text-dark/10 hover:border-[#4A3D30]/30 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[8px] font-black uppercase tracking-wider font-mono text-cozy-orange">
                              {an.id === 'none' ? 'Static' : 'FX'}
                            </span>
                            {selectedAnimationId === an.id && (
                              <span className="w-3.5 h-3.5 rounded-full bg-cozy-orange flex items-center justify-center text-[8px] text-white font-black">
                                ✓
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[9.5px] font-black text-cozy-text-dark truncate leading-none">{an.name}</p>
                            <p className="text-[7.5px] text-cozy-text-muted font-bold truncate mt-0.5">{an.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Theme Borders Section */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1.5 flex items-center gap-1">
                      <span>🧱 Nest Card Borders</span>
                      <span className="text-[8px] font-normal text-cozy-text-muted capitalize font-sans">(Cozy profile container themes)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-800/10">
                      {COZY_CARD_BORDER_STYLES.map((cb) => (
                        <button
                          key={cb.id}
                          type="button"
                          onClick={() => setSelectedCardBorderStyle(cb.id)}
                          className={`p-2 rounded-xl text-left border-2 transition relative flex flex-col justify-between gap-1 select-none cursor-pointer ${
                            selectedCardBorderStyle === cb.id
                              ? 'bg-[#FCF9EC] border-cozy-orange shadow-xs'
                              : 'bg-white/40 border-cozy-text-dark/10 hover:border-[#4A3D30]/30 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm">{cb.icon}</span>
                            {selectedCardBorderStyle === cb.id && (
                              <span className="w-3.5 h-3.5 rounded-full bg-cozy-orange flex items-center justify-center text-[8px] text-white font-black">
                                ✓
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-[9.5px] font-black text-cozy-text-dark truncate leading-none">{cb.name}</p>
                            <p className="text-[7.5px] text-cozy-text-muted font-bold truncate mt-0.5">{cb.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Radius Selection */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#7A6956] font-mono block mb-1.5 flex items-center gap-1 mt-3">
                      <span>📐 Nest Border Radius</span>
                      <span className="text-[8px] font-normal text-cozy-text-muted capitalize font-sans">(Journal Card Curvature)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['12px', '24px', '48px'].map((radius) => (
                        <button
                          key={radius}
                          type="button"
                          onClick={() => setSelectedCardBorderRadius(radius as any)}
                          className={`p-2 rounded-xl text-center border-2 transition relative select-none cursor-pointer ${
                            selectedCardBorderRadius === radius
                              ? 'bg-[#FCF9EC] border-cozy-orange shadow-xs'
                              : 'bg-white/40 border-cozy-text-dark/10 hover:border-[#4A3D30]/30 hover:bg-white/80'
                          }`}
                        >
                          <span className="text-[10px] font-black text-cozy-text-dark block">{radius}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to props
                      setSelectedEmoji(userAvatar);
                      setSelectedBg(userAvatarBg);
                      setSelectedImageUrl(avatarImageUrl);
                      setSelectedFrameId(avatarFrameId);
                      setSelectedAnimationId(avatarAnimationId);
                      setSelectedCardBorderStyle(cardBorderStyle || 'standard');
                      setSelectedCardBorderRadius((cardBorderRadius as any) || '24px');
                    }}
                    className="px-3.5 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-white text-cozy-text-dark border-2 border-cozy-text-dark rounded-xl cursor-pointer tactile-btn-retro"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider bg-[#94A87C] text-white border-2 border-cozy-text-dark rounded-xl flex items-center gap-1 cursor-pointer shadow-xs tactile-btn-retro"
                  >
                    <Save size={10} strokeWidth={2.5} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Subscription Card */}
      <div className="border-3 border-cozy-text-dark rounded-3xl mb-5 shadow-sm overflow-hidden relative">
        <div className={`p-5 transition-all ${isPremium ? 'bg-gradient-to-b from-[#FCF9EC] to-[#FDFBF2] text-amber-950' : 'bg-cozy-card text-cozy-text-dark'}`}>
          <div className="flex justify-between items-start mb-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-cozy-orange uppercase tracking-widest font-mono">
              <Crown size={15} fill="currentColor" className={isPremium ? 'text-amber-600' : 'text-cozy-orange'} />
              <span>Premium Nest Membership</span>
            </div>
            {isPremium ? (
              <span className="text-[10px] font-black text-amber-800 font-mono uppercase bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-900/10">
                Active {subscriptionPlan === "yearly" ? "Annual" : "Monthly"}
              </span>
            ) : (
              <span className="text-[10px] font-black text-cozy-orange font-mono uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-cozy-orange/20">
                7-Day Free Trial Included
              </span>
            )}
          </div>

          <p className="text-[11px] leading-relaxed mb-4 font-semibold text-cozy-text-dark/90">
            {isPremium 
              ? "Wonderful! You've unlocked unlimited spoken reflections, private cloud security backings, emotional forecast metrics, and personalized advice conversations with the AI Coach."
              : "Expand your mindful garden. Unlock limitless logs, secure cloud backups, emotional forecast parameter trends, and personalized dialogue pathways with your AI Life Coach."}
          </p>

          {/* Premium Features Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-4 text-[10px] font-bold text-cozy-text-dark/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Unlimited Voice & Text Journaling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Cozy AI Life Coach Chats & Guidance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Interactive Calendar Garden Forecasts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Secure Encrypted Cloud Backups</span>
            </div>
          </div>

          {isPremium ? (
            /* ACTIVE SUBSCRIBER DETAILS */
            <div className="border-2 border-dashed border-[#7A6956]/20 bg-[#FAF7EB]/80 rounded-2xl p-4 mb-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">Current Plan:</span>
                <span className="font-extrabold capitalize text-amber-900">{subscriptionPlan} Membership</span>
              </div>
              
              {subscriptionTrialEnd && new Date(subscriptionTrialEnd).getTime() > Date.now() && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">Trial Period Ends:</span>
                  <span className="font-extrabold text-amber-900">
                    {new Date(subscriptionTrialEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}

              {subscriptionPeriodEnd && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">
                    {subscriptionCancelAtPeriodEnd ? "Subscription Expires On:" : "Next Renewal Date:"}
                  </span>
                  <span className="font-extrabold text-amber-900">
                    {new Date(subscriptionPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-[#7A6956] font-mono uppercase tracking-wider">Auto-Renewal:</span>
                <span className={`font-extrabold px-1.5 py-0.5 rounded-md text-[10px] ${subscriptionCancelAtPeriodEnd ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>
                  {subscriptionCancelAtPeriodEnd ? "Disabled (Cancelling)" : "Enabled"}
                </span>
              </div>

              {onManageBilling && (
                <div className="pt-2">
                  <button
                    onClick={onManageBilling}
                    className="w-full py-2 bg-white text-cozy-text-dark border-2 border-[#4A3D30] rounded-xl text-[11px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-amber-50 cursor-pointer tactile-btn-retro shadow-xs"
                  >
                    <Info size={12} />
                    <span>Manage Billing & Customer Portal</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PLAN SELECTION SCREEN */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monthly Subscription Option */}
                <button
                  onClick={() => {
                    confetti({
                      particleCount: 80,
                      spread: 60,
                      colors: ['#E08E6D', '#94A87C']
                    });
                    onTogglePremium("monthly");
                  }}
                  className="p-3.5 bg-white border-2 border-cozy-text-dark hover:border-cozy-orange rounded-2xl text-left transition relative cursor-pointer group tactile-btn-retro flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[#7A6956] block mb-0.5">Flexible Plan</span>
                    <h4 className="text-xs font-extrabold text-cozy-text-dark group-hover:text-cozy-orange transition">Monthly Nest</h4>
                    <p className="text-[10px] text-cozy-text-muted mt-1 leading-normal font-semibold">Includes 7-day trial, then billed monthly. Cancel anytime.</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#4A3D30]/10 flex justify-between items-baseline">
                    <span className="text-xs font-mono font-extrabold text-cozy-text-dark">$9.99<span className="text-[9px] text-cozy-text-muted">/mo</span></span>
                    <span className="text-[9px] font-mono bg-[#FAF7EB] px-1.5 py-0.5 border border-[#4A3D30]/10 rounded-md font-bold text-cozy-orange group-hover:bg-amber-50">7 Days Free</span>
                  </div>
                </button>

                {/* Yearly Subscription Option */}
                <button
                  onClick={() => {
                    confetti({
                      particleCount: 120,
                      spread: 80,
                      colors: ['#FFD700', '#94A87C', '#E08E6D']
                    });
                    onTogglePremium("yearly");
                  }}
                  className="p-3.5 bg-gradient-to-br from-[#FFFDF5] to-[#FCFAF0] border-2 border-cozy-orange rounded-2xl text-left transition relative cursor-pointer group tactile-btn-retro flex flex-col justify-between shadow-xs"
                >
                  <div className="absolute -top-2 right-3 bg-cozy-orange text-white text-[8px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-cozy-text-dark">
                    Best Value - Save 33%
                  </div>
                  <div className="mt-1">
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-cozy-orange block mb-0.5">Annual Nest</span>
                    <h4 className="text-xs font-extrabold text-cozy-text-dark group-hover:text-cozy-orange transition">Yearly Nest</h4>
                    <p className="text-[10px] text-cozy-text-muted mt-1 leading-normal font-semibold">Includes 7-day trial, then billed annually. Best savings!</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-cozy-orange/20 flex justify-between items-baseline">
                    <span className="text-xs font-mono font-extrabold text-cozy-text-dark">$79.99<span className="text-[9px] text-cozy-text-muted">/yr</span></span>
                    <span className="text-[9px] font-mono bg-cozy-orange/10 px-1.5 py-0.5 rounded-md font-extrabold text-cozy-orange">7 Days Free</span>
                  </div>
                </button>
              </div>

              <div className="text-[10px] text-center text-cozy-text-muted font-bold font-mono pt-1">
                🔒 Secured with Stripe Checkout. Real-time sync. Cancel in 1 click.
              </div>
            </div>
          )}
        </div>
      </div>



    

      {/* App Settings Card */}
      <div className={cardClassList}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-800/5 to-amber-800/5 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-cozy-text-dark/5 flex items-center justify-center">
            <Settings size={16} strokeWidth={2.5} className="text-cozy-text-dark" />
          </div>
          <div>
            <h3 className="text-sm font-black text-cozy-text-dark">App Preferences</h3>
            <p className="text-[10px] text-cozy-text-muted font-bold font-mono">Notifications & Device Settings</p>
          </div>
        </div>

        <div className="relative z-10 space-y-3 pt-2">
          {/* Notifications Log */}
          <button
            onClick={onOpenNotificationsLog}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-[#FFFCEB] rounded-xl text-left cursor-pointer transition border-2 border-[#4A3D30] tactile-btn-retro shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-cozy-orange/10 border border-cozy-text-dark/10 flex items-center justify-center text-cozy-orange relative">
              <Bell size={14} strokeWidth={2.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cozy-orange text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-cozy-text-dark leading-tight">Notifications Log</p>
              <p className="text-[9px] text-cozy-text-muted font-bold leading-none mt-0.5">View your app achievements</p>
            </div>
          </button>

          {/* Device Notifications */}
          <button
            onClick={requestNativePermission}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-[#FFFCEB] rounded-xl text-left cursor-pointer transition border-2 border-[#4A3D30] tactile-btn-retro shadow-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-cozy-orange/10 border border-cozy-text-dark/10 flex items-center justify-center text-cozy-orange">
              <Bell size={14} strokeWidth={2.5} />
            </div>
            <div className="flex-1 flex items-center justify-between gap-1">
              <div>
                <p className="text-xs font-black text-cozy-text-dark leading-tight">Device Notifications</p>
                <p className="text-[9px] text-cozy-text-muted font-bold leading-none mt-0.5">
                  {nativeNotificationStatus === 'granted' ? 'Allowed on this device' : 'Click to enable device alerts'}
                </p>
              </div>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shadow-sm shrink-0 uppercase ${
                nativeNotificationStatus === 'granted' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-cozy-orange/10 text-cozy-orange border-cozy-orange/20'
              }`}>
                {nativeNotificationStatus === 'granted' ? 'Active' : 'Enable'}
              </span>
            </div>
          </button>
        </div>
      </div>

</div>
  );
}
