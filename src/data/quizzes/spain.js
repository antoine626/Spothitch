/**
 * Quiz questions for Spain
 * 10 questions about hitchhiking in Spain
 */

export const spainQuiz = {
  countryCode: 'ES',
  questions: [
    {
      question: {
        fr: 'L\'autostop est-il legal en Espagne ?',
        en: 'Is hitchhiking legal in Spain?',
        es: 'Es legal hacer autostop en Espana?',
        de: 'Ist Trampen in Spanien legal?',
      },
      answers: [
        { text: { fr: 'Totalement interdit', en: 'Totally prohibited', es: 'Totalmente prohibido', de: 'Voellig verboten' }, correct: false },
        { text: { fr: 'Legal sauf sur autoroutes', en: 'Legal except on motorways', es: 'Legal excepto en autopistas', de: 'Legal ausser auf Autobahnen' }, correct: true },
        { text: { fr: 'Legal partout', en: 'Legal everywhere', es: 'Legal en todas partes', de: 'Ueberall legal' }, correct: false },
        { text: { fr: 'Seulement en ete', en: 'Only in summer', es: 'Solo en verano', de: 'Nur im Sommer' }, correct: false },
      ],
      explanation: {
        fr: 'En Espagne, l\'autostop est legal partout sauf sur les autoroutes (autopistas) elles-memes. Les stations et aires sont OK.',
        en: 'In Spain, hitchhiking is legal everywhere except on motorways (autopistas) themselves. Stations and rest areas are OK.',
        es: 'En Espana, el autostop es legal en todas partes excepto en las autopistas. Las gasolineras y areas de descanso son OK.',
        de: 'In Spanien ist Trampen ueberall legal ausser auf den Autobahnen (Autopistas) selbst. Tankstellen und Rastplaetze sind OK.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quel est le meilleur moment de la journee pour faire du stop en Espagne ?',
        en: 'What is the best time of day to hitchhike in Spain?',
        es: 'Cual es el mejor momento del dia para hacer autostop en Espana?',
        de: 'Was ist die beste Tageszeit zum Trampen in Spanien?',
      },
      answers: [
        { text: { fr: 'L\'apres-midi (14h-17h)', en: 'Afternoon (2pm-5pm)', es: 'La tarde (14h-17h)', de: 'Nachmittag (14-17 Uhr)' }, correct: false },
        { text: { fr: 'Le matin tot (7h-10h)', en: 'Early morning (7am-10am)', es: 'Temprano por la manana (7h-10h)', de: 'Frueh morgens (7-10 Uhr)' }, correct: true },
        { text: { fr: 'A midi', en: 'At noon', es: 'Al mediodia', de: 'Mittags' }, correct: false },
        { text: { fr: 'Le soir (20h-23h)', en: 'Evening (8pm-11pm)', es: 'La noche (20h-23h)', de: 'Abends (20-23 Uhr)' }, correct: false },
      ],
      explanation: {
        fr: 'Le matin tot est ideal car les gens partent au travail. Evitez la sieste (14h-17h) ou le trafic chute !',
        en: 'Early morning is ideal as people head to work. Avoid siesta time (2pm-5pm) when traffic drops!',
        es: 'Temprano por la manana es ideal ya que la gente va al trabajo. Evita la hora de la siesta (14h-17h)!',
        de: 'Frueh morgens ist ideal, da die Leute zur Arbeit fahren. Vermeidet die Siesta-Zeit (14-17 Uhr)!',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quelle est la specialite culinaire la plus populaire en Espagne ?',
        en: 'What is the most popular culinary specialty in Spain?',
        es: 'Cual es la especialidad culinaria mas popular de Espana?',
        de: 'Was ist die beliebteste kulinarische Spezialitaet in Spanien?',
      },
      answers: [
        { text: { fr: 'Paella', en: 'Paella', es: 'Paella', de: 'Paella' }, correct: true },
        { text: { fr: 'Gaspacho', en: 'Gazpacho', es: 'Gazpacho', de: 'Gazpacho' }, correct: false },
        { text: { fr: 'Churros', en: 'Churros', es: 'Churros', de: 'Churros' }, correct: false },
        { text: { fr: 'Tortilla', en: 'Tortilla', es: 'Tortilla', de: 'Tortilla' }, correct: false },
      ],
      explanation: {
        fr: 'La paella, originaire de Valence, est le plat espagnol le plus connu dans le monde. Les conducteurs adorent en parler !',
        en: 'Paella, originally from Valencia, is the most famous Spanish dish worldwide. Drivers love talking about it!',
        es: 'La paella, originaria de Valencia, es el plato espanol mas conocido del mundo. Los conductores adoran hablar de ella!',
        de: 'Paella aus Valencia ist das beruehmteste spanische Gericht weltweit. Fahrer reden gerne darueber!',
      },
      category: 'food',
    },
    {
      question: {
        fr: 'Combien de langues officielles y a-t-il en Espagne ?',
        en: 'How many official languages are there in Spain?',
        es: 'Cuantos idiomas oficiales hay en Espana?',
        de: 'Wie viele offizielle Sprachen gibt es in Spanien?',
      },
      answers: [
        { text: { fr: '1 (espagnol)', en: '1 (Spanish)', es: '1 (espanol)', de: '1 (Spanisch)' }, correct: false },
        { text: { fr: '2', en: '2', es: '2', de: '2' }, correct: false },
        { text: { fr: '5 (castillan + 4 regionales)', en: '5 (Castilian + 4 regional)', es: '5 (castellano + 4 regionales)', de: '5 (Kastilisch + 4 regionale)' }, correct: true },
        { text: { fr: '3', en: '3', es: '3', de: '3' }, correct: false },
      ],
      explanation: {
        fr: 'Castillan, catalan, basque, galicien et aranais. Connaitre quelques mots locaux impressionne les conducteurs !',
        en: 'Castilian, Catalan, Basque, Galician and Aranese. Knowing a few local words impresses drivers!',
        es: 'Castellano, catalan, vasco, gallego y aranes. Conocer unas palabras locales impresiona a los conductores!',
        de: 'Kastilisch, Katalanisch, Baskisch, Galicisch und Aranesisch. Ein paar lokale Woerter beeindrucken Fahrer!',
      },
      category: 'language',
    },
    {
      question: {
        fr: 'Quel est le plus long fleuve d\'Espagne ?',
        en: 'What is the longest river in Spain?',
        es: 'Cual es el rio mas largo de Espana?',
        de: 'Was ist der laengste Fluss in Spanien?',
      },
      answers: [
        { text: { fr: 'Le Guadalquivir', en: 'The Guadalquivir', es: 'El Guadalquivir', de: 'Der Guadalquivir' }, correct: false },
        { text: { fr: 'L\'Ebre', en: 'The Ebro', es: 'El Ebro', de: 'Der Ebro' }, correct: false },
        { text: { fr: 'Le Tage', en: 'The Tagus', es: 'El Tajo', de: 'Der Tejo' }, correct: true },
        { text: { fr: 'Le Douro', en: 'The Douro', es: 'El Duero', de: 'Der Duero' }, correct: false },
      ],
      explanation: {
        fr: 'Le Tage (Tajo) est le plus long fleuve de la peninsule iberique (1007 km), traversant l\'Espagne et le Portugal.',
        en: 'The Tagus (Tajo) is the longest river of the Iberian Peninsula (1007 km), crossing Spain and Portugal.',
        es: 'El Tajo es el rio mas largo de la peninsula iberica (1007 km), cruzando Espana y Portugal.',
        de: 'Der Tejo (Tajo) ist der laengste Fluss der Iberischen Halbinsel (1007 km), durch Spanien und Portugal.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel est le chemin de pelerinage le plus celebre d\'Espagne ?',
        en: 'What is the most famous pilgrimage route in Spain?',
        es: 'Cual es la ruta de peregrinacion mas famosa de Espana?',
        de: 'Was ist der beruehmteste Pilgerweg in Spanien?',
      },
      answers: [
        { text: { fr: 'Via de la Plata', en: 'Via de la Plata', es: 'Via de la Plata', de: 'Via de la Plata' }, correct: false },
        { text: { fr: 'Chemin de Saint-Jacques', en: 'Camino de Santiago', es: 'Camino de Santiago', de: 'Jakobsweg' }, correct: true },
        { text: { fr: 'Ruta del Cid', en: 'Route of El Cid', es: 'Ruta del Cid', de: 'Ruta del Cid' }, correct: false },
        { text: { fr: 'Sentier Mozarabe', en: 'Mozarabic Trail', es: 'Sendero Mozarabe', de: 'Mozarabischer Pfad' }, correct: false },
      ],
      explanation: {
        fr: 'Le Camino de Santiago attire 300 000+ pelerins/an. Beaucoup d\'autostoppeurs combinent stop et marche sur le Camino.',
        en: 'The Camino de Santiago attracts 300,000+ pilgrims/year. Many hitchhikers combine hitchhiking with walking the Camino.',
        es: 'El Camino de Santiago atrae 300.000+ peregrinos/ano. Muchos autostopistas combinan el autostop con el Camino.',
        de: 'Der Jakobsweg zieht ueber 300.000 Pilger/Jahr an. Viele Tramper kombinieren Trampen mit dem Jakobsweg.',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Comment dit-on "pouvez-vous m\'emmener ?" en espagnol ?',
        en: 'How do you say "can you give me a ride?" in Spanish?',
        es: 'Como se dice "puede llevarme?" en espanol?',
        de: 'Wie sagt man "koennen Sie mich mitnehmen?" auf Spanisch?',
      },
      answers: [
        { text: { fr: 'Puedo ir contigo?', en: 'Puedo ir contigo?', es: 'Puedo ir contigo?', de: 'Puedo ir contigo?' }, correct: false },
        { text: { fr: 'Me puede llevar?', en: 'Me puede llevar?', es: 'Me puede llevar?', de: 'Me puede llevar?' }, correct: true },
        { text: { fr: 'Quiero viajar', en: 'Quiero viajar', es: 'Quiero viajar', de: 'Quiero viajar' }, correct: false },
        { text: { fr: 'Ayudame por favor', en: 'Ayudame por favor', es: 'Ayudame por favor', de: 'Ayudame por favor' }, correct: false },
      ],
      explanation: {
        fr: '"Me puede llevar a...?" est la phrase la plus utile pour les autostoppeurs en Espagne. Toujours ajouter "por favor" !',
        en: '"Me puede llevar a...?" is the most useful phrase for hitchhikers in Spain. Always add "por favor"!',
        es: '"Me puede llevar a...?" es la frase mas util para autostopistas en Espana. Siempre anade "por favor"!',
        de: '"Me puede llevar a...?" ist der nuetzlichste Satz fuer Tramper in Spanien. Immer "por favor" hinzufuegen!',
      },
      category: 'language',
    },
    {
      question: {
        fr: 'Quelle est la plus grande ile espagnole ?',
        en: 'What is the largest Spanish island?',
        es: 'Cual es la isla espanola mas grande?',
        de: 'Was ist die groesste spanische Insel?',
      },
      answers: [
        { text: { fr: 'Tenerife', en: 'Tenerife', es: 'Tenerife', de: 'Teneriffa' }, correct: false },
        { text: { fr: 'Majorque', en: 'Mallorca', es: 'Mallorca', de: 'Mallorca' }, correct: true },
        { text: { fr: 'Ibiza', en: 'Ibiza', es: 'Ibiza', de: 'Ibiza' }, correct: false },
        { text: { fr: 'Gran Canaria', en: 'Gran Canaria', es: 'Gran Canaria', de: 'Gran Canaria' }, correct: false },
      ],
      explanation: {
        fr: 'Majorque (3640 km2) est la plus grande des iles Baleares. Le stop y est facile car les distances sont courtes.',
        en: 'Mallorca (3640 km2) is the largest of the Balearic Islands. Hitchhiking is easy as distances are short.',
        es: 'Mallorca (3640 km2) es la mayor de las Islas Baleares. El autostop es facil porque las distancias son cortas.',
        de: 'Mallorca (3640 km2) ist die groesste der Baleareninseln. Trampen ist einfach, da die Entfernungen kurz sind.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quelle tradition espagnole implique des taureaux ?',
        en: 'Which Spanish tradition involves bulls?',
        es: 'Que tradicion espanola involucra toros?',
        de: 'Welche spanische Tradition beinhaltet Stiere?',
      },
      answers: [
        { text: { fr: 'La Tomatina', en: 'La Tomatina', es: 'La Tomatina', de: 'La Tomatina' }, correct: false },
        { text: { fr: 'San Fermin (courses de taureaux)', en: 'San Fermin (bull running)', es: 'San Fermin (encierros)', de: 'San Fermin (Stierlauf)' }, correct: true },
        { text: { fr: 'Las Fallas', en: 'Las Fallas', es: 'Las Fallas', de: 'Las Fallas' }, correct: false },
        { text: { fr: 'La Feria de Abril', en: 'Feria de Abril', es: 'La Feria de Abril', de: 'Feria de Abril' }, correct: false },
      ],
      explanation: {
        fr: 'San Fermin a Pampelune (juillet) : les lachadas de taureaux attirent des visiteurs du monde entier. Trafic intense !',
        en: 'San Fermin in Pamplona (July): the bull runs attract visitors from around the world. Heavy traffic!',
        es: 'San Fermin en Pamplona (julio): los encierros atraen visitantes de todo el mundo. Trafico intenso!',
        de: 'San Fermin in Pamplona (Juli): die Stierlaeufe ziehen Besucher aus aller Welt an. Starker Verkehr!',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quelle chaine de montagnes separe l\'Espagne de la France ?',
        en: 'Which mountain range separates Spain from France?',
        es: 'Que cadena montanosa separa Espana de Francia?',
        de: 'Welches Gebirge trennt Spanien von Frankreich?',
      },
      answers: [
        { text: { fr: 'Sierra Nevada', en: 'Sierra Nevada', es: 'Sierra Nevada', de: 'Sierra Nevada' }, correct: false },
        { text: { fr: 'Les Pyrenees', en: 'The Pyrenees', es: 'Los Pirineos', de: 'Die Pyrenaeen' }, correct: true },
        { text: { fr: 'Les Alpes', en: 'The Alps', es: 'Los Alpes', de: 'Die Alpen' }, correct: false },
        { text: { fr: 'La Cordillere Cantabrique', en: 'Cantabrian Mountains', es: 'Cordillera Cantabrica', de: 'Kantabrisches Gebirge' }, correct: false },
      ],
      explanation: {
        fr: 'Les Pyrenees s\'etendent sur 430 km entre l\'Atlantique et la Mediterranee. Le passage La Jonquera est cle pour les autostoppeurs.',
        en: 'The Pyrenees stretch 430 km between the Atlantic and Mediterranean. The La Jonquera crossing is key for hitchhikers.',
        es: 'Los Pirineos se extienden 430 km entre el Atlantico y el Mediterraneo. El paso de La Jonquera es clave para autostopistas.',
        de: 'Die Pyrenaeen erstrecken sich 430 km zwischen Atlantik und Mittelmeer. Der Uebergang La Jonquera ist wichtig fuer Tramper.',
      },
      category: 'geography',
    },
  ],
}
