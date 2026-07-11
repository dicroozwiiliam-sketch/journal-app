const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
      const [entriesRes, metadataRes] = await Promise.all([
        fetch("/api/journals"),
        fetch("/api/metadata")
      ]);

      if (entriesRes.ok) {
        const dbEntries = await entriesRes.json();
        if (dbEntries && dbEntries.length > 0) {
          setEntries(dbEntries);
          try { sessionStorage.setItem('cozy_entries', JSON.stringify(dbEntries)); } catch (e) {}
        }
      }
      
      if (metadataRes.ok) {
        const dbMeta = await metadataRes.json();
        
        if (dbMeta.goals && dbMeta.goals.length > 0) {
          setGoals(dbMeta.goals);
          try { sessionStorage.setItem('cozy_goals', JSON.stringify(dbMeta.goals)); } catch (e) {}
        }
        if (dbMeta.habits && dbMeta.habits.length > 0) {
          setHabits(dbMeta.habits);
          try { sessionStorage.setItem('cozy_habits', JSON.stringify(dbMeta.habits)); } catch (e) {}
        }
        if (dbMeta.badges && dbMeta.badges.length > 0) {
          setBadges(dbMeta.badges);
          try { sessionStorage.setItem('cozy_badges', JSON.stringify(dbMeta.badges)); } catch (e) {}
        }
      }
`;

code = code.replace(/const \[entriesRes, goalsRes, habitsRes, badgesRes\] = await Promise\.all\(\[[\s\S]*?if \(badgesRes\.ok\) \{[\s\S]*?try \{ sessionStorage\.setItem\('cozy_badges', JSON\.stringify\(dbBadges\)\); \} catch \(e\) \{\}\n\s*\}\n\s*\}/, replacement.trim());

fs.writeFileSync('src/App.tsx', code);
