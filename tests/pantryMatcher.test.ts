import { describe, it, expect } from 'vitest';
import {
  isIngredientPantryMatch,
  calculateRecipePantryMatch,
  findBestPantryMatches,
} from '../src/lib/pantryMatcher';
import type { AppRecipe } from '../src/lib/types';
import type { PantryItem } from '../src/lib/groceries';

describe('pantryMatcher', () => {
  describe('isIngredientPantryMatch', () => {
    it('matches exact items regardless of casing', () => {
      expect(isIngredientPantryMatch('Pasta', 'pasta')).toBe(true);
      expect(isIngredientPantryMatch('basmati rice', 'Basmati Rice')).toBe(true);
    });

    it('matches canonical equivalences between English and Swedish', () => {
      // Olive oil
      expect(isIngredientPantryMatch('2 tbsp extra virgin olive oil', 'olivolja')).toBe(true);
      expect(isIngredientPantryMatch('olivolja', 'olive oil')).toBe(true);

      // Salt
      expect(isIngredientPantryMatch('1 pinch flingsalt', 'sea salt')).toBe(true);
      expect(isIngredientPantryMatch('kosher salt', 'salt')).toBe(true);

      // Soy sauce
      expect(isIngredientPantryMatch('japansk soja', 'soy sauce')).toBe(true);
      expect(isIngredientPantryMatch('tamari', 'sojasås')).toBe(true);

      // Black pepper
      expect(isIngredientPantryMatch('freshly ground black pepper', 'svartpeppar')).toBe(true);

      // Garlic powder
      expect(isIngredientPantryMatch('1 tsp vitlökspulver', 'garlic powder')).toBe(true);
    });

    it('prevents false positive matches on distinct items', () => {
      // Garlic powder vs fresh garlic clove
      expect(isIngredientPantryMatch('2 garlic cloves', 'garlic powder')).toBe(false);

      // Onion powder vs fresh yellow onion
      expect(isIngredientPantryMatch('1 large yellow onion', 'onion powder')).toBe(false);

      // Chocolate chips vs cocoa powder
      expect(isIngredientPantryMatch('cocoa powder', 'chocolate chips')).toBe(false);

      // Almond flour vs almond milk
      expect(isIngredientPantryMatch('almond milk', 'almond flour')).toBe(false);
    });
  });

  describe('calculateRecipePantryMatch', () => {
    const dummyRecipe: AppRecipe = {
      id: 1,
      title: 'Simple Carbonara',
      cookTime: 20,
      calories: 550,
      image: '',
      ingredients: [
        '400g spaghetti',
        '4 ägg',
        '150g parmesan',
        '200g guanciale',
        'svartpeppar',
      ],
      instructions: ['Boil pasta', 'Mix eggs and cheese', 'Combine'],
      category: 'pasta',
      mealType: 'dinner',
      origin: 'mock',
    };

    it('calculates accurate match percentage for in-stock items', () => {
      const pantry: PantryItem[] = [
        { id: '1', name: 'spaghetti', inStock: true, category: 'bakery_grains' },
        { id: '2', name: 'ägg', inStock: true, category: 'dairy_fridge' },
        { id: '3', name: 'svartpeppar', inStock: true, category: 'spices_condiments' },
        { id: '4', name: 'mjölk', inStock: true, category: 'dairy_fridge' },
      ];

      const match = calculateRecipePantryMatch(dummyRecipe, pantry);

      expect(match.totalIngredientsCount).toBe(5);
      expect(match.matchedIngredientsCount).toBe(3);
      expect(match.missingIngredientsCount).toBe(2);
      expect(match.matchPercentage).toBe(60);
      expect(match.matchedItems.length).toBe(3);
      expect(match.missingItems.length).toBe(2);
    });

    it('ignores pantry items that are out of stock', () => {
      const pantry: PantryItem[] = [
        { id: '1', name: 'spaghetti', inStock: false, category: 'bakery_grains' },
        { id: '2', name: 'ägg', inStock: false, category: 'dairy_fridge' },
      ];

      const match = calculateRecipePantryMatch(dummyRecipe, pantry);

      expect(match.matchedIngredientsCount).toBe(0);
      expect(match.matchPercentage).toBe(0);
      expect(match.missingIngredientsCount).toBe(5);
    });
  });

  describe('findBestPantryMatches', () => {
    const recipeA: AppRecipe = {
      id: 101,
      title: 'Pasta Aglio e Olio',
      cookTime: 15,
      calories: 400,
      image: '',
      ingredients: ['spaghetti', 'olivolja', 'vitlök'],
      instructions: [],
      origin: 'mock',
    };

    const recipeB: AppRecipe = {
      id: 102,
      title: 'Pasta Bolognese',
      cookTime: 45,
      calories: 700,
      image: '',
      ingredients: ['spaghetti', 'nötfärs', 'krossade tomater', 'lök', 'morot', 'olivolja'],
      instructions: [],
      origin: 'mock',
    };

    it('ranks recipes with higher match percentage first', () => {
      const pantry: PantryItem[] = [
        { id: '1', name: 'spaghetti', inStock: true, category: 'bakery_grains' },
        { id: '2', name: 'olivolja', inStock: true, category: 'spices_condiments' },
        { id: '3', name: 'vitlök', inStock: true, category: 'produce' },
      ];

      const matches = findBestPantryMatches([recipeB, recipeA], pantry, 20);

      expect(matches.length).toBe(2);
      expect(matches[0].recipe.id).toBe(101);
      expect(matches[0].matchPercentage).toBe(100);
      expect(matches[1].recipe.id).toBe(102);
      expect(matches[1].matchPercentage).toBe(33);
    });

    it('returns empty array if no in-stock items or match is below min percentage', () => {
      const pantry: PantryItem[] = [
        { id: '1', name: 'avocado', inStock: true, category: 'produce' },
      ];

      const matches = findBestPantryMatches([recipeA], pantry, 50);
      expect(matches).toEqual([]);
    });
  });
});
