/**
 * Quiz questions for United Kingdom
 * 10 questions about hitchhiking in the UK
 */

export const ukQuiz = {
  countryCode: 'GB',
  questions: [
    {
      question: {
        fr: 'De quel cote de la route conduit-on au Royaume-Uni ?',
        en: 'Which side of the road do you drive on in the UK?',
        es: 'Por que lado de la carretera se conduce en el Reino Unido?',
        de: 'Auf welcher Seite der Strasse faehrt man im Vereinigten Koenigreich?',
      },
      answers: [
        { text: { fr: 'A droite', en: 'On the right', es: 'Por la derecha', de: 'Rechts' }, correct: false },
        { text: { fr: 'A gauche', en: 'On the left', es: 'Por la izquierda', de: 'Links' }, correct: true },
        { text: { fr: 'Ca depend de la region', en: 'Depends on the region', es: 'Depende de la region', de: 'Kommt auf die Region an' }, correct: false },
        { text: { fr: 'Au milieu', en: 'In the middle', es: 'En el medio', de: 'In der Mitte' }, correct: false },
      ],
      explanation: {
        fr: 'Le Royaume-Uni roule a gauche ! Positionnez-vous du bon cote de la route pour que les conducteurs vous voient.',
        en: 'The UK drives on the left! Position yourself on the correct side of the road so drivers can see you.',
        es: 'En el Reino Unido se conduce por la izquierda! Coloquese en el lado correcto para que los conductores le vean.',
        de: 'Im UK faehrt man links! Stellen Sie sich auf die richtige Strassenseite, damit Fahrer Sie sehen koennen.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'L\'autostop est-il legal au Royaume-Uni ?',
        en: 'Is hitchhiking legal in the UK?',
        es: 'Es legal hacer autostop en el Reino Unido?',
        de: 'Ist Trampen im Vereinigten Koenigreich legal?',
      },
      answers: [
        { text: { fr: 'Legal partout', en: 'Legal everywhere', es: 'Legal en todas partes', de: 'Ueberall legal' }, correct: false },
        { text: { fr: 'Legal sauf sur les motorways', en: 'Legal except on motorways', es: 'Legal excepto en motorways', de: 'Legal ausser auf Motorways' }, correct: true },
        { text: { fr: 'Totalement interdit', en: 'Totally prohibited', es: 'Totalmente prohibido', de: 'Voellig verboten' }, correct: false },
        { text: { fr: 'Legal uniquement en Ecosse', en: 'Legal only in Scotland', es: 'Legal solo en Escocia', de: 'Nur in Schottland legal' }, correct: false },
      ],
      explanation: {
        fr: 'L\'autostop est legal au Royaume-Uni sauf sur les motorways (M-roads). Les stations-service pres des sorties sont ideales.',
        en: 'Hitchhiking is legal in the UK except on motorways (M-roads). Service stations near exits are ideal.',
        es: 'El autostop es legal en el Reino Unido excepto en las motorways (M-roads). Las gasolineras cerca de las salidas son ideales.',
        de: 'Trampen ist im UK legal ausser auf Motorways (M-roads). Tankstellen in der Naehe der Ausfahrten sind ideal.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quel est le plat britannique le plus emblematique ?',
        en: 'What is the most iconic British dish?',
        es: 'Cual es el plato britanico mas emblematico?',
        de: 'Was ist das beruehmteste britische Gericht?',
      },
      answers: [
        { text: { fr: 'Shepherd\'s Pie', en: 'Shepherd\'s Pie', es: 'Shepherd\'s Pie', de: 'Shepherd\'s Pie' }, correct: false },
        { text: { fr: 'Fish and Chips', en: 'Fish and Chips', es: 'Fish and Chips', de: 'Fish and Chips' }, correct: true },
        { text: { fr: 'Full English Breakfast', en: 'Full English Breakfast', es: 'Full English Breakfast', de: 'Full English Breakfast' }, correct: false },
        { text: { fr: 'Scones', en: 'Scones', es: 'Scones', de: 'Scones' }, correct: false },
      ],
      explanation: {
        fr: 'Fish and Chips est l\'embleme culinaire du Royaume-Uni depuis 1860. Parfait pour reprendre des forces entre deux lifts !',
        en: 'Fish and Chips has been a British culinary icon since 1860. Perfect for refueling between rides!',
        es: 'Fish and Chips es el icono culinario britanico desde 1860. Perfecto para reponer fuerzas entre viajes!',
        de: 'Fish and Chips ist seit 1860 ein britisches Kulinarik-Symbol. Perfekt zum Kraefte sammeln zwischen Fahrten!',
      },
      category: 'food',
    },
    {
      question: {
        fr: 'Quelle est la devise du Royaume-Uni ?',
        en: 'What is the currency of the UK?',
        es: 'Cual es la moneda del Reino Unido?',
        de: 'Was ist die Waehrung des Vereinigten Koenigreichs?',
      },
      answers: [
        { text: { fr: 'Euro', en: 'Euro', es: 'Euro', de: 'Euro' }, correct: false },
        { text: { fr: 'Livre Sterling', en: 'Pound Sterling', es: 'Libra Esterlina', de: 'Pfund Sterling' }, correct: true },
        { text: { fr: 'Dollar', en: 'Dollar', es: 'Dolar', de: 'Dollar' }, correct: false },
        { text: { fr: 'Couronne', en: 'Crown', es: 'Corona', de: 'Krone' }, correct: false },
      ],
      explanation: {
        fr: 'Le Royaume-Uni utilise la Livre Sterling (GBP). Prevoyez du cash pour les petits commerces en zone rurale.',
        en: 'The UK uses Pound Sterling (GBP). Bring cash for small shops in rural areas.',
        es: 'El Reino Unido usa la Libra Esterlina (GBP). Lleve efectivo para pequenos comercios en zonas rurales.',
        de: 'Das UK verwendet das Pfund Sterling (GBP). Bargeld fuer kleine Geschaefte in laendlichen Gebieten mitbringen.',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Combien de nations composent le Royaume-Uni ?',
        en: 'How many nations make up the United Kingdom?',
        es: 'Cuantas naciones componen el Reino Unido?',
        de: 'Aus wie vielen Nationen besteht das Vereinigte Koenigreich?',
      },
      answers: [
        { text: { fr: '2', en: '2', es: '2', de: '2' }, correct: false },
        { text: { fr: '3', en: '3', es: '3', de: '3' }, correct: false },
        { text: { fr: '4', en: '4', es: '4', de: '4' }, correct: true },
        { text: { fr: '5', en: '5', es: '5', de: '5' }, correct: false },
      ],
      explanation: {
        fr: 'Angleterre, Ecosse, Pays de Galles et Irlande du Nord. Chaque nation a sa culture et ses routes differentes.',
        en: 'England, Scotland, Wales and Northern Ireland. Each nation has its own culture and different roads.',
        es: 'Inglaterra, Escocia, Gales e Irlanda del Norte. Cada nacion tiene su propia cultura y carreteras.',
        de: 'England, Schottland, Wales und Nordirland. Jede Nation hat ihre eigene Kultur und andere Strassen.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel est le numero d\'urgence au Royaume-Uni ?',
        en: 'What is the emergency number in the UK?',
        es: 'Cual es el numero de emergencia en el Reino Unido?',
        de: 'Was ist die Notrufnummer im Vereinigten Koenigreich?',
      },
      answers: [
        { text: { fr: '112', en: '112', es: '112', de: '112' }, correct: false },
        { text: { fr: '999', en: '999', es: '999', de: '999' }, correct: true },
        { text: { fr: '911', en: '911', es: '911', de: '911' }, correct: false },
        { text: { fr: '111', en: '111', es: '111', de: '111' }, correct: false },
      ],
      explanation: {
        fr: '999 est le numero d\'urgence historique du Royaume-Uni (le plus ancien du monde, depuis 1937). Le 112 fonctionne aussi.',
        en: '999 is the UK\'s historic emergency number (the world\'s oldest, since 1937). 112 also works.',
        es: '999 es el numero de emergencia historico del Reino Unido (el mas antiguo del mundo, desde 1937). El 112 tambien funciona.',
        de: '999 ist die historische Notrufnummer des UK (die aelteste der Welt, seit 1937). 112 funktioniert auch.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Comment dit-on "autostop" en anglais britannique ?',
        en: 'What is the British English word for hitchhiking?',
        es: 'Cual es la palabra en ingles britanico para autostop?',
        de: 'Wie sagt man "Trampen" auf Britisch-Englisch?',
      },
      answers: [
        { text: { fr: 'Thumbing', en: 'Thumbing', es: 'Thumbing', de: 'Thumbing' }, correct: false },
        { text: { fr: 'Hitching', en: 'Hitching', es: 'Hitching', de: 'Hitching' }, correct: true },
        { text: { fr: 'Riding', en: 'Riding', es: 'Riding', de: 'Riding' }, correct: false },
        { text: { fr: 'Lifting', en: 'Lifting', es: 'Lifting', de: 'Lifting' }, correct: false },
      ],
      explanation: {
        fr: '"Hitching" ou "hitching a lift" est l\'expression la plus courante au Royaume-Uni. "Can I hitch a lift?" fonctionne toujours !',
        en: '"Hitching" or "hitching a lift" is the most common expression in the UK. "Can I hitch a lift?" always works!',
        es: '"Hitching" o "hitching a lift" es la expresion mas comun en el Reino Unido.',
        de: '"Hitching" oder "hitching a lift" ist der gaengigste Ausdruck im UK. "Can I hitch a lift?" funktioniert immer!',
      },
      category: 'language',
    },
    {
      question: {
        fr: 'Quelle region du Royaume-Uni est reputee la plus accueillante pour les autostoppeurs ?',
        en: 'Which UK region is considered most welcoming for hitchhikers?',
        es: 'Que region del Reino Unido es mas acogedora para los autostopistas?',
        de: 'Welche UK-Region gilt als am gastfreundlichsten fuer Tramper?',
      },
      answers: [
        { text: { fr: 'Londres', en: 'London', es: 'Londres', de: 'London' }, correct: false },
        { text: { fr: 'L\'Ecosse', en: 'Scotland', es: 'Escocia', de: 'Schottland' }, correct: true },
        { text: { fr: 'Le sud de l\'Angleterre', en: 'Southern England', es: 'Sur de Inglaterra', de: 'Suedengland' }, correct: false },
        { text: { fr: 'L\'Irlande du Nord', en: 'Northern Ireland', es: 'Irlanda del Norte', de: 'Nordirland' }, correct: false },
      ],
      explanation: {
        fr: 'L\'Ecosse est celebre pour son hospitalite envers les voyageurs. Les Highlands offrent des paysages magnifiques pour le stop.',
        en: 'Scotland is famous for its hospitality towards travellers. The Highlands offer stunning scenery for hitchhiking.',
        es: 'Escocia es famosa por su hospitalidad hacia los viajeros. Las Highlands ofrecen paisajes impresionantes.',
        de: 'Schottland ist beruehmt fuer seine Gastfreundschaft. Die Highlands bieten atemberaubende Landschaften zum Trampen.',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quel est le plus haut sommet du Royaume-Uni ?',
        en: 'What is the highest peak in the UK?',
        es: 'Cual es el pico mas alto del Reino Unido?',
        de: 'Was ist der hoechste Gipfel im Vereinigten Koenigreich?',
      },
      answers: [
        { text: { fr: 'Snowdon', en: 'Snowdon', es: 'Snowdon', de: 'Snowdon' }, correct: false },
        { text: { fr: 'Ben Nevis', en: 'Ben Nevis', es: 'Ben Nevis', de: 'Ben Nevis' }, correct: true },
        { text: { fr: 'Scafell Pike', en: 'Scafell Pike', es: 'Scafell Pike', de: 'Scafell Pike' }, correct: false },
        { text: { fr: 'Slieve Donard', en: 'Slieve Donard', es: 'Slieve Donard', de: 'Slieve Donard' }, correct: false },
      ],
      explanation: {
        fr: 'Ben Nevis en Ecosse culmine a 1345 m. C\'est un detour populaire pour les autostoppeurs traversant les Highlands.',
        en: 'Ben Nevis in Scotland reaches 1345 m. It\'s a popular detour for hitchhikers crossing the Highlands.',
        es: 'Ben Nevis en Escocia alcanza 1345 m. Es un desvio popular para autostopistas cruzando las Highlands.',
        de: 'Ben Nevis in Schottland erreicht 1345 m. Ein beliebter Abstecher fuer Tramper durch die Highlands.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel celebre tunnel relie le Royaume-Uni a la France ?',
        en: 'Which famous tunnel connects the UK to France?',
        es: 'Que famoso tunel conecta el Reino Unido con Francia?',
        de: 'Welcher beruehmte Tunnel verbindet das UK mit Frankreich?',
      },
      answers: [
        { text: { fr: 'Le tunnel de la Manche', en: 'The Channel Tunnel', es: 'El Eurotunel', de: 'Der Kanaltunnel' }, correct: true },
        { text: { fr: 'Le tunnel de Douvres', en: 'Dover Tunnel', es: 'El tunel de Dover', de: 'Der Dover-Tunnel' }, correct: false },
        { text: { fr: 'Le tunnel de Calais', en: 'Calais Tunnel', es: 'El tunel de Calais', de: 'Der Calais-Tunnel' }, correct: false },
        { text: { fr: 'Le tunnel de Londres', en: 'London Tunnel', es: 'El tunel de Londres', de: 'Der London-Tunnel' }, correct: false },
      ],
      explanation: {
        fr: 'Le tunnel sous la Manche (50 km) relie Folkestone a Coquelles. Impossible d\'y faire du stop, prenez le ferry a Douvres !',
        en: 'The Channel Tunnel (50 km) connects Folkestone to Coquelles. You can\'t hitchhike through it, take the ferry from Dover!',
        es: 'El Eurotunel (50 km) conecta Folkestone con Coquelles. No se puede hacer autostop alli, tome el ferry desde Dover!',
        de: 'Der Kanaltunnel (50 km) verbindet Folkestone mit Coquelles. Trampen ist dort unmoeglich, nehmen Sie die Faehre ab Dover!',
      },
      category: 'geography',
    },
  ],
}
