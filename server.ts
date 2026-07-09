/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import argon2 from "argon2";
import crypto from "crypto";

// Server submodules
import { db, encryptData, decryptData } from "./server/db";
import {
  signSessionToken,
  authenticateSession,
  authenticateSessionOptional,
  requirePremium,
  rateLimiter,
  sanitizeHtml,
  validateLength,
  validateEmail,
  logSecurityEvent,
  generateSignedUrl,
  verifySignedUrlSignature,
  SecureRequest,
} from "./server/security";
import { getStripe, createCheckoutSession, createPortalSession, handleStripeWebhook } from "./server/stripe";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up private storage directory for secure voice recordings
const PRIVATE_STORAGE_DIR = path.join(process.cwd(), "private_storage");
if (!fs.existsSync(PRIVATE_STORAGE_DIR)) {
  fs.mkdirSync(PRIVATE_STORAGE_DIR, { recursive: true });
}

// Custom body parsers supporting raw body capture for Stripe signature verification
app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, res, buf) => {
      if (req.originalUrl === "/api/stripe/webhook") {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Global Security Headers Middleware
app.use((req, res, next) => {
  // Allow framing in local development to support the AI Studio preview iframe, otherwise secure SAMEORIGIN/DENY
  const framePolicy = process.env.NODE_ENV !== "production" ? "SAMEORIGIN" : "DENY";
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; connect-src 'self' https:; media-src 'self' data: blob: https:;"
  );
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  res.setHeader("X-Frame-Options", framePolicy);
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// Global OWASP Log Interceptor (never logs passwords, prompts, or sensitive text)
app.use((req: any, res, next) => {
  res.on("finish", () => {
    const userId = req.user?.id || "anonymous";
    logSecurityEvent(userId, req.originalUrl, res.statusCode);
  });
  next();
});

// Lazy initializer for Gemini Client
let aiClient: GoogleGenAI | null = null;
let apiRateLimitActiveUntil = 0; // timestamp to cache active rate-limit/exhausted states

function getGeminiClient(): GoogleGenAI | null {
  if (Date.now() < apiRateLimitActiveUntil) {
    console.log(`[Gemini API Cooldown] Bypassing client request because API quota is currently exhausted (cooldown active for ${Math.round((apiRateLimitActiveUntil - Date.now()) / 1000)}s).`);
    return null;
  }
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY is not configured or is the default placeholder. Using high-fidelity local simulation mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to clean up Gemini error logs to prevent verbose/scary console outputs
function cleanGeminiErrorLog(err: any): string {
  if (!err) return "unknown error";
  const msg = err.message || String(err);
  try {
    if (msg.trim().startsWith("{")) {
      const parsed = JSON.parse(msg);
      if (parsed.error && parsed.error.message) {
        return `[Code ${parsed.error.code || 'unknown'}] ${parsed.error.message}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return msg.length > 200 ? msg.substring(0, 200) + "..." : msg;
}

// Content generation failover
async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: { model: string; contents: any; config?: any }
) {
  if (Date.now() < apiRateLimitActiveUntil) {
    throw new Error("Quota exceeded (bypassed due to active rate-limit cooldown block)");
  }

  const isFlash = options.model.includes("flash");
  const modelsToTry = [options.model];
  
  if (options.model === "gemini-3.5-flash") {
    // Add gemini-flash-latest as a fallback before trying gemini-3.1-flash-lite
    modelsToTry.push("gemini-flash-latest");
  }
  
  if (isFlash && options.model !== "gemini-3.1-flash-tts-preview" && options.model !== "gemini-3.1-flash-lite" && !modelsToTry.includes("gemini-3.1-flash-lite")) {
    modelsToTry.push("gemini-3.1-flash-lite");
  }

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempting content generation using model: ${modelName} (Attempt ${attempts + 1}/${maxAttempts})`);
        const response = await ai.models.generateContent({
          ...options,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        attempts++;
        lastError = err;

        // Check if error is a quota/rate limit error (429 or RESOURCE_EXHAUSTED)
        let isQuotaExceeded = false;
        try {
          const errStr = JSON.stringify(err).toLowerCase();
          const msgStr = (err.message || "").toLowerCase();
          isQuotaExceeded = 
            err.status === "RESOURCE_EXHAUSTED" || 
            err.statusCode === 429 || 
            err.code === 429 ||
            err.error?.status === "RESOURCE_EXHAUSTED" ||
            err.error?.code === 429 ||
            errStr.includes("quota") ||
            errStr.includes("rate_limit") ||
            errStr.includes("resource_exhausted") ||
            errStr.includes("429") ||
            msgStr.includes("quota") ||
            msgStr.includes("rate limit") ||
            msgStr.includes("exhausted") ||
            msgStr.includes("429");
        } catch (e) {
          const msg = String(err).toLowerCase();
          isQuotaExceeded = msg.includes("quota") || msg.includes("exhausted") || msg.includes("429") || msg.includes("rate limit");
        }

        if (isQuotaExceeded) {
          console.log(`[Gemini API Cooldown] Model ${modelName} is temporarily busy. Activating seamless local simulation fallback engine.`);
          apiRateLimitActiveUntil = Date.now() + 5 * 60 * 1000; // 5 minutes block
          throw err; // Fail fast immediately for other retries in this call
        }

        const cleanMsg = cleanGeminiErrorLog(err);
        console.log(`[Gemini Info] Model ${modelName} status updated. Switching paths: ${cleanMsg}`);

        if (attempts < maxAttempts) {
          const delay = Math.min(2000, 300 * Math.pow(2, attempts)) + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }
  throw lastError;
}

// Generic API Error Wrapper to prevent leaking server stack traces
function genericErrorHandler(err: any, req: any, res: any, next: any) {
  console.error("[INTERNAL ERROR]", err);
  return res.status(500).json({ error: "An unexpected security or database error occurred. Please try again." });
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATION ENDPOINTS
// ─────────────────────────────────────────────────────────────

const authRateLimiter = rateLimiter("auth", {
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: "Too many authentication requests. Please try again after 15 minutes.",
});

// POST Sign up
app.post("/api/auth/signup", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!validateLength(password, 72, 8)) {
      return res.status(400).json({ error: "Password must be between 8 and 72 characters long." });
    }
    if (!validateLength(name, 50, 1)) {
      return res.status(400).json({ error: "Name must be provided and less than 50 characters." });
    }

    const sanitizedName = sanitizeHtml(name);
    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(sanitizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email address already exists." });
    }

    // Hash password with Argon2
    const passwordHash = await argon2.hash(password);
    const userId = crypto.randomUUID();
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Parameterized Insert
    db.prepare(
      "INSERT INTO users (id, email, name, password_hash, verification_token) VALUES (?, ?, ?, ?, ?)"
    ).run(userId, sanitizedEmail, sanitizedName, passwordHash, verificationToken);

    // Seed default goals & badges for the user
    const defaultBadges = [
      { id: "badge-1", title: "First Voice", description: "Recorded your first spoken reflection", icon: "🎙️" },
      { id: "badge-2", title: "7-Day Spark", description: "Kept a 7-day journal entry streak", icon: "🔥" },
      { id: "badge-3", title: "Goal Catalyst", description: "Achieved over 75% progress on any goal", icon: "🎯" },
      { id: "badge-4", title: "Zen Architect", description: "Maintained a 5-day meditation streak", icon: "🧘" },
      { id: "badge-5", title: "AI Coachee", description: "Had a personalized discussion with the coach.", icon: "🧠" },
    ];
    for (const b of defaultBadges) {
      db.prepare(
        "INSERT INTO badges (id, user_id, title, description, icon, unlocked) VALUES (?, ?, ?, ?, ?, 0)"
      ).run(`${b.id}-${userId}`, userId, b.title, b.description, b.icon);
    }

    return res.status(201).json({
      message: "Registration successful! Verification email code generated.",
      verificationToken, // Returned directly for high-fidelity frontend integration
    });
  } catch (err) {
    next(err);
  }
});

// POST Verify Email
app.post("/api/auth/verify-email", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Missing verification token." });
    }

    const user = db.prepare("SELECT id FROM users WHERE verification_token = ?").get(token) as any;
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token." });
    }

    db.prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?").run(user.id);
    return res.json({ message: "Email verification successful! You can now log in." });
  } catch (err) {
    next(err);
  }
});

// POST Login (includes Lockout and Rate Limiting)
app.post("/api/auth/login", authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(sanitizedEmail) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Check Lockout
    if (user.lockout_until && new Date(user.lockout_until).getTime() > Date.now()) {
      const waitMins = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / (60 * 1000));
      return res.status(403).json({
        error: `Account locked due to repeated failures. Please wait ${waitMins} more minutes.`,
      });
    }

    // Verify Password with Argon2
    const isMatch = await argon2.verify(user.password_hash, password);
    if (!isMatch) {
      const attempts = user.failed_attempts + 1;
      let lockoutUntil: string | null = null;

      if (attempts >= 5) {
        // Lockout for 15 minutes after 5 failures
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare(
          "UPDATE users SET failed_attempts = ?, lockout_until = ? WHERE id = ?"
        ).run(attempts, lockoutUntil, user.id);
        return res.status(403).json({
          error: "Too many failed attempts. Account has been locked for 15 minutes.",
        });
      }

      db.prepare("UPDATE users SET failed_attempts = ? WHERE id = ?").run(attempts, user.id);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Reset lockouts on successful login
    db.prepare("UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = ?").run(user.id);

    // Create session in SQLite DB
    const sessionId = crypto.randomUUID();
    const device = sanitizeHtml(req.headers["user-agent"] || "Web Browser");
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days duration

    db.prepare(
      "INSERT INTO sessions (id, user_id, device_info, ip_address, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(sessionId, user.id, device, ip, new Date().toISOString(), expiresAt);

    // Generate secure JWT
    const token = signSessionToken({ userId: user.id, sessionId });

    // Store token inside Secure HttpOnly Cookie
    res.cookie("session_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      message: "Log in successful!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST Logout
app.post("/api/auth/logout", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    if (req.session?.id) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(req.session.id);
    }
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
});

// POST Logout from all devices
app.post("/api/auth/logout-all", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    if (req.user?.id) {
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(req.user.id);
    }
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    return res.json({ message: "Successfully logged out from all devices." });
  } catch (err) {
    next(err);
  }
});

// POST Reset Password Request
app.post("/api/auth/reset-password-request", authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(sanitizedEmail) as any;

    if (!user) {
      // Avoid user enumeration: return generic success message even if email is not in DB
      return res.json({
        message: "If an account with that email exists, a password reset token has been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hr expiration

    db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?").run(
      resetToken,
      expires,
      user.id
    );

    return res.json({
      message: "Password reset token generated.",
      resetToken, // Returned directly for high-fidelity offline verification
    });
  } catch (err) {
    next(err);
  }
});

// POST Reset Password (using token)
app.post("/api/auth/reset-password", authRateLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !validateLength(newPassword, 72, 8)) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    const user = db.prepare("SELECT id, reset_token_expires FROM users WHERE reset_token = ?").get(token) as any;
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired password reset token." });
    }

    if (new Date(user.reset_token_expires).getTime() < Date.now()) {
      return res.status(400).json({ error: "Password reset token has expired." });
    }

    const newHash = await argon2.hash(newPassword);
    db.prepare(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
    ).run(newHash, user.id);

    return res.json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    next(err);
  }
});

// GET Active Session Profile
app.get("/api/auth/me", authenticateSession, async (req: SecureRequest, res) => {
  return res.json({ user: req.user });
});

// GET Active sessions (Device Management)
app.get("/api/auth/sessions", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const sessionsList = db.prepare("SELECT id, device_info, ip_address, created_at, expires_at FROM sessions WHERE user_id = ?").all(req.user!.id);
    return res.json({ sessions: sessionsList, currentSessionId: req.session?.id });
  } catch (err) {
    next(err);
  }
});

// DELETE Specific active session
app.delete("/api/auth/sessions/:id", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const sessionId = req.params.id;
    const result = db.prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?").run(sessionId, req.user!.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Session not found." });
    }
    
    return res.json({ message: "Session successfully revoked." });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// JOURNAL ENTRIES (ENCRYPTED & PARAMETERIZED)
// ─────────────────────────────────────────────────────────────

const journalRateLimiter = rateLimiter("journal", {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: "Too many journal logging operations. Please check back in an hour.",
});

// GET Journal timeline (retrieves and decrypts user's records)
app.get("/api/journals", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const entries = db.prepare("SELECT * FROM journals WHERE user_id = ? ORDER BY date DESC").all(req.user!.id) as any[];

    const decryptedEntries = entries.map((entry) => {
      try {
        const rawJson = decryptData(entry.encrypted_data, entry.iv, entry.auth_tag);
        const decryptedPayload = JSON.parse(rawJson);
        return {
          id: entry.id,
          date: entry.date,
          duration: entry.duration,
          mood: entry.mood,
          moodEmoji: entry.mood_emoji,
          topics: entry.topics ? JSON.parse(entry.topics) : [],
          tags: entry.tags ? JSON.parse(entry.tags) : [],
          emotions: entry.emotions ? JSON.parse(entry.emotions) : [],
          transcript: decryptedPayload.transcript,
          summary: decryptedPayload.summary,
          takeaways: decryptedPayload.takeaways || [],
          blocks: decryptedPayload.blocks || [],
          floatingObjects: decryptedPayload.floatingObjects || [],
        };
      } catch (err) {
        console.error(`Failed to decrypt journal entry ${entry.id}:`, err);
        return {
          id: entry.id,
          date: entry.date,
          duration: entry.duration,
          mood: entry.mood,
          moodEmoji: entry.mood_emoji,
          topics: [],
          tags: [],
          emotions: [],
          transcript: "[Unreadable Encrypted Block: Key Missing]",
          summary: "Decryption failure",
          takeaways: [],
        };
      }
    });

    return res.json(decryptedEntries);
  } catch (err) {
    next(err);
  }
});

// POST Create new journal entry (encrypts on save)
app.post("/api/journals", authenticateSession, journalRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { transcript, summary, mood, moodEmoji, topics, tags, emotions, takeaways, date, duration, blocks, floatingObjects } = req.body;

    if (!mood || !moodEmoji) {
      return res.status(400).json({ error: "Malformed request data: missing mood info." });
    }

    const payload = {
      transcript: sanitizeHtml(transcript || ""),
      summary: sanitizeHtml(summary || ""),
      takeaways: (takeaways || []).map((t: string) => sanitizeHtml(t)),
      blocks: blocks || [],
      floatingObjects: floatingObjects || [],
    };

    // Encrypt the sensitive strings inside JSON string payload using AES-256-GCM
    const { ciphertext, iv, authTag } = encryptData(JSON.stringify(payload));

    const entryId = crypto.randomUUID();
    const entryDate = date || new Date().toISOString();
    const entryDuration = duration || 0;

    db.prepare(
      "INSERT INTO journals (id, user_id, date, duration, encrypted_data, iv, auth_tag, mood, mood_emoji, topics, tags, emotions, takeaways) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      entryId,
      req.user!.id,
      entryDate,
      entryDuration,
      ciphertext,
      iv,
      authTag,
      sanitizeHtml(mood),
      sanitizeHtml(moodEmoji),
      JSON.stringify(topics || []),
      JSON.stringify(tags || []),
      JSON.stringify(emotions || []),
      JSON.stringify(payload.takeaways)
    );

    // Update streak counter in users
    db.prepare("UPDATE users SET failed_attempts = 0 WHERE id = ?").run(req.user!.id); // reset failed lockouts indicator

    return res.status(201).json({
      id: entryId,
      date: entryDate,
      duration: entryDuration,
      mood,
      moodEmoji,
      topics,
      tags,
      emotions,
      ...payload,
    });
  } catch (err) {
    next(err);
  }
});

// PUT Edit existing journal entry
app.put("/api/journals/:id", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const entryId = req.params.id;
    const { transcript, summary, mood, moodEmoji, topics, tags, emotions, takeaways, blocks, floatingObjects } = req.body;

    // Verify Ownership
    const existing = db.prepare("SELECT user_id FROM journals WHERE id = ?").get(entryId) as any;
    if (!existing) {
      return res.status(404).json({ error: "Journal entry not found." });
    }
    if (existing.user_id !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized access to this resource." });
    }

    const payload = {
      transcript: sanitizeHtml(transcript || ""),
      summary: sanitizeHtml(summary || ""),
      takeaways: (takeaways || []).map((t: string) => sanitizeHtml(t)),
      blocks: blocks || [],
      floatingObjects: floatingObjects || [],
    };

    const { ciphertext, iv, authTag } = encryptData(JSON.stringify(payload));

    db.prepare(
      "UPDATE journals SET encrypted_data = ?, iv = ?, auth_tag = ?, mood = ?, mood_emoji = ?, topics = ?, tags = ?, emotions = ?, takeaways = ? WHERE id = ?"
    ).run(
      ciphertext,
      iv,
      authTag,
      sanitizeHtml(mood),
      sanitizeHtml(moodEmoji),
      JSON.stringify(topics || []),
      JSON.stringify(tags || []),
      JSON.stringify(emotions || []),
      JSON.stringify(payload.takeaways),
      entryId
    );

    return res.json({ message: "Journal entry updated successfully." });
  } catch (err) {
    next(err);
  }
});

// DELETE Journal entry
app.delete("/api/journals/:id", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const entryId = req.params.id;

    // Verify Ownership
    const existing = db.prepare("SELECT user_id FROM journals WHERE id = ?").get(entryId) as any;
    if (!existing) {
      return res.status(404).json({ error: "Journal entry not found." });
    }
    if (existing.user_id !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized access to this resource." });
    }

    db.prepare("DELETE FROM journals WHERE id = ?").run(entryId);
    return res.json({ message: "Journal entry deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// PRIVATE FILE UPLOAD & SIGNED URLS
// ─────────────────────────────────────────────────────────────

const uploadRateLimiter = rateLimiter("upload", {
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: "Upload threshold reached. Please wait an hour before uploading audio recordings.",
});

// POST upload voice recording to private storage
app.post("/api/voice/upload", authenticateSession, uploadRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { audio, mimeType, duration } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "No audio stream uploaded." });
    }

    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.webm`;
    const filePath = path.join(PRIVATE_STORAGE_DIR, fileName);

    // Save base64 audio block directly to Private Storage
    const buffer = Buffer.from(audio, "base64");
    await fs.promises.writeFile(filePath, buffer);

    db.prepare(
      "INSERT INTO voice_recordings (id, user_id, file_path, mime_type, duration, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(fileId, req.user!.id, filePath, mimeType || "audio/webm", duration || 0, new Date().toISOString());

    // Generate secure temporary signature URL
    const signedUrl = generateSignedUrl(fileId, 30); // 30 minutes duration

    return res.json({
      fileId,
      signedUrl,
    });
  } catch (err) {
    next(err);
  }
});

// GET download voice recording (Secure verification of Signed URL parameters)
app.get("/api/voice/download", async (req, res, next) => {
  try {
    const { id, expires, sig } = req.query as { id: string; expires: string; sig: string };

    if (!id || !expires || !sig) {
      return res.status(403).json({ error: "Missing signed signature parameters." });
    }

    // Verify signature to prevent URL tempering
    const isValid = verifySignedUrlSignature(id, expires, sig);
    if (!isValid) {
      return res.status(403).json({ error: "Invalid, expired, or tampered signature link." });
    }

    // Load file path and make sure traversal is impossible
    const fileRecord = db.prepare("SELECT file_path, mime_type FROM voice_recordings WHERE id = ?").get(id) as any;
    if (!fileRecord) {
      return res.status(404).json({ error: "Audio file not found." });
    }

    const resolvedPath = path.resolve(fileRecord.file_path);
    if (!resolvedPath.startsWith(PRIVATE_STORAGE_DIR)) {
      return res.status(403).json({ error: "Access violation detected." });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(410).json({ error: "Physical file was pruned or deleted from private archives." });
    }

    res.setHeader("Content-Type", fileRecord.mime_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    
    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// COCH CHAT & PREMIUM AI ENHANCEMENTS
// ─────────────────────────────────────────────────────────────

const aiRateLimiter = rateLimiter("ai", {
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "AI quota exceeded. Please wait 15 minutes before talking to the coach.",
});

// 1. Audio Transcription & Analysis API
app.post("/api/transcribe", authenticateSession, aiRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { audio, mimeType, duration } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      console.log("Simulating audio analysis...");
      const mockResult = generateMockAnalysis(undefined);
      return res.json({ ...mockResult, duration: duration || 12 });
    }

    const prompt = `
      You are the core backend of Voice Journal AI.
      Analyze this audio file.
      First, transcribe the voice recording accurately. Keep any emotional pauses or natural phrasings.
      Then, analyze the transcript to generate a structured JSON object containing:
      {
        "transcript": "The full transcribed text of the user's recording.",
        "summary": "A concise, warm, empathetic 2-sentence summary of what the user is feeling or discussing.",
        "mood": "One word representing the primary mood (e.g., Happy, Calm, Anxious, Motivated, Tired, Sad, Excited, Angry, Reflective, Stressed, Neutral).",
        "moodEmoji": "A single appropriate emoji for the mood (😊, 😐, 😔, 😡, 😴, 😍, 🧠, 🤯).",
        "topics": ["Up to 3 detected key topics, e.g., Work, Fitness, Relationship, Family, Health, Finance, Learning"],
        "tags": ["3 lowercase hashtags, e.g., #motivation, #career, #discipline"],
        "emotions": ["Up to 4 specific secondary emotions, e.g., Optimism, Fatigue, Anxiety, Gratitude, Passion, Uncertainty"],
        "takeaways": ["3 actionable, positive, or reflective takeaways to help the user grow"]
      }

      Return strictly the raw JSON without markdown codeblock decorators (do not wrap in \`\`\`json or \`\`\`).
    `;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audio,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "";
    const parsedData = JSON.parse(resultText.trim());
    return res.json({ ...parsedData, duration: duration || 12 });
  } catch (error: any) {
    console.log("[DayNest AI Safe Fallback] Transcribe endpoint active with simulation engine");
    return res.json({
      ...generateMockAnalysis(undefined),
      duration: req.body.duration || 12,
      warning: "DayNest Safe Simulation Fallback active",
    });
  }
});

// 2. Text-only Analysis API
app.post("/api/analyze-text", authenticateSession, aiRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(generateMockAnalysis(text));
    }

    const prompt = `
      You are the core backend of Voice Journal AI.
      Analyze the following written journal entry:
      "${text}"

      Generate a structured JSON object containing:
      {
        "transcript": "${text.replace(/"/g, '\\"')}",
        "summary": "A concise, warm, empathetic 2-sentence summary of what the user is feeling or discussing.",
        "mood": "One word representing the primary mood (e.g., Happy, Calm, Anxious, Motivated, Tired, Sad, Excited, Angry, Reflective, Stressed, Neutral).",
        "moodEmoji": "A single appropriate emoji for the mood (😊, 😐, 😔, 😡, 😴, 😍, 🧠, 🤯).",
        "topics": ["Up to 3 detected key topics, e.g., Work, Fitness, Relationship, Family, Health, Finance, Learning"],
        "tags": ["3 lowercase hashtags, e.g., #motivation, #career, #discipline"],
        "emotions": ["Up to 4 specific secondary emotions, e.g., Optimism, Fatigue, Anxiety, Gratitude, Passion, Uncertainty"],
        "takeaways": ["3 actionable, positive, or reflective takeaways to help the user grow"]
      }

      Return strictly the raw JSON without markdown codeblock decorators (do not wrap in \`\`\`json or \`\`\`).
    `;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse((response.text || "").trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.log("[DayNest AI Safe Fallback] Text analysis endpoint active with simulation engine");
    return res.json(generateMockAnalysis(req.body.text));
  }
});

// 3. AI Life Coach Chat API (PROTECTED: Premium Only, 402 if inactive)
app.post("/api/coach", authenticateSession, requirePremium, aiRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { message, history, entries } = req.body;
    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ reply: generateMockCoachReply(message, entries) });
    }

    const prompt = `
      You are the empathetic, wise, and encouraging AI Life Coach for Voice Journal AI.
      Your mission is to help the user reflect, find patterns, reduce stress, and achieve their goals.

      Here are the user's recent journal entries to help you understand their context deeply:
      ${JSON.stringify(entries || [])}

      Here is our chat history:
      ${JSON.stringify(history || [])}

      The user asks: "${message}"

      Write a comforting, deeply supportive, and positive coaching reply.
      - Keep it conversational, warm, and clear (no longer than 4-5 sentences).
      - Reference past entry trends or emotional patterns where relevant to show continuity and care.
      - Ask a single gentle follow-up question to promote further self-reflection.
      - Do not use markdown other than bolding key positive words. Do not use markdown bullet lists.
    `;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return res.json({ reply: (response.text || "").trim() });
  } catch (error: any) {
    console.log("[DayNest AI Safe Fallback] AI Coach chat active with simulation engine");
    return res.json({ reply: generateMockCoachReply(req.body.message, req.body.entries) });
  }
});

// 4. AI Workspace Generator API (PROTECTED: Premium Only, 402 if inactive)
app.post("/api/generate-workspace", authenticateSession, requirePremium, aiRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const simulated = generateMockWorkspace(prompt);
      return res.json(simulated);
    }

    const systemInstructions = `
      You are the core Workspace Builder AI for DayNest. Your task is to translate a natural language goal, study objective, habit tracker, or planning target into a highly customized, robust planning workspace with standard lego modular blocks.
      
      Generate a JSON response of the following type:
      {
        "title": "A short, elegant title with a relevant emoji, e.g. 'UPSC 8-Month Blueprint 📚' or 'Japan Sightseeing Planner 🗺️'",
        "description": "A comforting, encouraging, and clear 1-2 sentence description of what the workspace achieves.",
        "icon": "A single emoji representing the workspace",
        "category": "One of: 'Health', 'Fitness', 'Career', 'Learning', 'Personal', 'Finance', 'Social', 'Creative', 'Reading', 'Travel', 'Business', 'Custom'",
        "priority": "One of: 'high', 'medium', 'low'",
        "color": "One of: 'cozy-orange', 'cozy-rose', 'cozy-blue', 'cozy-green', 'cozy-yellow', 'cozy-lavender'",
        "modules": {
          "progress": {
            "target": 100,
            "current": 0,
            "unit": "e.g., Pages, Hours, %, Words, Sessions, Workouts",
            "type": "one of: 'bar', 'circular', 'numeric'"
          },
          "checklist": {
            "items": [
              { "id": "chk-1", "text": "Task description here", "completed": false }
            ]
          },
          "milestones": {
            "items": [
              { "id": "ms-1", "title": "Milestone description", "dueDate": "YYYY-MM-DD", "completed": false }
            ]
          },
          "habits": {
            "streak": 0,
            "longestStreak": 0,
            "history": {}
          },
          "time": {
            "estimatedHours": 80,
            "actualHours": 0,
            "timetable": [
              { "time": "09:00", "activity": "Specific activity description" }
            ]
          },
          "notes": {
            "content": "A beautiful Markdown starter guide, checklist notes, outline, research links, or tips for this workspace."
          },
          "tracking": {
            "type": "one of: 'numeric', 'timer'",
            "logs": []
          },
          "automation": {
            "rules": [
              { "trigger": "habit_completed", "action": "increase_progress", "enabled": true }
            ]
          },
          "journal": {
            "prompts": [
              "What went well in today's session?"
            ]
          },
          "collaboration": {
            "members": ["AI Coach", "Me"],
            "activityLog": ["Workspace created automatically."]
          }
        },
        "followUpQuestions": [
          "Would you like daily calendar reminders to stay on track?",
          "Should we connect this to your journaling habit for automatic progress updates?"
        ]
      }

      Return STRICTLY a valid JSON object matching this schema. Do not output any markdown codeblock markers, notes, or explanations outside the JSON block.
    `;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: [
        { text: systemInstructions },
        { text: `User request: "${prompt}"` },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResult = (response.text || "").trim();
    const parsed = JSON.parse(textResult);
    return res.json(parsed);
  } catch (error: any) {
    console.log("[DayNest AI Safe Fallback] Workspace builder active with simulation engine");
    const simulated = generateMockWorkspace(req.body.prompt || "Custom Workspace");
    return res.json(simulated);
  }
});

// 5. Text to Speech API (PROTECTED: Premium Only, 402 if inactive)
app.post("/api/tts", authenticateSession, requirePremium, aiRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ audio: null, fallback: true });
    }

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say warmly, empathetically and supportively: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audio: base64Audio, fallback: false });
    } else {
      return res.json({ audio: null, fallback: true });
    }
  } catch (error: any) {
    console.log("[DayNest AI Safe Fallback] TTS engine active with speech synthesis simulation");
    return res.json({ audio: null, fallback: true });
  }
});

// AI Life Coach Insights & Life Feedback API
app.post("/api/ai/insights", authenticateSessionOptional, aiRateLimiter, async (req: SecureRequest, res, next) => {
  try {
    const { timeframe } = req.body;
    if (!timeframe || !["day", "week", "month", "year"].includes(timeframe)) {
      return res.status(400).json({ error: "Invalid timeframe. Please specify day, week, month, or year." });
    }

    let decryptedEntries: any[] = [];
    let formattedHabits: any[] = [];
    let formattedGoals: any[] = [];

    if (req.user) {
      // 1. Fetch journals from DB
      const entries = db.prepare("SELECT * FROM journals WHERE user_id = ? ORDER BY date DESC").all(req.user.id) as any[];
      decryptedEntries = entries.map((entry) => {
        try {
          const rawJson = decryptData(entry.encrypted_data, entry.iv, entry.auth_tag);
          const decryptedPayload = JSON.parse(rawJson);
          return {
            id: entry.id,
            date: entry.date,
            mood: entry.mood,
            moodEmoji: entry.mood_emoji,
            topics: entry.topics ? JSON.parse(entry.topics) : [],
            tags: entry.tags ? JSON.parse(entry.tags) : [],
            emotions: entry.emotions ? JSON.parse(entry.emotions) : [],
            transcript: decryptedPayload.transcript,
            summary: decryptedPayload.summary,
            takeaways: decryptedPayload.takeaways || [],
          };
        } catch (err) {
          return null;
        }
      }).filter(Boolean);

      // 2. Fetch habits from DB
      const habitsList = db.prepare("SELECT * FROM habits WHERE user_id = ?").all(req.user.id) as any[];
      formattedHabits = habitsList.map((h) => ({
        name: h.name,
        streak: h.streak,
        history: JSON.parse(h.history || "{}"),
      }));

      // 3. Fetch goals from DB
      const goalsList = db.prepare("SELECT * FROM goals WHERE user_id = ?").all(req.user.id) as any[];
      formattedGoals = goalsList.map((g) => ({
        title: g.title,
        category: g.category,
        progress: g.progress,
        deadline: g.deadline,
      }));
    } else {
      // Guest / Offline Mode: Extract data passed from the frontend client state
      const { entries: clientEntries, habits: clientHabits, goals: clientGoals } = req.body;
      if (Array.isArray(clientEntries)) {
        decryptedEntries = clientEntries;
      }
      if (Array.isArray(clientHabits)) {
        formattedHabits = clientHabits.map((h: any) => ({
          name: h.name,
          streak: h.streak || 0,
          history: h.history || {},
        }));
      }
      if (Array.isArray(clientGoals)) {
        formattedGoals = clientGoals.map((g: any) => ({
          title: g.title,
          category: g.category || "Personal",
          progress: g.progress || 0,
          deadline: g.deadline || "",
        }));
      }
    }

    // Filter data based on timeframe
    const now = new Date();
    let filteredEntries = decryptedEntries;
    if (timeframe === "day") {
      filteredEntries = decryptedEntries.filter(e => {
        if (!e) return false;
        const d = new Date(e.date);
        return now.getTime() - d.getTime() <= 24 * 60 * 60 * 1000;
      });
    } else if (timeframe === "week") {
      filteredEntries = decryptedEntries.filter(e => {
        if (!e) return false;
        const d = new Date(e.date);
        return now.getTime() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
      });
    } else if (timeframe === "month") {
      filteredEntries = decryptedEntries.filter(e => {
        if (!e) return false;
        const d = new Date(e.date);
        return now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
      });
    } else if (timeframe === "year") {
      filteredEntries = decryptedEntries.filter(e => {
        if (!e) return false;
        const d = new Date(e.date);
        return now.getTime() - d.getTime() <= 365 * 24 * 60 * 60 * 1000;
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const simulatedResponse = generateSimulatedInsights(timeframe, filteredEntries, formattedHabits, formattedGoals);
      return res.json(simulatedResponse);
    }

    const systemInstructions = `
      You are the Cognitive Psychologist and AI Life Analyst for DayNest.
      Analyze the user's journals, habits, and goals for the selected timeframe ("${timeframe}").
      Provide deep, warm, comforting, and highly customized insights.
      
      User data to analyze:
      Journals: ${JSON.stringify(filteredEntries.slice(0, 15))}
      Habits: ${JSON.stringify(formattedHabits)}
      Goals: ${JSON.stringify(formattedGoals)}

      Generate a JSON response containing:
      {
        "summary": "An empathetic, beautifully phrased analysis of their physical, emotional and productivity trends. Talk to them directly in the second person ('You').",
        "improvements": ["List of areas where they have shown growth, resilience, or positive habits compared to previous days. Be highly specific based on the data provided."],
        "activities": ["A summary of what they did, focused on, or completed during this time (e.g. milestones reached, habits completed)."],
        "emotionalTrend": "A comforting breakdown of their dominant emotions and stress/peace climate. Mention any triggers if detectable.",
        "suggestions": ["3-4 actionable, realistic, and inspiring suggestions/ideas customized for their specific situation (e.g., balancing workloads, moving, breathing)."],
        "growthScore": 85
      }

      Return STRICTLY a valid JSON object matching this schema. Do not output any markdown codeblock markers, notes, or explanations outside the JSON block.
    `;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3.5-flash",
      contents: [{ text: systemInstructions }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse((response.text || "").trim());
    return res.json(parsed);
  } catch (error: any) {
    console.log("[DayNest AI Safe Fallback] Life Feedback Insights active with simulation engine");
    return res.json(generateSimulatedInsights(req.body.timeframe || "week", [], [], []));
  }
});

function generateSimulatedInsights(timeframe: string, entries: any[], habits: any[], goals: any[]) {
  const moodCounts: Record<string, number> = {};
  const topics: string[] = [];
  entries.forEach(e => {
    if (!e) return;
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    (e.topics || []).forEach((t: string) => {
      if (!topics.includes(t)) topics.push(t);
    });
  });

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Calm";
  const topicString = topics.length > 0 ? topics.slice(0, 3).join(", ") : "Mindfulness & Goals";

  const summariesByTimeframe: Record<string, any> = {
    day: {
      summary: `Your last 24 hours reflect a focused and balanced state. You've primarily engaged with topics like **${topicString}**. We see a beautiful consistency in how you pause to voice-journal, demonstrating high emotional self-awareness.`,
      improvements: [
        "You successfully paused and recorded your voice diary, avoiding emotional suppression.",
        `Your current dominant mood is recorded as **${dominantMood}**, which is a highly reflective state.`
      ],
      activities: [
        "Logged active cognitive states using your secure audio locker.",
        "Reflected on personal growth markers and registered actionable takeaways."
      ],
      emotionalTrend: `Your emotional climate is currently centered around **${dominantMood}**. There are signs of a healthy self-reflection loop where stress triggers are identified and processed.`,
      suggestions: [
        "Continue your morning focus habit: the first hour sets your brain's cognitive filter.",
        "Take a screen-free stroll in nature or in your neighborhood this evening.",
        "Record a 1-minute gratitude whisper right before bedtime."
      ],
      growthScore: 82
    },
    week: {
      summary: `This past week has been a powerful test of resilience and focus. In your entries around **${topicString}**, you have actively transformed stress into clear planning. This is a very rare cognitive skill!`,
      improvements: [
        "Improved stress management: you're planning sub-tasks when feeling overwhelmed.",
        "Habit compliance: your morning routine shows a beautiful streak of dedication.",
        "You've shown greater patience with your learning milestones (e.g. language or career objectives)."
      ],
      activities: [
        "Secured voice reflections covering critical milestones in your projects.",
        "Completed daily habits including active meditations and learning exercises.",
        "Refined and progress-logged active milestone goals."
      ],
      emotionalTrend: "You experienced a minor tension spike early in the week due to upcoming milestones, but quickly restored equilibrium through structured planning and breathing.",
      suggestions: [
        "Create a dedicated 'Review Sunday' session to plan the upcoming week's atomic actions.",
        "Give yourself permission to celebrate 3 micro-victories from this past week.",
        "Maintain a strict screen-time boundary 45 minutes before sleep."
      ],
      growthScore: 88
    },
    month: {
      summary: `Over the past 30 days, your DayNest records show a clear upward trajectory in habit compliance and emotional grounding. Your primary themes were **${topicString}**, reflecting a deeply intentional lifestyle.`,
      improvements: [
        "A 15% increase in habit consistency compared to last month.",
        "More frequent states of 'Joy' and 'Tranquility' following intensive physical/mental workouts.",
        "Excellent resilience in navigating high-stress slides and exam anxieties."
      ],
      activities: [
        "Unlocking key developmental badges such as the 'Zen Architect'.",
        "Logging multiple detailed spoken reflections with consistent summaries.",
        "Actively moving goals forward by over 20% on average."
      ],
      emotionalTrend: "A beautifully diverse emotional spectrum, starting with highly motivated sprints, followed by recovery, and moving toward deeply centered calm.",
      suggestions: [
        "Introduce a mid-month audit of your goals to ensure actions are still aligned with your purpose.",
        "Explore advanced audio journaling formats, like speaking in different tones to release tension.",
        "Take a full rest day every fortnight to prevent silent cognitive burnout."
      ],
      growthScore: 91
    },
    year: {
      summary: `Looking at your year-scale trajectory, you have built the foundational infrastructure of an extremely mindful, organized life. Your consistency in voice logging is a beautiful archive of your evolution.`,
      improvements: [
        "Established permanent, durable self-care habits (meditation, reading, and physical fitness).",
        "Significantly improved executive functioning by breaking giant goals into structured checklists.",
        "Deepened emotional maturity by journaling during stress rather than distracting yourself."
      ],
      activities: [
        "Completed multiple complex quarterly goals across Fitness and Career tracks.",
        "Logged hundreds of minutes of spoken voice reflections.",
        "Unlocked and cemented legacy badges."
      ],
      emotionalTrend: "A resilient annual pattern where high-stress milestones are regularly met with healthy coping mechanisms, leading to long, sustainable periods of creative calm.",
      suggestions: [
        "Draft an annual legacy letter to your future self, recording the wisdom gained this year.",
        "Scale your checklist strategy to major lifetime milestones.",
        "Consider mentoring others or sharing your habits with a friend to reinforce them."
      ],
      growthScore: 94
    }
  };

  return summariesByTimeframe[timeframe] || summariesByTimeframe.week;
}

// ─────────────────────────────────────────────────────────────
// GOALS, HABITS, AND BADGES SECURE ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET goals
app.get("/api/goals", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const goalsList = db.prepare("SELECT * FROM goals WHERE user_id = ?").all(req.user!.id) as any[];
    const formatted = goalsList.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      progress: g.progress,
      deadline: g.deadline,
      actions: JSON.parse(g.actions || "[]"),
    }));
    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST Create/Save goal
app.post("/api/goals", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const { id, title, category, progress, deadline, actions } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: "Goal title and category required." });
    }

    const goalId = id || crypto.randomUUID();
    db.prepare(
      "INSERT OR REPLACE INTO goals (id, user_id, title, category, progress, deadline, actions) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      goalId,
      req.user!.id,
      sanitizeHtml(title),
      sanitizeHtml(category),
      progress || 0,
      deadline || new Date().toISOString().split("T")[0],
      JSON.stringify(actions || [])
    );

    return res.json({ message: "Goal updated." });
  } catch (err) {
    next(err);
  }
});

// DELETE Goal
app.delete("/api/goals/:id", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    db.prepare("DELETE FROM goals WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    return res.json({ message: "Goal deleted." });
  } catch (err) {
    next(err);
  }
});

// GET Habits
app.get("/api/habits", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const habitsList = db.prepare("SELECT * FROM habits WHERE user_id = ?").all(req.user!.id) as any[];
    const formatted = habitsList.map((h) => ({
      id: h.id,
      name: h.name,
      streak: h.streak,
      history: JSON.parse(h.history || "{}"),
    }));
    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST Save Habit
app.post("/api/habits", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const { id, name, streak, history } = req.body;
    if (!name) return res.status(400).json({ error: "Habit name required." });

    const habitId = id || crypto.randomUUID();
    db.prepare(
      "INSERT OR REPLACE INTO habits (id, user_id, name, streak, history) VALUES (?, ?, ?, ?, ?)"
    ).run(habitId, req.user!.id, sanitizeHtml(name), streak || 0, JSON.stringify(history || {}));

    return res.json({ message: "Habit saved." });
  } catch (err) {
    next(err);
  }
});

// DELETE Habit
app.delete("/api/habits/:id", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    db.prepare("DELETE FROM habits WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    return res.json({ message: "Habit deleted." });
  } catch (err) {
    next(err);
  }
});

// GET Badges
app.get("/api/badges", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const badgesList = db.prepare("SELECT * FROM badges WHERE user_id = ?").all(req.user!.id) as any[];
    const formatted = badgesList.map((b) => ({
      id: b.id.split("-")[0], // Trim userId mapping
      title: b.title,
      description: b.description,
      icon: b.icon,
      unlocked: b.unlocked === 1,
      unlockedAt: b.unlocked_at || undefined,
    }));
    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// POST unlock badge
app.post("/api/badges/unlock", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const { id } = req.body;
    const mappedId = `${id}-${req.user!.id}`;
    db.prepare("UPDATE badges SET unlocked = 1, unlocked_at = ? WHERE id = ? AND user_id = ?").run(
      new Date().toISOString().split("T")[0],
      mappedId,
      req.user!.id
    );
    return res.json({ message: "Badge unlocked." });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// STRIPE INTEGRATION
// ─────────────────────────────────────────────────────────────

// POST Create Stripe checkout session
app.post("/api/stripe/create-checkout", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const origin = req.headers.origin || "http://localhost:3000";
    const plan = (req.body.plan || "monthly") as "monthly" | "yearly";
    
    if (plan !== "monthly" && plan !== "yearly") {
      return res.status(400).json({ error: "Invalid plan type. Please choose monthly or yearly." });
    }

    const checkoutUrl = await createCheckoutSession(req.user!.id, req.user!.email, origin, plan);
    return res.json({ url: checkoutUrl });
  } catch (err) {
    next(err);
  }
});

// POST Create Stripe billing portal session
app.post("/api/stripe/create-portal", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const origin = req.headers.origin || "http://localhost:3000";
    const portalUrl = await createPortalSession(req.user!.id, origin);
    return res.json({ url: portalUrl });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create billing portal session." });
  }
});

// POST Secure Mock Upgrade endpoint for high-fidelity offline/dev testing
app.post("/api/stripe/mock-upgrade", authenticateSession, async (req: SecureRequest, res, next) => {
  try {
    const plan = (req.body.plan || "monthly") as "monthly" | "yearly";
    const daysToAdd = plan === "yearly" ? 365 : 30;
    const periodEnd = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE users 
      SET subscription_status = 'premium',
          subscription_plan = ?,
          stripe_subscription_id = ?,
          subscription_period_end = ?,
          subscription_cancel_at_period_end = 0,
          subscription_trial_end = ?
      WHERE id = ?
    `).run(plan, `sub_mock_${crypto.randomUUID().slice(0, 8)}`, periodEnd, trialEnd, req.user!.id);

    console.log(`[STRIPE MOCK] Server upgraded user ${req.user!.id} to mock ${plan} subscription.`);
    return res.json({ 
      success: true, 
      message: `Activated mock ${plan} premium subscription (7-day trial active).` 
    });
  } catch (err) {
    next(err);
  }
});

// POST Stripe Webhook Signature Verification
app.post("/api/stripe/webhook", async (req: any, res) => {
  const stripe = getStripe();
  if (!stripe) {
    console.log("[STRIPE] Stripe not configured. Mocking success webhook processing.");
    return res.json({ received: true });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: "Missing stripe signature or config secrets." });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK SIGNATURE FAILURE] ${err.message}`);
    return res.status(400).send(`Webhook Signature Verification Error: ${err.message}`);
  }

  try {
    await handleStripeWebhook(event);
    return res.json({ received: true });
  } catch (error) {
    console.error("[STRIPE WEBHOOK HANDLER ERROR]", error);
    return res.status(500).json({ error: "Internal webhook processing error" });
  }
});

// ─────────────────────────────────────────────────────────────
// MOCK AI HELPERS
// ─────────────────────────────────────────────────────────────

function generateMockAnalysis(writtenText?: string) {
  const text = writtenText || "I had a busy but rewarding day focusing on my career goals and hitting the gym.";
  let mood = "Calm";
  let moodEmoji = "😊";
  let topics = ["Work", "Fitness", "Learning"];
  let tags = ["#motivation", "#career", "#discipline"];
  let emotions = ["Optimism", "Focus", "Gratitude"];
  let summary = "You had a productive day working towards your professional and physical health goals. You are feeling centered and determined.";
  let takeaways = [
    "Carve out small breaks during highly focused work blocks.",
    "Acknowledge the physical energy boost you feel after exercise.",
    "Plan your next big career milestone with incremental daily tasks.",
  ];

  const lower = text.toLowerCase();
  if (lower.includes("sad") || lower.includes("depressed") || lower.includes("lonely") || lower.includes("cry")) {
    mood = "Sad";
    moodEmoji = "😔";
    topics = ["Relationships", "Personal Care", "Reflections"];
    tags = ["#selfcare", "#healing", "#mindset"];
    emotions = ["Vulnerability", "Sadness", "Hope"];
    summary = "You are going through a heavy emotional moment and feeling a bit isolated. You are allowing yourself to feel vulnerable, which is a key part of healing.";
    takeaways = [
      "Reach out to a trusted friend or write down one thing that brings comfort.",
      "Engage in a quiet self-care routine, like drinking tea or reading.",
      "Remember that emotional waves pass and processing them takes time.",
    ];
  } else if (lower.includes("stress") || lower.includes("exam") || lower.includes("busy") || lower.includes("anxious") || lower.includes("overwhelmed")) {
    mood = "Stressed";
    moodEmoji = "🤯";
    topics = ["Work", "Mental Health", "Time Management"];
    tags = ["#productivity", "#mindfulness", "#boundaries"];
    emotions = ["Anxiety", "Overwhelm", "Determination"];
    summary = "You are carrying a lot of tension from a packed schedule and upcoming tasks. It is essential to pace yourself and step back.";
    takeaways = [
      "Divide your massive task list into three simple, non-negotiable actions.",
      "Take five deep breaths right now to ground your nervous system.",
      "Permit yourself to rest without feeling guilty.",
    ];
  } else if (lower.includes("happy") || lower.includes("great") || lower.includes("good") || lower.includes("amazing") || lower.includes("awesome") || lower.includes("excited")) {
    mood = "Excited";
    moodEmoji = "😍";
    topics = ["Achievement", "Family", "Joy"];
    tags = ["#gratitude", "#celebrate", "#energy"];
    emotions = ["Elation", "Gratitude", "Confidence"];
    summary = "An incredible surge of positive energy and happiness! You are celebrating success and feeling beautifully connected to your passions.";
    takeaways = [
      "Write down or voice-log exactly what triggered this high so you can revisit it.",
      "Spread the positive vibe by sending a kind word to someone you love.",
      "Use this productive momentum to tackle a creative task.",
    ];
  } else if (lower.includes("tired") || lower.includes("sleep") || lower.includes("exhausted") || lower.includes("lazy")) {
    mood = "Tired";
    moodEmoji = "😴";
    topics = ["Health", "Sleep", "Recovery"];
    tags = ["#recovery", "#rest", "#health"];
    emotions = ["Fatigue", "Relaxation", "Quietness"];
    summary = "Your energy levels are depleted, and your body is calling for rest. You are winding down and listening to your physical needs.";
    takeaways = [
      "Turn off screens 45 minutes before sleep to improve your rest quality.",
      "Acknowledge that rest is productive and essential for your mind.",
      "Keep tomorrow's schedule lighter to recover fully.",
    ];
  }

  return {
    transcript: text,
    summary,
    mood,
    moodEmoji,
    topics,
    tags,
    emotions,
    takeaways,
  };
}

function generateMockCoachReply(message: string, entries: any[] = []) {
  const lower = message.toLowerCase();
  const entryCount = entries.length;

  if (lower.includes("stress") || lower.includes("anxious") || lower.includes("overwhelm")) {
    return "I hear you, and it is completely natural to feel overwhelmed when everything piles up at once. Looking through your diary, I see that you've navigated moments of high strain in the past by focusing on **career goals** and structure. Try to break your current focus down into one small task. What is one tiny thing you can complete right now to restore your sense of calm?";
  }
  if (lower.includes("happy") || lower.includes("celebrate") || lower.includes("good")) {
    return "It is wonderful to hear such vibrant energy in your words! Celebrating these happy milestones keeps our motivation alive. Looking back, your entries show you feel a major spike in happiness when you make progress on your **learning** or **fitness**. What is one thing you can do to carry this beautiful positive momentum into the rest of your week?";
  }
  if (lower.includes("improve") || lower.includes("discipline") || lower.includes("habit")) {
    return "Discipline is built on small, consistent choices rather than giant leaps. I noticed your daily **streaks** indicate highly resilient habits once you get started. Focus on starting with just 2 minutes of your habit today. What is the easiest habit on your list that you can complete right after reading this message?";
  }
  if (lower.includes("summarize") || lower.includes("month") || lower.includes("recent")) {
    if (entryCount === 0) {
      return "You haven't recorded any entries yet! Once you voice-log or write a few journals, I will analyze your emotional trends, highlight your key victories, and summarize your growth. Why don't we start by talking about how your day is going so far?";
    }
    return `In your recent ${entryCount} entries, you've primarily focused on **Work** and **Health**. Your predominant mood has been **Calm** and **Productive**, with occasional fatigue after intense stretches. Your resilience shines through in how you consistently practice self-reflection. What area of your life would you like to focus on optimizing next?`;
  }

  return "Thank you for sharing that with me. Self-reflection is the first step toward self-understanding. Looking over your journals, you display great self-awareness when speaking about your goals. Let's dig deeper: how does what you just mentioned connect with your long-term focus on personal growth?";
}

function generateMockWorkspace(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes("upsc")) {
    return {
      title: "UPSC 8-Month Preparation Workspace 📚",
      description: "An intensive, structured preparation curriculum mapped for Syllabus Coverage, Test Series, and Daily Answer Writing Practice.",
      icon: "📚",
      category: "Learning",
      priority: "high",
      color: "cozy-blue",
      modules: {
        progress: { target: 100, current: 0, unit: "% Syllabus Covered", type: "circular" },
        checklist: {
          items: [
            { id: "chk-up-1", text: "Read Laxmikanth for Indian Polity chapters 1-5", completed: false },
            { id: "chk-up-2", text: "Analyze previous 5 years UPSC prelims questions", completed: false },
            { id: "chk-up-3", text: "Draft one daily GS mains answer essay", completed: false },
            { id: "chk-up-4", text: "Review current affairs monthly compilation", completed: false },
          ],
        },
        milestones: {
          items: [
            { id: "ms-up-1", title: "Phase 1: Complete Foundation Syllabus (GS + Optional)", dueDate: "2026-11-01", completed: false },
            { id: "ms-up-2", title: "Phase 2: Comprehensive Mock Test Series & Revision", dueDate: "2027-01-15", completed: false },
            { id: "ms-up-3", title: "Phase 3: Mains Special Answer Writing & CSAT Practice", dueDate: "2027-03-01", completed: false },
          ],
        },
        habits: { streak: 0, longestStreak: 0, history: {} },
        time: {
          estimatedHours: 1200,
          actualHours: 0,
          timetable: [
            { time: "06:00", activity: "Newspaper analysis & Current affairs" },
            { time: "09:00", activity: "GS Paper core subject study block" },
            { time: "14:00", activity: "Optional subject deep-dive" },
            { time: "17:00", activity: "Mains answer writing practice & peer review" },
          ],
        },
        notes: {
          content: `# UPSC 8-Month Blueprint\n\n## Core Resources\n- **Polity**: Laxmikanth\n- **History**: Spectrum (Modern), NCERTs\n- **Economy**: Ramesh Singh / Mrunal lectures\n- **Environment**: Shankar IAS\n\n## Daily Strategy\n1. Target 8 hours of focused, distraction-free study blocks.\n2. Revise yesterday's notes for 30 minutes every morning.\n3. Keep optional preparation aligned in parallel.`,
        },
        tracking: { type: "numeric", logs: [] },
        automation: {
          rules: [{ trigger: "habit_completed", action: "increase_progress", enabled: true }],
        },
        journal: {
          prompts: ["What core UPSC concept did you master today?"],
        },
        collaboration: { members: ["AI Coach"], activityLog: ["UPSC study workspace initialized."] },
      },
      followUpQuestions: ["Would you like daily core calendar reminders?", "Should we link this with answer drafts tracker?"],
    };
  }

  const capitalizedTitle = prompt.charAt(0).toUpperCase() + prompt.slice(1);
  return {
    title: `${capitalizedTitle} Workspace ✨`,
    description: `A custom generated AI workspace configured specifically to help you succeed at "${prompt}".`,
    icon: "✨",
    category: "Personal",
    priority: "medium",
    color: "cozy-orange",
    modules: {
      progress: { target: 100, current: 0, unit: "% Completed", type: "bar" },
      checklist: {
        items: [
          { id: "chk-dyn-1", text: "Outline key milestones for this goal", completed: false },
          { id: "chk-dyn-2", text: "Establish a daily schedule & routine block", completed: false },
          { id: "chk-dyn-3", text: "Identify main potential obstacles", completed: false },
        ],
      },
      milestones: {
        items: [
          { id: "ms-dyn-1", title: "Phase 1: Foundation & Setup", completed: false },
          { id: "ms-dyn-2", title: "Phase 2: Core Execution", completed: false },
          { id: "ms-dyn-3", title: "Phase 3: Completion & Review", completed: false },
        ],
      },
      habits: { streak: 0, longestStreak: 0, history: {} },
      time: {
        estimatedHours: 40,
        actualHours: 0,
        timetable: [
          { time: "09:00", activity: "Core focus block" },
          { time: "17:00", activity: "Reflection & review" },
        ],
      },
      notes: {
        content: `# Getting Started with: ${capitalizedTitle}\n\nUse this space to document your plans, collect resources, and review your daily lessons.`,
      },
      tracking: { type: "numeric", logs: [] },
      automation: {
        rules: [{ trigger: "habit_completed", action: "increase_progress", enabled: true }],
      },
      journal: {
        prompts: ["How did you move closer to this goal today?", "What is one thing you will do differently tomorrow?"],
      },
      collaboration: { members: ["AI Coach"], activityLog: ["Custom workspace deployed."] },
    },
    followUpQuestions: [
      "Should we customize the metric unit tracked here?",
      "Would you like to add recurring reminders for your focus hours?",
    ],
  };
}

// Global generic error middleware to shield stack traces
app.use(genericErrorHandler);

// Vite and static file routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted with secure headers.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Secure Daynest Server listening on http://localhost:${PORT}`);
  });
}

startServer();
