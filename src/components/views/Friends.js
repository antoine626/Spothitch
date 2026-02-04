/**
 * Friends View Component
 * Friends list and private chat
 */

import { getState, setState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';

/**
 * Render friends list view
 */
export function renderFriends(state) {
  const { friends = [], friendRequests = [], searchFriendQuery = '' } = state;

  // Filter friends by search
  let displayFriends = friends;
  if (searchFriendQuery) {
    const query = searchFriendQuery.toLowerCase();
    displayFriends = friends.filter(f => f.name.toLowerCase().includes(query));
  }

  const onlineFriends = displayFriends.filter(f => f.online);
  const offlineFriends = displayFriends.filter(f => !f.online);

  return `
    <div class="friends-view pb-24">
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900/95 backdrop-blur z-10 border-b border-gray-700">
        <div class="flex items-center justify-between p-4">
          <div>
            <h1 class="text-xl font-bold text-white">Amis</h1>
            <p class="text-gray-500 text-sm">${friends.length} ami(s)</p>
          </div>
          <button onclick="showAddFriend()"
                  class="p-2 bg-sky-500 text-white rounded-full"
                  type="button"
                  aria-label="Ajouter un ami">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="px-4 pb-4">
          <label for="friend-search-input" class="sr-only">Rechercher un ami</label>
          <input
            type="search"
            id="friend-search-input"
            placeholder="Rechercher un ami..."
            value="${searchFriendQuery}"
            oninput="setState({searchFriendQuery: this.value})"
            class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white
                   placeholder-gray-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <!-- Friend Requests -->
      ${friendRequests.length > 0 ? `
        <div class="p-4 border-b border-gray-700">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Demandes (${friendRequests.length})
          </h2>
          <div class="space-y-2">
            ${friendRequests.map(request => `
              <div class="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-500/20 to-cyan-500/20
                          border border-sky-500/30 rounded-xl">
                <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-xl">
                  ${request.avatar || '🤙'}
                </div>
                <div class="flex-1">
                  <div class="text-white font-medium">${request.name}</div>
                  <div class="text-gray-500 text-xs">Veut devenir ton ami</div>
                </div>
                <button onclick="acceptFriendRequest('${request.id}')"
                        class="px-3 py-1.5 bg-sky-500 text-white text-sm rounded-lg">
                  Accepter
                </button>
                <button onclick="rejectFriendRequest('${request.id}')"
                        class="p-1.5 text-gray-400 hover:text-red-400">
                  ✕
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Online Friends -->
      ${onlineFriends.length > 0 ? `
        <div class="p-4">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            En ligne (${onlineFriends.length})
          </h2>
          <div class="space-y-2">
            ${onlineFriends.map(friend => renderFriendCard(friend, true)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Offline Friends -->
      ${offlineFriends.length > 0 ? `
        <div class="p-4 ${onlineFriends.length > 0 ? 'border-t border-gray-700' : ''}">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Hors ligne (${offlineFriends.length})
          </h2>
          <div class="space-y-2">
            ${offlineFriends.map(friend => renderFriendCard(friend, false)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Empty State -->
      ${friends.length === 0 ? `
        <div class="text-center py-20 px-8">
          <div class="text-6xl mb-4">👋</div>
          <h2 class="text-xl font-bold text-white mb-2">Aucun ami pour l'instant</h2>
          <p class="text-gray-500 mb-6">
            Ajoute des amis pour discuter et voyager ensemble !
          </p>
          <button onclick="showAddFriend()"
                  class="px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl">
            Ajouter un ami
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render a friend card
 */
function renderFriendCard(friend, isOnline) {
  return `
    <div class="friend-card flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer
                hover:bg-gray-750 transition-colors"
         onclick="openFriendsChat('${friend.id}')">
      <div class="relative">
        <div class="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
          ${friend.avatar || '🤙'}
        </div>
        <div class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-800
                    ${isOnline ? 'bg-green-500' : 'bg-gray-500'}"></div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-white font-medium">${friend.name}</div>
        <div class="text-gray-500 text-xs truncate">
          ${isOnline ? 'En ligne' : friend.lastSeen ? `Vu ${formatRelativeTime(friend.lastSeen)}` : 'Hors ligne'}
        </div>
      </div>
      ${friend.unreadCount > 0 ? `
        <div class="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          ${friend.unreadCount}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 7) return `il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Render friends chat view
 */
export function renderFriendsChat(friendId) {
  const { friends = [], privateChatMessages = {} } = getState();
  const friend = friends.find(f => f.id === friendId);

  if (!friend) {
    return `
      <div class="text-center py-20 text-gray-500">
        <span class="text-4xl">❌</span>
        <p class="mt-4">Ami non trouvé</p>
        <button onclick="showFriends()" class="mt-4 text-sky-400 hover:text-sky-300">
          Retour aux amis
        </button>
      </div>
    `;
  }

  const messages = privateChatMessages[friendId] || [];

  return `
    <div class="friends-chat flex flex-col h-full">
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900/95 backdrop-blur z-10 border-b border-gray-700">
        <div class="flex items-center gap-3 p-4">
          <button onclick="showFriends()" class="p-2 hover:bg-gray-800 rounded-full">
            ←
          </button>
          <div class="relative">
            <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-xl">
              ${friend.avatar || '🤙'}
            </div>
            <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900
                        ${friend.online ? 'bg-green-500' : 'bg-gray-500'}"></div>
          </div>
          <div class="flex-1">
            <div class="text-white font-medium">${friend.name}</div>
            <div class="text-gray-500 text-xs">
              ${friend.online ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
          <button onclick="showFriendOptions('${friend.id}')"
                  class="p-2 hover:bg-gray-800 rounded-full text-gray-400">
            ⋮
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3" id="private-chat-messages">
        ${messages.length === 0 ? `
          <div class="text-center py-10 text-gray-500">
            <span class="text-3xl">💬</span>
            <p class="mt-2 text-sm">Aucun message encore</p>
            <p class="text-xs">Dis bonjour !</p>
          </div>
        ` : messages.map(msg => renderPrivateMessage(msg, friend)).join('')}
      </div>

      <!-- Input -->
      <div class="sticky bottom-16 bg-gray-900 border-t border-gray-700 p-4">
        <div class="flex gap-2">
          <input
            type="text"
            id="private-chat-input"
            placeholder="Message..."
            class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white
                   placeholder-gray-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            onkeydown="if(event.key==='Enter')sendPrivateMessage('${friend.id}')"
          />
          <button onclick="sendPrivateMessage('${friend.id}')"
                  class="px-4 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a private message
 */
function renderPrivateMessage(message, friend) {
  const { user } = getState();
  const isOwn = message.senderId === user?.uid;

  return `
    <div class="flex ${isOwn ? 'justify-end' : 'justify-start'}">
      <div class="flex items-end gap-2 max-w-[80%]">
        ${!isOwn ? `
          <div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm flex-shrink-0">
            ${friend.avatar || '🤙'}
          </div>
        ` : ''}
        <div class="${isOwn ? 'bg-sky-500 text-white' : 'bg-gray-800 text-gray-100'}
                    px-4 py-2.5 rounded-2xl ${isOwn ? 'rounded-br-md' : 'rounded-bl-md'}">
          <p class="text-sm">${message.text}</p>
          <p class="text-xs mt-1 ${isOwn ? 'text-sky-200' : 'text-gray-500'}">
            ${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render add friend modal
 */
export function renderAddFriendModal() {
  return `
    <div class="add-friend-modal fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
         onclick="if(event.target===this)closeAddFriend()">
      <div class="bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white">Ajouter un ami</h2>
          <button onclick="closeAddFriend()" class="p-2 hover:bg-gray-800 rounded-full">
            ✕
          </button>
        </div>

        <!-- Search by username -->
        <div class="mb-4">
          <label class="block text-gray-400 text-sm mb-2">Par pseudo</label>
          <div class="relative">
            <input
              type="text"
              id="friend-search"
              placeholder="Rechercher un pseudo..."
              class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                     placeholder-gray-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              oninput="searchUsers(this.value)"
            />
            <div id="user-search-results" class="absolute top-full left-0 right-0 mt-1 hidden"></div>
          </div>
        </div>

        <!-- Share link -->
        <div class="mb-4">
          <label class="block text-gray-400 text-sm mb-2">Ou partage ton lien</label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              value="spothitch.app/add/user123"
              class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-400"
            />
            <button onclick="copyFriendLink()"
                    class="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white hover:bg-gray-750">
              📋
            </button>
          </div>
        </div>

        <!-- QR Code -->
        <div class="text-center py-6 border-t border-gray-700 mt-4">
          <p class="text-gray-500 text-sm mb-3">Ou scanne le QR code</p>
          <div class="w-32 h-32 bg-white mx-auto rounded-lg flex items-center justify-center">
            <span class="text-4xl">📱</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default {
  renderFriends,
  renderFriendsChat,
  renderAddFriendModal,
};
