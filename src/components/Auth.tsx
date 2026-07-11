/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { googleSignIn } from "../lib/googleAuth";
import { Mail, Lock, User, Key, Sparkles, CheckCircle, Smartphone } from "lucide-react";

interface AuthProps {
  onSuccess: (id: string, name: string, email: string, role: string, subscription_status: string) => void;
  onBackToOnboarding: () => void;
}

export default function Auth({ onSuccess, onBackToOnboarding }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [isVerifyEmail, setIsVerifyEmail] = useState(false);

  // Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await googleSignIn();
      if (!result) {
        throw new Error("Google sign-in returned no credentials.");
      }

      const { user } = result;

      // Exchange with backend
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: await user.getIdToken(),
          name: user.displayName,
          email: user.email
        }),
      });

      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error("Backend server is not running (e.g. static Vercel deployment). Cannot process login."); }
      if (!res.ok) {
        throw new Error(data.error || "Backend exchange failed.");
      }

      if (data.token) {
        localStorage.setItem("voice_journal_token", data.token);
      }

      setSuccessMsg(`Welcome to Daynest, ${data.user.name}! 🐾`);
      setTimeout(() => {
        onSuccess(data.user.id, data.user.name, data.user.email, data.user.role, data.user.subscription_status);
      }, 1000);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("closed")) {
        // user closed popup, ignore
      } else {
        setError(err.message || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error("Backend server is not running (e.g. static Vercel deployment). Cannot process login."); }
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      if (data.token) {
        localStorage.setItem("voice_journal_token", data.token);
      }

      setSuccessMsg(`Welcome back to Daynest, ${data.user.name}! 🐾`);
      setTimeout(() => {
        onSuccess(data.user.id, data.user.name, data.user.email, data.user.role, data.user.subscription_status);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error("Backend server is not running (e.g. static Vercel deployment). Cannot process login."); }
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccessMsg("Account created! Verify code has been printed.");
      setVerificationToken(data.verificationToken || "");
      setIsVerifyEmail(true);
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationToken) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });

      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error("Backend server is not running (e.g. static Vercel deployment). Cannot process login."); }
      if (!res.ok) {
        throw new Error(data.error || "Email verification failed.");
      }

      setSuccessMsg("Email verified successfully! You can now log in.");
      setTimeout(() => {
        setIsVerifyEmail(false);
        setIsLogin(true);
        setPassword("");
        setVerificationToken("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/reset-password-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error("Backend server is not running (e.g. static Vercel deployment). Cannot process login."); }
      if (!res.ok) {
        throw new Error(data.error || "Reset request failed.");
      }

      setSuccessMsg("Reset code generated! Proceed to update password.");
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setIsResetPassword(true);
        setIsForgotPassword(false);
      }
    } catch (err: any) {
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { throw new Error("Backend server is not running (e.g. static Vercel deployment). Cannot process login."); }
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setSuccessMsg("Password reset successfully! Log in with your new password.");
      setTimeout(() => {
        setIsResetPassword(false);
        setIsLogin(true);
        setPassword("");
        setResetToken("");
        setNewPassword("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center bg-cozy-bg text-cozy-text-dark p-6 relative overflow-hidden"
      id="auth_screen"
    >
      {/* Decorative organic background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-60 h-60 rounded-full bg-cozy-yellow/20 blur-[50px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 rounded-full bg-cozy-orange/15 blur-[50px] pointer-events-none" />

      <div className="w-full z-10 py-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 mb-3 px-3.5 py-1 bg-cozy-yellow rounded-full border-2 border-cozy-text-dark shadow-sm"
        >
          <Sparkles size={13} className="text-cozy-accent animate-pulse" />
          <span className="text-[10px] font-black text-cozy-text-dark uppercase tracking-widest">
            Cozy Self-Reflection
          </span>
        </motion.div>
        <h1 className="text-3xl font-black tracking-tight text-cozy-text-dark">Daynest</h1>
        <p className="text-cozy-text-muted text-xs font-bold mt-1">
          Reflect naturally. Nest your goals perfectly.
        </p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-cozy-card border-3 border-cozy-text-dark p-6 rounded-3xl cozy-shadow z-10 my-4"
      >
        <AnimatePresence mode="wait">
          {/* Email Verification State */}
          {isVerifyEmail && (
            <motion.div
              key="verify-email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-black text-cozy-text-dark uppercase tracking-wider mb-2">
                Verify Your Nest
              </h2>
              <p className="text-cozy-text-muted text-xs">
                Enter the verification token generated by our secure Daynest server to complete registration:
              </p>
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">
                    Verification Code
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Paste verification token here"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-mono tracking-wide transition text-cozy-text-dark"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border-2 border-rose-200 p-2.5 rounded-xl text-center font-bold">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="text-xs text-cozy-green bg-emerald-50 border-2 border-cozy-green p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle size={14} />
                    <span>{successMsg}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cozy-orange text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow disabled:opacity-50 tactile-btn-retro"
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
              <button
                onClick={() => {
                  setIsVerifyEmail(false);
                  setIsLogin(true);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-cozy-text-muted hover:text-cozy-text-dark font-black text-center w-full mt-2"
              >
                Go back to Sign In
              </button>
            </motion.div>
          )}

          {/* Forgot Password State */}
          {isForgotPassword && !isResetPassword && !isVerifyEmail && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-black text-cozy-text-dark uppercase tracking-wider mb-2">
                Forgot Password
              </h2>
              <p className="text-cozy-text-muted text-xs">
                Enter your email. The secure server will generate an offline password reset token.
              </p>
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="email"
                      placeholder="william@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border-2 border-rose-200 p-2.5 rounded-xl text-center font-bold">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="text-xs text-cozy-green bg-emerald-50 border-2 border-cozy-green p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle size={14} />
                    <span>{successMsg}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cozy-orange text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow disabled:opacity-50 tactile-btn-retro"
                >
                  {loading ? "Generating reset token..." : "Generate Reset Code"}
                </button>
              </form>
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-cozy-text-muted hover:text-cozy-text-dark font-black text-center w-full mt-2"
              >
                Go back to Sign In
              </button>
            </motion.div>
          )}

          {/* Reset Password State */}
          {isResetPassword && !isVerifyEmail && (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-black text-cozy-text-dark uppercase tracking-wider mb-2">
                Set New Password
              </h2>
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">
                    Reset Token
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Paste your reset code here"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-mono tracking-wide transition text-cozy-text-dark"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">
                    Create New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                      required
                    />
                  </div>
                </div>
                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border-2 border-rose-200 p-2.5 rounded-xl text-center font-bold">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="text-xs text-cozy-green bg-emerald-50 border-2 border-cozy-green p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle size={14} />
                    <span>{successMsg}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cozy-orange text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow disabled:opacity-50 tactile-btn-retro"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </motion.div>
          )}

          {/* Standard Login & Registration Form */}
          {!isVerifyEmail && !isForgotPassword && !isResetPassword && (
            <motion.div
              key="standard-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Navigation Tabs */}
              <div className="flex justify-around border-b-2 border-cozy-text-dark pb-3 mb-5">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`text-xs font-black uppercase tracking-wider pb-1 px-3 transition relative ${
                    isLogin ? "text-cozy-accent" : "text-cozy-text-muted hover:text-cozy-text-dark"
                  }`}
                >
                  Sign In
                  {isLogin && (
                    <motion.div
                      className="absolute bottom-[-5px] left-0 right-0 h-1 bg-cozy-orange rounded-full"
                      layoutId="authTab"
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className={`text-xs font-black uppercase tracking-wider pb-1 px-3 transition relative ${
                    !isLogin ? "text-cozy-accent" : "text-cozy-text-muted hover:text-cozy-text-dark"
                  }`}
                >
                  Create Nest
                  {!isLogin && (
                    <motion.div
                      className="absolute bottom-[-5px] left-0 right-0 h-1 bg-cozy-orange rounded-full"
                      layoutId="authTab"
                    />
                  )}
                </button>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                      <input
                        type="text"
                        placeholder="William"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="email"
                      placeholder="william@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block">
                      Password
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[9px] font-black text-cozy-text-muted hover:text-cozy-accent transition"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border-2 border-rose-200 p-2.5 rounded-xl text-center font-bold">
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div className="text-xs text-cozy-green bg-emerald-50 border-2 border-cozy-green p-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle size={14} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cozy-orange text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow mt-2 disabled:opacity-50 tactile-btn-retro"
                >
                  {loading ? "Verifying with server..." : isLogin ? "Sign In" : "Register Nest"}
                </button>

                {isLogin && (
                  <>
                    <div className="flex items-center gap-3 my-3">
                      <div className="h-[2px] bg-cozy-text-dark opacity-20 flex-1"></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-cozy-text-muted">or</span>
                      <div className="h-[2px] bg-cozy-text-dark opacity-20 flex-1"></div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-3 bg-[#FFFBF4] hover:bg-[#FDF4E5] text-cozy-text-dark font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow flex items-center justify-center gap-2 disabled:opacity-50 transition duration-150 tactile-btn-retro"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      <span>Sign In with Google</span>
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Back navigation */}
      <button
        onClick={onBackToOnboarding}
        className="text-xs text-cozy-text-muted hover:text-cozy-text-dark font-black text-center mt-2 z-10"
      >
        ← Back to Onboarding Tour
      </button>
    </div>
  );
}
