/**
 * Landing Page Component
 * Marketing page shown to new users before sign-up
 * Highlights features, testimonials, and call-to-action
 */

import { t } from '../../i18n/index.js';
import { icon } from '../../utils/icons.js'

/**
 * Render the landing page for new visitors
 */
export function renderLanding(state) {
  const stats = {
    spots: 11000,
    countries: 137,
    users: 1500,
    checkins: 5000
  };

  const features = [
    {
      icon: 'map-pinned',
      title: t('landingFeatureMapTitle'),
      description: t('landingFeatureMapDesc'),
      color: 'primary'
    },
    {
      icon: 'users',
      title: t('landingFeatureCommunityTitle'),
      description: t('landingFeatureCommunityDesc'),
      color: 'emerald'
    },
    {
      icon: 'route',
      title: t('landingFeaturePlannerTitle'),
      description: t('landingFeaturePlannerDesc'),
      color: 'amber'
    },
    {
      icon: 'trophy',
      title: t('landingFeatureGamificationTitle'),
      description: t('landingFeatureGamificationDesc'),
      color: 'purple'
    },
    {
      icon: 'shield',
      title: t('landingFeatureSOSTitle'),
      description: t('landingFeatureSOSDesc'),
      color: 'rose'
    },
    {
      icon: 'smartphone',
      title: t('landingFeaturePWATitle'),
      description: t('landingFeaturePWADesc'),
      color: 'sky'
    }
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      location: t('landingTestimonialLocation1'),
      avatar: '\uD83C\uDDEB\uD83C\uDDF7',
      text: t('landingTestimonial1'),
      rating: 5
    },
    {
      name: 'Thomas K.',
      location: t('landingTestimonialLocation2'),
      avatar: '\uD83C\uDDE9\uD83C\uDDEA',
      text: t('landingTestimonial2'),
      rating: 5
    },
    {
      name: 'Elena S.',
      location: t('landingTestimonialLocation3'),
      avatar: '\uD83C\uDDEA\uD83C\uDDF8',
      text: t('landingTestimonial3'),
      rating: 5
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: t('landingStep1Title'),
      description: t('landingStep1Desc'),
      icon: 'user-plus'
    },
    {
      step: 2,
      title: t('landingStep2Title'),
      description: t('landingStep2Desc'),
      icon: 'search'
    },
    {
      step: 3,
      title: t('landingStep3Title'),
      description: t('landingStep3Desc'),
      icon: 'share-2'
    },
    {
      step: 4,
      title: t('landingStep4Title'),
      description: t('landingStep4Desc'),
      icon: 'thumbs-up'
    }
  ];

  return `
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="relative min-h-screen flex items-center justify-center overflow-hidden">
        <!-- Background -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900/50 to-slate-900"></div>
        <div class="absolute inset-0 opacity-30">
          <div class="absolute top-20 left-10 w-72 h-72 bg-primary-500/30 rounded-full blur-3xl"></div>
          <div class="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 text-center px-4 py-20 max-w-4xl mx-auto">
          <div class="mb-8 animate-bounce-slow">
            <span class="text-8xl">\uD83E\uDD19</span>
          </div>

          <h1 class="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            SpotHitch
          </h1>

          <p class="text-xl md:text-2xl text-slate-300 mb-4">
            ${t('tagline')}
          </p>

          <p class="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            ${t('landingHeroDesc')}
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onclick="openAuth(); setAuthMode('register')"
              class="btn-primary text-lg px-8 py-4"
            >
              ${icon('rocket', 'w-5 h-5 mr-2')}
              ${t('landingCtaStart')}
            </button>
            <button
              onclick="skipWelcome()"
              class="btn-ghost text-lg px-8 py-4"
            >
              ${icon('map', 'w-5 h-5 mr-2')}
              ${t('landingCtaExplore')}
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-primary-400">${stats.spots}+</div>
              <div class="text-sm text-slate-400">${t('landingStatsSpots')}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-emerald-400">${stats.countries}</div>
              <div class="text-sm text-slate-400">${t('landingStatsCountries')}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-amber-400">${stats.users}+</div>
              <div class="text-sm text-slate-400">${t('landingStatsUsers')}</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-purple-400">${stats.checkins}+</div>
              <div class="text-sm text-slate-400">Check-ins</div>
            </div>
          </div>

          <!-- Scroll indicator -->
          <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            ${icon('chevron-down', 'w-7 h-7 text-slate-400')}
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 px-4 bg-slate-800/50">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
            ${t('landingFeaturesHeading')}
          </h2>
          <p class="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            ${t('landingFeaturesSubheading')}
          </p>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${features.map(feature => `
              <div class="card p-6 hover:scale-105 transition-transform">
                <div class="w-14 h-14 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center mb-4">
                  ${icon(feature.icon, `w-7 h-7 text-${feature.color}-400`)}
                </div>
                <h3 class="text-xl font-semibold mb-2">${feature.title}</h3>
                <p class="text-slate-400">${feature.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- How it Works Section -->
      <section class="py-20 px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
            ${t('landingHowItWorks')}
          </h2>
          <p class="text-slate-400 text-center mb-12">
            ${t('landingHowItWorksDesc')}
          </p>

          <div class="relative">
            <!-- Connection line -->
            <div class="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-emerald-500 to-amber-500 -translate-y-1/2 rounded-full"></div>

            <div class="grid md:grid-cols-4 gap-8">
              ${howItWorks.map(item => `
                <div class="relative text-center">
                  <div class="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                    ${icon(item.icon, 'w-7 h-7 text-white')}
                  </div>
                  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 font-bold flex items-center justify-center text-sm shadow-lg z-20">
                    ${item.step}
                  </div>
                  <h3 class="font-semibold text-lg mb-2">${item.title}</h3>
                  <p class="text-slate-400 text-sm">${item.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section class="py-20 px-4 bg-slate-800/50">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
            ${t('landingTestimonialsHeading')}
          </h2>
          <p class="text-slate-400 text-center mb-12">
            ${t('landingTestimonialsSubheading')}
          </p>

          <div class="grid md:grid-cols-3 gap-6">
            ${testimonials.map(testimonial => `
              <div class="card p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                    ${testimonial.avatar}
                  </div>
                  <div>
                    <div class="font-semibold">${testimonial.name}</div>
                    <div class="text-sm text-slate-400">${testimonial.location}</div>
                  </div>
                </div>
                <div class="flex gap-1 mb-3">
                  ${Array(testimonial.rating).fill(icon('star', 'w-5 h-5 text-amber-400')).join('')}
                </div>
                <p class="text-slate-300 italic">"${testimonial.text}"</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- App Preview Section -->
      <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 class="text-3xl md:text-4xl font-bold mb-6">
                ${t('landingAppPreviewHeading')}
              </h2>
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    ${icon('check', 'w-5 h-5 text-emerald-400')}
                  </div>
                  <div>
                    <div class="font-semibold">${t('landingOfflineTitle')}</div>
                    <div class="text-slate-400 text-sm">${t('landingOfflineDesc')}</div>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    ${icon('check', 'w-5 h-5 text-emerald-400')}
                  </div>
                  <div>
                    <div class="font-semibold">${t('landingGPSTitle')}</div>
                    <div class="text-slate-400 text-sm">${t('landingGPSDesc')}</div>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    ${icon('check', 'w-5 h-5 text-emerald-400')}
                  </div>
                  <div>
                    <div class="font-semibold">${t('landingFreeTitle')}</div>
                    <div class="text-slate-400 text-sm">${t('landingFreeDesc')}</div>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    ${icon('check', 'w-5 h-5 text-emerald-400')}
                  </div>
                  <div>
                    <div class="font-semibold">${t('landingMultilingualTitle')}</div>
                    <div class="text-slate-400 text-sm">${t('landingMultilingualDesc')}</div>
                  </div>
                </li>
              </ul>

              <button
                onclick="installPWA()"
                class="mt-8 btn-primary"
              >
                ${icon('download', 'w-5 h-5 mr-2')}
                ${t('landingInstallApp')}
              </button>
            </div>

            <div class="relative">
              <div class="w-64 h-[500px] mx-auto rounded-[3rem] border-4 border-slate-600 bg-slate-800 overflow-hidden shadow-2xl">
                <div class="h-full bg-gradient-to-b from-slate-900 to-slate-800 p-4 flex flex-col">
                  <div class="text-center text-primary-400 font-bold text-lg mb-4">SpotHitch</div>
                  <div class="flex-1 rounded-2xl bg-emerald-900/30 flex items-center justify-center">
                    ${icon('map-pinned', 'w-5 h-5 text-6xl text-emerald-400/50')}
                  </div>
                  <div class="flex justify-around mt-4 pt-2 border-t border-slate-700">
                    ${icon('map', 'w-5 h-5 text-primary-400')}
                    ${icon('compass', 'w-5 h-5 text-slate-400')}
                    ${icon('trophy', 'w-5 h-5 text-slate-400')}
                    ${icon('messages-square', 'w-5 h-5 text-slate-400')}
                    ${icon('user', 'w-5 h-5 text-slate-400')}
                  </div>
                </div>
              </div>
              <!-- Decorative elements -->
              <div class="absolute -top-4 -right-4 w-20 h-20 bg-primary-500/30 rounded-full blur-xl"></div>
              <div class="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-500/30 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="py-20 px-4 bg-gradient-to-br from-primary-900/50 to-emerald-900/50">
        <div class="max-w-3xl mx-auto text-center">
          <h2 class="text-3xl md:text-4xl font-bold mb-6">
            ${t('landingCtaHeading')}
          </h2>
          <p class="text-xl text-slate-300 mb-8">
            ${t('landingCtaSubheading')}
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onclick="openAuth(); setAuthMode('register')"
              class="btn-primary text-lg px-8 py-4"
            >
              ${icon('user-plus', 'w-5 h-5 mr-2')}
              ${t('landingCtaCreateAccount')}
            </button>
            <button
              onclick="openAuth(); setAuthMode('login')"
              class="btn-ghost text-lg px-8 py-4"
            >
              ${icon('log-in', 'w-5 h-5 mr-2')}
              ${t('landingCtaLogin')}
            </button>
          </div>

          <p class="mt-8 text-sm text-slate-400">
            ${t('landingLegalNotice')}
            <a href="#" onclick="showLegalPage('cgu')" class="text-primary-400 hover:underline">${t('termsOfService')}</a>
            ${t('and')}
            <a href="#" onclick="showLegalPage('privacy')" class="text-primary-400 hover:underline">${t('privacyPolicy')}</a>.
          </p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 px-4 border-t border-slate-700">
        <div class="max-w-6xl mx-auto">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="text-2xl">\uD83E\uDD19</span>
                <span class="font-bold text-lg">SpotHitch</span>
              </div>
              <p class="text-slate-400 text-sm">
                ${t('landingFooterDesc')}
              </p>
            </div>

            <div>
              <h4 class="font-semibold mb-4">${t('landingFooterApp')}</h4>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li><a href="#" onclick="skipWelcome()" class="hover:text-white">${t('landingFooterSpotMap')}</a></li>
                <li><a href="#" onclick="changeTab('travel')" class="hover:text-white">${t('planner')}</a></li>
                <li><a href="#" onclick="changeTab('challenges')" class="hover:text-white">${t('landingFooterChallenges')}</a></li>
                <li><a href="#" onclick="changeTab('social')" class="hover:text-white">${t('landingFooterCommunity')}</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-4">${t('landingFooterResources')}</h4>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li><a href="#" onclick="openFAQ()" class="hover:text-white">FAQ</a></li>
                <li><a href="#" onclick="openHelpCenter()" class="hover:text-white">${t('landingFooterHelpCenter')}</a></li>
                <li><a href="#" onclick="openChangelog()" class="hover:text-white">Changelog</a></li>
                <li><a href="#" onclick="openRoadmap()" class="hover:text-white">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-4">${t('landingFooterLegal')}</h4>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li><a href="#" onclick="showLegalPage('cgu')" class="hover:text-white">${t('termsOfService')}</a></li>
                <li><a href="#" onclick="showLegalPage('privacy')" class="hover:text-white">${t('privacyPolicy')}</a></li>
                <li><a href="#" onclick="openContactForm()" class="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          <div class="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-slate-400 text-sm">
              &copy; 2026 SpotHitch. ${t('landingFooterCopyright')}
            </p>
            <div class="flex gap-4">
              <a href="https://github.com/antoine626/Spothitch" target="_blank" rel="noopener" class="text-slate-400 hover:text-white">
                ${icon('github', 'w-6 h-6')}
                <span class="sr-only">GitHub</span>
              </a>
              <a href="#" class="text-slate-400 hover:text-white">
                ${icon('twitter', 'w-6 h-6')}
                <span class="sr-only">Twitter</span>
              </a>
              <a href="#" class="text-slate-400 hover:text-white">
                ${icon('instagram', 'w-6 h-6')}
                <span class="sr-only">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;
}

export default { renderLanding };
