import { NextResponse } from "next/server";
import { parseIngredientList } from "../../../lib/ingredientParser";

export const runtime = "nodejs";
export const maxDuration = 60;

type ScanMode = "recipe" | "grocery" | "meal_analyzer";

export async function POST(req: Request) {
  try {
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
      systemPrompt = `You are an expert culinary OCR and vision assistant. Analyze this photo of a cookbook page, recipe card, printout, or handwritten recipe with utmost precision.
The text can be in Swedish, English, or any language, and may be oriented horizontally or vertically.
Extract:
1. Recipe title (keep in the original language of the recipe)
2. A brief appetizing description
3. Estimated total cook time in minutes (number)
4. Number of servings (number)
5. Category (e.g. pasta, main-course, salad, soup, bowl, breakfast, dessert, baking)
6. Complete list of ingredients with amounts and units (e.g. "500g köttfärs", "2 msk olivolja")
7. Step-by-step instructions in logical order.
${userNotes ? `User instructions/notes: "${userNotes}"` : ""}
Return ONLY a valid JSON object matching the requested schema.`;

      jsonSchemaPrompt = `{
  "title": "string",
  "description": "string",
  "cookTime": 30,
  "servings": 4,
  "category": "main-course",
  "ingredients": ["string with amount and unit"],
  "instructions": ["step 1 text", "step 2 text"]
}`;
    } else if (mode === "grocery") {
      systemPrompt = `You are a high-precision handwriting and OCR scanner for grocery lists. Analyze this photo of a handwritten paper note, receipt, or whiteboard list.
The list may be in Swedish or English.
Extract all grocery items written on the note (including any items written at the top, margins, or crossed out) and categorize each item into Produce, Dairy, Meat, Bakery, Beverages, Pantry, or Other.
${userNotes ? `User instructions/notes: "${userNotes}"` : ""}
Return ONLY a valid JSON object matching the requested schema.`;

      jsonSchemaPrompt = `{
  "title": "Scanned Grocery List",
  "items": [
    { "name": "Item name with quantity", "category": "Produce" }
  ]
}`;
    } else if (mode === "meal_analyzer") {
      systemPrompt = `You are a master executive chef and nutritional AI analyst ("Snap My Plate"). Analyze this photo of a plated meal or dish.
1. Identify the exact dish name and provide an appetizing culinary description.
2. Estimate the nutritional content (calories in kcal, protein, carbs, and fat in grams).
3. List the visible and likely ingredients.
4. Create a full "Reverse Recipe" so the user can easily cook this delicious meal at home from scratch, including realistic prep/cook time, servings, exact ingredient quantities, and step-by-step cooking instructions.
${userNotes ? `User dietary requests/tweaks: "${userNotes}"` : ""}
Return ONLY a valid JSON object matching the requested schema.`;

      jsonSchemaPrompt = `{
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

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
    let result: any = null;
    let lastError: string | null = null;

    for (const modelName of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
            },
          }),
        });

        if (response.ok) {
          result = await response.json();
          if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
            break;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData?.error?.message || `HTTP ${response.status}`;
        }
      } catch (err: any) {
        lastError = err?.message;
      }
    }

    if (!result || !result.candidates?.[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json(
        {
          error: `Failed to analyze image with Gemini AI: ${lastError || "No text candidates returned."}`,
        },
        { status: 500 }
      );
    }

    const rawText = result.candidates[0].content.parts[0].text.trim();
    let cleanedJson = rawText;
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedJson = jsonMatch[0];
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanedJson);
    } catch (parseErr: any) {
      return NextResponse.json(
        {
          error: `Invalid response format from AI Vision model: ${parseErr.message}`,
        },
        { status: 500 }
      );
    }

    if (mode === "recipe") {
      const ingredients = Array.isArray(parsedData.ingredients)
        ? parsedData.ingredients
        : [];
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
          instructions: Array.isArray(parsedData.instructions)
            ? parsedData.instructions
            : [],
          origin: "imported",
        },
        source: "Gemini Vision AI",
      });
    }

    if (mode === "grocery") {
      const items = Array.isArray(parsedData.items) ? parsedData.items : [];
      return NextResponse.json({
        mode: "grocery",
        title: parsedData.title || "Scanned Grocery List",
        items,
        source: "Gemini Vision AI",
      });
    }

    // meal_analyzer
    const reverseRecipe = parsedData.reverseRecipe || {};
    const ingredients = Array.isArray(reverseRecipe.ingredients)
      ? reverseRecipe.ingredients
      : [];

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
      reverseRecipe: {
        id: Date.now(),
        title: reverseRecipe.title || parsedData.dishName || "Home-Cooked Dish",
        description: parsedData.description || "",
        cookTime: Number(reverseRecipe.cookTime) || 25,
        servings: Number(reverseRecipe.servings) || 2,
        category: reverseRecipe.category || "main-course",
        ingredients,
        structuredIngredients: parseIngredientList(ingredients),
        instructions: Array.isArray(reverseRecipe.instructions)
          ? reverseRecipe.instructions
          : [],
        origin: "imported",
      },
      source: "Gemini Vision AI",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process image." },
      { status: 500 }
    );
  }
}
