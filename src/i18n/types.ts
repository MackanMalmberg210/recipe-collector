export type SupportedLocale = "en" | "sv" | "es" | "de" | "fr" | "it";

export type LanguageOption = {
  code: SupportedLocale;
  name: string;        // Native name (e.g. "Svenska", "Español")
  englishName: string; // English name (e.g. "Swedish", "Spanish")
  flag: string;        // Flag emoji
};

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", englishName: "English", flag: "🇺🇸" },
  { code: "sv", name: "Svenska", englishName: "Swedish", flag: "🇸🇪" },
  { code: "es", name: "Español", englishName: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", englishName: "German", flag: "🇩🇪" },
  { code: "fr", name: "Français", englishName: "French", flag: "🇫🇷" },
  { code: "it", name: "Italiano", englishName: "Italian", flag: "🇮🇹" },
];

export interface Dictionary {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    close: string;
    loading: string;
    confirm: string;
    done: string;
    success: string;
    error: string;
    search: string;
    viewAll: string;
    filter: string;
    sort: string;
  };
  nav: {
    explore: string;
    saved: string;
    groceries: string;
    planner: string;
    create: string;
    settings: string;
    admin: string;
    signIn: string;
    signOut: string;
    proBadge: string;
    guest: string;
  };
  home: {
    badge: string;
    heroTitle1: string;
    heroTitle2: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    vibeAll: string;
    vibeQuick: string;
    vibeProtein: string;
    vibeVegetarian: string;
    vibeFamily: string;
    vibeBudget: string;
    todaysMenu: string;
    importRecipe: string;
    scanRecipe: string;
    matchesFound: string;
    noMatches: string;
  };
  saved: {
    title: string;
    subtitle: string;
    importButton: string;
    createButton: string;
    searchPlaceholder: string;
    allTab: string;
    favoritesTab: string;
    creationsTab: string;
    emptyTitle: string;
    emptyDesc: string;
  };
  recipe: {
    servings: string;
    cookTime: string;
    mins: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    ingredients: string;
    instructions: string;
    notes: string;
    cookMode: string;
    wakeLockOn: string;
    startCooking: string;
    exitCookMode: string;
    nextStep: string;
    prevStep: string;
    finishStep: string;
    share: string;
    copied: string;
    print: string;
    addCookPhoto: string;
    photosTitle: string;
  };
  groceries: {
    title: string;
    subtitle: string;
    addItemPlaceholder: string;
    addButton: string;
    clearAll: string;
    emptyTitle: string;
    emptyDesc: string;
    aisleProduce: string;
    aisleMeat: string;
    aisleDairy: string;
    aisleBakery: string;
    aisleSpices: string;
    aisleBeverages: string;
    aisleHousehold: string;
    aisleOther: string;
    itemsCount: string;
    checkedCount: string;
  };
  planner: {
    title: string;
    subtitle: string;
    syncGroceries: string;
    clearPlan: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
    addMeal: string;
    quickAdd: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  settings: {
    title: string;
    subtitle: string;
    appLanguage: string;
    appLanguageDesc: string;
    unitSystem: string;
    unitSystemDesc: string;
    metric: string;
    imperial: string;
    metricDesc: string;
    imperialDesc: string;
    defaultServings: string;
    servingsDesc: string;
    dietaryPreferences: string;
    dietaryDesc: string;
    strictFilter: string;
    strictFilterDesc: string;
    autoScale: string;
    autoScaleDesc: string;
    autoAddPantry: string;
    autoAddPantryDesc: string;
    membership: string;
    proActive: string;
    freePlan: string;
    upgradePro: string;
    manageBilling: string;
    account: string;
    deleteAccount: string;
  };
  importModal: {
    title: string;
    subtitle: string;
    urlPlaceholder: string;
    importButton: string;
    fetching: string;
    translating: string;
    targetLanguage: string;
    autoTranslate: string;
    autoTranslateDesc: string;
    success: string;
  };
  chefPro: {
    badge: string;
    freeBeta: string;
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    savePercent: string;
    featureAdFree: string;
    featureVision: string;
    featureNutrition: string;
    featureCloud: string;
    featurePlanner: string;
    startPro: string;
    cancelAnytime: string;
  };
}
