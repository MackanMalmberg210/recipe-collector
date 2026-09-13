import { describe, it, expect } from 'vitest';
import {
  createEmptyMealPlan,
  createEmptyDayPlan,
  smartAutoPlanWeek,
  smartShuffleDay,
  smartSurpriseMeal,
  getDayCalories,
  getWeekCalories,
  getPlannedRecipes,
  countPlannedMeals,
  getUniquePlannedIngredients,
  getCalorieDifferenceLabel,
  isRecipeSuitableForSlot,
  type MealPlan,
  type WeekDay,
  type MealSlot,
} from '../src/lib/planner';
import type { AppRecipe } from '../src/lib/types';

describe('Meal Planner Core Engine', () => {
  const mockBreakfast: AppRecipe = {
    id: 1,
    title: 'Avocado Toast & Poached Egg',
    image: '',
    cookTime: 10,
    calories: 380,
    mealType: 'breakfast',
    category: 'breakfast',
    origin: 'mock',
    ingredients: ['2 skivor surdegsbröd', '1 avokado', '2 ägg', 'flingsalt'],
    instructions: [],
  };

  const mockLunch: AppRecipe = {
    id: 2,
    title: 'Caesar Salad with Grilled Chicken',
    image: '',
    cookTime: 20,
    calories: 520,
    mealType: 'lunch',
    category: 'salad',
    origin: 'mock',
    ingredients: ['romansallad', 'kycklingfilé', 'parmesan', 'krutonger', 'caesardressing'],
    instructions: [],
  };

  const mockDinner: AppRecipe = {
    id: 3,
    title: 'Creamy Tuscan Salmon with Spinach',
    image: '',
    cookTime: 30,
    calories: 680,
    mealType: 'dinner',
    category: 'main-course',
    origin: 'mock',
    ingredients: ['laxfilé', 'vispgrädde', 'babyspenat', 'körsbärstomater', 'vitlök'],
    instructions: [],
  };

  const mockSnack: AppRecipe = {
    id: 4,
    title: 'Protein Berry Smoothie',
    image: '',
    cookTime: 5,
    calories: 220,
    mealType: 'snack',
    category: 'snack',
    origin: 'mock',
    ingredients: ['havremjölk', 'frysta blåbär', 'banan', 'proteinpulver'],
    instructions: [],
  };

  const allMockRecipes: AppRecipe[] = [mockBreakfast, mockLunch, mockDinner, mockSnack];

  describe('Slot Suitability Validation', () => {
    it('correctly validates breakfast suitability', () => {
      expect(isRecipeSuitableForSlot(mockBreakfast, 'breakfast')).toBe(true);
      expect(isRecipeSuitableForSlot(mockDinner, 'breakfast')).toBe(false);
    });

    it('correctly validates lunch suitability', () => {
      expect(isRecipeSuitableForSlot(mockLunch, 'lunch')).toBe(true);
      // Dedicated breakfast recipes should not be planned as lunch
      expect(isRecipeSuitableForSlot(mockBreakfast, 'lunch')).toBe(false);
    });

    it('correctly prevents breakfast sweet items and light snacks from dinner', () => {
      expect(isRecipeSuitableForSlot(mockDinner, 'dinner')).toBe(true);
      expect(isRecipeSuitableForSlot(mockSnack, 'dinner')).toBe(false);
    });
  });

  describe('Nutrition & Calorie Calculations', () => {
    it('calculates daily calories correctly', () => {
      const dayPlan = createEmptyDayPlan();
      dayPlan.breakfast = 1; // 380
      dayPlan.lunch = 2;     // 520
      dayPlan.dinner = 3;    // 680
      dayPlan.afternoon_snack = 4; // 220

      const total = getDayCalories(allMockRecipes, dayPlan);
      expect(total).toBe(380 + 520 + 680 + 220); // 1800 kcal
    });

    it('calculates weekly calories accurately across all 7 days', () => {
      const plan = createEmptyMealPlan();
      plan.monday.dinner = 3;   // 680
      plan.tuesday.dinner = 3;  // 680

      const total = getWeekCalories(allMockRecipes, plan);
      expect(total).toBe(1360);
    });

    it('provides accurate calorie difference labels', () => {
      expect(getCalorieDifferenceLabel(2000, 2000)).toBe('On target');
      expect(getCalorieDifferenceLabel(2250, 2000)).toBe('250 kcal over');
      expect(getCalorieDifferenceLabel(1800, 2000)).toBe('200 kcal under');
    });
  });

  describe('Meal Counting & Extraction', () => {
    it('counts planned meals accurately', () => {
      const plan = createEmptyMealPlan();
      expect(countPlannedMeals(plan)).toBe(0);

      plan.monday.breakfast = 1;
      plan.monday.lunch = 2;
      plan.friday.dinner = 3;

      expect(countPlannedMeals(plan)).toBe(3);
    });

    it('extracts planned recipe objects filtering out nulls', () => {
      const plan = createEmptyMealPlan();
      plan.monday.breakfast = 1;
      plan.wednesday.dinner = 3;

      const planned = getPlannedRecipes(allMockRecipes, plan);
      expect(planned.length).toBe(2);
      expect(planned.map((r) => r.id)).toEqual([1, 3]);
    });
  });

  describe('Smart Auto-Planner & Synergy', () => {
    it('auto-plans meals into empty slots without altering existing assigned meals', () => {
      const initialPlan = createEmptyMealPlan();
      initialPlan.monday.dinner = 3; // Pre-assigned Tuscan Salmon

      const { nextPlan, filledCount } = smartAutoPlanWeek(initialPlan, allMockRecipes);

      // Existing dinner must remain intact
      expect(nextPlan.monday.dinner).toBe(3);
      expect(filledCount).toBeGreaterThan(0);
    });

    it('smartShuffleDay changes the slots recipe without mutating snacks', () => {
      const initialPlan = createEmptyMealPlan();
      initialPlan.monday.morning_snack = 4; // Existing snack
      initialPlan.monday.dinner = 3;

      const shuffledDay = smartShuffleDay('monday', initialPlan, allMockRecipes);

      // Snack MUST be strictly preserved
      expect(shuffledDay.morning_snack).toBe(4);
    });
  });

  describe('Grocery Synergy Extraction', () => {
    it('aggregates unique ingredients across planned meals for shopping', () => {
      const plan = createEmptyMealPlan();
      plan.monday.breakfast = 1; // has avokado, surdegsbröd, ägg
      plan.monday.lunch = 2;     // has kycklingfilé, parmesan

      const groceryItems = getUniquePlannedIngredients(allMockRecipes, plan);
      expect(groceryItems.length).toBeGreaterThan(0);

      const itemNames = groceryItems.map((g) => g.name.toLowerCase());
      // "2 skivor surdegsbröd" and "1 avokado" canonicalized or passed through
      expect(itemNames.some((n) => n.includes('avokado') || n.includes('avocado'))).toBe(true);
      // "kycklingfilé" gets canonicalized to "chicken breast"
      expect(itemNames.some((n) => n.includes('chicken') || n.includes('kyckling'))).toBe(true);
    });
  });
});
