import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Menu } from 'lucide-react';
import { getGroups, createGroup } from '../services/api';
import { subscribeToGroupEvents } from '../services/websocket';
import Sidebar from '../components/Sidebar';

const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth guard
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Fetch groups
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getGroups();
        if (!cancelled) setGroups(data || []);
      } catch {
        // Handled by interceptor
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Subscribe to real-time group events (creation & deletion) via WebSocket
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToGroupEvents({
      onGroupDeleted: (deletedGroupId) => {
        setGroups((prev) => prev.filter((g) => g.groupId !== deletedGroupId));
        toast('Group deleted — this conversation is no longer available.', {
          icon: '⚠️',
          duration: 4000,
          style: { fontWeight: 500 },
        });
      },
      onGroupCreated: (newGroup) => {
        setGroups((prev) => {
          if (prev.some((g) => g.groupId === newGroup.groupId)) return prev;
          return [...prev, newGroup];
        });
      },
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Group name cannot be empty');
      return;
    }
    setCreating(true);
    try {
      const g = await createGroup({ groupName: newName.trim() });
      setGroups((p) => [...p, g]);
      setNewName('');
      setShowModal(false);
      toast.success(`"${g.groupName}" created!`);
      // Automatically navigate to the new group
      navigate(`/chat/${g.groupId}`, { state: { groupName: g.groupName } });
    } catch {
      // Handled by interceptor
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out');
    navigate('/', { replace: true });
  };

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectGroup = (g) => {
    navigate(`/chat/${g.groupId}`, { state: { groupName: g.groupName } });
  };

  if (!user) return null;

  return (
    <motion.div
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-screen w-screen flex bg-page overflow-hidden transition-colors duration-300"
    >
      {/* ── Left Sidebar Pane ────────────────────── */}
      <Sidebar
        groups={groups}
        activeGroupId={null}
        onSelectGroup={handleSelectGroup}
        onOpenCreateModal={() => setShowModal(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ── Main Chat/Content Pane ───────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Sticky Mobile Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border/60 md:hidden shrink-0">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl border border-border/80 text-secondary hover:text-primary transition-all duration-200 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={18} className="interactive-icon" />
          </button>
          <span className="font-semibold text-sm text-primary tracking-tight">Free Chat</span>
          <div className="w-9 h-9" /> {/* Spacer to balance header */}
        </header>

        {/* Empty State Body */}
        <main className="flex-1 flex items-center justify-center p-6 text-center select-none">
          <div className="max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 mb-5 text-brand">
              <MessageSquare size={28} />
            </div>
            <h2 className="text-xl font-medium text-primary tracking-tight">
              Select a conversation
            </h2>
            <p className="text-secondary text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
              Choose a chat group from the sidebar to view messages, or create a new one to start collaborating.
            </p>
          </div>
        </main>
      </div>

      {/* ── Create Modal ──────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-surface border border-border/80 rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-base font-semibold text-primary mb-1">Create New Group</h3>
              <p className="text-xs text-secondary mb-4">Choose a clear, descriptive name for your new chat group.</p>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="Group name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-4 py-2.5 bg-surface/50 border border-border/80 rounded-xl text-primary placeholder-secondary/50 text-sm outline-none transition-all duration-200 focus:border-brand focus-ring mb-4"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 bg-sidebar border border-border/80 text-secondary rounded-xl text-xs font-medium hover:bg-surface hover:text-primary transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2 bg-brand text-brand-text rounded-xl text-xs font-medium hover:bg-brand/90 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-[0_2px_8px_rgba(216,90,48,0.1)] focus-ring"
                  >
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
