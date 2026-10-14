import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.resolve(__dirname, '../src/lib/mockData.ts');

let content = fs.readFileSync(mockDataPath, 'utf-8');

// Verified image map for broken or mismatched recipes
const replacements = {
  // Spoonacular 404s replaced with verified high-res food photography
  102: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80", // Banana Pancakes
  105: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80", // Breakfast Egg Muffins / Skillet
  106: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=800&q=80", // Avocado Toast
  108: "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=800&q=80", // Classic French Toast
  117: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80", // Roasted Tomato Soup
  119: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80", // Minestrone Soup
  121: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80", // Tabbouleh
  130: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80", // Sesame Noodles
  134: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Beef Stir Fry
  141: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80", // Vegetable Lasagna
  142: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80", // Chili
  144: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80", // Fried Rice
  145: "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80", // Sesame Chicken
  146: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80", // Sheet Pan Chicken
  147: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80", // Baked Salmon

  // Tablet photo fixes
  110: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80", // Acai Bowl
  118: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80", // Quinoa Salad
  120: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80", // Zucchini Noodles
  135: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80", // Baked Salmon
  137: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80", // Parmesan Crusted Chicken
  148: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80", // Creamy Tuscan Chicken

  // Snack fixes (replace rice krispies sprinkles on stick)
  20: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=800&q=80", // Almond Butter Cacao Energy Bites
  24: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"  // Rice Cake Crunch
};

let updatedCount = 0;
for (const [idStr, newUrl] of Object.entries(replacements)) {
  const id = parseInt(idStr);
  const regex = new RegExp(`(\\{\\s*"id":\\s*${id},[\\s\\S]*?"image":\\s*")[^"]+(")`, 'g');
  if (regex.test(content)) {
    content = content.replace(regex, `$1${newUrl}$2`);
    updatedCount++;
    console.log(`Updated recipe ${id} image`);
  } else {
    console.log(`Could not find recipe ${id}`);
  }
}

fs.writeFileSync(mockDataPath, content, 'utf-8');
console.log(`Successfully updated ${updatedCount} recipes in mockData.ts!`);
