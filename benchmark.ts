const NUM_PARSED_ITEMS = 10000;
const NUM_LAST_ADDED_ITEMS = 1000;

const parsedList = Array.from({ length: NUM_PARSED_ITEMS }, (_, i) => ({
  name: `Ingredient ${i}`,
  bought: false,
}));

const lastAddedItems = Array.from({ length: NUM_LAST_ADDED_ITEMS }, (_, i) => `ingredient ${i * 5}`);

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

console.time("Array.includes (Original)");
const filteredOriginal = parsedList.filter(
  (item) => !lastAddedItems.includes(normalizeIngredient(item.name))
);
console.timeEnd("Array.includes (Original)");

console.time("Set.has (Optimized)");
const lastAddedSet = new Set(lastAddedItems);
const filteredOptimized = parsedList.filter(
  (item) => !lastAddedSet.has(normalizeIngredient(item.name))
);
console.timeEnd("Set.has (Optimized)");

console.log(`Original count: ${filteredOriginal.length}, Optimized count: ${filteredOptimized.length}`);
