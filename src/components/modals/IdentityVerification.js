/**
 * Identity Verification Modal Component
 * Progressive verification system for building trust between hitchhikers
 * Levels: Email -> Phone -> Photo -> ID Document (Passport/Card)
 */

import { t } from '../../i18n/index.js';
import { getState, setState } from '../../stores/state.js';
import { icon } from '../../utils/icons.js'
import {
  verificationLevels,
  verificationReasons,
  getVerificationLevel,
  getNextVerificationLevel,
  getVerificationProgress,
  sendPhoneVerification,
  confirmPhoneVerification,
  uploadVerificationPhoto,
  uploadIdentityDocument,
  uploadSelfieIdVerification,
  getVerificationErrorMessage,
} from '../../services/identityVerification.js';

// State for verification modal
window.identityVerificationState = {
  currentStep: 'overview', // 'overview', 'email', 'phone', 'phone-code', 'photo', 'selfie-id'
  phoneNumber: '',
  verificationCode: '',
  photoPreview: null,
  documentType: 'id_card', // 'id_card' or 'passport'
  documentPreview: null,
  // Selfie + ID verification
  selfieIdStep: 1, // 1: selfie, 2: ID card, 3: selfie with ID
  selfiePhoto: null,
  idCardPhoto: null,
  selfieWithIdPhoto: null,
  isLoading: false,
  error: null,
};

/**
 * Render identity verification modal
 * @returns {string} HTML for identity verification modal
 */
export function renderIdentityVerification() {
  const state = getState();
  const lang = state.lang || 'fr';
  const progress = getVerificationProgress();
  const currentLevel = getVerificationLevel();
  const nextLevel = getNextVerificationLevel();
  const reasons = verificationReasons[lang] || verificationReasons.fr;
  const modalState = window.identityVerificationState;

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      id="identity-verification-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-verification-title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onclick="closeIdentityVerification()"
        aria-hidden="true"
      ></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close Button -->
        <button
          onclick="closeIdentityVerification()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="${t('close')}"
          type="button"
        >
          ${icon('x', 'w-5 h-5')}
        </button>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto max-h-[90vh]">
          ${modalState.currentStep === 'overview' ? renderOverviewStep(progress, currentLevel, nextLevel, reasons, lang) : ''}
          ${modalState.currentStep === 'phone' ? renderPhoneStep(lang) : ''}
          ${modalState.currentStep === 'phone-code' ? renderPhoneCodeStep(lang) : ''}
          ${modalState.currentStep === 'photo' ? renderPhotoStep(lang) : ''}
          ${modalState.currentStep === 'selfie-id' ? renderSelfieIdStep(lang) : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render overview step
 */
function renderOverviewStep(progress, currentLevel, nextLevel, reasons, lang) {
  return `
    <!-- Header -->
    <div class="p-6 text-center border-b border-white/10 bg-gradient-to-b from-purple-500/10 to-transparent">
      <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        ${icon('shield', 'w-8 h-8 text-white')}
      </div>
      <h2 id="identity-verification-title" class="text-2xl font-bold text-white mb-2">
        ${t('identityVerificationTitle')}
      </h2>
      <p class="text-slate-400">
        ${t('identityVerificationSubtitle')}
      </p>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-6">
      <!-- Current Level Badge -->
      <div class="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style="background: ${currentLevel.color}20;"
        >
          ${currentLevel.icon || icon('user', 'w-5 h-5')}
        </div>
        <div class="text-left">
          <div class="text-sm text-slate-400">${t('currentVerificationLevel')}</div>
          <div class="font-bold text-white">${lang === 'en' ? currentLevel.nameEn : currentLevel.name}</div>
        </div>
        <div class="ml-auto text-right">
          <div class="text-sm text-slate-400">${t('trustScore')}</div>
          <div class="text-xl font-bold" style="color: ${currentLevel.color};">${progress.trustScore}%</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-slate-400">${t('verificationProgress')}</span>
          <span class="text-white font-medium">${progress.currentLevel}/5</span>
        </div>
        <div class="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-colors duration-500"
            style="width: ${progress.progress}%; background: linear-gradient(90deg, #9ca3af, #3b82f6, #f59e0b, #10b981, #fbbf24);"
          ></div>
        </div>
      </div>

      <!-- Verification Steps -->
      <div class="space-y-3">
        ${renderVerificationStep(1, progress.verifications.email, t('emailVerified'), t('emailVerifiedDesc'), 'envelope', '#9ca3af', lang)}
        ${renderVerificationStep(2, progress.verifications.phone, t('phoneVerified'), t('phoneVerifiedDesc'), 'mobile-alt', '#3b82f6', lang)}
        ${renderVerificationStep(3, progress.verifications.selfieIdSubmitted, 'Selfie + ID soumis', 'Photos en attente de verification', 'hourglass-half', '#f59e0b', lang)}
        ${renderVerificationStep(4, progress.verifications.identityVerified, 'Identite verifiee', 'ID valide par moderateur', 'check-circle', '#10b981', lang)}
        ${renderVerificationStep(5, progress.verifications.trustedMember, 'Membre de confiance', 'Anciennete + activite elevee', 'star', '#fbbf24', lang)}
      </div>

      <!-- Why Verify Section -->
      <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h3 class="font-bold text-blue-300 mb-3 flex items-center gap-2">
          ${icon('info', 'w-5 h-5')}
          ${reasons.title}
        </h3>
        <ul class="space-y-2 text-sm text-slate-300">
          ${reasons.reasons.map(reason => `
            <li class="flex items-start gap-2">
              <span class="text-lg">${reason.icon}</span>
              <span><strong>${reason.title}</strong> - ${reason.description}</span>
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Privacy Note -->
      <div class="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        ${icon('lock', 'w-5 h-5 text-green-400 mt-1 shrink-0')}
        <p class="text-green-300 text-sm">
          ${reasons.privacyNote}
        </p>
      </div>

      <!-- Next Step Button -->
      ${nextLevel ? `
        <button
          onclick="startVerificationStep(${nextLevel.id})"
          class="w-full btn btn-primary py-4 text-lg"
          type="button"
        >
          <span class="mr-2">${nextLevel.icon || icon('arrow-right', 'w-5 h-5')}</span>
          ${t('startVerificationLevel')} ${nextLevel.id}: ${lang === 'en' ? nextLevel.nameEn : nextLevel.name}
        </button>
      ` : `
        <div class="text-center p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <span class="text-3xl mr-2">🎉</span>
          <span class="text-purple-300 font-bold">${t('verificationComplete')}</span>
        </div>
      `}
    </div>
  `;
}

/**
 * Render a verification step item
 */
function renderVerificationStep(level, isComplete, title, description, iconName, color, _lang) {
  const currentLevel = getVerificationProgress().currentLevel;
  const isActive = currentLevel === level - 1;
  const isPending = level > currentLevel + 1;

  return `
    <div
      class="flex items-center gap-4 p-4 rounded-xl border transition-colors ${isComplete ? 'bg-white/5 border-white/10' : isActive ? 'bg-white/10 border-primary-500/50 ring-2 ring-primary-500/30' : 'bg-white/5 border-white/5 opacity-50'}"
      role="listitem"
    >
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style="background: ${isComplete ? color : 'rgba(255,255,255,0.1)'}20;"
      >
        ${isComplete
          ? `<span style="color: ${color};">${icon('check', 'w-6 h-6')}</span>`
          : icon(iconName, `w-6 h-6 ${isPending ? 'text-slate-400' : 'text-white'}`)
        }
      </div>
      <div class="grow">
        <div class="flex items-center gap-2">
          <span class="font-medium text-white">${title}</span>
          ${isComplete ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium" style="background: ${color}20; color: ${color};">${t('verified')}</span>` : ''}
        </div>
        <div class="text-sm text-slate-400">${description}</div>
      </div>
      ${!isComplete && isActive ? `
        <button
          onclick="startVerificationStep(${level})"
          class="px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          type="button"
          aria-label="${t('startVerification')}"
        >
          ${t('start')}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Render phone verification step
 */
function renderPhoneStep(lang) {
  const modalState = window.identityVerificationState;

  return `
    <!-- Header -->
    <div class="p-6 text-center border-b border-white/10">
      <button
        onclick="setVerificationStep('overview')"
        class="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="${t('back')}"
        type="button"
      >
        ${icon('arrow-left', 'w-5 h-5')}
      </button>
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
        ${icon('smartphone', 'w-7 h-7 text-green-400')}
      </div>
      <h3 class="text-xl font-bold text-white">${t('phoneVerificationTitle')}</h3>
      <p class="text-slate-400 text-sm mt-2">${t('phoneVerificationDesc')}</p>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-4">
      ${modalState.error ? `
        <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
          ${icon('circle-alert', 'w-5 h-5 text-red-400 mt-1')}
          <p class="text-red-300 text-sm">${getVerificationErrorMessage(modalState.error, lang)}</p>
        </div>
      ` : ''}

      <div>
        <label for="phone-input" class="text-sm text-slate-400 block mb-2">
          ${t('phoneNumber')}
        </label>
        <div class="flex gap-2">
          <select
            id="country-code"
            class="input-modern w-24"
            onchange="updatePhoneCountryCode(this.value)"
          >
            <option value="+33">+33</option>
            <option value="+1">+1</option>
            <option value="+44">+44</option>
            <option value="+49">+49</option>
            <option value="+34">+34</option>
            <option value="+39">+39</option>
            <option value="+32">+32</option>
            <option value="+31">+31</option>
            <option value="+41">+41</option>
            <option value="+43">+43</option>
          </select>
          <input
            type="tel"
            id="phone-input"
            class="input-modern grow"
            placeholder="612345678"
            value="${modalState.phoneNumber || ''}"
            oninput="updatePhoneNumber(this.value)"
            aria-describedby="phone-hint"
          />
        </div>
        <span id="phone-hint" class="text-xs text-slate-400 mt-1 block">
          ${t('phoneHint')}
        </span>
      </div>

      <button
        onclick="sendPhoneVerificationCode()"
        class="w-full btn btn-primary py-3 ${modalState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
        type="button"
        ${modalState.isLoading ? 'disabled' : ''}
      >
        ${modalState.isLoading
          ? icon('loader-circle', 'w-5 h-5 animate-spin mr-2')
          : icon('send', 'w-5 h-5 mr-2')
        }
        ${t('sendVerificationCode')}
      </button>

      <!-- Benefits -->
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 class="font-medium text-white mb-2">${t('phoneVerificationBenefits')}</h4>
        <ul class="text-sm text-slate-400 space-y-1">
          <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${t('phoneBenefit1')}</li>
          <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${t('phoneBenefit2')}</li>
          <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${t('phoneBenefit3')}</li>
        </ul>
      </div>
    </div>
  `;
}

/**
 * Render phone code verification step
 */
function renderPhoneCodeStep(lang) {
  const modalState = window.identityVerificationState;

  return `
    <!-- Header -->
    <div class="p-6 text-center border-b border-white/10">
      <button
        onclick="setVerificationStep('phone')"
        class="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="${t('back')}"
        type="button"
      >
        ${icon('arrow-left', 'w-5 h-5')}
      </button>
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
        ${icon('message-square', 'w-7 h-7 text-green-400')}
      </div>
      <h3 class="text-xl font-bold text-white">${t('enterVerificationCode')}</h3>
      <p class="text-slate-400 text-sm mt-2">${t('codeSentTo')} <strong class="text-white">${modalState.phoneNumber}</strong></p>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-4">
      ${modalState.error ? `
        <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
          ${icon('circle-alert', 'w-5 h-5 text-red-400 mt-1')}
          <p class="text-red-300 text-sm">${getVerificationErrorMessage(modalState.error, lang)}</p>
        </div>
      ` : ''}

      <div>
        <label for="code-input" class="text-sm text-slate-400 block mb-2">
          ${t('verificationCode')}
        </label>
        <input
          type="text"
          id="code-input"
          class="input-modern w-full text-center text-2xl tracking-widest"
          placeholder="000000"
          maxlength="6"
          value="${modalState.verificationCode || ''}"
          oninput="updateVerificationCode(this.value)"
          autocomplete="one-time-code"
          aria-describedby="code-hint"
        />
        <span id="code-hint" class="text-xs text-slate-400 mt-1 block text-center">
          ${t('codeHint')}
        </span>
      </div>

      <button
        onclick="confirmPhoneCode()"
        class="w-full btn btn-primary py-3 ${modalState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
        type="button"
        ${modalState.isLoading ? 'disabled' : ''}
      >
        ${modalState.isLoading
          ? icon('loader-circle', 'w-5 h-5 animate-spin mr-2')
          : icon('check', 'w-5 h-5 mr-2')
        }
        ${t('verifyCode')}
      </button>

      <button
        onclick="resendPhoneCode()"
        class="w-full btn btn-ghost text-sm"
        type="button"
      >
        ${t('resendCode')}
      </button>

      <div class="text-center text-xs text-slate-400">
        ${icon('info', 'w-5 h-5 mr-1')}
        ${t('demoCodeHint')}
      </div>
    </div>
  `;
}

/**
 * Render photo verification step
 */
function renderPhotoStep(lang) {
  const modalState = window.identityVerificationState;

  return `
    <!-- Header -->
    <div class="p-6 text-center border-b border-white/10">
      <button
        onclick="setVerificationStep('overview')"
        class="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="${t('back')}"
        type="button"
      >
        ${icon('arrow-left', 'w-5 h-5')}
      </button>
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
        ${icon('camera', 'w-7 h-7 text-amber-400')}
      </div>
      <h3 class="text-xl font-bold text-white">${t('photoVerificationTitle')}</h3>
      <p class="text-slate-400 text-sm mt-2">${t('photoVerificationDesc')}</p>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-4">
      ${modalState.error ? `
        <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
          ${icon('circle-alert', 'w-5 h-5 text-red-400 mt-1')}
          <p class="text-red-300 text-sm">${getVerificationErrorMessage(modalState.error, lang)}</p>
        </div>
      ` : ''}

      <!-- Photo Preview/Upload -->
      <div class="relative">
        ${modalState.photoPreview ? `
          <div class="relative rounded-xl overflow-hidden">
            <img src="${modalState.photoPreview}" alt="Photo preview" class="w-full h-64 object-cover" loading="lazy" />
            <button
              onclick="clearPhotoPreview()"
              class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
              type="button"
              aria-label="${t('removePhoto')}"
            >
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>
        ` : `
          <label
            for="photo-input"
            class="block w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500/50 transition-colors flex flex-col items-center justify-center gap-4"
          >
            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              ${icon('camera', 'w-7 h-7 text-slate-400')}
            </div>
            <div class="text-center">
              <p class="text-white font-medium">${t('takeOrUploadPhoto')}</p>
              <p class="text-slate-400 text-sm">${t('photoRequirements')}</p>
            </div>
          </label>
          <input
            type="file"
            id="photo-input"
            class="hidden"
            accept="image/*"
            capture="user"
            onchange="handlePhotoUpload(event)"
          />
        `}
      </div>

      <!-- Photo Guidelines -->
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 class="font-medium text-white mb-2">${t('photoGuidelines')}</h4>
        <ul class="text-sm text-slate-400 space-y-1">
          <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${t('photoGuideline1')}</li>
          <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${t('photoGuideline2')}</li>
          <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${t('photoGuideline3')}</li>
          <li>${icon('x', 'w-5 h-5 text-red-400 mr-2')}${t('photoGuideline4')}</li>
        </ul>
      </div>

      ${modalState.photoPreview ? `
        <button
          onclick="submitPhotoVerification()"
          class="w-full btn btn-primary py-3 ${modalState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
          type="button"
          ${modalState.isLoading ? 'disabled' : ''}
        >
          ${modalState.isLoading
            ? icon('loader-circle', 'w-5 h-5 animate-spin mr-2')
            : icon('upload', 'w-5 h-5 mr-2')
          }
          ${t('submitPhoto')}
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Render selfie + ID verification step (3 photos)
 */
function renderSelfieIdStep(lang) {
  const modalState = window.identityVerificationState;
  const step = modalState.selfieIdStep;

  const stepInfo = {
    1: {
      title: 'Etape 1: Prends un selfie',
      titleEn: 'Step 1: Take a selfie',
      desc: 'Photo claire de ton visage, de face',
      descEn: 'Clear photo of your face, front view',
      icon: 'smile',
      color: 'blue',
      photo: modalState.selfiePhoto,
      inputId: 'selfie-input',
      captureMode: 'user',
    },
    2: {
      title: 'Etape 2: Photo de ta carte d\'identite',
      titleEn: 'Step 2: Photo of your ID card',
      desc: 'Recto de ta carte d\'identite (lisible)',
      descEn: 'Front of your ID card (readable)',
      icon: 'id-card',
      color: 'amber',
      photo: modalState.idCardPhoto,
      inputId: 'id-card-input',
      captureMode: 'environment',
    },
    3: {
      title: 'Etape 3: Selfie avec ta carte',
      titleEn: 'Step 3: Selfie with your card',
      desc: 'Tiens ta carte a cote de ton visage',
      descEn: 'Hold your card next to your face',
      icon: 'camera',
      color: 'green',
      photo: modalState.selfieWithIdPhoto,
      inputId: 'selfie-with-id-input',
      captureMode: 'user',
    },
  };

  const current = stepInfo[step];
  const allPhotosReady = modalState.selfiePhoto && modalState.idCardPhoto && modalState.selfieWithIdPhoto;

  return `
    <!-- Header -->
    <div class="p-6 text-center border-b border-white/10">
      <button
        onclick="${step === 1 ? 'setVerificationStep(\'overview\')' : 'goToPreviousSelfieIdStep()'}"
        class="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="${t('back')}"
        type="button"
      >
        ${icon('arrow-left', 'w-5 h-5')}
      </button>
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-${current.color}-500/20 flex items-center justify-center">
        ${icon(current.icon, `w-7 h-7 text-${current.color}-400`)}
      </div>
      <h3 class="text-xl font-bold text-white">${lang === 'en' ? current.titleEn : current.title}</h3>
      <p class="text-slate-400 text-sm mt-2">${lang === 'en' ? current.descEn : current.desc}</p>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-4">
      ${modalState.error ? `
        <div class="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl" role="alert">
          ${icon('circle-alert', 'w-5 h-5 text-red-400 mt-1')}
          <p class="text-red-300 text-sm">${getVerificationErrorMessage(modalState.error, lang)}</p>
        </div>
      ` : ''}

      <!-- Progress Steps -->
      <div class="flex items-center justify-center gap-3 mb-6">
        ${[1, 2, 3].map(s => `
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s === step ? 'bg-primary-500 text-white' : s < step || stepInfo[s].photo ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-400'}">
              ${stepInfo[s].photo ? icon('check', 'w-5 h-5') : s}
            </div>
            ${s < 3 ? '<div class="w-8 h-0.5 bg-white/20"></div>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Photo Preview/Upload -->
      <div class="relative">
        ${current.photo ? `
          <div class="relative rounded-xl overflow-hidden">
            <img src="${current.photo}" alt="${current.title}" class="w-full h-64 object-cover" loading="lazy" />
            <button
              onclick="clearSelfieIdPhoto(${step})"
              class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
              type="button"
              aria-label="${t('removePhoto')}"
            >
              ${icon('x', 'w-5 h-5')}
            </button>
          </div>
        ` : `
          <label
            for="${current.inputId}"
            class="block w-full h-64 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500/50 transition-colors flex flex-col items-center justify-center gap-4"
          >
            <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              ${icon(current.icon, 'w-7 h-7 text-slate-400')}
            </div>
            <div class="text-center px-4">
              <p class="text-white font-medium">${lang === 'en' ? 'Take or upload photo' : 'Prendre ou telecharger une photo'}</p>
              <p class="text-slate-400 text-sm">${lang === 'en' ? current.descEn : current.desc}</p>
            </div>
          </label>
          <input
            type="file"
            id="${current.inputId}"
            class="hidden"
            accept="image/*"
            capture="${current.captureMode}"
            onchange="handleSelfieIdPhotoUpload(event, ${step})"
          />
        `}
      </div>

      <!-- Guidelines -->
      <div class="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 class="font-medium text-white mb-2 flex items-center gap-2">
          ${icon('lightbulb', 'w-5 h-5 text-amber-400')}
          ${lang === 'en' ? 'Tips' : 'Conseils'}
        </h4>
        <ul class="text-sm text-slate-400 space-y-1">
          ${step === 1 ? `
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'Good lighting' : 'Bon eclairage'}</li>
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'Face clearly visible' : 'Visage bien visible'}</li>
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'No glasses or hat' : 'Sans lunettes ni chapeau'}</li>
          ` : step === 2 ? `
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'All text readable' : 'Texte lisible'}</li>
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'No glare or blur' : 'Sans reflet ni flou'}</li>
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'Front side only' : 'Recto uniquement'}</li>
          ` : `
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'Hold card next to face' : 'Carte a cote du visage'}</li>
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'Both face and card visible' : 'Visage et carte visibles'}</li>
            <li>${icon('check', 'w-5 h-5 text-green-400 mr-2')}${lang === 'en' ? 'Good focus' : 'Bonne mise au point'}</li>
          `}
        </ul>
      </div>

      <!-- Privacy Notice -->
      <div class="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        ${icon('lock', 'w-5 h-5 text-green-400 mt-1 shrink-0')}
        <p class="text-green-300 text-sm">
          ${lang === 'en' ? 'Your photos are encrypted and only seen by moderators. They are deleted after verification.' : 'Tes photos sont chiffrees et vues uniquement par les moderateurs. Elles sont supprimees apres verification.'}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2">
        ${current.photo ? `
          ${step < 3 ? `
            <button
              onclick="goToNextSelfieIdStep()"
              class="w-full btn btn-primary py-3"
              type="button"
            >
              ${icon('arrow-right', 'w-5 h-5 mr-2')}
              ${lang === 'en' ? 'Next step' : 'Etape suivante'}
            </button>
          ` : allPhotosReady ? `
            <button
              onclick="submitSelfieIdVerification()"
              class="w-full btn btn-primary py-3 ${modalState.isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
              type="button"
              ${modalState.isLoading ? 'disabled' : ''}
            >
              ${modalState.isLoading
                ? icon('loader-circle', 'w-5 h-5 animate-spin mr-2')
                : icon('send', 'w-5 h-5 mr-2')
              }
              ${lang === 'en' ? 'Submit for verification' : 'Envoyer pour verification'}
            </button>
          ` : ''}
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render verification badge for profile display
 * @param {number} level - Verification level
 * @param {string} size - Badge size ('sm', 'md', 'lg')
 * @returns {string} HTML for badge
 */
export function renderVerificationBadgeUI(level = null, size = 'md') {
  const state = getState();
  const currentLevel = level ?? (state.verificationLevel || 0);
  const levelInfo = verificationLevels[currentLevel];

  if (!levelInfo || currentLevel === 0) return '';

  const sizes = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base',
  };

  const sizeClass = sizes[size] || sizes.md;

  return `
    <span
      class="inline-flex items-center justify-center rounded-full ${sizeClass}"
      style="background: ${levelInfo.color}30; border: 2px solid ${levelInfo.color};"
      title="${levelInfo.name}"
      aria-label="${levelInfo.name}"
    >
      <span style="color: ${levelInfo.color};">${icon('shield', 'w-4 h-4')}</span>
    </span>
  `;
}

// ==================== WINDOW HANDLERS ====================

/**
 * Open identity verification modal
 */
window.openIdentityVerification = () => {
  window.identityVerificationState = {
    currentStep: 'overview',
    phoneNumber: '',
    verificationCode: '',
    photoPreview: null,
    documentType: 'id_card',
    documentPreview: null,
    selfieIdStep: 1,
    selfiePhoto: null,
    idCardPhoto: null,
    selfieWithIdPhoto: null,
    isLoading: false,
    error: null,
  };
  setState({ showIdentityVerification: true });
};

/**
 * Close identity verification modal
 */
window.closeIdentityVerification = () => {
  setState({ showIdentityVerification: false });
};

/**
 * Set verification step
 */
window.setVerificationStep = (step) => {
  window.identityVerificationState.currentStep = step;
  window.identityVerificationState.error = null;
  rerenderModal();
};

/**
 * Start verification for a specific level
 */
window.startVerificationStep = (level) => {
  const stepMap = {
    1: 'overview', // Email is handled separately
    2: 'phone',
    3: 'photo',
    4: 'selfie-id', // New: Selfie + ID 3-step flow
    5: 'overview', // Level 5 is automatic (trusted member)
  };
  window.identityVerificationState.currentStep = stepMap[level] || 'overview';
  window.identityVerificationState.error = null;
  // Reset selfie-id state when starting fresh
  if (level === 4) {
    window.identityVerificationState.selfieIdStep = 1;
    window.identityVerificationState.selfiePhoto = null;
    window.identityVerificationState.idCardPhoto = null;
    window.identityVerificationState.selfieWithIdPhoto = null;
  }
  rerenderModal();
};

/**
 * Update phone number
 */
window.updatePhoneNumber = (value) => {
  window.identityVerificationState.phoneNumber = value.replace(/[^\d]/g, '');
};

/**
 * Update phone country code
 */
window.updatePhoneCountryCode = (_code) => {
  // Store country code separately if needed
};

/**
 * Send phone verification code
 */
window.sendPhoneVerificationCode = async () => {
  const state = window.identityVerificationState;
  const countryCode = document.getElementById('country-code')?.value || '+33';
  const fullPhone = `${countryCode}${state.phoneNumber}`;

  state.isLoading = true;
  state.error = null;
  rerenderModal();

  const result = await sendPhoneVerification(fullPhone);

  state.isLoading = false;

  if (result.success) {
    state.phoneNumber = fullPhone;
    state.currentStep = 'phone-code';
  } else {
    state.error = result.error;
  }

  rerenderModal();
};

/**
 * Update verification code
 */
window.updateVerificationCode = (value) => {
  window.identityVerificationState.verificationCode = value.replace(/[^\d]/g, '').substring(0, 6);
};

/**
 * Confirm phone verification code
 */
window.confirmPhoneCode = async () => {
  const state = window.identityVerificationState;

  state.isLoading = true;
  state.error = null;
  rerenderModal();

  const result = await confirmPhoneVerification(state.verificationCode);

  state.isLoading = false;

  if (result.success) {
    state.currentStep = 'overview';
    const { showToast } = await import('../../services/notifications.js');
    showToast(t('phoneVerifiedSuccess'), 'success');
  } else {
    state.error = result.error;
  }

  rerenderModal();
};

/**
 * Resend phone verification code
 */
window.resendPhoneCode = async () => {
  const state = window.identityVerificationState;
  await sendPhoneVerification(state.phoneNumber);
  const { showToast } = await import('../../services/notifications.js');
  showToast(t('codeSentAgain'), 'success');
};

/**
 * Handle photo upload
 */
window.handlePhotoUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    window.identityVerificationState.photoPreview = e.target.result;
    rerenderModal();
  };
  reader.readAsDataURL(file);
};

/**
 * Clear photo preview
 */
window.clearPhotoPreview = () => {
  window.identityVerificationState.photoPreview = null;
  rerenderModal();
};

/**
 * Submit photo verification
 */
window.submitPhotoVerification = async () => {
  const state = window.identityVerificationState;

  if (!state.photoPreview) return;

  state.isLoading = true;
  state.error = null;
  rerenderModal();

  const result = await uploadVerificationPhoto(state.photoPreview);

  state.isLoading = false;

  if (result.success) {
    state.currentStep = 'overview';
    state.photoPreview = null;
    const { showToast } = await import('../../services/notifications.js');
    showToast(t('photoSubmitted'), 'success');
  } else {
    state.error = result.error;
  }

  rerenderModal();
};

/**
 * Set document type
 */
window.setDocumentType = (type) => {
  window.identityVerificationState.documentType = type;
  rerenderModal();
};

/**
 * Handle document upload
 */
window.handleDocumentUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    window.identityVerificationState.documentPreview = e.target.result;
    rerenderModal();
  };
  reader.readAsDataURL(file);
};

/**
 * Clear document preview
 */
window.clearDocumentPreview = () => {
  window.identityVerificationState.documentPreview = null;
  rerenderModal();
};

/**
 * Submit identity document
 */
window.submitIdentityDocument = async () => {
  const state = window.identityVerificationState;

  if (!state.documentPreview) return;

  state.isLoading = true;
  state.error = null;
  rerenderModal();

  const result = await uploadIdentityDocument(state.documentPreview, state.documentType);

  state.isLoading = false;

  if (result.success) {
    state.currentStep = 'overview';
    state.documentPreview = null;
    const { showToast } = await import('../../services/notifications.js');
    showToast(t('documentSubmitted'), 'success');
  } else {
    state.error = result.error;
  }

  rerenderModal();
};

/**
 * Handle selfie + ID photo upload
 */
window.handleSelfieIdPhotoUpload = (event, step) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const state = window.identityVerificationState;
    if (step === 1) {
      state.selfiePhoto = e.target.result;
    } else if (step === 2) {
      state.idCardPhoto = e.target.result;
    } else if (step === 3) {
      state.selfieWithIdPhoto = e.target.result;
    }
    rerenderModal();
  };
  reader.readAsDataURL(file);
};

/**
 * Clear selfie + ID photo
 */
window.clearSelfieIdPhoto = (step) => {
  const state = window.identityVerificationState;
  if (step === 1) {
    state.selfiePhoto = null;
  } else if (step === 2) {
    state.idCardPhoto = null;
  } else if (step === 3) {
    state.selfieWithIdPhoto = null;
  }
  rerenderModal();
};

/**
 * Go to next selfie + ID step
 */
window.goToNextSelfieIdStep = () => {
  const state = window.identityVerificationState;
  if (state.selfieIdStep < 3) {
    state.selfieIdStep++;
    state.error = null;
    rerenderModal();
  }
};

/**
 * Go to previous selfie + ID step
 */
window.goToPreviousSelfieIdStep = () => {
  const state = window.identityVerificationState;
  if (state.selfieIdStep > 1) {
    state.selfieIdStep--;
    state.error = null;
    rerenderModal();
  }
};

/**
 * Submit selfie + ID verification
 */
window.submitSelfieIdVerification = async () => {
  const state = window.identityVerificationState;

  if (!state.selfiePhoto || !state.idCardPhoto || !state.selfieWithIdPhoto) {
    state.error = 'missing-photos';
    rerenderModal();
    return;
  }

  state.isLoading = true;
  state.error = null;
  rerenderModal();

  const result = await uploadSelfieIdVerification({
    selfie: state.selfiePhoto,
    idCard: state.idCardPhoto,
    selfieWithId: state.selfieWithIdPhoto,
  });

  state.isLoading = false;

  if (result.success) {
    state.currentStep = 'overview';
    state.selfieIdStep = 1;
    state.selfiePhoto = null;
    state.idCardPhoto = null;
    state.selfieWithIdPhoto = null;
    const { showToast } = await import('../../services/notifications.js');
    showToast(t('selfieIdSubmitted'), 'success');
  } else {
    state.error = result.error;
  }

  rerenderModal();
};

/**
 * Re-render the modal
 */
function rerenderModal() {
  const container = document.getElementById('identity-verification-modal');
  if (container) {
    const parent = container.parentElement;
    if (parent) {
      parent.innerHTML = renderIdentityVerification();
    }
  }
}

export default {
  renderIdentityVerification,
  renderVerificationBadgeUI,
};
