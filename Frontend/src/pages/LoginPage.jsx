import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { signUp, login } from '../services/api';
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
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ── Helpers ───────────────────────────────────── */
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

/* ── Component ─────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const [existingUser] = useState(getStoredUser);
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ uniqueId: '', name: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (existingUser) navigate('/groups', { replace: true });
  }, [existingUser, navigate]);

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* ── Client-side validation ───────────────── */
  
    if (form.password.length < 3) {
      toast.error('Password must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp({
          uniqueId: form.uniqueId,
          name: form.name.trim(),
          password: form.password,
        });
        toast.success('Account created! Logging you in…');
        // auto-login after signup — backend returns User object
        const user = await login({
          uniqueId: form.uniqueId,
          password: form.password,
        });
        localStorage.setItem(
          'user',
          JSON.stringify({ uniqueId: user.uniqueId, name: user.name }),
        );
        navigate('/groups');
      } else {
        // backend returns User object { uniqueId, name, ... }
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
      }
    } catch {
      /* already toasted by api service */
    } finally {
      setLoading(false);
    }
  };

  if (existingUser) return null;

  return (
    <motion.div
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* ── Logo ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-10"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00a884]/15 border border-[#00a884]/15 mb-5"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-3xl">💬</span>
          </motion.div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-[#25d366] to-[#00a884] bg-clip-text text-transparent tracking-tight">
            Free Chat
          </h1>
          <p className="text-[#8696a0] mt-2 text-sm tracking-wide">
            Real-time messaging and Code & File Sharing on your local network
          </p>
        </motion.div>

        {/* ── Card ───────────────────────────────── */}
        <GlassCard className="p-7 sm:p-8">
          {/* Tabs */}
          <div className="flex mb-7 bg-[#111b21] rounded-xl p-1 border border-[#2a3942]">
            {['Login', 'Sign Up'].map((label, i) => (
              <motion.button
                key={label}
                onClick={() => setIsSignUp(i === 1)}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
                  (i === 0 && !isSignUp) || (i === 1 && isSignUp)
                    ? 'bg-[#00a884]/15 text-[#e9edef] border border-[#00a884]/20 shadow-sm'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Form */}
          <motion.form
            key={isSignUp ? 's' : 'l'}
            variants={stagger}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* College ID */}
            <motion.div variants={slideUp}>
              <label className="block text-[11px] font-medium text-[#8696a0] mb-1.5 ml-1 uppercase tracking-wider">
                College ID
              </label>
              <input
                type="text"
                placeholder="727723EUIT042"
                value={form.uniqueId}
                onChange={set('uniqueId')}
                required
                className="w-full px-4 py-3 bg-[#2a3942]/50 border border-[#2a3942] rounded-xl text-[#e9edef] placeholder-[#8696a0]/60 text-sm outline-none transition-all duration-300 focus:border-[#00a884]/50"
              />
            </motion.div>

            {/* Display Name */}
            {isSignUp &&<motion.div variants={slideUp}>
              <label className="block text-[11px] font-medium text-[#8696a0] mb-1.5 ml-1 uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name in chats"
                value={form.name}
                onChange={set('name')}
                required
                className="w-full px-4 py-3 bg-[#2a3942]/50 border border-[#2a3942] rounded-xl text-[#e9edef] placeholder-[#8696a0]/60 text-sm outline-none transition-all duration-300 focus:border-[#00a884]/50"
              />
            </motion.div>
            }
            {/* Password */}
            <motion.div variants={slideUp}>
              <label className="block text-[11px] font-medium text-[#8696a0] mb-1.5 ml-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                required
                className="w-full px-4 py-3 bg-[#2a3942]/50 border border-[#2a3942] rounded-xl text-[#e9edef] placeholder-[#8696a0]/60 text-sm outline-none transition-all duration-300 focus:border-[#00a884]/50"
              />
            </motion.div>

            {/* Submit */}
            <motion.div variants={slideUp} className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_28px_rgba(0,168,132,0.25)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing…
                  </span>
                ) : isSignUp ? (
                  'Create Account'
                ) : (
                  'Login'
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </GlassCard>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-[11px] text-[#8696a0]/70 mt-6 tracking-wide"
        >
          Free and Timed Chat & code and files Sharing
        </motion.p>
      </div>
    </motion.div>
  );
}
