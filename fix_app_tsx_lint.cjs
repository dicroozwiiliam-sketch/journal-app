const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement was: 
// const \[entriesRes, goalsRes, habitsRes, badgesRes\] = await Promise\.all\(\[...
// until try { sessionStorage.setItem('cozy_badges', JSON.stringify(dbBadges)); } catch (e) {}

// However, my regex was:
// /const \[entriesRes, goalsRes, habitsRes, badgesRes\] = await Promise\.all\(\[[\s\S]*?if \(badgesRes\.ok\) \{[\s\S]*?try \{ sessionStorage\.setItem\('cozy_badges', JSON\.stringify\(dbBadges\)\); \} catch \(e\) \{\}\n\s*\}\n\s*\}/
// Which apparently stopped too early or there were duplicate blocks?

const toDelete = `
      if (habitsRes.ok) {
        const dbHabits = await habitsRes.json();
        if (dbHabits && dbHabits.length > 0) {
          setHabits(dbHabits);
        }
      }
      if (badgesRes.ok) {
        const dbBadges = await badgesRes.json();
        if (dbBadges && dbBadges.length > 0) {
          setBadges(dbBadges);
        }
      }
`;
code = code.replace(toDelete.trim(), "");
fs.writeFileSync('src/App.tsx', code);
