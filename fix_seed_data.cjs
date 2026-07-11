const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const identifySecureSession = async \(\) => \{\n\s*try \{/, 
  'const identifySecureSession = async () => {\n    try {\n      setEntries([]);\n      setGoals([]);\n      setHabits([]);\n      setBadges([]);'
);

fs.writeFileSync('src/App.tsx', code);
