/**
 * Landing Page Component
 * Marketing page shown to new users before sign-up
 * Highlights features, testimonials, and call-to-action
 */

import { t } from '../../i18n/index.js';

/**
 * Render the landing page for new visitors
 */
export function renderLanding(state) {
  const stats = {
    spots: 94,
    countries: 12,
    users: 1500,
    checkins: 5000
  };

  const features = [
    {
      icon: 'fa-map-marked-alt',
      title: 'Carte interactive',
      description: 'Trouvez les meilleurs spots d\'autostop pres de vous avec notre carte detaillee.',
      color: 'primary'
    },
    {
      icon: 'fa-users',
      title: 'Communaute active',
      description: 'Rejoignez des milliers d\'autostoppeurs qui partagent leurs experiences.',
      color: 'emerald'
    },
    {
      icon: 'fa-route',
      title: 'Planificateur de voyage',
      description: 'Planifiez vos itineraires et trouvez les spots sur votre route.',
      color: 'amber'
    },
    {
      icon: 'fa-trophy',
      title: 'Gamification',
      description: 'Gagnez des points, debloquez des badges et montez dans le classement.',
      color: 'purple'
    },
    {
      icon: 'fa-shield-alt',
      title: 'Mode SOS',
      description: 'Partagez votre position en cas d\'urgence avec vos contacts.',
      color: 'rose'
    },
    {
      icon: 'fa-mobile-alt',
      title: 'Application PWA',
      description: 'Installez l\'app sur votre telephone et utilisez-la hors-ligne.',
      color: 'sky'
    }
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      location: 'France',
      avatar: '🇫🇷',
      text: 'Grace a SpotHitch, j\'ai traverse l\'Europe en autostop ! Les spots sont precis et les conseils de la communaute sont precieux.',
      rating: 5
    },
    {
      name: 'Thomas K.',
      location: 'Allemagne',
      avatar: '🇩🇪',
      text: 'Die beste App fur Tramper! La carte est super pratique et le mode SOS m\'a rassure lors de mes premiers voyages.',
      rating: 5
    },
    {
      name: 'Elena S.',
      location: 'Espagne',
      avatar: '🇪🇸',
      text: 'J\'adore la gamification ! Ca motive vraiment a partager ses spots et a aider les autres autostoppeurs.',
      rating: 5
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Inscrivez-vous',
      description: 'Creez votre compte en 30 secondes',
      icon: 'fa-user-plus'
    },
    {
      step: 2,
      title: 'Explorez la carte',
      description: 'Trouvez les spots pres de vous',
      icon: 'fa-search-location'
    },
    {
      step: 3,
      title: 'Partagez vos spots',
      description: 'Aidez la communaute a grandir',
      icon: 'fa-share-alt'
    },
    {
      step: 4,
      title: 'Partez a l\'aventure',
      description: 'Voyagez en toute confiance',
      icon: 'fa-thumbs-up'
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
            <span class="text-8xl">🤙</span>
          </div>

          <h1 class="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            SpotHitch
          </h1>

          <p class="text-xl md:text-2xl text-slate-300 mb-4">
            La communaute des autostoppeurs
          </p>

          <p class="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Trouvez les meilleurs spots d'auto-stop dans le monde, partagez vos experiences
            et planifiez vos voyages avec la plus grande communaute de routards.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onclick="openAuth(); setAuthMode('register')"
              class="btn-primary text-lg px-8 py-4"
            >
              <i class="fas fa-rocket mr-2" aria-hidden="true"></i>
              Commencer gratuitement
            </button>
            <button
              onclick="skipWelcome()"
              class="btn-ghost text-lg px-8 py-4"
            >
              <i class="fas fa-map mr-2" aria-hidden="true"></i>
              Explorer la carte
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-primary-400">${stats.spots}+</div>
              <div class="text-sm text-slate-400">Spots verifies</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-emerald-400">${stats.countries}</div>
              <div class="text-sm text-slate-400">Pays couverts</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-amber-400">${stats.users}+</div>
              <div class="text-sm text-slate-400">Autostoppeurs</div>
            </div>
            <div class="text-center">
              <div class="text-3xl md:text-4xl font-bold text-purple-400">${stats.checkins}+</div>
              <div class="text-sm text-slate-400">Check-ins</div>
            </div>
          </div>

          <!-- Scroll indicator -->
          <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <i class="fas fa-chevron-down text-2xl text-slate-400"></i>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 px-4 bg-slate-800/50">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
            Tout ce dont tu as besoin
          </h2>
          <p class="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            SpotHitch reunit tous les outils essentiels pour l'autostoppeur moderne.
          </p>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${features.map(feature => `
              <div class="card p-6 hover:scale-105 transition-transform">
                <div class="w-14 h-14 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center mb-4">
                  <i class="fas ${feature.icon} text-2xl text-${feature.color}-400" aria-hidden="true"></i>
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
            Comment ca marche ?
          </h2>
          <p class="text-slate-400 text-center mb-12">
            En 4 etapes simples, vous etes pret a partir !
          </p>

          <div class="relative">
            <!-- Connection line -->
            <div class="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-emerald-500 to-amber-500 -translate-y-1/2 rounded-full"></div>

            <div class="grid md:grid-cols-4 gap-8">
              ${howItWorks.map(item => `
                <div class="relative text-center">
                  <div class="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                    <i class="fas ${item.icon} text-2xl text-white" aria-hidden="true"></i>
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
            Ils nous font confiance
          </h2>
          <p class="text-slate-400 text-center mb-12">
            Decouvrez ce que nos utilisateurs pensent de SpotHitch.
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
                  ${Array(testimonial.rating).fill('<i class="fas fa-star text-amber-400" aria-hidden="true"></i>').join('')}
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
                Une application pensee pour la route
              </h2>
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fas fa-check text-emerald-400" aria-hidden="true"></i>
                  </div>
                  <div>
                    <div class="font-semibold">Mode hors-ligne</div>
                    <div class="text-slate-400 text-sm">Consultez les spots sans connexion internet</div>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fas fa-check text-emerald-400" aria-hidden="true"></i>
                  </div>
                  <div>
                    <div class="font-semibold">GPS integre</div>
                    <div class="text-slate-400 text-sm">Naviguez vers les spots facilement</div>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fas fa-check text-emerald-400" aria-hidden="true"></i>
                  </div>
                  <div>
                    <div class="font-semibold">100% gratuit</div>
                    <div class="text-slate-400 text-sm">Aucun abonnement, aucune publicite intrusive</div>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="fas fa-check text-emerald-400" aria-hidden="true"></i>
                  </div>
                  <div>
                    <div class="font-semibold">Multilingue</div>
                    <div class="text-slate-400 text-sm">Disponible en francais, anglais, espagnol et allemand</div>
                  </div>
                </li>
              </ul>

              <button
                onclick="installPWA()"
                class="mt-8 btn-primary"
              >
                <i class="fas fa-download mr-2" aria-hidden="true"></i>
                Installer l'application
              </button>
            </div>

            <div class="relative">
              <div class="w-64 h-[500px] mx-auto rounded-[3rem] border-4 border-slate-600 bg-slate-800 overflow-hidden shadow-2xl">
                <div class="h-full bg-gradient-to-b from-slate-900 to-slate-800 p-4 flex flex-col">
                  <div class="text-center text-primary-400 font-bold text-lg mb-4">SpotHitch</div>
                  <div class="flex-1 rounded-2xl bg-emerald-900/30 flex items-center justify-center">
                    <i class="fas fa-map-marked-alt text-6xl text-emerald-400/50" aria-hidden="true"></i>
                  </div>
                  <div class="flex justify-around mt-4 pt-2 border-t border-slate-700">
                    <i class="fas fa-map text-primary-400" aria-hidden="true"></i>
                    <i class="fas fa-compass text-slate-500" aria-hidden="true"></i>
                    <i class="fas fa-trophy text-slate-500" aria-hidden="true"></i>
                    <i class="fas fa-comments text-slate-500" aria-hidden="true"></i>
                    <i class="fas fa-user text-slate-500" aria-hidden="true"></i>
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
            Pret a prendre la route ?
          </h2>
          <p class="text-xl text-slate-300 mb-8">
            Rejoignez la communaute SpotHitch et decouvrez l'autostop autrement.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onclick="openAuth(); setAuthMode('register')"
              class="btn-primary text-lg px-8 py-4"
            >
              <i class="fas fa-user-plus mr-2" aria-hidden="true"></i>
              Creer un compte gratuit
            </button>
            <button
              onclick="openAuth(); setAuthMode('login')"
              class="btn-ghost text-lg px-8 py-4"
            >
              <i class="fas fa-sign-in-alt mr-2" aria-hidden="true"></i>
              Se connecter
            </button>
          </div>

          <p class="mt-8 text-sm text-slate-400">
            En vous inscrivant, vous acceptez nos
            <a href="#" onclick="showLegalPage('cgu')" class="text-primary-400 hover:underline">CGU</a>
            et notre
            <a href="#" onclick="showLegalPage('privacy')" class="text-primary-400 hover:underline">Politique de confidentialite</a>.
          </p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-12 px-4 border-t border-slate-700">
        <div class="max-w-6xl mx-auto">
          <div class="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <span class="text-2xl">🤙</span>
                <span class="font-bold text-lg">SpotHitch</span>
              </div>
              <p class="text-slate-400 text-sm">
                La communaute des autostoppeurs. Trouvez, partagez et explorez les meilleurs spots du monde.
              </p>
            </div>

            <div>
              <h4 class="font-semibold mb-4">Application</h4>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li><a href="#" onclick="skipWelcome()" class="hover:text-white">Carte des spots</a></li>
                <li><a href="#" onclick="changeTab('travel')" class="hover:text-white">Planificateur</a></li>
                <li><a href="#" onclick="changeTab('challenges')" class="hover:text-white">Defis</a></li>
                <li><a href="#" onclick="changeTab('social')" class="hover:text-white">Communaute</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-4">Ressources</h4>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li><a href="#" onclick="openFAQ()" class="hover:text-white">FAQ</a></li>
                <li><a href="#" onclick="openHelpCenter()" class="hover:text-white">Centre d'aide</a></li>
                <li><a href="#" onclick="openChangelog()" class="hover:text-white">Changelog</a></li>
                <li><a href="#" onclick="openRoadmap()" class="hover:text-white">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold mb-4">Legal</h4>
              <ul class="space-y-2 text-slate-400 text-sm">
                <li><a href="#" onclick="showLegalPage('cgu')" class="hover:text-white">CGU</a></li>
                <li><a href="#" onclick="showLegalPage('privacy')" class="hover:text-white">Confidentialite</a></li>
                <li><a href="#" onclick="openContactForm()" class="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          <div class="pt-8 border-t border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-slate-500 text-sm">
              &copy; 2026 SpotHitch. Fait avec coeur pour les routards du monde entier.
            </p>
            <div class="flex gap-4">
              <a href="https://github.com/antoine626/Spothitch" target="_blank" rel="noopener" class="text-slate-400 hover:text-white">
                <i class="fab fa-github text-xl" aria-hidden="true"></i>
                <span class="sr-only">GitHub</span>
              </a>
              <a href="#" class="text-slate-400 hover:text-white">
                <i class="fab fa-twitter text-xl" aria-hidden="true"></i>
                <span class="sr-only">Twitter</span>
              </a>
              <a href="#" class="text-slate-400 hover:text-white">
                <i class="fab fa-instagram text-xl" aria-hidden="true"></i>
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
