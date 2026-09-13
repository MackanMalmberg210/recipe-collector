import { describe, it, expect } from 'vitest';
import { categorizeGroceryItem } from '../src/lib/groceries';

describe('groceries categorization engine', () => {
  it('correctly categorizes fresh produce & herbs', () => {
    expect(categorizeGroceryItem('avokado')).toBe('produce');
    expect(categorizeGroceryItem('tomater')).toBe('produce');
    expect(categorizeGroceryItem('färsk basilika')).toBe('produce');
    expect(categorizeGroceryItem('bananer')).toBe('produce');
    expect(categorizeGroceryItem('yellow onion')).toBe('produce');
    expect(categorizeGroceryItem('fresh spinach')).toBe('produce');
  });

  it('correctly categorizes meat, poultry & seafood', () => {
    expect(categorizeGroceryItem('nötfärs')).toBe('meat_seafood');
    expect(categorizeGroceryItem('kycklingbröstfilé')).toBe('meat_seafood');
    expect(categorizeGroceryItem('laxfilé')).toBe('meat_seafood');
    expect(categorizeGroceryItem('falukorv')).toBe('meat_seafood');
    expect(categorizeGroceryItem('bacon')).toBe('meat_seafood');
    expect(categorizeGroceryItem('räkor')).toBe('meat_seafood');
  });

  it('correctly categorizes dairy & refrigerated products', () => {
    expect(categorizeGroceryItem('mellanmjölk')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('vispgrädde')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('smör')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('ägg')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('parmesanost')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('creme fraiche')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('havremjölk')).toBe('dairy_fridge');
    expect(categorizeGroceryItem('oat milk')).toBe('dairy_fridge');
  });

  it('correctly categorizes spices, condiments & oils', () => {
    expect(categorizeGroceryItem('olivolja')).toBe('spices_condiments');
    expect(categorizeGroceryItem('japansk soja')).toBe('spices_condiments');
    expect(categorizeGroceryItem('havssalt')).toBe('spices_condiments');
    expect(categorizeGroceryItem('svartpeppar')).toBe('spices_condiments');
    expect(categorizeGroceryItem('dijonsenap')).toBe('spices_condiments');
    expect(categorizeGroceryItem('vitvinsvinäger')).toBe('spices_condiments');
  });

  it('correctly categorizes bakery & grains', () => {
    expect(categorizeGroceryItem('vetemjöl')).toBe('bakery_grains');
    expect(categorizeGroceryItem('spaghetti')).toBe('bakery_grains');
    expect(categorizeGroceryItem('havregryn')).toBe('bakery_grains');
    expect(categorizeGroceryItem('jasminris')).toBe('bakery_grains');
    expect(categorizeGroceryItem('surdegsbröd')).toBe('bakery_grains');
  });

  it('correctly categorizes beverages', () => {
    expect(categorizeGroceryItem('kaffebönor')).toBe('beverages');
    expect(categorizeGroceryItem('grönt te')).toBe('beverages');
    expect(categorizeGroceryItem('mineralvatten')).toBe('beverages');
    expect(categorizeGroceryItem('coca cola')).toBe('beverages');
  });

  it('correctly categorizes household items', () => {
    expect(categorizeGroceryItem('diskmedel')).toBe('household_other');
    expect(categorizeGroceryItem('toalettpapper')).toBe('household_other');
    expect(categorizeGroceryItem('bakplåtspapper')).toBe('household_other');
    expect(categorizeGroceryItem('soppåsar')).toBe('household_other');
  });
});
