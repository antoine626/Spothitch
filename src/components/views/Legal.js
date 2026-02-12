/**
 * Legal Pages Component
 * CGU, Privacy Policy, Legal Notice
 */

import { getState } from '../../stores/state.js';
import { t } from '../../i18n/index.js';

/**
 * Render legal page container
 */
export function renderLegalPage(page = 'cgu') {
  const content = {
    cgu: renderCGU(),
    privacy: renderPrivacyPolicy(),
    cookies: renderCookiePolicy(),
    legal: renderLegalNotice(),
  };

  const titles = {
    cgu: t('legalTerms') || "Conditions d'utilisation",
    privacy: t('legalPrivacy') || 'Politique de confidentialité',
    cookies: t('legalCookies') || 'Politique des cookies',
    legal: t('legalNotice') || 'Mentions légales',
  };

  return `
    <div class="legal-page pb-24">
      <!-- Header -->
      <div class="sticky top-0 bg-dark-primary/80 backdrop-blur-xl z-10 border-b border-white/10">
        <div class="flex items-center gap-3 p-4">
          <button onclick="changeTab('profile')" class="p-2 hover:bg-dark-secondary rounded-full">
            ←
          </button>
          <h1 class="text-lg font-bold text-white">
            ${titles[page] || titles.cgu}
          </h1>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-white/10 overflow-x-auto">
        <button onclick="showLegalPage('cgu')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'cgu' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}">
          ${t('legalTabTerms') || 'CGU'}
        </button>
        <button onclick="showLegalPage('privacy')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'privacy' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}">
          ${t('legalTabPrivacy') || 'Confidentialité'}
        </button>
        <button onclick="showLegalPage('cookies')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'cookies' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}">
          ${t('legalTabCookies') || 'Cookies'}
        </button>
        <button onclick="showLegalPage('legal')"
                class="flex-1 py-3 text-sm font-medium whitespace-nowrap px-2 ${page === 'legal' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-500'}">
          ${t('legalTabNotice') || 'Mentions'}
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 prose prose-invert prose-sm max-w-none">
        ${content[page] || content.cgu}
      </div>
    </div>
  `;
}

/**
 * Render CGU (Terms of Service)
 */
export function renderCGU() {
  return `
    <div class="legal-content">
      <h2>Conditions Générales d'Utilisation</h2>
      <p class="text-slate-400 text-sm">Dernière mise à jour : Décembre 2024</p>

      <h3>1. Objet</h3>
      <p>
        SpotHitch est une plateforme communautaire permettant aux autostoppeurs de partager
        et découvrir des spots d'auto-stop. Ces conditions régissent l'utilisation de l'application.
      </p>

      <h3>2. Acceptation des conditions</h3>
      <p>
        En utilisant SpotHitch, vous acceptez ces conditions. Si vous n'acceptez pas,
        veuillez ne pas utiliser l'application.
      </p>

      <h3>3. Description du service</h3>
      <p>SpotHitch propose :</p>
      <ul>
        <li>Une carte interactive des spots d'auto-stop</li>
        <li>Un système de notation et d'avis</li>
        <li>Un chat communautaire</li>
        <li>Un planificateur de voyage</li>
        <li>Un mode SOS pour les urgences</li>
      </ul>

      <h3>4. Inscription et compte</h3>
      <p>
        L'inscription est gratuite et optionnelle pour la consultation.
        Un compte est nécessaire pour contribuer (ajouter des spots, laisser des avis).
        Vous êtes responsable de la confidentialité de vos identifiants.
      </p>

      <h3>5. Règles de contribution</h3>
      <p>En contribuant, vous vous engagez à :</p>
      <ul>
        <li>Fournir des informations exactes et vérifiées</li>
        <li>Respecter les autres utilisateurs</li>
        <li>Ne pas publier de contenu illégal ou offensant</li>
        <li>Ne pas spammer ou abuser du service</li>
      </ul>

      <h3>6. Propriété intellectuelle</h3>
      <p>
        Les contributions des utilisateurs sont sous licence ouverte (ODBL).
        Le code source de l'application est sous licence MIT.
        Les données de spots proviennent en partie de Hitchwiki/Hitchmap (ODBL).
      </p>

      <h3>7. Responsabilité</h3>
      <p>
        SpotHitch fournit des informations à titre indicatif. L'auto-stop comporte des risques
        inhérents. Nous ne sommes pas responsables des incidents survenant lors de la pratique
        de l'auto-stop.
      </p>

      <h3>8. Données personnelles</h3>
      <p>
        Voir notre Politique de Confidentialité pour plus de détails sur la collecte
        et le traitement de vos données.
      </p>

      <h3>9. Modification des conditions</h3>
      <p>
        Nous nous réservons le droit de modifier ces conditions. Les utilisateurs seront
        informés des changements significatifs.
      </p>

      <h3>10. Contact</h3>
      <p>
        Pour toute question : contact@spothitch.app
      </p>
    </div>
  `;
}

/**
 * Render Privacy Policy
 */
export function renderPrivacyPolicy() {
  return `
    <div class="legal-content">
      <h2>Politique de Confidentialité</h2>
      <p class="text-slate-400 text-sm">Dernière mise à jour : Décembre 2024</p>

      <h3>1. Collecte des données</h3>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li><strong>Données de compte</strong> : email, nom d'utilisateur, avatar</li>
        <li><strong>Données de contribution</strong> : spots, avis, photos, messages</li>
        <li><strong>Données de localisation</strong> : uniquement avec votre consentement</li>
        <li><strong>Données techniques</strong> : logs, statistiques d'usage anonymisées</li>
      </ul>

      <h3>2. Utilisation des données</h3>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Fournir et améliorer le service</li>
        <li>Personnaliser votre expérience</li>
        <li>Assurer la sécurité de la plateforme</li>
        <li>Vous contacter si nécessaire</li>
      </ul>

      <h3>3. Stockage des données</h3>
      <p>
        Vos données sont stockées sur Firebase (Google Cloud) avec chiffrement.
        Certaines données sont stockées localement sur votre appareil (localStorage).
      </p>

      <h3>4. Partage des données</h3>
      <p>
        Nous ne vendons pas vos données. Vos contributions (spots, avis) sont publiques.
        Les données peuvent être partagées avec :
      </p>
      <ul>
        <li>Firebase/Google pour l'hébergement</li>
        <li>Sentry pour le monitoring des erreurs</li>
        <li>Les autorités en cas d'obligation légale</li>
      </ul>

      <h3>5. Vos droits (RGPD)</h3>
      <p>Vous avez le droit de :</p>
      <ul>
        <li>Accéder à vos données</li>
        <li>Rectifier vos données</li>
        <li>Supprimer votre compte et données</li>
        <li>Exporter vos données</li>
        <li>Retirer votre consentement</li>
      </ul>

      <h3>6. Cookies et stockage local</h3>
      <p>
        Nous utilisons le localStorage pour sauvegarder vos préférences et données hors-ligne.
        Aucun cookie tiers de tracking n'est utilisé.
      </p>

      <h3>7. Sécurité</h3>
      <p>
        Nous mettons en œuvre des mesures de sécurité : chiffrement HTTPS, authentification sécurisée,
        accès restreint aux données.
      </p>

      <h3>8. Conservation</h3>
      <p>
        Vos données sont conservées tant que votre compte est actif.
        Après suppression du compte, les données sont effacées sous 30 jours.
      </p>

      <h3>9. Contact DPO</h3>
      <p>
        Pour exercer vos droits ou poser des questions : privacy@spothitch.app
      </p>
    </div>
  `;
}

/**
 * Render Cookie Policy (detailed)
 */
export function renderCookiePolicy() {
  return `
    <div class="legal-content">
      <h2>Politique des Cookies</h2>
      <p class="text-slate-400 text-sm">Dernière mise à jour : Février 2026</p>

      <h3>1. Qu'est-ce qu'un cookie ?</h3>
      <p>
        Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web.
        Il permet au site de mémoriser vos actions et préférences (langue, préférences d'affichage, etc.)
        pendant une période déterminée.
      </p>

      <h3>2. Les cookies que nous utilisons</h3>

      <h4 class="text-sky-400 mt-4">🔒 Cookies strictement nécessaires</h4>
      <p>Ces cookies sont essentiels au fonctionnement de l'application :</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">Nom</th>
            <th class="text-left py-2">Finalité</th>
            <th class="text-left py-2">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_auth</code></td>
            <td class="py-2">Authentification utilisateur</td>
            <td class="py-2">Session</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_state</code></td>
            <td class="py-2">État de l'application (préférences)</td>
            <td class="py-2">1 an</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>cookie_consent</code></td>
            <td class="py-2">Mémoriser vos choix de cookies</td>
            <td class="py-2">1 an</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>consent_history</code></td>
            <td class="py-2">Historique des consentements (RGPD)</td>
            <td class="py-2">3 ans</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_offline</code></td>
            <td class="py-2">Données hors-ligne (spots, favoris)</td>
            <td class="py-2">30 jours</td>
          </tr>
        </tbody>
      </table>

      <h4 class="text-sky-400 mt-4">📊 Cookies analytiques (optionnels)</h4>
      <p>Ces cookies nous aident à comprendre comment vous utilisez l'application :</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">Nom</th>
            <th class="text-left py-2">Finalité</th>
            <th class="text-left py-2">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>_ga</code></td>
            <td class="py-2">Google Analytics - identification anonyme</td>
            <td class="py-2">2 ans</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>mp_*</code></td>
            <td class="py-2">Mixpanel - analyse d'usage (si activé)</td>
            <td class="py-2">1 an</td>
          </tr>
        </tbody>
      </table>

      <h4 class="text-sky-400 mt-4">🎯 Cookies de marketing (optionnels)</h4>
      <p>Ces cookies permettent d'afficher des contenus pertinents :</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">Nom</th>
            <th class="text-left py-2">Finalité</th>
            <th class="text-left py-2">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_ads</code></td>
            <td class="py-2">Partenariats voyage (non intrusifs)</td>
            <td class="py-2">6 mois</td>
          </tr>
        </tbody>
      </table>

      <h4 class="text-sky-400 mt-4">✨ Cookies de personnalisation (optionnels)</h4>
      <p>Ces cookies améliorent votre expérience :</p>
      <table class="w-full text-sm mt-2 mb-4">
        <thead>
          <tr class="border-b border-white/10">
            <th class="text-left py-2">Nom</th>
            <th class="text-left py-2">Finalité</th>
            <th class="text-left py-2">Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_lang</code></td>
            <td class="py-2">Langue préférée</td>
            <td class="py-2">1 an</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_theme</code></td>
            <td class="py-2">Thème (clair/sombre)</td>
            <td class="py-2">1 an</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2"><code>spothitch_recent</code></td>
            <td class="py-2">Spots récemment consultés</td>
            <td class="py-2">30 jours</td>
          </tr>
        </tbody>
      </table>

      <h3>3. Stockage local (localStorage)</h3>
      <p>
        En plus des cookies, nous utilisons le localStorage de votre navigateur pour stocker :
      </p>
      <ul>
        <li>Vos données de compte en cache</li>
        <li>La liste de vos spots favoris</li>
        <li>Votre historique de check-ins</li>
        <li>Les données pour le mode hors-ligne</li>
        <li>Vos préférences d'application</li>
      </ul>
      <p class="mt-2">
        Ces données restent sur votre appareil et ne sont jamais transmises à des tiers.
      </p>

      <h3>4. Comment gérer vos cookies ?</h3>

      <h4 class="text-sky-400 mt-4">Via notre application</h4>
      <p>
        Vous pouvez modifier vos préférences à tout moment dans
        <strong>Profil → Mes données → Préférences cookies</strong>.
      </p>

      <h4 class="text-sky-400 mt-4">Via votre navigateur</h4>
      <p>Vous pouvez également gérer les cookies via les paramètres de votre navigateur :</p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" class="text-sky-400">Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent" target="_blank" class="text-sky-400">Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" class="text-sky-400">Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/windows/supprimer-et-g%C3%A9rer-les-cookies" target="_blank" class="text-sky-400">Edge</a></li>
      </ul>

      <h3>5. Que se passe-t-il si vous refusez les cookies ?</h3>
      <p>
        <strong>Cookies nécessaires</strong> : Ils ne peuvent pas être désactivés car l'application
        ne fonctionnerait pas correctement sans eux.
      </p>
      <p>
        <strong>Cookies optionnels</strong> : Si vous les refusez :
      </p>
      <ul>
        <li>Analytiques : Nous ne pourrons pas améliorer l'application en fonction de l'usage réel</li>
        <li>Marketing : Aucune publicité ne sera affichée (c'est peut-être mieux !)</li>
        <li>Personnalisation : Vous devrez peut-être resélectionner vos préférences à chaque visite</li>
      </ul>

      <h3>6. Transfert de données</h3>
      <p>
        Certains cookies tiers (Google Analytics, si activé) peuvent transférer des données
        vers les États-Unis. Google adhère au EU-US Data Privacy Framework.
      </p>

      <h3>7. Mise à jour de cette politique</h3>
      <p>
        Cette politique peut être mise à jour. La date de dernière modification est indiquée en haut.
        En cas de changement significatif, vous serez informé via l'application.
      </p>

      <h3>8. Contact</h3>
      <p>
        Pour toute question sur les cookies : <a href="mailto:privacy@spothitch.app" class="text-sky-400">privacy@spothitch.app</a>
      </p>

      <!-- Bouton pour modifier les préférences -->
      <div class="mt-6 p-4 bg-dark-secondary rounded-lg text-center">
        <p class="text-sm text-slate-400 mb-3">${t('manageCookiePrefs') || 'Gérer vos préférences de cookies'}</p>
        <button onclick="showCookieCustomize()" class="btn bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded-lg">
          <i class="fas fa-cog mr-2"></i>
          ${t('modifyMyChoices') || 'Modifier mes choix'}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Legal Notice
 */
export function renderLegalNotice() {
  return `
    <div class="legal-content">
      <h2>Mentions Légales</h2>
      <p class="text-slate-400 text-sm">Dernière mise à jour : Décembre 2024</p>

      <h3>Éditeur</h3>
      <p>
        SpotHitch est un projet open source<br>
        Hébergement : GitHub Pages<br>
        Code source : <a href="https://github.com/antoine626/Spothitch" class="text-sky-400">GitHub</a>
      </p>

      <h3>Hébergement</h3>
      <p>
        GitHub, Inc.<br>
        88 Colin P Kelly Jr St<br>
        San Francisco, CA 94107<br>
        États-Unis
      </p>

      <h3>Services tiers</h3>
      <ul>
        <li><strong>Firebase</strong> (Google) - Base de données et authentification</li>
        <li><strong>OpenStreetMap</strong> - Cartographie (licence ODbL)</li>
        <li><strong>Hitchwiki/Hitchmap</strong> - Données de spots (licence ODbL)</li>
        <li><strong>OSRM</strong> - Calcul d'itinéraires</li>
        <li><strong>Nominatim</strong> - Géocodage</li>
      </ul>

      <h3>Crédits</h3>
      <ul>
        <li>Données cartographiques : © OpenStreetMap contributors</li>
        <li>Données de spots : Hitchwiki, Hitchmap (ODbL)</li>
        <li>Icônes : Heroicons, Emoji standard</li>
        <li>Photos : Unsplash (licence Unsplash)</li>
      </ul>

      <h3>Licence</h3>
      <p>
        L'application SpotHitch est sous licence MIT.<br>
        Les contributions utilisateurs sont sous licence ODbL.<br>
        Voir le fichier LICENSE pour plus de détails.
      </p>

      <h3>Contact</h3>
      <p>
        Email : contact@spothitch.app<br>
        GitHub Issues : <a href="https://github.com/antoine626/Spothitch/issues" class="text-sky-400">Signaler un problème</a>
      </p>
    </div>
  `;
}

export default {
  renderLegalPage,
  renderCGU,
  renderPrivacyPolicy,
  renderCookiePolicy,
  renderLegalNotice,
};
