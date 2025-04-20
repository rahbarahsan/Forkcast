import React, { createContext, useState, useEffect, ReactNode } from 'react';

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

export interface Plan {
  id: string;
  recipeIds: string[];
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

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

export const PlannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trigger plan updated event whenever plans or activePlanId change
  useEffect(() => {
    if (!isLoading) {
      dispatchPlanUpdatedEvent();
    }
  }, [plans, activePlanId, isLoading]);

  // Initialize with empty state and no loading from storage
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const addPlan = async (plan: Omit<Plan, 'id'>): Promise<Plan> => {
    console.log('Adding plan:', plan);
    const newPlan = { ...plan, id: generateId() };
    setPlans((prev) => [...prev, newPlan]);
    if (plans.length === 0) setActivePlanId(newPlan.id);
    return newPlan;
  };

  const updatePlan = async (id: string, updates: Partial<Plan>): Promise<Plan | null> => {
    console.log('Updating plan:', id, updates);
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
  };

  const deletePlan = async (id: string): Promise<boolean> => {
    console.log('Deleting plan:', id);
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
  };

  const setActivePlan = async (id: string | null) => {
    console.log('Setting active plan:', id);
    if (id !== null && !plans.find((p) => p.id === id)) throw new Error('Plan not found');
    setActivePlanId(id);
  };

  const addRecipeToPlan = async (planId: string, recipeId: string) => {
    console.log('Adding recipe to plan:', planId, recipeId);
    let success = false;
    setPlans((prev) => {
      const i = prev.findIndex((p) => p.id === planId);
      if (i === -1 || prev[i].recipeIds.includes(recipeId)) return prev;
      const copy = [...prev];
      copy[i] = { ...copy[i], recipeIds: [...copy[i].recipeIds, recipeId] };
      success = true;
      return copy;
    });
    return success;
  };

  const removeRecipeFromPlan = async (planId: string, recipeId: string) => {
    console.log('Removing recipe from plan:', planId, recipeId);
    let success = false;
    setPlans((prev) => {
      const i = prev.findIndex((p) => p.id === planId);
      if (i === -1) return prev;
      const copy = [...prev];
      copy[i] = {
        ...copy[i],
        recipeIds: copy[i].recipeIds.filter((id) => id !== recipeId),
      };
      success = true;
      return copy;
    });
    return success;
  };

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
