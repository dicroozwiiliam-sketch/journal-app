const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const cacheLogic = `
  const syncFromDatabase = async () => {
    try {
      const cachedEntries = sessionStorage.getItem('cozy_entries');
      if (cachedEntries) setEntries(JSON.parse(cachedEntries));
      const cachedGoals = sessionStorage.getItem('cozy_goals');
      if (cachedGoals) setGoals(JSON.parse(cachedGoals));
      
      const [entriesRes, goalsRes, habitsRes, badgesRes] = await Promise.all([
        fetch("/api/journals"),
        fetch("/api/goals"),
        fetch("/api/habits"),
        fetch("/api/badges")
      ]);

      if (entriesRes.ok) {
        const dbEntries = await entriesRes.json();
        if (dbEntries && dbEntries.length > 0) {
          setEntries(dbEntries);
          sessionStorage.setItem('cozy_entries', JSON.stringify(dbEntries));
        }
      }
      if (goalsRes.ok) {
        const dbGoals = await goalsRes.json();
        if (dbGoals && dbGoals.length > 0) {
          setGoals(dbGoals);
          sessionStorage.setItem('cozy_goals', JSON.stringify(dbGoals));
        }
      }
`;

code = code.replace(/const syncFromDatabase = async \(\) => \{\n\s*try \{\n\s*const \[entriesRes, goalsRes, habitsRes, badgesRes\] = await Promise\.all\(\[\n\s*fetch\("\/api\/journals"\),\n\s*fetch\("\/api\/goals"\),\n\s*fetch\("\/api\/habits"\),\n\s*fetch\("\/api\/badges"\)\n\s*\]\);\n\n\s*if \(entriesRes\.ok\) \{\n\s*const dbEntries = await entriesRes\.json\(\);\n\s*if \(dbEntries && dbEntries\.length > 0\) \{\n\s*setEntries\(dbEntries\);\n\s*\}\n\s*\}\n\s*if \(goalsRes\.ok\) \{\n\s*const dbGoals = await goalsRes\.json\(\);\n\s*if \(dbGoals && dbGoals\.length > 0\) \{\n\s*setGoals\(dbGoals\);\n\s*\}\n\s*\}/, cacheLogic);

fs.writeFileSync('src/App.tsx', code);
