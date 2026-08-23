import { parseIngredientString } from "./ingredientParser";

export function capitalize(value: string) {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
}

export function cleanIngredientName(raw: string): string {
  if (!raw) return "";
  const parsed = parseIngredientString(raw);
  return parsed.name || raw;
}