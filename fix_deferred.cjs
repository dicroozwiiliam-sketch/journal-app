const fs = require('fs');
let code = fs.readFileSync('src/components/JournalTimeline.tsx', 'utf8');

if (!code.includes("useDeferredValue")) {
    code = code.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, "import React, { useState, useEffect, useRef, useDeferredValue } from 'react';");
    code = code.replace(/const \[searchQuery, setSearchQuery\] = useState\(''\);/, "const [searchQuery, setSearchQuery] = useState('');\n  const deferredSearchQuery = useDeferredValue(searchQuery);");
    code = code.replace(/entry\.transcript\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)/g, 'entry.transcript.toLowerCase().includes(deferredSearchQuery.toLowerCase())');
    code = code.replace(/entry\.summary\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)/g, 'entry.summary.toLowerCase().includes(deferredSearchQuery.toLowerCase())');
    code = code.replace(/entry\.mood\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)/g, 'entry.mood.toLowerCase().includes(deferredSearchQuery.toLowerCase())');
    code = code.replace(/t\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)/g, 't.toLowerCase().includes(deferredSearchQuery.toLowerCase())');
    code = code.replace(/\[entries, searchQuery, filterType\]/, '[entries, deferredSearchQuery, filterType]');
    
    fs.writeFileSync('src/components/JournalTimeline.tsx', code);
}
