/**
 * Help Center Service
 * Comprehensive help documentation system with articles, search, and categories
 * Categories: getting-started, spots, social, gamification, account, troubleshooting
 */

import { Storage } from '../utils/storage.js'

// Storage key for article view tracking
const VIEWS_STORAGE_KEY = 'help_article_views'

/**
 * Help article categories
 */
export const HELP_CATEGORIES = {
  'getting-started': {
    id: 'getting-started',
    title: 'Premiers pas',
    titleEn: 'Getting Started',
    icon: 'fa-rocket',
    color: 'primary',
    description: 'Decouvrez comment utiliser SpotHitch'
  },
  spots: {
    id: 'spots',
    title: 'Spots',
    titleEn: 'Spots',
    icon: 'fa-map-marker-alt',
    color: 'emerald',
    description: 'Trouver et partager des spots'
  },
  social: {
    id: 'social',
    title: 'Social',
    titleEn: 'Social',
    icon: 'fa-users',
    color: 'purple',
    description: 'Communaute et interactions'
  },
  gamification: {
    id: 'gamification',
    title: 'Gamification',
    titleEn: 'Gamification',
    icon: 'fa-trophy',
    color: 'amber',
    description: 'Points, badges et classements'
  },
  account: {
    id: 'account',
    title: 'Compte',
    titleEn: 'Account',
    icon: 'fa-user-cog',
    color: 'sky',
    description: 'Gestion de votre compte'
  },
  troubleshooting: {
    id: 'troubleshooting',
    title: 'Depannage',
    titleEn: 'Troubleshooting',
    icon: 'fa-wrench',
    color: 'rose',
    description: 'Resoudre les problemes courants'
  }
}

/**
 * Help articles database
 * Each article has: id, category, title, content (markdown), tags, views
 */
export const HELP_ARTICLES = [
  // ================= GETTING STARTED =================
  {
    id: 'gs-welcome',
    category: 'getting-started',
    title: 'Bienvenue sur SpotHitch',
    titleEn: 'Welcome to SpotHitch',
    content: `# Bienvenue sur SpotHitch

SpotHitch est la communaute des autostoppeurs. Notre application vous aide a trouver les meilleurs spots d'auto-stop dans le monde.

## Qu'est-ce que SpotHitch ?

- **+500 spots** verifies dans 40+ pays
- **+1500 autostoppeurs** actifs dans la communaute
- **Gratuit** et sans publicite intrusive

## Vos premiers pas

1. Explorez la carte pour decouvrir les spots
2. Creez un compte pour sauvegarder vos favoris
3. Faites des check-ins pour aider la communaute
4. Gagnez des points et debloquez des badges

Bienvenue dans l'aventure !`,
    tags: ['debut', 'introduction', 'bienvenue', 'nouveau'],
    views: 1250
  },
  {
    id: 'gs-create-account',
    category: 'getting-started',
    title: 'Creer un compte',
    titleEn: 'Create an account',
    content: `# Creer un compte SpotHitch

## Methodes d'inscription

### Email et mot de passe
1. Cliquez sur "Se connecter"
2. Selectionnez "Creer un compte"
3. Entrez votre email et un mot de passe securise
4. Verifiez votre email

### Connexion Google
1. Cliquez sur "Se connecter"
2. Selectionnez "Continuer avec Google"
3. Autorisez SpotHitch

## Avantages d'un compte

- Sauvegarder vos spots favoris
- Faire des check-ins
- Laisser des avis
- Participer aux defis
- Acceder au chat communautaire`,
    tags: ['compte', 'inscription', 'email', 'google', 'connexion'],
    views: 980
  },
  {
    id: 'gs-navigation',
    category: 'getting-started',
    title: 'Naviguer dans l\'application',
    titleEn: 'Navigate the app',
    content: `# Navigation dans SpotHitch

## Menu principal

La barre de navigation en bas vous donne acces a :

- **Carte** : Voir tous les spots sur la carte
- **Spots** : Liste des spots avec filtres
- **Chat** : Discuter avec la communaute
- **Profil** : Vos statistiques et reglages

## Actions rapides

- **+** : Ajouter un nouveau spot
- **SOS** : Mode urgence (bouton rouge)
- **Recherche** : Trouver un spot ou une ville

## Gestes tactiles

- Glissez vers la gauche/droite pour changer d'onglet
- Pincez pour zoomer sur la carte
- Appuyez longuement sur un spot pour voir les details`,
    tags: ['navigation', 'menu', 'interface', 'gestes'],
    views: 756
  },
  {
    id: 'gs-pwa-install',
    category: 'getting-started',
    title: 'Installer l\'application',
    titleEn: 'Install the app',
    content: `# Installer SpotHitch sur votre telephone

SpotHitch est une PWA (Progressive Web App) qui fonctionne comme une application native.

## Sur Android (Chrome)

1. Ouvrez spothitch.app dans Chrome
2. Appuyez sur les 3 points en haut a droite
3. Selectionnez "Ajouter a l'ecran d'accueil"
4. Confirmez

## Sur iPhone/iPad (Safari)

1. Ouvrez spothitch.app dans Safari
2. Appuyez sur l'icone de partage
3. Selectionnez "Sur l'ecran d'accueil"
4. Confirmez

## Avantages

- Fonctionne hors-ligne
- Notifications push
- Acces rapide depuis l'ecran d'accueil
- Mise a jour automatique`,
    tags: ['installation', 'pwa', 'android', 'iphone', 'mobile'],
    views: 1120
  },
  {
    id: 'gs-first-checkin',
    category: 'getting-started',
    title: 'Faire votre premier check-in',
    titleEn: 'Make your first check-in',
    content: `# Votre premier check-in

Un check-in confirme que vous etes passe par un spot. C'est essentiel pour maintenir les donnees a jour !

## Comment faire un check-in ?

1. Ouvrez la fiche d'un spot
2. Cliquez sur le bouton "Check-in"
3. (Optionnel) Ajoutez un commentaire
4. Validez

## Conditions

- Vous devez etre connecte
- Un seul check-in par spot par jour
- Les check-ins proches de votre position sont plus valorises

## Recompenses

- **+10 points** par check-in
- **Badges** pour les series de check-ins
- **Contribution** a la fraicheur des donnees`,
    tags: ['checkin', 'check-in', 'points', 'premier'],
    views: 890
  },

  // ================= SPOTS =================
  {
    id: 'spots-find',
    category: 'spots',
    title: 'Trouver un spot',
    titleEn: 'Find a spot',
    content: `# Trouver un spot d'auto-stop

## Sur la carte

1. Activez la geolocalisation
2. Les spots proches apparaissent automatiquement
3. Zoomez pour voir plus de details
4. Cliquez sur un marqueur pour voir les infos

## Par recherche

1. Utilisez la barre de recherche
2. Entrez une ville ou un lieu
3. Les spots correspondants s'affichent

## Filtres disponibles

- **Note** : Afficher seulement les spots 4+ etoiles
- **Distance** : Spots a moins de X km
- **Type** : Entree/sortie de ville, autoroute, etc.
- **Fraicheur** : Check-ins recents uniquement`,
    tags: ['trouver', 'recherche', 'carte', 'filtres', 'geolocalisation'],
    views: 1340
  },
  {
    id: 'spots-add',
    category: 'spots',
    title: 'Ajouter un spot',
    titleEn: 'Add a spot',
    content: `# Ajouter un nouveau spot

Partagez vos decouvertes avec la communaute !

## Etapes

1. Cliquez sur le bouton **+** en bas de l'ecran
2. Positionnez le marqueur sur la carte
3. Remplissez les informations :
   - Photo (obligatoire)
   - Description
   - Type de spot
   - Direction
4. Soumettez

## Conseils pour une bonne photo

- Montrez clairement l'emplacement
- Incluez des reperes visuels
- Prenez la photo de jour si possible

## Validation

Votre spot sera verifie par la communaute avant publication. Vous recevrez **+50 points** une fois valide !`,
    tags: ['ajouter', 'creer', 'nouveau', 'photo', 'contribution'],
    views: 876
  },
  {
    id: 'spots-colors',
    category: 'spots',
    title: 'Couleurs des spots',
    titleEn: 'Spot colors explained',
    content: `# Comprendre les couleurs des spots

Les marqueurs sur la carte utilisent des couleurs pour indiquer la qualite et la fraicheur des spots.

## Code couleur

| Couleur | Signification | Note |
|---------|---------------|------|
| **Rouge** | Top spot | 4.5+ etoiles |
| **Vert** | Bon spot | 3.5-4.5 etoiles |
| **Orange** | Spot recent | < 3 mois |
| **Gris** | Spot ancien | > 1 an sans check-in |

## Indicateurs supplementaires

- **Etoile** : Spot favori
- **Coche** : Vous y avez fait un check-in
- **Cluster** : Plusieurs spots regroupes`,
    tags: ['couleurs', 'marqueurs', 'carte', 'legende', 'note'],
    views: 654
  },
  {
    id: 'spots-review',
    category: 'spots',
    title: 'Laisser un avis',
    titleEn: 'Leave a review',
    content: `# Laisser un avis sur un spot

Vos avis aident les autres autostoppeurs !

## Comment noter ?

1. Ouvrez la fiche du spot
2. Cliquez sur les etoiles pour noter (1-5)
3. Ajoutez un commentaire detaille
4. Mentionnez la date de votre passage
5. Validez

## Ce qui fait un bon avis

- **Temps d'attente** : Combien avez-vous attendu ?
- **Securite** : Le lieu est-il sur ?
- **Accessibilite** : Facile a trouver ?
- **Conseils** : Ou se placer exactement ?

## Recompenses

- **+15 points** par avis
- **Badge Critique** apres 10 avis
- **Influence** sur la note globale du spot`,
    tags: ['avis', 'note', 'etoiles', 'commentaire', 'review'],
    views: 723
  },
  {
    id: 'spots-report',
    category: 'spots',
    title: 'Signaler un probleme',
    titleEn: 'Report an issue',
    content: `# Signaler un spot problematique

La securite est notre priorite. Signalez tout probleme !

## Raisons de signalement

- Spot dangereux
- Informations incorrectes
- Spot inexistant
- Photos inappropriees
- Spam ou contenu abusif

## Comment signaler ?

1. Ouvrez la fiche du spot
2. Cliquez sur les 3 points (menu)
3. Selectionnez "Signaler"
4. Choisissez la raison
5. Ajoutez des details
6. Envoyez

## Suivi

Notre equipe examine chaque signalement sous 24-48h. Vous serez notifie de l'action prise.`,
    tags: ['signaler', 'probleme', 'danger', 'securite', 'moderation'],
    views: 432
  },

  // ================= SOCIAL =================
  {
    id: 'social-chat',
    category: 'social',
    title: 'Utiliser le chat',
    titleEn: 'Using the chat',
    content: `# Chat communautaire

Echangez avec les autres autostoppeurs !

## Salons disponibles

- **General** : Discussion libre
- **Conseils** : Demandez de l'aide
- **Recits** : Partagez vos aventures
- **Covoiturage** : Trouvez des compagnons

## Regles du chat

- Soyez respectueux
- Pas de spam ni publicite
- Pas de donnees personnelles
- Signalez les comportements abusifs

## Fonctionnalites

- Emojis et reactions
- Partage de position
- Partage de spots
- Mentions (@utilisateur)`,
    tags: ['chat', 'discussion', 'communaute', 'messages'],
    views: 567
  },
  {
    id: 'social-friends',
    category: 'social',
    title: 'Ajouter des amis',
    titleEn: 'Add friends',
    content: `# Systeme d'amis

Connectez-vous avec d'autres autostoppeurs !

## Ajouter un ami

1. Allez sur le profil d'un utilisateur
2. Cliquez sur "Ajouter en ami"
3. Attendez qu'il accepte

## Rechercher des amis

- Par pseudo
- Par code ami unique
- Suggestions basees sur vos activites

## Avantages

- Voir leur position (si autorise)
- Defis entre amis
- Notifications de leurs activites
- Voyager ensemble`,
    tags: ['amis', 'social', 'connexion', 'reseau'],
    views: 489
  },
  {
    id: 'social-groups',
    category: 'social',
    title: 'Groupes de voyage',
    titleEn: 'Travel groups',
    content: `# Groupes de voyage

Organisez des voyages en groupe !

## Creer un groupe

1. Allez dans Social > Groupes
2. Cliquez sur "Creer un groupe"
3. Invitez des amis
4. Definissez l'itineraire

## Fonctionnalites

- Chat de groupe
- Partage de position en temps reel
- Itineraire commun
- Points de rendez-vous

## Conseils

- Maximum 10 personnes par groupe
- Designez un responsable
- Partagez vos contacts d'urgence`,
    tags: ['groupe', 'voyage', 'equipe', 'organisation'],
    views: 345
  },
  {
    id: 'social-companion',
    category: 'social',
    title: 'Recherche de compagnons',
    titleEn: 'Companion search',
    content: `# Trouver un compagnon de voyage

Voyager accompagne, c'est plus sur et plus fun !

## Publier une annonce

1. Allez dans Social > Compagnons
2. Cliquez sur "Poster une annonce"
3. Indiquez :
   - Votre itineraire
   - Dates de voyage
   - Langues parlees
   - Experience

## Repondre a une annonce

1. Parcourez les annonces
2. Filtrez par destination/dates
3. Contactez les voyageurs compatibles

## Score de compatibilite

Notre algorithme calcule un score base sur :
- Destination commune
- Dates qui se chevauchent
- Langues en commun
- Experience similaire`,
    tags: ['compagnon', 'voyage', 'recherche', 'duo'],
    views: 412
  },

  // ================= GAMIFICATION =================
  {
    id: 'gam-points',
    category: 'gamification',
    title: 'Systeme de points',
    titleEn: 'Points system',
    content: `# Gagnez des points !

Les points recompensent votre participation a la communaute.

## Comment gagner des points ?

| Action | Points |
|--------|--------|
| Ajouter un spot | +50 |
| Laisser un avis | +15 |
| Faire un check-in | +10 |
| Connexion quotidienne | +5 |
| Inviter un ami | +100 |
| Completer un defi | Variable |

## Bonus

- **Serie quotidienne** : +2 points/jour consecutif
- **Premier du mois** : x2 sur tous les points
- **Parrain** : 10% des points de vos filleuls

## A quoi servent les points ?

- Debloquer des badges
- Monter dans le classement
- Acheter des items cosmetics
- Points de competence`,
    tags: ['points', 'recompense', 'xp', 'experience'],
    views: 1567
  },
  {
    id: 'gam-badges',
    category: 'gamification',
    title: 'Badges et succes',
    titleEn: 'Badges and achievements',
    content: `# Badges et succes

Collectionnez des badges pour montrer vos accomplissements !

## Types de badges

### Exploration
- **Explorateur** : 10 spots visites
- **Globe-trotter** : 5 pays differents
- **Cartographe** : 50 check-ins

### Contribution
- **Contributeur** : 5 spots ajoutes
- **Critique** : 10 avis laisses
- **Photographe** : 20 photos partagees

### Social
- **Social** : 10 amis
- **Leader** : Creer un groupe de voyage
- **Mentor** : Aider 5 nouveaux

### Specials
- **OG** : Membre depuis le debut
- **VIP** : Top 10 du classement
- **Legendaire** : Tous les badges`,
    tags: ['badges', 'succes', 'achievements', 'collection'],
    views: 1234
  },
  {
    id: 'gam-leaderboard',
    category: 'gamification',
    title: 'Classements',
    titleEn: 'Leaderboards',
    content: `# Classements

Comparez-vous aux autres autostoppeurs !

## Types de classements

- **Hebdomadaire** : Reset chaque lundi
- **Mensuel** : Reset le 1er du mois
- **All-time** : Classement global

## Criteres

Le classement est base sur les points gagnes pendant la periode. Bonus pour :
- Diversite des actions
- Regularite
- Qualite des contributions

## Ligues

| Ligue | Rang |
|-------|------|
| Bronze | 0-999 points |
| Argent | 1000-4999 |
| Or | 5000-9999 |
| Platine | 10000-24999 |
| Diamant | 25000+ |

## Recompenses

Les top 10 de chaque semaine recoivent des bonus speciaux !`,
    tags: ['classement', 'leaderboard', 'rang', 'competition'],
    views: 876
  },
  {
    id: 'gam-challenges',
    category: 'gamification',
    title: 'Defis et challenges',
    titleEn: 'Challenges',
    content: `# Defis et challenges

Relevez des defis pour gagner des recompenses !

## Defis quotidiens

Nouveaux defis chaque jour :
- Faire 3 check-ins
- Laisser un avis
- Partager un spot

## Defis hebdomadaires

Plus difficiles, plus recompensants :
- Visiter 5 nouveaux spots
- Inviter un ami
- Completer un itineraire

## Defis entre amis

Defiez vos amis :
- Course aux check-ins
- Premier a atteindre X points
- Decouverte de nouveaux pays

## Recompenses

- Points bonus
- Badges exclusifs
- Items cosmetiques`,
    tags: ['defis', 'challenges', 'quotidien', 'hebdomadaire'],
    views: 765
  },
  {
    id: 'gam-skills',
    category: 'gamification',
    title: 'Arbre de competences',
    titleEn: 'Skill tree',
    content: `# Arbre de competences

Debloquez des bonus permanents !

## Fonctionnement

1. Gagnez des points de competence (1 par niveau)
2. Depensez-les dans l'arbre
3. Debloquez des bonus

## Branches

### Explorateur
- Bonus de points sur check-ins
- Voir les spots caches
- Reduction temps d'attente affiche

### Social
- Plus d'amis maximum
- Chat prioritaire
- Creer plus de groupes

### Contributeur
- Validation plus rapide des spots
- Badge special
- Spots en avant

## Progression

Chaque competence a 3 niveaux. Debloquez le niveau 3 pour le bonus maximum !`,
    tags: ['competences', 'skills', 'arbre', 'bonus', 'upgrade'],
    views: 654
  },

  // ================= ACCOUNT =================
  {
    id: 'acc-profile',
    category: 'account',
    title: 'Modifier son profil',
    titleEn: 'Edit profile',
    content: `# Personnaliser votre profil

Faites-vous connaitre !

## Elements modifiables

- **Photo de profil** : Avatar ou photo personnelle
- **Pseudo** : Votre nom d'utilisateur
- **Bio** : Presentation courte
- **Langues** : Langues parlees
- **Experience** : Niveau d'autostop

## Cadres de profil

Debloquez des cadres speciaux :
- Badge VIP
- Top contributeur
- Ancien membre
- Event special

## Confidentialite

Choisissez ce qui est visible :
- Profil public/prive
- Masquer les statistiques
- Masquer la position`,
    tags: ['profil', 'personnalisation', 'avatar', 'bio'],
    views: 543
  },
  {
    id: 'acc-password',
    category: 'account',
    title: 'Changer de mot de passe',
    titleEn: 'Change password',
    content: `# Changer votre mot de passe

## Depuis les parametres

1. Allez dans Profil > Parametres
2. Cliquez sur "Securite"
3. Selectionnez "Changer le mot de passe"
4. Entrez l'ancien mot de passe
5. Entrez le nouveau (2 fois)
6. Confirmez

## Mot de passe oublie ?

1. Sur l'ecran de connexion
2. Cliquez sur "Mot de passe oublie"
3. Entrez votre email
4. Cliquez sur le lien recu
5. Definissez un nouveau mot de passe

## Conseils securite

- Minimum 8 caracteres
- Melangez majuscules, minuscules, chiffres
- Utilisez un gestionnaire de mots de passe
- Ne reutilisez pas vos mots de passe`,
    tags: ['mot de passe', 'password', 'securite', 'reinitialiser'],
    views: 432
  },
  {
    id: 'acc-notifications',
    category: 'account',
    title: 'Gerer les notifications',
    titleEn: 'Manage notifications',
    content: `# Parametres de notifications

Controlez ce que vous recevez.

## Types de notifications

### Push (telephone)
- Nouveaux messages chat
- Demandes d'amis
- Alertes de securite
- Rappels de defis

### Email
- Resume hebdomadaire
- Nouveaux spots dans vos zones
- Newsletters (optionnel)

## Personnaliser

1. Profil > Parametres > Notifications
2. Activez/desactivez chaque type
3. Definissez les horaires (ne pas deranger)

## Mode voyage

Activez le "Mode voyage" pour recevoir uniquement les notifications critiques (SOS, securite).`,
    tags: ['notifications', 'alertes', 'push', 'email'],
    views: 387
  },
  {
    id: 'acc-privacy',
    category: 'account',
    title: 'Confidentialite et donnees',
    titleEn: 'Privacy and data',
    content: `# Vos donnees personnelles

SpotHitch respecte le RGPD.

## Donnees collectees

- Informations de compte (email, pseudo)
- Activite (check-ins, avis)
- Position (uniquement quand autorise)

## Vos droits

- **Acces** : Telecharger toutes vos donnees
- **Rectification** : Modifier vos infos
- **Suppression** : Supprimer votre compte
- **Portabilite** : Exporter en JSON

## Comment exercer vos droits

1. Profil > Parametres > Mes donnees (RGPD)
2. Choisissez l'action souhaitee
3. Confirmez

## Suppression de compte

Attention : irreversible ! Toutes vos donnees seront supprimees sous 30 jours.`,
    tags: ['rgpd', 'donnees', 'confidentialite', 'privacy', 'suppression'],
    views: 298
  },
  {
    id: 'acc-2fa',
    category: 'account',
    title: 'Authentification a deux facteurs',
    titleEn: 'Two-factor authentication',
    content: `# Double authentification (2FA)

Securisez votre compte !

## Activer la 2FA

1. Profil > Parametres > Securite
2. Activez "Authentification a deux facteurs"
3. Scannez le QR code avec une app (Google Authenticator, Authy)
4. Entrez le code de verification
5. Sauvegardez les codes de secours

## A chaque connexion

1. Entrez votre mot de passe
2. Ouvrez votre app 2FA
3. Entrez le code a 6 chiffres

## Codes de secours

- 10 codes a usage unique
- A conserver en lieu sur
- Utilisez-les si vous perdez acces a l'app

## Desactiver

Profil > Parametres > Securite > Desactiver 2FA (necessite confirmation)`,
    tags: ['2fa', 'securite', 'authentification', 'verification'],
    views: 234
  },

  // ================= TROUBLESHOOTING =================
  {
    id: 'ts-gps',
    category: 'troubleshooting',
    title: 'Problemes de geolocalisation',
    titleEn: 'GPS issues',
    content: `# La geolocalisation ne fonctionne pas

## Verifications de base

1. **Permissions** : Autorisez SpotHitch a acceder a votre position
   - iOS : Reglages > SpotHitch > Position
   - Android : Parametres > Apps > SpotHitch > Autorisations

2. **GPS active** : Verifiez que le GPS est active sur votre telephone

3. **Mode economie** : Desactivez le mode economie de batterie

## Solutions

- Rafraichissez la page
- Fermez et rouvrez l'app
- Redemarrez votre telephone
- Mettez a jour votre navigateur

## Position imprecise ?

- Sortez des batiments
- Attendez quelques secondes
- Verifiez que vous n'etes pas en mode avion`,
    tags: ['gps', 'localisation', 'position', 'probleme'],
    views: 876
  },
  {
    id: 'ts-offline',
    category: 'troubleshooting',
    title: 'Mode hors-ligne',
    titleEn: 'Offline mode',
    content: `# Utiliser SpotHitch hors-ligne

L'app fonctionne meme sans internet !

## Ce qui fonctionne hors-ligne

- Voir les spots deja consultes
- Consulter vos favoris
- Voir votre profil et stats
- Navigation dans l'app

## Ce qui necessite internet

- Ajouter des spots
- Faire des check-ins
- Envoyer des messages
- Synchroniser les donnees

## Synchronisation

Quand vous retrouvez internet :
- Les actions en attente sont envoyees
- Les nouvelles donnees sont telechargees
- Une notification confirme la sync

## Preparer un voyage

Consultez les spots de votre itineraire a l'avance pour les mettre en cache !`,
    tags: ['offline', 'hors-ligne', 'cache', 'synchronisation'],
    views: 654
  },
  {
    id: 'ts-login',
    category: 'troubleshooting',
    title: 'Impossible de se connecter',
    titleEn: 'Cannot log in',
    content: `# Problemes de connexion

## Email/mot de passe incorrect

- Verifiez les majuscules
- Verifiez l'email utilise
- Utilisez "Mot de passe oublie"

## Compte Google

- Verifiez le compte Google utilise
- Deconnectez-vous de Google et reconnectez
- Effacez le cache du navigateur

## Compte bloque

Votre compte peut etre temporairement bloque apres :
- 5 tentatives echouees
- Activite suspecte detectee

Attendez 15 minutes ou contactez-nous.

## Erreur technique

1. Effacez le cache de l'app
2. Mettez a jour l'app/navigateur
3. Essayez sur un autre appareil
4. Contactez le support`,
    tags: ['connexion', 'login', 'erreur', 'bloque'],
    views: 543
  },
  {
    id: 'ts-notifications',
    category: 'troubleshooting',
    title: 'Notifications qui ne fonctionnent pas',
    titleEn: 'Notifications not working',
    content: `# Problemes de notifications

## Verifications

1. **Permissions app** : Autorisez les notifications pour SpotHitch
2. **Parametres telephone** : Verifiez le mode "Ne pas deranger"
3. **Parametres SpotHitch** : Profil > Parametres > Notifications

## Sur iPhone

- Reglages > Notifications > SpotHitch
- Activez "Autoriser les notifications"
- Choisissez le style d'alerte

## Sur Android

- Parametres > Apps > SpotHitch > Notifications
- Activez les notifications
- Verifiez les canaux individuels

## PWA

Pour recevoir les notifications push sur la PWA :
1. Assurez-vous d'avoir installe l'app
2. Acceptez la demande de notifications
3. Gardez l'app en arriere-plan`,
    tags: ['notifications', 'push', 'alertes', 'probleme'],
    views: 432
  },
  {
    id: 'ts-slow',
    category: 'troubleshooting',
    title: 'Application lente',
    titleEn: 'Slow app',
    content: `# L'application est lente

## Causes possibles

- Connexion internet faible
- Cache trop volumineux
- Appareil ancien
- Trop d'onglets ouverts

## Solutions

### Vider le cache
1. Profil > Parametres > Stockage
2. Cliquez sur "Vider le cache"
3. Rechargez l'app

### Reduire les donnees
- Desactivez les images HD
- Limitez le nombre de spots affiches
- Fermez les autres apps

### Mise a jour
Assurez-vous d'avoir la derniere version :
- Rechargez la page
- Verifiez les mises a jour du navigateur

## Toujours lent ?

Contactez-nous avec :
- Modele de telephone
- Version du navigateur
- Description du probleme`,
    tags: ['lent', 'performance', 'cache', 'vitesse'],
    views: 321
  },
  {
    id: 'ts-report-bug',
    category: 'troubleshooting',
    title: 'Signaler un bug',
    titleEn: 'Report a bug',
    content: `# Signaler un bug

Aidez-nous a ameliorer SpotHitch !

## Comment signaler ?

1. Profil > Aide > Signaler un bug
2. Decrivez le probleme
3. Ajoutez des captures d'ecran si possible
4. Envoyez

## Informations utiles

- Que faisiez-vous quand le bug est apparu ?
- Le bug est-il reproductible ?
- Quel appareil/navigateur utilisez-vous ?
- Avez-vous un message d'erreur ?

## Suivi

- Vous recevrez un email de confirmation
- Notre equipe examine le bug
- Vous serez notifie quand il sera corrige

## Bugs critiques

Pour les bugs de securite ou les failles, contactez directement : security@spothitch.app`,
    tags: ['bug', 'erreur', 'signaler', 'probleme', 'support'],
    views: 234
  }
]

/**
 * Get article views from storage
 * @returns {Object} Map of article ID to view count
 */
function getArticleViews() {
  return Storage.get(VIEWS_STORAGE_KEY) || {}
}

/**
 * Save article views to storage
 * @param {Object} views - Map of article ID to view count
 */
function saveArticleViews(views) {
  Storage.set(VIEWS_STORAGE_KEY, views)
}

/**
 * Increment view count for an article
 * @param {string} articleId - Article ID
 */
export function incrementArticleViews(articleId) {
  if (!articleId) return

  const views = getArticleViews()
  views[articleId] = (views[articleId] || 0) + 1
  saveArticleViews(views)

  console.log(`[HelpCenter] Article ${articleId} viewed, total: ${views[articleId]}`)
}

/**
 * Get article view count (local + default)
 * @param {string} articleId - Article ID
 * @returns {number} Total view count
 */
export function getArticleViewCount(articleId) {
  const article = HELP_ARTICLES.find(a => a.id === articleId)
  const localViews = getArticleViews()

  const baseViews = article ? article.views : 0
  const additionalViews = localViews[articleId] || 0

  return baseViews + additionalViews
}

/**
 * Get all help categories
 * @returns {Object} Categories object
 */
export function getCategories() {
  return HELP_CATEGORIES
}

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|null} Category or null
 */
export function getCategoryById(categoryId) {
  return HELP_CATEGORIES[categoryId] || null
}

/**
 * Get all help articles
 * @returns {Array} All articles
 */
export function getAllArticles() {
  return HELP_ARTICLES
}

/**
 * Get help articles by category
 * @param {string} category - Category ID
 * @returns {Array} Articles in category
 */
export function getHelpArticles(category) {
  if (!category) {
    return HELP_ARTICLES
  }

  return HELP_ARTICLES.filter(article => article.category === category)
}

/**
 * Search help articles
 * @param {string} query - Search query
 * @returns {Array} Matching articles
 */
export function searchHelp(query) {
  if (!query || !query.trim()) {
    return []
  }

  const searchLower = query.toLowerCase().trim()

  return HELP_ARTICLES.filter(article => {
    const titleMatch = article.title.toLowerCase().includes(searchLower)
    const titleEnMatch = article.titleEn?.toLowerCase().includes(searchLower)
    const contentMatch = article.content.toLowerCase().includes(searchLower)
    const tagsMatch = article.tags.some(tag => tag.toLowerCase().includes(searchLower))
    const categoryMatch = article.category.toLowerCase().includes(searchLower)

    return titleMatch || titleEnMatch || contentMatch || tagsMatch || categoryMatch
  })
}

/**
 * Get article by ID
 * @param {string} id - Article ID
 * @returns {Object|null} Article or null
 */
export function getArticleById(id) {
  if (!id) return null
  return HELP_ARTICLES.find(article => article.id === id) || null
}

/**
 * Get popular articles (by views)
 * @param {number} limit - Max articles to return
 * @returns {Array} Popular articles
 */
export function getPopularArticles(limit = 5) {
  return [...HELP_ARTICLES]
    .map(article => ({
      ...article,
      totalViews: getArticleViewCount(article.id)
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, limit)
}

/**
 * Get related articles (same category or shared tags)
 * @param {string} articleId - Current article ID
 * @param {number} limit - Max articles to return
 * @returns {Array} Related articles
 */
export function getRelatedArticles(articleId, limit = 3) {
  const article = getArticleById(articleId)
  if (!article) return []

  return HELP_ARTICLES
    .filter(a => a.id !== articleId)
    .map(a => {
      let score = 0
      // Same category = high score
      if (a.category === article.category) score += 10
      // Shared tags = bonus
      const sharedTags = a.tags.filter(tag => article.tags.includes(tag))
      score += sharedTags.length * 2
      return { ...a, relevanceScore: score }
    })
    .filter(a => a.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Convert simple markdown to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
function markdownToHTML(markdown) {
  if (!markdown) return ''

  let html = escapeHTML(markdown)

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Code blocks
  html = html.replace(/`(.+?)`/g, '<code class="bg-slate-700 px-1 rounded text-sm">$1</code>')

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul class="space-y-1 my-2">$1</ul>')

  // Tables
  html = html.replace(/\|(.+)\|/g, (match, content) => {
    const cells = content.split('|').map(c => c.trim())
    if (cells.every(c => c.match(/^-+$/))) {
      return '' // Separator row
    }
    const row = cells.map(c => `<td class="border border-slate-600 px-3 py-2">${c}</td>`).join('')
    return `<tr>${row}</tr>`
  })
  html = html.replace(/((?:<tr>.*?<\/tr>\n?)+)/g, '<table class="w-full border-collapse my-4">$1</table>')

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-3">')
  html = '<p class="mb-3">' + html + '</p>'

  // Clean up empty paragraphs
  html = html.replace(/<p class="mb-3"><\/p>/g, '')
  html = html.replace(/<p class="mb-3">(<h[1-3])/g, '$1')
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1')
  html = html.replace(/<p class="mb-3">(<ul)/g, '$1')
  html = html.replace(/(<\/ul>)<\/p>/g, '$1')
  html = html.replace(/<p class="mb-3">(<table)/g, '$1')
  html = html.replace(/(<\/table>)<\/p>/g, '$1')

  return html
}

/**
 * Render help center main view
 * @param {Object} state - App state
 * @returns {string} HTML string
 */
export function renderHelpCenter(state = {}) {
  const searchQuery = state.helpSearchQuery || ''
  const categories = Object.values(HELP_CATEGORIES)
  const popularArticles = getPopularArticles(5)

  // Filter articles if searching
  let displayArticles = searchQuery ? searchHelp(searchQuery) : []

  return `
    <div class="help-center-view pb-24 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="sticky top-16 z-30 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent p-4 border-b border-slate-700/50">
        <div class="flex items-center gap-4 mb-4">
          <button
            onclick="closeHelpCenter()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="Retour"
            title="Retour"
          >
            <i class="fas fa-arrow-left" aria-hidden="true"></i>
          </button>
          <div>
            <h1 class="text-2xl font-bold">Centre d'aide</h1>
            <p class="text-slate-400 text-sm">Comment pouvons-nous vous aider ?</p>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            id="help-search"
            placeholder="Rechercher dans l'aide..."
            class="w-full bg-slate-800 border border-slate-700 rounded-lg px-12 py-3 text-white placeholder-slate-500 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
            oninput="searchHelpCenter(this.value)"
            value="${escapeHTML(searchQuery)}"
            aria-label="Rechercher dans l'aide"
          />
          <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true"></i>
          ${searchQuery ? `
            <button
              onclick="clearHelpSearch()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
            >
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          ` : ''}
        </div>
      </div>

      ${searchQuery ? `
        <!-- Search Results -->
        <div class="p-4" role="region" aria-live="polite">
          <h2 class="text-lg font-bold mb-4">
            ${displayArticles.length} resultat${displayArticles.length !== 1 ? 's' : ''} pour "${escapeHTML(searchQuery)}"
          </h2>
          ${displayArticles.length > 0 ? `
            <div class="space-y-3">
              ${displayArticles.map(article => `
                <button
                  onclick="openHelpArticle('${article.id}')"
                  class="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-primary-500/50 transition-all text-left group"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-${HELP_CATEGORIES[article.category]?.color || 'primary'}-500/20 flex items-center justify-center flex-shrink-0">
                      <i class="fas ${HELP_CATEGORIES[article.category]?.icon || 'fa-file'} text-${HELP_CATEGORIES[article.category]?.color || 'primary'}-400" aria-hidden="true"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium group-hover:text-primary-400 transition-colors">${escapeHTML(article.title)}</h3>
                      <p class="text-sm text-slate-400 truncate">${HELP_CATEGORIES[article.category]?.title || article.category}</p>
                    </div>
                    <i class="fas fa-chevron-right text-slate-500 group-hover:text-primary-400 transition-colors" aria-hidden="true"></i>
                  </div>
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🔍</div>
              <h3 class="text-xl font-bold mb-2">Aucun resultat</h3>
              <p class="text-slate-400 mb-6">Essayez avec d'autres mots-cles</p>
              <button
                onclick="clearHelpSearch()"
                class="btn-primary"
              >
                <i class="fas fa-times mr-2" aria-hidden="true"></i>
                Effacer la recherche
              </button>
            </div>
          `}
        </div>
      ` : `
        <!-- Categories -->
        <div class="p-4">
          <h2 class="text-lg font-bold mb-4">Parcourir par categorie</h2>
          <div class="grid grid-cols-2 gap-3">
            ${categories.map(cat => `
              <button
                onclick="openHelpCategory('${cat.id}')"
                class="p-4 rounded-lg bg-gradient-to-br from-${cat.color}-500/20 to-${cat.color}-600/10 border border-${cat.color}-500/30 hover:border-${cat.color}-400/50 transition-all text-left group"
              >
                <div class="w-12 h-12 rounded-xl bg-${cat.color}-500/20 flex items-center justify-center mb-3">
                  <i class="fas ${cat.icon} text-xl text-${cat.color}-400" aria-hidden="true"></i>
                </div>
                <h3 class="font-bold group-hover:text-${cat.color}-400 transition-colors">${escapeHTML(cat.title)}</h3>
                <p class="text-sm text-slate-400">${escapeHTML(cat.description)}</p>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Popular Articles -->
        <div class="p-4 border-t border-slate-700/50">
          <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
            <i class="fas fa-fire text-orange-400" aria-hidden="true"></i>
            Articles populaires
          </h2>
          <div class="space-y-3">
            ${popularArticles.map((article, index) => `
              <button
                onclick="openHelpArticle('${article.id}')"
                class="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-primary-500/50 transition-all text-left group flex items-center gap-3"
              >
                <span class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">${index + 1}</span>
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium group-hover:text-primary-400 transition-colors">${escapeHTML(article.title)}</h3>
                  <p class="text-sm text-slate-400">${article.totalViews} vues</p>
                </div>
                <i class="fas fa-chevron-right text-slate-500 group-hover:text-primary-400 transition-colors" aria-hidden="true"></i>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Contact -->
        <div class="mx-4 mb-4 p-6 rounded-lg bg-gradient-to-br from-primary-500/20 to-emerald-500/20 border border-primary-500/30 text-center">
          <div class="text-2xl mb-3">💬</div>
          <h3 class="text-lg font-bold mb-2">Vous n'avez pas trouve votre reponse ?</h3>
          <p class="text-slate-300 mb-4">Notre equipe est la pour vous aider !</p>
          <button
            onclick="openContactForm()"
            class="btn-primary"
          >
            <i class="fas fa-envelope mr-2" aria-hidden="true"></i>
            Nous contacter
          </button>
        </div>
      `}
    </div>
  `
}

/**
 * Render category view
 * @param {string} categoryId - Category ID
 * @returns {string} HTML string
 */
export function renderHelpCategory(categoryId) {
  const category = getCategoryById(categoryId)
  if (!category) {
    return `<div class="p-4 text-center text-slate-400">Categorie non trouvee</div>`
  }

  const articles = getHelpArticles(categoryId)

  return `
    <div class="help-category-view pb-24 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="sticky top-16 z-30 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent p-4 border-b border-slate-700/50">
        <div class="flex items-center gap-4">
          <button
            onclick="backToHelpCenter()"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="Retour au centre d'aide"
            title="Retour"
          >
            <i class="fas fa-arrow-left" aria-hidden="true"></i>
          </button>
          <div class="w-12 h-12 rounded-xl bg-${category.color}-500/20 flex items-center justify-center">
            <i class="fas ${category.icon} text-xl text-${category.color}-400" aria-hidden="true"></i>
          </div>
          <div>
            <h1 class="text-2xl font-bold">${escapeHTML(category.title)}</h1>
            <p class="text-slate-400 text-sm">${articles.length} article${articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <!-- Articles List -->
      <div class="p-4">
        <div class="space-y-3">
          ${articles.map(article => `
            <button
              onclick="openHelpArticle('${article.id}')"
              class="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-${category.color}-500/50 transition-all text-left group"
            >
              <div class="flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium group-hover:text-${category.color}-400 transition-colors">${escapeHTML(article.title)}</h3>
                  <div class="flex items-center gap-3 mt-1 text-sm text-slate-400">
                    <span><i class="fas fa-eye mr-1" aria-hidden="true"></i>${getArticleViewCount(article.id)} vues</span>
                    <span><i class="fas fa-tags mr-1" aria-hidden="true"></i>${article.tags.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
                <i class="fas fa-chevron-right text-slate-500 group-hover:text-${category.color}-400 transition-colors" aria-hidden="true"></i>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `
}

/**
 * Render single article view
 * @param {Object} article - Article object
 * @returns {string} HTML string
 */
export function renderArticle(article) {
  if (!article) {
    return `<div class="p-4 text-center text-slate-400">Article non trouve</div>`
  }

  const category = getCategoryById(article.category)
  const relatedArticles = getRelatedArticles(article.id, 3)
  const viewCount = getArticleViewCount(article.id)

  // Increment view count
  incrementArticleViews(article.id)

  return `
    <div class="help-article-view pb-24 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="sticky top-16 z-30 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent p-4 border-b border-slate-700/50">
        <div class="flex items-center gap-4">
          <button
            onclick="backToHelpCategory('${article.category}')"
            class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="Retour a la categorie"
            title="Retour"
          >
            <i class="fas fa-arrow-left" aria-hidden="true"></i>
          </button>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-sm text-slate-400 mb-1">
              ${category ? `
                <span class="flex items-center gap-1">
                  <i class="fas ${category.icon} text-${category.color}-400" aria-hidden="true"></i>
                  ${escapeHTML(category.title)}
                </span>
                <span>/</span>
              ` : ''}
              <span><i class="fas fa-eye mr-1" aria-hidden="true"></i>${viewCount} vues</span>
            </div>
            <h1 class="text-xl font-bold truncate">${escapeHTML(article.title)}</h1>
          </div>
        </div>
      </div>

      <!-- Article Content -->
      <div class="p-4">
        <article class="prose prose-invert max-w-none text-slate-200 help-article-content">
          ${markdownToHTML(article.content)}
        </article>

        <!-- Tags -->
        <div class="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-700/50">
          ${article.tags.map(tag => `
            <button
              onclick="searchHelpByTag('${escapeHTML(tag)}')"
              class="px-3 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
            >
              #${escapeHTML(tag)}
            </button>
          `).join('')}
        </div>
      </div>

      ${relatedArticles.length > 0 ? `
        <!-- Related Articles -->
        <div class="p-4 border-t border-slate-700/50">
          <h2 class="text-lg font-bold mb-4">Articles similaires</h2>
          <div class="space-y-3">
            ${relatedArticles.map(related => `
              <button
                onclick="openHelpArticle('${related.id}')"
                class="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-primary-500/50 transition-all text-left group"
              >
                <div class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium group-hover:text-primary-400 transition-colors">${escapeHTML(related.title)}</h3>
                    <p class="text-sm text-slate-400">${HELP_CATEGORIES[related.category]?.title || related.category}</p>
                  </div>
                  <i class="fas fa-chevron-right text-slate-500 group-hover:text-primary-400 transition-colors" aria-hidden="true"></i>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Helpful? -->
      <div class="mx-4 mb-4 p-6 rounded-lg bg-slate-800 border border-slate-700 text-center">
        <p class="text-slate-300 mb-4">Cet article vous a-t-il ete utile ?</p>
        <div class="flex justify-center gap-3">
          <button
            onclick="rateHelpArticle('${article.id}', true)"
            class="px-6 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
            aria-label="Oui, cet article m'a aide"
          >
            <i class="fas fa-thumbs-up mr-2" aria-hidden="true"></i>
            Oui
          </button>
          <button
            onclick="rateHelpArticle('${article.id}', false)"
            class="px-6 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
            aria-label="Non, cet article ne m'a pas aide"
          >
            <i class="fas fa-thumbs-down mr-2" aria-hidden="true"></i>
            Non
          </button>
        </div>
      </div>
    </div>
  `
}

/**
 * Open help center view
 */
export function openHelpCenter() {
  console.log('[HelpCenter] Opening help center')
  window.setState?.({ activeView: 'help-center', helpSearchQuery: '' })
}

/**
 * Close help center view
 */
export function closeHelpCenter() {
  console.log('[HelpCenter] Closing help center')
  window.setState?.({ activeView: null, helpSearchQuery: '' })
  window.history?.back?.()
}

/**
 * Search in help center
 * @param {string} query - Search query
 */
export function searchHelpCenter(query) {
  console.log('[HelpCenter] Searching:', query)
  window.setState?.({ helpSearchQuery: query || '' })
}

/**
 * Clear help search
 */
export function clearHelpSearch() {
  console.log('[HelpCenter] Clearing search')
  const input = document.getElementById('help-search')
  if (input) input.value = ''
  window.setState?.({ helpSearchQuery: '' })
}

/**
 * Search by tag
 * @param {string} tag - Tag to search
 */
export function searchHelpByTag(tag) {
  console.log('[HelpCenter] Searching by tag:', tag)
  window.setState?.({ helpSearchQuery: tag })
}

/**
 * Open help category view
 * @param {string} categoryId - Category ID
 */
export function openHelpCategory(categoryId) {
  console.log('[HelpCenter] Opening category:', categoryId)
  window.setState?.({ activeView: 'help-category', helpCategoryId: categoryId })
}

/**
 * Back to help center from category
 */
export function backToHelpCenter() {
  console.log('[HelpCenter] Back to help center')
  window.setState?.({ activeView: 'help-center', helpCategoryId: null })
}

/**
 * Open help article view
 * @param {string} articleId - Article ID
 */
export function openHelpArticle(articleId) {
  console.log('[HelpCenter] Opening article:', articleId)
  window.setState?.({ activeView: 'help-article', helpArticleId: articleId })
}

/**
 * Back to help category from article
 * @param {string} categoryId - Category ID
 */
export function backToHelpCategory(categoryId) {
  console.log('[HelpCenter] Back to category:', categoryId)
  window.setState?.({ activeView: 'help-category', helpCategoryId: categoryId, helpArticleId: null })
}

/**
 * Rate help article helpfulness
 * @param {string} articleId - Article ID
 * @param {boolean} helpful - Was it helpful?
 */
export function rateHelpArticle(articleId, helpful) {
  console.log('[HelpCenter] Rating article:', articleId, helpful ? 'helpful' : 'not helpful')

  // Store rating
  const ratings = Storage.get('help_article_ratings') || {}
  ratings[articleId] = helpful
  Storage.set('help_article_ratings', ratings)

  // Show toast
  if (helpful) {
    window.showToast?.('Merci pour votre retour !', 'success')
  } else {
    window.showToast?.('Merci, nous allons ameliorer cet article.', 'info')
  }
}

// Register global window handlers
window.openHelpCenter = openHelpCenter
window.closeHelpCenter = closeHelpCenter
window.searchHelpCenter = searchHelpCenter
window.clearHelpSearch = clearHelpSearch
window.searchHelpByTag = searchHelpByTag
window.openHelpCategory = openHelpCategory
window.backToHelpCenter = backToHelpCenter
window.openHelpArticle = openHelpArticle
window.backToHelpCategory = backToHelpCategory
window.rateHelpArticle = rateHelpArticle

export default {
  HELP_CATEGORIES,
  HELP_ARTICLES,
  getCategories,
  getCategoryById,
  getAllArticles,
  getHelpArticles,
  searchHelp,
  getArticleById,
  getPopularArticles,
  getRelatedArticles,
  getArticleViewCount,
  incrementArticleViews,
  renderHelpCenter,
  renderHelpCategory,
  renderArticle,
  openHelpCenter,
  closeHelpCenter,
  searchHelpCenter,
  clearHelpSearch,
  searchHelpByTag,
  openHelpCategory,
  backToHelpCenter,
  openHelpArticle,
  backToHelpCategory,
  rateHelpArticle
}
