import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.resolve(__dirname, '../src/lib/mockData.ts');
const content = fs.readFileSync(mockDataPath, 'utf-8');

// Match recipes array
// Each recipe has id, title, image
const recipes = [];
const recipeRegex = /\{\s*"id":\s*(\d+),\s*"title":\s*"([^"]+)",\s*"image":\s*"([^"]+)"/g;
let match;
while ((match = recipeRegex.exec(content)) !== null) {
  recipes.push({
    id: parseInt(match[1]),
    title: match[2],
    image: match[3],
  });
}

console.log(`Found ${recipes.length} recipes in mockData.ts`);

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const contentType = res.headers.get('content-type') || '';
    return { ok: res.ok, status: res.status, contentType };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function run() {
  const results = [];
  const broken = [];
  for (const recipe of recipes) {
    const status = await checkUrl(recipe.image);
    const isImage = status.contentType.startsWith('image/');
    const isWorking = status.ok && isImage;
    if (!isWorking) {
      broken.push({ ...recipe, ...status });
      console.log(`❌ [ID ${recipe.id}] "${recipe.title}" -> ${status.status} (${status.contentType || status.error || 'not an image'})`);
      console.log(`   URL: ${recipe.image}`);
    } else {
      console.log(`✅ [ID ${recipe.id}] "${recipe.title}" -> 200 OK (${status.contentType})`);
    }
  }

  console.log(`\n================================`);
  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Working: ${recipes.length - broken.length}`);
  console.log(`Broken / Non-image: ${broken.length}`);
  console.log(`================================`);

  fs.writeFileSync(
    path.resolve(__dirname, 'broken_images.json'),
    JSON.stringify(broken, null, 2)
  );
}

run();
