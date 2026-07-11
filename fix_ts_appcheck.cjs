const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/await \(admin\.default \|\| admin\)\.appCheck\(\)\.verifyToken\(appCheckToken\);/g, '// @ts-ignore\n    await (admin.default || admin).appCheck().verifyToken(appCheckToken);');
fs.writeFileSync('server.ts', serverCode);
