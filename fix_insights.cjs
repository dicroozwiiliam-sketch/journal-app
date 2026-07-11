const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ 2\. Fetch habits from DB\s+const habitsList = await db\.getHabitsByUserId\(req\.user\.id\);\s+formattedHabits = habitsList\.map\(\(h\) => \(\{\s+name: h\.name,\s+streak: h\.streak,\s+history: JSON\.parse\(h\.history \|\| "\{\}"\),\s+\}\)\);\s+\/\/ 3\. Fetch goals from DB\s+const goalsList = await db\.getGoalsByUserId\(req\.user\.id\);\s+formattedGoals = goalsList\.map\(\(g\) => \(\{\s+title: g\.title,\s+category: g\.category,\s+progress: g\.progress,\s+deadline: g\.deadline,\s+\}\)\);/m;

const replacement = `// Fetch metadata once to save Firebase reads
      const meta = await db.getUserMetadata(req.user.id);
      const habitsList = meta.habits || [];
      const goalsList = meta.goals || [];
      
      formattedHabits = habitsList.map((h) => ({
        name: h.name,
        streak: h.streak,
        history: JSON.parse(h.history || "{}"),
      }));

      formattedGoals = goalsList.map((g) => ({
        title: g.title,
        category: g.category,
        progress: g.progress,
        deadline: g.deadline,
      }));`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
