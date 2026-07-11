const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const metadataEndpoint = `
// GET Unified Metadata (Goals, Habits, Badges)
app.get("/api/metadata", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const meta = await db.getUserMetadata(req.user!.id);
    
    // format goals
    const formattedGoals = (meta.goals || []).map((g: any) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      progress: g.progress,
      deadline: g.deadline,
      actions: g.actions ? JSON.parse(g.actions) : [],
    }));

    // format habits
    const formattedHabits = (meta.habits || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      frequency: h.frequency,
      timeOfDay: h.timeOfDay,
      streak: h.streak,
    }));

    // format badges
    const formattedBadges = (meta.badges || []).map((b: any) => ({
      id: b.id.split("-")[0],
      title: b.title,
      description: b.description,
      icon: b.icon,
      unlocked: b.unlocked === 1,
      unlockedAt: b.unlocked_at,
    }));

    return res.json({ goals: formattedGoals, habits: formattedHabits, badges: formattedBadges });
  } catch (err) {
    next(err);
  }
});
`;

code = code.replace(/\/\/ GET goals/g, metadataEndpoint + '\n// GET goals');
fs.writeFileSync('server.ts', code);
