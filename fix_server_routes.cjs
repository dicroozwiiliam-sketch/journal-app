const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/await db\.saveGoal\(\{/g, 'await db.saveGoal(req.user!.id, {');
code = code.replace(/await db\.deleteGoal\(req\.params\.id\);/g, 'await db.deleteGoal(req.user!.id, req.params.id);');
code = code.replace(/await db\.saveHabit\(\{/g, 'await db.saveHabit(req.user!.id, {');
code = code.replace(/await db\.deleteHabit\(req\.params\.id\);/g, 'await db.deleteHabit(req.user!.id, req.params.id);');
code = code.replace(/await db\.updateBadge\(/g, 'await db.updateBadge(req.user!.id, ');
code = code.replace(/await db\.saveBadge\(\{/g, 'await db.saveBadge(req.user!.id, {');

// Wait, what if updateBadge had different arguments?
// Previously: updateBadge: async (id: string, updates: any): Promise<void>
// And mappedId was used: const mappedId = `${id}-${req.user!.id}`;
// Let's check how updateBadge is called in server.ts
