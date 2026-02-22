/**
 * Chat View Component
 */

import { t } from '../../i18n/index.js';
import { escapeHTML } from '../../utils/sanitize.js';
import { renderSkeletonChatList } from '../ui/Skeleton.js';
import { icon } from '../../utils/icons.js'

export function renderChat(state) {
  const rooms = [
    { id: 'general', name: t('general'), icon: '💬', active: true },
    { id: 'help', name: t('help'), icon: '❓', active: false },
    { id: 'meetups', name: t('meetups') || 'Rencontres', icon: '🤝', active: false },
    { id: 'routes', name: t('routes') || 'Itinéraires', icon: '🛣️', active: false },
  ];

  return `
    <div class="flex flex-col h-[calc(100vh-140px)] overflow-x-hidden" role="tabpanel" id="panel-chat" aria-labelledby="tab-chat">
      <!-- Room Tabs -->
      <div class="flex gap-3 p-5 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Salons de discussion">
        ${rooms.map(room => `
          <button
            class="badge ${room.id === state.chatRoom ? 'badge-primary' : 'bg-white/5 text-slate-400'} whitespace-nowrap"
            onclick="setChatRoom('${room.id}')"
            role="tab"
            aria-selected="${room.id === state.chatRoom ? 'true' : 'false'}"
            aria-controls="chat-messages"
            type="button"
          >
            <span aria-hidden="true">${room.icon}</span> ${room.name}
          </button>
        `).join('')}
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4" id="chat-messages" role="log" aria-live="polite" aria-label="Messages du chat">
        ${state.chatLoading
    ? renderSkeletonChatList(6)
    : (state.messages.length > 0
      ? state.messages.map(msg => renderMessage(msg, state)).join('')
      : renderEmptyChat())
}
      </div>

      <!-- Message Input -->
      <div class="p-4 glass-dark">
        <form class="flex gap-2" onsubmit="event.preventDefault(); sendMessage();">
          <label for="chat-input" class="sr-only">${t('typeMessage')}</label>
          <input
            type="text"
            class="input-modern flex-1"
            placeholder="${t('typeMessage')}"
            id="chat-input"
            name="message"
            autocomplete="off"
          />
          <button
            type="submit"
            class="btn btn-primary px-4"
            aria-label="${t('send')}"
          >
            ${icon('send', 'w-5 h-5')}
          </button>
        </form>
      </div>
    </div>
  `;
}

function renderMessage(msg, state) {
  const isSent = msg.userId === state.user?.uid;
  const senderName = isSent ? 'Vous' : escapeHTML(msg.userName || 'Utilisateur');

  return `
    <article class="chat-bubble ${isSent ? 'sent' : 'received'}" aria-label="Message de ${senderName}">
      ${!isSent ? `
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg" aria-hidden="true">${escapeHTML(msg.userAvatar || '🤙')}</span>
          <span class="text-xs font-medium text-primary-400">${escapeHTML(msg.userName)}</span>
        </div>
      ` : ''}
      <p class="text-sm">${escapeHTML(msg.text)}</p>
      <div class="flex items-center justify-between mt-1">
        <time class="text-xs opacity-50" datetime="${msg.createdAt}">
          ${formatTime(msg.createdAt)}
        </time>
        ${!isSent ? `
          <button
            onclick="openReport('MESSAGE', '${msg.id || ''}')"
            class="text-xs opacity-30 hover:opacity-100 hover:text-danger-400 transition-opacity p-1"
            type="button"
            aria-label="${t('reportMessage') || 'Signaler ce message'}"
          >
            ${icon('flag', 'w-3 h-3')}
          </button>
        ` : ''}
      </div>
    </article>
  `;
}

function renderEmptyChat() {
  return `
    <div class="text-center py-12" role="status">
      ${icon('messages-square', 'w-5 h-5 text-5xl text-slate-600 mb-4')}
      <h3 class="text-lg font-bold mb-2">Pas encore de messages</h3>
      <p class="text-slate-400">Sois le premier a ecrire !</p>
    </div>
  `;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Global handlers
window.setChatRoom = (room) => {
  window.setState?.({ chatRoom: room });
};

window.handleChatKeypress = (e) => {
  if (e.key === 'Enter') {
    window.sendMessage();
  }
};

// sendMessage — canonical owner is Social.js (not duplicated here)
// Chat.js is legacy; Social.js handles all chat rendering.

export default { renderChat };
