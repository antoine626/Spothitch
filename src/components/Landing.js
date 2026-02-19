/**
 * Landing Page — 5-slide Onboarding Carousel
 * Shown once for first-time visitors, dismissed forever via localStorage.
 * Slides: Imagine → Avant/Après → Témoignages → Sécurité → Communauté
 */

import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

export function renderLanding() {
  return `
    <div id="landing-page" class="fixed inset-0 z-[100] bg-dark-primary overflow-hidden">

      <!-- Carousel Track -->
      <div id="landing-track" class="flex h-full transition-transform duration-300 ease-out" style="width:500%">

        <!-- Slide 1: Imagine -->
        <div class="w-[20%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center relative" style="background:linear-gradient(180deg,rgba(10,22,40,0.9),#0f1520 40%)">
          <div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div class="absolute -top-32 -right-32 w-72 h-72 bg-primary-500/15 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div class="relative z-10 max-w-sm">
            <div class="text-xs font-semibold tracking-[3px] uppercase text-primary-400 mb-5">${t('onboardingImagine')}</div>
            <h2 class="text-[22px] font-light text-slate-200 leading-relaxed mb-6">
              ${t('onboardingImagineText')} <span class="text-primary-400 font-semibold">${t('onboardingImagineHighlight')}</span>
            </h2>
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5 text-left backdrop-blur-sm">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">${icon('smartphone', 'w-6 h-6 text-primary-400')}</span>
                <span class="text-sm font-semibold text-white">${t('onboardingYouOpen')}</span>
              </div>
              <div class="flex flex-col gap-2 pl-9">
                <div class="text-[13px] text-slate-400 flex items-center gap-2">${icon('map-pin', 'w-4 h-4 text-primary-400/70')} ${t('onboarding3Spots')}</div>
                <div class="text-[13px] text-slate-400 flex items-center gap-2">${icon('star', 'w-4 h-4 text-primary-400/70')} ${t('onboardingBestRated')}</div>
                <div class="text-[13px] text-slate-400 flex items-center gap-2">${icon('clock', 'w-4 h-4 text-primary-400/70')} ${t('onboardingAvgWait')}</div>
                <div class="text-[13px] text-slate-400 flex items-center gap-2">${icon('camera', 'w-4 h-4 text-primary-400/70')} ${t('onboardingPhotos')}</div>
                <div class="text-[13px] text-slate-400 flex items-center gap-2">${icon('shield', 'w-4 h-4 text-primary-400/70')} ${t('onboardingCompanionActive')}</div>
              </div>
            </div>
            <p class="text-sm text-slate-500 mt-5">${t('onboardingNeverAlone')}</p>
          </div>
        </div>

        <!-- Slide 2: Avant / Après -->
        <div class="w-[20%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center">
          <span class="text-4xl mb-4">⚡</span>
          <h2 class="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-white to-primary-400 bg-clip-text text-transparent">${t('onboardingDayNight')}</h2>
          <div class="flex gap-3 w-full max-w-sm mb-6">
            <div class="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <h3 class="text-sm font-semibold text-red-400 mb-3">❌ ${t('onboardingWithout')}</h3>
              <div class="flex flex-col gap-1.5">
                <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-300">${t('onboardingLost')}</span>
                <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-300">${t('onboardingNoInfo')}</span>
                <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-300">${t('onboardingAlone')}</span>
              </div>
            </div>
            <div class="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <h3 class="text-sm font-semibold text-green-400 mb-3">✅ ${t('onboardingWith')}</h3>
              <div class="flex flex-col gap-1.5">
                <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-500/20 text-green-300">${t('onboarding14kSpots')}</span>
                <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-500/20 text-green-300">${t('onboardingWaitTimes')}</span>
                <span class="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-green-500/20 text-green-300">${t('onboardingCommunity')}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-6 justify-center">
            <div class="text-center"><div class="text-2xl font-bold text-primary-400">137</div><div class="text-[11px] text-slate-500">${t('countries')}</div></div>
            <div class="text-center"><div class="text-2xl font-bold text-primary-400">14.6k</div><div class="text-[11px] text-slate-500">spots</div></div>
            <div class="text-center"><div class="text-2xl font-bold text-primary-400">100%</div><div class="text-[11px] text-slate-500">${t('onboardingFree')}</div></div>
          </div>
        </div>

        <!-- Slide 3: Témoignages -->
        <div class="w-[20%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7">
          <span class="text-4xl mb-3">💬</span>
          <h2 class="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-white to-primary-400 bg-clip-text text-transparent">${t('onboardingTheyTell')}</h2>
          <div class="w-full max-w-sm flex flex-col gap-3">
            <div class="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p class="text-[13px] text-slate-200 italic leading-relaxed mb-2">${t('onboardingTestimonialMarie')}</p>
              <p class="text-xs font-semibold text-primary-400">🇫🇷 Marie, Lyon</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p class="text-[13px] text-slate-200 italic leading-relaxed mb-2">${t('onboardingTestimonialTom')}</p>
              <p class="text-xs font-semibold text-primary-400">🇩🇪 Tom, Berlin</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p class="text-[13px] text-slate-200 italic leading-relaxed mb-2">${t('onboardingTestimonialLucia')}</p>
              <p class="text-xs font-semibold text-primary-400">🇪🇸 Lucía, Madrid</p>
            </div>
          </div>
        </div>

        <!-- Slide 4: Sécurité -->
        <div class="w-[20%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7 text-center">
          <div class="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/20 flex items-center justify-center text-5xl mb-6 animate-pulse">🛡️</div>
          <h2 class="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-primary-400 bg-clip-text text-transparent">${t('onboardingNeverAloneTitle')}</h2>
          <p class="text-sm text-slate-400 mb-6 max-w-xs">${t('onboardingCompanionDesc')}</p>
          <div class="w-full max-w-sm flex flex-col gap-3 text-left">
            <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
              <span class="text-lg">${icon('radio', 'w-5 h-5 text-emerald-400')}</span>
              <span class="text-[13px] text-slate-200">${t('onboardingGPSRealtime')}</span>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
              <span class="text-lg">${icon('check-circle', 'w-5 h-5 text-emerald-400')}</span>
              <span class="text-[13px] text-slate-200">${t('onboardingCheckins')}</span>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
              <span class="text-lg">${icon('alert-triangle', 'w-5 h-5 text-emerald-400')}</span>
              <span class="text-[13px] text-slate-200">${t('onboardingSOSAlerts')}</span>
            </div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-xl p-3 mt-4 max-w-sm">
            <p class="text-primary-400 font-semibold text-[13px] text-center">${t('onboardingFamilyTrack')}</p>
          </div>
        </div>

        <!-- Slide 5: Communauté + CTA -->
        <div class="w-[20%] h-full flex-shrink-0 flex flex-col items-center justify-center px-7">
          <span class="text-4xl mb-3">🌍</span>
          <h2 class="text-2xl font-bold text-white mb-5 bg-gradient-to-r from-white to-primary-400 bg-clip-text text-transparent">${t('onboardingJoinCommunity')}</h2>
          <div class="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm mb-6">
            <div class="flex gap-3 items-center py-2 border-b border-white/5">
              <div class="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold">J</div>
              <span class="text-[13px] text-slate-200"><strong>Julie</strong> ${t('onboardingFeedAdded')} <span class="text-primary-400">Bordeaux</span></span>
            </div>
            <div class="flex gap-3 items-center py-2 border-b border-white/5">
              <div class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">M</div>
              <span class="text-[13px] text-slate-200"><strong>Max</strong> ${t('onboardingFeedValidated')} — <span class="text-primary-400">⭐ 4.5</span></span>
            </div>
            <div class="flex gap-3 items-center py-2">
              <div class="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">S</div>
              <span class="text-[13px] text-slate-200"><strong>Sara</strong> ${t('onboardingFeedShared')} <span class="text-primary-400">Paris → Marseille</span></span>
            </div>
          </div>
          <button
            onclick="dismissLanding()"
            class="w-full max-w-sm py-4 rounded-2xl text-dark-primary font-bold text-lg shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-300"
            style="background:linear-gradient(135deg,#f59e0b,#d97706)"
          >
            ${t('onboardingDiscoverMap')} →
          </button>
        </div>

      </div>

      <!-- Controls: dots + next -->
      <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between px-7 pb-10 pt-4 z-10" style="background:linear-gradient(transparent,#0f1520)">
        <div id="landing-dots" class="flex gap-2">
          <div class="landing-dot w-6 h-2 rounded-full bg-primary-400 transition-all duration-200" data-i="0"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-all duration-200" data-i="1"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-all duration-200" data-i="2"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-all duration-200" data-i="3"></div>
          <div class="landing-dot w-2 h-2 rounded-full bg-white/20 transition-all duration-200" data-i="4"></div>
        </div>
        <button id="landing-next" onclick="landingNext()" class="text-primary-400 text-sm font-semibold">
          ${t('onboardingNext')} →
        </button>
      </div>

    </div>
  `
}

export function initLandingCarousel() {
  let current = 0
  const track = document.getElementById('landing-track')
  const dots = document.querySelectorAll('.landing-dot')
  const nextBtn = document.getElementById('landing-next')
  if (!track || !dots.length) return

  function goTo(i) {
    current = Math.max(0, Math.min(i, 4))
    track.style.transform = `translateX(-${current * 20}%)`
    dots.forEach((d, j) => {
      d.className = j === current
        ? 'landing-dot w-6 h-2 rounded-full bg-primary-400 transition-all duration-200'
        : 'landing-dot w-2 h-2 rounded-full bg-white/20 transition-all duration-200'
    })
    if (nextBtn) nextBtn.style.display = current === 4 ? 'none' : ''
  }

  // Dot clicks
  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)))

  // Next button
  window.landingNext = () => goTo(current + 1)

  // Touch swipe
  let tx = 0
  track.addEventListener('touchstart', e => { tx = e.touches[0].clientX }, { passive: true })
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1))
  })
}

export default { renderLanding, initLandingCarousel }
