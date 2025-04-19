// src/hooks/useGroceryList.ts
import { useEffect, useState } from 'react';
import { PantryItem, Recipe } from '../types';
import { API_ENDPOINTS } from '../config/api';
interface UseGroceryListProps {
  isGuest: boolean;
  userId?: string;
  selectedIds?: string[];
  planIds?: string[];
  pantryItems?: PantryItem[];
}

interface GroceryListResult {
  categorized: { [category: string]: string[] };
  raw: { [ingredient: string]: { [unit: string]: number } };
}

export const useGroceryList = ({
  isGuest,
  userId,
  selectedIds,
  planIds,
  pantryItems,
}: UseGroceryListProps) => {
  const [data, setData] = useState<GroceryListResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroceryList = async () => {
      // 🚫 Skip if there's nothing to request
      if ((isGuest && !selectedIds?.length && !planIds?.length) || (!isGuest && !userId)) {
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.groceryList, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_guest: isGuest,
            user_id: isGuest ? undefined : userId,
            selected_ids: isGuest ? selectedIds : undefined,
            plan_ids: isGuest ? planIds : undefined,
            pantry_items: pantryItems || [],
          }),
        });

        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchGroceryList();
  }, [isGuest, userId, selectedIds, planIds, pantryItems]);

  return { groceryList: data, loading, error };
};
