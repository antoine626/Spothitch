/**
 * Quiz questions for Netherlands
 * 10 questions about hitchhiking in the Netherlands
 */

export const netherlandsQuiz = {
  countryCode: 'NL',
  questions: [
    {
      question: {
        fr: 'Pourquoi les Pays-Bas sont-ils consideres comme le meilleur pays pour le stop ?',
        en: 'Why are the Netherlands considered the best country for hitchhiking?',
        es: 'Por que los Paises Bajos se consideran el mejor pais para el autostop?',
        de: 'Warum gelten die Niederlande als bestes Land zum Trampen?',
      },
      answers: [
        { text: { fr: 'Les routes sont droites', en: 'The roads are straight', es: 'Las carreteras son rectas', de: 'Die Strassen sind gerade' }, correct: false },
        { text: { fr: 'Culture d\'entraide + distances courtes', en: 'Helpful culture + short distances', es: 'Cultura de ayuda + distancias cortas', de: 'Hilfsbereitschaft + kurze Distanzen' }, correct: true },
        { text: { fr: 'Il n\'y a pas de trains', en: 'There are no trains', es: 'No hay trenes', de: 'Es gibt keine Zuege' }, correct: false },
        { text: { fr: 'L\'essence est gratuite', en: 'Gas is free', es: 'La gasolina es gratis', de: 'Benzin ist kostenlos' }, correct: false },
      ],
      explanation: {
        fr: 'Les Neerlandais ont une forte culture d\'entraide et les distances entre villes sont courtes. Temps d\'attente moyen : 15 min.',
        en: 'The Dutch have a strong helping culture and distances between cities are short. Average wait time: 15 min.',
        es: 'Los neerlandeses tienen una fuerte cultura de ayuda y las distancias son cortas. Tiempo de espera medio: 15 min.',
        de: 'Die Niederlaender haben eine starke Hilfskultur und die Entfernungen sind kurz. Durchschnittliche Wartezeit: 15 Min.',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quel transport est le plus populaire aux Pays-Bas ?',
        en: 'What is the most popular transport in the Netherlands?',
        es: 'Cual es el transporte mas popular en los Paises Bajos?',
        de: 'Was ist das beliebteste Verkehrsmittel in den Niederlanden?',
      },
      answers: [
        { text: { fr: 'La voiture', en: 'The car', es: 'El coche', de: 'Das Auto' }, correct: false },
        { text: { fr: 'Le velo', en: 'The bicycle', es: 'La bicicleta', de: 'Das Fahrrad' }, correct: true },
        { text: { fr: 'Le bus', en: 'The bus', es: 'El autobus', de: 'Der Bus' }, correct: false },
        { text: { fr: 'Le bateau', en: 'The boat', es: 'El barco', de: 'Das Boot' }, correct: false },
      ],
      explanation: {
        fr: 'Les Pays-Bas comptent plus de velos (23 millions) que d\'habitants (17 millions). La culture du velo est unique au monde.',
        en: 'The Netherlands has more bicycles (23 million) than people (17 million). The cycling culture is unique worldwide.',
        es: 'Los Paises Bajos tienen mas bicicletas (23 millones) que habitantes (17 millones). La cultura ciclista es unica.',
        de: 'Die Niederlande haben mehr Fahrraeder (23 Mio.) als Einwohner (17 Mio.). Die Fahrradkultur ist weltweit einzigartig.',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quelle est la capitale des Pays-Bas ?',
        en: 'What is the capital of the Netherlands?',
        es: 'Cual es la capital de los Paises Bajos?',
        de: 'Was ist die Hauptstadt der Niederlande?',
      },
      answers: [
        { text: { fr: 'Rotterdam', en: 'Rotterdam', es: 'Rotterdam', de: 'Rotterdam' }, correct: false },
        { text: { fr: 'La Haye', en: 'The Hague', es: 'La Haya', de: 'Den Haag' }, correct: false },
        { text: { fr: 'Amsterdam', en: 'Amsterdam', es: 'Amsterdam', de: 'Amsterdam' }, correct: true },
        { text: { fr: 'Utrecht', en: 'Utrecht', es: 'Utrecht', de: 'Utrecht' }, correct: false },
      ],
      explanation: {
        fr: 'Amsterdam est la capitale, mais le gouvernement siege a La Haye. Les autostoppeurs confondent souvent les deux !',
        en: 'Amsterdam is the capital, but the government sits in The Hague. Hitchhikers often confuse the two!',
        es: 'Amsterdam es la capital, pero el gobierno esta en La Haya. Los autostopistas a menudo confunden las dos!',
        de: 'Amsterdam ist die Hauptstadt, aber die Regierung sitzt in Den Haag. Tramper verwechseln oft die beiden!',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel aliment est le snack de rue le plus populaire aux Pays-Bas ?',
        en: 'What food is the most popular street snack in the Netherlands?',
        es: 'Que comida es el snack callejero mas popular en los Paises Bajos?',
        de: 'Welches Essen ist der beliebteste Strassensnack in den Niederlanden?',
      },
      answers: [
        { text: { fr: 'Stroopwafel', en: 'Stroopwafel', es: 'Stroopwafel', de: 'Stroopwafel' }, correct: false },
        { text: { fr: 'Frites avec mayonnaise', en: 'Fries with mayonnaise', es: 'Patatas fritas con mayonesa', de: 'Pommes mit Mayonnaise' }, correct: true },
        { text: { fr: 'Hareng cru', en: 'Raw herring', es: 'Arenque crudo', de: 'Roher Hering' }, correct: false },
        { text: { fr: 'Kroket', en: 'Kroket', es: 'Kroket', de: 'Kroket' }, correct: false },
      ],
      explanation: {
        fr: 'Les "friet" (frites) avec mayonnaise sont LE snack neerlandais. On les trouve a chaque coin de rue et dans les stations.',
        en: '"Friet" (fries) with mayonnaise are THE Dutch snack. Found at every corner and in service stations.',
        es: 'Las "friet" (patatas fritas) con mayonesa son EL snack neerlandes. Se encuentran en cada esquina y en las gasolineras.',
        de: '"Friet" (Pommes) mit Mayonnaise sind DER niederlaendische Snack. An jeder Ecke und in Tankstellen zu finden.',
      },
      category: 'food',
    },
    {
      question: {
        fr: 'Comment dit-on "Pouvez-vous m\'emmener ?" en neerlandais ?',
        en: 'How do you say "Can you give me a ride?" in Dutch?',
        es: 'Como se dice "Puede llevarme?" en neerlandes?',
        de: 'Wie sagt man "Koennen Sie mich mitnehmen?" auf Niederlaendisch?',
      },
      answers: [
        { text: { fr: 'Kunt u mij meenemen?', en: 'Kunt u mij meenemen?', es: 'Kunt u mij meenemen?', de: 'Kunt u mij meenemen?' }, correct: true },
        { text: { fr: 'Ik wil rijden', en: 'Ik wil rijden', es: 'Ik wil rijden', de: 'Ik wil rijden' }, correct: false },
        { text: { fr: 'Neem mij weg', en: 'Neem mij weg', es: 'Neem mij weg', de: 'Neem mij weg' }, correct: false },
        { text: { fr: 'Breng mij thuis', en: 'Breng mij thuis', es: 'Breng mij thuis', de: 'Breng mij thuis' }, correct: false },
      ],
      explanation: {
        fr: '"Kunt u mij meenemen naar...?" est la phrase cle en neerlandais. Mais la plupart des Neerlandais parlent tres bien anglais !',
        en: '"Kunt u mij meenemen naar...?" is the key Dutch phrase. But most Dutch speak excellent English!',
        es: '"Kunt u mij meenemen naar...?" es la frase clave en neerlandes. Pero la mayoria de los neerlandeses hablan excelente ingles!',
        de: '"Kunt u mij meenemen naar...?" ist der wichtigste niederlaendische Satz. Aber die meisten Niederlaender sprechen ausgezeichnetes Englisch!',
      },
      category: 'language',
    },
    {
      question: {
        fr: 'Quel pourcentage du territoire neerlandais est sous le niveau de la mer ?',
        en: 'What percentage of the Netherlands is below sea level?',
        es: 'Que porcentaje del territorio neerlandes esta bajo el nivel del mar?',
        de: 'Welcher Prozentsatz der Niederlande liegt unter dem Meeresspiegel?',
      },
      answers: [
        { text: { fr: '10%', en: '10%', es: '10%', de: '10%' }, correct: false },
        { text: { fr: '26%', en: '26%', es: '26%', de: '26%' }, correct: true },
        { text: { fr: '50%', en: '50%', es: '50%', de: '50%' }, correct: false },
        { text: { fr: '5%', en: '5%', es: '5%', de: '5%' }, correct: false },
      ],
      explanation: {
        fr: '26% des Pays-Bas sont sous le niveau de la mer. Le systeme de digues est essentiel et les routes suivent souvent les polders.',
        en: '26% of the Netherlands is below sea level. The dike system is essential and roads often follow the polders.',
        es: 'El 26% de los Paises Bajos esta bajo el nivel del mar. El sistema de diques es esencial y las carreteras siguen los polders.',
        de: '26% der Niederlande liegen unter dem Meeresspiegel. Das Deichsystem ist essenziell und Strassen folgen oft den Poldern.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel est le plus grand port d\'Europe ?',
        en: 'What is the largest port in Europe?',
        es: 'Cual es el puerto mas grande de Europa?',
        de: 'Was ist der groesste Hafen Europas?',
      },
      answers: [
        { text: { fr: 'Amsterdam', en: 'Amsterdam', es: 'Amsterdam', de: 'Amsterdam' }, correct: false },
        { text: { fr: 'Rotterdam', en: 'Rotterdam', es: 'Rotterdam', de: 'Rotterdam' }, correct: true },
        { text: { fr: 'Hambourg', en: 'Hamburg', es: 'Hamburgo', de: 'Hamburg' }, correct: false },
        { text: { fr: 'Anvers', en: 'Antwerp', es: 'Amberes', de: 'Antwerpen' }, correct: false },
      ],
      explanation: {
        fr: 'Rotterdam est le plus grand port d\'Europe. Beaucoup de camionneurs passent par la, ideal pour le stop longue distance.',
        en: 'Rotterdam is the largest port in Europe. Many truckers pass through, ideal for long-distance hitchhiking.',
        es: 'Rotterdam es el puerto mas grande de Europa. Muchos camioneros pasan por alli, ideal para autostop de larga distancia.',
        de: 'Rotterdam ist der groesste Hafen Europas. Viele LKW-Fahrer kommen durch, ideal fuer Langstrecken-Trampen.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'De quelle couleur est traditionnellement la famille royale neerlandaise ?',
        en: 'What color is traditionally associated with the Dutch royal family?',
        es: 'De que color es tradicionalmente la familia real neerlandesa?',
        de: 'Welche Farbe wird traditionell mit dem niederlaendischen Koenigshaus verbunden?',
      },
      answers: [
        { text: { fr: 'Bleu', en: 'Blue', es: 'Azul', de: 'Blau' }, correct: false },
        { text: { fr: 'Orange', en: 'Orange', es: 'Naranja', de: 'Orange' }, correct: true },
        { text: { fr: 'Rouge', en: 'Red', es: 'Rojo', de: 'Rot' }, correct: false },
        { text: { fr: 'Vert', en: 'Green', es: 'Verde', de: 'Gruen' }, correct: false },
      ],
      explanation: {
        fr: 'L\'orange vient de la Maison d\'Orange-Nassau. Le Jour du Roi (27 avril) tout le monde porte de l\'orange — trafic festif !',
        en: 'Orange comes from the House of Orange-Nassau. On King\'s Day (April 27) everyone wears orange — festive traffic!',
        es: 'El naranja viene de la Casa de Orange-Nassau. En el Dia del Rey (27 abril) todos visten de naranja — trafico festivo!',
        de: 'Orange kommt vom Haus Oranien-Nassau. Am Koenigstag (27. April) traegt jeder Orange — festlicher Verkehr!',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Pour quoi les Pays-Bas sont-ils mondialement celebres dans l\'agriculture ?',
        en: 'What are the Netherlands world-famous for in agriculture?',
        es: 'Por que son mundialmente famosos los Paises Bajos en agricultura?',
        de: 'Wofuer sind die Niederlande in der Landwirtschaft weltberuehmt?',
      },
      answers: [
        { text: { fr: 'Les tomates', en: 'Tomatoes', es: 'Los tomates', de: 'Tomaten' }, correct: false },
        { text: { fr: 'Les tulipes', en: 'Tulips', es: 'Los tulipanes', de: 'Tulpen' }, correct: true },
        { text: { fr: 'Le ble', en: 'Wheat', es: 'El trigo', de: 'Weizen' }, correct: false },
        { text: { fr: 'Les olives', en: 'Olives', es: 'Las aceitunas', de: 'Oliven' }, correct: false },
      ],
      explanation: {
        fr: 'Les tulipes sont le symbole des Pays-Bas. Au printemps, les champs de fleurs multicolores sont un spectacle unique sur la route.',
        en: 'Tulips are the symbol of the Netherlands. In spring, the colorful flower fields are a unique sight on the road.',
        es: 'Los tulipanes son el simbolo de los Paises Bajos. En primavera, los campos de flores son un espectaculo unico en la carretera.',
        de: 'Tulpen sind das Symbol der Niederlande. Im Fruehling sind die bunten Blumenfelder ein einzigartiger Anblick auf der Strasse.',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quel fromage neerlandais est le plus exporte au monde ?',
        en: 'Which Dutch cheese is the most exported in the world?',
        es: 'Que queso neerlandes es el mas exportado del mundo?',
        de: 'Welcher niederlaendische Kaese wird weltweit am meisten exportiert?',
      },
      answers: [
        { text: { fr: 'Edam', en: 'Edam', es: 'Edam', de: 'Edamer' }, correct: false },
        { text: { fr: 'Gouda', en: 'Gouda', es: 'Gouda', de: 'Gouda' }, correct: true },
        { text: { fr: 'Maasdam', en: 'Maasdam', es: 'Maasdam', de: 'Maasdamer' }, correct: false },
        { text: { fr: 'Leiden', en: 'Leiden', es: 'Leiden', de: 'Leidener' }, correct: false },
      ],
      explanation: {
        fr: 'Le Gouda represente 50-60% de la production fromagere neerlandaise. On le trouve dans toutes les stations-service du pays.',
        en: 'Gouda represents 50-60% of Dutch cheese production. Found in every service station in the country.',
        es: 'El Gouda representa el 50-60% de la produccion quesera neerlandesa. Se encuentra en todas las gasolineras del pais.',
        de: 'Gouda macht 50-60% der niederlaendischen Kaeseproduktion aus. In jeder Tankstelle des Landes zu finden.',
      },
      category: 'food',
    },
  ],
}
