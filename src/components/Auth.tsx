/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
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

      const data = await res.json();
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

      const data = await res.json();
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

      const data = await res.json();
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

      const data = await res.json();
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
