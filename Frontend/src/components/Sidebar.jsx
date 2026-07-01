import { useState, useMemo } from 'react';
import { MessageSquare, Plus, Search, LogOut, Sun, Moon, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function groupConversations(groups) {
  const today = [];
  const yesterday = [];
  const previous = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfSevenDaysAgo = new Date(startOfToday);
  startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 7);

  groups.forEach((group) => {
    const created = group.createdAt ? new Date(group.createdAt) : new Date();
    if (created >= startOfToday) {
      today.push(group);
    } else if (created >= startOfYesterday) {
      yesterday.push(group);
    } else {
      previous.push(group);
    }
  });

  return { today, yesterday, previous };
}

export default function Sidebar({
  groups = [],
  activeGroupId = null,
  onSelectGroup,
  onOpenCreateModal,
  onLogout,
  theme,
  onToggleTheme,
  user,
  isMobileOpen,
  onCloseMobile,
}) {
  const [search, setSearch] = useState('');

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.groupName.toLowerCase().includes(search.toLowerCase())
    );
  }, [groups, search]);

  // Group filtered groups by time categories
  const grouped = useMemo(() => {
    return groupConversations(filteredGroups);
  }, [filteredGroups]);

  const renderGroupList = (list, title) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className="text-[11px] font-semibold text-secondary uppercase tracking-wider px-3 mb-1.5 select-none">
          {title}
        </h4>
        <div className="space-y-0.5">
          {list.map((g) => {
            const isActive = g.groupId === activeGroupId;
            return (
              <button
                key={g.groupId}
                onClick={() => {
                  onSelectGroup(g);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-sm transition-all duration-200 focus-ring cursor-pointer ${
                  isActive
                    ? 'bg-brand text-brand-text font-medium'
                    : 'text-primary hover:bg-surface/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-brand-text/10 text-brand-text' : 'bg-brand/10 text-brand'
                }`}>
                  <MessageSquare size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{g.groupName}</div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-brand-text/75' : 'text-secondary'}`}>
                    {g.createdAt
                      ? new Date(g.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently created'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-sidebar border-r border-border/80 text-primary">
      {/* ── Top Header / Logo ────────────────────── */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
            <MessageSquare size={16} />
          </div>
          <span className="font-semibold text-base tracking-tight select-none">Free Chat</span>
        </div>
        
        {/* Close Button on Mobile Drawer */}
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-surface/50 text-secondary hover:text-primary transition-all md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={16} className="interactive-icon" />
          </button>
        )}
      </div>

      {/* ── Create New Group button ──────────────── */}
      <div className="p-3">
        <button
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand/90 text-brand-text font-medium rounded-xl text-sm transition-all duration-200 shadow-[0_2px_8px_rgba(216,90,48,0.1)] focus-ring cursor-pointer"
        >
          <Plus size={16} />
          <span>New chat</span>
        </button>
      </div>

      {/* ── Search Input ────────────────────────── */}
      <div className="px-3 pb-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary/60 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface/50 border border-border/80 rounded-xl text-primary placeholder-secondary/50 text-xs outline-none transition-all duration-200 focus:border-brand focus-ring"
          />
        </div>
      </div>

      {/* ── Scrollable Group List ────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-1 select-none">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare size={20} className="mx-auto text-secondary/40 mb-2" />
            <p className="text-xs text-secondary font-medium">No conversations found</p>
          </div>
        ) : (
          <>
            {renderGroupList(grouped.today, 'Today')}
            {renderGroupList(grouped.yesterday, 'Yesterday')}
            {renderGroupList(grouped.previous, 'Previous')}
          </>
        )}
      </div>

      {/* ── User Profile + Settings ──────────────── */}
      <div className="p-3 border-t border-border/60 bg-surface/35 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center justify-center shrink-0">
            <User size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight">{user?.name}</div>
            <div className="text-[10px] text-secondary truncate leading-none mt-0.5">{user?.uniqueId}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme Switch */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg hover:bg-surface/50 text-secondary hover:text-primary transition-all cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} className="interactive-icon" /> : <Moon size={15} className="interactive-icon" />}
          </button>
          
          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-surface/50 text-secondary hover:text-danger transition-all cursor-pointer"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} className="interactive-icon" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop (Always visible above md, width 260px) */}
      <aside className="hidden md:block w-[260px] h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile Drawer (Slide over below md) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-[260px] z-50 md:hidden shadow-2xl h-full"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
