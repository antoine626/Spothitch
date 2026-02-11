# 📱 Guide de Publication - SpotHitch

Ce guide explique comment publier SpotHitch sur Google Play Store et Apple App Store.

## 🤖 Google Play Store

### Prérequis
- Compte Google Play Developer ($25 one-time)
- Clé de signature APK

### Étapes

1. **Aller sur PWABuilder**
   ```
   https://www.pwabuilder.com/
   ```

2. **Entrer l'URL de l'app**
   ```
   https://spothitch.com/
   ```

3. **Générer le package Android**
   - Choisir "Android" 
   - Sélectionner "Google Play Store"
   - Télécharger le package

4. **Configurer assetlinks.json**
   - Obtenir le SHA256 fingerprint du certificat de signature
   - Mettre à jour `.well-known/assetlinks.json` avec le fingerprint
   - Commit et push

5. **Publier sur Google Play Console**
   - Uploader l'AAB (Android App Bundle)
   - Remplir la fiche store
   - Soumettre pour review

### Assets requis
- [ ] Icône hi-res 512x512 ✅ (icon-512.png)
- [ ] Feature graphic 1024x500
- [ ] Screenshots téléphone
- [ ] Screenshots tablette (optionnel)

---

## 🍎 Apple App Store

### Prérequis
- Compte Apple Developer ($99/an)
- Mac avec Xcode
- Certificat de distribution

### Étapes

1. **Aller sur PWABuilder**
   ```
   https://www.pwabuilder.com/
   ```

2. **Générer le package iOS**
   - Choisir "iOS"
   - Télécharger le projet Xcode

3. **Ouvrir dans Xcode**
   - Configurer le Bundle ID
   - Signer avec votre certificat
   - Archiver le projet

4. **Publier sur App Store Connect**
   - Uploader via Xcode ou Transporter
   - Remplir la fiche store
   - Soumettre pour review

### Assets requis
- [ ] Icône 1024x1024 (sans coins arrondis)
- [ ] Screenshots iPhone (6.5", 5.5")
- [ ] Screenshots iPad (optionnel)
- [ ] Preview vidéo (optionnel)

---

## 📊 Checklist Pré-Publication

### Technique
- [x] PWA installable
- [x] Mode offline fonctionnel
- [x] Service Worker optimisé
- [x] Lighthouse PWA > 80
- [x] HTTPS actif
- [x] Manifest complet

### Contenu
- [x] Description app (FR/EN)
- [x] Screenshots générés
- [x] Icônes toutes tailles
- [ ] Feature graphic (à créer)
- [ ] Privacy Policy
- [ ] Terms of Service

### Légal
- [ ] Privacy Policy URL
- [ ] Contact email
- [ ] Support URL

---

## 🔗 Liens Utiles

- [PWABuilder](https://www.pwabuilder.com/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## 📝 Notes

### Mise à jour de l'app
Les PWA se mettent à jour automatiquement via le Service Worker.
Pas besoin de re-soumettre sur les stores pour les mises à jour mineures.

### Monétisation
L'app est gratuite. Options futures :
- Donations
- Premium features
- Ads (non recommandé pour l'UX)

---

*Dernière mise à jour: 26 décembre 2025*
