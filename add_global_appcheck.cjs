const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('app.use("/api", enforceAppCheck);')) {
   code = code.replace('const app = express();', 'const app = express();\n\napp.use("/api", enforceAppCheck);\n');
   fs.writeFileSync('server.ts', code);
}
