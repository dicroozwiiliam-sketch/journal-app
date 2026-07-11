const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes("import * as admin")) {
  code = code.replace('import crypto from "crypto";', 'import crypto from "crypto";\nimport * as admin from "firebase-admin";');
}

const newLogic = `
    const { idToken, name, email } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Missing required Google auth payload." });
    }

    let decodedToken;
    try {
      if (!admin.apps.length) {
         const configPath = require("path").join(process.cwd(), "firebase-applet-config.json");
         const firebaseConfig = JSON.parse(require("fs").readFileSync(configPath, "utf-8"));
         admin.initializeApp({ projectId: firebaseConfig.projectId });
      }
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      console.error("Token verification failed", e);
      return res.status(401).json({ error: "Unauthorized." });
    }

    const googleUid = decodedToken.uid;
    const sanitizedEmail = (decodedToken.email || email || "").toLowerCase().trim();
`;

code = code.replace(/const \{ idToken, name, email \} = req\.body;[\s\S]*?const sanitizedEmail = \(decodedToken\.email \|\| email \|\| ""\)\.toLowerCase\(\)\.trim\(\);/, newLogic);

fs.writeFileSync('server.ts', code);
