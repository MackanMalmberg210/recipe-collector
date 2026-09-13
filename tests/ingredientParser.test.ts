import { describe, it, expect } from 'vitest';
import { parseIngredientString, parseIngredientList } from '../src/lib/ingredientParser';

describe('ingredientParser', () => {
  describe('parseIngredientString', () => {
    it('parses standard volume and weight measurements', () => {
      const res1 = parseIngredientString('2 tbsp olive oil');
      expect(res1.amount).toBe(2);
      expect(res1.unit).toBe('tbsp');
      expect(res1.name).toBe('Olive oil');

      const res2 = parseIngredientString('500g nötfärs');
      expect(res2.amount).toBe(500);
      expect(res2.unit).toBe('g');
      expect(res2.name).toBe('Nötfärs');

      const res3 = parseIngredientString('3 dl mjölk');
      expect(res3.amount).toBe(3);
      expect(res3.unit).toBe('dl');
      expect(res3.name).toBe('Mjölk');
    });

    it('handles unicode fractions correctly', () => {
      const half = parseIngredientString('½ cup sugar');
      expect(half.amount).toBe(0.5);
      expect(half.unit).toBe('cup');
      expect(half.name).toBe('Sugar');

      const quarter = parseIngredientString('¼ tsk salt');
      expect(quarter.amount).toBe(0.25);
      expect(quarter.unit).toBe('tsp');
      expect(quarter.name).toBe('Salt');

      const mixed = parseIngredientString('1 ½ msk soja');
      expect(mixed.amount).toBe(1.5);
      expect(mixed.unit).toBe('tbsp');
      expect(mixed.name).toBe('Soja');
    });

    it('handles standard slash fractions', () => {
      const parsed = parseIngredientString('3/4 cup flour');
      expect(parsed.amount).toBe(0.75);
      expect(parsed.unit).toBe('cup');
      expect(parsed.name).toBe('Flour');

      const mixed = parseIngredientString('2 1/2 lbs chicken breast');
      expect(mixed.amount).toBe(2.5);
      expect(mixed.unit).toBe('lb');
      expect(mixed.name).toBe('Chicken breast');
    });

    it('handles ingredients without units', () => {
      const eggs = parseIngredientString('3 ägg');
      expect(eggs.amount).toBe(3);
      expect(eggs.unit).toBeNull();
      expect(eggs.name).toBe('Ägg');

      const avocado = parseIngredientString('2 avocados');
      expect(avocado.amount).toBe(2);
      expect(avocado.unit).toBeNull();
      expect(avocado.name).toBe('Avocados');
    });

    it('extracts preparation notes', () => {
      const parsed = parseIngredientString('1 lök, finhackad');
      expect(parsed.amount).toBe(1);
      expect(parsed.name).toBe('Lök');
      expect(parsed.notes).toContain('finhackad');

      const toTaste = parseIngredientString('salt to taste');
      expect(toTaste.name).toBe('Salt');
      expect(toTaste.notes).toContain('to taste');
    });
  });

  describe('parseIngredientList', () => {
    it('parses multiple ingredients and filters out empty lines', () => {
      const list = [
        '1 cup quinoa',
        '',
        '2 msk sesamolja',
        '   ',
        '1 tsk ingefära',
      ];
      const parsed = parseIngredientList(list);
      expect(parsed.length).toBe(3);
      expect(parsed[0].name).toBe('Quinoa');
      expect(parsed[1].name).toBe('Sesamolja');
      expect(parsed[2].name).toBe('Ingefära');
    });
  });
});
