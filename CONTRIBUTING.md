# 🤝 Guide de Contribution - SpotHitch

Merci de vouloir contribuer à SpotHitch ! Ce guide vous aidera à démarrer.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Configuration locale](#configuration-locale)
- [Standards de code](#standards-de-code)
- [Soumettre des changements](#soumettre-des-changements)
- [Signaler un bug](#signaler-un-bug)
- [Proposer une fonctionnalité](#proposer-une-fonctionnalité)

## 📜 Code de conduite

- Soyez respectueux et bienveillant
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est le mieux pour la communauté
- Faites preuve d'empathie envers les autres membres

## 🚀 Comment contribuer

### Types de contributions acceptées

- 🐛 Corrections de bugs
- ✨ Nouvelles fonctionnalités
- 📝 Amélioration de la documentation
- 🌍 Traductions
- 🎨 Améliorations UI/UX
- ⚡ Optimisations de performance
- 🔒 Corrections de sécurité

### Processus

1. **Fork** le repository
2. **Clone** votre fork : `git clone https://github.com/VOTRE_USERNAME/Spothitch.git`
3. **Créez une branche** : `git checkout -b feature/ma-fonctionnalite`
4. **Faites vos modifications**
5. **Testez** vos changements
6. **Commit** : `git commit -m "feat: description de ma fonctionnalité"`
7. **Push** : `git push origin feature/ma-fonctionnalite`
8. **Ouvrez une Pull Request**

## 💻 Configuration locale

```bash
# Cloner le repo
git clone https://github.com/antoine626/Spothitch.git
cd Spothitch

# Lancer un serveur local
python -m http.server 8000
# ou
npx serve .

# Ouvrir dans le navigateur
open http://localhost:8000
```

### Tester le Service Worker

Pour tester le SW en local, vous devez utiliser HTTPS ou localhost :

```bash
# Option avec certificat auto-signé
npx serve . --ssl
```

## 📏 Standards de code

### JavaScript

- **ES6+** : Utilisez les fonctionnalités modernes (arrow functions, async/await, destructuring)
- **Indentation** : 4 espaces
- **Nommage** : camelCase pour les variables et fonctions
- **Commentaires** : En français, clairs et concis

```javascript
// ✅ Bon
async function loadSpots() {
    const spots = await fetchSpots();
    return spots.filter(spot => spot.rating > 3);
}

// ❌ Mauvais
function loadSpots(){
var spots=fetchSpots()
return spots
}
```

### HTML/CSS

- **Classes** : Utiliser Tailwind CSS quand possible
- **Accessibilité** : Toujours ajouter `aria-label` aux éléments interactifs
- **Sémantique** : Utiliser les bonnes balises HTML5

```html
<!-- ✅ Bon -->
<button aria-label="Fermer le menu" class="p-2 rounded-lg">
    <i class="fas fa-times"></i>
</button>

<!-- ❌ Mauvais -->
<div onclick="closeMenu()">X</div>
```

### Sécurité

- **Toujours** utiliser `escapeHtml()` pour les données utilisateur
- **Jamais** utiliser `eval()` ou `innerHTML` avec des données non sanitisées

```javascript
// ✅ Bon
element.innerHTML = `<p>${escapeHtml(userInput)}</p>`;

// ❌ Mauvais
element.innerHTML = `<p>${userInput}</p>`;
```

## 📤 Soumettre des changements

### Format des commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```
<type>(<scope>): <description>

[body optionnel]

[footer optionnel]
```

Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage (pas de changement de code)
- `refactor` : Refactorisation
- `perf` : Amélioration de performance
- `test` : Ajout de tests
- `chore` : Maintenance

Exemples :
```
feat(spots): ajouter le filtre par temps d'attente
fix(map): corriger le clustering sur mobile
docs(readme): ajouter les instructions d'installation
```

### Pull Request

- Titre clair et descriptif
- Description des changements
- Screenshots si changements visuels
- Référence aux issues liées (`Fixes #123`)

## 🐛 Signaler un bug

Utilisez le template suivant :

```markdown
## Description
[Description claire du bug]

## Étapes pour reproduire
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

## Comportement attendu
[Ce qui devrait se passer]

## Comportement actuel
[Ce qui se passe actuellement]

## Screenshots
[Si applicable]

## Environnement
- OS: [ex: iOS 17, Android 14, Windows 11]
- Navigateur: [ex: Chrome 120, Safari 17]
- Version: [ex: v1.0.0]
```

## 💡 Proposer une fonctionnalité

1. Vérifiez que la fonctionnalité n'existe pas déjà
2. Ouvrez une issue avec le label `enhancement`
3. Décrivez clairement :
   - Le problème que ça résout
   - La solution proposée
   - Les alternatives considérées

---

## 🙏 Merci !

Chaque contribution compte, même la plus petite. Merci de faire partie de la communauté SpotHitch ! 🚗👍
