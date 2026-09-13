import { describe, it, expect } from 'vitest';
import {
  decodeHtmlEntities,
  sanitizeCulinaryText,
  capitalizeFirstLetter,
} from '../src/lib/culinaryTextSanitizer';

describe('culinaryTextSanitizer', () => {
  describe('decodeHtmlEntities', () => {
    it('decodes HTML entities into normal characters', () => {
      expect(decodeHtmlEntities('Salt &amp; pepper')).toBe('Salt & pepper');
      expect(decodeHtmlEntities('Chef&#8217;s special')).toBe("Chef's special");
      expect(decodeHtmlEntities('&quot;Al dente&quot;')).toBe('"Al dente"');
      expect(decodeHtmlEntities('Pasta &#8211; fresh')).toBe('Pasta – fresh');
    });
  });

  describe('sanitizeCulinaryText', () => {
    it('strips web checkboxes, bullets, and glyphs from imported recipes', () => {
      expect(sanitizeCulinaryText('☐ 2 cups all-purpose flour')).toBe('2 cups all-purpose flour');
      expect(sanitizeCulinaryText('☑ 1 tbsp olive oil')).toBe('1 tbsp olive oil');
      expect(sanitizeCulinaryText('[x] 500g köttfärs')).toBe('500g köttfärs');
      expect(sanitizeCulinaryText('• 3 klyftor vitlök')).toBe('3 klyftor vitlök');
      expect(sanitizeCulinaryText('- 1 tsp vaniljextrakt')).toBe('1 tsp vaniljextrakt');
      expect(sanitizeCulinaryText('Step 1: Chop the onions')).toBe('Chop the onions');
      expect(sanitizeCulinaryText('1. Koka upp rikligt med saltat vatten')).toBe('Koka upp rikligt med saltat vatten');
    });

    it('cleans excessive and zero-width whitespace', () => {
      expect(sanitizeCulinaryText('  2   msk   smör   ')).toBe('2 msk smör');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('capitalizes the first letter of ingredients or instructions', () => {
      expect(capitalizeFirstLetter('salt och peppar')).toBe('Salt och peppar');
      expect(capitalizeFirstLetter('ägg')).toBe('Ägg');
      expect(capitalizeFirstLetter('ölkorv')).toBe('Ölkorv');
      expect(capitalizeFirstLetter('1 msk olja')).toBe('1 msk olja');
    });
  });
});
