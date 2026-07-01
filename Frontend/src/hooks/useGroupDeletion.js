import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { disconnect } from '../services/websocket';

/**
 * Provides a reusable `handleGroupDeleted(deletedGroupId)` function.
 *
 * Call this from any component that holds group/chat state.
 * It will:
 *  1. Remove the group from the groups list
 *  2. Clear messages if the deleted group is currently active
 *  3. Disconnect WebSocket for that group
 *  4. Show a toast notification
 *  5. Navigate to the next available group (or /groups if none left)
 *
 * @param {object}   opts
 * @param {string}   opts.currentGroupId  - The groupId currently being viewed (from useParams)
 * @param {function} opts.setGroups       - State setter for groups array
 * @param {function} opts.setMessages     - State setter for messages array (ChatPage only, optional)
 * @param {function} opts.setActiveGroup  - State setter for the active group object (optional)
 * @param {function} opts.setGroupDeleted - State setter for the groupDeleted boolean (optional)
 * @param {React.MutableRefObject} opts.groupsRef - A ref holding the current groups array
 */
export default function useGroupDeletion({
  currentGroupId,
  setGroups,
  setMessages,
  setActiveGroup,
  setGroupDeleted,
  groupsRef,
}) {
  const navigate = useNavigate();

  // Track whether we've already handled a deletion for the current group
  // to avoid duplicate toasts / navigations.
  const handledRef = useRef(new Set());

  const handleGroupDeleted = useCallback(
    (deletedGroupId) => {
      if (!deletedGroupId) return;

      // Prevent duplicate handling for the same group in the same mount
      if (handledRef.current.has(deletedGroupId)) return;
      handledRef.current.add(deletedGroupId);

      // 1 — Remove from groups list
      setGroups((prev) => prev.filter((g) => g.groupId !== deletedGroupId));

      // 2 — If we are currently viewing the deleted group
      const isViewingDeleted = currentGroupId === deletedGroupId;

      if (isViewingDeleted) {
        // Clear messages
        setMessages?.([]);
        // Mark group as deleted (so the UI can show the empty state)
        setGroupDeleted?.(true);
        // Clear active group
        setActiveGroup?.(null);
        // Disconnect WebSocket for this group
        disconnect();
      }

      // 3 — Toast
      toast('Group deleted — this conversation is no longer available.', {
        icon: '⚠️',
        duration: 4000,
        style: { fontWeight: 500 },
      });

      // 4 — Navigate away if viewing the deleted group
      if (isViewingDeleted) {
        const remaining = (groupsRef?.current || []).filter(
          (g) => g.groupId !== deletedGroupId,
        );
        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0].groupId}`, {
            state: { groupName: remaining[0].groupName },
            replace: true,
          });
        } else {
          navigate('/groups', { replace: true });
        }
      }
    },
    [currentGroupId, setGroups, setMessages, setActiveGroup, setGroupDeleted, groupsRef, navigate],
  );

  return handleGroupDeleted;
}
