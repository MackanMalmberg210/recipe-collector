"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  type SupportedLocale,
  type Dictionary,
  type LanguageOption,
  SUPPORTED_LANGUAGES,
  DEFAULT_LOCALE,
  DICTIONARIES,
  getDictionary,
  normalizeLocale,
  resolveTranslation,
} from "../i18n";
import { getStoredUserSettings, saveUserSettings } from "../lib/settings";

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: LanguageOption[];
  currentLanguage: LanguageOption;
  dict: Dictionary;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    try {
      const stored = getStoredUserSettings();
      if (stored?.preferredLanguage) {
        return normalizeLocale(stored.preferredLanguage);
      }
      // Auto-detect browser/system language
      if (navigator?.language) {
        return normalizeLocale(navigator.language);
      }
    } catch {}
    return DEFAULT_LOCALE;
  });

  // Keep HTML lang attribute synchronized
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  // Listen for external settings updates (e.g. from other tabs or settings saves)
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const updated = getStoredUserSettings();
      if (updated?.preferredLanguage) {
        const normalized = normalizeLocale(updated.preferredLanguage);
        setLocaleState((prev) => (prev !== normalized ? normalized : prev));
      }
    };

    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("user_settings_updated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("user_settings_updated", handleSettingsUpdate);
    };
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      const currentSettings = getStoredUserSettings();
      saveUserSettings({
        ...currentSettings,
        preferredLanguage: newLocale,
      });
    } catch {}
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);
  const fallbackDict = DICTIONARIES[DEFAULT_LOCALE];

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return resolveTranslation(dict, fallbackDict, key, params);
    },
    [dict, fallbackDict]
  );

  const currentLanguage = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0],
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      languages: SUPPORTED_LANGUAGES,
      currentLanguage,
      dict,
      dir: "ltr" as const,
    }),
    [locale, setLocale, t, currentLanguage, dict]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if invoked outside Provider (e.g. static tests)
    const fallbackDict = DICTIONARIES[DEFAULT_LOCALE];
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) =>
        resolveTranslation(fallbackDict, fallbackDict, key, params),
      languages: SUPPORTED_LANGUAGES,
      currentLanguage: SUPPORTED_LANGUAGES[0],
      dict: fallbackDict,
      dir: "ltr" as const,
    };
  }
  return context;
}
