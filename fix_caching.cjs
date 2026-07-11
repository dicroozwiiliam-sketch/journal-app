const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add Cache-Control for GET /api/journals and GET /api/metadata
const metadataCache = `
// GET Unified Metadata (Goals, Habits, Badges)
app.get("/api/metadata", authenticateSession, async (req: SecureRequest, res, next) => {
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
`;
code = code.replace(/\/\/ GET Unified Metadata \(Goals, Habits, Badges\)[\s\S]*?try \{/, metadataCache + "  try {");

// Wait, we don't want to use standard caching because data changes and we need immediate consistency.
// But we can use Cache-Control private to ensure proxies don't cache it, but let the browser manage it?
// The user already has frontend sessionStorage caching. Server caching might just complicate things (e.g. stale data on another device).
// So frontend caching is sufficient for the requirement "Optimize: Caching".
