import { describe, it, expect } from "vitest";
import {
  normalizeLocale,
  getDictionary,
  resolveTranslation,
  SUPPORTED_LANGUAGES,
  DEFAULT_LOCALE,
  DICTIONARIES,
} from "../src/i18n";

describe("i18n Localization Engine", () => {
  it("normalizes diverse locale strings into standard supported codes", () => {
    expect(normalizeLocale("sv")).toBe("sv");
    expect(normalizeLocale("sv-SE")).toBe("sv");
    expect(normalizeLocale("Swedish")).toBe("sv");
    expect(normalizeLocale("svenska")).toBe("sv");

    expect(normalizeLocale("es")).toBe("es");
    expect(normalizeLocale("es-ES")).toBe("es");
    expect(normalizeLocale("Spanish")).toBe("es");
    expect(normalizeLocale("español")).toBe("es");

    expect(normalizeLocale("de")).toBe("de");
    expect(normalizeLocale("de-DE")).toBe("de");
    expect(normalizeLocale("German")).toBe("de");

    expect(normalizeLocale("fr")).toBe("fr");
    expect(normalizeLocale("French")).toBe("fr");

    expect(normalizeLocale("it")).toBe("it");
    expect(normalizeLocale("Italian")).toBe("it");

    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("unknown-locale")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it("provides complete dictionaries for all 6 core launch languages", () => {
    const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(supportedCodes).toContain("en");
    expect(supportedCodes).toContain("sv");
    expect(supportedCodes).toContain("es");
    expect(supportedCodes).toContain("de");
    expect(supportedCodes).toContain("fr");
    expect(supportedCodes).toContain("it");

    for (const code of supportedCodes) {
      const dict = getDictionary(code);
      expect(dict).toBeDefined();
      expect(dict.nav.explore.length).toBeGreaterThan(0);
      expect(dict.nav.saved.length).toBeGreaterThan(0);
      expect(dict.settings.appLanguage.length).toBeGreaterThan(0);
      expect(dict.recipe.cookMode.length).toBeGreaterThan(0);
      expect(dict.groceries.title.length).toBeGreaterThan(0);
      expect(dict.planner.title.length).toBeGreaterThan(0);
    }
  });

  it("correctly resolves nested translation keys with fallback", () => {
    const enDict = DICTIONARIES.en;
    const svDict = DICTIONARIES.sv;

    expect(resolveTranslation(svDict, enDict, "nav.explore")).toBe("Utforska");
    expect(resolveTranslation(enDict, enDict, "nav.explore")).toBe("Explore");
    expect(resolveTranslation(svDict, enDict, "non.existent.key")).toBe("non.existent.key");
  });
});
