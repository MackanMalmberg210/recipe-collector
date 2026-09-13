import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "../../../lib/security/rateLimiter";

export const runtime = "nodejs";
export const maxDuration = 45;

const TRANSLATION_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    description: { type: "STRING" },
    ingredients: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    instructions: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    originalLanguage: { type: "STRING" },
  },
  required: ["title", "ingredients", "instructions"],
};

async function callSingleGeminiModel(
  modelName: string,
  prompt: string,
  geminiKey: string,
  signal?: AbortSignal
): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
  const generationConfig: Record<string, any> = {
    responseMimeType: "application/json",
    responseSchema: TRANSLATION_RESPONSE_SCHEMA,
    temperature: 0.1,
    maxOutputTokens: 2500,
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

export async function POST(req: Request) {
  try {
    // Rate limit: max 10 recipe translations per minute per IP
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`translate:${clientIp}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many translation requests. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { title, description, ingredients, instructions } = body as {
      title?: string;
      description?: string;
      ingredients?: string[];
      instructions?: string[];
    };

    if (!title && (!ingredients || ingredients.length === 0)) {
      return NextResponse.json(
        { error: "Recipe title and ingredients are required for translation." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "AI service key is not configured." },
        { status: 500 }
      );
    }

    const prompt = `You are an expert master chef and culinary translator.
Translate the following recipe into clean, appetising, modern English suitable for a worldwide culinary community.

Guidelines:
1. Translate the Title into a natural, attractive English culinary recipe title (e.g. "Köttbullar med potatismos" -> "Swedish Meatballs with Creamy Mashed Potatoes", "Kladdkaka" -> "Swedish Kladdkaka (Sticky Chocolate Cake)").
2. Translate all Ingredients accurately into English. Preserve quantities and metric/US units (e.g., "500 g nötfärs" -> "500 g ground beef", "2 dl grädde" -> "2 dl heavy cream", "1 msk" -> "1 tbsp", "1 tsk" -> "1 tsp", "1 krm" -> "1 pinch / 1/4 tsp").
3. Translate all cooking Instructions into clear, step-by-step imperative English (e.g., "1. Hetta upp smöret i en stekpanna" -> "Heat the butter in a large skillet over medium heat").
4. Fix any typos, colloquialisms, or missing spaces from user input (e.g., "kyckling fillé" -> "chicken fillet", "me smör" -> "with butter", "stek panna" -> "skillet").
5. Cleanly normalize fractions (e.g., "½" -> "1/2", "¼" -> "1/4", "¾" -> "3/4", "1 1/2").
6. When oven temperatures are specified, include both Celsius and Fahrenheit (e.g., "175°C (350°F)", "200°C (400°F)").
7. If a description is provided, translate it gracefully into English.
8. Do NOT include extraneous markdown; return only the structured JSON.

Recipe to translate:
Title: ${title || "Untitled"}
Description: ${description || ""}
Ingredients:
${(ingredients || []).map((ing, i) => `${i + 1}. ${ing}`).join("\n")}

Instructions:
${(instructions || []).map((ins, i) => `${i + 1}. ${ins}`).join("\n")}
`;

    const candidateModels = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const parsed = await Promise.any(
        candidateModels.map((modelName) =>
          callSingleGeminiModel(modelName, prompt, geminiKey, controller.signal)
        )
      );

      clearTimeout(timeoutId);
      controller.abort();

      return NextResponse.json({
        success: true,
        translated: {
          title: parsed.title || title,
          description: parsed.description || description || "",
          ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : ingredients,
          instructions: Array.isArray(parsed.instructions) ? parsed.instructions : instructions,
          originalLanguage: parsed.originalLanguage || "unknown",
        },
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Translation AI error:", err);
      return NextResponse.json(
        { error: "Failed to translate recipe. Please check your connection and try again." },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Translation route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
