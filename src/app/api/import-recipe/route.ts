import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { execFile } from "child_process";
import { promisify } from "util";
import type { ImportedRecipe, IngredientGroup, NutritionInfo, RecipeCategory, MealType } from "../../../lib/types";
import { normalizeRecipe } from "../../../lib/recipeNormalizer";
import { parseIngredientList } from "../../../lib/ingredientParser";
import { sanitizeCulinaryText } from "../../../lib/culinaryTextSanitizer";
import { validatePublicRecipeUrl } from "../../../lib/security/urlValidator";
import { checkRateLimit, getClientIp } from "../../../lib/security/rateLimiter";

const execFileAsync = promisify(execFile);

async function fetchWithCurl(url: string): Promise<string | null> {
  try {
    const curlCmd = process.platform === "win32" ? "curl.exe" : "curl";
    const { stdout } = await execFileAsync(
      curlCmd,
      [
        "-s",
        "-L",
        "--compressed",
        "--max-time",
        "15",
        "-A",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "-H",
        "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "-H",
        "Accept-Language: en-US,en;q=0.9",
        url,
      ],
      { maxBuffer: 15 * 1024 * 1024 }
    );
    if (stdout && stdout.length > 500) {
      return stdout;
    }
  } catch (err) {
    console.warn("Resilient curl fetch fallback failed:", err);
  }
  return null;
}

type JsonLdNode = {
  "@type"?: string | string[];
  "@graph"?: JsonLdNode[];
  name?: string;
  description?: string;
  image?:
    | string
    | string[]
    | { url?: string; contentUrl?: string; thumbnailUrl?: string; caption?: string }
    | Array<{ url?: string; contentUrl?: string; thumbnailUrl?: string; caption?: string }>;
  recipeIngredient?: string[];
  recipeInstructions?:
    | string[]
    | string
    | Array<{ text?: string; name?: string; itemListElement?: Array<{ text?: string; name?: string }> }>;
  totalTime?: string;
  prepTime?: string;
  recipeYield?: string | number | Array<string | number>;
  author?: { name?: string } | Array<{ name?: string }> | string;
  publisher?: { name?: string };
  video?: any;
  nutrition?: {
    calories?: string;
    fatContent?: string;
    saturatedFatContent?: string;
    transFatContent?: string;
    cholesterolContent?: string;
    sodiumContent?: string;
    carbohydrateContent?: string;
    fiberContent?: string;
    sugarContent?: string;
    proteinContent?: string;
    vitaminAContent?: string;
    vitaminCContent?: string;
    potassiumContent?: string;
    ironContent?: string;
    phosphorusContent?: string;
  };
};

function isRecipeType(type: string | string[] | undefined) {
  if (!type) return false;

  if (Array.isArray(type)) {
    return type.some((value) => value.toLowerCase() === "recipe");
  }

  return type.toLowerCase() === "recipe";
}

function flattenJsonLd(node: JsonLdNode): JsonLdNode[] {
  const nodes: JsonLdNode[] = [node];

  if (Array.isArray(node["@graph"])) {
    for (const child of node["@graph"]) {
      nodes.push(...flattenJsonLd(child));
    }
  }

  return nodes;
}

// ----------------------------------------------------
// HIGH-RESOLUTION IMAGE ENHANCEMENT
// ----------------------------------------------------
function upgradeToHighResImageUrl(imageUrl: string): string {
  if (!imageUrl) return "";

  let upgraded = imageUrl.trim();

  // 1. Remove WordPress thumbnail downscale dimension suffixes (e.g. -300x300.jpg, -500x375.webp, -150x150.jpg, -720x405.jpg, -768x...jpg)
  upgraded = upgraded.replace(/-\d+x\d+(\.[a-zA-Z0-9]+(?:\?.*)?)$/i, "$1");

  // 2. Remove WordPress / Tachyon / Mediavine / CDN resize query params (e.g. ?fit=225%2C225, ?resize=400%2C400, ?w=300)
  if (
    upgraded.includes("/tachyon/") ||
    upgraded.includes("/wp-content/uploads/") ||
    upgraded.includes("pinchofyum.com") ||
    upgraded.includes("mediavine")
  ) {
    upgraded = upgraded.split("?")[0];
  } else {
    // Strip common resize/crop query parameters
    try {
      const urlObj = new URL(upgraded);
      const paramsToDelete = ["resize", "fit", "w", "h", "width", "height", "crop", "zoom", "quality", "strip"];
      for (const p of paramsToDelete) {
        urlObj.searchParams.delete(p);
      }
      upgraded = urlObj.toString();
    } catch {
      // Fallback
    }
  }

  // 3. Upgrade Cloudinary / imgix / WordPress photon dimensions
  if (upgraded.includes("cloudinary.com") || upgraded.includes("imgix.net") || upgraded.includes("wp.com")) {
    upgraded = upgraded.replace(/\/c_fill,w_\d+,h_\d+\//, "/c_limit,w_1600/");
  }

  // 4. Dotdash / Allrecipes thmb dimension upgrade to /1500x0/ for crystal clear full-res photos
  if (upgraded.includes("/thmb/")) {
    upgraded = upgraded.replace(/\/thmb\/([^/]+)\/\d+x\d+\//, "/thmb/$1/1500x0/");
  }

  return upgraded;
}

function findBetterAspectCounterpart(imageUrl: string, html: string): string {
  if (!imageUrl || !html) return imageUrl;

  // If the image is a 2x1 or 16x9 banner (common on Allrecipes, Dotdash Meredith, Food Network, etc.)
  if (/2x1|16x9|16-9|1200x630|facebook|twitter|og-image/i.test(imageUrl)) {
    // 1. Try to find the same base filename with 4x3
    const filename = imageUrl.split("/").pop()?.split("?")[0] || "";
    const baseName = filename.replace(/(?:2x1|16x9|16-9|1200x630).*$/i, "");
    if (baseName && baseName.length > 3) {
      const escapedBase = baseName.replace(/[-_]$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const counterpartRegex = new RegExp(
        `https?://[^\\s"'<>]+${escapedBase}[^\\s"'<>]*4x3[^\\s"'<>]+\\.(?:jpg|jpeg|png|webp)`,
        "i"
      );
      const counterpartMatch = html.match(counterpartRegex);
      if (counterpartMatch && counterpartMatch[0]) {
        return counterpartMatch[0];
      }
    }

    // 2. Try to find any high-res 4x3 image candidate in the HTML from the same host
    try {
      const host = new URL(imageUrl).hostname;
      const hostRegex = new RegExp(
        `https?://${host.replace(/\./g, "\\.")}/[^\\s"'<>]*4x3[^\\s"'<>]+\\.(?:jpg|jpeg|png|webp)`,
        "i"
      );
      const host4x3Match = html.match(hostRegex);
      if (host4x3Match && host4x3Match[0]) {
        return host4x3Match[0];
      }
    } catch {}
  }

  return imageUrl;
}

function extractImage(image: JsonLdNode["image"]): string {
  if (!image) return "";

  if (typeof image === "string") {
    return upgradeToHighResImageUrl(image);
  }

  if (Array.isArray(image)) {
    const candidates = image.map((item) => {
      if (typeof item === "string") return item;
      return item.url ?? item.contentUrl ?? item.thumbnailUrl ?? "";
    }).filter(Boolean);

    // Prefer standard photographic aspect ratios (4:3, 3:2) which capture the full dish without extreme panoramic crop
    const fourByThree = candidates.find((url) => /4x3|4-3|4:3|3x2|3:2|3-2/i.test(url));
    const square = candidates.find((url) => /1x1|1-1|1:1|square/i.test(url));
    const nonBanner = candidates.find((url) => !/2x1|16x9|16-9|1200x630/i.test(url));

    const highRes =
      fourByThree ||
      nonBanner ||
      square ||
      candidates.find((url) => !/[?&](?:fit|resize|w)=\d+/i.test(url) && !/-\d+x\d+\./.test(url)) ||
      candidates[0];

    return upgradeToHighResImageUrl(highRes || "");
  }

  const url = image.url ?? image.contentUrl ?? image.thumbnailUrl ?? "";
  return upgradeToHighResImageUrl(url);
}

function extractInstructions(
  instructions: JsonLdNode["recipeInstructions"],
): string[] {
  if (!instructions) return [];

  if (typeof instructions === "string") {
    return instructions
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean);
  }

  if (Array.isArray(instructions)) {
    const result: string[] = [];

    for (const item of instructions) {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed) result.push(trimmed);
        continue;
      }

      if (item.text?.trim()) {
        result.push(item.text.trim());
        continue;
      }

      if (item.name?.trim()) {
        result.push(item.name.trim());
        continue;
      }

      if (Array.isArray(item.itemListElement)) {
        for (const subItem of item.itemListElement) {
          const text = subItem.text?.trim() || subItem.name?.trim();
          if (text) result.push(text);
        }
      }
    }

    return result;
  }

  return [];
}

function extractNutrition(nutrition?: JsonLdNode["nutrition"]): NutritionInfo | undefined {
  if (!nutrition) return undefined;

  const caloriesValue = nutrition.calories
    ? Number(nutrition.calories.replace(/[^\d.]/g, ""))
    : undefined;

  return {
    calories: Number.isFinite(caloriesValue) ? caloriesValue : undefined,
    fat: nutrition.fatContent,
    saturatedFat: nutrition.saturatedFatContent,
    transFat: nutrition.transFatContent,
    cholesterol: nutrition.cholesterolContent,
    sodium: nutrition.sodiumContent,
    carbohydrates: nutrition.carbohydrateContent,
    fiber: nutrition.fiberContent,
    sugar: nutrition.sugarContent,
    protein: nutrition.proteinContent,
    vitaminA: nutrition.vitaminAContent,
    vitaminC: nutrition.vitaminCContent,
    potassium: nutrition.potassiumContent,
    iron: nutrition.ironContent,
    phosphorus: nutrition.phosphorusContent,
  };
}

function parseServings(recipeYield?: string | number | Array<string | number>): {
  servings?: number;
  servingsText?: string;
} {
  if (!recipeYield) return {};

  let yieldString = "";
  if (Array.isArray(recipeYield)) {
    yieldString = String(recipeYield[0] ?? "");
    const rangeEntry = recipeYield.find((y) => /[-–—to]/i.test(String(y)));
    if (rangeEntry) yieldString = String(rangeEntry);
  } else {
    yieldString = String(recipeYield);
  }

  yieldString = yieldString.trim();
  if (!yieldString) return {};

  // Range like "4-5", "4 to 6 servings"
  const rangeMatch = yieldString.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return {
      servings: min,
      servingsText: `${min}–${max} servings`,
    };
  }

  // Single number
  const singleMatch = yieldString.match(/(\d+)/);
  if (singleMatch) {
    const num = Number(singleMatch[1]);
    return {
      servings: num,
      servingsText: `${num} servings`,
    };
  }

  return {
    servingsText: yieldString,
  };
}

function parseIsoDurationToMinutes(value?: string): number | undefined {
  if (!value) return undefined;

  const match = value.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i,
  );

  if (!match) return undefined;

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);

  return days * 24 * 60 + hours * 60 + minutes;
}

// ----------------------------------------------------
// INGREDIENT GROUP / SECTION PARSER
// ----------------------------------------------------
function parseIngredientGroups(
  ingredients: string[],
  $: cheerio.CheerioAPI,
): IngredientGroup[] {
  // 1. WP Recipe Maker pattern
  const wprmGroups = $(".wprm-recipe-ingredient-group");
  if (wprmGroups.length > 1) {
    const groups: IngredientGroup[] = [];
    wprmGroups.each((_, el) => {
      const heading = $(el).find(".wprm-recipe-group-name").text().trim();
      const items: string[] = [];
      $(el).find(".wprm-recipe-ingredient, li").each((_, li) => {
        const t = $(li).text().replace(/\s+/g, " ").trim();
        if (t) items.push(t);
      });
      if (items.length > 0) {
        groups.push({
          heading: heading || undefined,
          ingredients: items,
          structuredIngredients: parseIngredientList(items),
        });
      }
    });
    if (groups.length > 1) return groups;
  }

  // 2. Tasty Recipes & WordPress block pattern
  const tastyContainer = $(
    ".tasty-recipes-ingredients, [class*='tasty-recipes-ingredients'], .recipe-ingredients",
  );
  if (tastyContainer.length > 0) {
    const groups: IngredientGroup[] = [];
    let currentHeading: string | undefined = undefined;

    tastyContainer.find("p, h3, h4, h5, ul, ol").each((_, el) => {
      const tagName = el.tagName.toLowerCase();
      const element = $(el);

      if (tagName === "p" || tagName === "h3" || tagName === "h4" || tagName === "h5") {
        const strongText = element.find("strong, b").text().trim() || element.text().trim();
        if (
          strongText &&
          !/^ingredients$/i.test(strongText) &&
          !/^units/i.test(strongText) &&
          !/^scale/i.test(strongText) &&
          (element.find("strong, b").length > 0 || tagName !== "p")
        ) {
          currentHeading = strongText.replace(/^[\*\#\-\s]+|[\*\:\s]+$/g, "").trim();
        }
      } else if (tagName === "ul" || tagName === "ol") {
        const items: string[] = [];
        element.find("li").each((_, li) => {
          const t = $(li).text().replace(/\s+/g, " ").trim();
          if (t) items.push(t);
        });
        if (items.length > 0) {
          groups.push({
            heading: currentHeading,
            ingredients: items,
            structuredIngredients: parseIngredientList(items),
          });
          currentHeading = undefined;
        }
      }
    });

    if (groups.length > 1) return groups;
  }

  // 3. Mediavine Create pattern
  const mvGroups = $(".mv-create-ingredients-section");
  if (mvGroups.length > 1) {
    const groups: IngredientGroup[] = [];
    mvGroups.each((_, el) => {
      const heading = $(el).find(".mv-create-ingredients-heading").text().trim();
      const items: string[] = [];
      $(el).find("li").each((_, li) => {
        const t = $(li).text().replace(/\s+/g, " ").trim();
        if (t) items.push(t);
      });
      if (items.length > 0) {
        groups.push({
          heading: heading || undefined,
          ingredients: items,
          structuredIngredients: parseIngredientList(items),
        });
      }
    });
    if (groups.length > 1) return groups;
  }

  // 4. Fallback: Parse section headings directly from recipeIngredient array strings (e.g. "For the Kimchi Bacon Jam:", "**Sauce**")
  const parsedGroups: IngredientGroup[] = [];
  let currentHeading: string | undefined = undefined;
  let currentItems: string[] = [];

  for (const raw of ingredients) {
    const item = raw.trim();
    if (!item) continue;

    const isHeading =
      (item.endsWith(":") && !/\d+\s*(?:cup|tbsp|tsp|g|kg|oz|ml|lb)/i.test(item)) ||
      (/^for the\s+/i.test(item) && item.length < 50) ||
      (/^\*\*.*\*\*$/.test(item));

    if (isHeading) {
      if (currentItems.length > 0) {
        parsedGroups.push({
          heading: currentHeading,
          ingredients: currentItems,
          structuredIngredients: parseIngredientList(currentItems),
        });
        currentItems = [];
      }
      currentHeading = item.replace(/^[\*\#\-\s]+|[\*\:\s]+$/g, "").trim();
    } else {
      currentItems.push(item);
    }
  }

  if (currentItems.length > 0) {
    parsedGroups.push({
      heading: currentHeading,
      ingredients: currentItems,
      structuredIngredients: parseIngredientList(currentItems),
    });
  }

  return parsedGroups;
}

function extractRecipeFromJsonLd(
  html: string,
  url: string,
): ImportedRecipe | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');

  for (const element of scripts.toArray()) {
    const raw = $(element).contents().text().trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const nodes: JsonLdNode[] = Array.isArray(parsed)
        ? parsed.flatMap((item) => flattenJsonLd(item))
        : flattenJsonLd(parsed);

      const recipeNode = nodes.find((node) => isRecipeType(node["@type"]));
      if (!recipeNode) continue;

      const ingredients = Array.isArray(recipeNode.recipeIngredient)
        ? recipeNode.recipeIngredient.map(sanitizeCulinaryText).filter(Boolean)
        : [];

      const instructions = extractInstructions(recipeNode.recipeInstructions);
      
      // High resolution image extraction
      let image = toAbsoluteUrl(extractImage(recipeNode.image), url);
      const ogImage = $("meta[property='og:image']").attr("content") || $("meta[name='twitter:image']").attr("content");
      if (!image && ogImage) {
        const upgradedOg = upgradeToHighResImageUrl(toAbsoluteUrl(ogImage, url));
        if (isUsefulImageUrl(upgradedOg)) {
          image = upgradedOg;
        }
      }
      if (!image) {
        image = extractBestHtmlImage(html, url);
      }
      if (image) {
        image = findBetterAspectCounterpart(image, html);
      }

      const cookTime =
        parseIsoDurationToMinutes(recipeNode.totalTime) ??
        parseIsoDurationToMinutes(recipeNode.prepTime);

      const { servings, servingsText } = parseServings(recipeNode.recipeYield);

      // Real description / story
      const description =
        recipeNode.description?.trim() ||
        $("meta[property='og:description']").attr("content")?.trim() ||
        $("meta[name='description']").attr("content")?.trim() ||
        undefined;

      // Grouped ingredients
      const ingredientGroups = parseIngredientGroups(ingredients, $);

      // Author name
      let authorName: string | undefined = undefined;
      if (typeof recipeNode.author === "string") {
        authorName = recipeNode.author;
      } else if (Array.isArray(recipeNode.author)) {
        authorName = recipeNode.author[0]?.name;
      } else if (recipeNode.author?.name) {
        authorName = recipeNode.author.name;
      }

      // Video extraction
      let videoUrl: string | undefined = undefined;
      let videoEmbedUrl: string | undefined = undefined;

      if (recipeNode.video) {
        const v = recipeNode.video as any;
        if (typeof v === "string") {
          videoUrl = v;
        } else {
          videoEmbedUrl = v.embedUrl || undefined;
          videoUrl = v.contentUrl || v.url || v.embedUrl || undefined;
        }

        if (videoUrl && !videoEmbedUrl) {
          const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          if (ytMatch) {
            videoEmbedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
          }
        }
      }

      return {
        title: recipeNode.name?.trim() || "Imported recipe",
        description,
        image,
        cookTime,
        servings,
        servingsText,
        ingredients,
        structuredIngredients: parseIngredientList(ingredients),
        ingredientGroups: ingredientGroups.length > 1 ? ingredientGroups : undefined,
        instructions,
        sourceUrl: url,
        sourceName: authorName
          ? (recipeNode.publisher?.name ? `${authorName} (${recipeNode.publisher.name})` : authorName)
          : (recipeNode.publisher?.name || undefined),
        videoUrl,
        videoEmbedUrl,
        nutrition: extractNutrition(recipeNode.nutrition),
      };
    } catch {
      continue;
    }
  }

  return null;
}

function toAbsoluteUrl(value: string | undefined, pageUrl: string) {
  if (!value) return "";

  const cleanedValue = value.trim();

  if (
    !cleanedValue ||
    cleanedValue.startsWith("data:") ||
    cleanedValue.startsWith("blob:") ||
    cleanedValue === "#" ||
    cleanedValue.toLowerCase() === "undefined"
  ) {
    return "";
  }

  try {
    return new URL(cleanedValue, pageUrl).toString();
  } catch {
    return "";
  }
}

function isUsefulImageUrl(value: string) {
  if (!value) return false;

  const lowerValue = value.toLowerCase();

  if (
    lowerValue.includes("data:image") ||
    lowerValue.includes("placeholder") ||
    lowerValue.includes("avatar") ||
    lowerValue.includes("author") ||
    lowerValue.includes("logo") ||
    lowerValue.includes("sprite") ||
    lowerValue.includes("icon")
  ) {
    return false;
  }

  return (
    lowerValue.includes(".jpg") ||
    lowerValue.includes(".jpeg") ||
    lowerValue.includes(".png") ||
    lowerValue.includes(".webp") ||
    lowerValue.includes("allrecipes.com/thmb") ||
    lowerValue.includes("imagesvc.meredithcorp.io")
  );
}

function extractBestHtmlImage(html: string, pageUrl: string) {
  const $ = cheerio.load(html);

  const metaCandidates = [
    $("meta[property='og:image']").attr("content"),
    $("meta[property='og:image:url']").attr("content"),
    $("meta[property='og:image:secure_url']").attr("content"),
    $("meta[name='twitter:image']").attr("content"),
    $("meta[name='twitter:image:src']").attr("content"),
  ];

  for (const candidate of metaCandidates) {
    let absoluteUrl = upgradeToHighResImageUrl(toAbsoluteUrl(candidate, pageUrl));
    if (isUsefulImageUrl(absoluteUrl)) {
      absoluteUrl = findBetterAspectCounterpart(absoluteUrl, html);
      return absoluteUrl;
    }
  }

  const imageCandidates: string[] = [];

  $("img").each((_, img) => {
    const element = $(img);

    imageCandidates.push(
      element.attr("src") ?? "",
      element.attr("data-src") ?? "",
      element.attr("data-original") ?? "",
      element.attr("data-lazy-src") ?? "",
      element.attr("data-pin-media") ?? "",
      element.attr("content") ?? "",
    );

    const srcset = element.attr("srcset") || element.attr("data-srcset");
    if (srcset) {
      srcset.split(",").forEach((item) => {
        imageCandidates.push(item.trim().split(" ")[0] ?? "");
      });
    }
  });

  // First check for candidates with 4x3 or standard photographic aspect ratios
  for (const candidate of imageCandidates) {
    if (/4x3|4-3|4:3|3x2|3:2/i.test(candidate)) {
      const absoluteUrl = upgradeToHighResImageUrl(toAbsoluteUrl(candidate, pageUrl));
      if (isUsefulImageUrl(absoluteUrl)) return absoluteUrl;
    }
  }

  // Then general candidates
  for (const candidate of imageCandidates) {
    let absoluteUrl = upgradeToHighResImageUrl(toAbsoluteUrl(candidate, pageUrl));
    if (isUsefulImageUrl(absoluteUrl)) {
      absoluteUrl = findBetterAspectCounterpart(absoluteUrl, html);
      return absoluteUrl;
    }
  }

  return "";
}

function extractRecipeFromHtml(html: string, url: string): ImportedRecipe {
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Imported recipe";

  const description =
    $("meta[property='og:description']").attr("content")?.trim() ||
    $("meta[name='description']").attr("content")?.trim() ||
    undefined;

  const image = extractBestHtmlImage(html, url);

  const ingredients: string[] = [];
  const instructions: string[] = [];

  $("li").each((_, li) => {
    const text = $(li).text().replace(/\s+/g, " ").trim();
    if (!text) return;

    if (
      /cup|cups|tbsp|tsp|gram|grams|kg|ml|l|ounce|oz|clove|cloves|salt|pepper|butter|oil|onion|garlic/i.test(
        text,
      )
    ) {
      const cleanIng = sanitizeCulinaryText(text);
      if (cleanIng) ingredients.push(cleanIng);
    }
  });

  $("ol li").each((_, li) => {
    const text = $(li).text().replace(/\s+/g, " ").trim();
    if (text) {
      const cleanStep = sanitizeCulinaryText(text);
      if (cleanStep) instructions.push(cleanStep);
    }
  });

  const ingredientGroups = parseIngredientGroups(ingredients, $);

  return {
    title,
    description,
    image,
    ingredients: Array.from(new Set(ingredients)).slice(0, 30),
    structuredIngredients: parseIngredientList(ingredients),
    ingredientGroups: ingredientGroups.length > 1 ? ingredientGroups : undefined,
    instructions: Array.from(new Set(instructions)).slice(0, 30),
    sourceUrl: url,
    sourceName: $("meta[property='og:site_name']").attr("content") || undefined,
  };
}

const RECIPE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    cookTime: { type: "INTEGER" },
    servings: { type: "INTEGER" },
    category: { type: "STRING" },
    mealType: { type: "STRING" },
    ingredients: { type: "ARRAY", items: { type: "STRING" } },
    instructions: { type: "ARRAY", items: { type: "STRING" } },
    tags: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "ingredients", "instructions"],
};

function normalizeCategory(cat?: string): RecipeCategory {
  if (!cat) return "main-course";
  const c = cat.toLowerCase();
  if (c.includes("pasta") || c.includes("noodle")) return "pasta";
  if (c.includes("rice") || c.includes("risotto")) return "rice";
  if (c.includes("salad")) return "salad";
  if (c.includes("soup") || c.includes("stew")) return "soup";
  if (c.includes("sandwich") || c.includes("burger") || c.includes("wrap")) return "sandwich";
  if (c.includes("bowl")) return "bowl";
  if (c.includes("stir-fry") || c.includes("wok")) return "stir-fry";
  if (c.includes("breakfast") || c.includes("brunch")) return "breakfast";
  if (c.includes("dessert") || c.includes("sweet") || c.includes("cake") || c.includes("cookie")) return "dessert";
  return "main-course";
}

function normalizeMealType(m?: string): MealType {
  if (!m) return "dinner";
  const l = m.toLowerCase();
  if (l.includes("breakfast")) return "breakfast";
  if (l.includes("lunch")) return "lunch";
  if (l.includes("snack")) return "snack";
  return "dinner";
}

async function callSingleGeminiModel(
  modelName: string,
  prompt: string,
  geminiKey: string,
  signal?: AbortSignal
): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
  const generationConfig: Record<string, any> = {
    responseMimeType: "application/json",
    responseSchema: RECIPE_RESPONSE_SCHEMA,
    temperature: 0.1,
    maxOutputTokens: 2000,
  };

  if (modelName.includes("3.6") || modelName.includes("latest") || modelName.includes("3.8")) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!response.ok) {
    throw new Error(`${modelName} returned HTTP ${response.status}`);
  }

  const result = await response.json();
  const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) throw new Error("No candidate content");
  return JSON.parse(jsonText);
}

async function extractRecipeFromTextWithAi(
  rawText: string,
  geminiKey: string,
  url = "",
  authorName = ""
): Promise<ImportedRecipe | null> {
  const prompt = `Convert this raw recipe text into a clean standardized recipe with ingredients, amounts, and step-by-step instructions:\n\n${rawText}`;
  
  // Parallel race: launch top fast models simultaneously. The first valid response wins and aborts the others!
  const candidateModels = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const parsed = await Promise.any(
      candidateModels.map(async (modelName) => {
        return await callSingleGeminiModel(modelName, prompt, geminiKey, controller.signal);
      })
    );

    clearTimeout(timeoutId);
    controller.abort();

    const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    return {
      title: parsed.title || "Untitled Recipe",
      description: parsed.description || "",
      image: "",
      cookTime: Number(parsed.cookTime) || 25,
      servings: Number(parsed.servings) || 4,
      category: normalizeCategory(parsed.category),
      mealType: normalizeMealType(parsed.mealType),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      ingredients,
      structuredIngredients: parseIngredientList(ingredients),
      instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
      sourceUrl: url,
      sourceName: authorName ? `@${authorName}` : url ? "Web Link" : "Pasted Notes",
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Parallel AI race failed:", err);
  }

  return null;
}

async function fetchRecipeImageFallback(title: string, originalUrl?: string): Promise<string> {
  // 1. Check Wayback Machine snapshot for the original page's high-res photo
  if (originalUrl) {
    try {
      const wbRes = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(originalUrl)}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (wbRes.ok) {
        const wbData = await wbRes.json();
        const snapUrl = wbData?.archived_snapshots?.closest?.url;
        if (snapUrl) {
          const rawUrl = snapUrl.replace(/\/web\/(\d+)\//, "/web/$1id_/");
          const snapRes = await fetch(rawUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            signal: AbortSignal.timeout(4500),
          });
          if (snapRes.ok) {
            const html = await snapRes.text();
            const ogMatch =
              html.match(/property="og:image"\s+content="([^"]+)"/i) ||
              html.match(/content="([^"]+)"\s+property="og:image"/i);
            if (ogMatch && ogMatch[1] && isUsefulImageUrl(ogMatch[1])) {
              const better = findBetterAspectCounterpart(ogMatch[1], html);
              return upgradeToHighResImageUrl(better);
            }

            // Fallback: look for 4x3 images in the HTML
            const fourByThreeMatch =
              html.match(/https:\/\/(?:www\.)?allrecipes\.com\/thmb\/[^\s"'<>]+\/1500x0\/[^\s"'<>]*4x3[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/i) ||
              html.match(/https?:\/\/[^\s"'<>]+4x3[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/i);
            if (fourByThreeMatch && fourByThreeMatch[0] && isUsefulImageUrl(fourByThreeMatch[0])) {
              return upgradeToHighResImageUrl(fourByThreeMatch[0]);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Wayback image lookup failed:", err);
    }
  }

  // 2. Spoonacular recipe image search
  const spoonKey = process.env.SPOONACULAR_API_KEY;
  if (spoonKey && title) {
    try {
      const cleanTitle = title
        .replace(/\b(with|and|&|easy|quick|best|classic)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const spoonRes = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(cleanTitle)}&number=1&apiKey=${spoonKey}`,
        { signal: AbortSignal.timeout(3500) },
      );
      if (spoonRes.ok) {
        const data = await spoonRes.json();
        const img = data.results?.[0]?.image;
        if (img) {
          return img.replace(/-\d+x\d+\.(jpg|jpeg|png)$/i, "-636x393.$1");
        }
      }
    } catch (err) {
      console.warn("Spoonacular image search failed:", err);
    }
  }

  // 3. Wikipedia / Wikimedia Commons food photography
  if (title) {
    try {
      const wikiQuery = title.split(" with ")[0].split(" and ")[0].trim();
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiQuery)}&prop=pageimages&format=json&pithumbsize=1000`,
        { signal: AbortSignal.timeout(3000) },
      );
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData.query?.pages;
        const firstPage: any = pages ? Object.values(pages)[0] : null;
        if (firstPage?.thumbnail?.source) {
          return firstPage.thumbnail.source;
        }
      }
    } catch (err) {
      console.warn("Wikipedia image lookup failed:", err);
    }
  }

  return "";
}

export async function POST(request: Request) {
  try {
    // Rate limit: max 20 recipe imports per minute per IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`import:${clientIp}`, 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many recipe import requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const targetUrl = typeof body?.url === "string" ? body.url.trim() : "";
    const rawText = typeof body?.text === "string" ? body.text.trim() : "";

    if (!targetUrl && !rawText) {
      return NextResponse.json(
        { error: "A web URL or recipe text is required for importing." },
        { status: 400 },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // DIRECT RAW TEXT / NOTES AI EXTRACTION
    if (rawText) {
      if (!geminiKey) {
        return NextResponse.json(
          { error: "AI service key is not configured for text extraction." },
          { status: 500 },
        );
      }

      const aiRecipe = await extractRecipeFromTextWithAi(rawText, geminiKey, targetUrl, "");
      if (!aiRecipe || !aiRecipe.ingredients || aiRecipe.ingredients.length === 0) {
        return NextResponse.json(
          { error: "Could not identify a recipe in the provided text. Please ensure it contains ingredients or cooking instructions." },
          { status: 422 },
        );
      }

      const normalized = normalizeRecipe({
        ...aiRecipe,
        origin: "imported",
      } as any);

      return NextResponse.json({
        success: true,
        recipe: normalized,
      });
    }

    // SSRF & URL VALIDATION
    const urlValidation = validatePublicRecipeUrl(targetUrl);
    if (!urlValidation.isValid) {
      return NextResponse.json(
        { error: urlValidation.error || "The provided URL is not allowed." },
        { status: 400 }
      );
    }
    const safeUrl = urlValidation.sanitizedUrl || targetUrl;

    // 1. TIKTOK SPECIALIZED HANDLER (oEmbed + AI Recipe Reconstruction)
    if (safeUrl.includes("tiktok.com")) {
      try {
        const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(safeUrl)}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          const caption = oembedData.title || "";
          const author = oembedData.author_name || "";

          if (geminiKey && caption) {
            const aiRecipe = await extractRecipeFromTextWithAi(caption, geminiKey, safeUrl, author);
            if (aiRecipe && aiRecipe.ingredients.length > 0) {
              const normalized = normalizeRecipe({
                ...aiRecipe,
                origin: "imported",
              } as any);
              return NextResponse.json({
                success: true,
                recipe: normalized,
              });
            }
          }
        }
      } catch (err) {
        console.error("TikTok oembed extraction error:", err);
      }
    }

    // 2. STANDARD WEB & RECIPE BLOG SCRAPING (With 10s strict timeout)
    let html = "";

    try {
      const response = await fetch(safeUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        next: { revalidate: 0 },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (
          contentType.includes("video/") ||
          contentType.includes("audio/") ||
          contentType.includes("application/octet-stream") ||
          contentType.includes("application/pdf")
        ) {
          return NextResponse.json(
            { error: "The provided URL points to a binary or media file, not a readable recipe web page." },
            { status: 422 }
          );
        }

        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > 8 * 1024 * 1024) {
          return NextResponse.json(
            { error: "The web page exceeds the maximum allowed size (8 MB)." },
            { status: 413 }
          );
        }

        html = await response.text();
      } else {
        console.warn(`Standard fetch returned HTTP ${response.status} (${response.statusText}). Trying resilient curl fallback...`);
      }
    } catch (fetchErr) {
      console.warn("Standard fetch failed, attempting resilient curl fallback:", fetchErr);
    }

    // 3. RESILIENT FALLBACK: If blocked by Cloudflare / anti-bot (e.g. 402/403 on Allrecipes, Dotdash Meredith)
    if (!html || html.length < 500) {
      const curlHtml = await fetchWithCurl(safeUrl);
      if (curlHtml && curlHtml.length >= 500) {
        html = curlHtml;
      }
    }

    // 4. If all automated HTTP attempts failed to retrieve page HTML
    if (!html) {
      if (geminiKey) {
        try {
          const parsedUrl = new URL(safeUrl);
          const slug = parsedUrl.pathname.split("/").filter(Boolean).pop()?.replace(/[-_]/g, " ") || "";
          const hostname = parsedUrl.hostname.replace(/^www\./, "");

          if (slug.length >= 3) {
            const rescuePrompt = `A user attempted to import a recipe from "${safeUrl}" (${hostname}), but the site blocked automated fetch requests.
Based on the recipe title from the URL: "${slug}", reconstruct the full authentic recipe with complete ingredients with measurements, step-by-step instructions, prep and cook times, servings, and category.`;

            const aiRecipe = await extractRecipeFromTextWithAi(rescuePrompt, geminiKey, safeUrl, hostname);
            if (aiRecipe && aiRecipe.ingredients.length > 0) {
              if (!aiRecipe.image) {
                aiRecipe.image = await fetchRecipeImageFallback(aiRecipe.title, safeUrl);
              }
              const normalized = normalizeRecipe({
                ...aiRecipe,
                origin: "imported",
              } as any);
              return NextResponse.json({
                success: true,
                recipe: normalized,
              });
            }
          }
        } catch (rescueErr) {
          console.error("AI rescue for blocked URL failed:", rescueErr);
        }
      }

      return NextResponse.json(
        {
          error: "This website blocks automated recipe importing with an anti-bot paywall. You can easily import it by copying the recipe text into the 'Paste Text / Notes' tab above!",
        },
        { status: 502 },
      );
    }

    let imported = extractRecipeFromJsonLd(html, targetUrl);

    if (!imported) {
      imported = extractRecipeFromHtml(html, targetUrl);
    }

    // If standard extraction yielded few or no ingredients and we have Gemini, perform AI rescue
    if ((!imported || !imported.ingredients || imported.ingredients.length === 0) && geminiKey) {
      const $ = cheerio.load(html);
      const pageTitle = $("title").text().trim();
      const pageMeta = $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "";
      const bodySnippet = $("body").text().replace(/\s+/g, " ").slice(0, 4000);

      const aiFallback = await extractRecipeFromTextWithAi(
        `${pageTitle}\n${pageMeta}\n${bodySnippet}`,
        geminiKey,
        targetUrl,
        ""
      );

      if (aiFallback && aiFallback.ingredients.length > 0) {
        imported = aiFallback;
      }
    }

    if (!imported) {
      return NextResponse.json(
        { error: "Failed to extract recipe from this web page. Please check the URL or paste the recipe text." },
        { status: 422 },
      );
    }

    if (imported && !imported.image) {
      imported.image = await fetchRecipeImageFallback(imported.title, targetUrl);
    }

    const normalized = normalizeRecipe({
      ...imported,
      origin: "imported",
    } as any);

    return NextResponse.json({
      success: true,
      recipe: {
        ...normalized,
        description: imported.description || normalized.description,
        servingsText: imported.servingsText,
        ingredientGroups: imported.ingredientGroups,
        nutrition: imported.nutrition || normalized.nutrition,
      },
    });
  } catch (err: any) {
    console.error("Import API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process recipe import." },
      { status: 500 },
    );
  }
}