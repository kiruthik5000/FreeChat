import { motion } from 'framer-motion';

/**
 * Reusable glassmorphism container using theme variables.
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
        'backdrop-blur-2xl bg-surface/80 border border-border/60 ' +
        'rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] ' +
        'text-primary ' +
        className
      }
      {...rest}
    >
      {children}
    </motion.div>
  );
}
