const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(/await admin\.appCheck\(\)\.verifyToken/g, 'await (admin.default || admin).appCheck().verifyToken');
fs.writeFileSync('server.ts', serverCode);

let mainCode = fs.readFileSync('src/main.tsx', 'utf8');
mainCode = mainCode.replace(/appCheckToken = tokenResult\.token;/g, 'appCheckToken = (tokenResult as any).token;');
fs.writeFileSync('src/main.tsx', mainCode);
