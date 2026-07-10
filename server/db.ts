import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
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
      const q = query(collection(firestore, "users"), where("email", "==", email));
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
      const q = query(collection(firestore, "users"), where("verification_token", "==", token));
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
      const q = query(collection(firestore, "users"), where("reset_token", "==", token));
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
      const q = query(collection(firestore, "users"), where("stripe_customer_id", "==", customerId));
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
      for (const d of querySnap.docs) {
        await deleteDoc(doc(firestore, "sessions", d.id));
      }
    } catch (err) {
      console.error("Firestore error in deleteSessionsByUserId:", err);
      throw err;
    }
  },

  // --- JOURNALS Operations ---
  getJournalsByUserId: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestore, "journals"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      const list = querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  // --- GOALS Operations ---
  getGoalsByUserId: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestore, "goals"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      return querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("Firestore error in getGoalsByUserId:", err);
      throw err;
    }
  },

  saveGoal: async (goal: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "goals", goal.id), goal, { merge: true });
    } catch (err) {
      console.error("Firestore error in saveGoal:", err);
      throw err;
    }
  },

  deleteGoal: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, "goals", id));
    } catch (err) {
      console.error("Firestore error in deleteGoal:", err);
      throw err;
    }
  },

  // --- HABITS Operations ---
  getHabitsByUserId: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestore, "habits"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      return querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("Firestore error in getHabitsByUserId:", err);
      throw err;
    }
  },

  saveHabit: async (habit: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "habits", habit.id), habit, { merge: true });
    } catch (err) {
      console.error("Firestore error in saveHabit:", err);
      throw err;
    }
  },

  deleteHabit: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(firestore, "habits", id));
    } catch (err) {
      console.error("Firestore error in deleteHabit:", err);
      throw err;
    }
  },

  // --- BADGES Operations ---
  getBadgesByUserId: async (userId: string): Promise<any[]> => {
    try {
      const q = query(collection(firestore, "badges"), where("user_id", "==", userId));
      const querySnap = await getDocs(q);
      return querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error("Firestore error in getBadgesByUserId:", err);
      throw err;
    }
  },

  saveBadge: async (badge: any): Promise<void> => {
    try {
      await setDoc(doc(firestore, "badges", badge.id), badge, { merge: true });
    } catch (err) {
      console.error("Firestore error in saveBadge:", err);
      throw err;
    }
  },

  updateBadge: async (id: string, updates: any): Promise<void> => {
    try {
      await updateDoc(doc(firestore, "badges", id), updates);
    } catch (err) {
      console.error("Firestore error in updateBadge:", err);
      throw err;
    }
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
