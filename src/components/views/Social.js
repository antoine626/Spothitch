/**
 * Social View Component
 * Chat rooms + Friends list + Private messages
 */

import { t } from '../../i18n/index.js';
import { renderSkeletonChatList, renderSkeletonFriendCard } from '../ui/Skeleton.js';
import { getTrustBadge } from '../../services/identityVerification.js';

export function renderSocial(state) {
  const activeSubTab = state.socialSubTab || 'general';

  return `
    <div class="flex flex-col h-[calc(100vh-140px)]">
      <!-- Sub-tabs -->
      <div class="flex gap-2 p-3 bg-dark-secondary/50">
        <button
          onclick="setSocialTab('general')"
          class="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
  activeSubTab === 'general'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-globe mr-1" aria-hidden="true"></i>
          Général
        </button>
        <button
          onclick="setSocialTab('regional')"
          class="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
  activeSubTab === 'regional'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-map-marker-alt mr-1" aria-hidden="true"></i>
          Régional
        </button>
        <button
          onclick="setSocialTab('friends')"
          class="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all relative ${
  activeSubTab === 'friends'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-user-friends mr-1" aria-hidden="true"></i>
          Amis
          ${(state.unreadFriendMessages || 0) > 0 ? `
            <span class="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 rounded-full text-xs flex items-center justify-center">
              ${state.unreadFriendMessages}
            </span>
          ` : ''}
        </button>
        <button
          onclick="setSocialTab('groups')"
          class="flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
  activeSubTab === 'groups'
    ? 'bg-primary-500 text-white'
    : 'text-slate-400 hover:text-white hover:bg-white/5'
}"
        >
          <i class="fas fa-users mr-1" aria-hidden="true"></i>
          Groupes
        </button>
      </div>

      <!-- Content -->
      ${activeSubTab === 'friends'
    ? renderFriends(state)
    : activeSubTab === 'groups'
      ? renderTravelGroups(state)
      : renderChatRoom(state, activeSubTab)}
    </div>
  `;
}

function renderChatRoom(state, room) {
  const messages = (state.messages || []).filter(m => m.room === room || (!m.room && room === 'general'));

  return `
    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3" id="chat-messages" role="log" aria-live="polite">
      ${state.chatLoading
    ? renderSkeletonChatList(6)
    : (messages.length > 0
      ? messages.map(msg => renderMessage(msg, state)).join('')
      : renderEmptyChat(room))
}
    </div>

    <!-- Message Input -->
    <div class="p-4 glass-dark">
      <form class="flex gap-2" onsubmit="event.preventDefault(); sendMessage('${room}');">
        <input
          type="text"
          class="input-field flex-1"
          placeholder="Écrire un message..."
          id="chat-input"
          autocomplete="off"
          aria-label="Écrire un message"
        />
        <button
          type="submit"
          class="btn-primary px-4"
          aria-label="Envoyer"
        >
          <i class="fas fa-paper-plane" aria-hidden="true"></i>
        </button>
      </form>
    </div>
  `;
}

function renderMessage(msg, state) {
  const isSent = msg.userId === state.user?.uid;

  return `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'}">
      <div class="max-w-[80%] ${isSent ? 'bg-primary-500/20' : 'bg-white/5'} rounded-2xl px-4 py-2 ${isSent ? 'rounded-br-md' : 'rounded-bl-md'}">
        ${!isSent ? `
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">${msg.userAvatar || '🤙'}</span>
            <span class="text-xs font-medium text-primary-400">${msg.userName || 'Voyageur'}</span>
          </div>
        ` : ''}
        <p class="text-sm text-white">${msg.text}</p>
        <time class="text-xs text-slate-500 mt-1 block ${isSent ? 'text-right' : ''}">
          ${formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  `;
}

function renderEmptyChat(room) {
  const messages = {
    general: { icon: '💬', title: 'Chat général', desc: 'Discute avec la communauté mondiale' },
    regional: { icon: '📍', title: 'Chat régional', desc: 'Trouve des voyageurs près de toi' },
  };
  const info = messages[room] || messages.general;

  return `
    <div class="text-center py-12">
      <span class="text-5xl mb-4 block">${info.icon}</span>
      <h3 class="text-lg font-bold mb-2">${info.title}</h3>
      <p class="text-slate-400 text-sm">${info.desc}</p>
      <p class="text-slate-500 text-xs mt-2">Sois le premier à écrire !</p>
    </div>
  `;
}

function renderFriends(state) {
  const friends = state.friends || [];
  const friendRequests = state.friendRequests || [];
  const selectedFriend = state.selectedFriendChat ? friends.find(f => f.id === state.selectedFriendChat) : null;

  if (selectedFriend) {
    return renderPrivateChat(state, selectedFriend);
  }

  // Show skeleton while loading
  if (state.friendsLoading) {
    return `
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="skeleton h-12 w-full rounded-xl"></div>
        <div class="space-y-2">
          ${Array(5).fill(0).map(() => renderSkeletonFriendCard()).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Add Friend -->
      <div class="space-y-2">
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              type="text"
              placeholder="Nom du voyageur..."
              class="input-field w-full pl-10"
              id="friend-search"
              aria-label="Nom de l'ami a ajouter"
              onkeydown="if(event.key==='Enter') addFriendByName()"
            />
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
          </div>
          <button
            onclick="addFriendByName()"
            class="btn-primary px-4"
            aria-label="Ajouter un ami"
          >
            <i class="fas fa-user-plus" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <!-- Friend Requests -->
      ${friendRequests.length > 0 ? `
        <div class="card p-4 border-primary-500/30">
          <h4 class="font-bold text-sm mb-3 flex items-center gap-2">
            <i class="fas fa-user-plus text-primary-400" aria-hidden="true"></i>
            Demandes d'amis (${friendRequests.length})
          </h4>
          <div class="space-y-2">
            ${friendRequests.map(req => `
              <div class="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">${req.avatar || '🤙'}</span>
                  <div>
                    <div class="font-medium">${req.name}</div>
                    <div class="text-xs text-slate-400">Niveau ${req.level || 1}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    onclick="acceptFriendRequest('${req.id}')"
                    class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    aria-label="Accepter"
                  >
                    <i class="fas fa-check" aria-hidden="true"></i>
                  </button>
                  <button
                    onclick="declineFriendRequest('${req.id}')"
                    class="w-8 h-8 rounded-full bg-danger-500/20 text-danger-400 hover:bg-danger-500/30"
                    aria-label="Refuser"
                  >
                    <i class="fas fa-times" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Friends List -->
      ${friends.length > 0 ? `
        <div class="space-y-2">
          <h4 class="font-bold text-sm text-slate-400 px-1">
            Mes amis (${friends.length})
          </h4>
          ${friends.map(friend => `
            <button
              onclick="openFriendChat('${friend.id}')"
              class="card p-3 w-full text-left hover:border-primary-500/50 transition-all flex items-center gap-3"
            >
              <div class="relative">
                <span class="text-3xl">${friend.avatar || '🤙'}</span>
                <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-primary ${
  friend.online ? 'bg-emerald-500' : 'bg-slate-500'
}"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <div class="font-medium truncate">${friend.name}</div>
                  ${getTrustBadge(friend.verificationLevel || 0)}
                </div>
                <div class="text-xs text-slate-400">
                  ${friend.lastMessage || (friend.online ? 'En ligne' : 'Hors ligne')}
                </div>
              </div>
              ${friend.unread > 0 ? `
                <span class="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                  ${friend.unread}
                </span>
              ` : ''}
              <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
            </button>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-12">
          <span class="text-5xl mb-4 block">👥</span>
          <h3 class="text-lg font-bold mb-2">Pas encore d'amis</h3>
          <p class="text-slate-400 text-sm">Ajoute des compagnons de voyage !</p>
          <button
            onclick="showAddFriend()"
            class="btn-primary mt-4"
          >
            <i class="fas fa-user-plus mr-2" aria-hidden="true"></i>
            Ajouter un ami
          </button>
        </div>
      `}
    </div>
  `;
}

function renderPrivateChat(state, friend) {
  const messages = state.privateMessages?.[friend.id] || [];

  return `
    <!-- Header -->
    <div class="p-3 bg-dark-secondary/50 flex items-center gap-3">
      <button
        onclick="closeFriendChat()"
        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="Retour"
      >
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
      </button>
      <div class="relative">
        <span class="text-2xl">${friend.avatar || '🤙'}</span>
        <span class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-secondary ${
  friend.online ? 'bg-emerald-500' : 'bg-slate-500'
}"></span>
      </div>
      <div class="flex-1">
        <div class="font-medium">${friend.name}</div>
        <div class="text-xs text-slate-400">${friend.online ? 'En ligne' : 'Hors ligne'}</div>
      </div>
      <button
        onclick="showFriendProfile('${friend.id}')"
        class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
        aria-label="Voir le profil"
      >
        <i class="fas fa-user" aria-hidden="true"></i>
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3" id="private-messages" role="log">
      ${messages.length > 0
    ? messages.map(msg => renderMessage(msg, state)).join('')
    : `
          <div class="text-center py-12">
            <span class="text-4xl mb-4 block">💬</span>
            <p class="text-slate-400 text-sm">Commence la conversation !</p>
          </div>
        `
}
    </div>

    <!-- Input -->
    <div class="p-4 glass-dark">
      <form class="flex gap-2" onsubmit="event.preventDefault(); sendPrivateMessage('${friend.id}');">
        <input
          type="text"
          class="input-field flex-1"
          placeholder="Message à ${friend.name}..."
          id="private-chat-input"
          autocomplete="off"
        />
        <button
          type="submit"
          class="btn-primary px-4"
          aria-label="Envoyer"
        >
          <i class="fas fa-paper-plane" aria-hidden="true"></i>
        </button>
      </form>
    </div>
  `;
}

function renderTravelGroups(state) {
  const groups = state.travelGroups || [];
  const myGroups = groups.filter(g => g.members?.includes(state.user?.uid));

  return `
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Create Group Button -->
      <button
        onclick="openCreateTravelGroup()"
        class="card p-4 w-full text-left border-dashed border-2 border-white/20 hover:border-primary-500/50 transition-all"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <i class="fas fa-plus text-primary-400 text-xl" aria-hidden="true"></i>
          </div>
          <div>
            <div class="font-bold">Créer un groupe de voyage</div>
            <div class="text-sm text-slate-400">Planifiez ensemble avec vos compagnons</div>
          </div>
        </div>
      </button>

      <!-- Nearby Friends Widget -->
      <button
        onclick="openNearbyFriends()"
        class="card p-4 w-full text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 hover:border-emerald-500/50 transition-all"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <i class="fas fa-location-dot text-emerald-400 text-xl" aria-hidden="true"></i>
            </div>
            <div>
              <div class="font-bold">Amis à proximité</div>
              <div class="text-sm text-slate-400">Voir qui est près de vous</div>
            </div>
          </div>
          <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
        </div>
      </button>

      <!-- My Groups -->
      ${myGroups.length > 0 ? `
        <div class="space-y-3">
          <h4 class="font-bold text-sm text-slate-400 px-1">Mes groupes (${myGroups.length})</h4>
          ${myGroups.map(group => `
            <button
              onclick="openTravelGroupDetail('${group.id}')"
              class="card p-4 w-full text-left hover:border-primary-500/50 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <span class="text-2xl">${group.icon || '🚗'}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold truncate">${group.name}</div>
                  <div class="text-sm text-slate-400">${group.members?.length || 0} membres</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-primary-400">${group.status || 'Planification'}</div>
                  <i class="fas fa-chevron-right text-slate-500 mt-1" aria-hidden="true"></i>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-8">
          <span class="text-5xl mb-4 block">🚐</span>
          <h3 class="text-lg font-bold mb-2">Pas encore de groupe</h3>
          <p class="text-slate-400 text-sm mb-4">Créez un groupe pour voyager ensemble !</p>
        </div>
      `}
    </div>
  `;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Global handlers
window.setSocialTab = (tab) => {
  window.setState?.({ socialSubTab: tab });
};

window.openFriendChat = (friendId) => {
  window.setState?.({ selectedFriendChat: friendId });
};

window.closeFriendChat = () => {
  window.setState?.({ selectedFriendChat: null });
};

window.sendMessage = async (room) => {
  const input = document.getElementById('chat-input');
  if (!input?.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  const { getState, setState } = await import('../../stores/state.js');
  const state = getState();
  const messages = state.messages || [];

  const newMsg = {
    id: Date.now().toString(),
    room: room || 'general',
    text,
    userName: state.username || 'Voyageur',
    userAvatar: state.avatar || '🤙',
    userId: state.user?.uid || 'local-user',
    createdAt: new Date().toISOString(),
  };

  const updatedMessages = [...messages, newMsg];
  setState({ messages: updatedMessages });

  // Persist to localStorage
  try {
    localStorage.setItem('spothitch_messages', JSON.stringify(updatedMessages.slice(-100)));
  } catch (e) { /* quota exceeded */ }

  // Try Firebase too (non-blocking)
  try {
    const { sendChatMessage } = await import('../../services/firebase.js');
    await sendChatMessage(room, text);
  } catch (e) {
    // Firebase not configured - local only
  }

  // Scroll to bottom
  setTimeout(() => {
    const chatEl = document.getElementById('chat-messages');
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
  }, 50);
};

window.sendPrivateMessage = async (friendId) => {
  const input = document.getElementById('private-chat-input');
  if (!input?.value.trim()) return;

  const text = input.value.trim();
  input.value = '';

  const { getState, setState } = await import('../../stores/state.js');
  const state = getState();
  const privateMessages = state.privateMessages || {};
  const friendMsgs = privateMessages[friendId] || [];

  const newMsg = {
    id: Date.now().toString(),
    text,
    userName: state.username || 'Moi',
    userAvatar: state.avatar || '🤙',
    userId: state.user?.uid || 'local-user',
    createdAt: new Date().toISOString(),
  };

  const updatedFriendMsgs = [...friendMsgs, newMsg];
  const updatedPrivateMessages = { ...privateMessages, [friendId]: updatedFriendMsgs };
  setState({ privateMessages: updatedPrivateMessages });

  // Persist to localStorage
  try {
    localStorage.setItem('spothitch_private_messages', JSON.stringify(updatedPrivateMessages));
  } catch (e) { /* quota exceeded */ }

  // Scroll to bottom
  setTimeout(() => {
    const chatEl = document.getElementById('private-messages');
    if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
  }, 50);
};

window.acceptFriendRequest = async (requestId) => {
  // TODO: Implement
  console.log('Accept friend request:', requestId);
  window.showSuccess?.('Ami ajouté !');

  // Show contextual tip for first friend added
  try {
    const { triggerFriendAddedTip } = await import('../../services/contextualTips.js');
    triggerFriendAddedTip();
  } catch (e) {
    // Silently fail if tips service not available
  }
};

window.declineFriendRequest = (requestId) => {
  // TODO: Implement
  console.log('Decline friend request:', requestId);
};

window.showAddFriend = () => {
  window.setState?.({ socialSubTab: 'friends' });
  setTimeout(() => document.getElementById('friend-search')?.focus(), 100);
};

window.addFriendByName = async () => {
  const input = document.getElementById('friend-search');
  const name = input?.value?.trim();
  if (!name) {
    window.showToast?.('Entre un nom de voyageur', 'warning');
    return;
  }

  const { getState, setState } = await import('../../stores/state.js');
  const state = getState();
  const friends = state.friends || [];

  // Check duplicate
  if (friends.some(f => f.name.toLowerCase() === name.toLowerCase())) {
    window.showToast?.('Cet ami est deja dans ta liste', 'warning');
    return;
  }

  const avatars = ['🤙', '🧗', '🏄', '🚶', '🧭', '🎒', '🌍', '🛤️'];
  const newFriend = {
    id: `friend_${Date.now()}`,
    name,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    level: Math.floor(Math.random() * 10) + 1,
    online: Math.random() > 0.5,
    unread: 0,
    addedAt: new Date().toISOString(),
  };

  setState({ friends: [...friends, newFriend] });
  if (input) input.value = '';
  window.showToast?.(`${name} ajouté a tes amis !`, 'success');
};

window.removeFriend = async (friendId) => {
  const { getState, setState } = await import('../../stores/state.js');
  const state = getState();
  setState({ friends: (state.friends || []).filter(f => f.id !== friendId) });
  window.showToast?.('Ami retiré', 'info');
};

window.showFriendProfile = (friendId) => {
  window.setState?.({ showFriendProfile: true, selectedFriendProfileId: friendId });
};

export default { renderSocial };
