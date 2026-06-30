/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, Key, Sparkles, CheckCircle } from 'lucide-react';

interface AuthProps {
  onSuccess: (name: string, email: string) => void;
  onBackToOnboarding: () => void;
}

export default function Auth({ onSuccess, onBackToOnboarding }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [usePhoneOtp, setUsePhoneOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // High fidelity simulated authentication validation
    setTimeout(() => {
      if (usePhoneOtp) {
        if (!phone) {
          setError("Please enter a valid phone number.");
          setLoading(false);
          return;
        }
        if (!otpSent) {
          setOtpSent(true);
          setLoading(false);
          setSuccessMsg("Cozy OTP sent! Use code '123456' to log in.");
          return;
        } else {
          if (otp !== "123456") {
            setError("Incorrect OTP code. Please enter '123456'.");
            setLoading(false);
            return;
          }
          setSuccessMsg("Phone authenticated successfully!");
          setTimeout(() => {
            onSuccess("William", "william.otp@example.com");
          }, 1000);
        }
      } else {
        if (isLogin) {
          const loginEmail = email || "william@example.com";
          const resolvedName = loginEmail.split('@')[0];
          const displayName = resolvedName.charAt(0).toUpperCase() + resolvedName.slice(1);
          setSuccessMsg(`Welcome back to Daynest, ${displayName}! 🐾`);
          setTimeout(() => {
            onSuccess(displayName, loginEmail);
          }, 1000);
        } else {
          if (!name || !email || !password) {
            setError("Please fill in all standard fields.");
            setLoading(false);
            return;
          }
          setSuccessMsg("Your nesting spot is created! 🏡");
          setTimeout(() => {
            onSuccess(name, email);
          }, 1000);
        }
      }
    }, 1200);
  };

  const handleOAuthLogin = (provider: string) => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setSuccessMsg(`Authenticated via ${provider}!`);
      setTimeout(() => {
        onSuccess("William", "william@gmail.com");
      }, 1000);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-center bg-cozy-bg text-cozy-text-dark p-6 relative overflow-hidden" id="auth_screen">
      
      {/* Decorative organic shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-60 h-60 rounded-full bg-cozy-yellow/20 blur-[50px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 rounded-full bg-cozy-orange/15 blur-[50px] pointer-events-none" />

      <div className="w-full z-10 py-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 mb-3 px-3.5 py-1 bg-cozy-yellow rounded-full border-2 border-cozy-text-dark shadow-sm"
        >
          <Sparkles size={13} className="text-cozy-accent animate-pulse" />
          <span className="text-[10px] font-black text-cozy-text-dark uppercase tracking-widest">Cozy Self-Reflection</span>
        </motion.div>
        <h1 className="text-3xl font-black tracking-tight text-cozy-text-dark">
          Daynest
        </h1>
        <p className="text-cozy-text-muted text-xs font-bold mt-1">Reflect naturally. Nest your goals perfectly.</p>
      </div>

      {/* Auth Card Container */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-cozy-card border-3 border-cozy-text-dark p-6 rounded-3xl cozy-shadow z-10 my-4"
      >
        {/* Navigation Tabs */}
        <div className="flex justify-between border-b-2 border-cozy-text-dark pb-3 mb-5">
          <button
            onClick={() => {
              setIsLogin(true);
              setUsePhoneOtp(false);
              setOtpSent(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-xs font-black uppercase tracking-wider pb-1 px-1 transition relative ${
              isLogin && !usePhoneOtp ? 'text-cozy-accent' : 'text-cozy-text-muted hover:text-cozy-text-dark'
            }`}
          >
            Sign In
            {isLogin && !usePhoneOtp && (
              <motion.div className="absolute bottom-[-5px] left-0 right-0 h-1 bg-cozy-orange rounded-full" layoutId="authTab" />
            )}
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setUsePhoneOtp(false);
              setOtpSent(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-xs font-black uppercase tracking-wider pb-1 px-1 transition relative ${
              !isLogin && !usePhoneOtp ? 'text-cozy-accent' : 'text-cozy-text-muted hover:text-cozy-text-dark'
            }`}
          >
            Create Nest
            {!isLogin && !usePhoneOtp && (
              <motion.div className="absolute bottom-[-5px] left-0 right-0 h-1 bg-cozy-orange rounded-full" layoutId="authTab" />
            )}
          </button>
          <button
            onClick={() => {
              setUsePhoneOtp(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`text-xs font-black uppercase tracking-wider pb-1 px-1 transition relative ${
              usePhoneOtp ? 'text-cozy-accent' : 'text-cozy-text-muted hover:text-cozy-text-dark'
            }`}
          >
            Phone Log
            {usePhoneOtp && (
              <motion.div className="absolute bottom-[-5px] left-0 right-0 h-1 bg-cozy-orange rounded-full" layoutId="authTab" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {usePhoneOtp ? (
              <motion.div
                key="phone-otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-cozy-text-muted text-xs font-black border-r-2 border-cozy-text-dark pr-2">+91</span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={otpSent}
                      className="w-full pl-14 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition"
                      required
                    />
                  </div>
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">6-Digit Cozy Key</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Enter 123456"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-center tracking-widest font-mono"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : isLogin ? (
              <motion.div
                key="login-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="email"
                      placeholder="william@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block">Cozy Password</label>
                    <a href="#forgot" className="text-[9px] font-black text-cozy-text-muted hover:text-cozy-accent transition">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-2.5 text-cozy-text-muted w-4 h-4" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-cozy-card border-2 border-cozy-text-dark focus:border-cozy-orange outline-none rounded-xl text-xs font-bold transition text-cozy-text-dark"
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-fields"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">Full Name</label>
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
                <div>
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">Email Address</label>
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
                  <label className="text-[10px] text-cozy-text-muted font-bold uppercase tracking-wider block mb-1">Create Password</label>
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
              </motion.div>
            )}
          </AnimatePresence>

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
            className="w-full py-3 bg-cozy-orange hover:bg-cozy-accent text-white font-black text-xs uppercase tracking-widest border-3 border-cozy-text-dark rounded-2xl cozy-shadow hover:translate-y-0.5 transition mt-2 disabled:opacity-50"
          >
            {loading ? "Warming up..." : usePhoneOtp ? (otpSent ? "Verify OTP Code" : "Send Cozy OTP") : isLogin ? "Sign In" : "Register Nest"}
          </button>
        </form>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-cozy-text-dark opacity-30"></div>
          </div>
          <span className="relative bg-cozy-card px-3 text-[9px] text-cozy-text-muted font-black uppercase tracking-widest">Or Nest With</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuthLogin("Google")}
            className="flex items-center justify-center gap-2 py-2.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl text-xs font-black text-cozy-text-dark hover:bg-cozy-bg transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.423 1.908 15.54 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.743-.078-1.313-.178-1.875H12.24z"/>
            </svg>
            <span>Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin("Apple")}
            className="flex items-center justify-center gap-2 py-2.5 bg-cozy-card border-2 border-cozy-text-dark rounded-xl text-xs font-black text-cozy-text-dark hover:bg-cozy-bg transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.19.12.29.12.87 0 1.95-.57 2.52-1.45z"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>
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
