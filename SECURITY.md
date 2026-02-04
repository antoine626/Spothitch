# 🔒 Politique de Sécurité - SpotHitch

## Versions supportées

| Version | Supportée |
| ------- | --------- |
| 1.1.x   | ✅ Oui    |
| 1.0.x   | ⚠️ Partiel |
| < 1.0   | ❌ Non    |

## Signaler une vulnérabilité

Si vous découvrez une faille de sécurité dans SpotHitch, merci de nous la signaler de manière responsable.

### Comment signaler

1. **Ne publiez PAS** la vulnérabilité publiquement (issue GitHub, réseaux sociaux, etc.)
2. Envoyez un email détaillé à l'auteur via GitHub
3. Incluez :
   - Description de la vulnérabilité
   - Étapes pour reproduire
   - Impact potentiel
   - Suggestion de correction (si possible)

### Délai de réponse

- **Accusé de réception** : 48h
- **Première évaluation** : 7 jours
- **Correction** : selon la sévérité (critique < 7 jours, haute < 30 jours)

## Mesures de sécurité implémentées

### Protection XSS

Toutes les entrées utilisateur sont échappées avec `escapeHtml()` :

```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

**Variables protégées** :
- `spot.name`, `spot.description`, `spot.tips`
- `user.username`, `user.displayName`
- `message.text`, `comment.text`
- `trip.name`, `result.display_name`

### Firebase Security Rules

Les règles Firestore sont configurées pour :
- ✅ Lecture publique des spots
- ✅ Écriture authentifiée uniquement
- ✅ Modification/suppression par le propriétaire uniquement
- ✅ Validation des types de données

```javascript
// Exemple de règle
allow create: if request.auth != null
  && request.resource.data.lat is number
  && request.resource.data.lng is number;
```

### Headers de sécurité

Les liens externes incluent :
```html
<a href="..." target="_blank" rel="noopener noreferrer">
```

### Données sensibles

- ❌ Aucun mot de passe stocké (Firebase Auth)
- ❌ Aucune clé API exposée côté client
- ✅ Tokens Firebase gérés automatiquement
- ✅ LocalStorage pour données non sensibles uniquement

## Vulnérabilités connues

### Validation GPS côté client

**Statut** : ⚠️ Limitation connue

La validation de la position GPS pour les check-ins se fait côté client.
Un utilisateur malveillant pourrait falsifier sa position.

**Mitigation prévue** : Validation serveur avec Firebase Cloud Functions

### Rate limiting OSRM

**Statut** : ✅ Mitigé

Implémentation d'un debounce côté client pour éviter le blocage par l'API OSRM.

## Bonnes pratiques pour les contributeurs

1. **Ne committez jamais** de clés API, tokens, ou secrets
2. **Utilisez** `escapeHtml()` pour toute donnée utilisateur
3. **Testez** les entrées avec des caractères spéciaux (`<script>`, `"`, `'`)
4. **Vérifiez** les permissions Firebase avant d'ajouter des fonctionnalités

## Audit de sécurité

Dernier audit : 26 décembre 2025

| Catégorie | Statut |
|-----------|--------|
| XSS | ✅ Protégé |
| CSRF | ✅ N/A (pas de formulaires traditionnels) |
| Injection SQL | ✅ N/A (Firestore NoSQL) |
| Auth | ✅ Firebase Auth |
| Data exposure | ✅ Vérifié |

---

Merci de contribuer à la sécurité de SpotHitch ! 🛡️
