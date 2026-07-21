import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Custom event for plan changes that works on both web and mobile
export const PLAN_UPDATED_EVENT = 'plan_updated';

// Helper function to dispatch plan updated event that works on both web and mobile
const dispatchPlanUpdatedEvent = () => {
  console.log('Dispatching plan_updated event');
  // Use custom event for web
  if (typeof document !== 'undefined') {
    const event = new CustomEvent(PLAN_UPDATED_EVENT);
    document.dispatchEvent(event);
  }
  // For React Native, we'll rely on the useEffect in useGroceryList
};

// Defined in ../types; re-exported so existing `import { Plan } from
// '../context/PlannerContext'` call sites keep working.
import type { Plan } from '../types';

export type { Plan };

interface PlannerContextType {
  plans: Plan[];
  activePlanId: string | null;
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<Plan>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<Plan | null>;
  deletePlan: (id: string) => Promise<boolean>;
  setActivePlan: (id: string | null) => Promise<void>;
  addRecipeToPlan: (planId: string, recipeId: string) => Promise<boolean>;
  removeRecipeFromPlan: (planId: string, recipeId: string) => Promise<boolean>;
  getPlanById: (id: string) => Plan | undefined;
}

const defaultContext: PlannerContextType = {
  plans: [],
  activePlanId: null,
  addPlan: async () => ({ id: '', recipeIds: [] }),
  updatePlan: async () => null,
  deletePlan: async () => false,
  setActivePlan: async () => {},
  addRecipeToPlan: async () => false,
  removeRecipeFromPlan: async () => false,
  getPlanById: () => undefined,
};

export const PlannerContext = createContext<PlannerContextType>(defaultContext);

/** snake_case database row -> camelCase Plan used throughout the UI. */
type PlanRow = {
  id: string;
  name: string | null;
  recipe_ids: string[] | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
};

const rowToPlan = (row: PlanRow): Plan => ({
  id: row.id,
  recipeIds: row.recipe_ids ?? [],
  name: row.name ?? undefined,
  startDate: row.start_date ?? undefined,
  endDate: row.end_date ?? undefined,
  isActive: row.is_active ?? false,
});

const PLAN_COLUMNS = 'id, name, recipe_ids, start_date, end_date, is_active';

export const PlannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger plan updated event whenever plans or activePlanId change
  useEffect(() => {
    if (!isLoading) {
      dispatchPlanUpdatedEvent();
    }
  }, [plans, activePlanId, isLoading]);

  // Load plans on sign-in; clear them on sign-out.
  useEffect(() => {
    let active = true;

    if (!user) {
      setPlans([]);
      setActivePlanId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    supabase
      .from('plans')
      .select(PLAN_COLUMNS)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Failed to load plans:', error.message);
        } else {
          const loaded = (data ?? []).map((row) => rowToPlan(row as PlanRow));
          setPlans(loaded);
          setActivePlanId(loaded.find((p) => p.isActive)?.id ?? null);
        }
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const addPlan = useCallback(
    async (plan: Omit<Plan, 'id'>): Promise<Plan> => {
      console.log('Adding plan:', plan);

      if (!user) {
        const newPlan = { ...plan, id: generateId() };
        setPlans((prev) => {
          if (prev.length === 0) setActivePlanId(newPlan.id);
          return [...prev, newPlan];
        });
        return newPlan;
      }

      const { data, error } = await supabase
        .from('plans')
        .insert({
          name: plan.name ?? null,
          recipe_ids: plan.recipeIds ?? [],
          start_date: plan.startDate ?? null,
          end_date: plan.endDate ?? null,
        })
        .select(PLAN_COLUMNS)
        .single();

      if (error || !data) {
        console.error('Failed to add plan:', error?.message);
        return { ...plan, id: '' };
      }

      const newPlan = rowToPlan(data as PlanRow);
      setPlans((prev) => [...prev, newPlan]);
      return newPlan;
    },
    [user],
  );

  const updatePlan = useCallback(
    async (id: string, updates: Partial<Plan>): Promise<Plan | null> => {
      console.log('Updating plan:', id, updates);

      if (user) {
        // Only send the columns the caller actually changed.
        const patch: Record<string, unknown> = {};
        if (updates.name !== undefined) patch.name = updates.name;
        if (updates.recipeIds !== undefined) patch.recipe_ids = updates.recipeIds;
        if (updates.startDate !== undefined) patch.start_date = updates.startDate;
        if (updates.endDate !== undefined) patch.end_date = updates.endDate;
        if (updates.isActive !== undefined) patch.is_active = updates.isActive;

        if (Object.keys(patch).length > 0) {
          const { error } = await supabase.from('plans').update(patch).eq('id', id);
          if (error) {
            console.error('Failed to update plan:', error.message);
            return null;
          }
        }
      }

      let updatedPlan: Plan | null = null;
      setPlans((prev) => {
        const index = prev.findIndex((p) => p.id === id);
        if (index === -1) return prev;
        const updated = { ...prev[index], ...updates };
        updatedPlan = updated;
        const copy = [...prev];
        copy[index] = updated;
        return copy;
      });
      return updatedPlan;
    },
    [user],
  );

  const deletePlan = useCallback(
    async (id: string): Promise<boolean> => {
      console.log('Deleting plan:', id);

      if (user) {
        const { error } = await supabase.from('plans').delete().eq('id', id);
        if (error) {
          console.error('Failed to delete plan:', error.message);
          return false;
        }
      }

      let found = false;
      setPlans((prev) => {
        const index = prev.findIndex((p) => p.id === id);
        if (index === -1) return prev;
        found = true;
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      });
      if (activePlanId === id) setActivePlanId(null);
      return found;
    },
    [user, activePlanId],
  );

  const setActivePlan = useCallback(
    async (id: string | null) => {
      console.log('Setting active plan:', id);
      if (id !== null && !plans.find((p) => p.id === id)) throw new Error('Plan not found');

      if (user) {
        // Clear the previous flag first so at most one plan is ever active.
        const { error: clearError } = await supabase
          .from('plans')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
        if (clearError) console.error('Failed to clear active plan:', clearError.message);

        if (id !== null) {
          const { error } = await supabase.from('plans').update({ is_active: true }).eq('id', id);
          if (error) {
            console.error('Failed to set active plan:', error.message);
            return;
          }
        }
        setPlans((prev) => prev.map((p) => ({ ...p, isActive: p.id === id })));
      }

      setActivePlanId(id);
    },
    [user, plans],
  );

  const addRecipeToPlan = useCallback(
    async (planId: string, recipeId: string) => {
      console.log('Adding recipe to plan:', planId, recipeId);

      const plan = plans.find((p) => p.id === planId);
      if (!plan || plan.recipeIds.includes(recipeId)) return false;

      const nextIds = [...plan.recipeIds, recipeId];
      if (user) {
        const { error } = await supabase
          .from('plans')
          .update({ recipe_ids: nextIds })
          .eq('id', planId);
        if (error) {
          console.error('Failed to add recipe to plan:', error.message);
          return false;
        }
      }

      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, recipeIds: nextIds } : p)));
      return true;
    },
    [user, plans],
  );

  const removeRecipeFromPlan = useCallback(
    async (planId: string, recipeId: string) => {
      console.log('Removing recipe from plan:', planId, recipeId);

      const plan = plans.find((p) => p.id === planId);
      if (!plan) return false;

      const nextIds = plan.recipeIds.filter((id) => id !== recipeId);
      if (user) {
        const { error } = await supabase
          .from('plans')
          .update({ recipe_ids: nextIds })
          .eq('id', planId);
        if (error) {
          console.error('Failed to remove recipe from plan:', error.message);
          return false;
        }
      }

      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, recipeIds: nextIds } : p)));
      return true;
    },
    [user, plans],
  );

  const getPlanById = (id: string) => plans.find((p) => p.id === id);

  return (
    <PlannerContext.Provider
      value={{
        plans,
        activePlanId,
        addPlan,
        updatePlan,
        deletePlan,
        setActivePlan,
        addRecipeToPlan,
        removeRecipeFromPlan,
        getPlanById,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};
