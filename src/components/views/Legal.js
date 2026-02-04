/**
 * Legal Pages Component
 * CGU, Privacy Policy, Legal Notice
 */

import { getState } from '../../stores/state.js';

/**
 * Render legal page container
 */
export function renderLegalPage(page = 'cgu') {
  const content = {
    cgu: renderCGU(),
    privacy: renderPrivacyPolicy(),
    legal: renderLegalNotice(),
  };

  return `
    <div class="legal-page pb-24">
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900/95 backdrop-blur z-10 border-b border-gray-700">
        <div class="flex items-center gap-3 p-4">
          <button onclick="changeTab('profile')" class="p-2 hover:bg-gray-800 rounded-full">
            ←
          </button>
          <h1 class="text-lg font-bold text-white">
            ${page === 'cgu' ? "Conditions d'utilisation" : page === 'privacy' ? 'Politique de confidentialité' : 'Mentions légales'}
          </h1>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-700">
        <button onclick="showLegalPage('cgu')"
                class="flex-1 py-3 text-sm font-medium ${page === 'cgu' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-500'}">
          CGU
        </button>
        <button onclick="showLegalPage('privacy')"
                class="flex-1 py-3 text-sm font-medium ${page === 'privacy' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-500'}">
          Confidentialité
        </button>
        <button onclick="showLegalPage('legal')"
                class="flex-1 py-3 text-sm font-medium ${page === 'legal' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-500'}">
          Mentions
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
      <p class="text-gray-400 text-sm">Dernière mise à jour : Décembre 2024</p>

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
      <p class="text-gray-400 text-sm">Dernière mise à jour : Décembre 2024</p>

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
 * Render Legal Notice
 */
export function renderLegalNotice() {
  return `
    <div class="legal-content">
      <h2>Mentions Légales</h2>
      <p class="text-gray-400 text-sm">Dernière mise à jour : Décembre 2024</p>

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
  renderLegalNotice,
};
