const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const limit = parseInt\(req\.query\.limit as string\) \|\| 100;/, 'const limit = parseInt(req.query.limit as string) || 30;');

fs.writeFileSync('server.ts', code);
