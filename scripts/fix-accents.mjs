#!/usr/bin/env node
/**
 * Fix missing accents/diacritics in i18n VALUE strings ONLY.
 * SAFE: Only modifies text inside quotes (single or double), never touches key names.
 * Uses word-boundary matching for ALL replacements.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LANG_DIR = path.join(__dirname, '..', 'src', 'i18n', 'lang')

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Apply corrections ONLY within quoted string values.
 * Parses each line to find the value portion (after the colon, inside quotes).
 */
function applyCorrections(text, corrections) {
  let totalCount = 0
  const allChanges = []

  const lines = text.split('\n')
  const fixedLines = lines.map((line, lineIdx) => {
    // Match pattern: key: 'value' or key: "value" or key: `value`
    const match = line.match(/^(\s*\w[\w]*:\s*)(["'`])(.*)\2(,?\s*(?:\/\/.*)?)?$/)
    if (!match) return line

    const prefix = match[1]   // "  keyName: "
    const quote = match[2]     // ' or " or `
    let value = match[3]       // the string content
    const suffix = match[4] || '' // , or // comment

    let lineChanged = false
    for (const [wrong, correct] of corrections) {
      if (wrong === correct) continue
      // Word boundary regex - handles start/end of string, spaces, punctuation
      const regex = new RegExp(`(?<=^|[\\s.,;:!?(){}\\[\\]/"'\`—–-])${escapeRegex(wrong)}(?=$|[\\s.,;:!?(){}\\[\\]/"'\`—–-])`, 'g')
      const matches = value.match(regex)
      if (matches && matches.length > 0) {
        value = value.replace(regex, correct)
        totalCount += matches.length
        allChanges.push(`  L${lineIdx + 1}: ${wrong} → ${correct} (${matches.length}x)`)
        lineChanged = true
      }
    }

    if (lineChanged) {
      return `${prefix}${quote}${value}${quote}${suffix}`
    }
    return line
  })

  return { text: fixedLines.join('\n'), count: totalCount, changes: allChanges }
}

// ========================
// FRENCH corrections (value-only, word-boundary safe)
// ========================
const frCorrections = [
  // Nouns ending in -té (missing accent)
  ['communaute', 'communauté'], ['Communaute', 'Communauté'],
  ['securite', 'sécurité'], ['Securite', 'Sécurité'],
  ['legalite', 'légalité'], ['Legalite', 'Légalité'],
  ['identite', 'identité'], ['Identite', 'Identité'],
  ['proximite', 'proximité'], ['Proximite', 'Proximité'],
  ['qualite', 'qualité'], ['Qualite', 'Qualité'],
  ['realite', 'réalité'], ['Realite', 'Réalité'],
  ['difficulte', 'difficulté'], ['Difficulte', 'Difficulté'],
  ['accessibilite', 'accessibilité'],
  ['disponibilite', 'disponibilité'],
  ['visibilite', 'visibilité'],
  ['fiabilite', 'fiabilité'],
  ['popularite', 'popularité'],
  ['fonctionnalite', 'fonctionnalité'], ['Fonctionnalite', 'Fonctionnalité'],
  ['fonctionnalites', 'fonctionnalités'], ['Fonctionnalites', 'Fonctionnalités'],
  ['possibilite', 'possibilité'],
  ['possibilites', 'possibilités'],
  ['capacite', 'capacité'],
  ['quantite', 'quantité'],
  ['societe', 'société'], ['Societe', 'Société'],
  ['amitie', 'amitié'],
  ['activites', 'activités'],
  ['difficultes', 'difficultés'],
  ['necessite', 'nécessité'],
  ['egalite', 'égalité'], ['Egalite', 'Égalité'],

  // Past participles and -é endings
  ['Trophees', 'Trophées'], ['trophees', 'trophées'],
  ['Depart', 'Départ'], ['depart', 'départ'],
  ['Arrivee', 'Arrivée'], ['arrivee', 'arrivée'],
  ['trouve', 'trouvé'], ['trouvee', 'trouvée'],
  ['trouves', 'trouvés'], ['trouvees', 'trouvées'],
  ['Trouve', 'Trouvé'],
  ['sauvegarde', 'sauvegardé'], // as standalone word = past participle
  ['Sauvegarde', 'Sauvegardé'],
  ['verifie', 'vérifié'], ['Verifie', 'Vérifié'],
  ['verifiee', 'vérifiée'],
  ['genere', 'généré'], ['Genere', 'Généré'],
  ['envoye', 'envoyé'], ['Envoye', 'Envoyé'],
  ['envoyee', 'envoyée'],
  ['accepte', 'accepté'], ['Accepte', 'Accepté'],
  ['acceptee', 'acceptée'],
  ['ajoute', 'ajouté'], ['Ajoute', 'Ajouté'],
  ['ajoutee', 'ajoutée'],
  ['supprime', 'supprimé'], ['Supprime', 'Supprimé'],
  ['supprimee', 'supprimée'],
  ['modifie', 'modifié'], ['Modifie', 'Modifié'],
  ['modifiee', 'modifiée'],
  ['connecte', 'connecté'], ['Connecte', 'Connecté'],
  ['connectee', 'connectée'],
  ['deconnecte', 'déconnecté'], ['Deconnecte', 'Déconnecté'],
  ['bloque', 'bloqué'], ['Bloque', 'Bloqué'],
  ['bloquee', 'bloquée'],
  ['archive', 'archivé'], ['Archive', 'Archivé'],
  ['archivee', 'archivée'],
  ['signale', 'signalé'], ['Signale', 'Signalé'],
  ['signalee', 'signalée'],
  ['valide', 'validé'], ['Valide', 'Validé'],
  ['validee', 'validée'],
  ['termine', 'terminé'], ['Termine', 'Terminé'],
  ['terminee', 'terminée'],
  ['publie', 'publié'], ['Publie', 'Publié'],
  ['publiee', 'publiée'],
  ['refuse', 'refusé'], ['Refuse', 'Refusé'],
  ['refusee', 'refusée'],
  ['depasse', 'dépassé'], ['Depasse', 'Dépassé'],
  ['depassee', 'dépassée'],
  ['cree', 'créé'], ['Cree', 'Créé'],
  ['creee', 'créée'],
  ['creer', 'créer'], ['Creer', 'Créer'],
  ['copie', 'copié'], ['Copie', 'Copié'],
  ['modere', 'modéré'], ['Modere', 'Modéré'],
  ['moderee', 'modérée'],
  ['echoue', 'échoué'], ['Echoue', 'Échoué'],
  ['desactive', 'désactivé'], ['Desactive', 'Désactivé'],
  ['desactivee', 'désactivée'],
  ['desactivees', 'désactivées'],
  ['recompense', 'récompense'], ['Recompense', 'Récompense'],
  ['recompenses', 'récompenses'], ['Recompenses', 'Récompenses'],
  ['reussi', 'réussi'], ['Reussi', 'Réussi'],
  ['decline', 'décliné'], ['Decline', 'Décliné'],
  ['retabli', 'rétabli'],
  ['epingle', 'épinglé'],
  ['actualise', 'actualisé'],
  ['affiche', 'affiché'], ['Affiche', 'Affiché'],
  ['effectue', 'effectué'],

  // Nouns with é
  ['Telechargement', 'Téléchargement'], ['telechargement', 'téléchargement'],
  ['telecharger', 'télécharger'], ['Telecharger', 'Télécharger'],
  ['Evenement', 'Événement'], ['evenement', 'événement'],
  ['Evenements', 'Événements'], ['evenements', 'événements'],
  ['Numero', 'Numéro'], ['numero', 'numéro'],
  ['Numeros', 'Numéros'], ['numeros', 'numéros'],
  ['resultats', 'résultats'], ['Resultats', 'Résultats'],
  ['resultat', 'résultat'], ['Resultat', 'Résultat'],
  ['Demarrer', 'Démarrer'], ['demarrer', 'démarrer'],
  ['demarre', 'démarré'],
  ['preference', 'préférence'], ['Preference', 'Préférence'],
  ['preferences', 'préférences'], ['Preferences', 'Préférences'],
  ['prefere', 'préféré'],
  ['general', 'général'],
  ['reponse', 'réponse'], ['Reponse', 'Réponse'],
  ['reponses', 'réponses'], ['Reponses', 'Réponses'],
  ['reseau', 'réseau'], ['Reseau', 'Réseau'],
  ['reseaux', 'réseaux'], ['Reseaux', 'Réseaux'],
  ['selectionner', 'sélectionner'], ['Selectionner', 'Sélectionner'],
  ['selectionne', 'sélectionné'], ['Selectionne', 'Sélectionné'],
  ['recemment', 'récemment'],
  ['element', 'élément'], ['Element', 'Élément'],
  ['elements', 'éléments'],
  ['experience', 'expérience'], ['Experience', 'Expérience'],
  ['etape', 'étape'], ['Etape', 'Étape'],
  ['etapes', 'étapes'], ['Etapes', 'Étapes'],
  ['Etat', 'État'],
  ['ete', 'été'], // careful - standalone word only
  ['deja', 'déjà'], ['Deja', 'Déjà'],
  ['derniere', 'dernière'], ['Derniere', 'Dernière'],
  ['dernieres', 'dernières'],
  ['premiere', 'première'], ['Premiere', 'Première'],
  ['premieres', 'premières'],
  ['verification', 'vérification'], ['Verification', 'Vérification'],
  ['moderation', 'modération'], ['Moderation', 'Modération'],
  ['categorie', 'catégorie'], ['Categorie', 'Catégorie'],
  ['categories', 'catégories'], ['Categories', 'Catégories'],
  ['legende', 'légende'], ['Legende', 'Légende'],
  ['Duree', 'Durée'], ['duree', 'durée'],
  ['entree', 'entrée'], ['Entree', 'Entrée'],
  ['donnee', 'donnée'],
  ['donnees', 'données'], ['Donnees', 'Données'],
  ['annee', 'année'], ['annees', 'années'],
  ['privee', 'privée'],
  ['journee', 'journée'],
  ['idee', 'idée'], ['Idee', 'Idée'],

  // ê words
  ['etre', 'être'], ['Etre', 'Être'],
  ['peut-etre', 'peut-être'],
  ['fenetre', 'fenêtre'], ['fenetres', 'fenêtres'],
  ['arrete', 'arrêté'], ['arreter', 'arrêter'],
  ['enquete', 'enquête'],

  // Other é words
  ['ameliorer', 'améliorer'], ['Ameliorer', 'Améliorer'],
  ['ameliore', 'amélioré'],
  ['systeme', 'système'], ['Systeme', 'Système'],
  ['probleme', 'problème'], ['Probleme', 'Problème'],
  ['problemes', 'problèmes'],
  ['regle', 'règle'], ['Regle', 'Règle'],
  ['regles', 'règles'], ['Regles', 'Règles'],
  ['acces', 'accès'], ['Acces', 'Accès'],
  ['succes', 'succès'], ['Succes', 'Succès'],
  ['francais', 'français'], ['Francais', 'Français'],
  ['recu', 'reçu'], ['Recu', 'Reçu'],
  ['recue', 'reçue'],
  ['ecran', 'écran'], ['Ecran', 'Écran'],
  ['ecrire', 'écrire'], ['Ecrire', 'Écrire'],
  ['ecrit', 'écrit'],
  ['equipe', 'équipe'], ['Equipe', 'Équipe'],
  ['echec', 'échec'], ['Echec', 'Échec'],
  ['economie', 'économie'], ['Economie', 'Économie'],
  ['necessaire', 'nécessaire'],
  ['personnalise', 'personnalisé'], ['Personnalise', 'Personnalisé'],
  ['personnalisee', 'personnalisée'],
  ['specifique', 'spécifique'], ['Specifique', 'Spécifique'],
  ['recuperer', 'récupérer'], ['Recuperer', 'Récupérer'],
  ['recupere', 'récupéré'],
  ['Resume', 'Résumé'], ['resume', 'résumé'],
  ['deconnexion', 'déconnexion'], ['Deconnexion', 'Déconnexion'],
  ['details', 'détails'], ['Details', 'Détails'],
  ['detaille', 'détaillé'],
  ['Reessaye', 'Réessaye'], ['Reedssaye', 'Réessaye'],
  ['verrouille', 'verrouillé'],
  ['verrouilees', 'verrouillées'],
  ['verrouillees', 'verrouillées'],
  ['complete', 'complète'],
  ['completes', 'complètes'],
]

// ========================
// SPANISH corrections
// ========================
const esCorrections = [
  // ñ
  ['Anadir', 'Añadir'], ['anadir', 'añadir'],
  ['anadida', 'añadida'], ['anadido', 'añadido'],
  ['companero', 'compañero'], ['Companero', 'Compañero'],
  ['companeros', 'compañeros'], ['Companeros', 'Compañeros'],
  ['companera', 'compañera'],
  ['montana', 'montaña'], ['Montana', 'Montaña'],
  ['manana', 'mañana'], ['Manana', 'Mañana'],
  ['pequeno', 'pequeño'], ['Pequeno', 'Pequeño'],
  ['pequena', 'pequeña'],
  ['tamano', 'tamaño'], ['Tamano', 'Tamaño'],
  ['diseno', 'diseño'], ['Diseno', 'Diseño'],
  ['sueno', 'sueño'],

  // á
  ['Codigo', 'Código'], ['codigo', 'código'], ['codigos', 'códigos'],
  ['Estadisticas', 'Estadísticas'], ['estadisticas', 'estadísticas'],
  ['Estadistica', 'Estadística'],
  ['Maximo', 'Máximo'], ['maximo', 'máximo'],
  ['maxima', 'máxima'], ['Maxima', 'Máxima'],
  ['pagina', 'página'], ['Pagina', 'Página'],
  ['Basico', 'Básico'], ['basico', 'básico'],
  ['practica', 'práctica'], ['Practica', 'Práctica'],
  ['valido', 'válido'], ['valida', 'válida'],
  ['invalido', 'inválido'], ['invalida', 'inválida'],
  ['automatico', 'automático'], ['automatica', 'automática'],
  ['publico', 'público'], ['publica', 'pública'],
  ['rapido', 'rápido'], ['rapida', 'rápida'],

  // é
  ['opinion', 'opinión'], ['Opinion', 'Opinión'],
  ['tambien', 'también'], ['Tambien', 'También'],

  // í
  ['Guias', 'Guías'], ['guias', 'guías'],
  ['Guia', 'Guía'], ['guia', 'guía'],
  ['aqui', 'aquí'], ['Aqui', 'Aquí'],
  ['kilometros', 'kilómetros'],
  ['linea', 'línea'], ['Linea', 'Línea'],
  ['Util', 'Útil'], ['util', 'útil'], ['utiles', 'útiles'],
  ['ultimo', 'último'], ['ultima', 'última'],
  ['Ultimo', 'Último'], ['Ultima', 'Última'],
  ['unico', 'único'], ['unica', 'única'],
  ['numero', 'número'], ['Numero', 'Número'],
  ['numeros', 'números'], ['Numeros', 'Números'],
  ['vehiculo', 'vehículo'], ['vehiculos', 'vehículos'],
  ['historico', 'histórico'], ['historica', 'histórica'],
  ['musica', 'música'], ['Musica', 'Música'],

  // ó (mainly -ción endings)
  ['Conversacion', 'Conversación'], ['conversacion', 'conversación'],
  ['informacion', 'información'], ['Informacion', 'Información'],
  ['configuracion', 'configuración'], ['Configuracion', 'Configuración'],
  ['notificacion', 'notificación'], ['Notificacion', 'Notificación'],
  ['verificacion', 'verificación'], ['Verificacion', 'Verificación'],
  ['localizacion', 'localización'], ['Localizacion', 'Localización'],
  ['direccion', 'dirección'], ['Direccion', 'Dirección'],
  ['conexion', 'conexión'], ['Conexion', 'Conexión'],
  ['sesion', 'sesión'], ['Sesion', 'Sesión'],
  ['region', 'región'], ['Region', 'Región'],
  ['opcion', 'opción'], ['Opcion', 'Opción'],
  ['accion', 'acción'], ['Accion', 'Acción'],
  ['descripcion', 'descripción'], ['Descripcion', 'Descripción'],
  ['Evaluacion', 'Evaluación'],
  ['navegacion', 'navegación'], ['Navegacion', 'Navegación'],
  ['ubicacion', 'ubicación'], ['Ubicacion', 'Ubicación'],
  ['moderacion', 'moderación'], ['Moderacion', 'Moderación'],
  ['administracion', 'administración'],
  ['cancelacion', 'cancelación'],
  ['Recomendacion', 'Recomendación'],
  ['promocion', 'promoción'],
  ['Clasificacion', 'Clasificación'],
  ['clasificacion', 'clasificación'],
  ['confirmacion', 'confirmación'],
  ['donacion', 'donación'],
  ['aplicacion', 'aplicación'],

  // ú
  ['busqueda', 'búsqueda'], ['Busqueda', 'Búsqueda'],

  // Context-sensitive
  ['esta escribiendo', 'está escribiendo'],
  ['estan escribiendo', 'están escribiendo'],
  ['Se el primero', 'Sé el primero'],
]

// ========================
// GERMAN corrections (umlauts + ß)
// ========================
const deCorrections = [
  // ü
  ['gepruft', 'geprüft'],
  ['Prufung', 'Prüfung'], ['prufung', 'prüfung'],
  ['prufe', 'prüfe'],
  ['hinzufugen', 'hinzufügen'], ['Hinzufugen', 'Hinzufügen'],
  ['hinzugefugt', 'hinzugefügt'],
  ['verfugbar', 'verfügbar'], ['Verfugbar', 'Verfügbar'],
  ['Verfugbare', 'Verfügbare'],
  ['ausgefuhrt', 'ausgeführt'],
  ['zuruckgezogen', 'zurückgezogen'],
  ['zuruckziehen', 'zurückziehen'],
  ['Zurucksetzungs', 'Zurücksetzungs'],
  ['Zurucksetzen', 'Zurücksetzen'],
  ['Unterstutze', 'Unterstütze'],
  ['unterstutzt', 'unterstützt'],
  ['Unterstutzung', 'Unterstützung'],
  ['ungultig', 'ungültig'], ['Ungultig', 'Ungültig'],
  ['Ungultiger', 'Ungültiger'], ['Ungultige', 'Ungültige'],
  ['Ungultiges', 'Ungültiges'],
  ['gultig', 'gültig'], ['Gultig', 'Gültig'],
  ['ubrig', 'übrig'],
  ['fuhren', 'führen'], ['Fuhren', 'Führen'],
  ['Anfuhrer', 'Anführer'],
  ['Gluckwunsch', 'Glückwunsch'],
  ['Gluck', 'Glück'],
  ['zuruck', 'zurück'], ['Zuruck', 'Zurück'],
  ['naturlich', 'natürlich'], ['Naturlich', 'Natürlich'],
  ['uberprufen', 'überprüfen'],
  ['uberpruft', 'überprüft'],
  ['Uberprufung', 'Überprüfung'],
  ['ubertragen', 'übertragen'],
  ['ubernehmen', 'übernehmen'],
  ['ubersetzt', 'übersetzt'],
  ['Ubersetzung', 'Übersetzung'],
  ['uberall', 'überall'],
  ['Gerate', 'Geräte'], ['Gerat', 'Gerät'],
  ['ausgefullt', 'ausgefüllt'],
  ['verknupft', 'verknüpft'],
  ['eingefugt', 'eingefügt'],
  ['durchfuhren', 'durchführen'],
  ['durchgefuhrt', 'durchgeführt'],
  ['ausfuhrlich', 'ausführlich'],
  ['kunftig', 'künftig'],
  ['ubermittelt', 'übermittelt'],
  ['Schlussel', 'Schlüssel'],
  ['genugt', 'genügt'],
  ['wunschen', 'wünschen'], ['Wunsche', 'Wünsche'],
  // NOTE: "wurde" stays as "wurde" (past tense), NOT "würde" (conditional)

  // ö
  ['konnen', 'können'], ['Konnen', 'Können'],
  ['geloscht', 'gelöscht'],
  ['loschen', 'löschen'], ['Loschen', 'Löschen'],
  ['Loschung', 'Löschung'],
  ['veroffentlichen', 'veröffentlichen'],
  ['veroffentlicht', 'veröffentlicht'],
  ['veroffentlichten', 'veröffentlichten'],
  ['mochten', 'möchten'],
  ['moglich', 'möglich'], ['Moglich', 'Möglich'],
  ['mogliche', 'mögliche'], ['Mogliche', 'Mögliche'],
  ['Moglichkeit', 'Möglichkeit'], ['Moglichkeiten', 'Möglichkeiten'],
  ['Worter', 'Wörter'],
  ['eingelost', 'eingelöst'],
  ['Losen', 'Lösen'],
  ['Losung', 'Lösung'], ['Losungen', 'Lösungen'],
  ['personlich', 'persönlich'], ['Personlich', 'Persönlich'],
  ['benotigt', 'benötigt'],
  ['notig', 'nötig'],
  ['offnen', 'öffnen'], ['Offnen', 'Öffnen'],
  ['geoffnet', 'geöffnet'],
  ['offentlich', 'öffentlich'],
  // NOTE: "konnte" stays as "konnte" (past tense), NOT "könnte" (conditional)

  // ä
  ['Wahle', 'Wähle'], ['wahle', 'wähle'],
  ['wahlen', 'wählen'], ['Wahlen', 'Wählen'],
  ['gewahlt', 'gewählt'],
  ['Zusatzliche', 'Zusätzliche'], ['zusatzlich', 'zusätzlich'],
  ['Gefahrlich', 'Gefährlich'], ['gefahrlich', 'gefährlich'],
  ['Gefahrliche', 'Gefährliche'], ['Gefahrliches', 'Gefährliches'],
  ['Platze', 'Plätze'],
  ['Anfanger', 'Anfänger'],
  ['spater', 'später'], ['Spater', 'Später'],
  ['Nachstes', 'Nächstes'], ['nachsten', 'nächsten'],
  ['Nachste', 'Nächste'], ['nachste', 'nächste'],
  ['andern', 'ändern'], ['Andern', 'Ändern'],
  ['Raume', 'Räume'], ['Chatraume', 'Chaträume'],
  ['Nahe', 'Nähe'],
  ['Aktivitat', 'Aktivität'], ['Aktivitaten', 'Aktivitäten'],
  ['Kompatibilitat', 'Kompatibilität'],
  ['Flexibilitat', 'Flexibilität'],
  ['Prioritat', 'Priorität'], ['Prioritats', 'Prioritäts'],
  ['Prioritaten', 'Prioritäten'],
  ['Bestatigung', 'Bestätigung'],
  ['bestatigen', 'bestätigen'], ['Bestatigen', 'Bestätigen'],
  ['bestatigt', 'bestätigt'], ['Bestatigt', 'Bestätigt'],
  ['Bestatigte', 'Bestätigte'],
  ['ladt', 'lädt'],
  ['Lauft', 'Läuft'], ['lauft', 'läuft'],
  ['Lander', 'Länder'],
  ['Vorschlage', 'Vorschläge'], ['vorschlage', 'vorschläge'],
  ['standig', 'ständig'],
  ['vollstandig', 'vollständig'],
  ['Verstandnis', 'Verständnis'],
  ['Fahigkeit', 'Fähigkeit'], ['Fahigkeiten', 'Fähigkeiten'],
  ['Ahnlich', 'Ähnlich'], ['ahnlich', 'ähnlich'],
  ['ungefahr', 'ungefähr'],
  ['Gepack', 'Gepäck'],
  ['Gepaufbewahrung', 'Gepäckaufbewahrung'],
  ['Identitat', 'Identität'],
  ['Qualitat', 'Qualität'],
  ['Funktionalitat', 'Funktionalität'],
  ['Popularitat', 'Popularität'],
  ['Kapazitat', 'Kapazität'],
  ['einschatzung', 'einschätzung'],
  ['erzahlen', 'erzählen'],
  ['Empfanger', 'Empfänger'],
  ['regelmassig', 'regelmäßig'],
  ['Getrank', 'Getränk'],
  ['Erganzen', 'Ergänzen'], ['erganzen', 'ergänzen'],

  // ß
  ['Massnahme', 'Maßnahme'],
  ['Strasse', 'Straße'], ['strasse', 'straße'],
  ['schliessen', 'schließen'], ['Schliessen', 'Schließen'],
  ['Spass', 'Spaß'],
  ['ausserdem', 'außerdem'],
  ['ausserhalb', 'außerhalb'],
  ['gemass', 'gemäß'],

  // Digraphs ae→ä, oe→ö, ue→ü
  ['Trophaeen', 'Trophäen'],
  ['laeuft', 'läuft'], ['Laeuft', 'Läuft'],
]

// ========================
// Process each language
// ========================
const langs = [
  { code: 'fr', corrections: frCorrections },
  { code: 'es', corrections: esCorrections },
  { code: 'de', corrections: deCorrections },
]

let totalFixes = 0

for (const lang of langs) {
  const filePath = path.join(LANG_DIR, `${lang.code}.js`)
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`)
    continue
  }
  const original = fs.readFileSync(filePath, 'utf8')
  const { text, count, changes } = applyCorrections(original, lang.corrections)

  if (count > 0) {
    fs.writeFileSync(filePath, text, 'utf8')
    console.log(`\n${lang.code.toUpperCase()}: ${count} corrections`)
    if (process.argv.includes('--verbose')) {
      changes.forEach(c => console.log(c))
    }
    totalFixes += count
  } else {
    console.log(`\n${lang.code.toUpperCase()}: no corrections needed`)
  }
}

console.log(`\nTotal: ${totalFixes} corrections across all languages`)
