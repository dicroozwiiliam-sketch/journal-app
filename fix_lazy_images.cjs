const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/<img /g, '<img loading="lazy" ');
  // To avoid duplicates:
  code = code.replace(/loading="lazy" loading="lazy"/g, 'loading="lazy"');
  fs.writeFileSync(file, code);
}

fixFile('src/components/JournalTimeline.tsx');
fixFile('src/components/FloatingCanvas.tsx');
fixFile('src/components/MoodAnalytics.tsx');
fixFile('src/components/AiCoach.tsx');
fixFile('src/components/ProfilePage.tsx');

