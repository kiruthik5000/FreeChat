import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image as ImageIcon, Code, Download, Copy, Check } from 'lucide-react';

// Palette of distinct, premium, cohesive color themes for senders
const LIFE_THEMES = [
  {
    avatarClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/40 dark:border-blue-900/30',
    nameClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    avatarClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/40 dark:border-emerald-900/30',
    nameClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    avatarClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/40 dark:border-violet-900/30',
    nameClass: 'text-violet-600 dark:text-violet-400',
  },
  {
    avatarClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/40 dark:border-rose-900/30',
    nameClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    avatarClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/40 dark:border-teal-900/30',
    nameClass: 'text-teal-600 dark:text-teal-400',
  },
  {
    avatarClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/45 dark:border-amber-900/30',
    nameClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    avatarClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/40 dark:border-indigo-900/30',
    nameClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    avatarClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/40 dark:border-cyan-900/30',
    nameClass: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    avatarClass: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border border-fuchsia-200/40 dark:border-fuchsia-900/30',
    nameClass: 'text-fuchsia-600 dark:text-fuchsia-400',
  },
];

/**
 * Gets a deterministic visual theme based on sender name.
 */
function getSenderTheme(name) {
  if (!name) {
    return {
      avatarClass: 'bg-secondary text-primary border border-border/40',
      nameClass: 'text-brand',
    };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LIFE_THEMES.length;
  return LIFE_THEMES[index];
}

/**
 * Generates initials based on name.
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || name[0].toUpperCase();
}

export default function MessageBubble({ senderName, message, type = 'TEXT', createdAt, isSelf }) {
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const theme = getSenderTheme(senderName);
  const initials = getInitials(senderName);

  const [copied, setCopied] = useState(false);

  let filename = '';
  let caption = '';
  let url = '';
  let displayMessage = message;

  if (type === 'FILE' || type === 'IMAGE') {
    try {
      const parsed = JSON.parse(message);
      filename = parsed.filename || '';
      caption = parsed.caption || '';
      url = parsed.url || '';
      displayMessage = caption;
    } catch (e) {
      // Fallback for legacy messages where the raw message is the filename
      filename = message;
      displayMessage = '';
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (filename, fileUrl) => {
    if (fileUrl) {
      const element = document.createElement("a");
      element.href = fileUrl;
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      const element = document.createElement("a");
      const file = new Blob([`This is the mock content of the downloaded file: ${filename}`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Adjust padding depending on type to match WhatsApp-style full-bleed image messages
  let bubbleClasses = '';
  if (type === 'IMAGE') {
    bubbleClasses = displayMessage ? 'p-1 pb-2' : 'p-0 overflow-hidden';
  } else {
    bubbleClasses = 'px-3.5 py-2';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className={`flex items-start gap-2.5 ${isSelf ? 'justify-end' : 'justify-start'} mb-2.5`}
    >
      {/* Receiver's Avatar (aligned to start/top of the bubble) */}
      {!isSelf && (
        <div 
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold select-none shadow-xs shrink-0 ${theme.avatarClass}`}
          title={senderName}
        >
          {initials}
        </div>
      )}

      {/* Message bubble container */}
      <div
        className={`relative max-w-[75%] ${bubbleClasses} shadow-xs transition-all duration-250 ${
          isSelf
            ? 'bg-brand text-white rounded-2xl rounded-tr-[4px]'
            : 'bg-surface border border-border/70 text-primary rounded-2xl rounded-tl-[4px]'
        }`}
      >
        {/* Sender name with unique color for each person */}
        {!isSelf && (
          <p className={`text-[11px] font-semibold mb-0.5 leading-none tracking-wide ${theme.nameClass} ${type === 'IMAGE' ? 'pt-1.5 px-2' : ''}`}>
            {senderName}
          </p>
        )}

        {/* Type-specific rendering */}
        {type === 'CODE' && (
          <div className="mt-1 border border-border/40 rounded-lg overflow-hidden bg-sidebar/80 font-mono text-[11px] leading-relaxed max-w-full">
            <div className="flex items-center justify-between px-3 py-1 bg-border/25 border-b border-border/40 text-secondary">
              <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase select-none">
                <Code size={10} />
                Code Block
              </span>
              <button
                onClick={handleCopyCode}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                type="button"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 overflow-x-auto whitespace-pre select-text text-primary text-left">
              <code>{message}</code>
            </pre>
          </div>
        )}

        {type === 'FILE' && (
          <div className="mt-1 flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 border border-border/40 rounded-xl max-w-sm select-none">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0 font-sans text-left">
              <p className="text-xs font-semibold text-primary truncate" title={filename}>
                {filename}
              </p>
              <p className="text-[10px] text-secondary">Document</p>
            </div>
            <button
              onClick={() => handleDownloadFile(filename, url)}
              className="p-1.5 hover:bg-border/60 rounded-lg text-secondary hover:text-primary transition-all cursor-pointer shrink-0"
              title="Download file"
              type="button"
            >
              <Download size={14} />
            </button>
          </div>
        )}

        {type === 'IMAGE' && (
          <div className="flex flex-col max-w-full">
            {/* The Image Container */}
            <div className="relative group overflow-hidden cursor-pointer rounded-t-xl rounded-b-md">
              {url ? (
                <img
                  src={url}
                  alt={filename}
                  className="w-full max-h-72 object-cover block hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-64 aspect-video bg-gradient-to-tr from-brand/15 to-violet-500/15 flex items-center justify-center">
                  <ImageIcon size={32} className="text-brand/50" />
                </div>
              )}
              {/* Overlay with Download Button */}
              {url && (
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFile(filename, url);
                    }}
                    className="p-2.5 bg-surface/90 hover:bg-brand text-primary hover:text-brand-text rounded-full shadow-md transition-all cursor-pointer"
                    title="Download Image"
                    type="button"
                  >
                    <Download size={18} />
                  </button>
                </div>
              )}
            </div>
            {/* Filename sub-info (only if NO caption is present) */}
            {!displayMessage && (
              <div className="px-3 py-1.5 flex items-center justify-between gap-3 bg-black/5 dark:bg-white/5 border-t border-border/30 rounded-b-xl text-left font-sans">
                <span className="text-[10px] font-medium text-secondary truncate flex-1" title={filename}>
                  {filename}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(filename, url);
                  }}
                  className="text-secondary hover:text-primary transition-colors cursor-pointer shrink-0"
                  title="Download"
                  type="button"
                >
                  <Download size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text message (or optional caption for file/image) */}
        {((type !== 'FILE' && type !== 'IMAGE') || displayMessage) && (
          <p className={`text-sm leading-relaxed break-words whitespace-pre-wrap select-text text-left ${
            (type === 'FILE' || type === 'IMAGE') ? 'mt-2 px-1 text-primary/95 border-t border-border/20 pt-1.5' : ''
          }`}>
            {type === 'CODE' ? '' : displayMessage}
          </p>
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 text-right select-none ${
            isSelf ? 'text-brand-text/70' : 'text-secondary/70'
          } ${type === 'IMAGE' ? 'px-2' : ''}`}
        >
          {time}
        </p>
      </div>
    </motion.div>
  );
}
