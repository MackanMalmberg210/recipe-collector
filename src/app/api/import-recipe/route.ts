import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { ImportedRecipe, IngredientGroup, NutritionInfo } from "../../../lib/types";
import { normalizeRecipe } from "../../../lib/recipeNormalizer";
import { parseIngredientList } from "../../../lib/ingredientParser";
import { sanitizeCulinaryText } from "../../../lib/culinaryTextSanitizer";

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

  return upgraded;
}

function extractImage(image: JsonLdNode["image"]): string {
  if (!image) return "";

  if (typeof image === "string") {
    return upgradeToHighResImageUrl(image);
  }

  if (Array.isArray(image)) {
    // In Schema.org, 16x9 (or highest aspect ratio/dimension) is usually at the end of the array or largest
    const candidates = image.map((item) => {
      if (typeof item === "string") return item;
      return item.url ?? item.contentUrl ?? item.thumbnailUrl ?? "";
    }).filter(Boolean);

    // Prefer images that don't have downscale parameters, or mention 16x9, 1200, large
    const highRes = candidates.find((url) => !/[?&](?:fit|resize|w)=\d+/i.test(url) && !/-\d+x\d+\./.test(url)) || candidates[candidates.length - 1] || candidates[0];
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
      if (ogImage) {
        const upgradedOg = upgradeToHighResImageUrl(toAbsoluteUrl(ogImage, url));
        if (!image || isUsefulImageUrl(upgradedOg)) {
          image = upgradedOg;
        }
      }
      if (!image) {
        image = extractBestHtmlImage(html, url);
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
        sourceName: recipeNode.publisher?.name || authorName || undefined,
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
    const absoluteUrl = upgradeToHighResImageUrl(toAbsoluteUrl(candidate, pageUrl));
    if (isUsefulImageUrl(absoluteUrl)) return absoluteUrl;
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

  for (const candidate of imageCandidates) {
    const absoluteUrl = upgradeToHighResImageUrl(toAbsoluteUrl(candidate, pageUrl));
    if (isUsefulImageUrl(absoluteUrl)) return absoluteUrl;
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

async function extractSocialMediaRecipeWithAi(
  url: string,
  rawText: string,
  imageUrl: string,
  authorName: string,
  geminiKey: string
): Promise<ImportedRecipe | null> {
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
  const prompt = `You are an expert culinary AI. Analyze this cooking video post / caption / transcript from TikTok or Instagram.
Post content:
"${rawText}"

Extract and reconstruct the full recipe:
1. title: appetizing name of the dish
2. description: brief 1-2 sentence culinary summary
3. cookTime: estimated total time in minutes (number)
4. servings: number of servings (number)
5. category: recipe category (e.g. pasta, dinner, dessert, breakfast, salad, soup, snack)
6. ingredients: complete list of ingredients with amounts and units
7. instructions: clear step-by-step cooking steps in order

Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "description": "string",
  "cookTime": 25,
  "servings": 4,
  "category": "main-course",
  "ingredients": ["1 tbsp olive oil", "2 cloves garlic"],
  "instructions": ["Step 1...", "Step 2..."]
}`;

  for (const modelName of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          let cleaned = jsonText.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
          }
          const parsed = JSON.parse(cleaned);
          const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
          return {
            title: parsed.title || "TikTok Recipe",
            description: parsed.description || "",
            image: imageUrl || "",
            cookTime: Number(parsed.cookTime) || 25,
            servings: Number(parsed.servings) || 4,
            ingredients,
            structuredIngredients: parseIngredientList(ingredients),
            instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
            sourceUrl: url,
            sourceName: authorName ? `@${authorName} (TikTok)` : "TikTok",
          };
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!targetUrl) {
      return NextResponse.json(
        { error: "URL is required for importing a recipe." },
        { status: 400 },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. TIKTOK SPECIALIZED HANDLER (oEmbed + AI Recipe Reconstruction)
    if (targetUrl.includes("tiktok.com")) {
      try {
        const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          const caption = oembedData.title || "";
          const author = oembedData.author_name || "";
          const thumbnail = oembedData.thumbnail_url || "";

          if (geminiKey && caption) {
            const aiRecipe = await extractSocialMediaRecipeWithAi(targetUrl, caption, thumbnail, author, geminiKey);
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

    // 2. STANDARD WEB & RECIPE BLOG SCRAPING
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch recipe from URL: ${response.statusText}` },
        { status: 502 },
      );
    }

    const html = await response.text();
    let imported = extractRecipeFromJsonLd(html, targetUrl);

    if (!imported) {
      imported = extractRecipeFromHtml(html, targetUrl);
    }

    // If standard extraction yielded few or no ingredients and we have Gemini, perform AI rescue
    if ((!imported.ingredients || imported.ingredients.length === 0) && geminiKey) {
      const $ = cheerio.load(html);
      const pageTitle = $("title").text().trim();
      const pageMeta = $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "";
      const bodySnippet = $("body").text().replace(/\s+/g, " ").slice(0, 4000);
      const mainImage = extractBestHtmlImage(html, targetUrl);

      const aiFallback = await extractSocialMediaRecipeWithAi(
        targetUrl,
        `${pageTitle}\n${pageMeta}\n${bodySnippet}`,
        mainImage,
        "",
        geminiKey
      );

      if (aiFallback && aiFallback.ingredients.length > 0) {
        imported = aiFallback;
      }
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