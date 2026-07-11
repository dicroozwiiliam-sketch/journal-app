const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const replacement = `
  // --- METADATA Operations (Goals, Habits, Badges) ---
  getUserMetadata: async (userId: string): Promise<any> => {
    try {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }

      // Migration: fetch from old collections
      const batch = writeBatch(firestore);
      const goalsSnap = await getDocs(query(collection(firestore, "goals"), where("user_id", "==", userId)));
      const habitsSnap = await getDocs(query(collection(firestore, "habits"), where("user_id", "==", userId)));
      const badgesSnap = await getDocs(query(collection(firestore, "badges"), where("user_id", "==", userId)));

      const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const habits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const badges = badgesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const metadata = { goals, habits, badges };
      batch.set(docRef, metadata);
      
      goalsSnap.docs.forEach(d => batch.delete(d.ref));
      habitsSnap.docs.forEach(d => batch.delete(d.ref));
      badgesSnap.docs.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      return metadata;
    } catch (err) {
      console.error("Firestore error in getUserMetadata:", err);
      throw err;
    }
  },

  getGoalsByUserId: async (userId: string): Promise<any[]> => {
    const meta = await module.exports.getUserMetadata(userId);
    return meta.goals || [];
  },
  saveGoal: async (userId: string, goal: any): Promise<void> => {
    await runTransaction(firestore, async (transaction) => {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await transaction.get(docRef);
      const data = docSnap.exists() ? docSnap.data() : { goals: [], habits: [], badges: [] };
      const goals = data.goals || [];
      const idx = goals.findIndex((g: any) => g.id === goal.id);
      if (idx >= 0) goals[idx] = { ...goals[idx], ...goal };
      else goals.push(goal);
      transaction.set(docRef, { ...data, goals });
    });
  },
  deleteGoal: async (userId: string, id: string): Promise<void> => {
    await runTransaction(firestore, async (transaction) => {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (!data.goals) return;
      transaction.update(docRef, { goals: data.goals.filter((g: any) => g.id !== id) });
    });
  },

  getHabitsByUserId: async (userId: string): Promise<any[]> => {
    const meta = await module.exports.getUserMetadata(userId);
    return meta.habits || [];
  },
  saveHabit: async (userId: string, habit: any): Promise<void> => {
    await runTransaction(firestore, async (transaction) => {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await transaction.get(docRef);
      const data = docSnap.exists() ? docSnap.data() : { goals: [], habits: [], badges: [] };
      const habits = data.habits || [];
      const idx = habits.findIndex((h: any) => h.id === habit.id);
      if (idx >= 0) habits[idx] = { ...habits[idx], ...habit };
      else habits.push(habit);
      transaction.set(docRef, { ...data, habits });
    });
  },
  deleteHabit: async (userId: string, id: string): Promise<void> => {
    await runTransaction(firestore, async (transaction) => {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      if (!data.habits) return;
      transaction.update(docRef, { habits: data.habits.filter((h: any) => h.id !== id) });
    });
  },

  getBadgesByUserId: async (userId: string): Promise<any[]> => {
    const meta = await module.exports.getUserMetadata(userId);
    return meta.badges || [];
  },
  saveBadge: async (userId: string, badge: any): Promise<void> => {
    await runTransaction(firestore, async (transaction) => {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await transaction.get(docRef);
      const data = docSnap.exists() ? docSnap.data() : { goals: [], habits: [], badges: [] };
      const badges = data.badges || [];
      const idx = badges.findIndex((b: any) => b.id === badge.id);
      if (idx >= 0) badges[idx] = { ...badges[idx], ...badge };
      else badges.push(badge);
      transaction.set(docRef, { ...data, badges });
    });
  },
  updateBadge: async (userId: string, id: string, updates: any): Promise<void> => {
    await runTransaction(firestore, async (transaction) => {
      const docRef = doc(firestore, "user_metadata", userId);
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const badges = data.badges || [];
      const idx = badges.findIndex((b: any) => b.id === id);
      if (idx >= 0) {
        badges[idx] = { ...badges[idx], ...updates };
        transaction.update(docRef, { badges });
      }
    });
  },
`;

code = code.replace(/\/\/ --- GOALS Operations ---[\s\S]*?\/\/ --- VOICE RECORDINGS Operations ---/, replacement + "\n  // --- VOICE RECORDINGS Operations ---\n");

// wait, module.exports is not right for ES modules.
// server/db.ts exports `export const db = { ... }` or similar? Let's check how it exports functions.
