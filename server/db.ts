import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit, writeBatch, runTransaction } from "firebase/firestore";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Load Firebase configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Initialize Firebase App and Firestore
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Encryption support for Journals
const ENCRYPTION_ALGORITHM = "aes-256-gcm";

// Generate or derive a secure 256-bit encryption key
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "cozy-daynest-journal-secret-salt-key-256";
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
    // Hex key provided
    return Buffer.from(secret, "hex");
  }
  // Otherwise, derive a 32-byte key via SHA-256 of the secret
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive content using AES-256-GCM
 */
export function encryptData(text: string): { ciphertext: string; iv: string; authTag: string } {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let ciphertext = cipher.update(text, "utf8", "hex");
    ciphertext += cipher.final("hex");
    
    const authTag = cipher.getAuthTag().toString("hex");
    
    return {
      ciphertext,
      iv: iv.toString("hex"),
      authTag,
    };
  } catch (error) {
    console.error("Encryption failure:", error);
    throw new Error("Failed to securely encrypt journal data.");
  }
}

/**
 * Decrypt content using AES-256-GCM
 */
export function decryptData(ciphertext: string, iv: string, authTag: string): string {
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, "hex")
    );
    
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption failure:", error);
    throw new Error("Failed to securely decrypt journal data.");
  }
}

// Database Firestore Adapter Object
export const db = {
  // --- USERS Operations ---
  getUserById: async (id: string): Promise<any | null> => {
    try {
      const docRef = doc(firestore, "users", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() };
    } catch (err) {
      console.error("Firestore error in getUserById:", err);
      throw err;
    }
  },

  getUserByEmail: async (email: string): Promise<any | null> => {
    try {
      const q = query(collection(firestore, "users"), where("email", "==", email), limit(1));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      const firstDoc = querySnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() };
    } catch (err) {
      console.error("Firestore error in getUserByEmail:", err);
      throw err;
    }
  },

  getUserByVerificationToken: async (token: string): Promise<any | null> => {
    try {
      const q = query(collection(firestore, "users"), where("verification_token", "==", token), limit(1));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      const firstDoc = querySnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() };
    } catch (err) {
      console.error("Firestore error in getUserByVerificationToken:", err);
      throw err;
    }
  },

  getUserByResetToken: async (token: string): Promise<any | null> => {
    try {
      const q = query(collection(firestore, "users"), where("reset_token", "==", token), limit(1));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      const firstDoc = querySnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() };
    } catch (err) {
      console.error("Firestore error in getUserByResetToken:", err);
      throw err;
    }
  },

  getUserByStripeCustomerId: async (customerId: string): Promise<any | null> => {
    try {
      const q = query(collection(firestore, "users"), where("stripe_customer_id", "==", customerId), limit(1));
      const querySnap = await getDocs(q);
      if (querySnap.empty) return null;
      const firstDoc = querySnap.docs[0];
      return { id: firstDoc.id, ...firstDoc.data() };
    } catch (err) {
      console.error("Firestore error in getUserByStripeCustomerId:", err);
      throw err;
    }
  },

  createUser: async (id: string, userData: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "users", id), userData);
    } catch (err) {
      console.error("Firestore error in createUser:", err);
      throw err;
    }
  },

  updateUser: async (id: string, updates: any): Promise<void> => {
    try {
      const cleanUpdates = { ...updates };
      delete cleanUpdates.id; // avoid redundant id field in document body
      await updateDoc(doc(firestore, "users", id), cleanUpdates);
    } catch (err) {
      console.error("Firestore error in updateUser:", err);
      throw err;
    }
  },

  // --- SESSIONS Operations ---
  getSession: async (id: string, userId: string): Promise<any | null> => {
    try {
      const docSnap = await getDoc(doc(firestore, "sessions", id));
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      if (data.user_id !== userId) return null;
      return { id: docSnap.id, ...data };
    } catch (err) {
      console.error("Firestore error in getSession:", err);
      throw err;
    }
  },

  getSessionsByUserId: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestore, "sessions"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      return querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("Firestore error in getSessionsByUserId:", err);
      throw err;
    }
  },

  createSession: async (session: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "sessions", session.id), session);
    } catch (err) {
      console.error("Firestore error in createSession:", err);
      throw err;
    }
  },

  deleteSession: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, "sessions", id));
    } catch (err) {
      console.error("Firestore error in deleteSession:", err);
      throw err;
    }
  },

  
  deleteSessionsByUserId: async (userId: string): Promise<void> => {
    try {
      const q = query(collection(firestore, "sessions"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const batch = writeBatch(firestore);
        for (const d of querySnap.docs) {
          batch.delete(doc(firestore, "sessions", d.id));
        }
        await batch.commit();
      }
    } catch (err) {

      console.error("Firestore error in deleteSessionsByUserId:", err);
      throw err;
    }
  },

  // --- JOURNALS Operations ---
  
  getJournalsByUserId: async (userId: string, limitCount: number = 100): Promise<any[]> => {
    try {
      // Create a query against the collection. 
      // Ordered by date descending. An index might be required on (user_id, date DESC).
      // If the index doesn't exist, this will throw an error with a link to create it.
      const q = query(
        collection(firestore, "journals"), 
        where("user_id", "==", userId),
        orderBy("date", "desc"),
        limit(limitCount)
      );
      const querySnap = await getDocs(q);
      const list = querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list;
    } catch (err) {

      console.error("Firestore error in getJournalsByUserId:", err);
      throw err;
    }
  },

  getJournalById: async (id: string): Promise<any | null> => {
    try {
      const docSnap = await getDoc(doc(firestore, "journals", id));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() };
    } catch (err) {
      console.error("Firestore error in getJournalById:", err);
      throw err;
    }
  },

  createJournal: async (journal: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "journals", journal.id), journal);
    } catch (err) {
      console.error("Firestore error in createJournal:", err);
      throw err;
    }
  },

  updateJournal: async (id: string, updates: any): Promise<void> => {
    try {
      const docRef = doc(firestore, "journals", id);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("Firestore error in updateJournal:", err);
      throw err;
    }
  },

  deleteJournal: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, "journals", id));
    } catch (err) {
      console.error("Firestore error in deleteJournal:", err);
      throw err;
    }
  },

  
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
    const meta = await db.getUserMetadata(userId);
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
    const meta = await db.getUserMetadata(userId);
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
    const meta = await db.getUserMetadata(userId);
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

  // --- VOICE RECORDINGS Operations ---

  getRecordingById: async (id: string): Promise<any | null> => {
    try {
      const docSnap = await getDoc(doc(firestore, "voice_recordings", id));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() };
    } catch (err) {
      console.error("Firestore error in getRecordingById:", err);
      throw err;
    }
  },

  createRecording: async (recording: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "voice_recordings", recording.id), recording);
    } catch (err) {
      console.error("Firestore error in createRecording:", err);
      throw err;
    }
  }
};
