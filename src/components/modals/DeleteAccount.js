/**
 * Delete Account Modal Component
 * Confirmation modal with password verification for account deletion
 */

import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

export function renderDeleteAccountModal(state) {
  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onclick="closeDeleteAccount()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
     tabindex="0">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true"></div>

      <!-- Modal -->
      <div
        class="relative bg-dark-primary border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close -->
        <button
          onclick="closeDeleteAccount()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="${t('close') || 'Close'}"
          type="button"
        >
          ${icon('x', 'w-5 h-5')}
        </button>

        <!-- Header with danger indication -->
        <div class="p-6 text-center bg-gradient-to-b from-red-500/20 to-transparent border-b border-red-500/30">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            ${icon('triangle-alert', 'w-8 h-8 text-red-500')}
          </div>
          <h2 id="delete-account-title" class="text-2xl font-bold text-red-400">${t('deleteMyAccount') || 'Supprimer mon compte'}</h2>
          <p class="text-slate-400 text-sm mt-2">${t('thisActionIrreversible') || 'Cette action est irréversible'}</p>
        </div>

        <!-- Warning content -->
        <div class="p-6 space-y-4">
          <!-- Warning box -->
          <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <h3 class="font-semibold text-red-400 mb-3 flex items-center gap-2">
              ${icon('circle-alert', 'w-5 h-5')}
              ${t('warning') || 'Attention'}
            </h3>
            <ul class="text-sm text-slate-300 space-y-2">
              <li class="flex items-start gap-2">
                ${icon('circle-x', 'w-5 h-5 text-red-400 mt-0.5 shrink-0')}
                <span>${t('allSpotsDeleted') || 'Tous vos spots partagés seront supprimés'}</span>
              </li>
              <li class="flex items-start gap-2">
                ${icon('circle-x', 'w-5 h-5 text-red-400 mt-0.5 shrink-0')}
                <span>${t('pointsBadgesLost') || `Vos ${state.points || 0} pouces et ${state.badges?.length || 0} badges seront perdus`}</span>
              </li>
              <li class="flex items-start gap-2">
                ${icon('circle-x', 'w-5 h-5 text-red-400 mt-0.5 shrink-0')}
                <span>${t('checkinHistoryErased') || 'Votre historique de check-ins sera effacé'}</span>
              </li>
              <li class="flex items-start gap-2">
                ${icon('circle-x', 'w-5 h-5 text-red-400 mt-0.5 shrink-0')}
                <span>${t('friendsNoContact') || 'Vos amis ne pourront plus vous contacter'}</span>
              </li>
            </ul>
          </div>

          <!-- Password confirmation form -->
          <form id="delete-account-form" onsubmit="confirmDeleteAccount(event)" class="space-y-4">
            <div>
              <label for="delete-password" class="text-sm text-slate-400 block mb-2">
                ${t('enterPasswordConfirm') || 'Entrez votre mot de passe pour confirmer'}
              </label>
              <input
                type="password"
                id="delete-password"
                name="password"
                class="input-modern border-red-500/30 focus:border-red-500"
                placeholder="${t('yourPassword') || 'Votre mot de passe'}"
                required
                autocomplete="current-password"
                aria-required="true"
              />
            </div>

            <!-- Error message container -->
            <div id="delete-error" class="hidden text-red-400 text-sm text-center p-2 bg-red-500/10 rounded-xl">
            </div>

            <!-- Action buttons -->
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                onclick="closeDeleteAccount()"
                class="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium"
              >
                ${t('cancel') || 'Annuler'}
              </button>
              <button
                type="submit"
                id="delete-submit-btn"
                class="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors font-medium flex items-center justify-center gap-2"
              >
                ${icon('trash', 'w-5 h-5')}
                ${t('delete') || 'Supprimer'}
              </button>
            </div>
          </form>

          <!-- Alternative for Google users -->
          ${state.user?.providerData?.[0]?.providerId === 'google.com' ? `
            <div class="text-center text-sm text-slate-400 pt-2">
              <p>${t('connectedViaGoogle') || 'Vous êtes connecté via Google.'}</p>
              <button
                type="button"
                onclick="confirmDeleteAccountGoogle()"
                class="text-red-400 hover:text-red-300 underline mt-1"
              >
                ${t('deleteWithoutPassword') || 'Supprimer sans mot de passe'}
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Global handlers for delete account modal
window.openDeleteAccount = () => {
  const state = window.getState?.() || {};
  if (!state.isLoggedIn) {
    window.showToast?.(t('mustBeConnected') || 'Vous devez être connecté', 'error');
    return;
  }
  window.setState?.({ showDeleteAccount: true });
};

window.closeDeleteAccount = () => {
  window.setState?.({ showDeleteAccount: false });
  // Clear form
  const form = document.getElementById('delete-account-form');
  if (form) form.reset();
  const errorDiv = document.getElementById('delete-error');
  if (errorDiv) errorDiv.classList.add('hidden');
};

window.confirmDeleteAccount = async (event) => {
  event.preventDefault();

  const password = document.getElementById('delete-password')?.value;
  const submitBtn = document.getElementById('delete-submit-btn');
  const errorDiv = document.getElementById('delete-error');

  if (!password) {
    if (errorDiv) {
      errorDiv.textContent = t('enterYourPassword') || 'Veuillez entrer votre mot de passe';
      errorDiv.classList.remove('hidden');
    }
    return;
  }

  // Disable button and show loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('deleting') || 'Suppression...'}`;
  }

  try {
    const { deleteUserAccount } = await import('../../services/firebase.js');
    const { showToast } = await import('../../services/notifications.js');
    const { setState, actions } = await import('../../stores/state.js');

    const result = await deleteUserAccount(password);

    if (result.success) {
      // Clear ALL local data (RGPD compliant - uses centralized registry)
      const { clearAllUserData } = await import('../../services/storageRegistry.js');
      clearAllUserData();

      // Reset state
      actions.setUser(null);
      setState({
        showDeleteAccount: false,
        isLoggedIn: false,
        user: null,
        points: 0,
        level: 1,
        badges: [],
        spotsCreated: 0,
        checkins: 0,
        reviewsGiven: 0,
        activeTab: 'map',
      });

      showToast(t('accountDeletedGoodbye') || 'Compte supprimé avec succès. Au revoir !', 'success');
    } else {
      // Show error
      if (errorDiv) {
        errorDiv.textContent = getDeleteErrorMessage(result.error);
        errorDiv.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Delete account error:', error);
    if (errorDiv) {
      errorDiv.textContent = t('errorOccurred') || 'Une erreur est survenue. Réessayez plus tard.';
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('trash', 'w-5 h-5')} ${t('delete') || 'Supprimer'}`;
    }
  }
};

window.confirmDeleteAccountGoogle = async () => {
  const submitBtn = document.getElementById('delete-submit-btn');
  const errorDiv = document.getElementById('delete-error');

  // Confirm action
  if (!confirm(t('confirmDeleteForever') || 'Êtes-vous sûr de vouloir supprimer définitivement votre compte ?')) {
    return;
  }

  // Disable button and show loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `${icon('loader-circle', 'w-5 h-5 animate-spin')} ${t('deleting') || 'Suppression...'}`;
  }

  try {
    const { deleteUserAccountGoogle } = await import('../../services/firebase.js');
    const { showToast } = await import('../../services/notifications.js');
    const { setState, actions } = await import('../../stores/state.js');

    const result = await deleteUserAccountGoogle();

    if (result.success) {
      // Clear ALL local data (RGPD compliant - uses centralized registry)
      const { clearAllUserData } = await import('../../services/storageRegistry.js');
      clearAllUserData();

      // Reset state
      actions.setUser(null);
      setState({
        showDeleteAccount: false,
        isLoggedIn: false,
        user: null,
        points: 0,
        level: 1,
        badges: [],
        spotsCreated: 0,
        checkins: 0,
        reviewsGiven: 0,
        activeTab: 'map',
      });

      showToast(t('accountDeletedGoodbye') || 'Compte supprimé avec succès. Au revoir !', 'success');
    } else {
      if (errorDiv) {
        errorDiv.textContent = getDeleteErrorMessage(result.error);
        errorDiv.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Delete account error:', error);
    if (errorDiv) {
      errorDiv.textContent = t('errorOccurred') || 'Une erreur est survenue. Réessayez plus tard.';
      errorDiv.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('trash', 'w-5 h-5')} ${t('delete') || 'Supprimer'}`;
    }
  }
};

function getDeleteErrorMessage(errorCode) {
  const messages = {
    'auth/wrong-password': t('wrongPassword') || 'Mot de passe incorrect',
    'auth/too-many-requests': t('tooManyAttempts') || 'Trop de tentatives. Réessayez plus tard.',
    'auth/requires-recent-login': t('pleaseReconnect') || 'Veuillez vous reconnecter avant de supprimer votre compte.',
    'auth/user-not-found': t('userNotFound') || 'Utilisateur non trouvé',
  };
  return messages[errorCode] || (t('errorOccurred') || 'Une erreur est survenue');
}

export default { renderDeleteAccountModal };
