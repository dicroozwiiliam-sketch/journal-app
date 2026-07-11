const fs = require('fs');
const content = fs.readFileSync('src/components/ProfilePage.tsx', 'utf8');

const newStyles = fs.readFileSync('generated_styles.ts', 'utf8');

let newContent = content.replace(
  /const COZY_CARD_BORDER_STYLES = \[[\s\S]*?\];/,
  newStyles
);

newContent = newContent.replace(
  /let cardClassList = "bg-cozy-card border-3 border-cozy-text-dark rounded-3xl p-6 mb-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-900 group\/card";[\s\S]*?\} else if \(currentCardStyle === 'rainbow'\) \{[\s\S]*?\}\s*\n/,
  `let cardClassList = CARD_STYLE_MAP[currentCardStyle]?.classList || CARD_STYLE_MAP['standard'].classList;
  let cardDecor = CARD_STYLE_MAP[currentCardStyle]?.decor || CARD_STYLE_MAP['standard'].decor;
  `
);

fs.writeFileSync('src/components/ProfilePage.tsx', newContent);
