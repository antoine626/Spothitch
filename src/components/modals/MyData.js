/**
 * MyData Modal Component - GDPR Compliance
 * Shows users all data the app has collected about them
 */

import { getState, setState } from '../../stores/state.js';
import { Storage } from '../../utils/storage.js';
import { t } from '../../i18n/index.js';

/**
 * Get all user data for GDPR compliance
 */
function getUserData() {
  const state = getState();

  // Personal Information
  const personalInfo = {
    email: state.user?.email || 'Non connecte',
    username: state.username || 'Voyageur',
    avatar: state.avatar || '',
    registrationDate: state.user?.metadata?.creationTime || state.registrationDate || null,
    lastLogin: state.user?.metadata?.lastSignInTime || state.lastLogin || null,
  };

  // Activity Data
  const activityData = {
    checkins: state.checkins || 0,
    spotsCreated: state.spotsCreated || 0,
    reviewsGiven: state.reviewsGiven || 0,
    messagesCount: state.messagesCount || 0,
    friendsCount: (state.friends || []).length,
    savedTripsCount: (state.savedTrips || []).length,
    badgesCount: (state.badges || []).length,
    rewardsCount: (state.rewards || []).length,
  };

  // Gamification Data
  const gamificationData = {
    points: state.points || 0,
    level: state.level || 1,
    seasonPoints: state.seasonPoints || 0,
    totalPoints: state.totalPoints || 0,
    streak: state.streak || 0,
    skillPoints: state.skillPoints || 0,
    unlockedSkills: (state.unlockedSkills || []).length,
  };

  // Location Data
  const locationData = {
    lastKnownPosition: state.userLocation || null,
    gpsEnabled: state.gpsEnabled || false,
    locationHistoryCount: state.locationHistory?.length || 0,
  };

  // Consent Data
  const consentData = {
    cookies: Storage.get('consent_cookies') || null,
    geolocation: Storage.get('consent_geolocation') || null,
    notifications: Storage.get('consent_notifications') || null,
  };

  return {
    personalInfo,
    activityData,
    gamificationData,
    locationData,
    consentData,
  };
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Non disponible';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Non disponible';
  }
}

/**
 * Format consent status
 */
function formatConsent(consent) {
  if (!consent) return { status: 'Non defini', date: null, class: 'text-slate-400' };
  return {
    status: consent.accepted ? 'Accepte' : 'Refuse',
    date: consent.date ? formatDate(consent.date) : null,
    class: consent.accepted ? 'text-emerald-400' : 'text-red-400',
  };
}

/**
 * Format location for display
 */
function formatLocation(location) {
  if (!location) return 'Non autorisee';
  return `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`;
}

/**
 * Render MyData Modal
 */
export function renderMyDataModal() {
  const data = getUserData();
  const { personalInfo, activityData, gamificationData, locationData, consentData } = data;

  // Format consents
  const cookiesConsent = formatConsent(consentData.cookies);
  const geoConsent = formatConsent(consentData.geolocation);
  const notifConsent = formatConsent(consentData.notifications);

  return `
    <div class="modal-overlay" onclick="closeMyData()" role="dialog" aria-modal="true" aria-labelledby="mydata-title">
      <div class="modal-content max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center">
              <i class="fas fa-database text-blue-400 text-xl" aria-hidden="true"></i>
            </div>
            <div>
              <h2 id="mydata-title" class="text-xl font-bold">Mes donnees</h2>
              <p class="text-sm text-slate-400">Conformite RGPD</p>
            </div>
          </div>
          <button
            onclick="closeMyData()"
            class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            aria-label="Fermer"
          >
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Personal Information Section -->
        <section class="mb-6" aria-labelledby="section-personal">
          <h3 id="section-personal" class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="fas fa-user text-primary-400" aria-hidden="true"></i>
            Informations personnelles
          </h3>
          <div class="card p-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Email</span>
              <span class="font-medium">${personalInfo.email}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Nom d'utilisateur</span>
              <span class="font-medium">${personalInfo.username}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Date d'inscription</span>
              <span class="font-medium text-sm">${formatDate(personalInfo.registrationDate)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Derniere connexion</span>
              <span class="font-medium text-sm">${formatDate(personalInfo.lastLogin)}</span>
            </div>
          </div>
        </section>

        <!-- Activity Section -->
        <section class="mb-6" aria-labelledby="section-activity">
          <h3 id="section-activity" class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="fas fa-chart-line text-emerald-400" aria-hidden="true"></i>
            Activite
          </h3>
          <div class="card p-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-lg bg-white/5 text-center">
                <div class="text-2xl font-bold text-purple-400">${activityData.checkins}</div>
                <div class="text-xs text-slate-400">Check-ins</div>
              </div>
              <div class="p-3 rounded-lg bg-white/5 text-center">
                <div class="text-2xl font-bold text-emerald-400">${activityData.spotsCreated}</div>
                <div class="text-xs text-slate-400">Spots crees</div>
              </div>
              <div class="p-3 rounded-lg bg-white/5 text-center">
                <div class="text-2xl font-bold text-amber-400">${activityData.reviewsGiven}</div>
                <div class="text-xs text-slate-400">Avis donnes</div>
              </div>
              <div class="p-3 rounded-lg bg-white/5 text-center">
                <div class="text-2xl font-bold text-sky-400">${activityData.friendsCount}</div>
                <div class="text-xs text-slate-400">Amis</div>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-white/10 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-400">Voyages sauvegardes</span>
                <span>${activityData.savedTripsCount}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Badges obtenus</span>
                <span>${activityData.badgesCount}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Recompenses</span>
                <span>${activityData.rewardsCount}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Gamification Section -->
        <section class="mb-6" aria-labelledby="section-gamification">
          <h3 id="section-gamification" class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="fas fa-trophy text-amber-400" aria-hidden="true"></i>
            Progression
          </h3>
          <div class="card p-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400">Points totaux</span>
              <span class="font-medium text-primary-400">${gamificationData.totalPoints || gamificationData.points}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Niveau actuel</span>
              <span class="font-medium">${gamificationData.level}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Points de saison</span>
              <span class="font-medium">${gamificationData.seasonPoints}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Serie actuelle</span>
              <span class="font-medium">${gamificationData.streak} jours</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Points de competence</span>
              <span class="font-medium">${gamificationData.skillPoints}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Competences debloquees</span>
              <span class="font-medium">${gamificationData.unlockedSkills}</span>
            </div>
          </div>
        </section>

        <!-- Location Data Section -->
        <section class="mb-6" aria-labelledby="section-location">
          <h3 id="section-location" class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="fas fa-map-marker-alt text-red-400" aria-hidden="true"></i>
            Donnees de localisation
          </h3>
          <div class="card p-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Derniere position connue</span>
              <span class="font-medium text-sm">${formatLocation(locationData.lastKnownPosition)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">GPS active</span>
              <span class="font-medium ${locationData.gpsEnabled ? 'text-emerald-400' : 'text-slate-400'}">
                ${locationData.gpsEnabled ? 'Oui' : 'Non'}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400">Historique des positions</span>
              <span class="font-medium">${locationData.locationHistoryCount} entrees</span>
            </div>
            <p class="text-xs text-slate-500 mt-2">
              <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
              La position n'est collectee que lorsque vous utilisez activement l'application avec GPS active.
            </p>
          </div>
        </section>

        <!-- Consents Section -->
        <section class="mb-6" aria-labelledby="section-consents">
          <h3 id="section-consents" class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="fas fa-shield-alt text-purple-400" aria-hidden="true"></i>
            Consentements
          </h3>
          <div class="card p-4 space-y-4">
            <!-- Cookies -->
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">Cookies</div>
                ${cookiesConsent.date ? `<div class="text-xs text-slate-500">${cookiesConsent.date}</div>` : ''}
              </div>
              <span class="font-medium ${cookiesConsent.class}">${cookiesConsent.status}</span>
            </div>

            <!-- Geolocation -->
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">Geolocalisation</div>
                ${geoConsent.date ? `<div class="text-xs text-slate-500">${geoConsent.date}</div>` : ''}
              </div>
              <span class="font-medium ${geoConsent.class}">${geoConsent.status}</span>
            </div>

            <!-- Notifications -->
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">Notifications</div>
                ${notifConsent.date ? `<div class="text-xs text-slate-500">${notifConsent.date}</div>` : ''}
              </div>
              <span class="font-medium ${notifConsent.class}">${notifConsent.status}</span>
            </div>

            <button
              onclick="openConsentSettings()"
              class="w-full mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm"
            >
              <i class="fas fa-cog mr-2" aria-hidden="true"></i>
              Gerer mes consentements
            </button>
          </div>
        </section>

        <!-- Actions Section -->
        <section aria-labelledby="section-actions">
          <h3 id="section-actions" class="text-lg font-semibold mb-3 flex items-center gap-2">
            <i class="fas fa-cogs text-slate-400" aria-hidden="true"></i>
            Actions
          </h3>
          <div class="space-y-3">
            <!-- Download Data -->
            <button
              onclick="downloadMyData()"
              class="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/50 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <i class="fas fa-download text-blue-400" aria-hidden="true"></i>
                </div>
                <div class="text-left">
                  <div class="font-medium">Telecharger mes donnees</div>
                  <div class="text-xs text-slate-400">Export JSON complet</div>
                </div>
              </div>
              <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
            </button>

            <!-- Delete Account -->
            <button
              onclick="requestAccountDeletion()"
              class="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 hover:border-red-500/50 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <i class="fas fa-trash-alt text-red-400" aria-hidden="true"></i>
                </div>
                <div class="text-left">
                  <div class="font-medium text-red-400">Supprimer mon compte</div>
                  <div class="text-xs text-slate-400">Action irreversible</div>
                </div>
              </div>
              <i class="fas fa-chevron-right text-slate-500" aria-hidden="true"></i>
            </button>
          </div>
        </section>

        <!-- Footer Info -->
        <div class="mt-6 pt-4 border-t border-white/10 text-center">
          <p class="text-xs text-slate-500">
            Conformement au RGPD (Reglement General sur la Protection des Donnees), vous avez le droit d'acceder, de rectifier et de supprimer vos donnees personnelles.
          </p>
          <a
            href="#"
            onclick="showLegalPage('privacy'); closeMyData();"
            class="text-xs text-primary-400 hover:underline mt-2 inline-block"
          >
            Consulter notre politique de confidentialite
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Download user data as JSON
 */
export function downloadUserData() {
  const data = getUserData();
  const state = getState();

  // Add more detailed data for export
  const exportData = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    ...data,
    // Additional detailed data
    badges: state.badges || [],
    rewards: state.rewards || [],
    savedTrips: state.savedTrips || [],
    emergencyContacts: state.emergencyContacts || [],
    friends: (state.friends || []).map(f => ({ id: f.id, name: f.name, addedAt: f.addedAt })),
    unlockedSkills: state.unlockedSkills || [],
    settings: {
      theme: state.theme,
      language: state.lang,
      notifications: state.notifications,
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `spothitch-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  window.showToast?.('Donnees telecharges !', 'success');
}

/**
 * Request account deletion
 */
export function requestAccountDeletion() {
  const confirmed = confirm(
    'Etes-vous sur de vouloir supprimer votre compte ?\n\n' +
    'Cette action est IRREVERSIBLE et supprimera :\n' +
    '- Votre profil et vos parametres\n' +
    '- Vos spots et avis\n' +
    '- Votre historique et progression\n' +
    '- Toutes vos donnees associees\n\n' +
    'Tapez "SUPPRIMER" pour confirmer.'
  );

  if (confirmed) {
    const input = prompt('Tapez "SUPPRIMER" pour confirmer la suppression definitive :');
    if (input === 'SUPPRIMER') {
      // In a real app, this would call the backend
      // For now, clear local storage
      import('../../utils/storage.js').then(({ Storage }) => {
        Storage.clear();
        window.showToast?.('Compte supprime. Vous allez etre redirige...', 'info');
        setTimeout(() => {
          location.reload();
        }, 2000);
      });
    } else if (input !== null) {
      window.showToast?.('Suppression annulee - texte incorrect', 'warning');
    }
  }
}

/**
 * Open consent settings
 */
export function openConsentSettings() {
  // Show a simple consent management modal
  const cookiesConsent = Storage.get('consent_cookies');
  const geoConsent = Storage.get('consent_geolocation');
  const notifConsent = Storage.get('consent_notifications');

  setState({ showConsentSettings: true });
  window.showToast?.('Parametres de consentement - fonctionnalite a venir', 'info');
}

// Global handlers
window.closeMyData = () => setState({ showMyData: false });
window.downloadMyData = downloadUserData;
window.requestAccountDeletion = requestAccountDeletion;
window.openConsentSettings = openConsentSettings;
window.openMyData = () => setState({ showMyData: true });

export default { renderMyDataModal, downloadUserData, requestAccountDeletion };
