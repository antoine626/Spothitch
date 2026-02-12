/**
 * Quiz questions for France
 * 10 questions about hitchhiking in France
 */

export const franceQuiz = {
  countryCode: 'FR',
  questions: [
    {
      question: {
        fr: 'Quel est le numero d\'urgence universel en France ?',
        en: 'What is the universal emergency number in France?',
        es: 'Cual es el numero de emergencia universal en Francia?',
        de: 'Was ist die universelle Notrufnummer in Frankreich?',
      },
      answers: [
        { text: { fr: '911', en: '911', es: '911', de: '911' }, correct: false },
        { text: { fr: '112', en: '112', es: '112', de: '112' }, correct: true },
        { text: { fr: '999', en: '999', es: '999', de: '999' }, correct: false },
        { text: { fr: '15', en: '15', es: '15', de: '15' }, correct: false },
      ],
      explanation: {
        fr: 'Le 112 est le numero d\'urgence europeen, gratuit et accessible depuis n\'importe quel telephone.',
        en: '112 is the European emergency number, free and accessible from any phone.',
        es: 'El 112 es el numero de emergencia europeo, gratuito y accesible desde cualquier telefono.',
        de: '112 ist die europaeische Notrufnummer, kostenlos und von jedem Telefon erreichbar.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Ou est-il interdit de faire du stop en France ?',
        en: 'Where is hitchhiking prohibited in France?',
        es: 'Donde esta prohibido hacer autostop en Francia?',
        de: 'Wo ist Trampen in Frankreich verboten?',
      },
      answers: [
        { text: { fr: 'Aux stations-service', en: 'At gas stations', es: 'En las gasolineras', de: 'An Tankstellen' }, correct: false },
        { text: { fr: 'Sur les autoroutes et bretelles', en: 'On motorways and slip roads', es: 'En autopistas y rampas', de: 'Auf Autobahnen und Auffahrten' }, correct: true },
        { text: { fr: 'Aux aires de repos', en: 'At rest areas', es: 'En areas de descanso', de: 'An Rastplaetzen' }, correct: false },
        { text: { fr: 'Aux peages', en: 'At toll booths', es: 'En los peajes', de: 'An Mautstellen' }, correct: false },
      ],
      explanation: {
        fr: 'En France, l\'autostop est interdit sur les autoroutes elles-memes et les bretelles, mais autorise aux aires et peages.',
        en: 'In France, hitchhiking is prohibited on motorways and slip roads, but allowed at rest areas and toll booths.',
        es: 'En Francia, el autostop esta prohibido en las autopistas y rampas, pero permitido en areas de descanso y peajes.',
        de: 'In Frankreich ist Trampen auf Autobahnen und Auffahrten verboten, aber an Rastplaetzen und Mautstellen erlaubt.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quelle region francaise n\'a PAS de peages sur ses autoroutes ?',
        en: 'Which French region has NO tolls on its motorways?',
        es: 'Que region francesa NO tiene peajes en sus autopistas?',
        de: 'Welche franzoesische Region hat KEINE Maut auf ihren Autobahnen?',
      },
      answers: [
        { text: { fr: 'Provence', en: 'Provence', es: 'Provenza', de: 'Provence' }, correct: false },
        { text: { fr: 'Ile-de-France', en: 'Ile-de-France', es: 'Ile-de-France', de: 'Ile-de-France' }, correct: false },
        { text: { fr: 'Bretagne', en: 'Brittany', es: 'Bretana', de: 'Bretagne' }, correct: true },
        { text: { fr: 'Alsace', en: 'Alsace', es: 'Alsacia', de: 'Elsass' }, correct: false },
      ],
      explanation: {
        fr: 'La Bretagne est unique en France : ses autoroutes sont gratuites, ce qui change la strategie d\'autostop.',
        en: 'Brittany is unique in France: its motorways are free, which changes the hitchhiking strategy.',
        es: 'Bretana es unica en Francia: sus autopistas son gratuitas, lo que cambia la estrategia de autostop.',
        de: 'Die Bretagne ist einzigartig in Frankreich: ihre Autobahnen sind kostenlos, was die Tramper-Strategie veraendert.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Que signifie la plaque d\'immatriculation "75" en France ?',
        en: 'What does the license plate number "75" mean in France?',
        es: 'Que significa la matricula "75" en Francia?',
        de: 'Was bedeutet das Kennzeichen "75" in Frankreich?',
      },
      answers: [
        { text: { fr: 'Lyon', en: 'Lyon', es: 'Lyon', de: 'Lyon' }, correct: false },
        { text: { fr: 'Marseille', en: 'Marseille', es: 'Marsella', de: 'Marseille' }, correct: false },
        { text: { fr: 'Paris', en: 'Paris', es: 'Paris', de: 'Paris' }, correct: true },
        { text: { fr: 'Bordeaux', en: 'Bordeaux', es: 'Burdeos', de: 'Bordeaux' }, correct: false },
      ],
      explanation: {
        fr: 'Les plaques francaises indiquent le departement : 75=Paris, 13=Marseille, 69=Lyon, 33=Bordeaux.',
        en: 'French plates show the department: 75=Paris, 13=Marseille, 69=Lyon, 33=Bordeaux.',
        es: 'Las matriculas francesas indican el departamento: 75=Paris, 13=Marsella, 69=Lyon, 33=Burdeos.',
        de: 'Franzoesische Kennzeichen zeigen das Departement: 75=Paris, 13=Marseille, 69=Lyon, 33=Bordeaux.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quel fromage francais est le plus vendu au monde ?',
        en: 'Which French cheese is the best-selling in the world?',
        es: 'Que queso frances es el mas vendido del mundo?',
        de: 'Welcher franzoesische Kaese ist der meistverkaufte der Welt?',
      },
      answers: [
        { text: { fr: 'Roquefort', en: 'Roquefort', es: 'Roquefort', de: 'Roquefort' }, correct: false },
        { text: { fr: 'Camembert', en: 'Camembert', es: 'Camembert', de: 'Camembert' }, correct: true },
        { text: { fr: 'Brie', en: 'Brie', es: 'Brie', de: 'Brie' }, correct: false },
        { text: { fr: 'Comte', en: 'Comte', es: 'Comte', de: 'Comte' }, correct: false },
      ],
      explanation: {
        fr: 'Le Camembert est le fromage francais le plus connu et vendu dans le monde entier.',
        en: 'Camembert is the most famous and best-selling French cheese worldwide.',
        es: 'El Camembert es el queso frances mas famoso y vendido en todo el mundo.',
        de: 'Camembert ist der bekannteste und meistverkaufte franzoesische Kaese weltweit.',
      },
      category: 'food',
    },
    {
      question: {
        fr: 'Comment dit-on "je fais du stop" en francais familier ?',
        en: 'How do you say "I\'m hitchhiking" in informal French?',
        es: 'Como se dice "estoy haciendo autostop" en frances coloquial?',
        de: 'Wie sagt man "Ich trampe" auf umgangssprachlichem Franzoesisch?',
      },
      answers: [
        { text: { fr: 'Je voyage', en: 'Je voyage', es: 'Je voyage', de: 'Je voyage' }, correct: false },
        { text: { fr: 'Je fais du pouce', en: 'Je fais du pouce', es: 'Je fais du pouce', de: 'Je fais du pouce' }, correct: true },
        { text: { fr: 'Je marche', en: 'Je marche', es: 'Je marche', de: 'Je marche' }, correct: false },
        { text: { fr: 'Je roule', en: 'Je roule', es: 'Je roule', de: 'Je roule' }, correct: false },
      ],
      explanation: {
        fr: '"Faire du pouce" est l\'expression familiere pour l\'autostop, utilisee surtout au Quebec et en France.',
        en: '"Faire du pouce" (thumb it) is the informal expression for hitchhiking, used in Quebec and France.',
        es: '"Faire du pouce" (hacer del pulgar) es la expresion coloquial para el autostop en Francia y Quebec.',
        de: '"Faire du pouce" (Daumen machen) ist der umgangssprachliche Ausdruck fuer Trampen in Frankreich und Quebec.',
      },
      category: 'language',
    },
    {
      question: {
        fr: 'Quel fleuve traverse Paris ?',
        en: 'Which river flows through Paris?',
        es: 'Que rio atraviesa Paris?',
        de: 'Welcher Fluss fliesst durch Paris?',
      },
      answers: [
        { text: { fr: 'La Loire', en: 'The Loire', es: 'El Loira', de: 'Die Loire' }, correct: false },
        { text: { fr: 'Le Rhone', en: 'The Rhone', es: 'El Rodano', de: 'Die Rhone' }, correct: false },
        { text: { fr: 'La Seine', en: 'The Seine', es: 'El Sena', de: 'Die Seine' }, correct: true },
        { text: { fr: 'La Garonne', en: 'The Garonne', es: 'El Garona', de: 'Die Garonne' }, correct: false },
      ],
      explanation: {
        fr: 'La Seine traverse Paris du sud-est au nord-ouest, divisant la ville en Rive Gauche et Rive Droite.',
        en: 'The Seine flows through Paris from southeast to northwest, dividing the city into Left Bank and Right Bank.',
        es: 'El Sena atraviesa Paris de sureste a noroeste, dividiendo la ciudad en Margen Izquierda y Margen Derecha.',
        de: 'Die Seine fliesst durch Paris von Suedosten nach Nordwesten und teilt die Stadt in Linkes und Rechtes Ufer.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel jour les camions ne circulent pas en France ?',
        en: 'On which day are trucks restricted in France?',
        es: 'Que dia los camiones no circulan en Francia?',
        de: 'An welchem Tag duerfen LKW in Frankreich nicht fahren?',
      },
      answers: [
        { text: { fr: 'Lundi', en: 'Monday', es: 'Lunes', de: 'Montag' }, correct: false },
        { text: { fr: 'Mercredi', en: 'Wednesday', es: 'Miercoles', de: 'Mittwoch' }, correct: false },
        { text: { fr: 'Vendredi', en: 'Friday', es: 'Viernes', de: 'Freitag' }, correct: false },
        { text: { fr: 'Dimanche', en: 'Sunday', es: 'Domingo', de: 'Sonntag' }, correct: true },
      ],
      explanation: {
        fr: 'Le dimanche, seuls les camions de produits surgeles circulent en France, les autres sont limites a 90 km/h.',
        en: 'On Sundays, only frozen goods trucks are allowed in France, others are limited to 90 km/h.',
        es: 'Los domingos, solo los camiones de productos congelados circulan en Francia.',
        de: 'Am Sonntag duerfen in Frankreich nur Kuehl-LKW fahren, andere sind auf 90 km/h begrenzt.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quelle est la fete nationale francaise ?',
        en: 'When is the French national holiday?',
        es: 'Cuando es la fiesta nacional francesa?',
        de: 'Wann ist der franzoesische Nationalfeiertag?',
      },
      answers: [
        { text: { fr: '1er mai', en: 'May 1st', es: '1 de mayo', de: '1. Mai' }, correct: false },
        { text: { fr: '14 juillet', en: 'July 14th', es: '14 de julio', de: '14. Juli' }, correct: true },
        { text: { fr: '25 decembre', en: 'December 25th', es: '25 de diciembre', de: '25. Dezember' }, correct: false },
        { text: { fr: '11 novembre', en: 'November 11th', es: '11 de noviembre', de: '11. November' }, correct: false },
      ],
      explanation: {
        fr: 'Le 14 juillet celebre la prise de la Bastille en 1789. Attention : le trafic routier change ce jour-la !',
        en: 'July 14th celebrates the storming of the Bastille in 1789. Note: road traffic patterns change that day!',
        es: 'El 14 de julio celebra la toma de la Bastilla en 1789. Atencion: el trafico cambia ese dia!',
        de: 'Der 14. Juli feiert den Sturm auf die Bastille 1789. Achtung: der Verkehr aendert sich an diesem Tag!',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quelle est l\'amende pour autostop illegal sur autoroute en France ?',
        en: 'What is the fine for illegal hitchhiking on a French motorway?',
        es: 'Cual es la multa por autostop ilegal en autopistas francesas?',
        de: 'Wie hoch ist das Bussgeld fuer illegales Trampen auf franzoesischen Autobahnen?',
      },
      answers: [
        { text: { fr: '100-200 EUR', en: '100-200 EUR', es: '100-200 EUR', de: '100-200 EUR' }, correct: false },
        { text: { fr: '11-40 EUR', en: '11-40 EUR', es: '11-40 EUR', de: '11-40 EUR' }, correct: true },
        { text: { fr: '500 EUR', en: '500 EUR', es: '500 EUR', de: '500 EUR' }, correct: false },
        { text: { fr: 'Pas d\'amende', en: 'No fine', es: 'Sin multa', de: 'Kein Bussgeld' }, correct: false },
      ],
      explanation: {
        fr: 'L\'amende est de 11 a 40 EUR, mais elle est rarement appliquee (environ 5% des cas).',
        en: 'The fine is 11-40 EUR, but it is rarely enforced (about 5% of cases).',
        es: 'La multa es de 11-40 EUR, pero raramente se aplica (alrededor del 5% de los casos).',
        de: 'Das Bussgeld betraegt 11-40 EUR, wird aber selten durchgesetzt (ca. 5% der Faelle).',
      },
      category: 'transport',
    },
  ],
}
