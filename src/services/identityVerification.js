/**
 * Identity Verification Service
 * Progressive verification system for building trust between hitchhikers
 */

import { getState, setState } from '../stores/state.js';
import { uploadImage, getCurrentUser, updateUserProfile } from './firebase.js';
import { showToast } from './notifications.js';
import { addPoints } from './gamification.js';

/**
 * Verification Levels (Progressive Trust System)
 * Each level provides increased trust and unlocks features
 */
export const verificationLevels = {
  0: {
    id: 0,
    name: 'Non verifie',
    nameEn: 'Unverified',
    icon: '',
    color: '#6b7280',
    description: 'Compte sans verification',
    descriptionEn: 'Account without verification',
    trustScore: 0,
    benefits: [],
    benefitsEn: [],
  },
  1: {
    id: 1,
    name: 'Email verifie',
    nameEn: 'Email verified',
    icon: '📧',
    color: '#9ca3af',
    description: 'Adresse email confirmee',
    descriptionEn: 'Email address confirmed',
    trustScore: 10,
    benefits: [
      'Messagerie privee activee',
      'Notifications par email',
      'Publication de spots',
    ],
    benefitsEn: [
      'Private messaging enabled',
      'Email notifications',
      'Spot publishing',
    ],
  },
  2: {
    id: 2,
    name: 'Telephone verifie',
    nameEn: 'Phone verified',
    icon: '🛡️',
    color: '#3b82f6',
    description: 'Numero de telephone confirme par SMS',
    descriptionEn: 'Phone number confirmed by SMS',
    trustScore: 25,
    benefits: [
      'Badge bleu "Telephone verifie"',
      'Priorite dans les resultats de recherche',
      'Acces au chat vocal (futur)',
    ],
    benefitsEn: [
      'Blue "Phone verified" badge',
      'Priority in search results',
      'Voice chat access (future)',
    ],
  },
  3: {
    id: 3,
    name: 'Selfie + ID soumis',
    nameEn: 'Selfie + ID submitted',
    icon: '⏳',
    color: '#f59e0b',
    description: 'Photos en attente de verification moderateur',
    descriptionEn: 'Photos pending moderator review',
    trustScore: 40,
    benefits: [
      'Badge jaune "En attente de verification"',
      'Verification en cours',
      'Acces aux groupes de voyage',
    ],
    benefitsEn: [
      'Yellow "Pending verification" badge',
      'Verification in progress',
      'Access to travel groups',
    ],
  },
  4: {
    id: 4,
    name: 'Identite verifiee',
    nameEn: 'Identity verified',
    icon: '✅',
    color: '#10b981',
    description: 'Piece d\'identite validee par moderateur',
    descriptionEn: 'ID document validated by moderator',
    trustScore: 70,
    benefits: [
      'Badge vert "Identite verifiee"',
      'Priorite maximale dans les recherches',
      'Acces a toutes les fonctionnalites',
      'Organisateur de meetups officiel',
    ],
    benefitsEn: [
      'Green "Identity verified" badge',
      'Maximum priority in searches',
      'Access to all features',
      'Official meetup organizer',
    ],
  },
  5: {
    id: 5,
    name: 'Membre actif de confiance',
    nameEn: 'Trusted active member',
    icon: '⭐',
    color: '#fbbf24',
    description: 'Membre verifie avec anciennete et activite elevee',
    descriptionEn: 'Verified member with high seniority and activity',
    trustScore: 100,
    benefits: [
      'Badge dore "Membre de confiance"',
      'Statut premium dans la communaute',
      'Peut parrainer de nouveaux membres',
      'Influence sur les decisions communautaires',
      'Acces anticipe aux nouvelles fonctionnalites',
    ],
    benefitsEn: [
      'Golden "Trusted member" badge',
      'Premium status in the community',
      'Can sponsor new members',
      'Influence on community decisions',
      'Early access to new features',
    ],
  },
};

/**
 * Why verification matters - explanations for users
 */
export const verificationReasons = {
  fr: {
    title: 'Pourquoi se faire verifier ?',
    subtitle: 'La securite est notre priorite',
    mainReason: 'L\'auto-stop repose sur la confiance entre inconnus. Plus tu es verifie, plus les autres voyageurs te feront confiance !',
    reasons: [
      {
        icon: '',
        title: 'Securite renforcee',
        description: 'Les profils verifies permettent de voyager plus sereinement. Tu sais a qui tu as affaire.',
      },
      {
        icon: '',
        title: 'Confiance mutuelle',
        description: 'Montre que tu es une vraie personne. Les conducteurs sont plus enclins a s\'arreter pour des profils verifies.',
      },
      {
        icon: '',
        title: 'Communaute de confiance',
        description: 'Aide a construire une communaute ou chacun peut voyager en securite.',
      },
      {
        icon: '',
        title: 'Plus de visibilite',
        description: 'Les profils verifies apparaissent en priorite et gagnent plus facilement la confiance.',
      },
    ],
    privacyNote: 'Tes documents sont traites de maniere securisee et ne sont jamais partages. Nous ne conservons que le statut de verification.',
  },
  en: {
    title: 'Why get verified?',
    subtitle: 'Safety is our priority',
    mainReason: 'Hitchhiking relies on trust between strangers. The more verified you are, the more other travelers will trust you!',
    reasons: [
      {
        icon: '',
        title: 'Enhanced security',
        description: 'Verified profiles allow traveling more peacefully. You know who you\'re dealing with.',
      },
      {
        icon: '',
        title: 'Mutual trust',
        description: 'Show that you\'re a real person. Drivers are more likely to stop for verified profiles.',
      },
      {
        icon: '',
        title: 'Trust community',
        description: 'Help build a community where everyone can travel safely.',
      },
      {
        icon: '',
        title: 'More visibility',
        description: 'Verified profiles appear first and gain trust more easily.',
      },
    ],
    privacyNote: 'Your documents are processed securely and never shared. We only keep the verification status.',
  },
};

/**
 * Get current verification level
 * @returns {Object} Current verification level info
 */
export function getVerificationLevel() {
  const state = getState();
  const level = state.verificationLevel || 0;
  return verificationLevels[level] || verificationLevels[0];
}

/**
 * Get next verification level
 * @returns {Object|null} Next level info or null if max
 */
export function getNextVerificationLevel() {
  const state = getState();
  const currentLevel = state.verificationLevel || 0;
  const nextLevel = currentLevel + 1;

  if (nextLevel > 5) return null;
  return verificationLevels[nextLevel];
}

/**
 * Get verification progress
 * @returns {Object} Progress info
 */
export function getVerificationProgress() {
  const state = getState();
  const currentLevel = state.verificationLevel || 0;

  return {
    currentLevel,
    maxLevel: 5,
    progress: (currentLevel / 5) * 100,
    trustScore: verificationLevels[currentLevel]?.trustScore || 0,
    maxTrustScore: 100,
    completedSteps: currentLevel,
    totalSteps: 5,
    verifications: {
      email: currentLevel >= 1,
      phone: currentLevel >= 2,
      selfieIdSubmitted: currentLevel >= 3,
      identityVerified: currentLevel >= 4,
      trustedMember: currentLevel >= 5,
    },
  };
}

/**
 * Check if email is verified (Level 1)
 * @returns {boolean}
 */
export function isEmailVerified() {
  const state = getState();
  const user = getCurrentUser();
  return user?.emailVerified || (state.verificationLevel || 0) >= 1;
}

/**
 * Check if phone is verified (Level 2)
 * @returns {boolean}
 */
export function isPhoneVerified() {
  const state = getState();
  return (state.verificationLevel || 0) >= 2;
}

/**
 * Check if photo is verified (Level 3)
 * @returns {boolean}
 */
export function isPhotoVerified() {
  const state = getState();
  return (state.verificationLevel || 0) >= 3;
}

/**
 * Check if identity is verified (Level 4)
 * @returns {boolean}
 */
export function isIdentityVerified() {
  const state = getState();
  return (state.verificationLevel || 0) >= 4;
}

/**
 * Send email verification
 * @returns {Promise<Object>} Result
 */
export async function sendEmailVerification() {
  try {
    const { sendEmailVerification: firebaseSendEmail } = await import('firebase/auth');
    const user = getCurrentUser();

    if (!user) {
      return { success: false, error: 'not-logged-in' };
    }

    if (user.emailVerified) {
      // Already verified - update level
      await updateVerificationLevel(1);
      return { success: true, alreadyVerified: true };
    }

    await firebaseSendEmail(user);
    return { success: true, message: 'Email de verification envoye' };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Verify phone number (simulated - in production would use Firebase Phone Auth)
 * @param {string} phoneNumber - Phone number to verify
 * @returns {Promise<Object>} Result with verification code ID
 */
export async function sendPhoneVerification(phoneNumber) {
  try {
    // Validate phone format (basic)
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      return { success: false, error: 'invalid-phone' };
    }

    // In production, this would use Firebase Phone Auth
    // For demo, we simulate sending a code
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store pending verification
    setState({
      pendingPhoneVerification: {
        phone: cleanPhone,
        verificationId,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        code: '123456', // Demo code - in production this comes from Firebase
      },
    });

    return { success: true, verificationId, message: 'Code SMS envoye' };
  } catch (error) {
    console.error('Phone verification error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Confirm phone verification code
 * @param {string} code - Verification code
 * @returns {Promise<Object>} Result
 */
export async function confirmPhoneVerification(code) {
  try {
    const state = getState();
    const pending = state.pendingPhoneVerification;

    if (!pending) {
      return { success: false, error: 'no-pending-verification' };
    }

    if (Date.now() > pending.expiresAt) {
      setState({ pendingPhoneVerification: null });
      return { success: false, error: 'code-expired' };
    }

    // Demo: accept 123456 as valid code
    if (code !== pending.code && code !== '123456') {
      return { success: false, error: 'invalid-code' };
    }

    // Success - update verification level
    await updateVerificationLevel(2);

    setState({
      pendingPhoneVerification: null,
      verifiedPhone: pending.phone,
    });

    return { success: true, message: 'Telephone verifie avec succes' };
  } catch (error) {
    console.error('Phone confirmation error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Upload and verify profile photo
 * @param {string} photoData - Base64 photo data
 * @returns {Promise<Object>} Result
 */
export async function uploadVerificationPhoto(photoData) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'not-logged-in' };
    }

    // Validate image data
    if (!photoData || !photoData.startsWith('data:image')) {
      return { success: false, error: 'invalid-image' };
    }

    // Upload photo
    const timestamp = Date.now();
    const path = `verification/${user.uid}/photo_${timestamp}.jpg`;
    const result = await uploadImage(photoData, path);

    if (!result.success) {
      return { success: false, error: 'upload-failed' };
    }

    // Store pending photo verification (in production, this goes to manual review)
    setState({
      pendingPhotoVerification: {
        url: result.url,
        uploadedAt: timestamp,
        status: 'pending',
      },
    });

    // For demo purposes, auto-approve after 2 seconds
    setTimeout(async () => {
      await approvePhotoVerification();
    }, 2000);

    return { success: true, url: result.url, message: 'Photo envoyee pour verification' };
  } catch (error) {
    console.error('Photo upload error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Approve photo verification (admin function / auto in demo)
 * @returns {Promise<Object>} Result
 */
export async function approvePhotoVerification() {
  try {
    const state = getState();
    const pending = state.pendingPhotoVerification;

    if (!pending) {
      return { success: false, error: 'no-pending-verification' };
    }

    await updateVerificationLevel(3);

    setState({
      pendingPhotoVerification: null,
      verifiedPhotoUrl: pending.url,
    });

    showToast(' Photo de profil verifiee !', 'success');

    return { success: true };
  } catch (error) {
    console.error('Photo approval error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Upload identity document for verification
 * @param {string} documentData - Base64 document data
 * @param {string} documentType - Type: 'passport' or 'id_card'
 * @returns {Promise<Object>} Result
 */
export async function uploadIdentityDocument(documentData, documentType = 'id_card') {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'not-logged-in' };
    }

    // Validate document type
    const validTypes = ['passport', 'id_card'];
    if (!validTypes.includes(documentType)) {
      return { success: false, error: 'invalid-document-type' };
    }

    // Validate image data
    if (!documentData || !documentData.startsWith('data:image')) {
      return { success: false, error: 'invalid-image' };
    }

    // Upload document to secure storage
    const timestamp = Date.now();
    const path = `verification/${user.uid}/identity_${documentType}_${timestamp}.jpg`;
    const result = await uploadImage(documentData, path);

    if (!result.success) {
      return { success: false, error: 'upload-failed' };
    }

    // Store pending identity verification
    setState({
      pendingIdentityVerification: {
        url: result.url,
        documentType,
        uploadedAt: timestamp,
        status: 'pending_review',
      },
    });

    // For demo purposes, auto-approve after 3 seconds
    setTimeout(async () => {
      await approveIdentityVerification();
    }, 3000);

    return {
      success: true,
      message: 'Document envoye pour verification. Traitement en cours...',
    };
  } catch (error) {
    console.error('Identity upload error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Approve identity verification (admin function / auto in demo)
 * @returns {Promise<Object>} Result
 */
export async function approveIdentityVerification() {
  try {
    const state = getState();
    const pending = state.pendingIdentityVerification;

    if (!pending) {
      return { success: false, error: 'no-pending-verification' };
    }

    await updateVerificationLevel(4);

    setState({
      pendingIdentityVerification: null,
      identityVerifiedAt: Date.now(),
    });

    showToast(' Identite verifiee ! Tu as le niveau maximum de confiance.', 'success');

    return { success: true };
  } catch (error) {
    console.error('Identity approval error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Update verification level
 * @param {number} newLevel - New verification level (1-4)
 * @returns {Promise<void>}
 */
async function updateVerificationLevel(newLevel) {
  const state = getState();
  const currentLevel = state.verificationLevel || 0;

  // Only allow level increase
  if (newLevel <= currentLevel) return;

  // Update local state
  setState({
    verificationLevel: newLevel,
  });

  // Update Firebase profile
  const user = getCurrentUser();
  if (user) {
    await updateUserProfile(user.uid, {
      verificationLevel: newLevel,
    });
  }

  // Award points for verification
  const pointsReward = {
    1: 25,   // Email
    2: 50,   // Phone
    3: 75,   // Photo
    4: 150,  // Identity
  };

  if (pointsReward[newLevel]) {
    addPoints(pointsReward[newLevel], `verification_level_${newLevel}`);
  }

  // Show notification
  const level = verificationLevels[newLevel];
  if (level) {
    showToast(`${level.icon} ${level.name} !`, 'success');
  }
}

/**
 * Render verification badge HTML
 * @param {number} level - Verification level (optional, uses current if not provided)
 * @param {string} size - Size: 'sm', 'md', 'lg'
 * @returns {string} HTML string
 */
export function renderVerificationBadge(level = null, size = 'md') {
  const state = getState();
  const currentLevel = level ?? (state.verificationLevel || 0);
  const levelInfo = verificationLevels[currentLevel];

  if (!levelInfo || currentLevel === 0) return '';

  const sizes = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  };

  const sizeClass = sizes[size] || sizes.md;

  return `
    <span
      class="inline-flex items-center justify-center rounded-full ${sizeClass}"
      style="background: ${levelInfo.color}20; color: ${levelInfo.color};"
      title="${levelInfo.name}"
      aria-label="${levelInfo.name}"
    >
      ${levelInfo.icon}
    </span>
  `;
}

/**
 * Render full verification status HTML for profile
 * @returns {string} HTML string
 */
export function renderVerificationStatus() {
  const progress = getVerificationProgress();
  const currentLevel = verificationLevels[progress.currentLevel];
  const nextLevel = getNextVerificationLevel();

  return `
    <div class="card p-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold flex items-center gap-2">
          <span class="text-xl">${currentLevel.icon}</span>
          Verification d'identite
        </h3>
        <span
          class="px-3 py-1 rounded-full text-sm font-medium"
          style="background: ${currentLevel.color}20; color: ${currentLevel.color};"
        >
          Niveau ${progress.currentLevel}/4
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <div
          class="h-full rounded-full transition-all"
          style="width: ${progress.progress}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6);"
        ></div>
      </div>

      <!-- Verification steps -->
      <div class="grid grid-cols-4 gap-2 mb-4">
        ${Object.values(verificationLevels).slice(1).map((level, index) => {
          const isComplete = progress.currentLevel >= level.id;
          const isCurrent = progress.currentLevel === level.id - 1;
          return `
            <div class="text-center ${isComplete ? '' : 'opacity-50'}">
              <div
                class="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1 ${isCurrent ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-primary' : ''}"
                style="background: ${isComplete ? level.color : 'rgba(255,255,255,0.1)'}20;"
              >
                <span class="${isComplete ? '' : 'grayscale'}">${level.icon}</span>
              </div>
              <div class="text-xs ${isComplete ? 'text-white' : 'text-slate-500'}">${level.name.split(' ')[0]}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Trust score -->
      <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-lg"></span>
          <span>Score de confiance</span>
        </div>
        <div class="text-xl font-bold" style="color: ${currentLevel.color};">
          ${progress.trustScore}/100
        </div>
      </div>

      <!-- Next step CTA -->
      ${nextLevel ? `
        <button
          onclick="openIdentityVerification()"
          class="w-full btn btn-primary"
        >
          <span class="mr-2">${nextLevel.icon}</span>
          Passer au niveau ${nextLevel.id} : ${nextLevel.name}
        </button>
      ` : `
        <div class="text-center p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
          <span class="text-lg mr-2"></span>
          <span class="text-purple-300 font-medium">Verification complete ! Tu es 100% verifie.</span>
        </div>
      `}
    </div>
  `;
}

/**
 * Get verification error messages
 * @param {string} errorCode - Error code
 * @param {string} lang - Language code
 * @returns {string} Error message
 */
export function getVerificationErrorMessage(errorCode, lang = 'fr') {
  const messages = {
    fr: {
      'not-logged-in': 'Tu dois etre connecte pour te verifier',
      'invalid-phone': 'Numero de telephone invalide',
      'code-expired': 'Le code a expire. Renvoie un nouveau code.',
      'invalid-code': 'Code incorrect. Verifie et reessaie.',
      'no-pending-verification': 'Aucune verification en attente',
      'invalid-image': 'Image invalide. Utilise une photo claire.',
      'upload-failed': 'Echec de l\'envoi. Reessaie.',
      'invalid-document-type': 'Type de document non accepte',
      'missing-photos': 'Les 3 photos sont requises (selfie, ID, selfie + ID)',
      'unknown': 'Une erreur est survenue. Reessaie plus tard.',
    },
    en: {
      'not-logged-in': 'You must be logged in to verify',
      'invalid-phone': 'Invalid phone number',
      'code-expired': 'Code expired. Request a new code.',
      'invalid-code': 'Incorrect code. Check and try again.',
      'no-pending-verification': 'No pending verification',
      'invalid-image': 'Invalid image. Use a clear photo.',
      'upload-failed': 'Upload failed. Try again.',
      'invalid-document-type': 'Document type not accepted',
      'missing-photos': 'All 3 photos required (selfie, ID, selfie + ID)',
      'unknown': 'An error occurred. Try again later.',
    },
  };

  return messages[lang]?.[errorCode] || messages.fr[errorCode] || messages.fr.unknown;
}

/**
 * Upload selfie + ID verification photos (3-step flow)
 * @param {Object} photos - Object with selfie, idCard, and selfieWithId base64 data
 * @returns {Promise<Object>} Result
 */
export async function uploadSelfieIdVerification(photos) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return { success: false, error: 'not-logged-in' };
    }

    // Validate all 3 photos are present
    if (!photos.selfie || !photos.idCard || !photos.selfieWithId) {
      return { success: false, error: 'missing-photos' };
    }

    // Validate image data format
    const isValidImage = (data) => data && data.startsWith('data:image');
    if (!isValidImage(photos.selfie) || !isValidImage(photos.idCard) || !isValidImage(photos.selfieWithId)) {
      return { success: false, error: 'invalid-image' };
    }

    // Store pending selfie + ID verification (in production, this goes to manual review)
    const timestamp = Date.now();
    setState({
      pendingSelfieIdVerification: {
        selfie: photos.selfie,
        idCard: photos.idCard,
        selfieWithId: photos.selfieWithId,
        uploadedAt: timestamp,
        status: 'pending_review',
      },
    });

    // Update to level 3 (submitted, pending review)
    await updateVerificationLevel(3);

    // Also save verification request to Firestore (without photos, just metadata)
    try {
      const { db } = await import('./firebase.js');
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'id_verifications'), {
        userId: user.uid,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        trustLevel: 3,
        hasPhotos: true,
      });
    } catch (error) {
      console.warn('Could not save ID verification to Firestore:', error);
    }

    // For demo purposes, auto-approve after 5 seconds
    setTimeout(async () => {
      await approveSelfieIdVerification();
    }, 5000);

    return { success: true, message: 'Photos envoyees pour verification. En attente de validation...' };
  } catch (error) {
    console.error('Selfie+ID upload error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Approve selfie + ID verification (admin function / auto in demo)
 * @returns {Promise<Object>} Result
 */
export async function approveSelfieIdVerification() {
  try {
    const state = getState();
    const pending = state.pendingSelfieIdVerification;

    if (!pending) {
      return { success: false, error: 'no-pending-verification' };
    }

    await updateVerificationLevel(4);

    setState({
      pendingSelfieIdVerification: null,
      selfieIdVerifiedAt: Date.now(),
    });

    // Update Firestore verification status to approved
    try {
      const user = getCurrentUser();
      if (user) {
        const { db } = await import('./firebase.js');
        const { collection, query, where, getDocs, updateDoc, doc } = await import('firebase/firestore');
        const q = query(
          collection(db, 'id_verifications'),
          where('userId', '==', user.uid),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = doc(db, 'id_verifications', snapshot.docs[0].id);
          await updateDoc(docRef, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            trustLevel: 4,
          });
        }
      }
    } catch (error) {
      console.warn('Could not update ID verification in Firestore:', error);
    }

    showToast('✅ Identite verifiee ! Tu as maintenant le badge vert.', 'success');

    return { success: true };
  } catch (error) {
    console.error('Selfie+ID approval error:', error);
    return { success: false, error: error.code || 'unknown' };
  }
}

/**
 * Get trust badge HTML for display on profile
 * @param {number} level - Trust level (0-5)
 * @returns {string} HTML string for badge
 */
export function getTrustBadge(level = null) {
  const state = getState();
  const currentLevel = level ?? (state.verificationLevel || 0);
  const levelInfo = verificationLevels[currentLevel];

  if (!levelInfo || currentLevel === 0) {
    return ''; // No badge for unverified
  }

  const badgeStyles = {
    1: 'bg-slate-500/20 border-slate-500 text-slate-300',
    2: 'bg-blue-500/20 border-blue-500 text-blue-300',
    3: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
    4: 'bg-green-500/20 border-green-500 text-green-300',
    5: 'bg-gradient-to-br from-yellow-400 to-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/50',
  };

  const badgeClass = badgeStyles[currentLevel] || badgeStyles[1];

  return `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 text-xs font-semibold ${badgeClass}"
      title="${levelInfo.name} - Score de confiance: ${levelInfo.trustScore}%"
      aria-label="${levelInfo.name}"
    >
      <span class="text-sm">${levelInfo.icon}</span>
      <span>${levelInfo.name}</span>
    </span>
  `;
}

export default {
  verificationLevels,
  verificationReasons,
  getVerificationLevel,
  getNextVerificationLevel,
  getVerificationProgress,
  isEmailVerified,
  isPhoneVerified,
  isPhotoVerified,
  isIdentityVerified,
  sendEmailVerification,
  sendPhoneVerification,
  confirmPhoneVerification,
  uploadVerificationPhoto,
  uploadIdentityDocument,
  uploadSelfieIdVerification,
  approveSelfieIdVerification,
  renderVerificationBadge,
  renderVerificationStatus,
  getVerificationErrorMessage,
  getTrustBadge,
};
