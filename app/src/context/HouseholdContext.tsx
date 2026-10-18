import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, json } from '../lib/api';
import { BusyContext } from '../lib/BusyContext';
import type { PantryItem, Plan } from '../types';

export interface RecipeRow {
  id: string;
  title: string;
  cuisine: string;
  image: string;
  ingredients: string[];
  instructions: string;
  prep_time: string;
  cook_time: string;
  source?: string;
  servings?: number;
  source_url?: string;
  source_name?: string;
  halal_notes?: string;
  source_notes?: string;
}
export interface GroceryList {
  categorized: Record<string, string[]>;
  raw: Record<string, Record<string, number>>;
  items?: {
    name: string;
    category: string;
    sources: { recipe_id: string; recipe_title: string; line: string }[];
    notes: string[];
  }[];
  method?: string;
  warnings?: string[];
  pantry_deductions?: { name: string; quantity: number; unit: string; note?: string }[];
}
export interface HistoryEntry {
  id: string;
  name: string;
  recipe_ids: string[];
  checked: string[];
  grocery_list: GroceryList;
  created_at: string;
}
interface Household {
  recipes: RecipeRow[];
  pantry: PantryItem[];
  plans: Plan[];
  history: HistoryEntry[];
  loading: boolean;
  error: string | null;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  refresh: () => Promise<void>;
  mutate: <T>(path: string, method: string, body?: unknown) => Promise<T>;
}
const Context = createContext<Household | null>(null);
export function useHousehold() {
  const context = useContext(Context);
  if (!context) throw new Error('Household provider is required');
  return context;
}
export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [writes, setWrites] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const [recipes, pantry, plans, history] = await Promise.all([
        api<RecipeRow[]>('/recipes'),
        api<PantryItem[]>('/pantry'),
        api<Plan[]>('/plans'),
        api<HistoryEntry[]>('/history'),
      ]);
      setRecipes(recipes);
      setPantry(pantry);
      setPlans(plans);
      setHistory(history);
      setError(null);
      setSelected((ids) => ids.filter((id) => recipes.some((r) => r.id === id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cannot reach the local server');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh().catch(() => {});
  }, [refresh]);
  const mutate = useCallback(
    async <T,>(path: string, method: string, body?: unknown) => {
      setWrites((count) => count + 1);
      try {
        const result = await api<T>(path, json(method, body));
        await refresh();
        return result;
      } finally {
        setWrites((count) => count - 1);
      }
    },
    [refresh],
  );
  return (
    <Context.Provider
      value={{
        recipes,
        pantry,
        plans,
        history,
        loading,
        error,
        selected,
        setSelected,
        refresh,
        mutate,
      }}
    >
      <BusyContext.Provider value={writes > 0}>{children}</BusyContext.Provider>
    </Context.Provider>
  );
}
