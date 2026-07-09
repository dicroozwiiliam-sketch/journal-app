import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

const dbPath = path.join(process.cwd(), "data.db");
export const db = new Database(dbPath);

// Create database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TEXT,
    role TEXT DEFAULT 'user',
    subscription_status TEXT DEFAULT 'free',
    stripe_customer_id TEXT,
    lockout_until TEXT,
    failed_attempts INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS journals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    duration INTEGER NOT NULL,
    encrypted_data TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    mood TEXT NOT NULL,
    mood_emoji TEXT NOT NULL,
    topics TEXT NOT NULL,
    tags TEXT NOT NULL,
    emotions TEXT NOT NULL,
    takeaways TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    deadline TEXT NOT NULL,
    actions TEXT NOT NULL, -- JSON string
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    streak INTEGER NOT NULL DEFAULT 0,
    history TEXT NOT NULL, -- JSON string representation
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked INTEGER NOT NULL DEFAULT 0,
    unlocked_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS voice_recordings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Safe migrations to add subscription columns to users table
const columnsToMigrate = [
  { name: "stripe_subscription_id", type: "TEXT" },
  { name: "subscription_plan", type: "TEXT DEFAULT 'free'" },
  { name: "subscription_period_end", type: "TEXT" },
  { name: "subscription_cancel_at_period_end", type: "INTEGER DEFAULT 0" },
  { name: "subscription_trial_end", type: "TEXT" }
];

for (const col of columnsToMigrate) {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
    console.log(`[DB MIGRATION] Added column ${col.name} to users table.`);
  } catch (err: any) {
    // If column already exists, this is expected to fail.
    if (!err.message.includes("duplicate column name")) {
      console.warn(`[DB MIGRATION] Notice for column ${col.name}:`, err.message);
    }
  }
}

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
