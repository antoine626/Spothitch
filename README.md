# 🚗 Spothitch

> Une Progressive Web App (PWA) pour trouver et partager les meilleurs spots d'autostop.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://antoine626.github.io/Spothitch/)

## 🌐 Démo

**[➡️ Lancer l'application](https://antoine626.github.io/Spothitch/)**

## ✨ Fonctionnalités

- 📍 **Carte interactive** - Visualisez les spots d'autostop
- ➕ **Ajout de spots** - Partagez vos meilleurs emplacements
- ⭐ **Notes et avis** - Évaluez la qualité des spots
- 📱 **PWA** - Installez l'app sur votre téléphone
- 🔒 **Mode hors-ligne** - Consultez les spots sans connexion
- 🔥 **Firebase** - Backend temps réel

## 🚀 Installation

### Utiliser l'application

1. Visitez [https://antoine626.github.io/Spothitch/](https://antoine626.github.io/Spothitch/)
2. Sur mobile, cliquez sur "Ajouter à l'écran d'accueil"

### Développement local

```bash
# Cloner le repo
git clone https://github.com/antoine626/Spothitch.git
cd Spothitch

# Lancer un serveur local
npx serve .
# ou
python -m http.server 8000
```

## 📁 Structure

```
Spothitch/
├── index.html        # Application principale
├── manifest.json     # Configuration PWA
├── sw.js            # Service Worker (cache offline)
├── firestore.rules  # Règles de sécurité Firebase
├── LICENSE          # Licence MIT
└── README.md        # Documentation
```

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : Firebase (Firestore, Auth)
- **Maps** : Leaflet.js / Google Maps API
- **PWA** : Service Worker, Web App Manifest

## 🤝 Contribuer

Les contributions sont les bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👤 Auteur

**antoine626**

- GitHub: [@antoine626](https://github.com/antoine626)

---

⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile !
