const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix saveGoal
code = code.replace(/await db\.saveGoal\(\{/g, 'await db.saveGoal(req.user!.id, {');

// Fix deleteGoal
code = code.replace(/await db\.deleteGoal\(req\.params\.id\);/g, 'await db.deleteGoal(req.user!.id, req.params.id);');

// Fix saveHabit
code = code.replace(/await db\.saveHabit\(\{/g, 'await db.saveHabit(req.user!.id, {');

// Fix deleteHabit
code = code.replace(/await db\.deleteHabit\(req\.params\.id\);/g, 'await db.deleteHabit(req.user!.id, req.params.id);');

// Fix saveBadge - wait, saveBadge is called with userId available directly in signup
code = code.replace(/await db\.saveBadge\(\{/g, 'await db.saveBadge(userId, {');

// Fix updateBadge
code = code.replace(/await db\.updateBadge\(mappedId, \{/g, 'await db.updateBadge(req.user!.id, mappedId, {');

fs.writeFileSync('server.ts', code);
