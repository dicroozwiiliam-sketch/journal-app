const fs = require('fs');

const styles = [
  { id: 'standard', name: 'Classic Nest 🪹', icon: '🪹', desc: 'Handcrafted chocolate border.',
    classList: "bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-900 group/card",
    decor: `<div className="absolute top-3 right-4 flex gap-1 text-emerald-800/15 pointer-events-none select-none">
      <Leaf size={14} className="rotate-45" />
      <Leaf size={10} className="-rotate-12" />
    </div>`
  },
  { id: 'woodland', name: 'Sage Woodland 🌿', icon: '🌿', desc: 'Sage wood with sprouting leaves.',
    classList: "bg-[#F1ECE1] border-3 border-[#94A87C]/80 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#7C9065] group/card",
    decor: `<>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-35 select-none pointer-events-none animate-cozy-leaf-flutter">🌿</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-35 select-none pointer-events-none animate-cozy-leaf-flutter">🌱</div>
        <div className="absolute top-1/2 -right-1 text-sm opacity-25 select-none pointer-events-none rotate-45 animate-cozy-leaf-flutter">🍃</div>
      </>`
  },
  { id: 'starry', name: 'Stardust ✨', icon: '✨', desc: 'Soft warm gold with twinkles.',
    classList: "bg-[#FFF9E6] border-3 border-amber-400 rounded-3xl p-6 mb-5 shadow-md relative overflow-hidden transition-all duration-300 hover:border-amber-500 group/card",
    decor: `<>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
        <div className="absolute bottom-2.5 right-3 text-xs opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">⭐</div>
        <div className="absolute top-3 right-8 text-[10px] opacity-30 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>`
  },
  { id: 'floral', name: 'Spring Blossom 🌸', icon: '🌸', desc: 'Rose pastel with flower buds.',
    classList: "bg-[#FFF0F2] border-3 border-rose-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-rose-400 group/card",
    decor: `<>
        <div className="absolute top-2.5 left-3 text-xs opacity-50 select-none pointer-events-none animate-pulse">🌸</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-50 select-none pointer-events-none animate-bounce" style={{ animationDuration: '4s' }}>🌸</div>
        <div className="absolute top-3 right-8 text-[10px] opacity-40 select-none pointer-events-none">🌸</div>
      </>`
  },
  { id: 'honey', name: 'Sweet Honey Hive 🍯', icon: '🍯', desc: 'Honeycomb gold trim with honeybees.',
    classList: "bg-[#FFF6E0] border-3 border-[#E6A11D] rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-600 group/card",
    decor: `<>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-50 select-none pointer-events-none animate-cozy-bee-flight">🐝</div>
        <div className="absolute bottom-2.5 right-3 text-xs opacity-50 select-none pointer-events-none">🍯</div>
        <div className="absolute top-4 right-10 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-bee-flight">🐝</div>
      </>`
  },
  { id: 'midnight', name: 'Midnight Orbit 🌙', icon: '🌙', desc: 'Silent dark indigo dreamscape.',
    classList: "bg-[#16142c] border-3 border-indigo-400 text-indigo-50/90 rounded-3xl p-6 mb-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-indigo-300 group/card",
    decor: `<>
        <div className="absolute top-2.5 left-3 text-xs opacity-55 select-none pointer-events-none">🌙</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-50 select-none pointer-events-none animate-pulse">☁️</div>
        <div className="absolute top-3 right-10 text-[9px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>`
  },
  { id: 'rainbow', name: 'Pastel Aura 🌈', icon: '🌈', desc: 'Shifting colors & magic glow.',
    classList: "bg-[#FAF7FD] border-3 border-pink-400 rounded-3xl p-6 mb-5 shadow-md relative overflow-hidden transition-all duration-300 hover:border-purple-400 group/card animate-cozy-rainbow-card",
    decor: `<>
        <div className="absolute top-2.5 left-2.5 text-xs opacity-55 select-none pointer-events-none">🌈</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-55 select-none pointer-events-none animate-pulse">⭐</div>
      </>`
  }
];

const newThemes = [
  { id: 'cherry_blossom', name: 'Cherry Blossom 🌸', icon: '🌸', desc: 'Pink floral hoop with butterflies.',
    classList: "bg-[#FFF0F5] border-3 border-pink-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-pink-400 group/card",
    decor: `<>
        <div className="absolute top-2.5 left-3 text-xs opacity-60 select-none pointer-events-none animate-pulse">🦋</div>
        <div className="absolute bottom-2.5 right-2.5 text-xs opacity-70 select-none pointer-events-none animate-cozy-leaf-flutter">🌸</div>
      </>`
  },
  { id: 'autumn_leaves', name: 'Autumn Crunch 🍁', icon: '🍁', desc: 'Warm orange and falling leaves.',
    classList: "bg-[#FFF8F0] border-3 border-orange-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-orange-500 group/card",
    decor: `<>
        <div className="absolute top-3 right-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-leaf-flutter">🍂</div>
        <div className="absolute bottom-3 left-3 text-xs opacity-50 select-none pointer-events-none">🍁</div>
      </>`
  },
  { id: 'ocean_breeze', name: 'Ocean Breeze 🌊', icon: '🌊', desc: 'Soft waves and seashells.',
    classList: "bg-[#F0F8FF] border-3 border-cyan-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-cyan-500 group/card",
    decor: `<>
        <div className="absolute top-2 right-4 text-xs opacity-50 select-none pointer-events-none animate-pulse">🐚</div>
        <div className="absolute bottom-2 left-4 text-xs opacity-40 select-none pointer-events-none">🌊</div>
      </>`
  },
  { id: 'matcha_tea', name: 'Matcha Tea 🍵', icon: '🍵', desc: 'Calming soft green.',
    classList: "bg-[#F5FFFA] border-3 border-emerald-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-emerald-500 group/card",
    decor: `<>
        <div className="absolute top-3 left-3 text-xs opacity-50 select-none pointer-events-none animate-pulse">🍵</div>
        <div className="absolute bottom-3 right-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-leaf-flutter">🍃</div>
      </>`
  },
  { id: 'lavender_dreams', name: 'Lavender Dreams 🪻', icon: '🪻', desc: 'Soft purple and herbs.',
    classList: "bg-[#F8F5FF] border-3 border-purple-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-purple-400 group/card",
    decor: `<>
        <div className="absolute top-2.5 right-2.5 text-xs opacity-50 select-none pointer-events-none animate-pulse">🪻</div>
        <div className="absolute bottom-2.5 left-2.5 text-xs opacity-50 select-none pointer-events-none">✨</div>
      </>`
  },
  { id: 'strawberry_field', name: 'Strawberry Field 🍓', icon: '🍓', desc: 'Red berries and vines.',
    classList: "bg-[#FFF0F2] border-3 border-red-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-red-400 group/card",
    decor: `<>
        <div className="absolute top-3 left-3 text-xs opacity-60 select-none pointer-events-none animate-bounce" style={{animationDuration: '5s'}}>🍓</div>
        <div className="absolute bottom-3 right-4 text-[10px] opacity-40 select-none pointer-events-none">🌿</div>
      </>`
  },
  { id: 'mushroom_glade', name: 'Mushroom Glade 🍄', icon: '🍄', desc: 'Toadstools in a magical forest.',
    classList: "bg-[#FDF6E3] border-3 border-red-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-red-500 group/card",
    decor: `<>
        <div className="absolute bottom-2 left-2 text-xs opacity-60 select-none pointer-events-none">🍄</div>
        <div className="absolute top-2 right-2 text-[10px] opacity-50 select-none pointer-events-none animate-pulse">✨</div>
      </>`
  },
  { id: 'cloud_nine', name: 'Cloud Nine ☁️', icon: '☁️', desc: 'Fluffy white clouds.',
    classList: "bg-[#F0F8FF] border-3 border-blue-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-blue-300 group/card",
    decor: `<>
        <div className="absolute top-2 left-4 text-xs opacity-70 select-none pointer-events-none animate-pulse">☁️</div>
        <div className="absolute bottom-2 right-2 text-xs opacity-50 select-none pointer-events-none">☁️</div>
      </>`
  },
  { id: 'winter_frost', name: 'Winter Frost ❄️', icon: '❄️', desc: 'Ice crystals and snowflakes.',
    classList: "bg-[#F5FBFF] border-3 border-cyan-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-cyan-300 group/card",
    decor: `<>
        <div className="absolute top-2 right-2 text-xs opacity-60 select-none pointer-events-none animate-cozy-star-twinkle">❄️</div>
        <div className="absolute bottom-3 left-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">🧊</div>
      </>`
  },
  { id: 'sunflower_path', name: 'Sunflower Path 🌻', icon: '🌻', desc: 'Bright yellow blooms.',
    classList: "bg-[#FFFFF0] border-3 border-yellow-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-yellow-500 group/card",
    decor: `<>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none animate-cozy-leaf-flutter">🌻</div>
        <div className="absolute bottom-2 right-3 text-xs opacity-50 select-none pointer-events-none">☀️</div>
      </>`
  },
  { id: 'coffee_shop', name: 'Coffee Shop ☕', icon: '☕', desc: 'Warm espresso and pastries.',
    classList: "bg-[#FAF5F0] border-3 border-[#8B4513] rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#A0522D] group/card",
    decor: `<>
        <div className="absolute top-2 right-3 text-xs opacity-60 select-none pointer-events-none animate-pulse">☕</div>
        <div className="absolute bottom-2 left-2 text-xs opacity-40 select-none pointer-events-none">🥐</div>
      </>`
  },
  { id: 'peach_orchard', name: 'Peach Orchard 🍑', icon: '🍑', desc: 'Sweet pastel oranges.',
    classList: "bg-[#FFF5EE] border-3 border-orange-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-orange-400 group/card",
    decor: `<>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none animate-bounce" style={{animationDuration: '6s'}}>🍑</div>
        <div className="absolute bottom-3 right-3 text-xs opacity-50 select-none pointer-events-none">🌸</div>
      </>`
  },
  { id: 'lemon_drop', name: 'Lemon Drop 🍋', icon: '🍋', desc: 'Zesty yellow and fresh vibes.',
    classList: "bg-[#FFFFE0] border-3 border-yellow-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-yellow-400 group/card",
    decor: `<>
        <div className="absolute top-2 right-2 text-xs opacity-60 select-none pointer-events-none">🍋</div>
        <div className="absolute bottom-2 left-2 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>`
  },
  { id: 'rose_garden', name: 'Rose Garden 🌹', icon: '🌹', desc: 'Deep red and thorny stems.',
    classList: "bg-[#FFF0F5] border-3 border-red-500 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-red-600 group/card",
    decor: `<>
        <div className="absolute bottom-2 right-2 text-xs opacity-60 select-none pointer-events-none">🌹</div>
        <div className="absolute top-3 left-3 text-[10px] opacity-50 select-none pointer-events-none animate-pulse">🥀</div>
      </>`
  },
  { id: 'cotton_candy', name: 'Cotton Candy 🍡', icon: '🍡', desc: 'Pink and blue sugar swirls.',
    classList: "bg-[#FDF0F5] border-3 border-pink-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-pink-300 group/card",
    decor: `<>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none">🍡</div>
        <div className="absolute bottom-2 right-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-star-twinkle">🍬</div>
      </>`
  },
  { id: 'bamboo_grove', name: 'Bamboo Grove 🎍', icon: '🎍', desc: 'Tall green stalks.',
    classList: "bg-[#F0FFF0] border-3 border-green-500 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-green-600 group/card",
    decor: `<>
        <div className="absolute bottom-1 right-2 text-xs opacity-60 select-none pointer-events-none">🎍</div>
        <div className="absolute top-2 left-2 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-leaf-flutter">🍃</div>
      </>`
  },
  { id: 'desert_oasis', name: 'Desert Oasis 🌵', icon: '🌵', desc: 'Succulents and warm sand.',
    classList: "bg-[#FFF8DC] border-3 border-green-400 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-green-500 group/card",
    decor: `<>
        <div className="absolute bottom-2 left-2 text-xs opacity-60 select-none pointer-events-none">🌵</div>
        <div className="absolute top-2 right-2 text-[10px] opacity-40 select-none pointer-events-none animate-pulse">☀️</div>
      </>`
  },
  { id: 'crystal_cave', name: 'Crystal Cave 💎', icon: '💎', desc: 'Shining gems and amethyst.',
    classList: "bg-[#F8F8FF] border-3 border-purple-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-purple-300 group/card",
    decor: `<>
        <div className="absolute top-2 left-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-star-twinkle">💎</div>
        <div className="absolute bottom-2 right-2 text-[10px] opacity-50 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>`
  },
  { id: 'pumpkin_patch', name: 'Pumpkin Patch 🎃', icon: '🎃', desc: 'Autumn gourds and vines.',
    classList: "bg-[#FFF5EE] border-3 border-orange-500 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-orange-600 group/card",
    decor: `<>
        <div className="absolute bottom-2 right-2 text-xs opacity-60 select-none pointer-events-none">🎃</div>
        <div className="absolute top-2 left-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-leaf-flutter">🍂</div>
      </>`
  },
  { id: 'fairy_tale', name: 'Fairy Tale 🧚', icon: '🧚', desc: 'Magic wands and sparkles.',
    classList: "bg-[#FFF0F5] border-3 border-pink-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-pink-400 group/card",
    decor: `<>
        <div className="absolute top-2 right-2 text-xs opacity-60 select-none pointer-events-none animate-pulse">🧚</div>
        <div className="absolute bottom-3 left-2 text-[10px] opacity-50 select-none pointer-events-none animate-cozy-star-twinkle">✨</div>
      </>`
  },
  { id: 'mint_chocolate', name: 'Mint Choc 🍫', icon: '🍫', desc: 'Refreshing green and cocoa.',
    classList: "bg-[#F5FFFA] border-3 border-[#6B4423] rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-[#8B4513] group/card",
    decor: `<>
        <div className="absolute bottom-2 right-3 text-xs opacity-60 select-none pointer-events-none">🍫</div>
        <div className="absolute top-2 left-2 text-[10px] opacity-40 select-none pointer-events-none">🌿</div>
      </>`
  },
  { id: 'sakura_night', name: 'Sakura Night 🌸', icon: '🌸', desc: 'Dark pink blossoms under moon.',
    classList: "bg-[#2C1A30] border-3 border-pink-400 text-pink-50/90 rounded-3xl p-6 mb-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-pink-300 group/card",
    decor: `<>
        <div className="absolute top-2 right-3 text-xs opacity-60 select-none pointer-events-none animate-cozy-star-twinkle">🌙</div>
        <div className="absolute bottom-2 left-2 text-[10px] opacity-50 select-none pointer-events-none animate-pulse">🌸</div>
      </>`
  },
  { id: 'daisy_chain', name: 'Daisy Chain 🌼', icon: '🌼', desc: 'White petals and yellow centers.',
    classList: "bg-[#FFFFF0] border-3 border-yellow-200 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-yellow-300 group/card",
    decor: `<>
        <div className="absolute top-2 left-2 text-xs opacity-60 select-none pointer-events-none animate-pulse">🌼</div>
        <div className="absolute bottom-2 right-3 text-[10px] opacity-50 select-none pointer-events-none">🌼</div>
      </>`
  },
  { id: 'berry_basket', name: 'Berry Basket 🫐', icon: '🫐', desc: 'Blueberries and blackberries.',
    classList: "bg-[#F0F8FF] border-3 border-indigo-300 rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-indigo-400 group/card",
    decor: `<>
        <div className="absolute bottom-2 right-2 text-xs opacity-60 select-none pointer-events-none">🫐</div>
        <div className="absolute top-2 left-3 text-[10px] opacity-40 select-none pointer-events-none animate-cozy-leaf-flutter">🍃</div>
      </>`
  }
];

const allStyles = [...styles, ...newThemes];

const arrayStr = `const COZY_CARD_BORDER_STYLES = [
${allStyles.map(s => `  { id: '${s.id}', name: '${s.name}', icon: '${s.icon}', desc: '${s.desc}' },`).join('\n')}
];`;

const mapStr = `const CARD_STYLE_MAP: Record<string, { classList: string, decor: React.ReactNode }> = {
${allStyles.map(s => `  '${s.id}': {
    classList: \`${s.classList}\`,
    decor: ${s.decor}
  },`).join('\n')}
};`;

fs.writeFileSync('generated_styles.ts', arrayStr + '\n\n' + mapStr);
