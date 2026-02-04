/**
 * Script de génération automatique des images SpotHitch
 * Utilise Pollinations.ai (gratuit, sans API key)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'images');

// Configuration
const DELAY_BETWEEN_IMAGES = 3000; // 3 secondes entre chaque image
const IMAGE_WIDTH = 512;
const IMAGE_HEIGHT = 512;

// Style de base pour cohérence
const BASE_STYLE = 'flat design, minimalist, vector style, blue cyan gradient colors, dark background, clean modern illustration, app design style';

// Toutes les images à générer
const IMAGES = [
  // === BRANDING ===
  {
    folder: 'branding',
    name: 'logo.png',
    prompt: 'Minimalist logo for hitchhiking app, friendly hand doing thumbs up gesture combined with a location pin marker, blue cyan gradient colors, transparent background, vector style'
  },
  {
    folder: 'branding',
    name: 'icon-512.png',
    prompt: 'App icon for hitchhiking app, thumbs up hand inside a location pin, flat design, blue cyan gradient, rounded square, minimalist vector style, dark background'
  },
  {
    folder: 'branding',
    name: 'splash.png',
    prompt: 'Splash screen, young traveler with backpack hitchhiking on scenic mountain road at sunset, minimalist flat design, blue cyan and orange colors, vector art'
  },
  {
    folder: 'branding',
    name: 'og-image.png',
    prompt: 'Social media banner for hitchhiking app, happy travelers on road with mountains, flat design illustration, blue cyan gradient, modern vector style'
  },

  // === BADGES ===
  {
    folder: 'badges',
    name: 'first-checkin.png',
    prompt: 'Achievement badge icon, first check-in milestone, location pin with checkmark and number 1, flat design, golden glow, blue background, game achievement style'
  },
  {
    folder: 'badges',
    name: 'explorer-10.png',
    prompt: 'Achievement badge, explorer level with compass and footprints, bronze medal style, flat design, warm colors, game achievement'
  },
  {
    folder: 'badges',
    name: 'expert-50.png',
    prompt: 'Achievement badge, expert level silver star with road symbol, flat design, shiny metallic effect, game achievement style'
  },
  {
    folder: 'badges',
    name: 'master-100.png',
    prompt: 'Achievement badge, master level golden trophy with laurel wreath, premium look, flat design, glowing effect'
  },
  {
    folder: 'badges',
    name: 'streak-7.png',
    prompt: 'Achievement badge, 7 day streak, flame with number 7, orange red gradient, flat design, energetic style'
  },
  {
    folder: 'badges',
    name: 'streak-30.png',
    prompt: 'Achievement badge, 30 day streak, bigger flame with calendar, orange gold gradient, flat design'
  },
  {
    folder: 'badges',
    name: 'streak-100.png',
    prompt: 'Achievement badge, 100 day streak, epic flame tornado, red orange gold, flat design, legendary style'
  },
  {
    folder: 'badges',
    name: 'streak-365.png',
    prompt: 'Achievement badge, 365 day streak, phoenix rising from flames, rainbow fire, legendary golden frame, epic achievement'
  },
  {
    folder: 'badges',
    name: 'first-spot.png',
    prompt: 'Achievement badge, first spot created, location pin with plus sign, blue cyan colors, flat design, creator badge'
  },
  {
    folder: 'badges',
    name: 'cartographer.png',
    prompt: 'Achievement badge, cartographer 5 spots, small map with pins, bronze frame, flat design'
  },
  {
    folder: 'badges',
    name: 'mapper.png',
    prompt: 'Achievement badge, mapper 20 spots, detailed map with multiple pins, silver frame, flat design'
  },
  {
    folder: 'badges',
    name: 'first-review.png',
    prompt: 'Achievement badge, first review, speech bubble with star, blue colors, flat design'
  },
  {
    folder: 'badges',
    name: 'critic.png',
    prompt: 'Achievement badge, critic 10 reviews, multiple stars with pen, bronze style, flat design'
  },
  {
    folder: 'badges',
    name: 'influencer.png',
    prompt: 'Achievement badge, influencer 50 reviews, golden megaphone with stars, premium style, flat design'
  },
  {
    folder: 'badges',
    name: 'night-owl.png',
    prompt: 'Achievement badge, night owl, cute owl with moon and stars, purple blue colors, flat design'
  },
  {
    folder: 'badges',
    name: 'early-bird.png',
    prompt: 'Achievement badge, early bird, cute bird with sunrise, orange yellow colors, flat design'
  },
  {
    folder: 'badges',
    name: 'globetrotter.png',
    prompt: 'Achievement badge, globetrotter, earth globe with airplane trail, blue green colors, flat design'
  },
  {
    folder: 'badges',
    name: 'legend.png',
    prompt: 'Achievement badge, legend ultimate, golden crown with diamonds, rainbow glow, premium legendary, flat design'
  },
  {
    folder: 'badges',
    name: 'helping-hand.png',
    prompt: 'Achievement badge, helping hand, two hands shaking, warm orange colors, flat design, community badge'
  },
  {
    folder: 'badges',
    name: 'verified.png',
    prompt: 'Achievement badge, verified member, checkmark with shield, blue official colors, flat design, trust badge'
  },

  // === LEAGUES ===
  {
    folder: 'leagues',
    name: 'bronze.png',
    prompt: 'League emblem bronze tier, shield shape bronze metallic texture, roman numeral III, laurel leaves, flat design with 3D effect'
  },
  {
    folder: 'leagues',
    name: 'silver.png',
    prompt: 'League emblem silver tier, shield shape silver metallic texture, roman numeral II, laurel leaves, flat design with shine'
  },
  {
    folder: 'leagues',
    name: 'gold.png',
    prompt: 'League emblem gold tier, shield shape golden metallic texture, roman numeral I, laurel crown, flat design with glow'
  },
  {
    folder: 'leagues',
    name: 'platinum.png',
    prompt: 'League emblem platinum tier, shield shape platinum white metallic, diamond accent, elite laurels, flat design sparkle'
  },
  {
    folder: 'leagues',
    name: 'diamond.png',
    prompt: 'League emblem diamond tier, shield shape crystal diamond texture, multiple gems, rainbow refraction, flat design prismatic'
  },

  // === VIP LEVELS ===
  {
    folder: 'vip',
    name: 'novice.png',
    prompt: 'VIP level icon novice, simple backpack with one star, green fresh colors, flat design, starter level'
  },
  {
    folder: 'vip',
    name: 'explorer.png',
    prompt: 'VIP level icon explorer, compass with two stars, blue adventurous colors, flat design'
  },
  {
    folder: 'vip',
    name: 'adventurer.png',
    prompt: 'VIP level icon adventurer, mountain peak with three stars, purple ambitious colors, flat design'
  },
  {
    folder: 'vip',
    name: 'sage.png',
    prompt: 'VIP level icon sage, open book with four stars and map, golden wise colors, flat design'
  },
  {
    folder: 'vip',
    name: 'legend.png',
    prompt: 'VIP level icon legend, golden crown with five stars and wings, rainbow legendary colors, flat design glow'
  },

  // === COUNTRY GUIDES ===
  {
    folder: 'guides',
    name: 'fr.png',
    prompt: 'Country illustration France, Eiffel tower with scenic road, flat design, blue white red colors, travel guide style'
  },
  {
    folder: 'guides',
    name: 'de.png',
    prompt: 'Country illustration Germany, Brandenburg gate with autobahn, flat design, black red gold colors, travel guide'
  },
  {
    folder: 'guides',
    name: 'es.png',
    prompt: 'Country illustration Spain, Sagrada Familia sunny coastal road, flat design, red yellow colors, mediterranean'
  },
  {
    folder: 'guides',
    name: 'it.png',
    prompt: 'Country illustration Italy, Colosseum with Tuscan road, flat design, green white red colors, travel guide'
  },
  {
    folder: 'guides',
    name: 'nl.png',
    prompt: 'Country illustration Netherlands, windmill with bike path tulips, flat design, orange colors, flat landscape'
  },
  {
    folder: 'guides',
    name: 'be.png',
    prompt: 'Country illustration Belgium, Atomium with European road, flat design, black yellow red colors'
  },
  {
    folder: 'guides',
    name: 'pl.png',
    prompt: 'Country illustration Poland, Krakow castle countryside road, flat design, white red colors, eastern european'
  },
  {
    folder: 'guides',
    name: 'cz.png',
    prompt: 'Country illustration Czech Republic, Prague castle bridge road, flat design, blue white red colors, bohemian'
  },
  {
    folder: 'guides',
    name: 'at.png',
    prompt: 'Country illustration Austria, Alpine mountains scenic road, flat design, red white colors, mountain feel'
  },
  {
    folder: 'guides',
    name: 'ch.png',
    prompt: 'Country illustration Switzerland, Matterhorn mountain road, flat design, red white colors, alpine clean'
  },
  {
    folder: 'guides',
    name: 'pt.png',
    prompt: 'Country illustration Portugal, Lisbon tram coastal road, flat design, green red colors, atlantic feel'
  },
  {
    folder: 'guides',
    name: 'ie.png',
    prompt: 'Country illustration Ireland, cliffs of Moher green countryside, flat design, green orange colors, celtic'
  },

  // === TUTORIAL ===
  {
    folder: 'tutorial',
    name: 'welcome.png',
    prompt: 'Welcome illustration, friendly traveler waving with backpack, open road ahead, flat design, blue cyan, welcoming'
  },
  {
    folder: 'tutorial',
    name: 'home.png',
    prompt: 'Home dashboard illustration, cozy command center with map stats, flat design, blue cyan, organized'
  },
  {
    folder: 'tutorial',
    name: 'stats.png',
    prompt: 'Statistics illustration, graphs charts showing progress, trophy medals, flat design, blue cyan'
  },
  {
    folder: 'tutorial',
    name: 'badges.png',
    prompt: 'Badges collection illustration, achievement medals floating, treasure chest, flat design, golden blue'
  },
  {
    folder: 'tutorial',
    name: 'challenges.png',
    prompt: 'Challenges illustration, target with arrow, daily quest board, flat design, purple blue, gamification'
  },
  {
    folder: 'tutorial',
    name: 'shop.png',
    prompt: 'Shop illustration, store front with rewards display, coins floating, flat design, green gold'
  },
  {
    folder: 'tutorial',
    name: 'quiz.png',
    prompt: 'Quiz illustration, brain with question marks lightbulb, flat design, yellow blue, knowledge test'
  },
  {
    folder: 'tutorial',
    name: 'spots.png',
    prompt: 'Spots map illustration, map with multiple location pins, magnifying glass, flat design, blue cyan'
  },
  {
    folder: 'tutorial',
    name: 'map.png',
    prompt: 'Map view illustration, interactive map zoom controls markers, flat design, blue green, navigation'
  },
  {
    folder: 'tutorial',
    name: 'filters.png',
    prompt: 'Filters illustration, funnel sorting options, sliders checkboxes, flat design, blue, search refinement'
  },
  {
    folder: 'tutorial',
    name: 'addspot.png',
    prompt: 'Add spot illustration, hand placing new pin on map, camera form, flat design, blue cyan, contribution'
  },
  {
    folder: 'tutorial',
    name: 'spotdetail.png',
    prompt: 'Spot detail illustration, expanded card photo ratings info, flat design, blue, detailed view'
  },
  {
    folder: 'tutorial',
    name: 'planner.png',
    prompt: 'Trip planner illustration, route map multiple stops, calendar, flat design, blue orange, journey planning'
  },
  {
    folder: 'tutorial',
    name: 'chat.png',
    prompt: 'Chat illustration, speech bubbles travelers talking, community, flat design, purple blue, communication'
  },
  {
    folder: 'tutorial',
    name: 'profile.png',
    prompt: 'Profile illustration, user avatar settings gear achievements, flat design, blue, personalization'
  },
  {
    folder: 'tutorial',
    name: 'sos.png',
    prompt: 'SOS emergency illustration, alert signal location sharing, helping hand, flat design, red white, safety'
  },
  {
    folder: 'tutorial',
    name: 'ready.png',
    prompt: 'Ready to go illustration, excited traveler thumb up open road, sunrise ahead, flat design, orange blue, adventure'
  },

  // === MISC ===
  {
    folder: 'misc',
    name: 'empty-spots.png',
    prompt: 'Empty state illustration, cute lost traveler looking at empty map, question mark, flat design, blue grey'
  },
  {
    folder: 'misc',
    name: 'empty-trips.png',
    prompt: 'Empty trips illustration, empty suitcase waiting to pack, road ahead, flat design, blue, encouraging'
  },
  {
    folder: 'misc',
    name: 'empty-friends.png',
    prompt: 'Empty friends illustration, single traveler looking for companions, flat design, blue purple, inviting'
  },
  {
    folder: 'misc',
    name: 'empty-messages.png',
    prompt: 'Empty messages illustration, empty speech bubbles waiting, flat design, blue, quiet mood'
  },
  {
    folder: 'misc',
    name: 'offline.png',
    prompt: 'Offline mode illustration, cloud with X mark, cached map visible, flat design, grey blue, no connection'
  },
  {
    folder: 'misc',
    name: 'error.png',
    prompt: 'Error illustration, cute confused robot warning sign, flat design, orange, something went wrong'
  },
  {
    folder: 'misc',
    name: 'success.png',
    prompt: 'Success illustration, happy traveler celebrating confetti, checkmark, flat design, green, celebration'
  },

  // === AVATARS ===
  {
    folder: 'avatars',
    name: 'backpacker.png',
    prompt: 'Avatar portrait backpacker character, young traveler large backpack, friendly smile, flat design, blue, circular'
  },
  {
    folder: 'avatars',
    name: 'adventurer.png',
    prompt: 'Avatar portrait adventurer character, explorer hat compass, confident look, flat design, green brown, circular'
  },
  {
    folder: 'avatars',
    name: 'hippie.png',
    prompt: 'Avatar portrait hippie traveler, peace sign flower, relaxed happy, flat design, colorful rainbow, circular'
  },
  {
    folder: 'avatars',
    name: 'pro.png',
    prompt: 'Avatar portrait professional hitchhiker, experienced bandana sunglasses, cool, flat design, dark colors, circular'
  },
  {
    folder: 'avatars',
    name: 'nature.png',
    prompt: 'Avatar portrait nature lover, surrounded by leaves mountains, peaceful, flat design, green, circular'
  },
  {
    folder: 'avatars',
    name: 'urban.png',
    prompt: 'Avatar portrait urban traveler, city style hoodie, streetwise, flat design, grey blue, circular'
  },
  {
    folder: 'avatars',
    name: 'beach.png',
    prompt: 'Avatar portrait beach traveler, surfer vibes sunset, relaxed smile, flat design, orange blue, circular'
  },
  {
    folder: 'avatars',
    name: 'mountain.png',
    prompt: 'Avatar portrait mountain climber, altitude gear peaks behind, determined, flat design, white blue, circular'
  },
  {
    folder: 'avatars',
    name: 'nomad.png',
    prompt: 'Avatar portrait digital nomad, laptop world map, modern traveler, flat design, purple, circular'
  },
  {
    folder: 'avatars',
    name: 'legend.png',
    prompt: 'Avatar portrait legendary traveler, golden aura crown, epic veteran, flat design, gold, premium circular'
  },
];

// Créer les dossiers nécessaires
function createFolders() {
  const folders = [...new Set(IMAGES.map(img => img.folder))];

  for (const folder of folders) {
    const folderPath = path.join(PUBLIC_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Dossier créé: ${folderPath}`);
    }
  }
}

// Télécharger une image depuis Pollinations.ai
function downloadImage(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    const encodedPrompt = encodeURIComponent(`${prompt}, ${BASE_STYLE}`);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${IMAGE_WIDTH}&height=${IMAGE_HEIGHT}&nologo=true`;

    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      // Suivre les redirections
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Supprimer le fichier partiel
      reject(err);
    });
  });
}

// Attendre un délai
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Générer toutes les images
async function generateAllImages() {
  console.log('🎨 Génération des images SpotHitch');
  console.log(`📊 Total: ${IMAGES.length} images à générer`);
  console.log('⏱️  Délai entre images: ' + (DELAY_BETWEEN_IMAGES / 1000) + 's');
  console.log('');

  createFolders();

  let completed = 0;
  let errors = [];

  for (const image of IMAGES) {
    const outputPath = path.join(PUBLIC_DIR, image.folder, image.name);

    // Vérifier si l'image existe déjà
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  [${completed + 1}/${IMAGES.length}] ${image.folder}/${image.name} - existe déjà`);
      completed++;
      continue;
    }

    try {
      console.log(`🖼️  [${completed + 1}/${IMAGES.length}] Génération: ${image.folder}/${image.name}...`);
      await downloadImage(image.prompt, outputPath);
      console.log(`✅ [${completed + 1}/${IMAGES.length}] ${image.folder}/${image.name} - OK`);
    } catch (error) {
      console.error(`❌ [${completed + 1}/${IMAGES.length}] ${image.folder}/${image.name} - Erreur: ${error.message}`);
      errors.push({ image, error: error.message });
    }

    completed++;

    // Attendre entre chaque image pour ne pas surcharger l'API
    if (completed < IMAGES.length) {
      await sleep(DELAY_BETWEEN_IMAGES);
    }
  }

  console.log('');
  console.log('========================================');
  console.log(`✅ Terminé: ${completed - errors.length}/${IMAGES.length} images générées`);

  if (errors.length > 0) {
    console.log(`❌ Erreurs: ${errors.length}`);
    errors.forEach(e => console.log(`   - ${e.image.folder}/${e.image.name}: ${e.error}`));
  }
}

// Lancer le script
generateAllImages().catch(console.error);
