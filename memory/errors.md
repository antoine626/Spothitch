# errors.md - Journal des erreurs et corrections SpotHitch

> Dernière mise à jour : 2026-02-20
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

---

## Statistiques

| Période | Bugs trouvés | Corrigés | En cours |
|---------|-------------|----------|----------|
| 2026-02-20 | 13 | 13 | 0 |
| 2026-02-22 | 3 | 3 | 0 |
