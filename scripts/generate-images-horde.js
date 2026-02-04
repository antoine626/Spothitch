/**
 * Script de génération automatique des images SpotHitch
 * Utilise Stable Horde API (gratuit, distribué)
 * https://stablehorde.net/
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'images');

// Configuration
const API_KEY = '0000000000'; // Clé anonyme (plus lent mais gratuit)
const POLL_INTERVAL = 5000; // 5 secondes entre chaque vérification
const MAX_WAIT_TIME = 300000; // 5 minutes max par image

// Style de base
const BASE_STYLE = ', flat design, minimalist, vector art style, solid colors, clean lines, app icon, digital illustration';

// Images à générer
const IMAGES = [
  // BRANDING
  { folder: 'branding', name: 'logo.webp', prompt: 'logo design, hand thumbs up gesture with map pin marker, travel app icon, blue cyan gradient' },
  { folder: 'branding', name: 'icon-512.webp', prompt: 'square app icon, hitchhiker thumb up inside location pin, blue gradient background' },
  { folder: 'branding', name: 'splash.webp', prompt: 'young traveler with backpack hitchhiking on scenic mountain road at golden sunset' },
  { folder: 'branding', name: 'og-image.webp', prompt: 'travel banner, happy hitchhikers on open road, mountains background, adventure mood' },

  // BADGES
  { folder: 'badges', name: 'first-checkin.webp', prompt: 'achievement badge, golden location pin with checkmark, number one, game reward icon' },
  { folder: 'badges', name: 'explorer-10.webp', prompt: 'bronze achievement medal, compass design, explorer badge, game reward' },
  { folder: 'badges', name: 'expert-50.webp', prompt: 'silver achievement medal, star with road path, expert level badge' },
  { folder: 'badges', name: 'master-100.webp', prompt: 'golden achievement trophy with laurel wreath, master level badge, premium' },
  { folder: 'badges', name: 'streak-7.webp', prompt: 'flame badge icon, 7 day streak, orange fire, achievement reward' },
  { folder: 'badges', name: 'streak-30.webp', prompt: 'big flame badge, 30 day streak, orange gold fire, impressive achievement' },
  { folder: 'badges', name: 'streak-100.webp', prompt: 'epic flame tornado badge, 100 day streak, legendary fire, ultimate achievement' },
  { folder: 'badges', name: 'streak-365.webp', prompt: 'phoenix rising from flames badge, 365 day streak, rainbow fire, legendary achievement' },
  { folder: 'badges', name: 'first-spot.webp', prompt: 'creator badge, location pin with plus sign, blue colors, contribution reward' },
  { folder: 'badges', name: 'cartographer.webp', prompt: 'bronze map badge with pins, cartographer achievement, explorer reward' },
  { folder: 'badges', name: 'mapper.webp', prompt: 'silver detailed map badge, multiple location pins, advanced mapper achievement' },
  { folder: 'badges', name: 'first-review.webp', prompt: 'speech bubble badge with star, first review achievement, feedback reward' },
  { folder: 'badges', name: 'critic.webp', prompt: 'bronze critic badge, multiple stars with pen, reviewer achievement' },
  { folder: 'badges', name: 'influencer.webp', prompt: 'golden megaphone badge with stars, influencer achievement, top reviewer' },
  { folder: 'badges', name: 'night-owl.webp', prompt: 'cute owl badge with moon and stars, night owl achievement, purple blue' },
  { folder: 'badges', name: 'early-bird.webp', prompt: 'cute bird badge with sunrise, early bird achievement, orange yellow' },
  { folder: 'badges', name: 'globetrotter.webp', prompt: 'earth globe badge with airplane trail, world traveler achievement' },
  { folder: 'badges', name: 'legend.webp', prompt: 'legendary golden crown badge with diamonds, rainbow glow, ultimate achievement' },
  { folder: 'badges', name: 'helping-hand.webp', prompt: 'two hands helping badge, community helper achievement, warm colors' },
  { folder: 'badges', name: 'verified.webp', prompt: 'blue checkmark shield badge, verified member, official trust badge' },

  // LEAGUES
  { folder: 'leagues', name: 'bronze.webp', prompt: 'bronze shield emblem, roman numeral III, laurel leaves, league rank' },
  { folder: 'leagues', name: 'silver.webp', prompt: 'silver shield emblem, roman numeral II, shiny metallic, league rank' },
  { folder: 'leagues', name: 'gold.webp', prompt: 'golden shield emblem, roman numeral I, glowing, premium league rank' },
  { folder: 'leagues', name: 'platinum.webp', prompt: 'platinum white shield emblem, diamond accent, elite league rank' },
  { folder: 'leagues', name: 'diamond.webp', prompt: 'crystal diamond shield emblem, rainbow prismatic glow, legendary league' },

  // VIP LEVELS
  { folder: 'vip', name: 'novice.webp', prompt: 'backpack icon with one star, green beginner level, vip rank' },
  { folder: 'vip', name: 'explorer.webp', prompt: 'compass icon with two stars, blue explorer level, vip rank' },
  { folder: 'vip', name: 'adventurer.webp', prompt: 'mountain peak icon with three stars, purple adventurer level, vip rank' },
  { folder: 'vip', name: 'sage.webp', prompt: 'open book icon with four stars, golden sage wisdom level, vip rank' },
  { folder: 'vip', name: 'legend.webp', prompt: 'crown icon with five stars and wings, legendary rainbow level, ultimate vip' },

  // COUNTRY GUIDES
  { folder: 'guides', name: 'fr.webp', prompt: 'France illustration, Eiffel tower with scenic road, french flag colors' },
  { folder: 'guides', name: 'de.webp', prompt: 'Germany illustration, Brandenburg gate with road, german flag colors' },
  { folder: 'guides', name: 'es.webp', prompt: 'Spain illustration, Sagrada Familia with sunny coast, spanish flag colors' },
  { folder: 'guides', name: 'it.webp', prompt: 'Italy illustration, Colosseum with tuscan road, italian flag colors' },
  { folder: 'guides', name: 'nl.webp', prompt: 'Netherlands illustration, windmill with bike path tulips, dutch flag colors' },
  { folder: 'guides', name: 'be.webp', prompt: 'Belgium illustration, Atomium with european road, belgian flag colors' },
  { folder: 'guides', name: 'pt.webp', prompt: 'Portugal illustration, Lisbon tram coastal road, portuguese flag colors' },
  { folder: 'guides', name: 'at.webp', prompt: 'Austria illustration, alpine mountains scenic road, austrian flag colors' },
  { folder: 'guides', name: 'ch.webp', prompt: 'Switzerland illustration, Matterhorn mountain road, swiss flag colors' },
  { folder: 'guides', name: 'ie.webp', prompt: 'Ireland illustration, green cliffs countryside road, irish flag colors' },
  { folder: 'guides', name: 'pl.webp', prompt: 'Poland illustration, Krakow castle countryside, polish flag colors' },
  { folder: 'guides', name: 'cz.webp', prompt: 'Czech illustration, Prague castle bridge road, czech flag colors' },

  // TUTORIAL
  { folder: 'tutorial', name: 'welcome.webp', prompt: 'friendly traveler waving hello, backpack, open road ahead, welcoming' },
  { folder: 'tutorial', name: 'home.webp', prompt: 'dashboard illustration, map with stats icons, organized command center' },
  { folder: 'tutorial', name: 'stats.webp', prompt: 'statistics graphs and charts, progress trophy medals, analytics' },
  { folder: 'tutorial', name: 'badges.webp', prompt: 'collection of achievement medals floating, treasure chest, rewards' },
  { folder: 'tutorial', name: 'challenges.webp', prompt: 'target with arrow, quest board checklist, gamification' },
  { folder: 'tutorial', name: 'shop.webp', prompt: 'reward shop storefront, items on display, coins floating' },
  { folder: 'tutorial', name: 'quiz.webp', prompt: 'brain with lightbulb and question marks, knowledge quiz' },
  { folder: 'tutorial', name: 'spots.webp', prompt: 'map with multiple location pins, magnifying glass, spot discovery' },
  { folder: 'tutorial', name: 'map.webp', prompt: 'interactive map with zoom controls, navigation interface' },
  { folder: 'tutorial', name: 'filters.webp', prompt: 'funnel filter icon with sorting options sliders' },
  { folder: 'tutorial', name: 'addspot.webp', prompt: 'hand placing pin on map, camera and form, contribution' },
  { folder: 'tutorial', name: 'planner.webp', prompt: 'route on map with stops, journey planner calendar' },
  { folder: 'tutorial', name: 'chat.webp', prompt: 'speech bubbles conversation, community chat, travelers talking' },
  { folder: 'tutorial', name: 'profile.webp', prompt: 'user profile avatar with settings gear, personalization' },
  { folder: 'tutorial', name: 'sos.webp', prompt: 'emergency alert icon, location sharing, safety help signal' },
  { folder: 'tutorial', name: 'ready.webp', prompt: 'excited traveler thumbs up, sunrise open road, adventure begins' },

  // MISC
  { folder: 'misc', name: 'empty-spots.webp', prompt: 'confused traveler looking at empty map, question mark, no results' },
  { folder: 'misc', name: 'empty-trips.webp', prompt: 'empty suitcase waiting, road ahead, no trips yet, encouraging' },
  { folder: 'misc', name: 'empty-friends.webp', prompt: 'lonely traveler looking for companions, empty, inviting' },
  { folder: 'misc', name: 'empty-messages.webp', prompt: 'empty chat bubbles, no messages yet, waiting' },
  { folder: 'misc', name: 'offline.webp', prompt: 'cloud with X icon, offline mode, no connection signal' },
  { folder: 'misc', name: 'error.webp', prompt: 'cute confused robot with warning sign, error oops' },
  { folder: 'misc', name: 'success.webp', prompt: 'happy person celebrating with confetti, success checkmark' },
  { folder: 'misc', name: 'loading.webp', prompt: 'traveler walking forward, loading progress, please wait' },

  // AVATARS
  { folder: 'avatars', name: 'backpacker.webp', prompt: 'avatar portrait, young backpacker character, large backpack, friendly smile' },
  { folder: 'avatars', name: 'adventurer.webp', prompt: 'avatar portrait, explorer character with hat compass, confident' },
  { folder: 'avatars', name: 'hippie.webp', prompt: 'avatar portrait, hippie traveler character, peace sign, colorful' },
  { folder: 'avatars', name: 'pro.webp', prompt: 'avatar portrait, professional hitchhiker, bandana sunglasses, cool' },
  { folder: 'avatars', name: 'nature.webp', prompt: 'avatar portrait, nature lover character, leaves mountains, peaceful' },
  { folder: 'avatars', name: 'urban.webp', prompt: 'avatar portrait, urban traveler character, hoodie city style' },
  { folder: 'avatars', name: 'beach.webp', prompt: 'avatar portrait, beach traveler character, surfer sunset vibes' },
  { folder: 'avatars', name: 'mountain.webp', prompt: 'avatar portrait, mountain climber character, altitude gear' },
  { folder: 'avatars', name: 'nomad.webp', prompt: 'avatar portrait, digital nomad character, laptop world map' },
  { folder: 'avatars', name: 'legend.webp', prompt: 'avatar portrait, legendary traveler character, golden aura crown' },
];

// Créer les dossiers
function createFolders() {
  const folders = [...new Set(IMAGES.map(img => img.folder))];
  for (const folder of folders) {
    const folderPath = path.join(PUBLIC_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Dossier créé: ${folder}`);
    }
  }
}

// Faire une requête HTTPS
function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

// Télécharger une image depuis une URL
function downloadFromUrl(url, outputPath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'SpotHitch-ImageGenerator/1.0'
      }
    };

    const file = fs.createWriteStream(outputPath);
    const request = https.get(options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Suivre la redirection
        downloadFromUrl(response.headers.location, outputPath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });

    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// Attendre
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Soumettre un job à Stable Horde
async function submitJob(prompt) {
  const postData = JSON.stringify({
    prompt: prompt + BASE_STYLE,
    params: {
      width: 512,
      height: 512,
      steps: 20,
      cfg_scale: 7.5,
      sampler_name: 'k_euler'
    },
    nsfw: false,
    censor_nsfw: true,
    trusted_workers: false,
    models: ['stable_diffusion']
  });

  const options = {
    hostname: 'stablehorde.net',
    path: '/api/v2/generate/async',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const response = await httpsRequest(options, postData);
  if (response.id) {
    return response.id;
  }
  throw new Error(response.message || 'Failed to submit job');
}

// Vérifier le statut d'un job
async function checkStatus(jobId) {
  const options = {
    hostname: 'stablehorde.net',
    path: `/api/v2/generate/check/${jobId}`,
    method: 'GET'
  };
  return await httpsRequest(options);
}

// Récupérer le résultat
async function getResult(jobId) {
  const options = {
    hostname: 'stablehorde.net',
    path: `/api/v2/generate/status/${jobId}`,
    method: 'GET'
  };
  return await httpsRequest(options);
}

// Générer une image
async function generateImage(image, index, total) {
  const outputPath = path.join(PUBLIC_DIR, image.folder, image.name);

  // Skip si existe déjà et valide
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    if (stats.size > 5000) {
      console.log(`⏭️  [${index}/${total}] ${image.folder}/${image.name} - existe déjà (${Math.round(stats.size/1024)}KB)`);
      return true;
    }
    // Supprimer le fichier corrompu
    fs.unlinkSync(outputPath);
  }

  try {
    // Soumettre le job
    process.stdout.write(`🎨 [${index}/${total}] ${image.folder}/${image.name}...`);
    const jobId = await submitJob(image.prompt);

    // Attendre la fin
    const startTime = Date.now();
    while (Date.now() - startTime < MAX_WAIT_TIME) {
      await sleep(POLL_INTERVAL);
      const status = await checkStatus(jobId);

      if (status.done) {
        // Récupérer le résultat
        const result = await getResult(jobId);
        if (result.generations && result.generations.length > 0) {
          const imageUrl = result.generations[0].img;

          // Télécharger l'image
          await downloadFromUrl(imageUrl, outputPath);

          const fileSize = fs.statSync(outputPath).size;
          console.log(` ✅ (${Math.round(fileSize/1024)}KB)`);
          return true;
        }
      } else if (status.faulted) {
        console.log(` ❌ Erreur`);
        return false;
      } else {
        const waitTime = status.wait_time || '?';
        process.stdout.write(`\r🎨 [${index}/${total}] ${image.folder}/${image.name}... ⏳ ${waitTime}s (queue: ${status.queue_position || 0})   `);
      }
    }

    console.log(` ⏰ Timeout`);
    return false;

  } catch (error) {
    console.log(` ❌ ${error.message}`);
    return false;
  }
}

// Main
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎨 SpotHitch Image Generator - Stable Horde');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Total: ${IMAGES.length} images`);
  console.log('⚠️  Clé anonyme = file d\'attente (~30-60s par image)');
  console.log('═══════════════════════════════════════════════════════\n');

  createFolders();

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < IMAGES.length; i++) {
    const result = await generateImage(IMAGES[i], i + 1, IMAGES.length);
    if (result === true) {
      const outputPath = path.join(PUBLIC_DIR, IMAGES[i].folder, IMAGES[i].name);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        success++;
      } else {
        skipped++;
      }
    } else {
      failed++;
    }

    // Pause entre les jobs pour ne pas surcharger l'API
    if (i < IMAGES.length - 1) {
      await sleep(2000);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RÉSULTATS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Générées: ${success}`);
  console.log(`⏭️  Existantes: ${skipped}`);
  console.log(`❌ Échecs: ${failed}`);
  console.log(`📁 Dossier: ${PUBLIC_DIR}`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(console.error);
