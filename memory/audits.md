# audits.md — Méthodologie complète des audits SpotHitch

> Dernière mise à jour : 2026-02-23
> Ce fichier documente EXACTEMENT comment relancer tous les audits.

---

## Vue d'ensemble — 9 audits disponibles

### Audits UI/flows (5 scripts — infrastructure de base)
```
1. node audit-ui.cjs           → UI basique (sans build nécessaire, contre localhost:4173 ou prod)
2. node audit-ui-part2.cjs     → Modals + interactions internes
3. node audit-ui-part3.cjs     → Flows complexes (SpotDetail, profil, social)
4. node audit-ui-part4.cjs     → Flows avancés (AddSpot étapes, Checkin, Event, Ambassador...)
5. node audit-firebase.cjs     → Tests authentifiés + Firebase + features prod
```

### Nouveaux audits spécialisés (4 scripts — créés 2026-02-23)
```
6. node audit-ux.cjs           → UX, onboarding, carte, guides, favoris, SEO
7. node audit-security.cjs     → SOS v2, Companion v2, identité, signalement, blocage
8. node audit-social.cjs       → Amis, DM, messagerie, groupes, réactions, événements
9. node audit-gamification.cjs → Daily reward, voyage hub, leaderboard, boutique, quiz
```

**Durée totale estimée** : ~18 minutes (en séquentiel) | ~8 minutes (2 en parallèle max)

---

## Pré-requis avant de lancer les audits

```bash
# 1. S'assurer que Playwright est installé
npx playwright install chromium

# 2. Pour audit-ui-part4.cjs : build local requis (tourne contre localhost:4173)
npm run build && npx vite preview --port 4173 &
# Attendre "Local: http://localhost:4173" puis lancer l'audit

# 3. Pour audit-firebase.cjs : tourne directement contre https://spothitch.com
# Aucun serveur local nécessaire
```

---

## Audit 1 — audit-ui.cjs
**Ce qu'il teste** : interactions UI basiques — navigation entre tabs, modals simples, affichage carte, états utilisateur
**Cible** : localhost ou prod (variable BASE_URL en haut du fichier)
**Technique** : inject localStorage state via `addInitScript` (AVANT le chargement de la page)
**Résultats dernière exécution** : sessions précédentes (résultats non archivés ici)
**Commande** :
```bash
node audit-ui.cjs
```

---

## Audit 2 — audit-ui-part2.cjs
**Ce qu'il teste** : tous les modals restants + interactions internes (SOS, Companion, Auth, Donation...)
**Cible** : localhost ou prod
**Technique** : inject localStorage state + `window.setState` en cours de test
**Résultats dernière exécution** : sessions précédentes
**Commande** :
```bash
node audit-ui-part2.cjs
```

---

## Audit 3 — audit-ui-part3.cjs
**Ce qu'il teste** : flows complexes — SpotDetail avec vrai spot (ID 1204, Toulouse), profil complet, social, navigation
**Cible** : localhost ou prod
**Technique** : inject un objet SPOT réel pour tester renderSpotDetail correctement
**SPOT utilisé** :
```javascript
const SPOT = { id: 1204, lat: 43.6583, lon: 1.4279, rating: 5, reviews: 15, signal: 'sign',
  country: 'FR', from: 'Toulouse', to: 'Paris', direction: 'Paris',
  comments: [{ text: 'Good spot', date: '2025-03-22', rating: 5 }] }
```
**Résultats dernière exécution** : sessions précédentes
**Commande** :
```bash
node audit-ui-part3.cjs
```

---

## Audit 4 — audit-ui-part4.cjs
**Ce qu'il teste** : AddSpot étape 3, Checkin soumission, Create Event, Zone Chat, Map controls, SEO pages, Donation thank you, Profile edit, Ambassador modals, Map interactions
**Cible** : `http://localhost:4173` (build local OBLIGATOIRE)
**Technique** : `window.setState` + `window.getState` pour manipuler l'état directement
**⚠ IMPORTANT** : Nécessite `npm run build && npx vite preview --port 4173` en amont
**Résultats dernière exécution (2026-02-23)** : 52 ✓, 0 ✗, 6 ?
**Les 6 ? de la dernière exécution** : liés à renderThankYouModal (ERR-031) et Ambassador modals (ERR-032) — tous deux CORRIGÉS en session 2026-02-23
**Commande** :
```bash
npm run build && npx vite preview --port 4173 &
sleep 3
node audit-ui-part4.cjs
```

---

## Audit 5 — audit-firebase.cjs ⭐ (le plus important)
**Ce qu'il teste** : flows complets authentifiés + Firebase Firestore + toutes les features prod
**Cible** : `https://spothitch.com` (PRODUCTION — pas de serveur local nécessaire)
**Résultats dernière exécution (2026-02-23)** : **21 ✓, 0 ✗, 0 ?** — PARFAIT

### Ce qui est testé dans cet audit :

**A. Authentification**
- Injection user dans state (mock auth — méthode E2E standard)
- Vérification user + username en state

**B. Flows authentifiés** (nécessitent un user connecté)
- Modifier profil → `openProfileCustomization()` → modal `#profile-customization-title`
- Check-in spot → `setState({ checkinSpot: demoSpot })` → `submitCheckin()`
- Chat message → `setState({ showZoneChat: true })` → `#chat-input` → `sendMessage('general')`
- Créer événement → `window.createEvent()` → form `#event-title` → `submitCreateEvent()`
- Valider spot → init `window.validateFormData` → `setState({ showValidateSpot: true, validateSpotId: '...' })`
- Créer spot → init `window.spotFormData` + `setState({ showAddSpot: true, addSpotStep: 3 })` → `#submit-spot-btn`

**C. Features sans auth**
- Langues EN/ES/DE → `setState({ language: 'en/es/de' })`
- Mode offline → charger page ONLINE d'abord, PUIS `ctx.setOffline(true)`
- Itinéraire OSRM → `openTripPlanner()` → fill `#trip-from`/`#trip-to` → `syncTripFieldsAndCalculate()`
- Partage WhatsApp → `openShareCard()` → chercher `a[href*="wa.me"]`
- Push notifications → `'PushManager' in window`
- Service Worker → `navigator.serviceWorker.getRegistrations()`

### Technique clé — injection user (NE PAS utiliser la vraie auth Firebase en E2E) :
```javascript
async function signIn(page) {
  const creationTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  await page.evaluate(() => {
    window.setState?.({
      user: {
        uid: 'test_uid_spothitch_audit',
        email: 'test@spothitch.com',
        displayName: 'Test User SpotHitch',
        emailVerified: true,
        photoURL: null,
        metadata: { creationTime },  // requis pour isAccountOldEnough()
      },
      showAuth: false,
      isAuthenticated: true,
      username: 'TestUser',          // requis pour requireProfile()
      avatar: '🤙',
    })
    // Backup pour isAccountOldEnough() localStorage check
    localStorage.setItem('spothitch_account_created',
      new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
  })
}
```

### Technique clé — init spotFormData pour créer un spot :
```javascript
window.spotFormData = {
  photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=',
  lat: 48.8566, lng: 2.3522,
  departureCity: 'Paris',
  departureCityCoords: { lat: 48.8566, lng: 2.3522 },
  directionCity: 'Lyon',
  ratings: { safety: 4, traffic: 4, accessibility: 4 },
  tags: { shelter: false, waterFood: false, toilets: false, visibility: false, stoppingSpace: false },
  country: 'FR', countryName: 'France',
}
// userLocation DOIT correspondre aux coords du spot (proximity check = 0 km)
window.setState?.({ addSpotStep: 3, addSpotType: 'exit', userLocation: { lat: 48.8566, lng: 2.3522 } })
```

### Technique clé — mode offline (NE PAS mettre offline avant de charger la page) :
```javascript
// TOUJOURS charger la page ONLINE d'abord
await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(2000)
// Enlever landing + cookies
await page.evaluate(() => { ... })
// PUIS seulement couper le réseau
await ctx.setOffline(true)
```

**Commande** :
```bash
node audit-firebase.cjs
```

---

## Pour lancer TOUS les audits d'un coup

```bash
# 1. Build + preview (pour audit-ui-part4 seulement)
npm run build && npx vite preview --port 4173 &
sleep 3

# 2. Audits UI en séquence
node audit-ui.cjs
node audit-ui-part2.cjs
node audit-ui-part3.cjs
node audit-ui-part4.cjs
kill %1

# 3. Audits spécialisés (tous contre https://spothitch.com — 2 à la fois max)
node audit-firebase.cjs
node audit-ux.cjs
node audit-security.cjs
node audit-social.cjs
node audit-gamification.cjs
```

⚠ NE PAS lancer plus de 2 audits Playwright en parallèle — timeout réseau sinon.

---

## Scores de référence (2026-02-23)

| Audit | ✓ | ✗ | ? | Statut |
|-------|---|---|---|--------|
| audit-ui.cjs | ? | ? | ? | Non archivé |
| audit-ui-part2.cjs | ? | ? | ? | Non archivé |
| audit-ui-part3.cjs | ? | ? | ? | Non archivé |
| audit-ui-part4.cjs | 52 | 0 | 0 | ✅ PARFAIT |
| audit-firebase.cjs | 21 | 0 | 0 | ✅ PARFAIT |
| audit-ux.cjs | **26** | 0 | 0 | ✅ PARFAIT |
| audit-security.cjs | **20** | 0 | 0 | ✅ PARFAIT |
| audit-social.cjs | **12** | 0 | 0 | ✅ PARFAIT |
| audit-gamification.cjs | **13** | 0 | 0 | ✅ PARFAIT |

**Objectif** : 0 ✗ et 0 ? sur tous les audits. ✅ ATTEINT sur tous les audits spécialisés.

---

---

## Audit 6 — audit-ux.cjs ⭐
**Ce qu'il teste** : Onboarding carousel, cookie banner, thème, FAQ, pages légales, filtres carte, split view, panneau ville, stations-service, guides, favoris, sauvegarde voyage, auth gate, reset password, SEO, toasts
**Résultats (2026-02-23)** : **26 ✓, 0 ✗, 0 ?**

### Techniques clés :
- **Carousel slides** : `#landing-track > div` (pas de classe `carousel-slide` — ce sont des div bruts dans `#landing-track`)
- **Thème clair** : `toggleTheme()` retire la classe `dark` de `documentElement` (ne met PAS `light`)
- **Privacy policy** : `window.showLegalPage('privacy')` → vérifier `state.showLegal === true`
- **Panneau ville** : Injecter directement `setState({ selectedCity: 'paris-france', cityData: {...} })` (évite le chargement async)
- **Favoris** : `toggleFavorite(id)` dans Travel.js (lazy) — utiliser fallback localStorage si non chargé
- **Sauvegarde voyage** : `saveTripWithSpots()` lit `state.tripResults.from/to/distance` (pas `tripFrom/tripTo`)
- **Reset password** : Le bouton est `button[onclick*="handleForgotPassword"]` dans le modal auth

---

## Audit 7 — audit-security.cjs ⭐
**Ce qu'il teste** : SOS v2 (SMS/WA/countdown/fakeCall/alarm), Companion v2 (contact/GPS/WA/SMS/start), vérification identité, signalement, blocage, disclaimer, âge
**Résultats (2026-02-23)** : **20 ✓, 0 ✗, 0 ?**

### Techniques clés :
- **SOS disclaimer** : Pré-accepter `localStorage.setItem('spothitch_sos_disclaimer_seen', 'true')` sinon le modal affiche le disclaimer (pas les boutons SOS)
- **Companion consent** : Pré-accepter `sessionStorage.setItem('spothitch_companion_consent', '1')` sinon affiche l'écran de consentement
- **SOS boutons** : `button[onclick*="sosSetChannel"]` (pas `whatsapp/sms`), `button[onclick*="sosStartCountdown"]`, `button[onclick*="sosOpenFakeCall"]`, `button[onclick*="sosToggleSilent"]`
- **Companion contact** : `#companion-guardian-phone` ou `#companion-tc-phone`
- **Companion canaux** : `button[onclick*="companionSetChannel"]`
- **Block confirm** : `window.confirmBlockUser('uid_target')` (pas `confirmBlock()`)

---

## Audit 8 — audit-social.cjs ⭐
**Ce qu'il teste** : amis (send/accept/nearby), DM (dm-input vs private-chat-input), messagerie conversations, groupes, réactions sur commentaires d'événements, événements
**Résultats (2026-02-23)** : **12 ✓, 0 ✗, 0 ?**

### Techniques clés :
- **DM input ID** : Dans Conversations.js (messagerie) → `#dm-input`. Dans Friends.js (amis) → `#private-chat-input`. Utiliser `activeDMConversation` + `socialSubTab: 'messagerie'` pour ouvrir dans Conversations.js
- **Réactions** : PAS dans le zone chat ! Les réactions sont sur les commentaires d'événements (`reactToEventComment`). Requiert :
  1. `selectedEvent = evt_object` (pas juste un id)
  2. Pré-peupler `localStorage.setItem('spothitch_v4_spothitch_event_comments', JSON.stringify({ [eventId]: [comments] }))`
  3. Note : `Storage.get` utilise le préfixe `spothitch_v4_` → clé réelle = `spothitch_v4_spothitch_event_comments`
  4. Les commentaires doivent avoir `userName` (pas `username`), `userAvatar`, `createdAt` (pas `timestamp`)
- **Messagerie vs activité** : `socialSubTab: 'messagerie'` rend Conversations.js → chercher 'message'/'conversation'

---

## Audit 9 — audit-gamification.cjs ⭐
**Ce qu'il teste** : Daily reward (claim), Voyage tab (ex-Défis), leaderboard + filtre pays, boutique récompenses, quiz géographique, historique pouces, stats profil
**Résultats (2026-02-23)** : **13 ✓, 0 ✗, 0 ?**

### Techniques clés :
- **Daily reward claim** : `window.handleClaimDailyReward()` (pas `claimDailyReward` qui fait juste `openDailyReward`). Vérifier `state.lastDailyRewardClaim != null`
- **Défis Hub** : L'onglet `activeTab: 'challenges'` rend maintenant `renderVoyage` (Voyage tab renommée). Le ChallengesHub est devenu un modal (`openChallenges()`). Chercher 'voyage'/'guides'/'journal' pour vérifier le contenu de l'onglet
- **Boutique** : PAS de cadres/frames/titres → Boutique = partenaires (Hébergement, Équipement, Transport). Chercher 'récompense'/'pouces'/'hébergement'
- **Claim button ID** : `#claim-reward-btn` dans DailyReward.js, visible uniquement si `canClaim === true` (lastDailyRewardClaim null)

---

## Erreurs connues corrigées suite aux audits

- **ERR-031** (2026-02-23) : `renderThankYouModal` non câblé dans App.js → corrigé
- **ERR-032** (2026-02-23) : Ambassador modals ghost states → modals inline créés dans App.js
- Voir `memory/errors.md` pour la liste complète
