import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MessageSquare, Lock, User, Key, Sun, Moon, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { signUp, login, sendOtp, verifyOtp } from '../services/api';
import GlassCard from '../components/GlassCard';

/* ── Animation variants ────────────────────────── */
const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [existingUser] = useState(getStoredUser);
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ uniqueId: '', name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // OTP state
  const [otpStep, setOtpStep] = useState(false); // true = showing OTP input
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Sync theme class with HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Redirect if already logged in
  useEffect(() => {
    if (existingUser) navigate('/groups', { replace: true });
  }, [existingUser, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  // ── Handle Login ──────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (form.password.length < 3) {
      toast.error('Password must be at least 3 characters');
      return;
    }
    setLoading(true);
    try {
      const user = await login({
        uniqueId: form.uniqueId,
        password: form.password,
      });
      localStorage.setItem(
        'user',
        JSON.stringify({ uniqueId: user.uniqueId, name: user.name }),
      );
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/groups');
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Send OTP on sign-up form submit ───
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.uniqueId.trim()) {
      toast.error('Please enter your College ID');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Please enter your display name');
      return;
    }
    if (form.password.length < 3) {
      toast.error('Password must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(form.uniqueId.trim());
      toast.success('OTP sent to your college email!');
      setOtpStep(true);
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(60);
      // Focus first OTP input after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to send OTP';
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtpLoading(true);
    try {
      await sendOtp(form.uniqueId.trim());
      toast.success('OTP resent!');
      setOtpDigits(['', '', '', '', '', '']);
      setCountdown(60);
      otpRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Failed to resend OTP';
      toast.error(String(msg));
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 2: Verify OTP & complete registration ─
  const handleVerifyAndRegister = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      await verifyOtp(form.uniqueId.trim(), otp);
      toast.success('Email verified!');

      // Now complete registration
      await signUp({
        uniqueId: form.uniqueId.trim(),
        name: form.name.trim(),
        password: form.password,
      });
      toast.success('Account created! Logging you in…');

      const user = await login({
        uniqueId: form.uniqueId.trim(),
        password: form.password,
      });
      localStorage.setItem(
        'user',
        JSON.stringify({ uniqueId: user.uniqueId, name: user.name }),
      );
      navigate('/groups');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Verification failed';
      toast.error(String(msg));
    } finally {
      setOtpLoading(false);
    }
  };

  // ── OTP Input handlers ────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // single digit
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newDigits.every((d) => d !== '')) {
      setTimeout(() => handleVerifyAndRegister(), 200);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyAndRegister();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => d === '');
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    // Auto-submit if full OTP pasted
    if (pasted.length === 6) {
      setTimeout(() => handleVerifyAndRegister(), 200);
    }
  };

  // ── Go back from OTP step ─────────────────────
  const handleBackFromOtp = () => {
    setOtpStep(false);
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(0);
  };

  // Reset OTP state when switching tabs
  const handleTabSwitch = (idx) => {
    setIsSignUp(idx === 1);
    setOtpStep(false);
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(0);
  };

  if (existingUser) return null;

  return (
    <motion.div
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex items-center justify-center p-4 py-8 bg-page transition-colors duration-300 overflow-y-auto"
    >
      {/* ── Theme Toggle Button ───────────────────── */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl border border-border/80 bg-surface/50 text-secondary hover:text-primary transition-all duration-200 focus-ring cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} className="interactive-icon" /> : <Moon size={18} className="interactive-icon" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* ── Logo ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-5"
        >
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 mb-4 text-brand"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MessageSquare size={26} />
          </motion.div>
          <h1 className="text-4xl font-semibold text-primary tracking-tight">
            Free Chat
          </h1>
          <p className="text-secondary mt-1.5 text-sm">
            Real-time messaging on your local network
          </p>
        </motion.div>

        {/* ── Card ───────────────────────────────── */}
        <GlassCard className="p-6 sm:p-7">
          {/* Tabs */}
          <div className="flex mb-6 bg-sidebar rounded-xl p-1 border border-border/60">
            {['Login', 'Sign Up'].map((label, i) => {
              const active = (i === 0 && !isSignUp) || (i === 1 && isSignUp);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleTabSwitch(i)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer focus-ring ${
                    active
                      ? 'bg-surface text-primary border border-border/40 shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ── LOGIN FORM ─────────────────────── */}
            {!isSignUp && (
              <motion.form
                key="login"
                variants={stagger}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                onSubmit={handleLogin}
                className="space-y-3"
              >
                {/* College ID */}
                <motion.div variants={slideUp}>
                  <label className="block text-xs font-medium text-secondary mb-1.5 ml-0.5 tracking-wide">
                    College ID
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary/50 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 727723EUIT042"
                      value={form.uniqueId}
                      onChange={set('uniqueId')}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-surface/40 border border-border/80 rounded-xl text-primary placeholder-secondary/40 text-sm outline-none transition-all duration-250 focus:border-brand focus-ring"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={slideUp}>
                  <label className="block text-xs font-medium text-secondary mb-1.5 ml-0.5 tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary/50 pointer-events-none">
                      <Key size={15} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={set('password')}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-surface/40 border border-border/80 rounded-xl text-primary placeholder-secondary/40 text-sm outline-none transition-all duration-250 focus:border-brand focus-ring"
                    />
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.div variants={slideUp} className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-brand hover:bg-brand/90 text-brand-text font-medium rounded-xl transition-all duration-200 focus-ring cursor-pointer shadow-[0_4px_12px_rgba(216,90,48,0.12)] dark:shadow-[0_4px_12px_rgba(232,120,79,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </motion.div>
              </motion.form>
            )}

            {/* ── SIGN UP: STEP 1 (Details) ─────── */}
            {isSignUp && !otpStep && (
              <motion.form
                key="signup-details"
                variants={stagger}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                onSubmit={handleSendOtp}
                className="space-y-3"
              >
                {/* College ID */}
                <motion.div variants={slideUp}>
                  <label className="block text-xs font-medium text-secondary mb-1.5 ml-0.5 tracking-wide">
                    College ID
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary/50 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 727723EUIT042"
                      value={form.uniqueId}
                      onChange={set('uniqueId')}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-surface/40 border border-border/80 rounded-xl text-primary placeholder-secondary/40 text-sm outline-none transition-all duration-250 focus:border-brand focus-ring"
                    />
                  </div>
                  <p className="text-xs text-secondary/60 mt-1 ml-0.5">
                    OTP will be sent to <span className="text-brand font-medium">{form.uniqueId || '…'}@skcet.ac.in</span>
                  </p>
                </motion.div>

                {/* Display Name */}
                <motion.div variants={slideUp}>
                  <label className="block text-xs font-medium text-secondary mb-1.5 ml-0.5 tracking-wide">
                    Display Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary/50 pointer-events-none">
                      <User size={15} />
                    </span>
                    <input
                      type="text"
                      placeholder="Your name in chats"
                      value={form.name}
                      onChange={set('name')}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-surface/40 border border-border/80 rounded-xl text-primary placeholder-secondary/40 text-sm outline-none transition-all duration-250 focus:border-brand focus-ring"
                    />
                  </div>
                </motion.div>

                {/* Password */}
                <motion.div variants={slideUp}>
                  <label className="block text-xs font-medium text-secondary mb-1.5 ml-0.5 tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary/50 pointer-events-none">
                      <Key size={15} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={set('password')}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-surface/40 border border-border/80 rounded-xl text-primary placeholder-secondary/40 text-sm outline-none transition-all duration-250 focus:border-brand focus-ring"
                    />
                  </div>
                </motion.div>

                {/* Submit → Send OTP */}
                <motion.div variants={slideUp} className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-brand hover:bg-brand/90 text-brand-text font-medium rounded-xl transition-all duration-200 focus-ring cursor-pointer shadow-[0_4px_12px_rgba(216,90,48,0.12)] dark:shadow-[0_4px_12px_rgba(232,120,79,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending OTP…
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Mail size={16} />
                        Verify Email & Create Account
                      </span>
                    )}
                  </button>
                </motion.div>
              </motion.form>
            )}

            {/* ── SIGN UP: STEP 2 (OTP Verification) ── */}
            {isSignUp && otpStep && (
              <motion.div
                key="signup-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: { duration: 0.3 } }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                className="space-y-4"
              >
                {/* Back button + heading */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackFromOtp}
                    className="p-1.5 rounded-lg border border-border/60 text-secondary hover:text-primary hover:border-border transition-all cursor-pointer focus-ring"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold text-primary">Verify Your Email</h3>
                    <p className="text-xs text-secondary/70">
                      Enter the 6-digit code sent to <span className="text-brand font-medium">{form.uniqueId}@skcet.ac.in</span>
                    </p>
                  </div>
                </div>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-lg font-semibold bg-surface/40 border border-border/80 rounded-xl text-primary outline-none transition-all duration-200 focus:border-brand focus:shadow-[0_0_0_3px_rgba(216,90,48,0.1)] focus-ring"
                    />
                  ))}
                </div>

                {/* Timer + Resend */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-secondary/70">
                      Resend OTP in <span className="text-brand font-semibold tabular-nums">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpLoading}
                      className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand/80 font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={otpLoading ? 'animate-spin' : ''} />
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleVerifyAndRegister}
                  disabled={otpLoading || otpDigits.some((d) => d === '')}
                  className="w-full py-2.5 bg-brand hover:bg-brand/90 text-brand-text font-medium rounded-xl transition-all duration-200 focus-ring cursor-pointer shadow-[0_4px_12px_rgba(216,90,48,0.12)] dark:shadow-[0_4px_12px_rgba(232,120,79,0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying…
                    </span>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-secondary/70 mt-6 tracking-wide"
        >
          Secure network-bound chat and collaboration
        </motion.p>
      </div>
    </motion.div>
  );
}
