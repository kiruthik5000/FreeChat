import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Menu,
  ChevronDown,
  Paperclip,
  Smile,
  SendHorizontal,
  ChevronLeft,
  Info,
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  Check,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Image,
  Code,
} from 'lucide-react';
import { getTodayChats, getAllChats, getGroups, createGroup, deleteGroup, uploadFile } from '../services/api';
import { connectToGroup, sendMessage, disconnect } from '../services/websocket';
import useGroupDeletion from '../hooks/useGroupDeletion';
import MessageBubble from '../components/MessageBubble';
import Sidebar from '../components/Sidebar';
import RightPanel from '../components/RightPanel';

const page = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

function normalise(raw) {
  return {
    id: raw.id,
    senderName: raw.senderName || raw.name,
    groupId: raw.groupId,
    message: raw.content || raw.message,
    type: raw.type || 'TEXT',
    createdAt: raw.createdAt,
  };
}

/**
 * Returns true if an axios error looks like a "group not found / gone" response,
 * signalling the group was deleted on the server.
 */
function isGroupGoneError(error) {
  const status = error?.response?.status;
  if (status === 404 || status === 410) return true;
  const msg = (
    error?.response?.data?.message ||
    error?.response?.data ||
    ''
  ).toString().toUpperCase();
  return msg.includes('GROUP_NOT_FOUND') || msg.includes('GROUP NOT FOUND');
}

export default function ChatPage() {
  const { groupId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user] = useState(getStoredUser);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  // Layout control states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Group name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempGroupName, setTempGroupName] = useState('');

  // ── Group deletion state ──────────────────────
  const [groupDeleted, setGroupDeleted] = useState(false);
  const [messageType, setMessageType] = useState('TEXT');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [filename, setFilename] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);

  // Keep a ref of the current groups list so the deletion hook can pick the
  // next available group synchronously without stale closures.
  const groupsRef = useRef(groups);
  useEffect(() => { groupsRef.current = groups; }, [groups]);

  // ── Deletion hook ─────────────────────────────
  const handleGroupDeleted = useGroupDeletion({
    currentGroupId: groupId,
    setGroups,
    setMessages,
    setActiveGroup,
    setGroupDeleted,
    groupsRef,
  });

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

  // Reset deletion state when navigating to a new group
  useEffect(() => {
    setGroupDeleted(false);
  }, [groupId]);

  // Fetch groups
  const fetchGroupsList = useCallback(async () => {
    try {
      const data = await getGroups();
      setGroups(data || []);
      // Find active group
      const current = (data || []).find((g) => g.groupId === groupId);
      if (current) {
        setActiveGroup(current);
        setTempGroupName(current.groupName);
      } else if (!groupDeleted) {
        // Group not in the list — it may have been deleted
        // Mock fallback if not in the main list yet
        const mockGroup = { groupId, groupName: location.state?.groupName || 'Chat', createdAt: new Date() };
        setActiveGroup(mockGroup);
        setTempGroupName(mockGroup.groupName);
      }
    } catch (err) {
      if (isGroupGoneError(err)) {
        handleGroupDeleted(groupId);
      }
    }
  }, [groupId, location.state, groupDeleted, handleGroupDeleted]);

  useEffect(() => {
    if (user) fetchGroupsList();
  }, [user, fetchGroupsList]);

  // Scroll to bottom
  const scrollDown = useCallback(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, []);

  // Load chat history
  useEffect(() => {
    if (!user || groupDeleted) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = showAll
          ? await getAllChats(groupId)
          : await getTodayChats(groupId);
        if (!cancelled) {
          setMessages((data || []).map(normalise));
          // Wait slightly for DOM render before scrolling down
          setTimeout(scrollDown, 50);
        }
      } catch (err) {
        if (!cancelled) {
          if (isGroupGoneError(err)) {
            handleGroupDeleted(groupId);
          } else {
            setMessages([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, showAll, user, scrollDown, groupDeleted, handleGroupDeleted]);

  // Connect WebSocket
  useEffect(() => {
    if (!user || groupDeleted) return;
    connectToGroup(
      groupId,
      (dto) => {
        setMessages((p) => [...p, normalise(dto)]);
        setTimeout(scrollDown, 50);
      },
      (s) => setWsStatus(s),
      {
        onGroupDeleted: (deletedId) => handleGroupDeleted(deletedId),
        onGroupCreated: (newGroup) => {
          // Add the new group to the sidebar if it doesn't already exist
          setGroups((prev) => {
            if (prev.some((g) => g.groupId === newGroup.groupId)) return prev;
            return [...prev, newGroup];
          });
        },
      },
    );
    return () => disconnect();
  }, [groupId, user, scrollDown, groupDeleted, handleGroupDeleted]);

  // Auto-scroll on new message if scrolled close to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      // Scroll if we are within 250px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 250) {
        scrollDown();
      }
    }
  }, [messages, scrollDown]);

  // Listen to scrolls to toggle "jump to latest" pill
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 300) {
      setShowScrollBtn(true);
    } else {
      setShowScrollBtn(false);
    }
  };

  // Adjust textarea size dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (groupDeleted) return; // Block sends on deleted groups
    const text = input.trim();
    
    const isFileOrImage = messageType === 'FILE' || messageType === 'IMAGE';
    if (isFileOrImage && !selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    if (!isFileOrImage && !text) return;

    let uploadedUrl = '';
    let displayFilename = '';

    if (isFileOrImage && selectedFile) {
      const loadingToast = toast.loading('Uploading file...');
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await uploadFile(formData);
        uploadedUrl = response.url;
        displayFilename = response.filename || selectedFile.name;
        
        toast.dismiss(loadingToast);
        toast.success('Upload successful!');
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error('Failed to upload file');
        return;
      }
    }
    
    const content = isFileOrImage
      ? JSON.stringify({ filename: displayFilename, url: uploadedUrl, caption: text })
      : text;

    const ok = sendMessage({
      groupId,
      senderName: user.name,
      content,
      type: messageType
    });
    
    if (ok) {
      setInput('');
      setSelectedFile(null);
      setFilename('');
      setMessageType('TEXT');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } else {
      toast.error('Cannot send — not connected');
    }
  };

  const handleCreateGroupFromSidebar = async (e) => {
    // Opens the modal or creates via layout. Sidebar will trigger this.
    const name = window.prompt('Enter new group name:');
    if (!name?.trim()) return;
    try {
      const g = await createGroup({ groupName: name.trim() });
      toast.success(`"${g.groupName}" created!`);
      fetchGroupsList();
      navigate(`/chat/${g.groupId}`, { state: { groupName: g.groupName } });
    } catch {
      // Handled
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Delete "${activeGroup?.groupName}"? This cannot be undone.`)) return;
    setIsDeletingGroup(true);
    try {
      await deleteGroup(groupId, user.uniqueId);
      // Trigger the shared deletion handler — cleans state, toasts, navigates
      handleGroupDeleted(groupId);
    } catch (err) {
      if (isGroupGoneError(err)) {
        // Already deleted on the server
        handleGroupDeleted(groupId);
      }
      // Other errors handled by interceptor
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleRenameGroup = () => {
    if (tempGroupName.trim() && tempGroupName !== activeGroup?.groupName) {
      toast.success('Group name updated locally');
      // Update local state
      setActiveGroup((prev) => prev ? { ...prev, groupName: tempGroupName.trim() } : null);
      setGroups((p) =>
        p.map((g) => (g.groupId === groupId ? { ...g, groupName: tempGroupName.trim() } : g))
      );
    }
    setIsEditingName(false);
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }
    const text = messages
      .map(
        (m) =>
          `[${new Date(m.createdAt).toLocaleString()}] ${m.senderName}: ${m.message}`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeGroup?.groupName || 'Chat').replace(/\s+/g, '_')}_history.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Chat history exported!');
    setShowMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out');
    navigate('/', { replace: true });
  };

  if (!user) return null;

  // Status dot colour mapping
  const wsDotColor = {
    connected: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    connecting: 'bg-amber-400 animate-pulse',
    disconnected: 'bg-secondary',
    error: 'bg-danger shadow-[0_0_6px_rgba(239,68,68,0.5)]',
  }[wsStatus];

  // Whether all interactive elements should be disabled
  const isDisabled = groupDeleted;

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
        activeGroupId={groupId}
        onSelectGroup={(g) => navigate(`/chat/${g.groupId}`, { state: { groupName: g.groupName } })}
        onOpenCreateModal={handleCreateGroupFromSidebar}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        user={user}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* ── Main Chat Pane ───────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-surface border-b border-border/85 px-4 py-3 flex items-center justify-between gap-3 shrink-0 select-none">
          {/* Left info & navigation */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button (Mobile only) */}
            <button
              onClick={() => navigate('/groups')}
              className="p-2 rounded-xl border border-border/80 text-secondary hover:text-primary transition-all md:hidden cursor-pointer"
              aria-label="Back to groups"
            >
              <ChevronLeft size={16} className="interactive-icon" />
            </button>

            {/* Hamburger sidebar (Mobile only) */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl border border-border/80 text-secondary hover:text-primary transition-all hidden sm:block md:hidden cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <Menu size={16} className="interactive-icon" />
            </button>

            <div className="min-w-0">
              {/* Editable Name Title */}
              {isEditingName && !isDisabled ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempGroupName}
                    onChange={(e) => setTempGroupName(e.target.value)}
                    onBlur={handleRenameGroup}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup()}
                    autoFocus
                    maxLength={30}
                    className="bg-sidebar border border-brand/50 rounded-lg px-2 py-0.5 text-sm font-medium text-primary outline-none focus-ring"
                  />
                  <button
                    onClick={handleRenameGroup}
                    className="p-1 rounded-md bg-brand text-brand-text hover:bg-brand/90 cursor-pointer"
                  >
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/title">
                  <h2 className="text-primary font-medium text-sm sm:text-base truncate select-text">
                    {groupDeleted ? 'Deleted Group' : (activeGroup?.groupName || 'Loading Chat…')}
                  </h2>
                  {!isDisabled && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="opacity-0 group-hover/title:opacity-100 p-1 rounded hover:bg-sidebar text-secondary hover:text-primary transition-all cursor-pointer"
                      title="Rename group"
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                </div>
              )}

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {groupDeleted ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-danger shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                    <span className="text-[10px] text-danger font-medium">Deleted</span>
                  </>
                ) : (
                  <>
                    <div className={`w-1.5 h-1.5 rounded-full ${wsDotColor}`} />
                    <span className="text-[10px] text-secondary capitalize">{wsStatus}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right actions — hidden when group is deleted */}
          {!isDisabled && (
            <div className="flex items-center gap-2 relative">
              {/* Today / All Toggle */}
              <div className="flex bg-sidebar rounded-lg p-0.5 border border-border/60 shrink-0">
                {['Today', 'All'].map((label, i) => {
                  const isActive = (i === 0 && !showAll) || (i === 1 && showAll);
                  return (
                    <button
                      key={label}
                      onClick={() => setShowAll(i === 1)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 cursor-pointer focus-ring ${
                        isActive
                          ? 'bg-brand/10 text-brand border border-brand/15'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Overflow menu toggle */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-xl border border-border/80 text-secondary hover:text-primary transition-all cursor-pointer ${showMenu ? 'bg-sidebar text-brand border-brand/20' : ''}`}
                title="More options"
                aria-label="More options"
              >
                <MoreVertical size={15} className="interactive-icon" />
              </button>

              {/* Overflow Dropdown menu */}
              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute right-0 top-11 z-30 w-44 bg-surface border border-border/80 rounded-xl shadow-lg p-1.5 select-none"
                    >
                      <button
                        onClick={handleExportChat}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-sidebar text-primary transition-all cursor-pointer"
                      >
                        <Download size={14} />
                        <span>Export Chat History</span>
                      </button>
                      <button
                        onClick={() => { setIsEditingName(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-sidebar text-primary transition-all cursor-pointer"
                      >
                        <Edit2 size={14} />
                        <span>Rename Chat</span>
                      </button>
                      <div className="h-px bg-border/60 my-1.5" />
                      <button
                        onClick={() => { handleDeleteGroup(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left hover:bg-danger/10 text-danger transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                        <span>Delete Chat</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Info toggle (details panel - hidden below 1024px) */}
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className={`hidden lg:block p-2 rounded-xl border border-border/80 text-secondary hover:text-primary transition-all cursor-pointer ${
                  showRightPanel ? 'bg-sidebar text-brand border-brand/20' : ''
                }`}
                title="Conversation details"
                aria-label="Conversation details"
              >
                <Info size={15} className="interactive-icon" />
              </button>
            </div>
          )}
        </header>

        {/* ── GROUP DELETED EMPTY STATE ──────────── */}
        {groupDeleted ? (
          <main className="flex-1 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-center max-w-sm select-none"
            >
              <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={28} className="text-danger" />
              </div>
              <h2 className="text-lg font-semibold text-primary mb-2">
                This group has been deleted
              </h2>
              <p className="text-sm text-secondary leading-relaxed mb-6">
                You can no longer send or receive messages in this group.
              </p>
              <button
                onClick={() => navigate('/groups', { replace: true })}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 text-brand-text font-medium rounded-xl transition-all duration-200 cursor-pointer focus-ring shadow-[0_4px_12px_rgba(216,90,48,0.12)]"
              >
                <ArrowLeft size={16} />
                Back to Chats
              </button>
            </motion.div>
          </main>
        ) : (
          <>
            {/* Scrollable Message List */}
            <main
              ref={scrollAreaRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 relative"
            >
              <div className="max-w-3xl mx-auto h-full flex flex-col justify-between">
                <div>
                  {loading ? (
                    <div className="flex items-center justify-center h-full min-h-[50vh]">
                      <div className="text-center">
                        <svg className="animate-spin h-6 w-6 text-brand mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-secondary text-xs">Loading history…</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[50vh] select-none">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-sidebar border border-border/60 flex items-center justify-center text-secondary/40 mx-auto mb-3">
                          <MessageSquare size={20} />
                        </div>
                        <p className="text-primary font-medium text-sm">
                          {showAll ? 'No messages yet' : 'No messages today'}
                        </p>
                        <p className="text-secondary text-xs mt-1">Be the first to say hello!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 select-text">
                      <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                          <MessageBubble
                            key={m.id || `msg-${i}`}
                            senderName={m.senderName}
                            message={m.message}
                            type={m.type}
                            createdAt={m.createdAt}
                            isSelf={m.senderName === user.name}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Jump To Bottom Pill Button */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    initial={{ opacity: 0, y: 8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.9 }}
                    onClick={scrollDown}
                    className="absolute bottom-20 right-6 z-10 p-2.5 bg-surface border border-border/80 text-secondary hover:text-brand hover:border-brand/35 rounded-full shadow-lg cursor-pointer focus-ring"
                    aria-label="Jump to latest"
                    title="Jump to latest"
                  >
                    <ChevronDown size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </main>

            {/* Input Bar Docked at Bottom */}
            <footer className="bg-surface border-t border-border/85 px-4 py-3 flex-shrink-0">
              <form onSubmit={handleSend} className="max-w-3xl mx-auto flex flex-col gap-2">
                
                {/* File Attachment Area (only for FILE and IMAGE types) */}
                {(messageType === 'FILE' || messageType === 'IMAGE') && (
                  <div className="w-full flex items-center gap-3 bg-sidebar border border-border/80 rounded-xl px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {messageType === 'FILE' ? <Paperclip size={14} className="text-brand" /> : <Image size={14} className="text-brand" />}
                    <div className="flex-1 min-w-0">
                      {selectedFile ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-primary truncate font-medium">{selectedFile.name}</span>
                          <span className="text-[10px] text-secondary shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-secondary/60">No file selected</span>
                      )}
                    </div>
                    <label className="px-2.5 py-1 bg-brand/10 hover:bg-brand/20 text-brand text-[10px] font-semibold rounded-lg transition-all cursor-pointer select-none">
                      Choose File
                      <input
                        type="file"
                        accept={messageType === 'IMAGE' ? 'image/*' : '*'}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSelectedFile(file);
                            setFilename(file.name);
                          }
                        }}
                        className="hidden"
                        disabled={isDisabled}
                      />
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilename('');
                        }}
                        className="text-[10px] text-danger hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2.5">
                  {/* Message Type Selector Dropdown */}
                  <div className="relative shrink-0 select-none">
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setShowTypeMenu(!showTypeMenu)}
                      className="p-2.5 rounded-xl border border-border/80 bg-sidebar text-secondary hover:text-primary transition-all cursor-pointer focus-ring disabled:opacity-35 disabled:cursor-not-allowed flex items-center gap-1 min-w-[48px] justify-center"
                      title="Select message type"
                      aria-label="Select message type"
                    >
                      {messageType === 'TEXT' && <MessageSquare size={15} />}
                      {messageType === 'FILE' && <Paperclip size={15} />}
                      {messageType === 'IMAGE' && <Image size={15} />}
                      {messageType === 'CODE' && <Code size={15} />}
                      <ChevronDown size={12} className={`transition-transform duration-200 ${showTypeMenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showTypeMenu && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setShowTypeMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            className="absolute left-0 bottom-12 z-30 w-36 bg-surface border border-border/80 rounded-xl shadow-lg p-1 select-none"
                          >
                            {[
                              { value: 'TEXT', label: 'Text', icon: MessageSquare },
                              { value: 'FILE', label: 'File', icon: Paperclip },
                              { value: 'IMAGE', label: 'Image', icon: Image },
                              { value: 'CODE', label: 'Code', icon: Code },
                            ].map((t) => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.value}
                                  type="button"
                                  onClick={() => {
                                    setMessageType(t.value);
                                    setShowTypeMenu(false);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer ${
                                    messageType === t.value
                                      ? 'bg-brand/10 text-brand font-medium'
                                      : 'hover:bg-sidebar text-primary'
                                  }`}
                                >
                                  <Icon size={14} />
                                  <span>{t.label}</span>
                                </button>
                              );
                            })}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Main Auto-growing Textarea Input */}
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        wsStatus !== 'connected'
                          ? 'Connecting…'
                          : messageType === 'FILE' || messageType === 'IMAGE'
                          ? 'Add an optional caption…'
                          : messageType === 'CODE'
                          ? 'Paste your code here…'
                          : 'Type a message…'
                      }
                      disabled={wsStatus !== 'connected' || isDisabled}
                      className="w-full pl-4 pr-10 py-2.5 bg-sidebar border border-border/80 rounded-xl text-primary placeholder-secondary/50 text-sm outline-none transition-all duration-200 focus:border-brand focus-ring resize-none max-h-32 min-h-[38px] leading-relaxed disabled:opacity-50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={
                      wsStatus !== 'connected' || 
                      isDisabled || 
                      ((messageType === 'FILE' || messageType === 'IMAGE') && !selectedFile) ||
                      ((messageType === 'TEXT' || messageType === 'CODE') && !input.trim())
                    }
                    className="p-2.5 bg-brand text-brand-text rounded-xl hover:bg-brand/90 transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer focus-ring shadow-[0_2px_8px_rgba(216,90,48,0.1)] shrink-0 self-end interactive-send"
                    aria-label="Send message"
                  >
                    <SendHorizontal size={15} />
                  </button>
                </div>
              </form>
            </footer>
          </>
        )}
      </div>

      {/* ── Optional Right Panel Pane (Collapsible) — hidden when deleted ── */}
      <AnimatePresence>
        {showRightPanel && !isDisabled && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="hidden lg:block h-full overflow-hidden"
          >
            <RightPanel
              group={activeGroup}
              onDeleteGroup={handleDeleteGroup}
              isDeleting={isDeletingGroup}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
