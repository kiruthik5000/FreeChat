import { motion } from 'framer-motion';

/**
 * Reusable glassmorphism container — WhatsApp dark palette.
 */
export default function GlassCard({
  children,
  className = '',
  delay = 0,
  ...rest
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={
        'backdrop-blur-2xl bg-[#111b21]/80 border border-[#2a3942] ' +
        'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] ' +
        className
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}
