import { NextResponse } from "next/server";
import { parseIngredientList } from "../../../lib/ingredientParser";
import { checkRateLimit, getClientIp } from "../../../lib/security/rateLimiter";

export const runtime = "nodejs";
export const maxDuration = 60;

type ScanMode = "recipe" | "grocery" | "meal_analyzer";

async function callSingleVisionModel(
  modelName: string,
  systemPrompt: string,
  jsonSchemaPrompt: string,
  mimeType: string,
  base64Data: string,
  geminiKey: string,
  signal?: AbortSignal
): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nRequired JSON Format:\n${jsonSchemaPrompt}`,
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `${modelName} returned HTTP ${response.status}`);
  }

  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error(`${modelName} returned no candidate text`);
  }

  let cleanedJson = rawText.trim();
  if (cleanedJson.startsWith("```")) {
    cleanedJson = cleanedJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }
  const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedJson = jsonMatch[0];
  }

  return JSON.parse(cleanedJson);
}

export async function POST(req: Request) {
  try {
    // Rate limit: max 15 vision scans per minute per IP
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`vision:${clientIp}`, 15, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many vision scan requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { image, mode = "recipe", userNotes } = body as {
      image: string;
      mode?: ScanMode;
      userNotes?: string;
    };

    if (!image) {
      return NextResponse.json(
        { error: "No image provided. Please capture or upload a photo." },
        { status: 400 },
      );
    }

    // Limit maximum base64 image payload to 12 MB
    if (typeof image === "string" && image.length > 12 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image file is too large. Please upload an image under 10 MB." },
        { status: 413 },
      );
    }

    // Extract base64 and mime type
    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        {
          error:
            "Google Gemini API Key is missing. To perform live handwriting OCR and recipe vision scanning, please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    let jsonSchemaPrompt = "";

    if (mode === "recipe") {
      systemPrompt = `You are an expert culinary OCR and vision assistant. Analyze this photo of a cookbook page, recipe card, printout, digital recipe screenshot, or handwritten recipe with utmost precision.
The text can be in Swedish, English, or any language, and may be oriented horizontally or vertically.

CRITICAL QUALITY & VALIDATION CHECKS:
1. First, check if the photo depicts a readable recipe, cookbook page, recipe card, food preparation guide, or cooking instructions.
2. If the photo is NOT a recipe (e.g. it is a photo of a person, vehicle, landscape, clothing, electronic gadget, animal, non-culinary object, completely blank, or too blurry/dark/unreadable to decipher ingredients or steps):
   - Set "isValidRecipe": false
   - Set "rejectionReason" to a friendly, clear explanation (e.g. "This photo does not appear to contain a readable recipe or cookbook page. Please upload a clear photo of recipe text or ingredients." or "The text in this photo is too blurry or low-light to read reliably. Please retake with brighter lighting.")
   - Set other fields to default empty values.
3. If the photo IS a valid recipe:
   - Set "isValidRecipe": true
   - Set "rejectionReason": ""
   - Extract:
     - Recipe title (keep in the original language of the recipe)
     - A brief appetizing description
     - Estimated total cook time in minutes (number)
     - Number of servings (number)
     - Category (e.g. pasta, main-course, salad, soup, bowl, breakfast, dessert, baking)
     - Complete list of ingredients with amounts and units (e.g. "500g köttfärs", "2 msk olivolja")
     - Step-by-step instructions in logical order.
${userNotes ? `User instructions/notes: "${userNotes}"` : ""}
Return ONLY a valid JSON object matching the requested schema.`;

      jsonSchemaPrompt = `{
  "isValidRecipe": true,
  "rejectionReason": "",
  "title": "string",
  "description": "string",
  "cookTime": 30,
  "servings": 4,
  "category": "main-course",
  "ingredients": ["string with amount and unit"],
  "instructions": ["step 1 text", "step 2 text"]
}`;
    } else if (mode === "grocery") {
      systemPrompt = `You are a high-precision handwriting and OCR scanner for shopping lists. Analyze this photo of a handwritten paper note, fridge list, whiteboard note, or shopping list.
The list may be in Swedish or English.

CRITICAL QUALITY & VALIDATION CHECKS:
1. First, check if the photo contains a handwritten or printed shopping list, grocery items, or ingredients to buy.
2. If the photo is NOT a shopping list or grocery note (e.g. a landscape, animal, face, non-text object, random non-shopping document, or illegible blur):
   - Set "isValidList": false
   - Set "rejectionReason" to a friendly, clear explanation (e.g. "No shopping list or grocery items detected in this image. Please provide a clear photo of your handwritten shopping note or fridge list.")
   - Set items to empty array.
3. If the photo IS a valid shopping list:
   - Set "isValidList": true
   - Set "rejectionReason": ""
   - Extract all grocery items written on the note (including any items written at the top, margins, or crossed out) and categorize each item into Produce, Dairy, Meat, Bakery, Beverages, Pantry, or Other.
${userNotes ? `User instructions/notes: "${userNotes}"` : ""}
Return ONLY a valid JSON object matching the requested schema.`;

      jsonSchemaPrompt = `{
  "isValidList": true,
  "rejectionReason": "",
  "title": "Scanned Grocery List",
  "items": [
    { "name": "Item name with quantity", "category": "Produce" }
  ]
}`;
    } else if (mode === "meal_analyzer") {
      systemPrompt = `You are a master executive chef and nutritional AI analyst ("Snap My Plate"). Analyze this photo of a plated meal or dish.

CRITICAL QUALITY & VALIDATION CHECKS:
1. First, check if the photo depicts actual edible food, prepared dishes, restaurant plates, or culinary ingredients.
2. If the photo does NOT contain edible food (e.g. it is a photo of electronics, furniture, clothing, pets, vehicles, shoes, non-edible objects, people without food, or is completely dark/blurry):
   - Set "isEdibleFood": false
   - Set "rejectionReason" to a friendly, clear explanation (e.g. "No edible food or plated dish detected in this photo. Please snap a photo of a cooked meal, plate, or dish to analyze macros and get a reverse recipe.")
   - Set other fields to default empty values.
3. If the photo DOES contain edible food or a plated dish:
   - Set "isEdibleFood": true
   - Set "rejectionReason": ""
   - Identify the exact dish name and provide an appetizing culinary description.
   - Estimate the nutritional content (calories in kcal, protein, carbs, and fat in grams).
   - List the visible and likely ingredients.
   - Create a full "Reverse Recipe" so the user can easily cook this delicious meal at home from scratch, including realistic prep/cook time, servings, exact ingredient quantities, and step-by-step cooking instructions.
${userNotes ? `User dietary requests/tweaks: "${userNotes}"` : ""}
Return ONLY a valid JSON object matching the requested schema.`;

      jsonSchemaPrompt = `{
  "isEdibleFood": true,
  "rejectionReason": "",
  "dishName": "string",
  "description": "string",
  "nutrition": {
    "calories": 550,
    "proteinGrams": 35,
    "carbsGrams": 45,
    "fatGrams": 22
  },
  "detectedIngredients": ["string", "string"],
  "reverseRecipe": {
    "title": "string",
    "cookTime": 25,
    "servings": 2,
    "category": "main-course",
    "ingredients": ["1 tbsp olive oil", "200g salmon fillet"],
    "instructions": ["Step 1...", "Step 2..."]
  }
}`;
    }

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let parsedData: any = null;

    try {
      parsedData = await Promise.any(
        candidateModels.map((modelName) =>
          callSingleVisionModel(
            modelName,
            systemPrompt,
            jsonSchemaPrompt,
            mimeType,
            base64Data,
            geminiKey,
            controller.signal
          )
        )
      );
      clearTimeout(timeoutId);
      controller.abort();
    } catch {
      clearTimeout(timeoutId);
      // Fallback single attempt to gemini-flash-latest
      try {
        parsedData = await callSingleVisionModel(
          "gemini-flash-latest",
          systemPrompt,
          jsonSchemaPrompt,
          mimeType,
          base64Data,
          geminiKey
        );
      } catch (fallbackErr: any) {
        return NextResponse.json(
          {
            error: `Failed to analyze image with Gemini AI: ${fallbackErr?.message || "All models failed or timed out."}`,
          },
          { status: 500 }
        );
      }
    }

    if (mode === "recipe") {
      if (parsedData.isValidRecipe === false) {
        return NextResponse.json(
          {
            error:
              parsedData.rejectionReason ||
              "The uploaded photo does not appear to contain a readable recipe or cookbook page. Please upload a clear photo of recipe text or ingredients.",
          },
          { status: 422 }
        );
      }

      const ingredients = Array.isArray(parsedData.ingredients)
        ? parsedData.ingredients
        : [];
      const instructions = Array.isArray(parsedData.instructions)
        ? parsedData.instructions
        : [];

      if (ingredients.length === 0 && instructions.length === 0) {
        return NextResponse.json(
          {
            error:
              "Could not clearly extract ingredients or cooking steps from this photo. Please retake the photo with better lighting or lay the recipe page flat.",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        mode: "recipe",
        recipe: {
          id: Date.now(),
          title: parsedData.title || "Scanned Recipe",
          description: parsedData.description || "",
          cookTime: Number(parsedData.cookTime) || 30,
          servings: Number(parsedData.servings) || 4,
          category: parsedData.category || "main-course",
          ingredients,
          structuredIngredients: parseIngredientList(ingredients),
          instructions,
          origin: "imported",
        },
        source: "Gemini Vision AI",
      });
    }

    if (mode === "grocery") {
      if (parsedData.isValidList === false) {
        return NextResponse.json(
          {
            error:
              parsedData.rejectionReason ||
              "No shopping list or grocery items detected in this image. Please upload a clear photo of your handwritten shopping note or fridge list.",
          },
          { status: 422 }
        );
      }

      const items = Array.isArray(parsedData.items) ? parsedData.items : [];
      if (items.length === 0) {
        return NextResponse.json(
          {
            error:
              "Could not read any grocery items from this note. Please ensure handwriting is legible and well-lit.",
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        mode: "grocery",
        title: parsedData.title || "Scanned Grocery List",
        items,
        source: "Gemini Vision AI",
      });
    }

    // meal_analyzer
    if (parsedData.isEdibleFood === false) {
      return NextResponse.json(
        {
          error:
            parsedData.rejectionReason ||
            "No edible food or plated meal detected in this photo. Please snap a photo of a cooked dish, plate, or food item to analyze nutrition and generate a recipe.",
        },
        { status: 422 }
      );
    }

    const reverseRecipe = parsedData.reverseRecipe || {};
    const ingredients = Array.isArray(reverseRecipe.ingredients)
      ? reverseRecipe.ingredients
      : [];
    const instructions = Array.isArray(reverseRecipe.instructions)
      ? reverseRecipe.instructions
      : [];

    const unifiedRecipe = {
      id: Date.now(),
      title: reverseRecipe.title || parsedData.dishName || "Home-Cooked Dish",
      description: parsedData.description || "",
      cookTime: Number(reverseRecipe.cookTime) || 25,
      servings: Number(reverseRecipe.servings) || 2,
      category: reverseRecipe.category || "main-course",
      ingredients,
      structuredIngredients: parseIngredientList(ingredients),
      instructions,
      origin: "imported",
    };

    return NextResponse.json({
      mode: "meal_analyzer",
      dishName: parsedData.dishName || "Analyzed Meal",
      description: parsedData.description || "",
      nutrition: parsedData.nutrition || {
        calories: 500,
        proteinGrams: 30,
        carbsGrams: 40,
        fatGrams: 20,
      },
      detectedIngredients: Array.isArray(parsedData.detectedIngredients)
        ? parsedData.detectedIngredients
        : [],
      recipe: unifiedRecipe,
      reverseRecipe: unifiedRecipe,
      source: "Gemini Vision AI",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process image." },
      { status: 500 }
    );
  }
}
