const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingCanvas.tsx', 'utf8');

code = code.replace(/  useEffect\(\(\) => \{\n\s*const handleGlobalMove = \(e: MouseEvent \| TouchEvent\) => \{/m, '  useEffect(() => {\n    let rafId: number | null = null;\n    let isDragging = false;\n    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {');

fs.writeFileSync('src/components/FloatingCanvas.tsx', code);
