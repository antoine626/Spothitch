/**
 * SOS Real-time Location Tracking Service
 * Share your location in real-time with emergency contacts
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from './notifications.js';

// Tracking configuration
const TRACKING_CONFIG = {
  updateInterval: 10000, // 10 seconds
  accuracyThreshold: 100, // meters
  maxAge: 30000, // 30 seconds
  timeout: 15000, // 15 seconds
};

// Store references
let watchId = null;
let trackingSessionId = null;
let lastPosition = null;
let trackingListeners = [];

/**
 * Start real-time SOS tracking
 * @param {Object} options - Tracking options
 * @returns {string} Session ID
 */
export async function startSOSTracking(options = {}) {
  if (!navigator.geolocation) {
    showToast('GPS non disponible', 'error');
    return null;
  }

  // Generate unique session ID
  trackingSessionId = generateSessionId();

  // Create tracking session
  const session = {
    id: trackingSessionId,
    startTime: new Date().toISOString(),
    userId: getState().user?.uid || 'anonymous',
    userName: getState().username || 'Utilisateur',
    userAvatar: getState().avatar || '🤙',
    status: 'active',
    reason: options.reason || 'SOS activé',
    positions: [],
    contacts: options.contacts || getState().emergencyContacts || [],
  };

  // Save session to state
  setState({
    sosActive: true,
    sosSession: session,
    sosTrackingId: trackingSessionId,
  });

  // Start watching position
  watchId = navigator.geolocation.watchPosition(
    (position) => handlePositionUpdate(position, session),
    handlePositionError,
    {
      enableHighAccuracy: true,
      maximumAge: TRACKING_CONFIG.maxAge,
      timeout: TRACKING_CONFIG.timeout,
    }
  );

  // Notify emergency contacts
  notifyContacts(session);

  showToast('🆘 Partage de position activé', 'warning');

  return trackingSessionId;
}

/**
 * Stop SOS tracking
 */
export function stopSOSTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  const state = getState();
  const session = state.sosSession;

  if (session) {
    // Update session status
    session.status = 'ended';
    session.endTime = new Date().toISOString();

    // Notify contacts that user is safe
    notifyContactsSafe(session);
  }

  setState({
    sosActive: false,
    sosSession: null,
    sosTrackingId: null,
  });

  trackingSessionId = null;
  lastPosition = null;

  showToast('✅ Position partagée arrêtée - Vous êtes en sécurité', 'success');
}

/**
 * Handle position update
 */
function handlePositionUpdate(position, session) {
  const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;

  const positionData = {
    lat: latitude,
    lng: longitude,
    accuracy,
    altitude,
    speed,
    heading,
    timestamp: new Date().toISOString(),
  };

  lastPosition = positionData;

  // Add to session history
  if (session) {
    session.positions.push(positionData);

    // Keep only last 100 positions
    if (session.positions.length > 100) {
      session.positions = session.positions.slice(-100);
    }

    setState({ sosSession: { ...session } });
  }

  // Notify listeners
  trackingListeners.forEach(listener => {
    try {
      listener(positionData);
    } catch (e) {
      console.error('Tracking listener error:', e);
    }
  });

  // Update shared location (in real app, this would update Firebase/server)
  updateSharedLocation(positionData, session);
}

/**
 * Handle position error
 */
function handlePositionError(error) {
  console.error('Position error:', error);

  switch (error.code) {
    case error.PERMISSION_DENIED:
      showToast('Accès GPS refusé', 'error');
      stopSOSTracking();
      break;
    case error.POSITION_UNAVAILABLE:
      showToast('Position indisponible', 'warning');
      break;
    case error.TIMEOUT:
      showToast('Délai GPS dépassé', 'warning');
      break;
  }
}

/**
 * Update shared location (mock - would use Firebase in production)
 */
function updateSharedLocation(position, session) {
  // In production, this would update a Firebase document
  // that contacts can watch in real-time
  console.log('Updated shared location:', position);

  // Store in localStorage for demo purposes
  const sharedData = {
    sessionId: session?.id,
    position,
    user: {
      name: session?.userName,
      avatar: session?.userAvatar,
    },
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`sos_share_${session?.id}`, JSON.stringify(sharedData));
}

/**
 * Notify emergency contacts
 */
function notifyContacts(session) {
  const contacts = session.contacts || [];

  if (contacts.length === 0) {
    showToast('Aucun contact d\'urgence configuré', 'warning');
    return;
  }

  // Generate share URL
  const shareUrl = generateShareUrl(session.id);

  // In production, this would send SMS/notifications
  // For now, show what would be sent
  console.log('Notifying contacts:', contacts);
  console.log('Share URL:', shareUrl);

  // Offer to share via native share API
  if (navigator.share) {
    navigator.share({
      title: 'SOS SpotHitch - Position en temps réel',
      text: `${session.userName} a activé le mode SOS. Suivez sa position en temps réel :`,
      url: shareUrl,
    }).catch(console.error);
  }
}

/**
 * Notify contacts that user is safe
 */
function notifyContactsSafe(session) {
  // In production, this would send notifications
  console.log('User marked as safe, notifying contacts');
}

/**
 * Generate share URL for tracking session
 */
function generateShareUrl(sessionId) {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?sos=${sessionId}`;
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current tracking position
 */
export function getCurrentPosition() {
  return lastPosition;
}

/**
 * Add tracking listener
 */
export function addTrackingListener(listener) {
  trackingListeners.push(listener);
  return () => {
    trackingListeners = trackingListeners.filter(l => l !== listener);
  };
}

/**
 * Check if tracking is active
 */
export function isTrackingActive() {
  return watchId !== null;
}

/**
 * Get tracking session info
 */
export function getTrackingSession() {
  return getState().sosSession;
}

/**
 * Render SOS tracking status widget
 */
export function renderSOSTrackingWidget(state) {
  if (!state.sosActive || !state.sosSession) return '';

  const session = state.sosSession;
  const lastPos = session.positions[session.positions.length - 1];
  const duration = session.startTime
    ? Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000)
    : 0;

  return `
    <div class="sos-tracking-widget fixed top-20 left-4 right-4 z-50 bg-danger-500 rounded-xl p-4 shadow-2xl animate-pulse-slow">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
          🆘
        </div>
        <div class="flex-1">
          <div class="font-bold text-white">SOS Actif</div>
          <div class="text-white/80 text-sm">
            Position partagée • ${formatDuration(duration)}
          </div>
          ${lastPos ? `
            <div class="text-white/60 text-xs mt-1">
              <i class="fas fa-map-pin mr-1"></i>
              ${lastPos.lat.toFixed(5)}, ${lastPos.lng.toFixed(5)}
              ${lastPos.accuracy ? `(±${Math.round(lastPos.accuracy)}m)` : ''}
            </div>
          ` : ''}
        </div>
        <button
          onclick="stopSOSTracking()"
          class="px-4 py-2 rounded-lg bg-white text-danger-500 font-bold text-sm hover:bg-white/90 transition-all"
        >
          Je suis en sécurité
        </button>
      </div>

      <!-- Share buttons -->
      <div class="flex gap-2 mt-3">
        <button
          onclick="shareSOSLink()"
          class="flex-1 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-all"
        >
          <i class="fas fa-share-alt mr-2"></i>
          Partager le lien
        </button>
        <button
          onclick="callEmergency()"
          class="flex-1 py-2 rounded-lg bg-white text-danger-500 text-sm font-bold hover:bg-white/90 transition-all"
        >
          <i class="fas fa-phone mr-2"></i>
          Appeler 112
        </button>
      </div>
    </div>
  `;
}

/**
 * Format duration in human readable format
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
}

// Global handlers
window.startSOSTracking = startSOSTracking;
window.stopSOSTracking = stopSOSTracking;
window.shareSOSLink = () => {
  const session = getState().sosSession;
  if (session) {
    const url = generateShareUrl(session.id);
    if (navigator.share) {
      navigator.share({
        title: 'Position SOS en temps réel',
        text: 'Suivez ma position en temps réel :',
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      showToast('Lien copié !', 'success');
    }
  }
};
window.callEmergency = () => {
  window.location.href = 'tel:112';
};

export default {
  startSOSTracking,
  stopSOSTracking,
  getCurrentPosition,
  addTrackingListener,
  isTrackingActive,
  getTrackingSession,
  renderSOSTrackingWidget,
};
