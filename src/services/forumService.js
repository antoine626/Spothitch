/**
 * Forum/Discussions Service
 * Feature #202 - Service pour le forum communautaire
 *
 * Gestion des categories, sujets, reponses, et moderation
 * avec stockage local et support i18n complet.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage key
const FORUM_KEY = 'spothitch_forum';

// Forum categories with emojis and descriptions
export const ForumCategories = {
  general: {
    id: 'general',
    emoji: '💬',
    name: {
      fr: 'Discussion generale',
      en: 'General Discussion',
      es: 'Discusion general',
      de: 'Allgemeine Diskussion',
    },
    description: {
      fr: 'Parlez de tout et de rien, presentez-vous, partagez vos histoires',
      en: 'Talk about anything, introduce yourself, share your stories',
      es: 'Habla de todo, presentate, comparte tus historias',
      de: 'Rede uber alles, stelle dich vor, teile deine Geschichten',
    },
  },
  tips: {
    id: 'tips',
    emoji: '💡',
    name: {
      fr: 'Conseils d\'auto-stop',
      en: 'Hitchhiking Tips',
      es: 'Consejos de autostop',
      de: 'Tramper-Tipps',
    },
    description: {
      fr: 'Partagez vos astuces et apprenez des autres',
      en: 'Share your tips and learn from others',
      es: 'Comparte tus trucos y aprende de otros',
      de: 'Teile deine Tipps und lerne von anderen',
    },
  },
  routes: {
    id: 'routes',
    emoji: '🗺️',
    name: {
      fr: 'Partage d\'itineraires',
      en: 'Route Sharing',
      es: 'Compartir rutas',
      de: 'Routen teilen',
    },
    description: {
      fr: 'Partagez vos meilleurs itineraires et spots',
      en: 'Share your best routes and spots',
      es: 'Comparte tus mejores rutas y spots',
      de: 'Teile deine besten Routen und Spots',
    },
  },
  meetups: {
    id: 'meetups',
    emoji: '🎉',
    name: {
      fr: 'Rencontres et evenements',
      en: 'Meetups & Events',
      es: 'Encuentros y eventos',
      de: 'Treffen & Events',
    },
    description: {
      fr: 'Organisez des meetups et decouvrez les evenements',
      en: 'Organize meetups and discover events',
      es: 'Organiza encuentros y descubre eventos',
      de: 'Organisiere Treffen und entdecke Events',
    },
  },
  help: {
    id: 'help',
    emoji: '❓',
    name: {
      fr: 'Aide et questions',
      en: 'Help & Questions',
      es: 'Ayuda y preguntas',
      de: 'Hilfe & Fragen',
    },
    description: {
      fr: 'Posez vos questions, la communaute est la pour aider',
      en: 'Ask your questions, the community is here to help',
      es: 'Haz tus preguntas, la comunidad esta aqui para ayudar',
      de: 'Stelle deine Fragen, die Community hilft gerne',
    },
  },
};

// Topic status enum
export const TopicStatus = {
  OPEN: 'open',
  LOCKED: 'locked',
  PINNED: 'pinned',
  DELETED: 'deleted',
};

// Post status enum
export const PostStatus = {
  ACTIVE: 'active',
  EDITED: 'edited',
  DELETED: 'deleted',
  REPORTED: 'reported',
};

// Report reasons
export const ReportReasons = {
  spam: {
    fr: 'Spam',
    en: 'Spam',
    es: 'Spam',
    de: 'Spam',
  },
  inappropriate: {
    fr: 'Contenu inapproprie',
    en: 'Inappropriate content',
    es: 'Contenido inapropiado',
    de: 'Unangemessener Inhalt',
  },
  harassment: {
    fr: 'Harcelement',
    en: 'Harassment',
    es: 'Acoso',
    de: 'Belastigung',
  },
  misinformation: {
    fr: 'Desinformation',
    en: 'Misinformation',
    es: 'Desinformacion',
    de: 'Falschinformation',
  },
  other: {
    fr: 'Autre',
    en: 'Other',
    es: 'Otro',
    de: 'Andere',
  },
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get forum data from storage
 * @returns {Object} Forum data object
 */
function getForumFromStorage() {
  try {
    const data = Storage.get(FORUM_KEY);
    if (data && typeof data === 'object') {
      return {
        topics: Array.isArray(data.topics) ? data.topics : [],
        posts: Array.isArray(data.posts) ? data.posts : [],
        subscriptions: Array.isArray(data.subscriptions) ? data.subscriptions : [],
        reports: Array.isArray(data.reports) ? data.reports : [],
        likes: data.likes || { topics: {}, posts: {} },
      };
    }
    return { topics: [], posts: [], subscriptions: [], reports: [], likes: { topics: {}, posts: {} } };
  } catch (error) {
    console.error('[Forum] Error reading forum data:', error);
    return { topics: [], posts: [], subscriptions: [], reports: [], likes: { topics: {}, posts: {} } };
  }
}

/**
 * Save forum data to storage
 * @param {Object} data - Forum data to save
 */
function saveForumToStorage(data) {
  try {
    Storage.set(FORUM_KEY, data);
  } catch (error) {
    console.error('[Forum] Error saving forum data:', error);
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Format relative time
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time string
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const lang = getState().lang || 'fr';

    if (diffMins < 1) {
      return { fr: 'A l\'instant', en: 'Just now', es: 'Ahora mismo', de: 'Gerade eben' }[lang] || 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins} min`;
    }
    if (diffHours < 24) {
      return `${diffHours}h`;
    }
    if (diffDays < 7) {
      return `${diffDays}j`;
    }
    return formatDate(dateStr);
  } catch {
    return '';
  }
}

/**
 * Get current user info
 * @returns {Object} User info object
 */
function getCurrentUser() {
  const state = getState();
  return {
    id: state.user?.uid || 'anonymous',
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    isModerator: state.user?.isModerator || false,
    isAdmin: state.user?.isAdmin || false,
  };
}

/**
 * Get localized text
 * @param {Object} textObj - Object with language keys
 * @returns {string} Localized text
 */
function getLocalizedText(textObj) {
  if (!textObj || typeof textObj !== 'object') return '';
  const lang = getState().lang || 'fr';
  return textObj[lang] || textObj.en || textObj.fr || '';
}

// ============================================
// CATEGORY FUNCTIONS
// ============================================

/**
 * Get all forum categories
 * @returns {Array} Array of category objects
 */
export function getForumCategories() {
  const forum = getForumFromStorage();

  return Object.values(ForumCategories).map(category => {
    const topicsInCategory = forum.topics.filter(
      topic => topic.categoryId === category.id && topic.status !== TopicStatus.DELETED
    );

    const lastTopic = topicsInCategory
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];

    return {
      ...category,
      name: getLocalizedText(category.name),
      description: getLocalizedText(category.description),
      topicCount: topicsInCategory.length,
      postCount: forum.posts.filter(p =>
        topicsInCategory.some(t => t.id === p.topicId) && p.status !== PostStatus.DELETED
      ).length,
      lastTopic: lastTopic ? {
        id: lastTopic.id,
        title: lastTopic.title,
        author: lastTopic.author,
        updatedAt: lastTopic.updatedAt || lastTopic.createdAt,
      } : null,
    };
  });
}

/**
 * Get a single category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Category object or null
 */
export function getCategory(categoryId) {
  const category = ForumCategories[categoryId];
  if (!category) return null;

  return {
    ...category,
    name: getLocalizedText(category.name),
    description: getLocalizedText(category.description),
  };
}

// ============================================
// TOPIC FUNCTIONS
// ============================================

/**
 * Get topics in a category with pagination
 * @param {string} categoryId - Category ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Topics per page (default: 20)
 * @returns {Object} Object with topics array and pagination info
 */
export function getCategoryTopics(categoryId, page = 1, perPage = 20) {
  if (!categoryId || !ForumCategories[categoryId]) {
    return { topics: [], total: 0, page: 1, totalPages: 0 };
  }

  const forum = getForumFromStorage();

  // Filter topics by category and exclude deleted
  let topics = forum.topics.filter(
    topic => topic.categoryId === categoryId && topic.status !== TopicStatus.DELETED
  );

  // Sort: pinned first, then by latest activity
  topics.sort((a, b) => {
    // Pinned topics first
    if (a.status === TopicStatus.PINNED && b.status !== TopicStatus.PINNED) return -1;
    if (b.status === TopicStatus.PINNED && a.status !== TopicStatus.PINNED) return 1;

    // Then by date
    const dateA = new Date(a.updatedAt || a.createdAt);
    const dateB = new Date(b.updatedAt || b.createdAt);
    return dateB - dateA;
  });

  const total = topics.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  // Add reply count and like count to each topic
  const paginatedTopics = topics.slice(start, end).map(topic => ({
    ...topic,
    replyCount: forum.posts.filter(
      p => p.topicId === topic.id && p.status !== PostStatus.DELETED
    ).length,
    likeCount: (forum.likes.topics[topic.id] || []).length,
    isPinned: topic.status === TopicStatus.PINNED,
    isLocked: topic.status === TopicStatus.LOCKED,
  }));

  return {
    topics: paginatedTopics,
    total,
    page,
    totalPages,
    perPage,
  };
}

/**
 * Get a single topic with all its replies
 * @param {string} topicId - Topic ID
 * @returns {Object|null} Topic with replies or null
 */
export function getTopic(topicId) {
  if (!topicId) return null;

  const forum = getForumFromStorage();
  const topic = forum.topics.find(t => t.id === topicId);

  if (!topic || topic.status === TopicStatus.DELETED) {
    return null;
  }

  // Get replies sorted by date
  const replies = forum.posts
    .filter(p => p.topicId === topicId && p.status !== PostStatus.DELETED)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(post => ({
      ...post,
      likeCount: (forum.likes.posts[post.id] || []).length,
      isLikedByUser: (forum.likes.posts[post.id] || []).includes(getCurrentUser().id),
    }));

  // Check if user is subscribed
  const currentUser = getCurrentUser();
  const isSubscribed = forum.subscriptions.some(
    s => s.topicId === topicId && s.userId === currentUser.id
  );

  return {
    ...topic,
    replies,
    replyCount: replies.length,
    likeCount: (forum.likes.topics[topic.id] || []).length,
    isLikedByUser: (forum.likes.topics[topic.id] || []).includes(currentUser.id),
    isSubscribed,
    isPinned: topic.status === TopicStatus.PINNED,
    isLocked: topic.status === TopicStatus.LOCKED,
    category: getCategory(topic.categoryId),
  };
}

/**
 * Create a new topic
 * @param {string} categoryId - Category ID
 * @param {string} title - Topic title
 * @param {string} content - Topic content
 * @returns {Object} Result with success status and topic
 */
export function createTopic(categoryId, title, content) {
  if (!categoryId || !ForumCategories[categoryId]) {
    return { success: false, error: 'invalid_category' };
  }

  if (!title || title.trim().length < 3) {
    return { success: false, error: 'title_too_short' };
  }

  if (!content || content.trim().length < 10) {
    return { success: false, error: 'content_too_short' };
  }

  const user = getCurrentUser();
  const forum = getForumFromStorage();

  const topic = {
    id: generateId(),
    categoryId,
    title: title.trim(),
    content: content.trim(),
    author: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    },
    status: TopicStatus.OPEN,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0,
  };

  forum.topics.push(topic);
  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Sujet cree avec succes !',
    en: 'Topic created successfully!',
    es: 'Tema creado con exito!',
    de: 'Thema erfolgreich erstellt!',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true, topic };
}

/**
 * Reply to a topic
 * @param {string} topicId - Topic ID
 * @param {string} content - Reply content
 * @returns {Object} Result with success status and post
 */
export function replyToTopic(topicId, content) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  if (!content || content.trim().length < 3) {
    return { success: false, error: 'content_too_short' };
  }

  const forum = getForumFromStorage();
  const topic = forum.topics.find(t => t.id === topicId);

  if (!topic || topic.status === TopicStatus.DELETED) {
    return { success: false, error: 'topic_not_found' };
  }

  if (topic.status === TopicStatus.LOCKED) {
    return { success: false, error: 'topic_locked' };
  }

  const user = getCurrentUser();

  const post = {
    id: generateId(),
    topicId,
    content: content.trim(),
    author: {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    },
    status: PostStatus.ACTIVE,
    createdAt: new Date().toISOString(),
  };

  forum.posts.push(post);

  // Update topic's updatedAt
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);
  if (topicIndex !== -1) {
    forum.topics[topicIndex].updatedAt = new Date().toISOString();
  }

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Reponse publiee !',
    en: 'Reply posted!',
    es: 'Respuesta publicada!',
    de: 'Antwort gepostet!',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true, post };
}

/**
 * Edit a post
 * @param {string} postId - Post ID
 * @param {string} content - New content
 * @returns {Object} Result with success status
 */
export function editPost(postId, content) {
  if (!postId) {
    return { success: false, error: 'invalid_post_id' };
  }

  if (!content || content.trim().length < 3) {
    return { success: false, error: 'content_too_short' };
  }

  const forum = getForumFromStorage();
  const postIndex = forum.posts.findIndex(p => p.id === postId);

  if (postIndex === -1) {
    return { success: false, error: 'post_not_found' };
  }

  const post = forum.posts[postIndex];
  const user = getCurrentUser();

  // Only author or moderator can edit
  if (post.author.id !== user.id && !user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  forum.posts[postIndex] = {
    ...post,
    content: content.trim(),
    status: PostStatus.EDITED,
    editedAt: new Date().toISOString(),
    editedBy: user.id,
  };

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Message modifie',
    en: 'Post edited',
    es: 'Mensaje editado',
    de: 'Beitrag bearbeitet',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true, post: forum.posts[postIndex] };
}

/**
 * Delete a post (soft delete)
 * @param {string} postId - Post ID
 * @returns {Object} Result with success status
 */
export function deletePost(postId) {
  if (!postId) {
    return { success: false, error: 'invalid_post_id' };
  }

  const forum = getForumFromStorage();
  const postIndex = forum.posts.findIndex(p => p.id === postId);

  if (postIndex === -1) {
    return { success: false, error: 'post_not_found' };
  }

  const post = forum.posts[postIndex];
  const user = getCurrentUser();

  // Only author or moderator can delete
  if (post.author.id !== user.id && !user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  forum.posts[postIndex] = {
    ...post,
    status: PostStatus.DELETED,
    deletedAt: new Date().toISOString(),
    deletedBy: user.id,
  };

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Message supprime',
    en: 'Post deleted',
    es: 'Mensaje eliminado',
    de: 'Beitrag geloscht',
  };
  showToast(messages[lang] || messages.en, 'info');

  return { success: true };
}

/**
 * Delete a topic (soft delete)
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function deleteTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const forum = getForumFromStorage();
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);

  if (topicIndex === -1) {
    return { success: false, error: 'topic_not_found' };
  }

  const topic = forum.topics[topicIndex];
  const user = getCurrentUser();

  // Only author or moderator can delete
  if (topic.author.id !== user.id && !user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  forum.topics[topicIndex] = {
    ...topic,
    status: TopicStatus.DELETED,
    deletedAt: new Date().toISOString(),
    deletedBy: user.id,
  };

  saveForumToStorage(forum);

  return { success: true };
}

// ============================================
// MODERATION FUNCTIONS
// ============================================

/**
 * Pin a topic (moderator only)
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function pinTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const user = getCurrentUser();
  if (!user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  const forum = getForumFromStorage();
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);

  if (topicIndex === -1) {
    return { success: false, error: 'topic_not_found' };
  }

  forum.topics[topicIndex].status = TopicStatus.PINNED;
  forum.topics[topicIndex].pinnedAt = new Date().toISOString();
  forum.topics[topicIndex].pinnedBy = user.id;

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Sujet epingle',
    en: 'Topic pinned',
    es: 'Tema fijado',
    de: 'Thema angepinnt',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true };
}

/**
 * Unpin a topic (moderator only)
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function unpinTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const user = getCurrentUser();
  if (!user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  const forum = getForumFromStorage();
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);

  if (topicIndex === -1) {
    return { success: false, error: 'topic_not_found' };
  }

  forum.topics[topicIndex].status = TopicStatus.OPEN;
  delete forum.topics[topicIndex].pinnedAt;
  delete forum.topics[topicIndex].pinnedBy;

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Sujet desepingle',
    en: 'Topic unpinned',
    es: 'Tema desfijado',
    de: 'Thema abgepinnt',
  };
  showToast(messages[lang] || messages.en, 'info');

  return { success: true };
}

/**
 * Lock a topic (no more replies)
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function lockTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const user = getCurrentUser();
  if (!user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  const forum = getForumFromStorage();
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);

  if (topicIndex === -1) {
    return { success: false, error: 'topic_not_found' };
  }

  forum.topics[topicIndex].status = TopicStatus.LOCKED;
  forum.topics[topicIndex].lockedAt = new Date().toISOString();
  forum.topics[topicIndex].lockedBy = user.id;

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Sujet verrouille',
    en: 'Topic locked',
    es: 'Tema bloqueado',
    de: 'Thema gesperrt',
  };
  showToast(messages[lang] || messages.en, 'warning');

  return { success: true };
}

/**
 * Unlock a topic
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function unlockTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const user = getCurrentUser();
  if (!user.isModerator && !user.isAdmin) {
    return { success: false, error: 'not_authorized' };
  }

  const forum = getForumFromStorage();
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);

  if (topicIndex === -1) {
    return { success: false, error: 'topic_not_found' };
  }

  forum.topics[topicIndex].status = TopicStatus.OPEN;
  delete forum.topics[topicIndex].lockedAt;
  delete forum.topics[topicIndex].lockedBy;

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Sujet deverrouille',
    en: 'Topic unlocked',
    es: 'Tema desbloqueado',
    de: 'Thema entsperrt',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true };
}

// ============================================
// LIKE FUNCTIONS
// ============================================

/**
 * Like a topic
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function likeTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const forum = getForumFromStorage();
  const topic = forum.topics.find(t => t.id === topicId);

  if (!topic || topic.status === TopicStatus.DELETED) {
    return { success: false, error: 'topic_not_found' };
  }

  const user = getCurrentUser();

  if (!forum.likes.topics[topicId]) {
    forum.likes.topics[topicId] = [];
  }

  const likes = forum.likes.topics[topicId];
  const alreadyLiked = likes.includes(user.id);

  if (alreadyLiked) {
    // Unlike
    forum.likes.topics[topicId] = likes.filter(id => id !== user.id);
  } else {
    // Like
    forum.likes.topics[topicId].push(user.id);
  }

  saveForumToStorage(forum);

  return {
    success: true,
    liked: !alreadyLiked,
    likeCount: forum.likes.topics[topicId].length,
  };
}

/**
 * Like a post
 * @param {string} postId - Post ID
 * @returns {Object} Result with success status
 */
export function likePost(postId) {
  if (!postId) {
    return { success: false, error: 'invalid_post_id' };
  }

  const forum = getForumFromStorage();
  const post = forum.posts.find(p => p.id === postId);

  if (!post || post.status === PostStatus.DELETED) {
    return { success: false, error: 'post_not_found' };
  }

  const user = getCurrentUser();

  if (!forum.likes.posts[postId]) {
    forum.likes.posts[postId] = [];
  }

  const likes = forum.likes.posts[postId];
  const alreadyLiked = likes.includes(user.id);

  if (alreadyLiked) {
    // Unlike
    forum.likes.posts[postId] = likes.filter(id => id !== user.id);
  } else {
    // Like
    forum.likes.posts[postId].push(user.id);
  }

  saveForumToStorage(forum);

  return {
    success: true,
    liked: !alreadyLiked,
    likeCount: forum.likes.posts[postId].length,
  };
}

// ============================================
// REPORT FUNCTION
// ============================================

/**
 * Report a post
 * @param {string} postId - Post ID
 * @param {string} reason - Report reason key
 * @param {string} details - Additional details
 * @returns {Object} Result with success status
 */
export function reportPost(postId, reason, details = '') {
  if (!postId) {
    return { success: false, error: 'invalid_post_id' };
  }

  if (!reason || !ReportReasons[reason]) {
    return { success: false, error: 'invalid_reason' };
  }

  const forum = getForumFromStorage();
  const post = forum.posts.find(p => p.id === postId);

  if (!post) {
    return { success: false, error: 'post_not_found' };
  }

  const user = getCurrentUser();

  // Check if already reported by this user
  const alreadyReported = forum.reports.some(
    r => r.postId === postId && r.reportedBy === user.id
  );

  if (alreadyReported) {
    return { success: false, error: 'already_reported' };
  }

  const report = {
    id: generateId(),
    postId,
    topicId: post.topicId,
    reason,
    details: details.trim(),
    reportedBy: user.id,
    reportedAt: new Date().toISOString(),
    status: 'pending',
  };

  forum.reports.push(report);

  // Mark post as reported
  const postIndex = forum.posts.findIndex(p => p.id === postId);
  if (postIndex !== -1) {
    forum.posts[postIndex].status = PostStatus.REPORTED;
  }

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Signalement envoye. Merci de votre vigilance.',
    en: 'Report submitted. Thank you for your vigilance.',
    es: 'Informe enviado. Gracias por su vigilancia.',
    de: 'Meldung gesendet. Danke fur Ihre Wachsamkeit.',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true, report };
}

// ============================================
// SEARCH FUNCTION
// ============================================

/**
 * Search forum posts and topics
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Object} Search results
 */
export function searchForum(query, options = {}) {
  if (!query || query.trim().length < 2) {
    return { topics: [], posts: [], total: 0 };
  }

  const { categoryId = null, limit = 20 } = options;
  const forum = getForumFromStorage();
  const lowerQuery = query.toLowerCase().trim();

  // Search topics
  let topics = forum.topics.filter(topic => {
    if (topic.status === TopicStatus.DELETED) return false;
    if (categoryId && topic.categoryId !== categoryId) return false;

    return (
      topic.title.toLowerCase().includes(lowerQuery) ||
      topic.content.toLowerCase().includes(lowerQuery)
    );
  });

  // Search posts
  let posts = forum.posts.filter(post => {
    if (post.status === PostStatus.DELETED) return false;

    const topic = forum.topics.find(t => t.id === post.topicId);
    if (!topic || topic.status === TopicStatus.DELETED) return false;
    if (categoryId && topic.categoryId !== categoryId) return false;

    return post.content.toLowerCase().includes(lowerQuery);
  });

  // Sort by relevance (title matches first for topics)
  topics.sort((a, b) => {
    const aTitle = a.title.toLowerCase().includes(lowerQuery);
    const bTitle = b.title.toLowerCase().includes(lowerQuery);
    if (aTitle && !bTitle) return -1;
    if (!aTitle && bTitle) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Limit results
  topics = topics.slice(0, limit);
  posts = posts.slice(0, limit);

  // Add topic info to posts
  posts = posts.map(post => {
    const topic = forum.topics.find(t => t.id === post.topicId);
    return {
      ...post,
      topic: topic ? {
        id: topic.id,
        title: topic.title,
        categoryId: topic.categoryId,
      } : null,
    };
  });

  return {
    topics,
    posts,
    total: topics.length + posts.length,
    query: query.trim(),
  };
}

// ============================================
// POPULAR & RECENT FUNCTIONS
// ============================================

/**
 * Get popular topics (by likes and replies)
 * @param {number} limit - Max number of topics
 * @returns {Array} Array of popular topics
 */
export function getPopularTopics(limit = 10) {
  const forum = getForumFromStorage();

  const topics = forum.topics
    .filter(t => t.status !== TopicStatus.DELETED)
    .map(topic => {
      const replyCount = forum.posts.filter(
        p => p.topicId === topic.id && p.status !== PostStatus.DELETED
      ).length;
      const likeCount = (forum.likes.topics[topic.id] || []).length;

      return {
        ...topic,
        replyCount,
        likeCount,
        score: likeCount * 2 + replyCount + (topic.viewCount || 0) * 0.1,
        category: getCategory(topic.categoryId),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return topics;
}

/**
 * Get recent topics
 * @param {number} limit - Max number of topics
 * @returns {Array} Array of recent topics
 */
export function getRecentTopics(limit = 10) {
  const forum = getForumFromStorage();

  const topics = forum.topics
    .filter(t => t.status !== TopicStatus.DELETED)
    .map(topic => {
      const replyCount = forum.posts.filter(
        p => p.topicId === topic.id && p.status !== PostStatus.DELETED
      ).length;
      const likeCount = (forum.likes.topics[topic.id] || []).length;

      return {
        ...topic,
        replyCount,
        likeCount,
        category: getCategory(topic.categoryId),
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  return topics;
}

// ============================================
// USER FUNCTIONS
// ============================================

/**
 * Get posts by a user
 * @param {string} userId - User ID
 * @returns {Array} Array of user's posts
 */
export function getUserPosts(userId) {
  if (!userId) return [];

  const forum = getForumFromStorage();

  return forum.posts
    .filter(p => p.author.id === userId && p.status !== PostStatus.DELETED)
    .map(post => {
      const topic = forum.topics.find(t => t.id === post.topicId);
      return {
        ...post,
        topic: topic ? {
          id: topic.id,
          title: topic.title,
          categoryId: topic.categoryId,
        } : null,
        likeCount: (forum.likes.posts[post.id] || []).length,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get topics created by a user
 * @param {string} userId - User ID
 * @returns {Array} Array of user's topics
 */
export function getUserTopics(userId) {
  if (!userId) return [];

  const forum = getForumFromStorage();

  return forum.topics
    .filter(t => t.author.id === userId && t.status !== TopicStatus.DELETED)
    .map(topic => ({
      ...topic,
      replyCount: forum.posts.filter(
        p => p.topicId === topic.id && p.status !== PostStatus.DELETED
      ).length,
      likeCount: (forum.likes.topics[topic.id] || []).length,
      category: getCategory(topic.categoryId),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ============================================
// SUBSCRIPTION FUNCTIONS
// ============================================

/**
 * Subscribe to a topic for notifications
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function subscribeToTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const forum = getForumFromStorage();
  const topic = forum.topics.find(t => t.id === topicId);

  if (!topic || topic.status === TopicStatus.DELETED) {
    return { success: false, error: 'topic_not_found' };
  }

  const user = getCurrentUser();

  // Check if already subscribed
  const alreadySubscribed = forum.subscriptions.some(
    s => s.topicId === topicId && s.userId === user.id
  );

  if (alreadySubscribed) {
    return { success: false, error: 'already_subscribed' };
  }

  forum.subscriptions.push({
    topicId,
    userId: user.id,
    subscribedAt: new Date().toISOString(),
  });

  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Abonne aux notifications',
    en: 'Subscribed to notifications',
    es: 'Suscrito a las notificaciones',
    de: 'Benachrichtigungen abonniert',
  };
  showToast(messages[lang] || messages.en, 'success');

  return { success: true };
}

/**
 * Unsubscribe from a topic
 * @param {string} topicId - Topic ID
 * @returns {Object} Result with success status
 */
export function unsubscribeFromTopic(topicId) {
  if (!topicId) {
    return { success: false, error: 'invalid_topic_id' };
  }

  const forum = getForumFromStorage();
  const user = getCurrentUser();

  const subIndex = forum.subscriptions.findIndex(
    s => s.topicId === topicId && s.userId === user.id
  );

  if (subIndex === -1) {
    return { success: false, error: 'not_subscribed' };
  }

  forum.subscriptions.splice(subIndex, 1);
  saveForumToStorage(forum);

  const lang = getState().lang || 'fr';
  const messages = {
    fr: 'Desabonne des notifications',
    en: 'Unsubscribed from notifications',
    es: 'Desuscrito de las notificaciones',
    de: 'Benachrichtigungen abbestellt',
  };
  showToast(messages[lang] || messages.en, 'info');

  return { success: true };
}

/**
 * Get user's subscribed topics
 * @returns {Array} Array of subscribed topic IDs
 */
export function getSubscribedTopics() {
  const forum = getForumFromStorage();
  const user = getCurrentUser();

  return forum.subscriptions
    .filter(s => s.userId === user.id)
    .map(s => s.topicId);
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

/**
 * Get forum statistics
 * @returns {Object} Statistics object
 */
export function getForumStats() {
  const forum = getForumFromStorage();

  const activeTopics = forum.topics.filter(t => t.status !== TopicStatus.DELETED);
  const activePosts = forum.posts.filter(p => p.status !== PostStatus.DELETED);

  // Get unique authors
  const topicAuthors = new Set(activeTopics.map(t => t.author.id));
  const postAuthors = new Set(activePosts.map(p => p.author.id));
  const allAuthors = new Set([...topicAuthors, ...postAuthors]);

  // Calculate total likes
  const topicLikes = Object.values(forum.likes.topics).reduce((sum, arr) => sum + arr.length, 0);
  const postLikes = Object.values(forum.likes.posts).reduce((sum, arr) => sum + arr.length, 0);

  return {
    totalTopics: activeTopics.length,
    totalPosts: activePosts.length,
    totalAuthors: allAuthors.size,
    totalLikes: topicLikes + postLikes,
    pendingReports: forum.reports.filter(r => r.status === 'pending').length,
    categoriesCount: Object.keys(ForumCategories).length,
  };
}

// ============================================
// RENDER FUNCTIONS
// ============================================

/**
 * Render a forum category card
 * @param {Object} category - Category object
 * @returns {string} HTML string
 */
export function renderForumCategory(category) {
  if (!category || !category.id) return '';

  const name = escapeHTML(typeof category.name === 'string' ? category.name : getLocalizedText(category.name));
  const description = escapeHTML(typeof category.description === 'string' ? category.description : getLocalizedText(category.description));
  const emoji = category.emoji || '💬';
  const topicCount = category.topicCount || 0;
  const postCount = category.postCount || 0;

  const lang = getState().lang || 'fr';
  const labels = {
    topics: { fr: 'sujets', en: 'topics', es: 'temas', de: 'Themen' }[lang] || 'topics',
    posts: { fr: 'messages', en: 'posts', es: 'mensajes', de: 'Beitrage' }[lang] || 'posts',
    lastActivity: { fr: 'Derniere activite', en: 'Last activity', es: 'Ultima actividad', de: 'Letzte Aktivitat' }[lang] || 'Last activity',
  };

  let lastActivityHtml = '';
  if (category.lastTopic) {
    const lastTime = formatRelativeTime(category.lastTopic.updatedAt);
    lastActivityHtml = `
      <div class="text-xs text-slate-500 mt-2 flex items-center gap-1">
        <i class="fas fa-clock"></i>
        <span>${labels.lastActivity}: ${escapeHTML(lastTime)}</span>
      </div>
    `;
  }

  return `
    <div
      class="forum-category-card p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-white/10"
      data-category-id="${escapeHTML(category.id)}"
      onclick="openForumCategory('${escapeHTML(category.id)}')"
      role="button"
      tabindex="0"
      aria-label="${name}"
    >
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-teal-500/20 flex items-center justify-center text-2xl flex-shrink-0">
          ${emoji}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-white text-lg">${name}</h3>
          <p class="text-sm text-slate-400 mt-1 line-clamp-2">${description}</p>
          <div class="flex items-center gap-4 mt-3 text-sm text-slate-400">
            <span class="flex items-center gap-1">
              <i class="fas fa-comments"></i>
              <span>${topicCount} ${labels.topics}</span>
            </span>
            <span class="flex items-center gap-1">
              <i class="fas fa-message"></i>
              <span>${postCount} ${labels.posts}</span>
            </span>
          </div>
          ${lastActivityHtml}
        </div>
        <div class="text-slate-500">
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a topic list
 * @param {Array} topics - Array of topics
 * @returns {string} HTML string
 */
export function renderTopicList(topics) {
  if (!Array.isArray(topics) || topics.length === 0) {
    const lang = getState().lang || 'fr';
    const emptyMessages = {
      fr: 'Aucun sujet pour le moment. Soyez le premier a en creer un !',
      en: 'No topics yet. Be the first to create one!',
      es: 'Ningun tema todavia. Se el primero en crear uno!',
      de: 'Noch keine Themen. Sei der Erste, der eines erstellt!',
    };

    return `
      <div class="empty-state p-8 text-center" role="status">
        <div class="text-6xl mb-4">💬</div>
        <p class="text-slate-400">${emptyMessages[lang] || emptyMessages.en}</p>
        <button
          onclick="openCreateTopic()"
          class="btn btn-primary mt-4"
        >
          <i class="fas fa-plus mr-2"></i>
          ${t('createTopic') || 'Creer un sujet'}
        </button>
      </div>
    `;
  }

  const lang = getState().lang || 'fr';
  const labels = {
    replies: { fr: 'reponses', en: 'replies', es: 'respuestas', de: 'Antworten' }[lang] || 'replies',
    likes: { fr: 'j\'aime', en: 'likes', es: 'me gusta', de: 'Gefallt mir' }[lang] || 'likes',
    pinned: { fr: 'Epingle', en: 'Pinned', es: 'Fijado', de: 'Angepinnt' }[lang] || 'Pinned',
    locked: { fr: 'Verrouille', en: 'Locked', es: 'Bloqueado', de: 'Gesperrt' }[lang] || 'Locked',
  };

  const topicCards = topics.map(topic => {
    const title = escapeHTML(topic.title);
    const author = escapeHTML(topic.author?.username || 'Anonyme');
    const avatar = topic.author?.avatar || '🤙';
    const createdAt = formatRelativeTime(topic.createdAt);
    const replyCount = topic.replyCount || 0;
    const likeCount = topic.likeCount || 0;

    let badges = '';
    if (topic.isPinned) {
      badges += `<span class="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full"><i class="fas fa-thumbtack mr-1"></i>${labels.pinned}</span>`;
    }
    if (topic.isLocked) {
      badges += `<span class="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full ml-1"><i class="fas fa-lock mr-1"></i>${labels.locked}</span>`;
    }

    return `
      <div
        class="topic-card p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-white/10"
        data-topic-id="${escapeHTML(topic.id)}"
        onclick="openForumTopic('${escapeHTML(topic.id)}')"
        role="button"
        tabindex="0"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-lg flex-shrink-0">
            ${avatar}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-medium text-white">${title}</h4>
              ${badges}
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>${author}</span>
              <span class="text-slate-500">•</span>
              <span>${createdAt}</span>
            </div>
            <div class="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span class="flex items-center gap-1">
                <i class="fas fa-comment"></i>
                <span>${replyCount} ${labels.replies}</span>
              </span>
              <span class="flex items-center gap-1">
                <i class="fas fa-heart"></i>
                <span>${likeCount} ${labels.likes}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="topic-list space-y-3" role="list" aria-label="${t('topicList') || 'Liste des sujets'}">
      ${topicCards}
    </div>
  `;
}

/**
 * Render a topic detail with replies
 * @param {Object} topic - Topic with replies
 * @returns {string} HTML string
 */
export function renderTopicDetail(topic) {
  if (!topic || !topic.id) return '';

  const lang = getState().lang || 'fr';
  const labels = {
    reply: { fr: 'Repondre', en: 'Reply', es: 'Responder', de: 'Antworten' }[lang] || 'Reply',
    like: { fr: 'J\'aime', en: 'Like', es: 'Me gusta', de: 'Gefallt mir' }[lang] || 'Like',
    subscribe: { fr: 'S\'abonner', en: 'Subscribe', es: 'Suscribirse', de: 'Abonnieren' }[lang] || 'Subscribe',
    unsubscribe: { fr: 'Se desabonner', en: 'Unsubscribe', es: 'Desuscribirse', de: 'Abbestellen' }[lang] || 'Unsubscribe',
    edit: { fr: 'Modifier', en: 'Edit', es: 'Editar', de: 'Bearbeiten' }[lang] || 'Edit',
    delete: { fr: 'Supprimer', en: 'Delete', es: 'Eliminar', de: 'Loschen' }[lang] || 'Delete',
    report: { fr: 'Signaler', en: 'Report', es: 'Reportar', de: 'Melden' }[lang] || 'Report',
    replies: { fr: 'reponses', en: 'replies', es: 'respuestas', de: 'Antworten' }[lang] || 'replies',
    locked: { fr: 'Ce sujet est verrouille. Aucune nouvelle reponse n\'est possible.', en: 'This topic is locked. No new replies allowed.', es: 'Este tema esta bloqueado. No se permiten nuevas respuestas.', de: 'Dieses Thema ist gesperrt. Keine neuen Antworten moglich.' }[lang] || 'This topic is locked.',
  };

  const title = escapeHTML(topic.title);
  const content = escapeHTML(topic.content);
  const author = escapeHTML(topic.author?.username || 'Anonyme');
  const avatar = topic.author?.avatar || '🤙';
  const createdAt = formatDate(topic.createdAt);
  const likeCount = topic.likeCount || 0;
  const replyCount = topic.replyCount || 0;
  const currentUser = getCurrentUser();
  const isAuthor = topic.author?.id === currentUser.id;
  const isMod = currentUser.isModerator || currentUser.isAdmin;

  // Category badge
  let categoryBadge = '';
  if (topic.category) {
    categoryBadge = `
      <span class="px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-full">
        ${topic.category.emoji || '💬'} ${escapeHTML(topic.category.name || '')}
      </span>
    `;
  }

  // Locked notice
  let lockedNotice = '';
  if (topic.isLocked) {
    lockedNotice = `
      <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4 flex items-center gap-3">
        <i class="fas fa-lock text-yellow-400"></i>
        <span class="text-yellow-400 text-sm">${labels.locked}</span>
      </div>
    `;
  }

  // Replies
  const repliesHtml = (topic.replies || []).map(reply => {
    const replyContent = escapeHTML(reply.content);
    const replyAuthor = escapeHTML(reply.author?.username || 'Anonyme');
    const replyAvatar = reply.author?.avatar || '🤙';
    const replyDate = formatDate(reply.createdAt);
    const replyLikes = reply.likeCount || 0;
    const isReplyAuthor = reply.author?.id === currentUser.id;
    const editedBadge = reply.status === PostStatus.EDITED ? '<span class="text-xs text-slate-500 ml-2">(modifie)</span>' : '';

    return `
      <div class="reply-card p-4 bg-white/5 rounded-xl border border-white/10" data-post-id="${escapeHTML(reply.id)}">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-sm flex-shrink-0">
            ${replyAvatar}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-white text-sm">${replyAuthor}</span>
              <span class="text-xs text-slate-500">${replyDate}</span>
              ${editedBadge}
            </div>
            <p class="text-slate-300 mt-2 text-sm whitespace-pre-wrap">${replyContent}</p>
            <div class="flex items-center gap-3 mt-3">
              <button
                onclick="likeForumPost('${escapeHTML(reply.id)}')"
                class="text-xs text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-1"
              >
                <i class="fas fa-heart ${reply.isLikedByUser ? 'text-red-400' : ''}"></i>
                <span>${replyLikes}</span>
              </button>
              ${isReplyAuthor || isMod ? `
                <button
                  onclick="editForumPost('${escapeHTML(reply.id)}')"
                  class="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <i class="fas fa-edit mr-1"></i>${labels.edit}
                </button>
                <button
                  onclick="deleteForumPost('${escapeHTML(reply.id)}')"
                  class="text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  <i class="fas fa-trash mr-1"></i>${labels.delete}
                </button>
              ` : ''}
              <button
                onclick="reportForumPost('${escapeHTML(reply.id)}')"
                class="text-xs text-slate-400 hover:text-yellow-400 transition-colors"
              >
                <i class="fas fa-flag mr-1"></i>${labels.report}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Reply form (if not locked)
  let replyForm = '';
  if (!topic.isLocked) {
    replyForm = `
      <div class="reply-form mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <h4 class="font-medium text-white mb-3">${labels.reply}</h4>
        <textarea
          id="reply-content"
          class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          rows="4"
          placeholder="${t('writeReply') || 'Ecrivez votre reponse...'}"
        ></textarea>
        <div class="flex justify-end mt-3">
          <button
            onclick="submitForumReply('${escapeHTML(topic.id)}')"
            class="btn btn-primary"
          >
            <i class="fas fa-paper-plane mr-2"></i>
            ${labels.reply}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="topic-detail">
      <!-- Header -->
      <div class="topic-header mb-6">
        <button
          onclick="goBackToForum()"
          class="text-slate-400 hover:text-white transition-colors mb-4 flex items-center gap-2"
        >
          <i class="fas fa-arrow-left"></i>
          <span>${t('backToForum') || 'Retour au forum'}</span>
        </button>

        <div class="flex items-start gap-2 mb-2">
          ${categoryBadge}
          ${topic.isPinned ? '<span class="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full"><i class="fas fa-thumbtack mr-1"></i></span>' : ''}
          ${topic.isLocked ? '<span class="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full"><i class="fas fa-lock mr-1"></i></span>' : ''}
        </div>

        <h1 class="text-2xl font-bold text-white">${title}</h1>
      </div>

      ${lockedNotice}

      <!-- Original post -->
      <div class="original-post p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-xl flex-shrink-0">
            ${avatar}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-white">${author}</span>
              <span class="text-xs text-slate-500">${createdAt}</span>
            </div>
            <p class="text-slate-300 mt-3 whitespace-pre-wrap">${content}</p>
            <div class="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
              <button
                onclick="likeForumTopic('${escapeHTML(topic.id)}')"
                class="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <i class="fas fa-heart ${topic.isLikedByUser ? 'text-red-400' : ''}"></i>
                <span>${likeCount} ${labels.like}</span>
              </button>
              <button
                onclick="${topic.isSubscribed ? 'unsubscribeFromForumTopic' : 'subscribeToForumTopic'}('${escapeHTML(topic.id)}')"
                class="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-2"
              >
                <i class="fas fa-bell ${topic.isSubscribed ? 'text-primary-400' : ''}"></i>
                <span>${topic.isSubscribed ? labels.unsubscribe : labels.subscribe}</span>
              </button>
              ${isAuthor || isMod ? `
                <button
                  onclick="editForumTopic('${escapeHTML(topic.id)}')"
                  class="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <i class="fas fa-edit mr-1"></i>${labels.edit}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Replies section -->
      <div class="replies-section">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <i class="fas fa-comments text-primary-400"></i>
          <span>${replyCount} ${labels.replies}</span>
        </h3>

        <div class="replies-list space-y-3">
          ${repliesHtml || `<p class="text-slate-400 text-center py-4">${t('noRepliesYet') || 'Pas encore de reponses. Soyez le premier !'}</p>`}
        </div>

        ${replyForm}
      </div>
    </div>
  `;
}

/**
 * Render a post editor
 * @param {Object} options - Editor options
 * @returns {string} HTML string
 */
export function renderPostEditor(options = {}) {
  const { mode = 'create', topicId = '', content = '', title = '', categoryId = '' } = options;

  const lang = getState().lang || 'fr';
  const labels = {
    createTopic: { fr: 'Nouveau sujet', en: 'New Topic', es: 'Nuevo tema', de: 'Neues Thema' }[lang] || 'New Topic',
    editTopic: { fr: 'Modifier le sujet', en: 'Edit Topic', es: 'Editar tema', de: 'Thema bearbeiten' }[lang] || 'Edit Topic',
    titlePlaceholder: { fr: 'Titre du sujet...', en: 'Topic title...', es: 'Titulo del tema...', de: 'Thema-Titel...' }[lang] || 'Topic title...',
    contentPlaceholder: { fr: 'Ecrivez votre message...', en: 'Write your message...', es: 'Escribe tu mensaje...', de: 'Schreibe deine Nachricht...' }[lang] || 'Write your message...',
    selectCategory: { fr: 'Choisir une categorie', en: 'Select a category', es: 'Elegir una categoria', de: 'Kategorie wahlen' }[lang] || 'Select a category',
    publish: { fr: 'Publier', en: 'Publish', es: 'Publicar', de: 'Veroffentlichen' }[lang] || 'Publish',
    save: { fr: 'Enregistrer', en: 'Save', es: 'Guardar', de: 'Speichern' }[lang] || 'Save',
    cancel: { fr: 'Annuler', en: 'Cancel', es: 'Cancelar', de: 'Abbrechen' }[lang] || 'Cancel',
  };

  const isEdit = mode === 'edit';
  const headerTitle = isEdit ? labels.editTopic : labels.createTopic;
  const submitLabel = isEdit ? labels.save : labels.publish;

  // Category selector
  const categories = Object.values(ForumCategories);
  const categoryOptions = categories.map(cat => `
    <option value="${cat.id}" ${cat.id === categoryId ? 'selected' : ''}>
      ${cat.emoji} ${getLocalizedText(cat.name)}
    </option>
  `).join('');

  return `
    <div class="post-editor p-6 bg-white/5 rounded-xl border border-white/10">
      <h3 class="text-xl font-semibold text-white mb-4">${headerTitle}</h3>

      <form id="topic-editor-form" onsubmit="submitForumTopic(event)">
        <input type="hidden" name="mode" value="${mode}">
        <input type="hidden" name="topicId" value="${escapeHTML(topicId)}">

        <!-- Category selector -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            ${labels.selectCategory}
          </label>
          <select
            name="categoryId"
            class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            required
          >
            <option value="">${labels.selectCategory}</option>
            ${categoryOptions}
          </select>
        </div>

        <!-- Title -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            ${t('title') || 'Titre'}
          </label>
          <input
            type="text"
            name="title"
            value="${escapeHTML(title)}"
            class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="${labels.titlePlaceholder}"
            required
            minlength="3"
            maxlength="200"
          >
        </div>

        <!-- Content -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            ${t('content') || 'Contenu'}
          </label>
          <textarea
            name="content"
            class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            rows="8"
            placeholder="${labels.contentPlaceholder}"
            required
            minlength="10"
          >${escapeHTML(content)}</textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            onclick="closeForumEditor()"
            class="btn bg-white/10 hover:bg-white/20 text-white"
          >
            ${labels.cancel}
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            <i class="fas fa-paper-plane mr-2"></i>
            ${submitLabel}
          </button>
        </div>
      </form>
    </div>
  `;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear all forum data (for testing)
 * @returns {Object} Result with success status
 */
export function clearForumData() {
  saveForumToStorage({
    topics: [],
    posts: [],
    subscriptions: [],
    reports: [],
    likes: { topics: {}, posts: {} },
  });

  return { success: true };
}

/**
 * Increment topic view count
 * @param {string} topicId - Topic ID
 */
export function incrementTopicViewCount(topicId) {
  if (!topicId) return;

  const forum = getForumFromStorage();
  const topicIndex = forum.topics.findIndex(t => t.id === topicId);

  if (topicIndex !== -1) {
    forum.topics[topicIndex].viewCount = (forum.topics[topicIndex].viewCount || 0) + 1;
    saveForumToStorage(forum);
  }
}

// ============================================
// GLOBAL HANDLERS
// ============================================

if (typeof window !== 'undefined') {
  window.openForumCategory = (categoryId) => {
    setState({ forumCategoryId: categoryId, showForumCategory: true });
  };

  window.openForumTopic = (topicId) => {
    incrementTopicViewCount(topicId);
    setState({ forumTopicId: topicId, showForumTopic: true });
  };

  window.openCreateTopic = () => {
    setState({ showForumEditor: true, forumEditorMode: 'create' });
  };

  window.goBackToForum = () => {
    setState({ showForumTopic: false, forumTopicId: null });
  };

  window.likeForumTopic = (topicId) => {
    likeTopic(topicId);
  };

  window.likeForumPost = (postId) => {
    likePost(postId);
  };

  window.subscribeToForumTopic = (topicId) => {
    subscribeToTopic(topicId);
  };

  window.unsubscribeFromForumTopic = (topicId) => {
    unsubscribeFromTopic(topicId);
  };

  window.submitForumReply = (topicId) => {
    const textarea = document.getElementById('reply-content');
    if (textarea) {
      const content = textarea.value;
      const result = replyToTopic(topicId, content);
      if (result.success) {
        textarea.value = '';
      }
    }
  };

  window.editForumPost = (postId) => {
    setState({ forumEditPostId: postId, showForumEditPost: true });
  };

  window.deleteForumPost = (postId) => {
    const lang = getState().lang || 'fr';
    const confirmMsg = {
      fr: 'Etes-vous sur de vouloir supprimer ce message ?',
      en: 'Are you sure you want to delete this post?',
      es: 'Esta seguro de que desea eliminar este mensaje?',
      de: 'Sind Sie sicher, dass Sie diesen Beitrag loschen mochten?',
    }[lang] || 'Are you sure?';

    if (window.confirm(confirmMsg)) {
      deletePost(postId);
    }
  };

  window.reportForumPost = (postId) => {
    setState({ forumReportPostId: postId, showForumReportModal: true });
  };

  window.closeForumEditor = () => {
    setState({ showForumEditor: false, forumEditorMode: null });
  };

  window.submitForumTopic = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const mode = formData.get('mode');
    const categoryId = formData.get('categoryId');
    const title = formData.get('title');
    const content = formData.get('content');

    if (mode === 'create') {
      const result = createTopic(categoryId, title, content);
      if (result.success) {
        setState({ showForumEditor: false });
      }
    }
  };

  window.editForumTopic = (topicId) => {
    setState({ forumEditTopicId: topicId, showForumEditTopic: true });
  };
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Categories
  ForumCategories,
  TopicStatus,
  PostStatus,
  ReportReasons,
  getForumCategories,
  getCategory,

  // Topics
  getCategoryTopics,
  getTopic,
  createTopic,
  deleteTopic,

  // Posts
  replyToTopic,
  editPost,
  deletePost,

  // Moderation
  pinTopic,
  unpinTopic,
  lockTopic,
  unlockTopic,

  // Likes
  likeTopic,
  likePost,

  // Reports
  reportPost,

  // Search
  searchForum,

  // Popular & Recent
  getPopularTopics,
  getRecentTopics,

  // User
  getUserPosts,
  getUserTopics,

  // Subscriptions
  subscribeToTopic,
  unsubscribeFromTopic,
  getSubscribedTopics,

  // Stats
  getForumStats,

  // Render
  renderForumCategory,
  renderTopicList,
  renderTopicDetail,
  renderPostEditor,

  // Utils
  clearForumData,
  incrementTopicViewCount,
};
