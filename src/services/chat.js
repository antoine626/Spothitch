/**
 * Chat Service
 * Real-time chat with Firebase, private messages, reactions, replies
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import {
  getCurrentUser,
  subscribeToChatRoom as firebaseSubscribeToChatRoom,
  sendChatMessage as firebaseSendChatMessage,
} from './firebase.js';
import { isBlocked, isConversationMuted } from './social.js';
import { showToast } from './notifications.js';

// Storage keys
const PRIVATE_MESSAGES_KEY = 'spothitch_private_messages';
const CHAT_REACTIONS_KEY = 'spothitch_chat_reactions';

// Active subscriptions
let activeSubscriptions = {};

// ==================== PUBLIC CHAT ====================

/**
 * Subscribe to a chat room
 * @param {string} room - Room name ('general', 'regional', etc.)
 * @param {Function} callback - Called when messages update
 */
export function subscribeToChatRoom(room, callback) {
  // Unsubscribe from previous room if any
  if (activeSubscriptions[room]) {
    activeSubscriptions[room]();
  }

  // Subscribe to Firebase
  const unsubscribe = firebaseSubscribeToChatRoom(room, (messages) => {
    // Filter out blocked users
    const filteredMessages = messages.filter(msg => !isBlocked(msg.userId));

    // Enrich messages with reactions
    const enrichedMessages = filteredMessages.map(msg => ({
      ...msg,
      reactions: getMessageReactions(msg.id),
      replyTo: msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null,
    }));

    callback(enrichedMessages);
  });

  activeSubscriptions[room] = unsubscribe;
  return unsubscribe;
}

/**
 * Send a message to a chat room
 * @param {string} room - Room name
 * @param {string} text - Message text
 * @param {Object} options - Optional: { replyTo, spotShare, locationShare }
 */
export async function sendChatMessage(room, text, options = {}) {
  const user = getCurrentUser();

  // Check if user is logged in
  if (!user) {
    showToast('Connecte-toi pour envoyer des messages', 'warning');
    return { success: false, error: 'not_authenticated' };
  }

  // Build message data
  const messageData = {
    text,
    userId: user.uid,
    userName: user.displayName || 'Voyageur',
    userAvatar: '🤙',
    room,
    createdAt: new Date().toISOString(),
  };

  // Add reply reference
  if (options.replyTo) {
    messageData.replyTo = options.replyTo;
    messageData.replyText = options.replyText;
    messageData.replyUser = options.replyUser;
  }

  // Add spot share
  if (options.spotShare) {
    messageData.type = 'spot_share';
    messageData.spot = {
      id: options.spotShare.id,
      name: options.spotShare.name,
      city: options.spotShare.city,
      country: options.spotShare.country,
      rating: options.spotShare.rating,
      lat: options.spotShare.lat,
      lng: options.spotShare.lng,
    };
  }

  // Add location share
  if (options.locationShare) {
    messageData.type = 'location_share';
    messageData.location = {
      lat: options.locationShare.lat,
      lng: options.locationShare.lng,
      address: options.locationShare.address || 'Position partagee',
    };
  }

  try {
    await firebaseSendChatMessage(room, messageData.text);
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
}

// ==================== PRIVATE MESSAGES ====================

/**
 * Get private messages storage
 */
function getPrivateMessagesStorage() {
  try {
    return Storage.get(PRIVATE_MESSAGES_KEY) || {};
  } catch {
    return {};
  }
}

/**
 * Save private messages storage
 */
function savePrivateMessagesStorage(data) {
  Storage.set(PRIVATE_MESSAGES_KEY, data);
}

/**
 * Get conversation ID for two users
 */
function getConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
}

/**
 * Get private messages with a user
 * @param {string} friendId - Friend's user ID
 */
export function getPrivateMessages(friendId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const storage = getPrivateMessagesStorage();
  const conversationId = getConversationId(currentUser.uid, friendId);

  return storage[conversationId] || [];
}

/**
 * Send private message
 * @param {string} friendId - Friend's user ID
 * @param {string} text - Message text
 * @param {Object} options - Optional: { replyTo, spotShare, locationShare }
 */
export function sendPrivateMessage(friendId, text, options = {}) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    showToast('Connecte-toi pour envoyer des messages', 'warning');
    return { success: false, error: 'not_authenticated' };
  }

  if (isBlocked(friendId)) {
    return { success: false, error: 'user_blocked' };
  }

  const storage = getPrivateMessagesStorage();
  const conversationId = getConversationId(currentUser.uid, friendId);

  if (!storage[conversationId]) {
    storage[conversationId] = [];
  }

  const message = {
    id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    text,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || 'Moi',
    senderAvatar: '🤙',
    receiverId: friendId,
    createdAt: new Date().toISOString(),
    read: false,
    reactions: [],
  };

  // Add reply reference
  if (options.replyTo) {
    message.replyTo = options.replyTo;
    message.replyText = options.replyText;
    message.replyUser = options.replyUser;
  }

  // Add spot share
  if (options.spotShare) {
    message.type = 'spot_share';
    message.spot = options.spotShare;
  }

  // Add location share
  if (options.locationShare) {
    message.type = 'location_share';
    message.location = options.locationShare;
  }

  storage[conversationId].push(message);
  savePrivateMessagesStorage(storage);

  // Update state
  const state = getState();
  const updatedPrivateMessages = {
    ...state.privateMessages,
    [friendId]: storage[conversationId],
  };
  setState({ privateMessages: updatedPrivateMessages });

  // Send notification if not muted
  if (!isConversationMuted(friendId)) {
    // In real app, send push notification via Firebase
    console.log('Send notification to', friendId);
  }

  return { success: true, message };
}

/**
 * Mark messages as read
 * @param {string} friendId - Friend's user ID
 */
export function markMessagesAsRead(friendId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const storage = getPrivateMessagesStorage();
  const conversationId = getConversationId(currentUser.uid, friendId);

  if (storage[conversationId]) {
    storage[conversationId] = storage[conversationId].map(msg => {
      if (msg.receiverId === currentUser.uid && !msg.read) {
        return { ...msg, read: true };
      }
      return msg;
    });
    savePrivateMessagesStorage(storage);
  }

  // Update unread count in state
  updateUnreadCount();
}

/**
 * Get unread messages count
 */
export function getUnreadCount() {
  const currentUser = getCurrentUser();
  if (!currentUser) return 0;

  const storage = getPrivateMessagesStorage();
  let count = 0;

  Object.values(storage).forEach(messages => {
    messages.forEach(msg => {
      if (msg.receiverId === currentUser.uid && !msg.read) {
        count++;
      }
    });
  });

  return count;
}

/**
 * Update unread count in state
 */
function updateUnreadCount() {
  setState({ unreadFriendMessages: getUnreadCount() });
}

// ==================== REACTIONS ====================

/**
 * Get reactions storage
 */
function getReactionsStorage() {
  try {
    return Storage.get(CHAT_REACTIONS_KEY) || {};
  } catch {
    return {};
  }
}

/**
 * Save reactions storage
 */
function saveReactionsStorage(data) {
  Storage.set(CHAT_REACTIONS_KEY, data);
}

/**
 * Available reactions
 */
export const REACTIONS = [
  { emoji: '👍', name: 'like' },
  { emoji: '❤️', name: 'love' },
  { emoji: '😂', name: 'haha' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '🤙', name: 'shaka' },
  { emoji: '🚗', name: 'car' },
  { emoji: '👏', name: 'clap' },
];

/**
 * Add reaction to message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Reaction emoji
 */
export function addReaction(messageId, emoji) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false };

  const storage = getReactionsStorage();

  if (!storage[messageId]) {
    storage[messageId] = [];
  }

  // Remove existing reaction from this user
  storage[messageId] = storage[messageId].filter(r => r.userId !== currentUser.uid);

  // Add new reaction
  storage[messageId].push({
    userId: currentUser.uid,
    userName: currentUser.displayName || 'Moi',
    emoji,
    createdAt: new Date().toISOString(),
  });

  saveReactionsStorage(storage);
  return { success: true };
}

/**
 * Remove reaction from message
 * @param {string} messageId - Message ID
 */
export function removeReaction(messageId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return { success: false };

  const storage = getReactionsStorage();

  if (storage[messageId]) {
    storage[messageId] = storage[messageId].filter(r => r.userId !== currentUser.uid);
    if (storage[messageId].length === 0) {
      delete storage[messageId];
    }
    saveReactionsStorage(storage);
  }

  return { success: true };
}

/**
 * Get reactions for a message
 * @param {string} messageId - Message ID
 */
export function getMessageReactions(messageId) {
  const storage = getReactionsStorage();
  const reactions = storage[messageId] || [];

  // Group by emoji
  const grouped = {};
  reactions.forEach(r => {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.userName);
  });

  return Object.values(grouped);
}

/**
 * Check if user has reacted to message
 * @param {string} messageId - Message ID
 */
export function getUserReaction(messageId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const storage = getReactionsStorage();
  const reactions = storage[messageId] || [];

  const userReaction = reactions.find(r => r.userId === currentUser.uid);
  return userReaction?.emoji || null;
}

// ==================== SPOT & LOCATION SHARING ====================

/**
 * Share a spot in chat
 * @param {string} chatType - 'room' or 'private'
 * @param {string} targetId - Room name or friend ID
 * @param {Object} spot - Spot data
 */
export function shareSpotInChat(chatType, targetId, spot) {
  const spotShare = {
    id: spot.id,
    name: spot.name,
    city: spot.city,
    country: spot.country,
    rating: spot.rating,
    lat: spot.lat,
    lng: spot.lng,
    thumbnail: spot.photo,
  };

  if (chatType === 'room') {
    return sendChatMessage(targetId, `Check ce spot !`, { spotShare });
  } else {
    return sendPrivateMessage(targetId, `Je te partage ce spot !`, { spotShare });
  }
}

/**
 * Share current location in chat
 * @param {string} chatType - 'room' or 'private'
 * @param {string} targetId - Room name or friend ID
 */
export async function shareLocationInChat(chatType, targetId) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      showToast('Geolocalisation non supportee', 'error');
      resolve({ success: false, error: 'not_supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationShare = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        // Try to get address via reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${locationShare.lat}&lon=${locationShare.lng}&format=json`
          );
          const data = await response.json();
          locationShare.address = data.display_name || 'Position partagee';
        } catch {
          locationShare.address = 'Position partagee';
        }

        let result;
        if (chatType === 'room') {
          result = await sendChatMessage(targetId, 'Ma position actuelle', { locationShare });
        } else {
          result = sendPrivateMessage(targetId, 'Voici ma position', { locationShare });
        }

        showToast('Position partagee !', 'success');
        resolve(result);
      },
      (error) => {
        showToast('Impossible de recuperer la position', 'error');
        resolve({ success: false, error: error.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ==================== TYPING INDICATOR ====================

let typingTimeout = null;

/**
 * Set typing status
 * @param {string} conversationId - Conversation ID
 * @param {boolean} isTyping - Whether user is typing
 */
export function setTypingStatus(conversationId, isTyping) {
  // In real app, update Firebase presence
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  if (isTyping) {
    // Auto-clear typing after 3 seconds
    typingTimeout = setTimeout(() => {
      setTypingStatus(conversationId, false);
    }, 3000);
  }

  // Update state
  setState({ typingIn: isTyping ? conversationId : null });
}

// ==================== CONVERSATION LIST ====================

/**
 * Get all conversations with last message
 */
export function getConversationsList() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const storage = getPrivateMessagesStorage();
  const state = getState();
  const friends = state.friends || [];

  const conversations = [];

  friends.forEach(friend => {
    const conversationId = getConversationId(currentUser.uid, friend.id);
    const messages = storage[conversationId] || [];
    const lastMessage = messages[messages.length - 1];
    const unreadCount = messages.filter(m => m.receiverId === currentUser.uid && !m.read).length;

    conversations.push({
      friendId: friend.id,
      friend: friend,
      lastMessage: lastMessage,
      unreadCount: unreadCount,
      isMuted: isConversationMuted(friend.id),
    });
  });

  // Sort by last message date
  conversations.sort((a, b) => {
    const dateA = a.lastMessage?.createdAt || '0';
    const dateB = b.lastMessage?.createdAt || '0';
    return dateB.localeCompare(dateA);
  });

  return conversations;
}

// ==================== CLEANUP ====================

/**
 * Unsubscribe from all chat rooms
 */
export function unsubscribeAll() {
  Object.values(activeSubscriptions).forEach(unsub => {
    if (typeof unsub === 'function') {
      unsub();
    }
  });
  activeSubscriptions = {};
}

// Initialize unread count on load
updateUnreadCount();

// Export all functions
export default {
  subscribeToChatRoom,
  sendChatMessage,
  getPrivateMessages,
  sendPrivateMessage,
  markMessagesAsRead,
  getUnreadCount,
  REACTIONS,
  addReaction,
  removeReaction,
  getMessageReactions,
  getUserReaction,
  shareSpotInChat,
  shareLocationInChat,
  setTypingStatus,
  getConversationsList,
  unsubscribeAll,
};
