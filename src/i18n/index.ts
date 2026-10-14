import type { SupportedLocale, Dictionary } from "./types";
import { en } from "./dictionaries/en";
import { sv } from "./dictionaries/sv";
import { es } from "./dictionaries/es";
import { de } from "./dictionaries/de";
import { fr } from "./dictionaries/fr";
import { it } from "./dictionaries/it";

export * from "./types";

export const DICTIONARIES: Record<SupportedLocale, Dictionary> = {
  en,
  sv,
  es,
  de,
  fr,
  it,
};

export const DEFAULT_LOCALE: SupportedLocale = "en";

/**
 * Normalizes any language string (such as "sv", "sv-SE", "Swedish", "es", "Spanish")
 * into a valid SupportedLocale ("en" | "sv" | "es" | "de" | "fr" | "it").
 */
export function normalizeLocale(lang?: string | null): SupportedLocale {
  if (!lang) return DEFAULT_LOCALE;
  const clean = lang.trim().toLowerCase();

  // Code match (e.g. "sv-SE" -> "sv")
  const primaryCode = clean.split(/[-_]/)[0];
  if (primaryCode in DICTIONARIES) {
    return primaryCode as SupportedLocale;
  }

  // English word match
  if (clean.includes("swed") || clean === "svenska") return "sv";
  if (clean.includes("span") || clean === "español" || clean === "espanol") return "es";
  if (clean.includes("germ") || clean === "deutsch") return "de";
  if (clean.includes("fren") || clean === "français" || clean === "francais") return "fr";
  if (clean.includes("ital") || clean === "italiano") return "it";
  if (clean.includes("engl")) return "en";

  return DEFAULT_LOCALE;
}

export function getDictionary(locale: SupportedLocale): Dictionary {
  return DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Resolves dot-separated keys, e.g. "nav.explore", with fallback to English
 */
export function resolveTranslation(
  dict: Dictionary,
  fallbackDict: Dictionary,
  path: string,
  params?: Record<string, string | number>
): string {
  const parts = path.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }

  // Fallback to English if key missing in chosen language
  if (typeof current !== "string") {
    let fallbackCurrent: any = fallbackDict;
    for (const part of parts) {
      if (fallbackCurrent && typeof fallbackCurrent === "object" && part in fallbackCurrent) {
        fallbackCurrent = fallbackCurrent[part];
      } else {
        fallbackCurrent = undefined;
        break;
      }
    }
    current = typeof fallbackCurrent === "string" ? fallbackCurrent : path;
  }

  // Interpolate params, e.g. {{count}} or {count}
  if (params && typeof current === "string") {
    for (const [k, v] of Object.entries(params)) {
      current = current.replace(new RegExp(`\\{\\{${k}\\}\\}|\\{${k}\\}`, "g"), String(v));
    }
  }

  return current;
}
