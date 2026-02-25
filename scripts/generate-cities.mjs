/**
 * generate-cities.mjs
 * Generates public/data/cities/XX.json files for each country.
 * Uses a hardcoded dataset of ~2000 cities organized by ISO country code.
 * Run: node scripts/generate-cities.mjs
 */

import { mkdir, writeFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SPOTS_DIR = join(ROOT, 'public/data/spots')
const CITIES_DIR = join(ROOT, 'public/data/cities')

// Hardcoded city dataset organized by ISO country code (2 letters uppercase)
const CITIES_BY_COUNTRY = {
  AD: ['Andorra la Vella', 'Escaldes-Engordany', 'Encamp', 'Sant Julià de Lòria', 'La Massana', 'Ordino', 'Canillo'],
  AF: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Kunduz', 'Jalalabad', 'Ghazni', 'Balkh', 'Baghlan', 'Farah'],
  AL: ['Tirana', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Gjirokastër', 'Berat', 'Lushnjë'],
  AM: ['Yerevan', 'Gyumri', 'Vanadzor', 'Vagharshapat', 'Hrazdan', 'Abovyan', 'Kapan', 'Gavar', 'Sevan', 'Goris'],
  AO: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango', 'Malanje', 'Namibe', 'Saurimo', 'Soyo'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Quilmes', 'Salta', 'Santa Fe', 'San Juan', 'Lanús', 'Corrientes', 'Merlo', 'General San Martín', 'Santiago del Estero', 'Lomas de Zamora', 'Florencio Varela', 'Neuquén', 'Berazategui', 'Morón', 'Paraná', 'Almirante Brown', 'Resistencia', 'San Miguel', 'Río Cuarto', 'Posadas', 'Tres de Febrero'],
  AT: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn', 'Steyr', 'Wiener Neustadt', 'Feldkirch', 'Bregenz', 'Leonding', 'Klosterneuburg', 'Leoben', 'Baden', 'Wolfsberg', 'Krems an der Donau'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Logan City', 'Geelong', 'Hobart', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Launceston', 'Mackay', 'Rockhampton', 'Bunbury', 'Bundaberg', 'Hervey Bay'],
  AZ: ['Baku', 'Sumqayit', 'Ganja', 'Lankaran', 'Shaki', 'Yevlax', 'Nakhchivan', 'Shirvan', 'Mingachevir', 'Khankendi'],
  BA: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar', 'Bijeljina', 'Brčko', 'Prijedor', 'Trebinje', 'Doboj'],
  BD: ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Comilla', 'Narayanganj', 'Gazipur', 'Rangpur', 'Mymensingh', 'Khulna', 'Jessore', 'Barisal', 'Bogra', 'Dinajpur', 'Tongi'],
  BE: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst', 'Mechelen', 'La Louvière', 'Kortrijk', 'Hasselt', 'Sint-Niklaas', 'Ostend', 'Tournai', 'Genk', 'Seraing', 'Roeselare'],
  BG: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora', 'Ruse', 'Pleven', 'Sliven', 'Dobrich', 'Shumen', 'Pernik', 'Haskovo', 'Yambol', 'Pazardzhik', 'Blagoevgrad', 'Veliko Tarnovo', 'Vratsa', 'Gabrovo', 'Lovech', 'Montana'],
  BJ: ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou', 'Godomey', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah', 'Natitingou'],
  BN: ['Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong', 'Bangar'],
  BO: ['Santa Cruz de la Sierra', 'El Alto', 'La Paz', 'Cochabamba', 'Oruro', 'Sucre', 'Potosí', 'Tarija', 'Trinidad', 'Sacaba'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina', 'Campo Grande', 'Nova Iguaçu', 'Osasco', 'João Pessoa', 'Contagem', 'Santo André', 'São José dos Campos', 'Jaboatão dos Guararapes', 'Ribeirão Preto', 'Uberlândia', 'Sorocaba', 'Florianópolis', 'Cuiabá', 'Joinville', 'Niterói', 'Londrina', 'Belford Roxo', 'São João de Meriti', 'Juiz de Fora', 'Aracaju'],
  BW: ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Serowe', 'Kanye', 'Mahalapye', 'Lobatse', 'Selibe-Phikwe', 'Ramotswa'],
  BZ: ['Belize City', 'Belmopan', 'San Ignacio', 'Orange Walk', 'Dangriga', 'Corozal', 'Punta Gorda'],
  CA: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton', 'Brampton', 'Surrey', 'Laval', 'Halifax', 'London', 'Markham', 'Vaughan', 'Gatineau', 'Longueuil', 'Burnaby', 'Saskatoon', 'Kitchener', 'Windsor', 'Regina', 'Richmond', 'Richmond Hill', 'Oakville', 'Burlington', 'Greater Sudbury', 'Sherbrooke', 'Barrie', 'Kelowna', 'Abbotsford', 'Coquitlam', 'Whitby', 'Kingston'],
  CH: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Schaffhausen', 'Fribourg', 'Chur', 'Neuchâtel', 'Vernier', 'Sion', 'Lancy', 'Uster', 'Emmen', 'Kriens'],
  CI: ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'Korhogo', 'San-Pédro', 'Man', 'Divo', 'Gagnoa', 'Abobo'],
  CL: ['Santiago', 'Puente Alto', 'Maipú', 'Antofagasta', 'Viña del Mar', 'Valparaíso', 'Talcahuano', 'San Bernardo', 'Arica', 'Temuco', 'Rancagua', 'Concepción', 'La Florida', 'Las Condes', 'Iquique', 'Peñalolén', 'Quilicura', 'El Bosque', 'La Pintana', 'Coquimbo'],
  CM: ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré', 'Bertoua', 'Nkongsamba', 'Ebolowa'],
  CN: ['Shanghai', 'Beijing', 'Chongqing', 'Tianjin', 'Guangzhou', 'Shenzhen', 'Wuhan', 'Dongguan', 'Chengdu', 'Nanjing', 'Shenyang', "Xi'an", 'Hangzhou', 'Harbin', 'Dalian', 'Zhengzhou', 'Jinan', 'Qingdao', 'Fuzhou', 'Changsha', 'Kunming', 'Changchun', 'Nanchang', 'Hefei', 'Guiyang', 'Suzhou', 'Ningbo', 'Shijiazhuang', 'Taiyuan', 'Urumqi', 'Wuxi', 'Foshan', 'Zibo', 'Tangshan', 'Jilin', 'Nanning', 'Lanzhou', 'Zhongshan', 'Huizhou', 'Wenzhou'],
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Manizales', 'Pasto', 'Soledad', 'Montería', 'Neiva', 'Armenia', 'Palmira', 'Valledupar', 'Sincelejo', 'Bello'],
  CR: ['San José', 'Cartago', 'Liberia', 'Alajuela', 'Desamparados', 'San Carlos', 'Pérez Zeledón', 'Heredia', 'Limón', 'Puntarenas'],
  CY: ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos', 'Kyrenia', 'Strovolos', 'Paralimni'],
  CZ: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Ústí nad Labem', 'České Budějovice', 'Hradec Králové', 'Pardubice', 'Zlín', 'Havířov', 'Kladno', 'Most', 'Opava', 'Frýdek-Místek', 'Karviná', 'Jihlava', 'Teplice', 'Mladá Boleslav'],
  DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Karlsruhe', 'Mannheim', 'Augsburg', 'Wiesbaden', 'Gelsenkirchen', 'Mönchengladbach', 'Braunschweig', 'Kiel', 'Freiburg', 'Chemnitz', 'Aachen', 'Halle', 'Magdeburg', 'Krefeld', 'Rostock', 'Mainz', 'Lübeck', 'Erfurt', 'Kassel', 'Hagen', 'Heidelberg', 'Saarbrücken', 'Darmstadt', 'Trier', 'Würzburg', 'Regensburg', 'Ulm', 'Fürth', 'Ingolstadt', 'Heilbronn'],
  DK: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg', 'Esbjerg', 'Gentofte', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Helsingør', 'Herning', 'Silkeborg', 'Næstved', 'Fredericia', 'Viborg', 'Køge', 'Taastrup'],
  DM: ['Roseau', 'Portsmouth', 'Marigot', 'Berekua', 'Mahaut'],
  DO: ['Santo Domingo', 'Santiago', 'Los Alcarrizos', 'San Pedro de Macorís', 'La Romana', 'San Cristóbal', 'Higüey', 'San Francisco de Macorís', 'Puerto Plata', 'Moca'],
  DZ: ['Algiers', 'Oran', 'Constantine', 'Batna', 'Djelfa', 'Sétif', 'Sidi bel Abbès', 'Biskra', 'Annaba', 'Blida', 'Béjaïa', 'Tlemcen', 'Mostaganem', 'El Oued', 'Skikda', 'Tiaret', 'Béchar', 'Laghouat', 'Souk Ahras', 'Guelma'],
  EC: ['Guayaquil', 'Quito', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Portoviejo', 'Loja', 'Ambato', 'Esmeraldas', 'Quevedo', 'Ibarra', 'Riobamba'],
  EE: ['Tallinn', 'Tartu', 'Narva', 'Pärnu', 'Kohtla-Järve', 'Viljandi', 'Rakvere', 'Maardu', 'Sillamäe', 'Kuressaare'],
  EG: ['Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan', 'Damietta', 'Damanhur', 'Al Minya', 'Beni Suef', 'Sohag'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Granada', 'Vitoria', 'Elche', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez', 'Sabadell', 'Móstoles', 'Santa Cruz de Tenerife', 'Almería', 'Pamplona', 'Fuenlabrada', 'Leganés', 'Alcalá de Henares', 'Donostia', 'Getafe', 'Burgos', 'Albacete', 'Alcorcón', 'Santander', 'Toledo', 'Logroño', 'León', 'Cádiz', 'Badajoz', 'Salamanca'],
  ET: ['Addis Ababa', 'Gondar', "Mek'ele", 'Adama', 'Hawassa', 'Dire Dawa', 'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane', 'Bishoftu', 'Arba Minch', 'Harar', 'Dilla'],
  FI: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Kouvola', 'Pori', 'Joensuu', 'Lappeenranta', 'Hämeenlinna', 'Vaasa', 'Rovaniemi', 'Seinäjoki', 'Mikkeli', 'Kotka', 'Salo'],
  FO: ['Tórshavn', 'Klaksvík', 'Runavík', 'Tvøroyri'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne', 'Le Mans', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Tours', 'Limoges', 'Amiens', 'Perpignan', 'Metz', 'Besançon', 'Orléans', 'Rouen', 'Mulhouse', 'Caen', 'Nancy', 'Argenteuil', 'Saint-Denis', 'Montreuil', 'Roubaix', 'Avignon', 'Dunkerque', 'Poitiers', 'Versailles', 'Pau', 'Cannes', 'Calais', 'Boulogne-Billancourt', 'Antibes', 'La Rochelle', 'Quimper', 'Troyes'],
  GB: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Leicester', 'Coventry', 'Bradford', 'Nottingham', 'Kingston upon Hull', 'Cardiff', 'Belfast', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth', 'Southampton', 'Reading', 'Derby', 'Luton', 'Brighton', 'Northampton', 'Portsmouth', 'Preston', 'Milton Keynes', 'Aberdeen', 'Sunderland', 'Swansea', 'Newcastle upon Tyne', 'Oxford', 'Cambridge', 'York', 'Exeter', 'Ipswich', 'Norwich', 'Peterborough', 'Middlesbrough', 'Dundee', 'Bath', 'Canterbury', 'Chester', 'Worcester'],
  GD: ['Saint George\'s', 'Gouyave', 'Grenville', 'Victoria'],
  GE: ['Tbilisi', 'Kutaisi', 'Batumi', 'Rustavi', 'Zugdidi', 'Gori', 'Poti', 'Samtredia', 'Kobuleti', 'Senaki'],
  GG: ['Saint Peter Port', 'Saint Sampson'],
  GH: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Ashaiman', 'Tema', 'Cape Coast', 'Obuasi', 'Teshie', 'Nungua', 'Koforidua', 'Sunyani', 'Ho', 'Wa'],
  GL: ['Nuuk', 'Sisimiut', 'Ilulissat', 'Aasiaat', 'Qaqortoq', 'Maniitsoq'],
  GR: ['Athens', 'Thessaloniki', 'Patras', 'Piraeus', 'Larissa', 'Heraklion', 'Peristeri', 'Kallithea', 'Acharnes', 'Kalamaria', 'Nikaia', 'Glyfada', 'Volos', 'Rhodes', 'Ioannina', 'Chalandri', 'Nea Smyrni', 'Agios Dimitrios', 'Zografou', 'Komotini'],
  GT: ['Guatemala City', 'Mixco', 'Villa Nueva', 'San Juan Sacatepéquez', 'Chinautla', 'Quetzaltenango', 'Escuintla', 'Cobán', 'Chiquimula', 'Huehuetenango'],
  GY: ['Georgetown', 'Linden', 'New Amsterdam', 'Anna Regina', 'Bartica'],
  HN: ['Tegucigalpa', 'San Pedro Sula', 'Choloma', 'La Ceiba', 'El Progreso', 'Choluteca', 'Comayagua', 'Danli', 'Siguatepeque', 'Puerto Lempira'],
  HR: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Slavonski Brod', 'Pula', 'Karlovac', 'Sisak', 'Varaždin', 'Šibenik', 'Dubrovnik', 'Velika Gorica', 'Bjelovar', 'Vinkovci', 'Vukovar', 'Koprivnica'],
  HU: ['Budapest', 'Debrecen', 'Miskolc', 'Szeged', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely', 'Szolnok', 'Tatabánya', 'Kaposvár', 'Érd', 'Veszprém', 'Zalaegerszeg', 'Sopron', 'Eger', 'Nagykanizsa'],
  ID: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Pekanbaru', 'Padang', 'Malang', 'Bandar Lampung', 'Batam', 'Samarinda', 'Tasikmalaya', 'Banjarmasin', 'Pontianak'],
  IE: ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Bray', 'Navan', 'Ennis', 'Kilkenny', 'Tralee', 'Carlow', 'Sligo', 'Naas', 'Athlone', 'Portlaoise', 'Mullingar', 'Wexford'],
  IL: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beer Sheva', 'Bnei Brak', 'Holon', 'Ramat Gan', 'Bat Yam', 'Herzliya', 'Kfar Saba', 'Modiin'],
  IM: ['Douglas', 'Onchan', 'Ramsey', 'Peel', 'Port Erin'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Pune', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Visakhapatnam', 'Indore', 'Thane', 'Bhopal', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kochi', 'Chandigarh', 'Jamshedpur'],
  IQ: ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Kirkuk', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Nasiriyah', 'Amarah'],
  IR: ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Tabriz', 'Shiraz', 'Ahvaz', 'Qom', 'Kermanshah', 'Urmia', 'Rasht', 'Zahedan', 'Kerman', 'Arak', 'Hamadan'],
  IS: ['Reykjavik', 'Kópavogur', 'Hafnarfjörður', 'Akureyri', 'Garðabær', 'Mosfellsbær', 'Ísafjörður', 'Selfoss'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Taranto', 'Brescia', 'Prato', 'Parma', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari', 'Latina', 'Giugliano', 'Bergamo', 'Monza', 'Syracuse', 'Trento', 'Vicenza', 'Ancona', 'Bolzano'],
  JE: ['Saint Helier', 'Saint Brelade', 'Saint Clement'],
  JO: ['Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Aqaba', 'Madaba', 'Al Karak', 'Jerash', 'Mafraq', 'Ajloun'],
  JP: ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Kumamoto', 'Sagamihara', 'Okayama', 'Shizuoka', 'Osaka', 'Kagoshima', 'Funabashi', 'Hachioji', 'Higashiosaka', 'Matsuyama', 'Utsunomiya', 'Matsudo', 'Kawaguchi', 'Kanazawa', 'Oita'],
  KE: ['Nairobi', 'Mombasa', 'Nakuru', 'Eldoret', 'Kisumu', 'Thika', 'Malindi', 'Kitui', 'Machakos', 'Garissa', 'Nyeri', 'Meru', 'Kilifi', 'Kisii', 'Kakamega'],
  KG: ['Bishkek', 'Osh', 'Jalal-Abad', 'Tokmok', 'Karakol', 'Uzgen', 'Balykchy', 'Naryn'],
  KH: ['Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Battambang', 'Poipet', 'Kampong Cham', 'Pursat', 'Kampot', 'Kep', 'Takéo'],
  KR: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon', 'Seongnam', 'Goyang', 'Bucheon', 'Cheongju', 'Jeonju', 'Ansan', 'Anyang', 'Namyangju', 'Hwaseong', 'Yongin', 'Pyeongtaek', 'Uijeongbu', 'Gimhae', 'Jeju'],
  KZ: ['Almaty', 'Nur-Sultan', 'Shymkent', 'Karagandy', 'Aktobe', 'Taraz', 'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kostanay', 'Kyzylorda', 'Uralsk', 'Petropavl', 'Aktau'],
  LA: ['Vientiane', 'Pakse', 'Savannakhet', 'Luang Prabang', 'Xam Neua', 'Phonsavan', 'Muang Xay', 'Thakhek'],
  LI: ['Vaduz', 'Schaan', 'Triesen', 'Balzers', 'Eschen', 'Mauren', 'Triesenberg'],
  LK: ['Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Jaffna', 'Negombo', 'Pita Kotte', 'Sri Jayawardenepura Kotte', 'Kandy', 'Trincomalee', 'Batticaloa'],
  LT: ['Vilnius', 'Kaunas', 'Klaipėda', 'Šiauliai', 'Panevėžys', 'Alytus', 'Marijampolė', 'Mažeikiai', 'Jonava', 'Utena', 'Telšiai', 'Ukmergė', 'Plungė'],
  LU: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch'],
  LV: ['Riga', 'Daugavpils', 'Liepāja', 'Jelgava', 'Jēkabpils', 'Jūrmala', 'Ventspils', 'Rēzekne', 'Valmiera', 'Jūrmala'],
  MA: ['Casablanca', 'Fez', 'Tangier', 'Marrakech', 'Salé', 'Meknes', 'Rabat', 'Oujda', 'Kenitra', 'Agadir', 'Tetouan', 'Temara', 'Safi', 'Mohammedia', 'Khouribga', 'El Jadida', 'Beni Mellal', 'Taza', 'Nador', 'Settat'],
  MC: ['Monaco', 'Monte Carlo', 'La Condamine', 'Fontvieille'],
  MD: ['Chișinău', 'Tiraspol', 'Bălți', 'Bender', 'Rîbnița', 'Cahul', 'Ungheni', 'Soroca', 'Orhei'],
  ME: ['Podgorica', 'Nikšić', 'Herceg Novi', 'Bijelo Polje', 'Bar', 'Cetinje', 'Berane', 'Budva'],
  MK: ['Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo', 'Ohrid', 'Veles', 'Gostivar', 'Strumica', 'Stip'],
  MN: ['Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan', 'Ölgii', 'Khovd', 'Mörön', 'Dalanzadgad'],
  MR: ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Rosso', 'Kiffa', 'Atar', 'Zouerate'],
  MT: ['Valletta', 'Birkirkara', 'Qormi', 'Mosta', 'Żabbar', 'Saint Paul\'s Bay', 'Sliema', 'Żejtun', 'Hamrun', 'Naxxar'],
  MU: ['Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes', 'Triolet', 'Goodlands'],
  MX: ['Mexico City', 'Ecatepec', 'Guadalajara', 'Puebla', 'Juárez', 'Tijuana', 'León', 'Zapopan', 'Monterrey', 'Nezahualcóyotl', 'Chihuahua', 'Naucalpan', 'Mérida', 'San Luis Potosí', 'Aguascalientes', 'Hermosillo', 'Saltillo', 'Mexicali', 'Culiacán', 'Acapulco', 'Guadalupe', 'Tlalnepantla', 'Cancún', 'Querétaro', 'Morelia', 'Torreón', 'Tepic', 'Durango', 'Villahermosa', 'Toluca'],
  MY: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Kota Kinabalu', 'Subang Jaya', 'Kuching', 'Ampang Jaya', 'Klang', 'Malacca', 'Alor Setar', 'Seremban', 'Kota Bharu'],
  MZ: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete', 'Inhambane', 'Pemba'],
  NA: ['Windhoek', 'Rundu', 'Walvis Bay', 'Oshakati', 'Swakopmund', 'Rehoboth', 'Ondangwa', 'Gobabis', 'Keetmanshoop'],
  NG: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Jos', 'Ilorin', 'Oyo', 'Kaduna', 'Enugu', 'Abeokuta', 'Onitsha', 'Aba', 'Warri', 'Sokoto', 'Ogbomosho', 'Nnewi'],
  NI: ['Managua', 'León', 'Masaya', 'Tipitapa', 'Chinandega', 'Matagalpa', 'Estelí', 'Granada', 'Ciudad Sandino', 'Juigalpa'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Apeldoorn', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', "'s-Hertogenbosch", 'Maastricht', 'Dordrecht', 'Leiden', 'Zoetermeer', 'Zwolle', 'Deventer', 'Delft', 'Alkmaar'],
  NO: ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg', 'Skien', 'Ålesund', 'Sandefjord', 'Haugesund', 'Tønsberg', 'Moss', 'Porsgrunn', 'Bodø', 'Arendal'],
  NP: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Birganj', 'Dharan', 'Bharatpur', 'Janakpur', 'Hetauda', 'Butwal'],
  NZ: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier', 'Dunedin', 'Palmerston North', 'Nelson', 'Invercargill', 'Rotorua', 'Hastings', 'Whangarei'],
  OM: ['Muscat', 'Seeb', 'Salalah', 'Bawshar', 'Sohar', 'Suwayq', 'Ibri', 'Saham', 'Barka', 'Rustaq'],
  PA: ['Panama City', 'San Miguelito', 'Tocumen', 'Juan Díaz', 'David', 'Arraiján', 'Colón', 'La Chorrera', 'Santiago', 'Chitré'],
  PE: ['Lima', 'Arequipa', 'Callao', 'Trujillo', 'Chiclayo', 'Piura', 'Huancayo', 'Iquitos', 'Chimbote', 'Cusco', 'Pucallpa', 'Tacna', 'Ica', 'Juliaca', 'Ayacucho'],
  PH: ['Quezon City', 'Manila', 'Caloocan', 'Davao', 'Cebu City', 'Zamboanga', 'Antipolo', 'Pasig', 'Taguig', 'Cagayan de Oro', 'Parañaque', 'Valenzuela', 'Las Piñas', 'Makati', 'Bacoor', 'Marikina', 'Muntinlupa', 'Pasay', 'Bacolod', 'Iloilo City'],
  PK: ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta', 'Bahawalpur', 'Sargodha', 'Sialkot', 'Sukkur', 'Larkana'],
  PL: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice', 'Białystok', 'Gdynia', 'Częstochowa', 'Radom', 'Toruń', 'Sosnowiec', 'Kielce', 'Rzeszów', 'Gliwice', 'Zabrze', 'Olsztyn', 'Bielsko-Biała', 'Bytom', 'Zielona Góra', 'Rybnik', 'Ruda Śląska', 'Opole', 'Tychy', 'Elbląg'],
  PT: ['Lisbon', 'Porto', 'Braga', 'Amadora', 'Setúbal', 'Coimbra', 'Funchal', 'Almada', 'Agualva-Cacém', 'Queluz', 'Aveiro', 'Viseu', 'Leiria', 'Évora', 'Faro', 'Guimarães', 'Vila Nova de Gaia', 'Barreiro', 'Matosinhos'],
  RO: ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare'],
  RS: ['Belgrade', 'Novi Sad', 'Niš', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Novi Pazar', 'Smederevo', 'Leskovac', 'Kruševac', 'Valjevo', 'Vranje'],
  RU: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh', 'Volgograd', 'Krasnodar', 'Saratov', 'Tyumen', 'Tolyatti', 'Izhevsk', 'Barnaul', 'Irkutsk', 'Khabarovsk', 'Vladivostok', 'Yaroslavl', 'Tomsk', 'Makhachkala', 'Orenburg', 'Novokuznetsk', 'Kemerovo', 'Astrakhan', 'Ryazan', 'Naberezhnye Chelny', 'Penza', 'Kirov', 'Ulyanovsk', 'Lipetsk', 'Cheboksary', 'Tula', 'Kaliningrad'],
  SA: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Hufuf', 'Taif', 'Buraidah'],
  SE: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund', 'Umeå', 'Gävle', 'Borås', 'Södertälje', 'Eskilstuna', 'Halmstad', 'Växjö', 'Karlstad'],
  SI: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Velenje', 'Koper', 'Novo Mesto', 'Ptuj', 'Trbovlje', 'Kamnik'],
  SK: ['Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica', 'Nitra', 'Trnava', 'Martin', 'Trenčín', 'Poprad', 'Prievidza', 'Zvolen', 'Považská Bystrica', 'Nové Zámky', 'Michalovce'],
  SM: ['San Marino', 'Serravalle', 'Borgo Maggiore', 'Fiorentino'],
  SN: ['Dakar', 'Pikine', 'Touba', 'Thiès', 'Guédiawaye', 'Kaolack', 'Saint-Louis', 'Mbao', 'Ziguinchor', 'Diourbel'],
  SV: ['San Salvador', 'Soyapango', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Santa Tecla', 'Apopa', 'Delgado', 'Ahuachapán', 'Usulután'],
  SZ: ['Mbabane', 'Manzini', 'Big Bend', 'Malkerns', 'Nhlangano', 'Siteki'],
  TG: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé', 'Dapaong', 'Tsévié', 'Aného'],
  TH: ['Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Chiang Mai', 'Pattaya', 'Udon Thani', 'Ubon Ratchathani', 'Nakhon Ratchasima', 'Khon Kaen', 'Chiang Rai', 'Nakhon Si Thammarat', 'Rayong'],
  TJ: ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa', 'Istaravshan', 'Vahdat', 'Panjakent'],
  TL: ['Dili', 'Dare', 'Baucau', 'Maliana', 'Suai', 'Liquiçá', 'Manatuto'],
  TN: ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Gabes', 'Ariana', 'Bizerta', 'Gafsa', 'Nabeul'],
  TO: ['Nukuʻalofa', 'Neiafu', 'Haveluloto', 'Vaini', 'Pangai'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri', 'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa', 'Malatya', 'Gebze', 'Kahramanmaraş', 'Erzurum', 'Trabzon', 'Hatay', 'Manisa', 'Van'],
  TW: ['Taipei', 'New Taipei', 'Taichung', 'Kaohsiung', 'Taoyuan', 'Tainan', 'Hsinchu', 'Keelung', 'Changhua', 'Chiayi'],
  TZ: ['Dar es Salaam', 'Mwanza', 'Zanzibar City', 'Arusha', 'Mbeya', 'Morogoro', 'Tanga', 'Dodoma', 'Kigoma', 'Tabora'],
  UA: ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv', 'Mariupol', 'Luhansk', 'Vinnytsia', 'Makiivka', 'Kherson', 'Sevastopol', 'Simferopol', 'Poltava', 'Chernihiv', 'Cherkasy', 'Sumy'],
  UG: ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Bwizibwera', 'Mbale', 'Mukono', 'Kasese', 'Masaka'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Nashville', 'Oklahoma City', 'El Paso', 'Boston', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Mesa', 'Kansas City', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Miami', 'Long Beach', 'Virginia Beach', 'Minneapolis', 'Tampa', 'New Orleans', 'Arlington', 'Bakersfield', 'Honolulu', 'Anaheim', 'Aurora', 'Corpus Christi', 'Santa Ana', 'Riverside', 'St. Louis', 'Lexington', 'Pittsburgh', 'Anchorage', 'Stockton', 'Cincinnati', 'Saint Paul', 'Toledo', 'Greensboro', 'Newark', 'Plano', 'Henderson', 'Lincoln', 'Buffalo', 'Fort Wayne', 'Jersey City', 'Chula Vista', 'Orlando', 'St. Petersburg'],
  UY: ['Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo', 'Mercedes', 'Artigas'],
  UZ: ['Tashkent', 'Samarkand', 'Namangan', 'Andijan', 'Nukus', 'Bukhara', 'Qashqadaryo', 'Fergana', 'Guliston', 'Jizzakh'],
  VC: ['Kingstown', 'Georgetown', 'Barrouallie', 'Layou', 'Chateaubelair'],
  VN: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong', 'Bien Hoa', 'Hue', 'Nha Trang', 'Buon Ma Thuot', 'Quy Nhon', 'Da Lat', 'Long Xuyen', 'Rach Gia', 'Vung Tau'],
  XK: ['Pristina', 'Prizren', 'Peja', 'Ferizaj', 'Gjilan', 'Gjakova', 'Mitrovica', 'Podujevë'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Pietermaritzburg', 'Benoni', 'Tembisa', 'Soweto', 'Boksburg', 'Vereeniging', 'Krugersdorp'],
  ZM: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira', 'Livingstone', 'Luanshya', 'Kasama', 'Chipata'],
}

async function main() {
  // Create output directory
  await mkdir(CITIES_DIR, { recursive: true })
  console.log(`Output dir: ${CITIES_DIR}`)

  // Read all country codes from spots directory
  const spotFiles = await readdir(SPOTS_DIR)
  const countryCodes = spotFiles
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.replace('.json', '').toUpperCase())
    .filter(c => c !== 'INDEX')

  console.log(`Found ${countryCodes.length} countries in spots dir`)

  let generated = 0
  let skipped = 0

  for (const code of countryCodes) {
    const cities = CITIES_BY_COUNTRY[code]
    if (!cities || cities.length === 0) {
      console.log(`  SKIP ${code} — no city data`)
      skipped++
      continue
    }

    const outputPath = join(CITIES_DIR, `${code.toLowerCase()}.json`)
    const content = JSON.stringify({ country: code, cities }, null, 2)
    await writeFile(outputPath, content, 'utf8')
    console.log(`  OK   ${code} — ${cities.length} cities`)
    generated++
  }

  console.log(`\nDone: ${generated} files generated, ${skipped} countries skipped`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
