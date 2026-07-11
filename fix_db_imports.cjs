const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

code = code.replace(/getDocs \} from "firebase\/firestore";/, 'getDocs, orderBy, limit } from "firebase/firestore";');
code = code.replace(/const \{ orderBy, limit \} = require\("firebase\/firestore"\);\n\s*/, '');

fs.writeFileSync('server/db.ts', code);
