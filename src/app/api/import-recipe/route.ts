import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { ImportedRecipe } from "../../../lib/types";
import { importRecipeFromUrl } from "../../../lib/recipeApi";
import { normalizeRecipe } from "../../../lib/recipeNormalizer";


type JsonLdNode = {
   "@type"?: string | string[];
   "@graph"?: JsonLdNode[];
   name?: string;
   image?:
   | string
   | string[]
   | { url?: string; contentUrl?: string; thumbnailUrl?: string }
   | Array<{ url?: string; contentUrl?: string; thumbnailUrl?: string }>;
   recipeIngredient?: string[];
   recipeInstructions?:
   | string[]
   | string
   | Array<{ text?: string; name?: string; itemListElement?: Array<{ text?: string; name?: string }> }>;
   totalTime?: string;
   prepTime?: string;
   recipeYield?: string | number;
   author?: { name?: string } | Array<{ name?: string }>;
   publisher?: { name?: string };
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

function extractImage(image: JsonLdNode["image"]): string {
   if (!image) return "";

   if (typeof image === "string") return image;

   if (Array.isArray(image)) {
      const first = image[0];
      if (!first) return "";

      if (typeof first === "string") return first;

      return first.url ?? first.contentUrl ?? first.thumbnailUrl ?? "";
   }

   return image.url ?? image.contentUrl ?? image.thumbnailUrl ?? "";
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

function extractNutrition(nutrition?: JsonLdNode["nutrition"]) {
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
            ? recipeNode.recipeIngredient.map((item) => item.trim()).filter(Boolean)
            : [];

         const instructions = extractInstructions(recipeNode.recipeInstructions);
         const image = toAbsoluteUrl(extractImage(recipeNode.image), url);
         const cookTime =
            parseIsoDurationToMinutes(recipeNode.totalTime) ??
            parseIsoDurationToMinutes(recipeNode.prepTime);

         return {
            title: recipeNode.name?.trim() || "Imported recipe",
            image: image || extractBestHtmlImage(html, url),
            cookTime,
            servings:
               typeof recipeNode.recipeYield === "number"
                  ? recipeNode.recipeYield
                  : undefined,
            ingredients,
            instructions,
            sourceUrl: url,
            sourceName: recipeNode.publisher?.name || undefined,
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
      const absoluteUrl = toAbsoluteUrl(candidate, pageUrl);
      if (isUsefulImageUrl(absoluteUrl)) return absoluteUrl;
   }

   const normalizedHtml = html
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&")
      .replace(/%3A/g, ":")
      .replace(/%2F/g, "/")
      .replace(/%28/g, "(")
      .replace(/%29/g, ")");

   const imageMatches =
      normalizedHtml.match(
         /https?:\/\/[^"'<>\\\s]+(?:jpg|jpeg|png|webp)[^"'<>\\\s]*/gi,
      ) ?? [];

   const preferredMatch = imageMatches.find((candidate) => {
      const absoluteUrl = toAbsoluteUrl(candidate, pageUrl);
      return (
         isUsefulImageUrl(absoluteUrl) &&
         absoluteUrl.toLowerCase().includes("allrecipes.com/thmb")
      );
   });

   if (preferredMatch) {
      return toAbsoluteUrl(preferredMatch, pageUrl);
   }

   for (const candidate of imageMatches) {
      const absoluteUrl = toAbsoluteUrl(candidate, pageUrl);
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
      const absoluteUrl = toAbsoluteUrl(candidate, pageUrl);
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
         ingredients.push(text);
      }
   });

   $("ol li").each((_, li) => {
      const text = $(li).text().replace(/\s+/g, " ").trim();
      if (text) instructions.push(text);
   });

   return {
      title,
      image,
      ingredients: Array.from(new Set(ingredients)).slice(0, 30),
      instructions: Array.from(new Set(instructions)).slice(0, 30),
      sourceUrl: url,
   };
}

export async function POST(request: Request) {
   try {
      const body = (await request.json()) as { url?: string };
      const url = body.url?.trim();

      if (!url) {
         return NextResponse.json(
            { error: "URL is required." },
            { status: 400 },
         );
      }

      let parsedUrl: URL;

      try {
         parsedUrl = new URL(url);
      } catch {
         return NextResponse.json(
            { error: "Invalid URL." },
            { status: 400 },
         );
      }

      try {
         const spoonacularRecipe = await importRecipeFromUrl(parsedUrl.toString());

         const response = await fetch(parsedUrl.toString(), {
            headers: {
               "User-Agent":
                  "Mozilla/5.0 RecipeCollectorBot/1.0 (+https://example.local)",
               Accept: "text/html,application/xhtml+xml",
            },
            redirect: "follow",
         });

         if (!response.ok) {
            return NextResponse.json({
               recipe: spoonacularRecipe,
               source: "spoonacular",
            });
         }

         const html = await response.text();

         const htmlRecipe =
            extractRecipeFromJsonLd(html, parsedUrl.toString()) ??
            extractRecipeFromHtml(html, parsedUrl.toString());

         const recipe = normalizeRecipe({
            ...spoonacularRecipe,
            image: htmlRecipe.image || spoonacularRecipe.image,
            nutrition: spoonacularRecipe.nutrition ?? htmlRecipe.nutrition,
            calories:
               spoonacularRecipe.calories ??
               spoonacularRecipe.nutrition?.calories ??
               htmlRecipe.nutrition?.calories,
            sourceUrl: spoonacularRecipe.sourceUrl ?? htmlRecipe.sourceUrl,
            sourceName: spoonacularRecipe.sourceName ?? htmlRecipe.sourceName,
            origin: "imported",
         });

         return NextResponse.json({
            recipe,
            source: "spoonacular + html-enhanced",
         });
      } catch (spoonacularError) {
         console.warn(
            "Spoonacular import failed, using HTML fallback:",
            spoonacularError,
         );
      }

      const response = await fetch(parsedUrl.toString(), {
         headers: {
            "User-Agent":
               "Mozilla/5.0 RecipeCollectorBot/1.0 (+https://example.local)",
            Accept: "text/html,application/xhtml+xml",
         },
         redirect: "follow",
      });

      if (!response.ok) {
         return NextResponse.json(
            { error: `Failed to fetch recipe page (${response.status}).` },
            { status: 400 },
         );
      }

      const html = await response.text();

      const extractedRecipe =
         extractRecipeFromJsonLd(html, parsedUrl.toString()) ??
         extractRecipeFromHtml(html, parsedUrl.toString());

      if (!extractedRecipe.ingredients.length && !extractedRecipe.instructions.length) {
         return NextResponse.json(
            {
               error: "Could not extract enough recipe data from this page.",
            },
            { status: 422 },
         );
      }

      const recipe = normalizeRecipe({
         ...extractedRecipe,
         calories: extractedRecipe.nutrition?.calories,
         origin: "imported",
      });

      return NextResponse.json({
         recipe,
         source: "html-fallback",
      });
   } catch (error) {
      console.error("Recipe import failed:", error);

      return NextResponse.json(
         { error: "Something went wrong while importing the recipe." },
         { status: 500 },
      );
   }
}