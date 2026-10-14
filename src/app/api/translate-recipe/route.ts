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

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    let userId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ") && SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const token = authHeader.substring(7).trim();
        const client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false },
        });
        const { data } = await client.auth.getUser(token);
        if (data?.user) {
          userId = data.user.id;
        }
      } catch {}
    }

    const rateLimitKey = userId ? `translate:user:${userId}` : `translate:anon:${clientIp}`;
    const limit = userId ? 20 : 5;
    const windowMs = 5 * 60 * 1000;
    const rateLimit = checkRateLimit(rateLimitKey, limit, windowMs);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: userId
            ? `Translation limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds.`
            : `Free trial translation limit reached. Please sign in or wait ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { title, description, ingredients, instructions, targetLanguage } = body as {
      title?: string;
      description?: string;
      ingredients?: string[];
      instructions?: string[];
      targetLanguage?: string;
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

    // Map target language code/string to culinary translation instructions
    const langKey = (targetLanguage || "en").toLowerCase();
    let targetLangName = "English";
    let targetGuidelines = `1. Translate the Title into a natural, attractive English culinary recipe title (e.g. "Köttbullar med potatismos" -> "Swedish Meatballs with Creamy Mashed Potatoes").
2. Translate all Ingredients accurately into English. Preserve quantities and metric/US units (e.g., "500 g nötfärs" -> "500 g ground beef", "2 dl grädde" -> "2 dl heavy cream", "1 msk" -> "1 tbsp", "1 tsk" -> "1 tsp").
3. Translate all cooking Instructions into clear, step-by-step imperative English (e.g., "1. Hetta upp smöret i en stekpanna" -> "Heat the butter in a large skillet over medium heat").`;

    if (langKey === "sv" || langKey.includes("swed") || langKey === "svenska") {
      targetLangName = "Swedish (Svenska)";
      targetGuidelines = `1. Translate the Title into natural, appetizing culinary Swedish (e.g., "Swedish Meatballs with Mashed Potatoes" -> "Klassiska Köttbullar med potatismos", "Chicken Alfredo" -> "Krämig Kycklingpasta Alfredo").
2. Translate all Ingredients into Swedish with standard Swedish culinary measurements (g, kg, dl, ml, msk, tsk, krm). Convert cups/oz/lb cleanly to Swedish equivalents (e.g. 1 cup flour -> ~2.4 dl / 140 g vetemjöl, 1 tbsp -> 1 msk, 1 tsp -> 1 tsk).
3. Translate all cooking Instructions into clear, professional Swedish recipe steps (e.g., "Heat olive oil in a skillet" -> "Hetta upp olivolja i en stekpanna").`;
    } else if (langKey === "es" || langKey.includes("span") || langKey === "español" || langKey === "espanol") {
      targetLangName = "Spanish (Español)";
      targetGuidelines = `1. Translate the Title into natural, appetizing culinary Spanish (e.g., "Swedish Meatballs" -> "Albóndigas suecas con puré de patatas").
2. Translate all Ingredients into Spanish with standard metric culinary measurements (g, kg, ml, l, cda, cdta).
3. Translate all cooking Instructions into clear, professional Spanish steps (e.g., "Heat olive oil in a skillet" -> "Calienta el aceite de oliva en una sartén grande").`;
    } else if (langKey === "de" || langKey.includes("germ") || langKey === "deutsch") {
      targetLangName = "German (Deutsch)";
      targetGuidelines = `1. Translate the Title into natural, appetizing culinary German (e.g., "Swedish Meatballs" -> "Schwedische Köttbullar mit Kartoffelpüree").
2. Translate all Ingredients into German with standard metric culinary units (g, kg, ml, EL, TL).
3. Translate all cooking Instructions into clear, professional German recipe steps (e.g., "Heat olive oil in a skillet" -> "Olivenöl in einer großen Pfanne erhitzen").`;
    } else if (langKey === "fr" || langKey.includes("fren") || langKey === "français" || langKey === "francais") {
      targetLangName = "French (Français)";
      targetGuidelines = `1. Translate the Title into natural, appetizing culinary French (e.g., "Swedish Meatballs" -> "Boulettes de viande suédoises et purée de pommes de terre").
2. Translate all Ingredients into French with standard metric units (g, kg, ml, cl, c. à soupe, c. à café).
3. Translate all cooking Instructions into clear, professional French recipe steps (e.g., "Heat olive oil in a skillet" -> "Chauffer l'huile d'olive dans une grande poêle").`;
    } else if (langKey === "it" || langKey.includes("ital") || langKey === "italiano") {
      targetLangName = "Italian (Italiano)";
      targetGuidelines = `1. Translate the Title into natural, appetizing culinary Italian.
2. Translate all Ingredients into Italian with standard metric units (g, kg, ml, cucchiaio, cucchiaino).
3. Translate all cooking Instructions into clear, professional Italian recipe steps (e.g., "Heat olive oil in a skillet" -> "Scaldare l'olio d'oliva in una padella capiente").`;
    }

    const prompt = `You are an expert master chef and multilingual culinary translator.
Translate the following recipe into clean, appetising, modern ${targetLangName}.

Guidelines:
${targetGuidelines}
4. Fix any typos, colloquialisms, or missing spaces from user input.
5. Cleanly normalize fractions (e.g., "½" -> "1/2", "¼" -> "1/4", "¾" -> "3/4", "1 1/2").
6. When oven temperatures are specified, include both Celsius and Fahrenheit (e.g., "175°C (350°F)").
7. If a description is provided, translate it gracefully into ${targetLangName}.
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
