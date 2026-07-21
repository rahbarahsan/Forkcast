// src/hooks/useGroceryList.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { PantryItem } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { PANTRY_UPDATED_EVENT } from '../context/PantryContext';
import { PLAN_UPDATED_EVENT } from '../context/PlannerContext';

interface UseGroceryListProps {
  selectedIds?: string[];
  planIds?: string[];
  recipeIds?: string[];
  pantryItems?: PantryItem[];
}

interface GroceryListResult {
  categorized: { [category: string]: string[] };
  raw: { [ingredient: string]: { [unit: string]: number } };
}

export const useGroceryList = ({
  selectedIds,
  planIds,
  recipeIds,
  pantryItems,
}: UseGroceryListProps) => {
  // Identity comes from the session, never from a caller-supplied id.
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const isGuest = !session;
  const [data, setData] = useState<GroceryListResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);

  const fetchGroceryList = useCallback(async () => {
    const now = Date.now();
    if (fetchInProgress.current || now - lastFetchTime.current < 500) return;

    fetchInProgress.current = true;
    setLoading(true);

    const selectedIdsArray = Array.isArray(selectedIds) ? selectedIds : [];

    const planIdsArray = Array.isArray(planIds) ? planIds : [];

    const recipeIdsArray = Array.isArray(recipeIds) ? recipeIds : [];

    // No user_id here on purpose: the backend derives identity from the bearer
    // token, so a caller cannot ask for someone else's pantry or plans.
    const requestBody = {
      is_guest: isGuest,
      selected_ids: selectedIdsArray,
      plan_ids: planIdsArray,
      recipe_ids: recipeIdsArray,
      pantry_items: pantryItems || [],
    };

    try {
      const response = await fetch(API_ENDPOINTS.groceryList, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result) {
        throw new Error('Result is null or undefined');
      }

      if (!result.categorized) result.categorized = {};
      if (!result.raw) result.raw = {};

      setData(result);
      lastFetchTime.current = Date.now();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [isGuest, accessToken, selectedIds, planIds, recipeIds, pantryItems]);

  useEffect(() => {
    const handlePantryUpdate = () => {
      if (!fetchInProgress.current) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    const handlePlanUpdate = () => {
      if (!fetchInProgress.current) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener(PANTRY_UPDATED_EVENT, handlePantryUpdate);
      document.addEventListener(PLAN_UPDATED_EVENT, handlePlanUpdate);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener(PANTRY_UPDATED_EVENT, handlePantryUpdate);
        document.removeEventListener(PLAN_UPDATED_EVENT, handlePlanUpdate);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🍳 Triggering Grocery Fetch with:', { recipeIds, planIds, pantryItems });
    fetchGroceryList();
  }, [
    fetchGroceryList,
    refreshTrigger,
    JSON.stringify(recipeIds),
    JSON.stringify(planIds),
    JSON.stringify(pantryItems),
  ]);

  return { groceryList: data, loading, error };
};
