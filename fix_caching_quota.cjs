const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/sessionStorage\.setItem\('cozy_entries', JSON\.stringify\(dbEntries\)\);/, "try { sessionStorage.setItem('cozy_entries', JSON.stringify(dbEntries)); } catch (e) { console.warn('Cache quota exceeded'); }");
code = code.replace(/sessionStorage\.setItem\('cozy_goals', JSON\.stringify\(dbGoals\)\);/, "try { sessionStorage.setItem('cozy_goals', JSON.stringify(dbGoals)); } catch (e) { console.warn('Cache quota exceeded'); }");

fs.writeFileSync('src/App.tsx', code);
