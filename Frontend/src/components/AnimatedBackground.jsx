import { motion } from 'framer-motion';

/**
 * Full-viewport animated gradient mesh — WhatsApp dark teal tones.
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0b141a]">
      {/* ── Teal orb ─────────────────────────────── */}
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(0,168,132,0.4) 0%, transparent 70%)',
          top: '5%',
          left: '10%',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [0, 120, -60, 90, 0],
          y: [0, -100, 70, -50, 0],
          scale: [1, 1.2, 0.9, 1.15, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Dark-green orb ───────────────────────── */}
      <motion.div
        className="absolute w-[520px] h-[520px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0,92,75,0.4) 0%, transparent 70%)',
          top: '45%',
          right: '5%',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, -80, 50, -70, 0],
          y: [0, 60, -90, 40, 0],
          scale: [1, 0.9, 1.18, 0.95, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Subtle green orb ─────────────────────── */}
      <motion.div
        className="absolute w-[360px] h-[360px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(37,211,102,0.3) 0%, transparent 70%)',
          bottom: '8%',
          left: '35%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 70, -40, 60, 0],
          y: [0, -70, 50, -30, 0],
          scale: [1, 1.12, 0.88, 1.06, 1],
        }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Subtle grid overlay ──────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
