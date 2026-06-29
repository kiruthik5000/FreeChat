import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getTodayChats, getAllChats } from '../services/api';
import { connectToGroup, sendMessage, disconnect } from '../services/websocket';
import MessageBubble from '../components/MessageBubble';

const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

/* ── Helpers ───────────────────────────────────── */
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function normalise(raw) {
  return {
    id: raw.id,
    senderName: raw.senderName || raw.name,
    groupId: raw.groupId,
    message: raw.message,
    createdAt: raw.createdAt,
  };
}

/* ── Component ─────────────────────────────────── */
export default function ChatPage() {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const groupName = location.state?.groupName || 'Chat';

  const [user] = useState(getStoredUser);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('disconnected');

  const endRef = useRef(null);

  /* ── Auth guard ─────────────────────────────── */
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  /* ── Scroll to bottom ──────────────────────── */
  const scrollDown = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* ── Load history ──────────────────────────── */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = showAll
          ? await getAllChats(groupId)
          : await getTodayChats(groupId);
        if (!cancelled) setMessages((data || []).map(normalise));
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, showAll, user]);

  /* ── WebSocket ─────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    connectToGroup(
      groupId,
      (dto) => setMessages((p) => [...p, normalise(dto)]),
      (s) => setWsStatus(s),
    );
    return () => disconnect();
  }, [groupId, user]);

  /* ── Auto-scroll ───────────────────────────── */
  useEffect(scrollDown, [messages, scrollDown]);

  /* ── Send ───────────────────────────────────── */
  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const ok = sendMessage({ groupId, senderName: user.name, message: text });
    if (ok) setInput('');
    else toast.error('Cannot send — not connected');
  };

  if (!user) return null;

  /* ── Status dot colour ─────────────────────── */
  const dot = {
    connected:    'bg-[#00a884] shadow-[0_0_6px_rgba(0,168,132,0.6)]',
    connecting:   'bg-amber-400 animate-pulse',
    disconnected: 'bg-[#8696a0]',
    error:        'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]',
  }[wsStatus];

  return (
    <motion.div variants={page} initial="initial" animate="animate" exit="exit" className="h-dvh flex flex-col">

      {/* ══════════════ Header ══════════════════ */}
      <header className="backdrop-blur-2xl bg-[#202c33]/90 border-b border-[#2a3942] px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: back + name */}
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/groups')}
              className="shrink-0 p-2 rounded-xl bg-[#2a3942]/50 border border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </motion.button>
            <div className="min-w-0">
              <h2 className="text-[#e9edef] font-semibold text-sm sm:text-base truncate">
                {groupName}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[10px] text-[#8696a0] capitalize">{wsStatus}</span>
              </div>
            </div>
          </div>

          {/* Right: today / all toggle */}
          <div className="flex bg-[#111b21] rounded-lg p-0.5 border border-[#2a3942] shrink-0">
            {['Today', 'All'].map((label, i) => (
              <button
                key={label}
                onClick={() => setShowAll(i === 1)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                  (i === 0 && !showAll) || (i === 1 && showAll)
                    ? 'bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/20'
                    : 'text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════════ Messages ════════════════ */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[40vh]">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-[#00a884] mx-auto mb-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-[#8696a0] text-sm">Loading messages…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[40vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <p className="text-4xl mb-3">{showAll ? '📭' : '🌅'}</p>
                <p className="text-[#e9edef] font-medium">{showAll ? 'No messages yet' : 'No messages today'}</p>
                <p className="text-[#8696a0] text-sm mt-1">Be the first to say hello!</p>
              </motion.div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id || `m-${i}`}
                  senderName={m.senderName}
                  message={m.message}
                  createdAt={m.createdAt}
                  isSelf={m.senderName === user.name}
                />
              ))}
            </AnimatePresence>
          )}
          <div ref={endRef} />
        </div>
      </main>

      {/* ══════════════ Input bar ═══════════════ */}
      <footer className="backdrop-blur-2xl bg-[#202c33]/90 border-t border-[#2a3942] px-4 py-3 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={wsStatus === 'connected' ? 'Type a message…' : 'Connecting…'}
            disabled={wsStatus !== 'connected'}
            className="flex-1 px-4 py-3 bg-[#2a3942]/50 border border-[#2a3942] rounded-xl text-[#e9edef] placeholder-[#8696a0]/60 text-sm outline-none transition-all duration-300 focus:border-[#00a884]/50 disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || wsStatus !== 'connected'}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="shrink-0 p-3 bg-[#00a884] text-[#111b21] rounded-xl hover:bg-[#00a884]/90 hover:shadow-[0_0_20px_rgba(0,168,132,0.2)] transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </form>
      </footer>
    </motion.div>
  );
}
