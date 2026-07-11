const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(\!admin\.apps\.length\) \{/, '// @ts-ignore\n      if (!admin.apps.length) {');
code = code.replace(/admin\.initializeApp\(\{/, '// @ts-ignore\n         admin.initializeApp({');
code = code.replace(/decodedToken = await admin\.auth\(\)\.verifyIdToken\(idToken\);/, '// @ts-ignore\n      decodedToken = await admin.auth().verifyIdToken(idToken);');

fs.writeFileSync('server.ts', code);
