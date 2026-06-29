// LANChat Frontend Controller

// Application State
const state = {
    currentUser: null, // { uniqueId, name }
    groups: [],
    activeGroup: null, // { groupId, groupName }
    messages: [],
    pollingInterval: null,
    todayOnly: true
};

// Selectors
const DOM = {
    authView: document.getElementById('auth-view'),
    chatView: document.getElementById('chat-view'),
    authAlert: document.getElementById('auth-alert'),
    tabLogin: document.getElementById('tab-login'),
    tabRegister: document.getElementById('tab-register'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Auth inputs
    loginUid: document.getElementById('login-uid'),
    loginPwd: document.getElementById('login-pwd'),
    regUid: document.getElementById('reg-uid'),
    regName: document.getElementById('reg-name'),
    regPwd: document.getElementById('reg-pwd'),
    
    // Chat UI elements
    currentUserName: document.getElementById('current-user-name'),
    currentUserId: document.getElementById('current-user-id'),
    userAvatarInitial: document.getElementById('user-avatar-initial'),
    logoutBtn: document.getElementById('logout-btn'),
    
    createGroupForm: document.getElementById('create-group-form'),
    newGroupName: document.getElementById('new-group-name'),
    groupsList: document.getElementById('groups-list'),
    refreshGroupsBtn: document.getElementById('refresh-groups-btn'),
    
    chatWelcomeScreen: document.getElementById('chat-welcome-screen'),
    chatActiveScreen: document.getElementById('chat-active-screen'),
    activeGroupName: document.getElementById('active-group-name'),
    activeGroupId: document.getElementById('active-group-id'),
    activeGroupAvatar: document.getElementById('active-group-avatar'),
    todayOnlyToggle: document.getElementById('today-only-toggle'),
    deleteGroupBtn: document.getElementById('delete-group-btn'),
    backToSidebarBtn: document.getElementById('back-to-sidebar-btn'),
    
    messagesLog: document.getElementById('messages-log'),
    chatInputForm: document.getElementById('chat-input-form'),
    chatMessageInput: document.getElementById('chat-message-input'),
    
    // Delete group modal
    deleteModal: document.getElementById('delete-modal'),
    deleteMasterUid: document.getElementById('delete-master-uid'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    deleteModalAlert: document.getElementById('delete-modal-alert')
};

// API Base URL
const API_BASE = '/api';

// Helper: Show Alert Message
function showAlert(element, message, type = 'danger') {
    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// Initial Loading of Session
function initSession() {
    const savedUser = sessionStorage.getItem('lanchat_user');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        showChatView();
    } else {
        showAuthView();
    }
}

// Show/Hide Views
function showAuthView() {
    DOM.chatView.classList.add('hidden');
    DOM.authView.classList.remove('hidden');
    stopPolling();
}

function showChatView() {
    DOM.authView.classList.add('hidden');
    DOM.chatView.classList.remove('hidden');
    
    DOM.currentUserName.textContent = state.currentUser.name;
    DOM.currentUserId.textContent = state.currentUser.uniqueId;
    DOM.userAvatarInitial.textContent = state.currentUser.name.charAt(0).toUpperCase();
    
    loadGroups();
}

// Tab Switching (Login / Register)
DOM.tabLogin.addEventListener('click', () => {
    DOM.tabLogin.classList.add('active');
    DOM.tabRegister.classList.remove('active');
    DOM.loginForm.classList.remove('hidden');
    DOM.registerForm.classList.add('hidden');
});

DOM.tabRegister.addEventListener('click', () => {
    DOM.tabRegister.classList.add('active');
    DOM.tabLogin.classList.remove('active');
    DOM.registerForm.classList.remove('hidden');
    DOM.loginForm.classList.add('hidden');
});

// Event Handler: Register
DOM.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uniqueId = DOM.regUid.value.trim();
    const name = DOM.regName.value.trim();
    const password = DOM.regPwd.value;
    
    if (!uniqueId.startsWith('727723EUIT')) {
        showAlert(DOM.authAlert, 'Unique ID must start with college prefix "727723EUIT"', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uniqueId, name, password })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Registration failed');
        }
        
        const success = await response.json();
        if (success) {
            showAlert(DOM.authAlert, 'Registration successful! Please login.', 'success');
            // Store name temporarily so we can pre-fill login
            localStorage.setItem(`name_${uniqueId}`, name);
            DOM.loginUid.value = uniqueId;
            DOM.tabLogin.click();
            DOM.regUid.value = '';
            DOM.regName.value = '';
            DOM.regPwd.value = '';
        } else {
            showAlert(DOM.authAlert, 'Registration failed. User may already exist.', 'danger');
        }
    } catch (err) {
        showAlert(DOM.authAlert, err.message, 'danger');
    }
});

// Event Handler: Login
DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const uniqueId = DOM.loginUid.value.trim();
    const password = DOM.loginPwd.value;
    
    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uniqueId, password })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Invalid credentials');
        }
        
        const loggedIn = await response.json();
        if (loggedIn) {
            // Find display name from localStorage or fallback to uniqueId
            const savedName = localStorage.getItem(`name_${uniqueId}`) || uniqueId;
            state.currentUser = { uniqueId, name: savedName };
            sessionStorage.setItem('lanchat_user', JSON.stringify(state.currentUser));
            showChatView();
            DOM.loginUid.value = '';
            DOM.loginPwd.value = '';
        } else {
            showAlert(DOM.authAlert, 'Invalid ID or password', 'danger');
        }
    } catch (err) {
        showAlert(DOM.authAlert, err.message || 'Login failed', 'danger');
    }
});

// Event Handler: Logout
DOM.logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('lanchat_user');
    state.currentUser = null;
    state.activeGroup = null;
    DOM.chatView.classList.remove('show-chat');
    DOM.chatActiveScreen.classList.add('hidden');
    DOM.chatWelcomeScreen.classList.remove('hidden');
    showAuthView();
});

// Event Handler: Back to Sidebar (Mobile Only)
if (DOM.backToSidebarBtn) {
    DOM.backToSidebarBtn.addEventListener('click', () => {
        DOM.chatView.classList.remove('show-chat');
    });
}

// Load Groups List
async function loadGroups() {
    try {
        const response = await fetch(`${API_BASE}/groups/`);
        if (!response.ok) throw new Error('Failed to load groups');
        
        state.groups = await response.json();
        renderGroups();
    } catch (err) {
        console.error(err);
        DOM.groupsList.innerHTML = `<li class="empty-state">Failed to load groups</li>`;
    }
}

// Refresh Groups Action
DOM.refreshGroupsBtn.addEventListener('click', loadGroups);

// Render Groups in Sidebar
function renderGroups() {
    if (state.groups.length === 0) {
        DOM.groupsList.innerHTML = `<li class="empty-state">No groups available. Create one!</li>`;
        return;
    }
    
    DOM.groupsList.innerHTML = state.groups.map(group => {
        const isActive = state.activeGroup && state.activeGroup.groupId === group.groupId;
        return `
            <li class="group-item ${isActive ? 'active' : ''}" onclick="selectGroup('${group.groupId}', '${escapeHtml(group.groupName)}')">
                <div class="group-avatar">${escapeHtml(group.groupName).charAt(0).toUpperCase()}</div>
                <div class="group-info">
                    <div class="group-name">${escapeHtml(group.groupName)}</div>
                    <div class="group-id-text">ID: ${group.groupId}</div>
                </div>
            </li>
        `;
    }).join('');
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Select a Chat Group
window.selectGroup = function(groupId, groupName) {
    state.activeGroup = { groupId, groupName };
    
    // Highlight selected group in list
    document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));
    renderGroups(); // Re-render to ensure selection class is applied correctly
    
    // Add show-chat class for mobile responsive sliding transition
    DOM.chatView.classList.add('show-chat');
    
    // Update Header UI
    DOM.chatWelcomeScreen.classList.add('hidden');
    DOM.chatActiveScreen.classList.remove('hidden');
    DOM.activeGroupName.textContent = groupName;
    DOM.activeGroupId.textContent = `ID: ${groupId}`;
    DOM.activeGroupAvatar.textContent = groupName.charAt(0).toUpperCase();
    
    // Reset message array and load immediately
    state.messages = [];
    DOM.messagesLog.innerHTML = `<div class="loading-state">Loading messages...</div>`;
    loadMessages(true);
    
    // Restart polling
    startPolling();
};

// Load Messages for Active Group
async function loadMessages(isInitial = false) {
    if (!state.activeGroup) return;
    
    const groupId = state.activeGroup.groupId;
    const url = state.todayOnly 
        ? `${API_BASE}/chats/?groupId=${groupId}` 
        : `${API_BASE}/chats/all?groupId=${groupId}`;
        
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load chats');
        
        const newMessages = await response.json();
        
        // Only update DOM if the message count or contents have changed
        if (JSON.stringify(newMessages) !== JSON.stringify(state.messages)) {
            state.messages = newMessages;
            renderMessages();
            if (isInitial) {
                scrollToBottom();
            }
        }
    } catch (err) {
        console.error('Error fetching messages:', err);
    }
}

// Render Messages in Active Chat Window
function renderMessages() {
    if (state.messages.length === 0) {
        DOM.messagesLog.innerHTML = `<div class="empty-state">No messages in this group yet. Send a message to start!</div>`;
        return;
    }
    
    let html = '';
    let lastDateStr = '';
    
    state.messages.forEach(msg => {
        // Date divider logic
        let dateHeaderHtml = '';
        if (msg.createdAt) {
            const msgDate = new Date(msg.createdAt);
            const dateStr = msgDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            
            if (dateStr !== lastDateStr) {
                dateHeaderHtml = `<div class="date-divider">${dateStr}</div>`;
                lastDateStr = dateStr;
            }
        }
        
        const isSentByMe = msg.name === state.currentUser.name || msg.name === state.currentUser.uniqueId;
        const timeStr = msg.createdAt ? formatTime(msg.createdAt) : '';
        
        html += `
            ${dateHeaderHtml}
            <div class="message-row ${isSentByMe ? 'sent' : 'received'}">
                <div class="message-bubble">
                    <div class="message-sender">${escapeHtml(msg.name)}</div>
                    <div class="message-text">${escapeHtml(msg.message)}</div>
                    <span class="message-time">${timeStr}</span>
                </div>
            </div>
        `;
    });
    
    DOM.messagesLog.innerHTML = html;
}

// Helper: Format ISO date string to hh:mm AM/PM
function formatTime(isoString) {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
}

// Scroll Messages Log to bottom
function scrollToBottom() {
    DOM.messagesLog.scrollTop = DOM.messagesLog.scrollHeight;
}

// Send Message
DOM.chatInputForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.activeGroup || !state.currentUser) return;
    
    const message = DOM.chatMessageInput.value.trim();
    if (!message) return;
    
    const chatObj = {
        name: state.currentUser.name,
        groupId: state.activeGroup.groupId,
        message: message
    };
    
    DOM.chatMessageInput.value = '';
    
    try {
        const response = await fetch(`${API_BASE}/chats/post`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatObj)
        });
        
        if (!response.ok) throw new Error('Failed to post message');
        
        // Immediately fetch and render updated messages list
        await loadMessages();
        scrollToBottom();
    } catch (err) {
        console.error('Error sending message:', err);
    }
});

// Event Handler: Create Group
DOM.createGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupName = DOM.newGroupName.value.trim();
    if (!groupName) return;
    
    try {
        const response = await fetch(`${API_BASE}/groups/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupName })
        });
        
        if (!response.ok) throw new Error('Failed to create group');
        
        DOM.newGroupName.value = '';
        await loadGroups();
        
        // Select the newly created group if returned
        const newGroupObj = await response.json();
        if (newGroupObj && newGroupObj.groupId) {
            selectGroup(newGroupObj.groupId, newGroupObj.groupName);
        }
    } catch (err) {
        console.error(err);
    }
});

// Switch Filter (Today vs All)
DOM.todayOnlyToggle.addEventListener('change', (e) => {
    state.todayOnly = e.target.checked;
    loadMessages(true);
});

// Polling Timers for real-time update
function startPolling() {
    stopPolling();
    state.pollingInterval = setInterval(() => {
        loadMessages();
    }, 2000);
}

function stopPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
    }
}

// --- DELETE GROUP LOGIC ---
DOM.deleteGroupBtn.addEventListener('click', () => {
    if (!state.activeGroup) return;
    DOM.deleteMasterUid.value = '';
    DOM.deleteModalAlert.classList.add('hidden');
    DOM.deleteModal.classList.remove('hidden');
});

DOM.cancelDeleteBtn.addEventListener('click', () => {
    DOM.deleteModal.classList.add('hidden');
});

DOM.confirmDeleteBtn.addEventListener('click', async () => {
    const enteredUid = DOM.deleteMasterUid.value.trim();
    if (!enteredUid) {
        showAlert(DOM.deleteModalAlert, 'Please enter your Unique ID.', 'danger');
        return;
    }
    
    if (enteredUid !== state.currentUser.uniqueId) {
        showAlert(DOM.deleteModalAlert, 'Incorrect ID. You must enter your own Unique ID to delete.', 'danger');
        return;
    }
    
    const groupId = state.activeGroup.groupId;
    
    try {
        const response = await fetch(`${API_BASE}/groups/delete?groupId=${groupId}&userId=${enteredUid}`, {
            method: 'DELETE'
        });
        
        const text = await response.text();
        if (!response.ok) {
            throw new Error(text || 'Failed to delete group');
        }
        
        // Success
        DOM.deleteModal.classList.add('hidden');
        state.activeGroup = null;
        DOM.chatActiveScreen.classList.add('hidden');
        DOM.chatWelcomeScreen.classList.remove('hidden');
        await loadGroups();
    } catch (err) {
        showAlert(DOM.deleteModalAlert, err.message || 'Error occurred during deletion', 'danger');
    }
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', initSession);
