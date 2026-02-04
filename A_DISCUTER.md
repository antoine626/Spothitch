# Sujets à Discuter - SpotHitch

> Ce fichier contient tous les sujets qui nécessitent une discussion avant implémentation.
> Mis à jour au fur et à mesure des sessions.

---

## 🔴 PRIORITÉ HAUTE

### #10 - Rate Limiting (Limites anti-spam)
**Question :** Quelles limites mettre ?
**Contexte :** Empêcher les abus sans gêner les vrais utilisateurs
**Propositions à discuter :**
- Maximum X messages par minute ?
- Maximum X check-ins par jour ?
- Maximum X créations de compte par IP ?

**Décision :** _En attente_

---

### #14 - Détection de comptes suspects
**Question :** Comment détecter les mauvais comportements dans une app d'entraide ?
**Contexte :** L'app est faite pour l'entraide, donc il faut trouver le bon équilibre
**Points à discuter :**
- Qu'est-ce qui est "suspect" dans le contexte de SpotHitch ?
- Comment différencier un nouvel utilisateur enthousiaste d'un bot ?
- Quelles actions automatiques vs manuelles ?

**Décision :** _En attente_

---

### #22 - Événements à tracker (Analytics)
**Question :** Quels événements mesurer exactement ?
**Contexte :** On a dit oui à Mixpanel, mais faut définir QUOI mesurer
**Points à discuter :**
- Liste des événements critiques
- Quelles données collecter pour chaque événement
- Respect de la vie privée

**Décision :** _En attente_

---

### #82 - Utilisateurs de confiance (badge vérifié)
**Question :** Comment quelqu'un devient "de confiance" ?
**Contexte :** Tu veux que ça soit lié au niveau
**Points à discuter :**
- À partir de quel niveau ?
- Quels avantages pour les utilisateurs de confiance ?
- Peuvent-ils valider les spots des autres ?

**Décision :** _En attente_

---

### #97 - Recherche direction + Multi-destinations
**Question :** Comment améliorer la recherche et le planificateur ?
**Contexte :** Tu veux pouvoir chercher "Paris → Lyon" et voir tous les spots sur le chemin
**Points à discuter :**
- Interface de recherche par direction
- Multi-destinations (vrai parcours)
- Enregistrement dans les voyages
- Lien avec le planificateur existant

**Décision :** _En attente_

---

### #191 - Système de réputation
**Question :** Comment calculer la réputation ?
**Contexte :** Score de confiance basé sur l'historique
**Points à discuter :**
- Quels critères ? (ancienneté, check-ins, avis reçus...)
- Poids de chaque critère
- Affichage public ou privé ?
- Impact sur les fonctionnalités

**Décision :** _En attente_

---

## 🟡 PRIORITÉ MOYENNE

### #13 - Chiffrement des données sensibles
**Question :** Qui peut décoder les données chiffrées ?
**Contexte :** Les données sensibles (position GPS) seront chiffrées
**Réponse technique :**
- Le serveur (Firebase) a la clé de déchiffrement
- Toi en tant qu'admin tu peux accéder si nécessaire
- Les autres utilisateurs ne voient que du charabia
- C'est une protection contre les fuites de base de données

**Décision :** _À confirmer si OK avec cette explication_

---

### #27 - Heatmaps (espace de stockage)
**Question :** Est-ce que ça prend beaucoup de place ?
**Réponse technique :**
- Les heatmaps sont calculées à la volée, pas stockées
- On stocke juste les clics (quelques octets chacun)
- Avec 10 000 utilisateurs actifs = ~10 Mo/mois
- C'est négligeable

**Décision :** _À confirmer si OK_

---

### #56 - Photos des spots (système de tournante)
**Question :** Comment gérer les photos ?
**Ton idée :** Garder les photos récentes, supprimer les vieilles
**Points à discuter :**
- Combien de photos max par spot ? (5 ? 10 ?)
- Après combien de temps une photo est "vieille" ? (6 mois ? 1 an ?)
- Garder la meilleure photo (plus likée) même si vieille ?

**Décision :** _En attente_

---

### #61 - Notifications spots proches
**Question :** Quand envoyer ces notifications ?
**Contexte :** Tu ne veux pas être spammé quand tu ne voyages pas
**Points à discuter :**
- Activer seulement en "mode voyage" ?
- Activer seulement si l'utilisateur bouge (>5km/h) ?
- Fréquence maximum ?

**Décision :** _En attente_

---

### #69/70 - Temps d'attente en direct / File d'attente
**Question :** Comment implémenter ça ?
**Contexte :** Voir qui attend où en temps réel
**Points à discuter :**
- Les gens doivent-ils "s'enregistrer" quand ils attendent ?
- Vie privée : veut-on montrer sa position en temps réel ?
- Consommation batterie/données

**Décision :** _En attente_

---

### #165 - Événements Double XP
**Question :** Quels événements par pays ?
**Contexte :** Pas les weekends, mais des événements spéciaux
**Points à discuter :**
- Fêtes nationales ?
- Festivals de voyage ?
- Événements SpotHitch personnalisés ?

**Décision :** _En attente_

---

## 🟢 CLARIFICATIONS

### #71/72 - Directions vers le spot
**Ta question :** "Si on clique sur le spot on peut l'ouvrir avec Maps, je comprends pas ?"
**Réponse :** Tu as raison ! C'est déjà prévu dans #89 (intégration Google Maps/Waze).
Les #71 et #72 étaient redondants. On garde juste #89.

**Statut :** ✅ Clarifié - On fait #89, on oublie #71/72

---

### #92/93/94 - Clusters, filtres sur carte, légende
**Ta question :** "C'est ce qu'on a déjà je crois ?"
**Réponse :** Je vais vérifier ce qui existe et ce qui manque.

**Statut :** 🔍 À vérifier

---

### #139 - Formulaires accessibles
**Ta question :** "Je comprends pas"
**Explication simple :**
C'est pour les gens qui utilisent un lecteur d'écran (aveugles).
Quand le lecteur lit un champ de formulaire, il doit savoir que c'est le champ "Email" ou "Mot de passe".
C'est juste du code bien fait, invisible pour toi mais utile pour l'accessibilité.

**Statut :** ✅ Clarifié - Je le fais automatiquement

---

## 📝 NOTES DIVERSES

### Précisions importantes notées :
- **#12** : Double authentification SEULEMENT à l'inscription, pas à chaque connexion
- **#16** : Session timeout après 1 SEMAINE d'inactivité (pas 1 heure)
- **#32/33/51/52** : Ajouter de l'HUMOUR partout (empty states, chargement, erreurs)
- **#35** : Mettre les défis dans le PROFIL
- **#42** : Swipe SEULEMENT pour changer d'onglet
- **#53** : Confirmation seulement pour SUPPRIMER LE COMPTE
- **#58** : Filtres commodités = OPTIONNEL mais donne des POINTS BONUS
- **#73/76** : Intégrer horaires/véhicules dans les STATS DU SPOT
- **#83** : Spot dangereux = PROPOSER DE SUPPRIMER
- **#87** : CODE au lieu de QR code
- **#141** : Drapeaux + choix au début + proposition auto selon langue téléphone
- **#146** : Traduction AUTOMATIQUE + possibilité de voir l'original
- **#160** : Reset saisonnier MAIS garder les récompenses/skins
- **#180** : Possibilité de mettre en SOURDINE chaque conversation
- **#190** : Vérification jusqu'à CARTE D'IDENTITÉ/PASSEPORT
- **#197** : Suivre quelqu'un SEULEMENT si profil public choisi
- **#236** : Partenariats = pub DANS LA DESCRIPTION du spot (ex: "Il y a un McDo")
- **#237** : Pubs ciblées sur le VOYAGE
- **#240** : Données anonymisées SI LÉGAL
- **#269** : Landing page = AU MOMENT DE S'INSCRIRE

---

*Dernière mise à jour : 2026-02-04*
