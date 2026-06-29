import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getGroups, createGroup, deleteGroup } from '../services/api';
import GlassCard from '../components/GlassCard';

/* ── Variants ──────────────────────────────────── */
const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};
const card = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 220, damping: 22 },
  }),
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

/* ── Helpers ───────────────────────────────────── */
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

/* ── Component ─────────────────────────────────── */
export default function GroupsPage() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  /* ── Auth guard ─────────────────────────────── */
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  /* ── Fetch groups ───────────────────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getGroups();
        setGroups(data || []);
      } catch { /* toasted */ }
      finally { setLoading(false); }
    })();
  }, [user]);

  /* ── Create ─────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Group name cannot be empty'); return; }
    setCreating(true);
    try {
      const g = await createGroup({ groupName: newName.trim() });
      setGroups((p) => [...p, g]);
      setNewName('');
      setShowModal(false);
      toast.success(`"${g.groupName}" created!`);
    } catch { /* toasted */ }
    finally { setCreating(false); }
  };

  /* ── Delete ─────────────────────────────────── */
  const handleDelete = async (gid, gname) => {
    if (!window.confirm(`Delete "${gname}"? This cannot be undone.`)) return;
    setDeletingId(gid);
    try {
      await deleteGroup(gid, user.uniqueId);
      setGroups((p) => p.filter((g) => g.groupId !== gid));
      toast.success(`"${gname}" deleted`);
    } catch { /* toasted */ }
    finally { setDeletingId(null); }
  };

  if (!user) return null;

  /* ── Render ─────────────────────────────────── */
  return (
    <motion.div variants={page} initial="initial" animate="animate" exit="exit" className="min-h-screen flex flex-col">
      {/* ── Header ────────────────────────────── */}
      <header className="backdrop-blur-2xl bg-[#202c33]/80 border-b border-[#2a3942] px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#25d366] to-[#00a884] bg-clip-text text-transparent">
              Free Chat 
            </h1>
            <p className="text-xs text-[#8696a0] mt-0.5 truncate">
              Hi, {user.name} 👋
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowModal(true)}
              className="px-3.5 sm:px-4 py-2 bg-[#00a884] text-[#111b21] text-sm font-medium rounded-xl hover:bg-[#00a884]/90 hover:shadow-[0_0_20px_rgba(0,168,132,0.2)] transition-all cursor-pointer"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ New Group</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { localStorage.removeItem('user'); toast.success('Logged out'); navigate('/', { replace: true }); }}
              className="px-3.5 sm:px-4 py-2 bg-[#2a3942]/60 border border-[#2a3942] text-[#8696a0] text-sm rounded-xl hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors cursor-pointer"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-[#e9edef] mb-5">
          Your Groups
          <span className="text-sm text-[#8696a0] font-normal ml-2">
            ({groups.length})
          </span>
        </h2>

        {loading ? (
          /* skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#111b21] border border-[#2a3942]/50 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <GlassCard className="p-14 text-center">
            <p className="text-4xl mb-4">💬</p>
            <p className="text-[#e9edef] font-medium">No groups yet</p>
            <p className="text-[#8696a0] text-sm mt-1">Create your first group to start chatting</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {groups.map((g, i) => (
                <motion.div
                  key={g.groupId}
                  custom={i}
                  variants={card}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  onClick={() => navigate(`/chat/${g.groupId}`, { state: { groupName: g.groupName } })}
                  className="backdrop-blur-xl bg-[#111b21]/70 border border-[#2a3942] rounded-2xl p-5 group/card hover:bg-[#202c33] hover:border-[#00a884]/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#00a884]/12 border border-[#00a884]/15 flex items-center justify-center text-xl shrink-0">
                      💬
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(g.groupId, g.groupName); }}
                      disabled={deletingId === g.groupId}
                      className="p-2 rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover/card:opacity-100 cursor-pointer disabled:opacity-40"
                      title="Delete group"
                    >
                      {deletingId === g.groupId ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      )}
                    </motion.button>
                  </div>

                  {/* Info */}
                  <h3 className="text-[#e9edef] font-semibold text-base truncate">{g.groupName}</h3>
                  <p className="text-[#8696a0] text-xs mt-1.5">
                    {g.createdAt
                      ? new Date(g.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Just created'}
                  </p>

                  {/* CTA */}
                  <div className="mt-4 flex items-center gap-1 text-[#00a884] text-xs font-medium opacity-0 group-hover/card:opacity-100 transition-opacity">
                    Enter chat
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Create Modal ──────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 18 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm backdrop-blur-2xl bg-[#111b21]/95 border border-[#2a3942] rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-[#e9edef] mb-1">Create New Group</h3>
              <p className="text-sm text-[#8696a0] mb-5">Choose a name for your chat group</p>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="Group name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-[#2a3942]/50 border border-[#2a3942] rounded-xl text-[#e9edef] placeholder-[#8696a0]/60 text-sm outline-none transition-all duration-300 focus:border-[#00a884]/50 mb-5"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-[#2a3942]/50 border border-[#2a3942] text-[#8696a0] rounded-xl text-sm hover:bg-[#2a3942] hover:text-[#e9edef] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={creating}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 bg-[#00a884] text-[#111b21] rounded-xl text-sm font-medium hover:bg-[#00a884]/90 hover:shadow-[0_0_20px_rgba(0,168,132,0.2)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? 'Creating…' : 'Create'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
