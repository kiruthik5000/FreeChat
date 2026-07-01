import { motion } from 'framer-motion';

/**
 * Full-viewport animated gradient mesh using custom theme tokens.
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-page transition-colors duration-300">
      {/* ── Accent orb 1 ─────────────────────────────── */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full opacity-[0.14] dark:opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          top: '5%',
          left: '10%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, -60, 40, -30, 0],
          scale: [1, 1.15, 0.95, 1.1, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Accent orb 2 ───────────────────────── */}
      <motion.div
        className="absolute w-[550px] h-[550px] rounded-full opacity-[0.12] dark:opacity-[0.06]"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          top: '45%',
          right: '5%',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, -60, 30, -50, 0],
          y: [0, 40, -60, 20, 0],
          scale: [1, 0.95, 1.15, 0.98, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Subtle grid overlay ──────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}
