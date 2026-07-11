const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const goalsGetRegex = /app\.get\("\/api\/goals", authenticateSession, async \(req: SecureRequest, res, next\) => \{[\s\S]*?\}\);/;
code = code.replace(goalsGetRegex, '');

const habitsGetRegex = /app\.get\("\/api\/habits", authenticateSession, async \(req: SecureRequest, res, next\) => \{[\s\S]*?\}\);/;
code = code.replace(habitsGetRegex, '');

const badgesGetRegex = /app\.get\("\/api\/badges", authenticateSession, async \(req: SecureRequest, res, next\) => \{[\s\S]*?\}\);/;
code = code.replace(badgesGetRegex, '');

fs.writeFileSync('server.ts', code);
