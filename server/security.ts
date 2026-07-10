import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";

// Retrieve or derive a stable secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || "cozy-daynest-super-secret-jwt-signing-key-1024";

// Extended Request types
export interface SecureRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    subscription_status: string;
    stripe_subscription_id?: string;
    subscription_plan?: string;
    subscription_period_end?: string;
    subscription_cancel_at_period_end?: number;
    subscription_trial_end?: string;
  };
  session?: {
    id: string;
    user_id: string;
    expires_at: string;
  };
}

/**
 * Sign a secure JWT session token
 */
export function signSessionToken(payload: { userId: string; sessionId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify session cookie and load authenticated user & session
 */
export async function authenticateSession(req: SecureRequest, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    let token = cookies["session_token"];

    // Fallback to Authorization Bearer header (crucial for iframe environments where third-party cookies are blocked)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer" && parts[1]) {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    }

    const { userId, sessionId } = decoded;

    // Check sessions table to verify device session is active
    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return res.status(401).json({ error: "Session has been revoked or expired." });
    }

    // Check session expiration
    if (Date.now() > new Date(session.expires_at).getTime()) {
      await db.deleteSession(sessionId);
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    // Load user
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User associated with this session no longer exists." });
    }

    // Secure fallback: Downgrade subscription to 'free' if subscription_period_end is in the past
    let finalStatus = user.subscription_status;
    if (finalStatus === "premium" && user.subscription_period_end) {
      const periodEndTime = new Date(user.subscription_period_end).getTime();
      // Add a small grace period buffer of 1 hour just in case of slight timing issues
      if (Date.now() > (periodEndTime + 3600 * 1000)) {
        console.log(`[SUBSCRIPTION FALLBACK] Period end ${user.subscription_period_end} passed for user ${user.id}. Downgrading to free.`);
        await db.updateUser(user.id, { subscription_status: 'free', subscription_plan: 'free' });
        finalStatus = "free";
      }
    }

    // Attach user metadata to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription_status: finalStatus,
      stripe_subscription_id: user.stripe_subscription_id,
      subscription_plan: user.subscription_plan,
      subscription_period_end: user.subscription_period_end,
      subscription_cancel_at_period_end: user.subscription_cancel_at_period_end,
      subscription_trial_end: user.subscription_trial_end,
    };

    req.session = {
      id: session.id,
      user_id: session.user_id,
      expires_at: session.expires_at,
    };

    next();
  } catch (error) {
    return res.status(500).json({ error: "An authentication error occurred on the server." });
  }
}

/**
 * Optional session authenticator (does not return 401 on failure)
 */
export async function authenticateSessionOptional(req: SecureRequest, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    let token = cookies["session_token"];

    // Fallback to Authorization Bearer header (crucial for iframe environments where third-party cookies are blocked)
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts[0] === "Bearer" && parts[1]) {
        token = parts[1];
      }
    }

    if (!token) {
      return next();
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next();
    }

    const { userId, sessionId } = decoded;

    const session = await db.getSession(sessionId, userId);
    if (!session) {
      return next();
    }

    if (Date.now() > new Date(session.expires_at).getTime()) {
      return next();
    }

    const user = await db.getUserById(userId);
    if (!user) {
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription_status: user.subscription_status,
      stripe_subscription_id: user.stripe_subscription_id,
      subscription_plan: user.subscription_plan,
      subscription_period_end: user.subscription_period_end,
      subscription_cancel_at_period_end: user.subscription_cancel_at_period_end,
      subscription_trial_end: user.subscription_trial_end,
    };

    req.session = {
      id: session.id,
      user_id: session.user_id,
      expires_at: session.expires_at,
    };

    next();
  } catch (error) {
    next();
  }
}

/**
 * Basic cookie parsing helper
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts.shift()?.trim();
    const value = parts.join("=")?.trim();
    if (name) {
      list[name] = decodeURIComponent(value || "");
    }
  });
  return list;
}

/**
 * Authorization: Require active subscription (Premium status check)
 */
export function requirePremium(req: SecureRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (req.user.subscription_status !== "premium") {
    // Return HTTP 402 Payment Required as explicitly requested
    return res.status(402).json({ error: "This feature is restricted to Daynest Premium members." });
  }

  next();
}

/**
 * Memory-based Rate Limiter (production resilient, non-blocking)
 */
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const rateLimitStore: Record<string, Record<string, { count: number; resetTime: number }>> = {};

export function rateLimiter(limitKey: string, config: RateLimitConfig) {
  if (!rateLimitStore[limitKey]) {
    rateLimitStore[limitKey] = {};
  }
  const store = rateLimitStore[limitKey];

  return (req: Request, res: Response, next: NextFunction) => {
    // Extract IP safely from headers
    const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown-ip";
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return next();
    }

    store[ip].count++;

    if (store[ip].count > config.max) {
      return res.status(429).json({ error: config.message });
    }

    next();
  };
}

/**
 * XSS & Malformed HTML Sanitizer (converts tags to safe string entities)
 */
export function sanitizeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Generic string length validation helper
 */
export function validateLength(str: string | undefined, max: number, min = 0): boolean {
  if (!str) return min === 0;
  return str.length >= min && str.length <= max;
}

/**
 * Safe Email Validator
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Security log helper (OWASP compliant: no passwords, prompt texts or payment secrets)
 */
export function logSecurityEvent(userId: string | null, endpoint: string, statusCode: number) {
  const logEntry = {
    userId: userId || "anonymous",
    endpoint,
    timestamp: new Date().toISOString(),
    statusCode,
  };
  console.log(`[SECURITY EVENT] ${JSON.stringify(logEntry)}`);
}

/**
 * Private Storage Signed URL Helpers
 */
export function generateSignedUrl(fileId: string, expiresInMinutes = 30): string {
  const expires = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const stringToSign = `fileId=${fileId}&expires=${expires}`;
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(stringToSign)
    .digest("hex");
    
  return `/api/voice/download?id=${fileId}&expires=${expires}&sig=${signature}`;
}

export function verifySignedUrlSignature(fileId: string, expires: string, sig: string): boolean {
  const expireTime = parseInt(expires, 10);
  if (isNaN(expireTime) || Date.now() / 1000 > expireTime) {
    return false; // Expired
  }

  const stringToSign = `fileId=${fileId}&expires=${expires}`;
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(stringToSign)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"));
}
