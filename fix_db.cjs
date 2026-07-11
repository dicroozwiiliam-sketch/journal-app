const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');
code = code.replace(/import \{ initializeApp \} from "firebase\/app";[\s\S]*?import \{ getFirestore[\s\S]*?\} from "firebase\/firestore";/, `import * as admin from 'firebase-admin';`);

// Instead of using complex regex to rewrite every firestore call, I'll just write a script to rewrite it cleanly.
