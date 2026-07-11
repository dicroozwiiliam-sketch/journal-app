const fs = require('fs');
let code = fs.readFileSync('src/components/AiCoach.tsx', 'utf8');

if (!code.includes("useDeferredValue")) {
    code = code.replace(/import React, \{ useState, useEffect, useMemo \} from 'react';/, "import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';");
    code = code.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);/, "const [searchTerm, setSearchTerm] = useState('');\n  const deferredSearchTerm = useDeferredValue(searchTerm);");
    code = code.replace(/p\.title\?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)/g, 'p.title?.toLowerCase().includes(deferredSearchTerm.toLowerCase())');
    code = code.replace(/p\.description\?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)/g, 'p.description?.toLowerCase().includes(deferredSearchTerm.toLowerCase())');
    code = code.replace(/p\.category\?\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)/g, 'p.category?.toLowerCase().includes(deferredSearchTerm.toLowerCase())');
    code = code.replace(/t\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)/g, 't.toLowerCase().includes(deferredSearchTerm.toLowerCase())');
    code = code.replace(/\[allPlans, searchTerm\]/, '[allPlans, deferredSearchTerm]');
    
    fs.writeFileSync('src/components/AiCoach.tsx', code);
}
