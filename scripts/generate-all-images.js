/**
 * Generate ALL unique images for SpotHitch using Stable Horde API
 * Includes: Badges, VIP levels, Leagues, Avatars, Misc
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const OUTPUT_DIR = './public/images';
const API_URL = 'https://stablehorde.net/api/v2';
const API_KEY = '0000000000'; // Anonymous key

// Style prefix for consistency
const STYLE = 'flat icon style, minimalist digital art, clean design, vibrant colors, white background, high quality';

// All images to generate
const imagesToGenerate = [
  // ============ BADGES ============
  // Beginner badges
  {
    name: 'first-checkin',
    folder: 'badges',
    prompt: `A single footprint stepping forward, symbolizing first step, green and blue colors, ${STYLE}`,
  },
  {
    name: 'first-spot',
    folder: 'badges',
    prompt: `A map pin with a sparkle, symbolizing first contribution, red and gold colors, ${STYLE}`,
  },
  {
    name: 'first-review',
    folder: 'badges',
    prompt: `A pen writing on paper with a star, first review symbol, purple and gold colors, ${STYLE}`,
  },
  // Progress badges
  {
    name: 'explorer-10',
    folder: 'badges',
    prompt: `A target with 10 marks around it, achievement symbol, blue and orange colors, ${STYLE}`,
  },
  {
    name: 'expert-50',
    folder: 'badges',
    prompt: `A golden medal with number 50, veteran achievement, gold and bronze colors, ${STYLE}`,
  },
  {
    name: 'master-100',
    folder: 'badges',
    prompt: `A golden trophy with laurel wreath, master achievement 100, gold and green colors, ${STYLE}`,
  },
  {
    name: 'cartographer',
    folder: 'badges',
    prompt: `An old compass on a treasure map, cartographer explorer symbol, brown and gold colors, ${STYLE}`,
  },
  {
    name: 'mapper',
    folder: 'badges',
    prompt: `A world map with multiple pins, mapper achievement, blue and red colors, ${STYLE}`,
  },
  {
    name: 'critic',
    folder: 'badges',
    prompt: `A notepad with stars and checkmarks, local guide critic symbol, yellow and blue colors, ${STYLE}`,
  },
  {
    name: 'influencer',
    folder: 'badges',
    prompt: `A graduation cap with glowing aura, expert influencer symbol, purple and gold colors, ${STYLE}`,
  },
  // Streak badges
  {
    name: 'streak-7',
    folder: 'badges',
    prompt: `A flame with number 7, one week streak symbol, orange and red colors, ${STYLE}`,
  },
  {
    name: 'streak-30',
    folder: 'badges',
    prompt: `A blazing fire with stars around it, 30 day streak, orange red and yellow colors, ${STYLE}`,
  },
  {
    name: 'streak-100',
    folder: 'badges',
    prompt: `A phoenix rising from flames, 100 day unstoppable streak, red orange and gold colors, ${STYLE}`,
  },
  {
    name: 'streak-365',
    folder: 'badges',
    prompt: `A supernova star explosion, 365 day immortal streak symbol, gold white and cosmic colors, ${STYLE}`,
  },
  // Special badges
  {
    name: 'night-owl',
    folder: 'badges',
    prompt: `A wise owl with glowing eyes under moon, night owl symbol, dark blue and silver colors, ${STYLE}`,
  },
  {
    name: 'early-bird',
    folder: 'badges',
    prompt: `A cheerful bird at sunrise, early bird morning symbol, orange yellow and blue colors, ${STYLE}`,
  },
  {
    name: 'helping-hand',
    folder: 'badges',
    prompt: `Two hands shaking in friendship, good samaritan helper symbol, warm orange and teal colors, ${STYLE}`,
  },
  {
    name: 'legend',
    folder: 'badges',
    prompt: `A royal crown with gems and divine light rays, living legend ultimate achievement, gold purple and white colors, ${STYLE}`,
  },

  // ============ VIP LEVELS (only adventurer - others were generated today) ============
  {
    name: 'adventurer',
    folder: 'vip',
    prompt: `A majestic mountain peak with flag on top, adventurer summit achievement, purple and white colors, ${STYLE}`,
  },

  // ============ LEAGUES - SKIP (all 5 were generated today) ============

  // ============ AVATARS ============
  {
    name: 'backpacker',
    folder: 'avatars',
    prompt: `A happy backpacker with hiking gear and thumb up, traveler avatar, warm earth tones, ${STYLE}`,
  },
  {
    name: 'adventurer',
    folder: 'avatars',
    prompt: `An adventurous explorer with hat and binoculars, adventure seeker avatar, khaki and brown colors, ${STYLE}`,
  },
  {
    name: 'pro',
    folder: 'avatars',
    prompt: `A confident professional traveler with sunglasses, pro hitchhiker avatar, cool blue colors, ${STYLE}`,
  },
  {
    name: 'nature',
    folder: 'avatars',
    prompt: `A nature lover surrounded by leaves and flowers, eco traveler avatar, green and earth colors, ${STYLE}`,
  },
  {
    name: 'urban',
    folder: 'avatars',
    prompt: `A hip urban traveler with city backdrop silhouette, city explorer avatar, modern gray and neon colors, ${STYLE}`,
  },

  // ============ MISC ============
  {
    name: 'empty-spots',
    folder: 'misc',
    prompt: `An empty map with question mark and dotted paths, no spots found illustration, soft gray and blue colors, ${STYLE}`,
  },
  {
    name: 'empty-trips',
    folder: 'misc',
    prompt: `An empty suitcase open with travel stickers, no trips planned illustration, warm pastel colors, ${STYLE}`,
  },
  {
    name: 'empty-friends',
    folder: 'misc',
    prompt: `Two silhouettes with dotted connection line, no friends yet illustration, soft blue and purple colors, ${STYLE}`,
  },
  {
    name: 'offline',
    folder: 'misc',
    prompt: `A cloud with disconnected wifi signal, offline mode illustration, gray and orange colors, ${STYLE}`,
  },
  {
    name: 'error',
    folder: 'misc',
    prompt: `A warning triangle with exclamation mark, error state illustration, red and orange colors, ${STYLE}`,
  },
  {
    name: 'success',
    folder: 'misc',
    prompt: `A checkmark inside a circle with sparkles, success celebration illustration, green and gold colors, ${STYLE}`,
  },
  {
    name: 'loading',
    folder: 'misc',
    prompt: `A spinning compass with motion lines, loading waiting illustration, blue and silver colors, ${STYLE}`,
  },
];

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Make HTTP request
function httpRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Submit image generation request
async function submitGeneration(prompt) {
  const payload = {
    prompt: prompt,
    params: {
      width: 512,
      height: 512,
      steps: 30,
      cfg_scale: 7,
      sampler_name: 'k_euler_a',
    },
    nsfw: false,
    censor_nsfw: true,
    models: ['stable_diffusion'],
  };

  const response = await httpRequest(
    `${API_URL}/generate/async`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
    },
    payload
  );

  if (response.status !== 202) {
    throw new Error(`Submit failed: ${JSON.stringify(response.data)}`);
  }

  return response.data.id;
}

// Check generation status
async function checkStatus(id) {
  const response = await httpRequest(
    `${API_URL}/generate/check/${id}`,
    { method: 'GET' }
  );
  return response.data;
}

// Get generation result
async function getResult(id) {
  const response = await httpRequest(
    `${API_URL}/generate/status/${id}`,
    { method: 'GET' }
  );
  return response.data;
}

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Wait with timeout
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate single image
async function generateImage(imageConfig, forceRegenerate = false) {
  const { name, folder, prompt } = imageConfig;
  const outputPath = path.join(OUTPUT_DIR, folder, `${name}.webp`);

  // Check if already exists
  if (fs.existsSync(outputPath) && !forceRegenerate) {
    console.log(`⏭️  ${folder}/${name} already exists, skipping`);
    return { success: true, skipped: true };
  }

  console.log(`🎨 Generating ${folder}/${name}...`);

  try {
    // Submit request
    const jobId = await submitGeneration(prompt);
    console.log(`   Job ID: ${jobId}`);

    // Poll for completion (max 5 minutes)
    const maxWait = 300000; // 5 minutes
    const startTime = Date.now();
    let status;

    while (Date.now() - startTime < maxWait) {
      await sleep(5000); // Check every 5 seconds
      status = await checkStatus(jobId);

      if (status.done) {
        break;
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`   Waiting... (${elapsed}s, queue: ${status.queue_position || '?'})`);
    }

    if (!status?.done) {
      throw new Error('Generation timeout');
    }

    // Get result
    const result = await getResult(jobId);

    if (!result.generations || result.generations.length === 0) {
      throw new Error('No image generated');
    }

    const imageUrl = result.generations[0].img;

    // Download image
    ensureDir(path.join(OUTPUT_DIR, folder));
    await downloadImage(imageUrl, outputPath);

    console.log(`✅ ${folder}/${name} saved!`);
    return { success: true };

  } catch (error) {
    console.error(`❌ ${folder}/${name} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force') || args.includes('-f');
  const filterFolder = args.find(a => !a.startsWith('-'));

  let images = imagesToGenerate;

  // Filter by folder if specified
  if (filterFolder) {
    images = images.filter(i => i.folder === filterFolder);
    console.log(`📁 Filtering to folder: ${filterFolder}`);
  }

  console.log('🚀 Starting image generation...\n');
  console.log(`Images to generate: ${images.length}`);
  if (forceRegenerate) console.log('⚠️  Force regenerate mode: will overwrite existing images\n');
  console.log('');

  const results = { success: 0, failed: 0, skipped: 0 };

  for (const imageConfig of images) {
    const result = await generateImage(imageConfig, forceRegenerate);

    if (result.skipped) {
      results.skipped++;
    } else if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }

    // Small delay between requests to be nice to the API
    await sleep(2000);
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Generated: ${results.success}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
}

main().catch(console.error);
