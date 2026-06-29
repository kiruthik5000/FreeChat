import { motion } from 'framer-motion';

/**
 * Single chat-message bubble — WhatsApp-styled.
 *
 * – Self messages: WhatsApp outgoing green (#005c4b)
 * – Other messages: WhatsApp incoming dark (#202c33)
 */
export default function MessageBubble({ senderName, message, createdAt, isSelf }) {
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`relative max-w-[78%] sm:max-w-[65%] px-4 py-2.5 ${
          isSelf
            ? 'bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-br-md'
            : 'bg-[#202c33] border border-[#2a3942] text-[#e9edef] rounded-2xl rounded-bl-md'
        }`}
      >
        {/* Sender name — only for others */}
        {!isSelf && (
          <p className="text-[11px] font-semibold text-[#00a884] mb-0.5 tracking-wide">
            {senderName}
          </p>
        )}

        <p className="text-[13.5px] leading-relaxed break-words whitespace-pre-wrap">
          {message}
        </p>

        <p
          className={`text-[10px] mt-1 text-right ${
            isSelf ? 'text-[#ffffff70]' : 'text-[#8696a0]'
          }`}
        >
          {time}
        </p>
      </div>
    </motion.div>
  );
}
