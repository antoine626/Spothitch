# Guide de Configuration SpotHitch

## 1. Configuration Firebase (5 minutes)

### Activer Authentication
1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionne ton projet **spothitch**
3. Menu gauche → **Build** → **Authentication**
4. Clique **"Commencer"**
5. Onglet **"Sign-in method"**
6. Active **"Adresse e-mail/Mot de passe"** → Activer → Enregistrer
7. Active **"Google"** → Activer → Enregistrer

### Activer Firestore Database
1. Menu gauche → **Build** → **Firestore Database**
2. Clique **"Créer une base de données"**
3. Choisis **"Démarrer en mode test"** (pour commencer facilement)
4. Choisis un emplacement (ex: **eur3** pour Europe)
5. Clique **"Activer"**

### Activer Storage
1. Menu gauche → **Build** → **Storage**
2. Clique **"Commencer"**
3. Choisis **"Démarrer en mode test"**
4. Clique **"Suivant"** puis **"OK"**

---

## 2. Déploiement GitHub Pages

### Option A : Automatique (recommandé)
Le déploiement se fait automatiquement quand tu push sur `main`.

1. Va sur GitHub → ton repo → **Settings** → **Pages**
2. Source : **GitHub Actions**
3. C'est tout !

### Option B : Manuel
```bash
npm run deploy
```

---

## 3. Accéder à ton app

Après déploiement, ton app sera disponible sur :
**https://antoine626.github.io/Spothitch**

---

## 4. Problèmes courants

### "Permission denied" sur Firebase
→ Vérifie que les règles Firestore/Storage sont en mode test

### L'app ne charge pas
→ Vérifie que tu as bien push le code avec les clés Firebase

### Les images ne s'uploadent pas
→ Active Storage dans la console Firebase

---

## Support

En cas de problème, ouvre une issue sur GitHub :
https://github.com/antoine626/Spothitch/issues
