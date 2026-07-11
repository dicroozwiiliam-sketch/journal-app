const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
      const cachedHabits = sessionStorage.getItem('cozy_habits');
      if (cachedHabits) setHabits(JSON.parse(cachedHabits));
      const cachedBadges = sessionStorage.getItem('cozy_badges');
      if (cachedBadges) setBadges(JSON.parse(cachedBadges));

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
          try { sessionStorage.setItem('cozy_entries', JSON.stringify(dbEntries)); } catch (e) {}
        }
      }
      if (goalsRes.ok) {
        const dbGoals = await goalsRes.json();
        if (dbGoals && dbGoals.length > 0) {
          setGoals(dbGoals);
          try { sessionStorage.setItem('cozy_goals', JSON.stringify(dbGoals)); } catch (e) {}
        }
      }
      if (habitsRes.ok) {
        const dbHabits = await habitsRes.json();
        if (dbHabits && dbHabits.length > 0) {
          setHabits(dbHabits);
          try { sessionStorage.setItem('cozy_habits', JSON.stringify(dbHabits)); } catch (e) {}
        }
      }
      if (badgesRes.ok) {
        const dbBadges = await badgesRes.json();
        if (dbBadges && dbBadges.length > 0) {
          setBadges(dbBadges);
          try { sessionStorage.setItem('cozy_badges', JSON.stringify(dbBadges)); } catch (e) {}
        }
      }
`;

// we need to replace the caching block we did earlier with the new one
code = code.replace(/const \[entriesRes, goalsRes, habitsRes, badgesRes\] = await Promise\.all\(\[[\s\S]*?if \(goalsRes\.ok\) \{[\s\S]*?try \{ sessionStorage\.setItem\('cozy_goals', JSON\.stringify\(dbGoals\)\); \} catch \(e\) \{ console\.warn\('Cache quota exceeded'\); \}\n\s*\}\n\s*\}/, replacement.trim());

fs.writeFileSync('src/App.tsx', code);
