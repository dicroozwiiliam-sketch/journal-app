const fs = require('fs');
let code = fs.readFileSync('server/security.ts', 'utf8');

if (!code.includes("sessionCache")) {
    const cacheLogic = `
const sessionCache = new Map<string, { data: any; expiry: number }>();
const userCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

async function getCachedSession(sessionId: string, userId: string) {
  const cached = sessionCache.get(sessionId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  const session = await db.getSession(sessionId, userId);
  if (session) {
    sessionCache.set(sessionId, { data: session, expiry: Date.now() + CACHE_TTL });
  }
  return session;
}

async function getCachedUser(userId: string) {
  const cached = userCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  const user = await db.getUserById(userId);
  if (user) {
    userCache.set(userId, { data: user, expiry: Date.now() + CACHE_TTL });
  }
  return user;
}
`;
    code = code.replace(/export async function authenticateSession/, cacheLogic + "\nexport async function authenticateSession");
    code = code.replace(/await db\.getSession\(sessionId, userId\)/g, "await getCachedSession(sessionId, userId)");
    code = code.replace(/await db\.getUserById\(userId\)/g, "await getCachedUser(userId)");
    
    fs.writeFileSync('server/security.ts', code);
}
