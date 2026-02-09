/**
 * Contact Form Service
 * Feature #274 - Service pour le formulaire de contact
 *
 * Gestion des soumissions de formulaire de contact avec validation,
 * protection anti-spam (honeypot), et historique local.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';

// Storage key for contact history
const CONTACT_HISTORY_KEY = 'spothitch_contact_history';

// Cooldown between submissions (5 minutes in milliseconds)
const SUBMISSION_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Contact types enum
 */
export const ContactTypes = {
  QUESTION: {
    id: 'question',
    label: 'Question generale',
    icon: 'fa-question-circle',
    description: 'Poser une question sur l\'application',
  },
  BUG: {
    id: 'bug',
    label: 'Signaler un bug',
    icon: 'fa-bug',
    description: 'Signaler un probleme technique',
  },
  SUGGESTION: {
    id: 'suggestion',
    label: 'Suggestion',
    icon: 'fa-lightbulb',
    description: 'Proposer une amelioration ou nouvelle fonctionnalite',
  },
  PARTNERSHIP: {
    id: 'partnership',
    label: 'Partenariat',
    icon: 'fa-handshake',
    description: 'Proposer un partenariat ou collaboration',
  },
  PRESS: {
    id: 'press',
    label: 'Presse / Media',
    icon: 'fa-newspaper',
    description: 'Demande de presse ou interview',
  },
};

/**
 * Contact submission status enum
 */
export const ContactStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  READ: 'read',
  REPLIED: 'replied',
  CLOSED: 'closed',
};

/**
 * Get contact history from storage
 * @returns {Array} Array of contact submissions
 */
function getHistoryFromStorage() {
  try {
    const data = Storage.get(CONTACT_HISTORY_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading contact history:', error);
    return [];
  }
}

/**
 * Save contact history to storage
 * @param {Array} history - Array of contact submissions
 */
function saveHistoryToStorage(history) {
  try {
    Storage.set(CONTACT_HISTORY_KEY, history);
    setState({ contactHistory: history });
  } catch (error) {
    console.error('Error saving contact history:', error);
  }
}

/**
 * Generate unique submission ID
 * @returns {string} Unique submission ID
 */
function generateSubmissionId() {
  return `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Email regex that requires at least one dot in domain (TLD required)
  // Rejects: missing@domain, @nodomain.com, spaces in email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const trimmedEmail = email.trim();
  // Also reject emails with spaces
  if (trimmedEmail.includes(' ')) return false;
  return emailRegex.test(trimmedEmail);
}

/**
 * Get all contact types
 * @returns {Array} Array of contact type objects
 */
export function getContactTypes() {
  return Object.values(ContactTypes);
}

/**
 * Get a contact type by ID
 * @param {string} typeId - The type ID
 * @returns {Object|null} Contact type object or null
 */
export function getContactTypeById(typeId) {
  if (!typeId) return null;
  return Object.values(ContactTypes).find(t => t.id === typeId) || null;
}

/**
 * Check if user can submit (cooldown check)
 * @returns {Object} Object with canSubmit boolean and remainingTime in ms
 */
export function canSubmitContact() {
  const history = getHistoryFromStorage();
  if (history.length === 0) {
    return { canSubmit: true, remainingTime: 0 };
  }

  // Get last submission
  const lastSubmission = history.reduce((latest, current) => {
    const currentTime = new Date(current.createdAt).getTime();
    const latestTime = latest ? new Date(latest.createdAt).getTime() : 0;
    return currentTime > latestTime ? current : latest;
  }, null);

  if (!lastSubmission) {
    return { canSubmit: true, remainingTime: 0 };
  }

  const lastTime = new Date(lastSubmission.createdAt).getTime();
  const now = Date.now();
  const elapsed = now - lastTime;
  const remaining = Math.max(0, SUBMISSION_COOLDOWN_MS - elapsed);

  return {
    canSubmit: remaining === 0,
    remainingTime: remaining,
  };
}

/**
 * Validate contact form data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result with valid boolean and errors array
 */
export function validateContactForm(data) {
  const errors = [];

  // Check required fields
  if (!data) {
    errors.push({ field: 'form', message: 'Donnees du formulaire manquantes' });
    return { valid: false, errors };
  }

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Le nom doit contenir au moins 2 caracteres' });
  } else if (data.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Le nom ne peut pas depasser 100 caracteres' });
  }

  // Email validation
  if (!data.email) {
    errors.push({ field: 'email', message: 'L\'email est requis' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Format d\'email invalide' });
  }

  // Type validation
  if (!data.type) {
    errors.push({ field: 'type', message: 'Le type de contact est requis' });
  } else {
    const validType = getContactTypeById(data.type);
    if (!validType) {
      errors.push({ field: 'type', message: 'Type de contact invalide' });
    }
  }

  // Subject validation
  if (!data.subject || typeof data.subject !== 'string' || data.subject.trim().length < 5) {
    errors.push({ field: 'subject', message: 'Le sujet doit contenir au moins 5 caracteres' });
  } else if (data.subject.trim().length > 200) {
    errors.push({ field: 'subject', message: 'Le sujet ne peut pas depasser 200 caracteres' });
  }

  // Message validation
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 20) {
    errors.push({ field: 'message', message: 'Le message doit contenir au moins 20 caracteres' });
  } else if (data.message.trim().length > 5000) {
    errors.push({ field: 'message', message: 'Le message ne peut pas depasser 5000 caracteres' });
  }

  // Honeypot check (anti-spam) - this field should be empty
  if (data.honeypot && data.honeypot.trim().length > 0) {
    errors.push({ field: 'honeypot', message: 'Spam detecte' });
  }

  // Website honeypot check (another anti-spam field)
  if (data.website && data.website.trim().length > 0) {
    errors.push({ field: 'website', message: 'Spam detecte' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Submit contact form
 * @param {Object} data - Form data
 * @returns {Object} Result with success boolean and submission data or errors
 */
export function submitContactForm(data) {
  // Check cooldown
  const cooldownStatus = canSubmitContact();
  if (!cooldownStatus.canSubmit) {
    const minutes = Math.ceil(cooldownStatus.remainingTime / 60000);
    showToast(
      t('contactCooldown') || `Merci d'attendre ${minutes} minute(s) avant de renvoyer un message`,
      'warning'
    );
    return {
      success: false,
      error: 'cooldown_active',
      remainingTime: cooldownStatus.remainingTime,
    };
  }

  // Validate form data
  const validation = validateContactForm(data);
  if (!validation.valid) {
    const firstError = validation.errors[0];
    showToast(firstError.message, 'warning');
    return {
      success: false,
      error: 'validation_failed',
      errors: validation.errors,
    };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  // Create submission record
  const submission = {
    id: generateSubmissionId(),
    userId,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    type: data.type,
    subject: data.subject.trim(),
    message: data.message.trim(),
    status: ContactStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      lang: state.lang || 'fr',
      isLoggedIn: !!state.user,
    },
  };

  // Save to history
  const history = getHistoryFromStorage();
  history.unshift(submission);
  saveHistoryToStorage(history);

  // Simulate sending (in real app, would send to backend)
  // For now, mark as sent after a brief delay
  setTimeout(() => {
    const updatedHistory = getHistoryFromStorage();
    const index = updatedHistory.findIndex(s => s.id === submission.id);
    if (index !== -1) {
      updatedHistory[index].status = ContactStatus.SENT;
      updatedHistory[index].updatedAt = new Date().toISOString();
      saveHistoryToStorage(updatedHistory);
    }
  }, 1000);

  showToast(t('contactSubmitted') || 'Message envoye avec succes !', 'success');

  return {
    success: true,
    submission,
  };
}

/**
 * Get contact submission history for current user
 * @returns {Array} Array of contact submissions
 */
export function getContactHistory() {
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const history = getHistoryFromStorage();

  return history
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get all contact history (admin only)
 * @returns {Array} Array of all contact submissions
 */
export function getAllContactHistory() {
  return getHistoryFromStorage()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a specific submission by ID
 * @param {string} submissionId - Submission ID
 * @returns {Object|null} Submission object or null
 */
export function getSubmissionById(submissionId) {
  if (!submissionId) return null;
  const history = getHistoryFromStorage();
  return history.find(s => s.id === submissionId) || null;
}

/**
 * Get contact statistics
 * @returns {Object} Statistics object
 */
export function getContactStats() {
  const history = getContactHistory();

  const stats = {
    total: history.length,
    pending: history.filter(s => s.status === ContactStatus.PENDING).length,
    sent: history.filter(s => s.status === ContactStatus.SENT).length,
    read: history.filter(s => s.status === ContactStatus.READ).length,
    replied: history.filter(s => s.status === ContactStatus.REPLIED).length,
    closed: history.filter(s => s.status === ContactStatus.CLOSED).length,
    byType: {},
  };

  // Count by type
  history.forEach(submission => {
    const type = submission.type || 'unknown';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
}

/**
 * Clear all contact history (for testing/reset)
 * @returns {Object} Result object
 */
export function clearContactHistory() {
  saveHistoryToStorage([]);
  showToast(t('contactHistoryCleared') || 'Historique des contacts efface', 'success');
  return { success: true };
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
 * Get status label for display
 * @param {string} status - Contact status
 * @returns {string} Status label
 */
function getStatusLabel(status) {
  const labels = {
    [ContactStatus.PENDING]: t('contactStatusPending') || 'En attente',
    [ContactStatus.SENT]: t('contactStatusSent') || 'Envoye',
    [ContactStatus.READ]: t('contactStatusRead') || 'Lu',
    [ContactStatus.REPLIED]: t('contactStatusReplied') || 'Repondu',
    [ContactStatus.CLOSED]: t('contactStatusClosed') || 'Ferme',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 * @param {string} status - Contact status
 * @returns {string} CSS color class
 */
function getStatusColor(status) {
  const colors = {
    [ContactStatus.PENDING]: 'text-yellow-400 bg-yellow-500/20',
    [ContactStatus.SENT]: 'text-blue-400 bg-blue-500/20',
    [ContactStatus.READ]: 'text-purple-400 bg-purple-500/20',
    [ContactStatus.REPLIED]: 'text-green-400 bg-green-500/20',
    [ContactStatus.CLOSED]: 'text-slate-400 bg-slate-500/20',
  };
  return colors[status] || 'text-slate-400 bg-slate-500/20';
}

/**
 * Render contact form HTML
 * @returns {string} HTML string of the contact form
 */
export function renderContactForm() {
  const types = getContactTypes();
  const cooldownStatus = canSubmitContact();

  const cooldownMessage = cooldownStatus.canSubmit
    ? ''
    : `<div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
        <p class="text-yellow-400 text-sm">
          <i class="fas fa-clock mr-2"></i>
          ${escapeHTML(t('contactCooldownMessage') || `Merci d'attendre ${Math.ceil(cooldownStatus.remainingTime / 60000)} minute(s) avant de renvoyer un message`)}
        </p>
      </div>`;

  return `
    <div class="contact-form-container p-6 max-w-2xl mx-auto" role="form" aria-labelledby="contact-form-title">
      <div class="mb-6">
        <h2 id="contact-form-title" class="text-2xl font-bold text-white mb-2">
          <i class="fas fa-envelope mr-2 text-primary-500"></i>
          ${escapeHTML(t('contactTitle') || 'Nous contacter')}
        </h2>
        <p class="text-slate-400">
          ${escapeHTML(t('contactDescription') || 'Une question, une suggestion, un bug a signaler ? Ecrivez-nous !')}
        </p>
      </div>

      ${cooldownMessage}

      <form id="contact-form" class="space-y-6" onsubmit="handleContactSubmit(event)">
        <!-- Honeypot fields (hidden, anti-spam) -->
        <input
          type="text"
          name="honeypot"
          id="contact-honeypot"
          class="hidden"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
        />
        <input
          type="text"
          name="website"
          id="contact-website"
          class="hidden"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
        />

        <!-- Name field -->
        <div>
          <label for="contact-name" class="block text-sm font-medium text-slate-300 mb-2">
            ${escapeHTML(t('contactName') || 'Votre nom')} *
          </label>
          <input
            type="text"
            id="contact-name"
            name="name"
            required
            minlength="2"
            maxlength="100"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="${escapeHTML(t('contactNamePlaceholder') || 'Jean Dupont')}"
            aria-required="true"
            ${!cooldownStatus.canSubmit ? 'disabled' : ''}
          />
        </div>

        <!-- Email field -->
        <div>
          <label for="contact-email" class="block text-sm font-medium text-slate-300 mb-2">
            ${escapeHTML(t('contactEmail') || 'Votre email')} *
          </label>
          <input
            type="email"
            id="contact-email"
            name="email"
            required
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="${escapeHTML(t('contactEmailPlaceholder') || 'jean.dupont@email.com')}"
            aria-required="true"
            ${!cooldownStatus.canSubmit ? 'disabled' : ''}
          />
        </div>

        <!-- Type field -->
        <div>
          <label for="contact-type" class="block text-sm font-medium text-slate-300 mb-2">
            ${escapeHTML(t('contactType') || 'Type de message')} *
          </label>
          <select
            id="contact-type"
            name="type"
            required
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            aria-required="true"
            ${!cooldownStatus.canSubmit ? 'disabled' : ''}
          >
            <option value="">${escapeHTML(t('contactTypePlaceholder') || 'Selectionnez un type...')}</option>
            ${types.map(type => `
              <option value="${escapeHTML(type.id)}">
                ${escapeHTML(type.label)}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Subject field -->
        <div>
          <label for="contact-subject" class="block text-sm font-medium text-slate-300 mb-2">
            ${escapeHTML(t('contactSubject') || 'Sujet')} *
          </label>
          <input
            type="text"
            id="contact-subject"
            name="subject"
            required
            minlength="5"
            maxlength="200"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="${escapeHTML(t('contactSubjectPlaceholder') || 'De quoi voulez-vous parler ?')}"
            aria-required="true"
            ${!cooldownStatus.canSubmit ? 'disabled' : ''}
          />
        </div>

        <!-- Message field -->
        <div>
          <label for="contact-message" class="block text-sm font-medium text-slate-300 mb-2">
            ${escapeHTML(t('contactMessage') || 'Votre message')} *
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minlength="20"
            maxlength="5000"
            rows="6"
            class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            placeholder="${escapeHTML(t('contactMessagePlaceholder') || 'Decrivez votre demande en detail...')}"
            aria-required="true"
            oninput="updateContactCharsCount()"
            ${!cooldownStatus.canSubmit ? 'disabled' : ''}
          ></textarea>
          <p class="text-xs text-slate-500 mt-1">
            <span id="contact-chars-count">0</span>/5000 ${escapeHTML(t('characters') || 'caracteres')}
          </p>
        </div>

        <!-- Privacy notice -->
        <div class="bg-slate-800/50 rounded-lg p-4">
          <p class="text-sm text-slate-400">
            <i class="fas fa-lock mr-2 text-green-400"></i>
            ${escapeHTML(t('contactPrivacy') || 'Vos donnees sont traitees de maniere confidentielle et ne seront jamais partagees avec des tiers.')}
          </p>
        </div>

        <!-- Submit button -->
        <div class="flex gap-4">
          <button
            type="submit"
            id="contact-submit-btn"
            class="btn flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            ${!cooldownStatus.canSubmit ? 'disabled' : ''}
          >
            <i class="fas fa-paper-plane mr-2"></i>
            ${escapeHTML(t('contactSubmit') || 'Envoyer le message')}
          </button>
        </div>
      </form>

      <!-- Contact alternatives -->
      <div class="mt-8 pt-6 border-t border-white/10">
        <p class="text-sm text-slate-400 mb-4">
          ${escapeHTML(t('contactAlternatives') || 'Vous pouvez aussi nous contacter via :')}
        </p>
        <div class="flex flex-wrap gap-4">
          <a href="mailto:contact@spothitch.com" class="text-primary-400 hover:text-primary-300 text-sm">
            <i class="fas fa-envelope mr-1"></i> contact@spothitch.com
          </a>
          <a href="https://twitter.com/spothitch" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300 text-sm">
            <i class="fab fa-twitter mr-1"></i> @spothitch
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render contact history list
 * @returns {string} HTML string of contact history
 */
export function renderContactHistory() {
  const history = getContactHistory();

  if (history.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">📭</div>
        <h3 class="text-lg font-semibold text-white mb-2">
          ${escapeHTML(t('noContactHistory') || 'Aucun message envoye')}
        </h3>
        <p class="text-slate-400 text-sm">
          ${escapeHTML(t('noContactHistoryDesc') || 'Vous n\'avez pas encore envoye de message de contact')}
        </p>
      </div>
    `;
  }

  const listItems = history.map(submission => {
    const type = getContactTypeById(submission.type);

    return `
      <div
        class="contact-item p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
        data-submission-id="${escapeHTML(submission.id)}"
        role="listitem"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}">
                ${escapeHTML(getStatusLabel(submission.status))}
              </span>
              <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                <i class="fas ${escapeHTML(type?.icon || 'fa-envelope')} mr-1"></i>
                ${escapeHTML(type?.label || submission.type)}
              </span>
              <span class="text-slate-500 text-xs">${escapeHTML(formatDate(submission.createdAt))}</span>
            </div>
            <h4 class="text-white font-medium mb-1">${escapeHTML(submission.subject)}</h4>
            <p class="text-sm text-slate-400 line-clamp-2">${escapeHTML(submission.message.substring(0, 150))}${submission.message.length > 150 ? '...' : ''}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="contact-history space-y-3" role="list" aria-label="${escapeHTML(t('contactHistory') || 'Historique des messages')}">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">
          <i class="fas fa-history mr-2 text-primary-400"></i>
          ${escapeHTML(t('contactHistory') || 'Historique des messages')}
          <span class="text-sm font-normal text-slate-400 ml-2">(${history.length})</span>
        </h3>
      </div>
      ${listItems}
    </div>
  `;
}

// Global handlers for onclick events
window.handleContactSubmit = (event) => {
  event.preventDefault();

  const form = document.getElementById('contact-form');
  if (!form) return;

  const formData = {
    name: document.getElementById('contact-name')?.value || '',
    email: document.getElementById('contact-email')?.value || '',
    type: document.getElementById('contact-type')?.value || '',
    subject: document.getElementById('contact-subject')?.value || '',
    message: document.getElementById('contact-message')?.value || '',
    honeypot: document.getElementById('contact-honeypot')?.value || '',
    website: document.getElementById('contact-website')?.value || '',
  };

  const result = submitContactForm(formData);

  if (result.success) {
    // Reset form
    form.reset();
    document.getElementById('contact-chars-count').textContent = '0';
  }
};

window.updateContactCharsCount = () => {
  const textarea = document.getElementById('contact-message');
  const counter = document.getElementById('contact-chars-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
};

window.openContactForm = () => {
  setState({ showContactForm: true });
};

window.closeContactForm = () => {
  setState({ showContactForm: false });
};

// Export default with all functions
export default {
  ContactTypes,
  ContactStatus,
  submitContactForm,
  validateContactForm,
  validateEmail,
  getContactTypes,
  getContactTypeById,
  canSubmitContact,
  getContactHistory,
  getAllContactHistory,
  getSubmissionById,
  getContactStats,
  clearContactHistory,
  renderContactForm,
  renderContactHistory,
};
