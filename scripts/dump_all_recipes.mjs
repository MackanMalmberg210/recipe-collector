import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.resolve(__dirname, '../src/lib/mockData.ts');
const content = fs.readFileSync(mockDataPath, 'utf-8');

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

fs.writeFileSync(path.resolve(__dirname, 'all_recipes.json'), JSON.stringify(recipes, null, 2));
console.log(`Saved ${recipes.length} recipes to scripts/all_recipes.json`);
