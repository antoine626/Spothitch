/**
 * Quiz questions for Germany
 * 10 questions about hitchhiking in Germany
 */

export const germanyQuiz = {
  countryCode: 'DE',
  questions: [
    {
      question: {
        fr: 'Comment s\'appellent les aires d\'autoroute avec station-service en Allemagne ?',
        en: 'What are motorway service areas with gas stations called in Germany?',
        es: 'Como se llaman las areas de servicio con gasolinera en Alemania?',
        de: 'Wie heissen die Autobahn-Serviceplaetze mit Tankstelle in Deutschland?',
      },
      answers: [
        { text: { fr: 'Autohof', en: 'Autohof', es: 'Autohof', de: 'Autohof' }, correct: false },
        { text: { fr: 'Raststaette', en: 'Raststaette', es: 'Raststaette', de: 'Raststaette' }, correct: true },
        { text: { fr: 'Tankplatz', en: 'Tankplatz', es: 'Tankplatz', de: 'Tankplatz' }, correct: false },
        { text: { fr: 'Fahrstation', en: 'Fahrstation', es: 'Fahrstation', de: 'Fahrstation' }, correct: false },
      ],
      explanation: {
        fr: 'Les Raststaetten sont les meilleures aires pour le stop en Allemagne, superieures aux simples aires de repos.',
        en: 'Raststaetten are the best service areas for hitchhiking in Germany, better than simple rest areas.',
        es: 'Las Raststaetten son las mejores areas de servicio para el autostop en Alemania.',
        de: 'Raststaetten sind die besten Serviceplaetze zum Trampen in Deutschland, besser als einfache Rastplaetze.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quelle est la limite de vitesse sur l\'Autobahn allemande ?',
        en: 'What is the speed limit on the German Autobahn?',
        es: 'Cual es el limite de velocidad en la Autobahn alemana?',
        de: 'Was ist die Geschwindigkeitsbegrenzung auf der deutschen Autobahn?',
      },
      answers: [
        { text: { fr: '120 km/h', en: '120 km/h', es: '120 km/h', de: '120 km/h' }, correct: false },
        { text: { fr: '130 km/h', en: '130 km/h', es: '130 km/h', de: '130 km/h' }, correct: false },
        { text: { fr: 'Pas de limite (recommandation 130)', en: 'No limit (130 recommended)', es: 'Sin limite (recomendacion 130)', de: 'Kein Limit (Empfehlung 130)' }, correct: true },
        { text: { fr: '150 km/h', en: '150 km/h', es: '150 km/h', de: '150 km/h' }, correct: false },
      ],
      explanation: {
        fr: 'L\'Allemagne est celebre pour ses sections d\'Autobahn sans limite de vitesse, avec une recommandation de 130 km/h.',
        en: 'Germany is famous for its unrestricted Autobahn sections, with a recommended speed of 130 km/h.',
        es: 'Alemania es famosa por sus tramos de Autobahn sin limite de velocidad, con recomendacion de 130 km/h.',
        de: 'Deutschland ist beruehmt fuer seine unbegrenzten Autobahnabschnitte, mit einer Empfehlung von 130 km/h.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Que signifie le code "HH" sur une plaque allemande ?',
        en: 'What does "HH" mean on a German license plate?',
        es: 'Que significa "HH" en una matricula alemana?',
        de: 'Was bedeutet "HH" auf einem deutschen Kennzeichen?',
      },
      answers: [
        { text: { fr: 'Hanovre', en: 'Hanover', es: 'Hannover', de: 'Hannover' }, correct: false },
        { text: { fr: 'Heidelberg', en: 'Heidelberg', es: 'Heidelberg', de: 'Heidelberg' }, correct: false },
        { text: { fr: 'Hambourg', en: 'Hamburg', es: 'Hamburgo', de: 'Hamburg' }, correct: true },
        { text: { fr: 'Hesse', en: 'Hesse', es: 'Hesse', de: 'Hessen' }, correct: false },
      ],
      explanation: {
        fr: 'Les plaques allemandes indiquent la ville/region : B=Berlin, M=Munich, HH=Hambourg, K=Cologne.',
        en: 'German plates show the city/region: B=Berlin, M=Munich, HH=Hamburg, K=Cologne.',
        es: 'Las matriculas alemanas indican la ciudad/region: B=Berlin, M=Munich, HH=Hamburgo, K=Colonia.',
        de: 'Deutsche Kennzeichen zeigen Stadt/Region: B=Berlin, M=Muenchen, HH=Hamburg, K=Koeln.',
      },
      category: 'transport',
    },
    {
      question: {
        fr: 'Quelle boisson allemande est la plus populaire au monde ?',
        en: 'Which German drink is the most popular worldwide?',
        es: 'Cual es la bebida alemana mas popular del mundo?',
        de: 'Welches deutsche Getraenk ist weltweit am beliebtesten?',
      },
      answers: [
        { text: { fr: 'Le vin du Rhin', en: 'Rhine wine', es: 'Vino del Rin', de: 'Rheinwein' }, correct: false },
        { text: { fr: 'La biere', en: 'Beer', es: 'La cerveza', de: 'Bier' }, correct: true },
        { text: { fr: 'Le schnaps', en: 'Schnapps', es: 'El schnapps', de: 'Schnaps' }, correct: false },
        { text: { fr: 'L\'Apfelschorle', en: 'Apfelschorle', es: 'Apfelschorle', de: 'Apfelschorle' }, correct: false },
      ],
      explanation: {
        fr: 'L\'Allemagne est le 3e producteur mondial de biere avec plus de 1300 brasseries. Partager une biere brise la glace !',
        en: 'Germany is the 3rd largest beer producer with over 1300 breweries. Sharing a beer breaks the ice!',
        es: 'Alemania es el 3er productor mundial de cerveza con mas de 1300 cerveceras. Compartir una cerveza rompe el hielo!',
        de: 'Deutschland ist der drittgroesste Bierproduzent mit ueber 1300 Brauereien. Ein gemeinsames Bier bricht das Eis!',
      },
      category: 'food',
    },
    {
      question: {
        fr: 'Quelle region allemande est la plus difficile pour le stop ?',
        en: 'Which German region is the hardest for hitchhiking?',
        es: 'Que region alemana es la mas dificil para el autostop?',
        de: 'Welche deutsche Region ist am schwierigsten zum Trampen?',
      },
      answers: [
        { text: { fr: 'Baviere', en: 'Bavaria', es: 'Baviera', de: 'Bayern' }, correct: false },
        { text: { fr: 'Region de la Ruhr', en: 'Ruhr area', es: 'Region del Ruhr', de: 'Ruhrgebiet' }, correct: true },
        { text: { fr: 'Saxe', en: 'Saxony', es: 'Sajonia', de: 'Sachsen' }, correct: false },
        { text: { fr: 'Schleswig-Holstein', en: 'Schleswig-Holstein', es: 'Schleswig-Holstein', de: 'Schleswig-Holstein' }, correct: false },
      ],
      explanation: {
        fr: 'La region de la Ruhr (Dortmund, Essen) a peu de Raststaetten, ce qui rend le stop plus difficile.',
        en: 'The Ruhr area (Dortmund, Essen) has few Raststaetten, making hitchhiking more difficult.',
        es: 'La region del Ruhr (Dortmund, Essen) tiene pocas Raststaetten, lo que dificulta el autostop.',
        de: 'Das Ruhrgebiet (Dortmund, Essen) hat wenige Raststaetten, was das Trampen schwieriger macht.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Combien d\'Etats federaux (Laender) compte l\'Allemagne ?',
        en: 'How many federal states (Laender) does Germany have?',
        es: 'Cuantos estados federales (Laender) tiene Alemania?',
        de: 'Wie viele Bundeslaender hat Deutschland?',
      },
      answers: [
        { text: { fr: '12', en: '12', es: '12', de: '12' }, correct: false },
        { text: { fr: '16', en: '16', es: '16', de: '16' }, correct: true },
        { text: { fr: '20', en: '20', es: '20', de: '20' }, correct: false },
        { text: { fr: '9', en: '9', es: '9', de: '9' }, correct: false },
      ],
      explanation: {
        fr: 'L\'Allemagne a 16 Laender, chacun avec ses propres lois, ce qui peut affecter les regles du stop.',
        en: 'Germany has 16 Laender, each with its own laws, which can affect hitchhiking rules.',
        es: 'Alemania tiene 16 Laender, cada uno con sus propias leyes, lo que puede afectar las reglas del autostop.',
        de: 'Deutschland hat 16 Bundeslaender, jedes mit eigenen Gesetzen, die Tramper-Regeln beeinflussen koennen.',
      },
      category: 'geography',
    },
    {
      question: {
        fr: 'Quel est le plat de rue allemand le plus typique ?',
        en: 'What is the most typical German street food?',
        es: 'Cual es la comida callejera alemana mas tipica?',
        de: 'Was ist das typischste deutsche Strassenessen?',
      },
      answers: [
        { text: { fr: 'Brezel', en: 'Pretzel', es: 'Pretzel', de: 'Brezel' }, correct: false },
        { text: { fr: 'Currywurst', en: 'Currywurst', es: 'Currywurst', de: 'Currywurst' }, correct: true },
        { text: { fr: 'Schnitzel', en: 'Schnitzel', es: 'Schnitzel', de: 'Schnitzel' }, correct: false },
        { text: { fr: 'Kartoffelsalat', en: 'Potato salad', es: 'Ensalada de patata', de: 'Kartoffelsalat' }, correct: false },
      ],
      explanation: {
        fr: 'La Currywurst est LA street food allemande par excellence, inventee a Berlin en 1949. Ideal pour les pauses stop !',
        en: 'Currywurst is THE quintessential German street food, invented in Berlin in 1949. Perfect for hitchhiking breaks!',
        es: 'La Currywurst es LA comida callejera alemana por excelencia, inventada en Berlin en 1949. Ideal para pausas de autostop!',
        de: 'Currywurst ist DAS deutsche Strassenessen schlechthin, 1949 in Berlin erfunden. Perfekt fuer Tramper-Pausen!',
      },
      category: 'food',
    },
    {
      question: {
        fr: 'Comment dit-on "Je fais du stop" en allemand ?',
        en: 'How do you say "I\'m hitchhiking" in German?',
        es: 'Como se dice "Estoy haciendo autostop" en aleman?',
        de: 'Wie sagt man "Ich trampe" auf Deutsch?',
      },
      answers: [
        { text: { fr: 'Ich fahre mit', en: 'Ich fahre mit', es: 'Ich fahre mit', de: 'Ich fahre mit' }, correct: false },
        { text: { fr: 'Ich trampe', en: 'Ich trampe', es: 'Ich trampe', de: 'Ich trampe' }, correct: true },
        { text: { fr: 'Ich reise', en: 'Ich reise', es: 'Ich reise', de: 'Ich reise' }, correct: false },
        { text: { fr: 'Ich wandere', en: 'Ich wandere', es: 'Ich wandere', de: 'Ich wandere' }, correct: false },
      ],
      explanation: {
        fr: '"Trampen" est le verbe allemand pour l\'autostop. "Ich trampe nach..." = "Je fais du stop vers..."',
        en: '"Trampen" is the German verb for hitchhiking. "Ich trampe nach..." = "I\'m hitchhiking to..."',
        es: '"Trampen" es el verbo aleman para el autostop. "Ich trampe nach..." = "Estoy haciendo autostop hacia..."',
        de: '"Trampen" ist das deutsche Verb fuer Anhalterfahren. "Ich trampe nach..." bedeutet man reist per Anhalter.',
      },
      category: 'language',
    },
    {
      question: {
        fr: 'Quelle fete culturelle attire le plus de monde en Allemagne ?',
        en: 'Which cultural festival attracts the most people in Germany?',
        es: 'Que festival cultural atrae mas gente en Alemania?',
        de: 'Welches Kulturfestival zieht die meisten Besucher in Deutschland an?',
      },
      answers: [
        { text: { fr: 'Carnaval de Cologne', en: 'Cologne Carnival', es: 'Carnaval de Colonia', de: 'Koelner Karneval' }, correct: false },
        { text: { fr: 'Oktoberfest', en: 'Oktoberfest', es: 'Oktoberfest', de: 'Oktoberfest' }, correct: true },
        { text: { fr: 'Berlinale', en: 'Berlinale', es: 'Berlinale', de: 'Berlinale' }, correct: false },
        { text: { fr: 'Marche de Noel de Dresde', en: 'Dresden Christmas Market', es: 'Mercado de Navidad de Dresde', de: 'Dresdner Striezelmarkt' }, correct: false },
      ],
      explanation: {
        fr: 'L\'Oktoberfest de Munich attire plus de 6 millions de visiteurs. Le stop est facile a cette periode !',
        en: 'Munich\'s Oktoberfest attracts over 6 million visitors. Hitchhiking is easy during this period!',
        es: 'El Oktoberfest de Munich atrae mas de 6 millones de visitantes. El autostop es facil en esta epoca!',
        de: 'Das Muenchner Oktoberfest zieht ueber 6 Millionen Besucher an. Trampen ist in dieser Zeit einfach!',
      },
      category: 'culture',
    },
    {
      question: {
        fr: 'Quand les camions sont-ils interdits de circulation en Allemagne ?',
        en: 'When are trucks banned from driving in Germany?',
        es: 'Cuando los camiones tienen prohibido circular en Alemania?',
        de: 'Wann haben LKW in Deutschland Fahrverbot?',
      },
      answers: [
        { text: { fr: 'Lundi matin', en: 'Monday morning', es: 'Lunes por la manana', de: 'Montag morgens' }, correct: false },
        { text: { fr: 'Vendredi soir', en: 'Friday evening', es: 'Viernes por la noche', de: 'Freitag abends' }, correct: false },
        { text: { fr: 'Dimanche avant 22h', en: 'Sunday before 10pm', es: 'Domingo antes de las 22h', de: 'Sonntag vor 22 Uhr' }, correct: true },
        { text: { fr: 'Samedi apres-midi', en: 'Saturday afternoon', es: 'Sabado por la tarde', de: 'Samstag nachmittags' }, correct: false },
      ],
      explanation: {
        fr: 'En Allemagne, les camions de plus de 7,5t ne peuvent pas rouler le dimanche avant 22h.',
        en: 'In Germany, trucks over 7.5t cannot drive on Sundays before 10pm.',
        es: 'En Alemania, los camiones de mas de 7,5t no pueden circular los domingos antes de las 22h.',
        de: 'In Deutschland duerfen LKW ueber 7,5t am Sonntag vor 22 Uhr nicht fahren.',
      },
      category: 'transport',
    },
  ],
}
