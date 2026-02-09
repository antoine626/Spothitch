# 🤙 SpotHitch v2.0

**La communauté des autostoppeurs** - Trouvez les meilleurs spots d'auto-stop en Europe.

[![CI/CD](https://github.com/antoine626/Spothitch/actions/workflows/ci.yml/badge.svg)](https://github.com/antoine626/Spothitch/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Nouveautés v2.0

Cette version est une refonte complète de l'architecture :

- ✅ **ES Modules** - Code modulaire et maintenable
- ✅ **Vite** - Build ultra-rapide et HMR
- ✅ **Tailwind CSS** - Compilé localement (plus de CDN lent)
- ✅ **Tests unitaires** - Vitest avec couverture
- ✅ **CI/CD** - GitHub Actions automatisé
- ✅ **Sentry** - Monitoring d'erreurs en production
- ✅ **PWA optimisée** - Service Worker amélioré

## 📦 Installation

```bash
# Cloner le repo
git clone https://github.com/antoine626/Spothitch.git
cd Spothitch

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour production
npm run build
```

## 🏗️ Structure du projet

```
spothitch-v2/
├── src/
│   ├── components/      # Composants UI
│   │   ├── views/       # Pages principales
│   │   └── modals/      # Modales/Popups
│   ├── services/        # Services (Firebase, OSRM, etc.)
│   ├── stores/          # État global
│   ├── i18n/            # Traductions
│   ├── utils/           # Utilitaires
│   ├── styles/          # CSS (Tailwind)
│   └── data/            # Données statiques
├── public/              # Assets statiques
├── tests/               # Tests unitaires
├── .github/workflows/   # CI/CD
└── dist/                # Build de production
```

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 📊 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build |
| `npm test` | Lance les tests |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement |
| `npm run format` | Formate avec Prettier |
| `npm run sync:spots` | Synchronise les spots depuis Hitchmap |

## 🔧 Configuration

### Firebase

Créer un fichier `.env.local` :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Sentry (optionnel)

```env
VITE_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

## 🌍 Fonctionnalités

- 📍 **94+ spots** vérifiés dans 12 pays européens
- 🗺️ **Carte interactive** avec Leaflet
- 📱 **PWA installable** - fonctionne hors-ligne
- 🔍 **Recherche et filtres** avancés
- ⭐ **Système de notation** détaillé
- 💬 **Chat communautaire** en temps réel
- 🎮 **Gamification** - points, badges, niveaux
- 🆘 **Mode SOS** - partage de position d'urgence
- 🌐 **Multilingue** - FR, EN, ES

## 📱 PWA

L'application est une Progressive Web App complète :

- Installation sur l'écran d'accueil
- Fonctionnement hors-ligne
- Notifications push
- Synchronisation en arrière-plan

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md).

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails.

## 🔄 Synchronisation des données

Les spots d'auto-stop sont automatiquement synchronisés depuis [Hitchmap](https://hitchmap.com) le 1er de chaque mois via GitHub Actions. La synchronisation peut également être déclenchée manuellement depuis l'onglet Actions du repository.

Pour synchroniser manuellement en local :
```bash
# Télécharger le dump SQLite depuis hitchmap.com
curl -o /tmp/hitchmap_dump.sqlite https://hitchmap.com/dump.sqlite

# Exécuter le script d'extraction
npm run sync:spots
```

## 🙏 Crédits

- Données de spots : [Hitchwiki](https://hitchwiki.org) (ODBL)
- Cartes : [OpenStreetMap](https://www.openstreetmap.org)
- Routing : [OSRM](http://project-osrm.org)
- Photos : [Unsplash](https://unsplash.com)

---

Fait avec 🤙 par la communauté SpotHitch
