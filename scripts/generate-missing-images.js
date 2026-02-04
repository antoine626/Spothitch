/**
 * Generate missing VIP and League images using Stable Horde API
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const OUTPUT_DIR = './public/images';
const API_URL = 'https://stablehorde.net/api/v2';
const API_KEY = '0000000000'; // Anonymous key

// Images to generate
const imagesToGenerate = [
  // VIP Levels
  {
    name: 'novice',
    folder: 'vip',
    prompt: 'A small green seedling sprouting from soil, symbolizing new beginnings, simple flat icon style, minimalist, soft green colors, white background, digital art',
  },
  {
    name: 'explorer',
    folder: 'vip',
    prompt: 'A golden compass with intricate details, adventure exploration symbol, flat icon style, blue and gold colors, white background, digital art',
  },
  {
    name: 'sage',
    folder: 'vip',
    prompt: 'A wise owl with golden amber eyes, wisdom symbol, flat icon style, amber and brown colors, white background, digital art',
  },
  {
    name: 'legend',
    folder: 'vip',
    prompt: 'A majestic golden crown with red jewels, legendary achievement symbol, flat icon style, gold and red colors, glowing effect, white background, digital art',
  },
  // Leagues
  {
    name: 'bronze',
    folder: 'leagues',
    prompt: 'A shiny bronze medal with laurel wreath, third place achievement, flat icon style, copper bronze colors, white background, digital art',
  },
  {
    name: 'silver',
    folder: 'leagues',
    prompt: 'A polished silver medal with star emblem, second place achievement, flat icon style, silver metallic colors, white background, digital art',
  },
  {
    name: 'gold',
    folder: 'leagues',
    prompt: 'A gleaming gold medal with trophy emblem, first place achievement, flat icon style, rich gold colors, white background, digital art',
  },
  {
    name: 'platinum',
    folder: 'leagues',
    prompt: 'A luxurious platinum badge with diamond emblem, elite achievement, flat icon style, platinum silver with blue tint, white background, digital art',
  },
  {
    name: 'diamond',
    folder: 'leagues',
    prompt: 'A brilliant diamond gem with multiple facets sparkling, ultimate achievement, flat icon style, ice blue and white colors, glowing effect, white background, digital art',
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
async function generateImage(imageConfig) {
  const { name, folder, prompt } = imageConfig;
  const outputPath = path.join(OUTPUT_DIR, folder, `${name}.webp`);

  // Check if already exists
  if (fs.existsSync(outputPath)) {
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
  console.log('🚀 Starting image generation...\n');
  console.log(`Images to generate: ${imagesToGenerate.length}\n`);

  const results = { success: 0, failed: 0, skipped: 0 };

  for (const imageConfig of imagesToGenerate) {
    const result = await generateImage(imageConfig);

    if (result.skipped) {
      results.skipped++;
    } else if (result.success) {
      results.success++;
    } else {
      results.failed++;
    }

    // Small delay between requests
    await sleep(2000);
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Generated: ${results.success}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
}

main().catch(console.error);
