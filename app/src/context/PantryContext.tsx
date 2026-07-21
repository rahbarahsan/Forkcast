import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { PantryItem } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// Custom event for pantry changes that works on both web and mobile
export const PANTRY_UPDATED_EVENT = 'pantry_updated';

interface PantryContextType {
  items: PantryItem[];
  addItem: (item: PantryItem) => void;
  removeItem: (id: string) => void;
  resetPantry: () => void;
  /** True while the signed-in user's pantry is being fetched. */
  loading: boolean;
}

export const PantryContext = createContext<PantryContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  resetPantry: () => {},
  loading: false,
});

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (context === undefined) {
    throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
};

// Helper function to dispatch pantry updated event that works on both web and mobile
const dispatchPantryUpdatedEvent = () => {
  console.log('Dispatching pantry_updated event');
  // Use custom event for web
  if (typeof document !== 'undefined') {
    const event = new CustomEvent(PANTRY_UPDATED_EVENT);
    document.dispatchEvent(event);
  }
  // For React Native, we'll rely on the useEffect in useGroceryList
};

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Trigger pantry updated event whenever items change
  useEffect(() => {
    console.log('PantryContext - items changed:', items);
    dispatchPantryUpdatedEvent();
  }, [items]);

  // Load the pantry when a user signs in; clear it when they sign out so one
  // account's items never bleed into the next session.
  useEffect(() => {
    let active = true;

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('pantry')
      .select('id, name, quantity')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('Failed to load pantry:', error.message);
        } else {
          setItems((data ?? []) as PantryItem[]);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const addItem = useCallback(
    async (item: PantryItem) => {
      // Guests keep an in-memory pantry; nothing to persist.
      if (!user) {
        const itemWithId = item.id ? item : { ...item, id: Date.now().toString() };
        setItems((prev) => [...prev, itemWithId]);
        return;
      }

      // Let Postgres mint the id (and user_id, which defaults to auth.uid()).
      const { data, error } = await supabase
        .from('pantry')
        .insert({ name: item.name, quantity: item.quantity })
        .select('id, name, quantity')
        .single();

      if (error) {
        console.error('Failed to add pantry item:', error.message);
        return;
      }
      setItems((prev) => [...prev, data as PantryItem]);
    },
    [user],
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!user) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        return;
      }

      const { error } = await supabase.from('pantry').delete().eq('id', id);
      if (error) {
        console.error('Failed to remove pantry item:', error.message);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [user],
  );

  const resetPantry = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    // RLS scopes this to the current user, but filter explicitly so the intent
    // is readable and a policy change can never widen the blast radius.
    const { error } = await supabase.from('pantry').delete().eq('user_id', user.id);
    if (error) {
      console.error('Failed to reset pantry:', error.message);
      return;
    }
    setItems([]);
  }, [user]);

  return (
    <PantryContext.Provider value={{ items, addItem, removeItem, resetPantry, loading }}>
      {children}
    </PantryContext.Provider>
  );
};
