const fs = require('fs');

// Fix JournalTimeline.tsx
let jlCode = fs.readFileSync('src/components/JournalTimeline.tsx', 'utf8');
jlCode = jlCode.replace(/  \/\/ Infinite scroll\n  useEffect\(\(\) => \{\n    const handleScroll = \(\) => \{\n      if \(window\.innerHeight \+ window\.scrollY >= document\.body\.offsetHeight - 500\) \{\n        setVisibleCount\(prev => Math\.min\(prev \+ 10, filteredEntries\.length\)\);\n      \}\n    \};\n    window\.addEventListener\('scroll', handleScroll\);\n    return \(\) => window\.removeEventListener\('scroll', handleScroll\);\n  \}, \[filteredEntries\.length\]\);\n/, "");
// Put it after filteredEntries declaration
jlCode = jlCode.replace(/(  const filteredEntries = useMemo\(\(\) => entries\.filter\(entry => \{[\s\S]*?    return true;\n  \}\), \[entries, deferredSearchQuery, filterType\]\);)/, "$1\n\n  // Infinite scroll\n  useEffect(() => {\n    const handleScroll = () => {\n      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {\n        setVisibleCount(prev => Math.min(prev + 10, filteredEntries.length));\n      }\n    };\n    window.addEventListener('scroll', handleScroll);\n    return () => window.removeEventListener('scroll', handleScroll);\n  }, [filteredEntries.length]);\n");
fs.writeFileSync('src/components/JournalTimeline.tsx', jlCode);

// Fix MoodAnalytics.tsx
let maCode = fs.readFileSync('src/components/MoodAnalytics.tsx', 'utf8');
if (!maCode.includes("useMemo")) {
    maCode = maCode.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';");
}
fs.writeFileSync('src/components/MoodAnalytics.tsx', maCode);

