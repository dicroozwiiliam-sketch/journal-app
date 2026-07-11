const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const appCheckMiddleware = `
// Firebase App Check Middleware
export const enforceAppCheck = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');
  if (!appCheckToken) {
    if (process.env.NODE_ENV !== 'production') {
       return next(); // bypass in dev if missing
    }
    res.status(401).json({ error: "Unauthorized: Missing App Check token." });
    return;
  }
  try {
    const admin = await import("firebase-admin");
    await admin.appCheck().verifyToken(appCheckToken);
    next();
  } catch (err) {
    console.error("App Check verification failed", err);
    res.status(401).json({ error: "Unauthorized: Invalid App Check token." });
  }
};
`;

code = code.replace('const app = express();', appCheckMiddleware + '\nconst app = express();');

// Also apply it to all API routes
code = code.replace(/app\.use\("\/api", /g, 'app.use("/api", enforceAppCheck, ');

fs.writeFileSync('server.ts', code);
