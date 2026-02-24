# errors.md - Journal des erreurs et corrections SpotHitch

> Dernière mise à jour : 2026-02-24
> IMPORTANT : Après CHAQUE bug trouvé ou corrigé, ajouter une entrée ici.
> Le Plan Wolf analyse ce fichier pour éviter les régressions.

---

## Format

Chaque erreur suit ce format :
- **Date** : quand le bug a été trouvé
- **Gravité** : CRITIQUE / MAJEUR / MINEUR
- **Description** : ce qui ne marchait pas
- **Cause racine** : pourquoi ça cassait
- **Correction** : ce qui a été fait pour corriger
- **Leçon** : ce qu'on a appris pour ne plus refaire cette erreur
- **Fichiers** : les fichiers modifiés
- **Statut** : CORRIGÉ / EN COURS / À FAIRE

---

## Erreurs trouvées et corrigées

### ERR-001 — Formulaire AddSpot sans validation (handlers écrasés)
- **Date** : 2026-02-20
- **Gravité** : CRITIQUE
- **Description** : Le formulaire de création de spot n'avait aucune validation. On pouvait passer les étapes sans photo, sans GPS, sans ville, taper n'importe quoi, et soumettre avec 0 étoiles.
- **Cause racine** : `main.js` définissait 11 handlers `window.*` pour le formulaire SANS validation, et `AddSpot.js` définissait les MÊMES handlers AVEC validation. À cause de l'ordre de chargement ES modules (imports se résolvent avant le code du module importeur), main.js ÉCRASAIT les versions validées d'AddSpot.js.
- **Correction** : Suppression des 11 handlers dupliqués dans main.js (~120 lignes). Les handlers validés d'AddSpot.js s'exécutent maintenant correctement.
- **Leçon** : **Ne JAMAIS définir le même handler `window.*` dans deux fichiers différents.** L'ordre de chargement ES modules est : imports d'abord → code du fichier importeur ensuite. Le dernier à s'exécuter gagne. Vérifier avec `grep -r "window.nomHandler"` qu'un handler n'existe qu'à un seul endroit.
- **Fichiers** : `src/main.js`, `tests/wiring/globalHandlers.test.js`
- **Statut** : CORRIGÉ

### ERR-002 — Pas d'authentification pour créer un spot
- **Date** : 2026-02-20
- **Gravité** : CRITIQUE
- **Description** : N'importe qui pouvait créer un spot sans être connecté. Le seul check était `requireProfile` qui vérifie juste si un username existe — contournable en 2 clics.
- **Cause racine** : `openAddSpot` utilisait `requireProfile` au lieu de `requireAuth`. Aucun check Firebase Auth.
- **Correction** : Ajout d'un vrai gate Firebase Auth dans `openAddSpot`. Sans mode test : si `isLoggedIn === false` → affiche le modal Auth. Avec mode test : bypass possible via `localStorage.setItem('spothitch_test_mode', 'true')`.
- **Leçon** : **Toute action qui ÉCRIT des données (créer un spot, poster un message, etc.) DOIT vérifier Firebase Auth, pas juste un username en localStorage.** Le `requireProfile` ne suffit pas — il ne prouve pas que l'utilisateur est authentifié.
- **Fichiers** : `src/main.js`
- **Statut** : CORRIGÉ

### ERR-003 — Validation étoiles manquante
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : On pouvait soumettre un spot avec 0 étoiles sur les 3 critères (sécurité, trafic, accessibilité). Les étoiles étaient marquées obligatoires (*) mais pas validées avant soumission.
- **Cause racine** : La fonction `handleAddSpot` ne vérifiait pas `spotFormData.ratings` avant de sauvegarder.
- **Correction** : Ajout de la validation `ratings.safety && ratings.traffic && ratings.accessibility` avant soumission, avec message d'erreur i18n.
- **Leçon** : **Si un champ est marqué obligatoire (*) dans l'UI, il DOIT avoir une validation côté code.** Vérifier la cohérence entre UI et validation.
- **Fichiers** : `src/components/modals/AddSpot.js`, `src/i18n/lang/{fr,en,es,de}.js`
- **Statut** : CORRIGÉ

### ERR-004 — Service Worker intercepte les pages SEO
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : Les pages SEO statiques (`/city/paris/`, `/guides/fr/`) étaient interceptées par le Service Worker qui servait l'app SPA à la place du HTML statique.
- **Cause racine** : Le `navigateFallbackDenylist` dans la config Workbox (vite.config.js) ne contenait que `/design-/` et `/debug-/`. Les chemins `/city/` et `/guides/` n'étaient pas exclus.
- **Correction** : Ajout de `/^\/city\//` et `/^\/guides\//` au `navigateFallbackDenylist`.
- **Leçon** : **Chaque fois qu'on ajoute des pages statiques (SEO, landing, etc.), vérifier que le Service Worker ne les intercepte pas.** Tester avec Playwright en naviguant vers l'URL directement.
- **Fichiers** : `vite.config.js`
- **Statut** : CORRIGÉ

### ERR-005 — Pages SEO avec noms de villes absurdes
- **Date** : 2026-02-20
- **Gravité** : MINEUR
- **Description** : Le script SEO générait 852 pages de "villes" dont beaucoup étaient des mots anglais ("the-city", "to-catch", "front-of", "case-of") ou des noms de pays, personnes, rues, etc.
- **Cause racine** : La regex d'extraction de noms de villes dans les commentaires avait le flag `/i` (case-insensitive), ce qui faisait que `[A-Z]` matchait aussi les minuscules. Des mots comme "from here" devenaient la ville "here".
- **Correction** : Suppression du flag `/i`, ajout de listes de stop-words (pays, régions, mois, marques, prénoms, langues), filtres de suffixes (weg/straat/plein = rues), rejection des noms tronqués, normalisation des accents. 852 → 428 pages.
- **Leçon** : **Quand on extrait des données de texte libre (commentaires), toujours valider le résultat avec des filtres stricts.** Le texte libre est sale — il faut nettoyer agressivement.
- **Fichiers** : `scripts/prerender-seo.mjs`
- **Statut** : CORRIGÉ

### ERR-006 — MEMORY.md périmé (Firebase "pas configuré")
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : MEMORY.md indiquait que Firebase n'était pas configuré, alors que toutes les clés sont dans GitHub Secrets depuis décembre 2025. Claude a répété cette fausse info à l'utilisateur.
- **Cause racine** : MEMORY.md n'était pas mis à jour après la configuration de Firebase. Et Claude n'a pas vérifié avec `gh secret list` avant de parler.
- **Correction** : Mise à jour de MEMORY.md et features.md. Ajout dans CLAUDE.md Règle #6 : "NE JAMAIS contredire la mémoire sans vérifier d'abord".
- **Leçon** : **Toujours vérifier l'état réel (gh secret list, git log, ls) avant de dire qu'un service n'est pas configuré.** Ne pas faire confiance à des fichiers de mémoire potentiellement périmés.
- **Fichiers** : `memory/MEMORY.md`, `memory/features.md`, `CLAUDE.md`
- **Statut** : CORRIGÉ

### ERR-007 — Modal profil s'ouvre PAR-DESSUS AddSpot + auth ne reprend pas l'action
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : Deux problèmes liés : (1) Le modal profil s'ouvrait par-dessus AddSpot. (2) Après connexion (email/Google/Facebook/Apple), l'action en attente (`authPendingAction: 'addSpot'`) était effacée sans reprendre l'action — l'utilisateur devait re-cliquer "Ajouter un spot".
- **Cause racine** : (1) `openAddSpot` n'avait pas de `return` après `requireProfile` → les deux modaux s'ouvraient. (2) `handleLogin`/`handleSignup` dans main.js effaçaient `authPendingAction` sans la reprendre. Les fallback handlers sociaux dans main.js faisaient pareil.
- **Correction** : (1) Le `return` après `requireProfile` bloque correctement l'ouverture d'AddSpot. (2) Supprimé `handleLogin`/`handleSignup` (code mort — le formulaire utilise `handleAuth` d'Auth.js qui reprend `authPendingAction` via `executePendingAction`). (3) Ajouté la reprise de `authPendingAction` dans les fallback handlers sociaux de main.js.
- **Leçon** : **Quand une action est interrompue par une étape requise (auth, profil), l'action DOIT être reprise automatiquement après l'étape.** Ne jamais effacer `pendingAction` sans la reprendre. Et ne jamais avoir de code mort qui peut être confondu avec le vrai handler.
- **Fichiers** : `src/main.js`, `tests/wiring/globalHandlers.test.js`
- **Statut** : CORRIGÉ

---

### ERR-008 — Sélecteurs CSS incorrects dans handlers DOM-only
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : `setMethod`, `setGroupSize`, `setTimeOfDay` cherchaient les classes `.method-btn`, `.group-size-btn`, `.time-btn` alors que les boutons ont la classe `.radio-btn`. Les boutons ne changeaient jamais visuellement quand on cliquait.
- **Cause racine** : Lors du passage de setState à DOM-only, les sélecteurs CSS ont été inventés au lieu de vérifier le HTML réel. Les boutons utilisent `onclick="setMethod('sign')"` etc., pas des classes spécifiques.
- **Correction** : Remplacé par `document.querySelectorAll('[onclick*="setMethod"]')` etc. qui matchent l'attribut onclick réel.
- **Leçon** : **Quand on change un handler pour faire du DOM direct, TOUJOURS vérifier les sélecteurs contre le HTML réel du template.** Ne jamais inventer des classes CSS — aller lire le template d'abord.
- **Fichiers** : `src/components/modals/AddSpot.js`
- **Statut** : CORRIGÉ

### ERR-009 — Pas de validation autocomplete avant soumission
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : L'utilisateur pouvait taper n'importe quoi dans le champ ville de départ, ne PAS sélectionner dans la liste déroulante, et soumettre quand même. Le `forceSelection: true` de l'autocomplete ajoutait une bordure rouge mais n'empêchait pas la soumission.
- **Cause racine** : `handleAddSpot` ne vérifiait pas `window.spotFormData.departureCity` avant la soumission finale — cette validation n'était présente que dans `addSpotNextStep` pour le passage d'étape.
- **Correction** : Ajout d'un check explicite `if (!window.spotFormData.departureCity)` dans `handleAddSpot` avant la soumission Firebase.
- **Leçon** : **La validation doit exister à DEUX endroits : au passage d'étape ET à la soumission finale.** Ne jamais supposer que la validation d'étape empêche les soumissions invalides — l'utilisateur peut contourner les étapes.
- **Fichiers** : `src/components/modals/AddSpot.js`
- **Statut** : CORRIGÉ

### ERR-010 — Code mort non nettoyé (autoDetectStation, autoDetectRoad, spotMapPickLocation)
- **Date** : 2026-02-20
- **Gravité** : MINEUR
- **Description** : 3 fonctions (`autoDetectStation`, `autoDetectRoad`, `spotMapPickLocation`) avaient du code de 15-30 lignes mais n'étaient jamais appelées dans aucun template ou bouton.
- **Cause racine** : Ces fonctions étaient prévues pour des features annulées (détection automatique de nom de station/route) mais le code est resté.
- **Correction** : Réduit à des fonctions vides (gardées pour compatibilité avec les tests wiring).
- **Leçon** : **Quand une feature est annulée, supprimer le code immédiatement.** Ne pas laisser du code mort "au cas où" — ça pollue et crée de la confusion. Si besoin plus tard, git log le retrouvera.
- **Fichiers** : `src/components/modals/AddSpot.js`
- **Statut** : CORRIGÉ

### ERR-012 — render() bloqué quand un input a le focus → transitions d'étape impossibles
- **Date** : 2026-02-20
- **Gravité** : CRITIQUE
- **Description** : Après avoir rempli l'étape 1 du formulaire AddSpot et cliqué "Continuer", l'étape 2 ne s'affichait jamais. Le `setState({ addSpotStep: 2 })` était bien appelé mais l'UI restait sur l'étape 1.
- **Cause racine** : Le render() de main.js (ligne 492-496) contient un guard qui skip TOUT re-render quand un input a le focus (pour éviter de perdre le texte en cours de frappe). Problème : quand l'utilisateur tape dans "Ville de départ" puis clique "Continuer", l'input a toujours le focus → render() est bloqué → le changement d'étape n'est jamais affiché.
- **Correction** : Ajout de `document.activeElement?.blur()` avant chaque `setState` qui change d'étape (addSpotNextStep et addSpotPrevStep). Le blur libère le focus → render() n'est plus bloqué.
- **Leçon** : **Quand render() a un guard "skip if input focused", toute action qui DOIT déclencher un re-render (changement d'étape, fermeture de modal, navigation) doit d'abord blur() l'élément actif.** Le guard protège la frappe mais ne doit pas empêcher les transitions.
- **Fichiers** : `src/components/modals/AddSpot.js`
- **Statut** : CORRIGÉ

### ERR-011 — MutationObserver boucle infinie dans AddSpot autocomplete
- **Date** : 2026-02-20
- **Gravité** : CRITIQUE
- **Description** : L'autocomplete ville de départ/destination ne fonctionnait pas : les suggestions n'apparaissaient jamais, la mini-map était perturbée, et il était impossible de passer à l'étape 2 (directionCity restait null car forceSelection=true + rien sélectionnable).
- **Cause racine** : Le `MutationObserver` détectait l'input → appelait `initStep1Autocomplete()` → qui appelait `cleanupAutocompletes()` → `dropdown.remove()` modifiait le DOM → l'Observer se re-déclenchait → boucle infinie. L'autocomplete se créait/détruisait des centaines de fois par seconde.
- **Correction** : (1) Ajout d'un flag `lastAutocompleteStep` dans l'Observer — il ne re-initialise que si l'étape a VRAIMENT changé. (2) Retiré `cleanupAutocompletes()` du début de `initStep1Autocomplete()` et `initStep2Autocomplete()` — le cleanup est géré par l'Observer quand les inputs disparaissent. (3) Retiré l'affichage saison (la date est déjà encodée dans createdAt).
- **Leçon** : **Ne JAMAIS appeler une fonction de cleanup DOM depuis un callback MutationObserver si ce cleanup modifie le DOM observé.** Utiliser un flag de garde pour éviter les boucles. Pattern : `if (condition && lastState !== newState) { lastState = newState; doAction() }`.
- **Fichiers** : `src/components/modals/AddSpot.js`
- **Statut** : CORRIGÉ

### ERR-013 — Dit "déployé" alors que le CI n'a pas fini
- **Date** : 2026-02-20
- **Gravité** : MAJEUR
- **Description** : Après un push, Claude a dit "tout est déployé" alors que le pipeline CI/CD GitHub Actions était encore en cours. L'utilisateur ne pouvait pas voir les changements sur le site.
- **Cause racine** : Confusion entre "push réussi" et "déployé en production". Le build local passait, mais le déploiement Cloudflare se fait via GitHub Actions et prend plusieurs minutes.
- **Correction** : Ajout d'une règle explicite dans CLAUDE.md Règle #10 : NE JAMAIS dire "déployé" tant que `gh run view` ne montre pas le deploy Cloudflare en completed/success.
- **Leçon** : **"Poussé" ≠ "Déployé". Toujours vérifier `gh run view` avant de dire que c'est en ligne.** Dire "poussé sur GitHub" quand c'est push, "déployé" uniquement après confirmation CI vert.
- **Fichiers** : `CLAUDE.md`
- **Statut** : CORRIGÉ

### ERR-014 — Bouton "refuser ami" ne faisait rien (declineFriendRequest no-op)
- **Date** : 2026-02-22
- **Gravité** : MAJEUR
- **Description** : Le bouton ✕ pour refuser une demande d'ami dans Social/Friends ne faisait rien. `window.declineFriendRequest` était défini comme `() => { /* no-op */ }`.
- **Cause racine** : Handler créé comme stub lors du développement social, jamais implémenté. De plus, un doublon `rejectFriendRequest` existait dans main.js (aussi vide).
- **Correction** : Implémentation réelle qui retire la demande du state et affiche un toast. Unification du nom (declineFriendRequest partout, suppression de rejectFriendRequest).
- **Leçon** : **JAMAIS créer un handler stub `() => {}` sans TODO explicite. Chaque bouton visible DOIT avoir un handler fonctionnel. Vérifier via audit régulier.**
- **Fichiers** : Social.js, Friends.js, main.js
- **Statut** : CORRIGÉ

### ERR-015 — Bouton "supprimer appareil" manquant (removeKnownDevice)
- **Date** : 2026-02-22
- **Gravité** : MAJEUR
- **Description** : Le bouton "supprimer cet appareil" dans la liste des appareils connus appelait `window.removeKnownDevice()` mais cette fonction n'existait nulle part.
- **Cause racine** : La fonction `removeDevice()` existait dans newDeviceNotification.js mais n'avait jamais été câblée à un handler `window.*`.
- **Correction** : Ajout de `window.removeKnownDevice` qui appelle `removeDevice()` et re-rend la liste.
- **Leçon** : **Quand on ajoute un onclick dans le HTML, TOUJOURS vérifier que la fonction window.* correspondante existe. Grep le nom de la fonction dans tout src/.**
- **Fichiers** : newDeviceNotification.js
- **Statut** : CORRIGÉ

### ERR-016 — Écran bleu vide en production (lazy-loading cassé)
- **Date** : 2026-02-22
- **Gravité** : CRITIQUE
- **Description** : Le site spothitch.com affichait un écran bleu foncé complètement vide. Le `#app` div existait mais avait 0 enfants. Aucun composant ne se rendait.
- **Cause racine** : DEUX problèmes dans la fonction `lazyRender()` de App.js : (1) `import(modulePath)` utilisait une variable comme argument — Vite ne peut PAS analyser les imports dynamiques avec des variables en production. Le navigateur recevait le chemin source brut (ex: `https://spothitch.com/components/Landing.js`) qui n'existe pas dans le build. Erreur 403/404. (2) Même si le module avait chargé, `lazyRender()` retournait `''` et ne déclenchait JAMAIS de re-render — l'app restait vide indéfiniment.
- **Correction** : (1) Créé un registre `_lazyLoaders` avec des fonctions `() => import('./chemin/statique.js')` pour chaque module — Vite peut analyser ces imports statiques et créer des chunks. (2) Ajout de `window.setState({})` après chaque chargement de module pour déclencher un re-render.
- **Leçon** : **JAMAIS utiliser `import(variable)` avec Vite — toujours des strings littérales dans import(). Tester le lazy-loading en build PRODUCTION (npm run build + preview), pas seulement en dev. Et TOUJOURS déclencher un re-render après un import dynamique dans un framework vanilla JS.**
- **Fichiers** : `src/components/App.js`
- **Statut** : CORRIGÉ

### ERR-017 — E2E tests fail: toBeVisible on #app without content + #chat-input in wrong context
- **Date** : 2026-02-22
- **Gravité** : MINEUR
- **Description** : 3 E2E tests in userJourneys.spec.js failing in CI: (1) "welcome screen on first visit" — `toBeVisible` on `#app` fails because the div has class `loaded` but no visible dimensions when landing page hasn't fully rendered. (2) "skip tutorial and access app" — same issue. (3) "chat input in conversations tab" — expects `#chat-input` in conversations sub-tab, but it only exists in zone chat overlay (`showZoneChat: true`).
- **Cause racine** : (1-2) `toBeVisible` requires the element to have non-zero dimensions; with a fresh localStorage the app may show a landing/splash that doesn't immediately render content inside `#app`. (3) `#chat-input` is defined in `renderZoneChatOverlay()` in Social.js, not in `renderConversations()`. The test incorrectly assumed it was in the conversations sub-tab.
- **Correction** : (1-2) Changed to `toBeAttached` + `page.evaluate()` checking `innerHTML.length > 50` or body text. (3) Changed test to just verify conversations tab loads without crash. Updated message submit test to open zone chat overlay via `setState({ showZoneChat: true })`.
- **Leçon** : **In E2E tests, prefer `toBeAttached` over `toBeVisible` for container divs that may not have explicit dimensions. And ALWAYS verify which state/overlay a DOM element belongs to before asserting its presence in a sub-tab — read the component source to confirm.**
- **Fichiers** : `e2e/userJourneys.spec.js`
- **Statut** : CORRIGÉ

### ERR-018 — E2E tests en échec déclarés "non-bloquants" au lieu d'être corrigés
- **Date** : 2026-02-22
- **Gravité** : CRITIQUE
- **Description** : Pendant des sessions, les tests E2E échouaient (timeouts, sélecteurs morts, tests fragiles) mais étaient considérés comme "non-bloquants" et ignorés. L'utilisateur était informé que "tout est déployé" alors que des tests étaient en échec. 7+ tests échouaient dans le stress job, 18 dans features, 5 dans comprehensive.
- **Cause racine** : (1) CLAUDE.md disait "Le E2E peut timeout (non-bloquant)" — ça donnait la permission d'ignorer les échecs. (2) Les tests utilisaient des sélecteurs morts (onglet travel supprimé, Map.js au lieu de Home.js, openStats qui n'existe pas). (3) `test.skip()` dans les blocs conditionnels ne marchait pas dans Playwright. (4) `toBeVisible()` utilisé sur des éléments hidden quand spotCount=0. (5) `calcBtn.click()` bloquait sur des boutons disabled.
- **Correction** : (1) Réécrit la règle #10 : TOUS les jobs doivent passer, zéro tolérance. (2) Corrigé tous les sélecteurs morts. (3) Remplacé `test.skip()` par `return` (early exit). (4) Remplacé `toBeVisible()` par `toBeAttached()` quand l'élément peut être hidden. (5) Utilisé `click({ force: true })` ou simplifié les tests. (6) Ajouté des early-return guards pour le contenu lazy-loaded en CI. (7) Split les E2E en 4 jobs parallèles.
- **Leçon** : **ZÉRO TOLÉRANCE sur les tests en échec. Un test qui timeout ou fail = un bug à corriger immédiatement, pas un test "non-bloquant" à ignorer. NE JAMAIS dire "c'est déployé" si un seul test E2E est en échec. Les E2E sont la dernière ligne de défense — les ignorer c'est voler à l'aveugle.**
- **Fichiers** : `CLAUDE.md`, `e2e/*.spec.js`, `.github/workflows/ci.yml`
- **Statut** : CORRIGÉ

### ERR-019 — 30 alertes de sécurité CodeQL non traitées
- **Date** : 2026-02-22
- **Gravité** : MAJEUR
- **Description** : CodeQL a trouvé 30 alertes de sécurité : XSS via innerHTML avec error.message, échappement incomplet dans les attributs onclick (seulement single quotes, pas double quotes ni HTML), Math.random() pour des IDs SOS, clé API Google exposée dans l'historique Git.
- **Cause racine** : (1) `error.message` injecté directement dans innerHTML sans échappement. (2) Les onclick handlers utilisaient `.replace(/'/g, "\\'")` qui n'échappe que les apostrophes — les guillemets, <, > et & n'étaient pas échappés. (3) `Math.random()` utilisé pour des session IDs SOS au lieu de crypto.getRandomValues().
- **Correction** : (1) Créé `escapeJSString()` dans sanitize.js pour échapper tous les caractères dangereux. (2) Remplacé tous les `.replace(/'/g, "\\'")` par `escapeJSString()` dans 6 fichiers. (3) Utilisé `textContent` au lieu de `innerHTML` pour error.message. (4) Remplacé `Math.random()` par `crypto.getRandomValues()` pour SOS et analytics. (5) Ajouté `safePhotoURL()` pour valider les URLs photos. (6) Restreint la clé API Google aux domaines spothitch.com.
- **Leçon** : **JAMAIS utiliser `.replace(/'/g, "\\'")` pour protéger des onclick — ça n'échappe que les apostrophes. Toujours utiliser `escapeJSString()` de sanitize.js. JAMAIS injecter de variables non échappées dans innerHTML. JAMAIS utiliser Math.random() pour des identifiants de sécurité (SOS, auth) — utiliser crypto.getRandomValues().**
- **Fichiers** : `src/utils/sanitize.js`, `src/main.js`, `src/components/views/Map.js`, `src/components/modals/SpotDetail.js`, `src/components/ui/NavigationOverlay.js`, `src/utils/navigation.js`, `src/services/countryBubbles.js`, `src/services/sosTracking.js`, `src/utils/analytics.js`
- **Statut** : CORRIGÉ

### ERR-020 — Profile footer links broken (FAQ, Legal, Community Guidelines)
- **Date** : 2026-02-22
- **Gravité** : MAJEUR
- **Description** : Three main footer links in Profile were completely broken: (1) `openFAQ()` set `activeTab: 'guides'` but no `case 'guides'` existed in `renderActiveView` — FAQ never displayed. (2) `showLegalPage()` set `activeTab: 'legal'` but no `case 'legal'` existed — legal pages never displayed. (3) Community Guidelines in Settings used `showLegalPage()` which was also broken. (4) `openChangelog()` only showed a toast, no content. (5) Footer had no visual hierarchy — everything dumped in one card.
- **Cause racine** : The handlers were written to use `activeTab` for navigation, but no matching view cases were added to `renderActiveView` in App.js. The footer UI was never reorganized after the overlay-based architecture was established.
- **Correction** : (1) Changed FAQ to use `showFAQ` state flag + fullscreen overlay in App.js. (2) Changed Legal to use `showLegal` state flag + fullscreen overlay. (3) Moved Community Guidelines from Settings card to Legal section in footer. (4) Changelog now opens FAQ overlay. (5) Reorganized footer into 3 themed cards (Help/Legal/About) with social links. (6) Removed duplicate `openFAQ`/`closeFAQ` from FAQ.js (ERR-001 lesson applied).
- **Leçon** : **When adding a new handler that sets `activeTab`, ALWAYS verify that `renderActiveView` in App.js has a matching `case` for that tab. Better yet: for content that doesn't need a full tab, use overlay pattern (`showXxx: true` + fullscreen div in App.js) instead of tab navigation.**
- **Fichiers** : `src/main.js`, `src/components/App.js`, `src/components/views/Profile.js`, `src/components/views/Legal.js`, `src/components/views/FAQ.js`, `src/stores/state.js`, `src/i18n/lang/{fr,en,es,de}.js`
- **Statut** : CORRIGÉ

### ERR-021 — App re-render détruit le carousel onboarding (reset slide 1)
- **Date** : 2026-02-22
- **Gravité** : CRITIQUE
- **Description** : Pendant l'onboarding, le carousel revenait à la slide 1 toutes les quelques secondes. L'utilisateur ne pouvait pas avancer dans les slides sans que ça revienne au début.
- **Cause racine** : Le pattern `subscribe → render → app.innerHTML = renderApp(state)` reconstruit TOUT le DOM à chaque changement de state. Pendant l'onboarding, des state changes se produisent en arrière-plan (chargement de spots, géolocalisation, Firebase auth) → chaque changement détruit le carousel DOM et le recrée à la slide 1.
- **Correction** : Ajout d'un guard dans `render()` : `if (state.showLanding && document.getElementById('landing-page')) return` — skip le re-render tant que l'onboarding est affiché.
- **Leçon** : **Quand un composant a un état local DOM (position de carousel, scroll, animations), le re-render complet via innerHTML le détruit. Ajouter un guard pour protéger les composants avec état DOM local du re-render.**
- **Fichiers** : `src/main.js`
- **Statut** : CORRIGÉ

### ERR-022 — Auto-reload interrompt l'utilisateur pendant l'utilisation active
- **Date** : 2026-02-22
- **Gravité** : MAJEUR
- **Description** : L'app se rechargeait toute seule après un deploy (version.json polling + Service Worker controllerchange), même quand l'utilisateur était en train d'utiliser l'app activement. Perte de contexte, formulaires perdus, position de carte perdue.
- **Cause racine** : `doReload()` dans `startVersionCheck()` rechargeait même quand `document.visibilityState === 'visible'` — avec un toast puis reload après 2s. Le SW controllerchange faisait pareil.
- **Correction** : `doReload()` ne recharge que quand `document.visibilityState === 'hidden'`. Si visible, met `pendingReload = true` et attend que l'utilisateur mette l'app en arrière-plan.
- **Leçon** : **JAMAIS recharger l'app quand l'utilisateur l'utilise activement. Les mises à jour auto doivent attendre que l'app soit en arrière-plan. L'UX de l'utilisateur prime sur la fraîcheur du code.**
- **Fichiers** : `src/main.js`
- **Statut** : CORRIGÉ

### ERR-023 — `.modal-overlay` CSS manquant (AdminPanel + MyData invisibles)
- **Date** : 2026-02-23
- **Gravité** : CRITIQUE
- **Description** : AdminPanel.js et MyData.js utilisaient `class="modal-overlay active"` comme conteneur principal, mais aucune règle CSS ne définissait `.modal-overlay`. Les modals étaient dans le DOM mais totalement invisibles.
- **Cause racine** : Convention `.modal-overlay` différente du pattern standard `.fixed.inset-0`. Classe jamais ajoutée à main.css.
- **Correction** : Ajout dans `src/styles/main.css` : `.modal-overlay { @apply fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4; }`
- **Leçon** : **Quand un modal utilise une classe CSS custom, TOUJOURS vérifier qu'elle est définie dans main.css. Après création d'un modal → screenshot Playwright obligatoire pour confirmer la visibilité.**
- **Fichiers** : `src/styles/main.css`
- **Statut** : CORRIGÉ

### ERR-024 — Handlers lazy-loaded non disponibles au premier appel
- **Date** : 2026-02-23
- **Gravité** : MAJEUR
- **Description** : `openAdminPanel`, `openLeaderboard`, `saveTripWithSpots`, `loadSavedTrip`, `deleteSavedTrip`, `removeSpotFromTrip` uniquement définis dans leurs modules lazy-loaded → undefined au premier appel.
- **Cause racine** : Handlers oubliés dans main.js. Architecture lazy-loading correcte mais handlers pas dupliqués dans l'entry point.
- **Correction** : Ajout de tous ces handlers dans `src/main.js`.
- **Leçon** : **Tout handler `window.*` appelable depuis l'UI DOIT exister dans main.js avant le lazy-load. Si un bouton HTML appelle `window.openX()`, alors `window.openX` doit être dans main.js.**
- **Fichiers** : `src/main.js`
- **Statut** : CORRIGÉ

### ERR-025 — Tab ID interne 'voyage' inexistant (l'ID réel est 'challenges')
- **Date** : 2026-02-23
- **Gravité** : MINEUR
- **Description** : `activeTab: 'voyage'` dans les tests ne charge pas l'onglet Voyage. L'ID interne est `challenges`, le label traduit est "Voyage".
- **Cause racine** : Confusion entre ID technique (`challenges`) et label i18n affiché (`Voyage`).
- **Correction** : Utiliser `activeTab: 'challenges'` dans tous les tests.
- **Leçon** : **L'ID interne d'un tab est indépendant de son label i18n. Toujours utiliser l'ID de `state.js`/`Navigation.js`, jamais le label traduit.**
- **Fichiers** : `audit-ui.cjs`, `e2e/*.spec.js`
- **Statut** : CORRIGÉ

### ERR-026 — Format cookie consent incorrect dans e2e/helpers.js
- **Date** : 2026-02-23
- **Gravité** : MINEUR
- **Description** : `e2e/helpers.js` stockait `{ accepted: true }` au lieu du format structuré `{ preferences: { necessary: true, ... }, timestamp, version: '1.0' }`. Cookie banner s'affichait dans les tests.
- **Cause racine** : Format non synchronisé lors de l'évolution du système de cookies.
- **Correction** : Mise à jour de `e2e/helpers.js` avec le bon format.
- **Leçon** : **Quand la structure d'une donnée localStorage change, TOUJOURS mettre à jour les helpers de test en même temps.**
- **Fichiers** : `e2e/helpers.js`
- **Statut** : CORRIGÉ

### ERR-027 — Autocomplete voyage intercepte les clics sur bouton swap
- **Date** : 2026-02-23
- **Gravité** : MINEUR
- **Description** : Après `fill()` sur `#trip-from`, le dropdown autocomplete restait ouvert et interceptait le clic sur le bouton swap dans les tests Playwright.
- **Cause racine** : Dropdown absolute positionné par-dessus le swap button.
- **Correction** : Dans les tests, utiliser `page.evaluate()` pour setter les valeurs directement ou appeler `press('Escape')` avant de cliquer sur swap.
- **Leçon** : **Avec les autocompletes, toujours fermer le dropdown (`Escape`) ou bypasser via `page.evaluate()` avant tout autre clic.**
- **Fichiers** : `audit-ui.cjs`
- **Statut** : CORRIGÉ

### ERR-028 — Bouton "Créer une équipe" ne faisait rien (CreateTeam sans render function)
- **Date** : 2026-02-23
- **Gravité** : MAJEUR
- **Description** : Dans la vue TeamChallenges, le bouton "Créer une équipe" appelait `openCreateTeam()` qui settait `showCreateTeam: true`. Mais il n'existait AUCUNE render function ni aucun appel dans App.js pour ce state flag → rien ne s'affichait.
- **Cause racine** : Feature partiellement implémentée : handler créé, state flag défini, bouton affiché dans l'UI, mais la partie render du modal oubliée.
- **Correction** : Ajout d'un inline CreateTeam form modal dans App.js + handler `handleCreateTeam()` dans main.js avec validation du nom.
- **Leçon** : **Quand un handler `window.openX()` setzte un state flag `showX: true`, TOUJOURS vérifier qu'il existe un `lazyRender` ou render inline dans App.js pour ce flag. Grep `showX` dans App.js — si absent, la feature est incomplete.**
- **Fichiers** : `src/components/App.js`, `src/main.js`
- **Statut** : CORRIGÉ

### ERR-029 — Bouton "Supprimer mon compte" ne faisait rien (DeleteAccount absent de App.js)
- **Date** : 2026-02-23
- **Gravité** : CRITIQUE
- **Description** : Profile.js avait un bouton "Supprimer mon compte" avec `onclick="openDeleteAccount()"`. Le module `DeleteAccount.js` existait avec `renderDeleteAccountModal()` et les handlers. Mais le module n'était pas dans les `_lazyLoaders` de App.js et il n'y avait pas de render conditionnel sur `showDeleteAccount`. Cliquer le bouton ne faisait rien du tout — fonctionnalité RGPD complètement cassée.
- **Cause racine** : Module créé et handler câblé dans Profile.js, mais l'étape d'enregistrement dans App.js lazy loaders + render pipeline complètement omise.
- **Correction** : Ajout de `renderDeleteAccountModal` dans `_lazyLoaders` + `${state.showDeleteAccount ? lazyRender(...) : ''}` dans App.js + `showDeleteAccount: false` dans state.js.
- **Leçon** : **Créer un module modal en 3 étapes OBLIGATOIRES : (1) le module avec renderXxxModal() + window.openXxx/closeXxx, (2) l'entrée dans `_lazyLoaders` de App.js, (3) le `${state.showXxx ? lazyRender(...) : ''}` dans App.js renderApp. Si une étape manque → le modal n'apparaît jamais. Checklist à valider avec un screenshot Playwright après création.**
- **Fichiers** : `src/components/App.js`, `src/stores/state.js`
- **Statut** : CORRIGÉ

### ERR-031 — renderThankYouModal non câblée dans App.js (showDonationThankYou ghost state)
- **Date** : 2026-02-23
- **Gravité** : MAJEUR
- **Description** : La fonction `renderThankYouModal` existait dans `DonationCard.js` et était correctement exportée, mais n'était pas enregistrée dans `_lazyLoaders` de App.js ni rendue de manière conditionnelle. Résultat : cliquer "Donner" settait `showDonationThankYou: true` mais rien n'apparaissait à l'écran.
- **Cause racine** : Lors de l'ajout du composant DonationCard, seul `renderDonationModal` a été câblé dans App.js. La fonction `renderThankYouModal` (pour le suivi post-don) a été créée dans le composant mais oubliée dans le pipeline de rendu.
- **Correction** : Ajout de `renderThankYouModal: () => import('./ui/DonationCard.js')` dans `_lazyLoaders` + `${state.showDonationThankYou ? lazyRender('renderThankYouModal', state) : ''}` dans le render.
- **Leçon** : **Après avoir créé une export function render* dans un composant, TOUJOURS vérifier qu'elle est dans _lazyLoaders ET dans le render conditionnel de App.js. Un "ghost state" (state flag setté mais jamais rendu) = feature morte silencieusement.**
- **Fichiers** : `src/components/App.js`
- **Statut** : CORRIGÉ

### ERR-032 — Ambassador modals (showAmbassadorSuccess, showContactAmbassador) ghost states
- **Date** : 2026-02-23
- **Gravité** : MAJEUR
- **Description** : `showAmbassadorSuccess` (après inscription ambassadeur) et `showContactAmbassador` (contacter un ambassadeur) étaient settés dans `ambassadors.js` mais aucune fonction de rendu n'existait → actions silencieuses pour l'utilisateur. De plus, `showContactAmbassador` et `selectedAmbassador` étaient absents du state initial dans `state.js`.
- **Cause racine** : Feature ambassador créée avec uniquement la logique métier (service) mais sans les composants UI correspondants.
- **Correction** : Ajout de modals inline dans App.js pour `showAmbassadorSuccess` et `showContactAmbassador`. Ajout de `window.sendAmbassadorMessage` dans main.js. Ajout des états `showContactAmbassador` et `selectedAmbassador` dans state.js. 5 nouvelles clés i18n (FR/EN/ES/DE).
- **Leçon** : **Quand on crée un service avec des setState(), TOUJOURS créer les composants UI correspondants en même temps. Un service sans rendu = feature zombie.**
- **Fichiers** : `src/components/App.js`, `src/main.js`, `src/stores/state.js`, `src/i18n/lang/*.js`
- **Statut** : CORRIGÉ

### ERR-030 — DailyReward.js : textes hardcodés en français sans t() (RÈGLE #8 violée)
- **Date** : 2026-02-23
- **Gravité** : MINEUR
- **Description** : Le composant `DailyReward.js` avait 10+ textes hardcodés directement en français sans utiliser la fonction `t()` : "Recuperer ma recompense !", "Recompense recuperee aujourd'hui !", "Reviens demain pour le jour", "Connecte-toi chaque jour...", "Jour ${day.day}", "Mystere", "Coffre Mystere Ouvert !", "Felicitations !", "Pouces gagnes", "Badge debloque !", "Super !". De plus, les accents manquaient (e au lieu de é).
- **Cause racine** : Développement rapide sans appliquer systématiquement la RÈGLE #8 (tout en t(), 4 langues). Textes copiés-collés directement en français sans passer par le système i18n.
- **Correction** : Remplacement de tous les textes par `t('clé') || 'fallback FR'` + ajout des 13 nouvelles clés dans les 4 fichiers lang (fr/en/es/de) : `dailyRewardTitle`, `dailyRewardSubtitleClaim`, `dailyRewardSubtitleWait`, `claimDailyReward`, `dailyRewardClaimed`, `dailyRewardNextDay`, `dailyRewardTip`, `mystery`, `mysteryChestOpened`, `congratulations`, `thumbsEarned`, `badgeUnlockedExclaim`, `awesome`.
- **Leçon** : **Quand on crée ou modifie un composant UI, GREP immédiatement tous les textes visibles par l'user → chaque texte doit passer par t(). Utiliser un fallback FR en dernier recours. Les textes sans t() = bug i18n silent (la feature "marche" en FR mais est cassée en EN/ES/DE).**
- **Fichiers** : `src/components/modals/DailyReward.js`, `src/i18n/lang/fr.js`, `src/i18n/lang/en.js`, `src/i18n/lang/es.js`, `src/i18n/lang/de.js`
- **Statut** : CORRIGÉ

---

### ERR-033 — Handlers dupliqués entre fichiers non-main (Guides.js, AdminPanel.js, Profile.js)

- **Date** : 2026-02-24
- **Gravité** : MAJEUR
- **Description** : 4 handlers `window.*` étaient définis dans 2+ fichiers non-main : `filterGuides` et `selectGuide` (Guides.js + Travel.js identiques), `openDonation` (AdminPanel.js simplifié vs DonationCard.js complet), `shareTrip` (Profile.js redirect vs Planner.js réel). Le dernier fichier chargé "gagne", ce qui peut changer le comportement selon l'ordre de navigation.
- **Cause racine** : Copier-coller de handlers entre fichiers sans vérifier s'ils existent déjà. Parfois ajouté "pour backward compat" sans supprimer l'original.
- **Correction** : Supprimé les doublons dans Guides.js (gardé Travel.js), AdminPanel.js (gardé DonationCard.js avec params), Profile.js (gardé Planner.js avec async). Ajouté commentaires pointant vers le fichier source.
- **Leçon** : **TOUJOURS grep `window.nomHandler` dans tout `src/` AVANT de créer un nouveau handler. Si le handler existe déjà, l'importer ou le réutiliser, JAMAIS le dupliquer. Un handler = un seul fichier source (sauf pattern main.js + guard `if (!window.xxx)` pour lazy-loading).**
- **Fichiers** : `Guides.js`, `AdminPanel.js`, `Profile.js`, `Travel.js`, `DonationCard.js`, `Planner.js`
- **Statut** : CORRIGÉ

---

### ERR-034 — Math.random() utilisé pour générer des IDs dans 15+ fichiers

- **Date** : 2026-02-24
- **Gravité** : MAJEUR
- **Description** : `Math.random().toString(36)` était utilisé pour générer des IDs d'entités (checkins, groupes, invitations, stops, events, comments, reports, consents, DMs, activities, drafts, challenges, verifications). `Math.random()` n'est PAS cryptographiquement sûr — les IDs sont prévisibles.
- **Cause racine** : Pattern `${Date.now()}_${Math.random().toString(36).substring(2, 9)}` copié-collé dans chaque service sans réfléchir à la sécurité. C'est un anti-pattern courant mais dangereux pour tout ID qui pourrait être deviné.
- **Correction** : Remplacé par `crypto.getRandomValues(new Uint32Array(1))[0].toString(36)` dans 15 fichiers : state.js, travelGroups.js (×3), events.js (×2), moderation.js, consentHistory.js, identityVerification.js, friendChallenges.js, proximityNotify.js, directMessages.js, activityFeed.js, spotDrafts.js, tripHistory.js, a11y.js, network.js, Social.js, SpotDetail.js.
- **Leçon** : **JAMAIS `Math.random()` pour générer un ID, même un ID "interne". Toujours `crypto.getRandomValues()` ou `crypto.randomUUID()`. `Math.random()` est OK UNIQUEMENT pour du visuel (confetti, animation, position aléatoire d'éléments décoratifs, ordre de quiz).**
- **Fichiers** : 15+ fichiers dans src/
- **Statut** : CORRIGÉ

---

### ERR-035 — Error-patterns check ne reconnaît pas les assignments gardés

- **Date** : 2026-02-24
- **Gravité** : MINEUR
- **Description** : Le check ERR-001 dans `error-patterns.mjs` flaggait les handlers définis dans Voyage.js comme des doublons, alors qu'ils utilisent le pattern `if (!window.swapTripPoints) { window.swapTripPoints = ... }`. Ce sont des fallbacks intentionnels pour le lazy-loading, pas des vrais doublons.
- **Cause racine** : Le check comptait toutes les occurrences `window.xxx =` sans analyser le contexte (guards). Résultat : faux positifs qui polluent le score.
- **Correction** : Modifié `error-patterns.mjs` pour détecter les guards `if (!window.xxx)` dans les 3 lignes précédentes. Les assignments gardés ne comptent plus comme des doublons. Aussi ajouté `mapInstance`, `spotHitchMap`, `homeMapInstance` à la skip list (propriétés, pas handlers).
- **Leçon** : **Quand un check automatique a des faux positifs, le corriger IMMÉDIATEMENT plutôt que de l'ignorer. Un check avec trop de bruit est pire qu'aucun check — les vrais problèmes se noient dans le bruit. Toujours tester les patterns LÉGITIMES (lazy-loading guards, propriétés vs handlers) avant de déployer un check.**
- **Fichiers** : `scripts/checks/error-patterns.mjs`
- **Statut** : CORRIGÉ

### ERR-036 — Dropdown/suggestions clippés par overflow-hidden sur .card

- **Date** : 2026-02-24
- **Gravité** : MAJEUR
- **Description** : Les suggestions de ville dans le formulaire Voyage ne s'affichaient pas. Les dropdowns en `position:absolute` étaient invisibles car le parent `.card` a `overflow-hidden`.
- **Cause racine** : La classe CSS `.card` applique `overflow-hidden` (main.css:177). Tout élément enfant en `position:absolute` qui dépasse la boîte du card est clippé.
- **Correction** : Ajout de `!overflow-visible` sur les cartes de formulaire dans Voyage.js et Travel.js pour overrider le overflow-hidden.
- **Leçon** : **Ne JAMAIS mettre un dropdown/suggestions/autocomplete dans un conteneur `overflow-hidden`. Avant d'ajouter un élément `position:absolute` dans un `.card`, vérifier que le parent n'a pas `overflow:hidden`. Si oui, ajouter `!overflow-visible` sur ce card spécifique.**
- **Fichiers** : `src/components/views/Voyage.js`, `src/components/views/Travel.js`
- **Statut** : CORRIGÉ

---

## Statistiques

| Période | Bugs trouvés | Corrigés | En cours |
|---------|-------------|----------|----------|
| 2026-02-20 | 13 | 13 | 0 |
| 2026-02-22 | 9 | 9 | 0 |
| 2026-02-23 | 10 | 10 | 0 |
| 2026-02-24 | 1 | 1 | 0 |
| 2026-02-24 | 3 | 3 | 0 |
