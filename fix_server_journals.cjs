const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
app.get("/api/journals", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const entries = await db.getJournalsByUserId(req.user!.id, limit);
`;

code = code.replace(/app\.get\("\/api\/journals", authenticateSession, async \(req: SecureRequest, res, next\) => \{\n\s*try \{\n\s*const entries = await db\.getJournalsByUserId\(req\.user!\.id\);/, replacement);

fs.writeFileSync('server.ts', code);
