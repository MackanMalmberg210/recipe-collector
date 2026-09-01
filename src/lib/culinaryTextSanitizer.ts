export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/**
 * Universal Culinary Text Sanitizer
 * Strips all web checkboxes, unicode boxes, bullets, radio markers, counter badges,
 * hidden whitespace, and formatting artifacts across any website format.
 */
export function sanitizeCulinaryText(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let text = decodeHtmlEntities(raw);

  // 1. Remove zero-width spaces, BOM, non-breaking spaces, control and bidirectional marks
  text = text.replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u202A-\u202E\u0000-\u001F]/g, " ");

  // 2. Remove all unicode checkbox, box, radio, checkmark, bullet, and arrow glyphs:
  // ☐ (U+2610), ☑ (U+2611), ☒ (U+2612), □ (U+25A1), ▢ (U+25A2), ◻ (U+25FB), ◽ (U+25FD), ⬜ (U+2B1C), ⬛ (U+2B1B)
  // 🔘 (U+1F518), ⭕ (U+2B55), ⚪ (U+26AA), ⚫ (U+26AB), ✓ (U+2713), ✔ (U+2714), ✕ (U+2715), ✖ (U+2716), ✗ (U+2717), ✘ (U+2718)
  // • (U+2022), · (U+00B7), ∙ (U+2219), ◦ (U+25E6), ● (U+25CF), ○ (U+25CB), ◆ (U+25C6), ◇ (U+25C7)
  // ► (U+25BA), ▸ (U+25B8), ▶ (U+25B6), ➤ (U+27A4), → (U+2192)
  text = text.replace(
    /[\u2610\u2611\u2612\u25A0-\u25FF\u2B1B\u2B1C\u2B55\u26AA\u26AB\u2713-\u2718\u2022\u00B7\u2219\u25E6\u27A4\u2190-\u21FF\uD83D\uDD18]/gu,
    " "
  );

  // 3. Remove bracketed checkboxes e.g. "[ ]", "[x]", "[X]", "( )", "(x)", "(X)", "{ }", "{x}"
  text = text.replace(/^[\[\(\{]\s*[xX✓✔]?\s*[\]\)\}]\s*/, "");

  // 4. Remove leading bullets, dashes, tildes, pluses, asterisks, pipes, colons
  text = text.replace(/^[-*~+|–—:;,/]\s*/, "");

  // 5. Remove leading list/step markers like "1. ", "1) ", "Step 1: ", "1 - " when in instructions or ingredients
  text = text.replace(/^(?:step\s*\d+[\s:.-]*|\d+[\.\)\:]\s+)/i, "");

  // 6. Normalize multiple spaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
