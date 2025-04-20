import React, { createContext, useState, useContext, useEffect } from 'react';
import { PantryItem } from '../types';

// Custom event for pantry changes that works on both web and mobile
export const PANTRY_UPDATED_EVENT = 'pantry_updated';

interface PantryContextType {
  items: PantryItem[];
  addItem: (item: PantryItem) => void;
  removeItem: (id: string) => void;
  resetPantry: () => void;
}

export const PantryContext = createContext<PantryContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  resetPantry: () => {},
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
  const [items, setItems] = useState<PantryItem[]>([]);

  // Trigger pantry updated event whenever items change
  useEffect(() => {
    console.log('PantryContext - items changed:', items);
    dispatchPantryUpdatedEvent();
  }, [items]);

  const addItem = (item: PantryItem) => {
    console.log('Adding pantry item:', item);
    // Ensure the item has an id
    const itemWithId = item.id ? item : { ...item, id: Date.now().toString() };
    console.log('Adding pantry item with ID:', itemWithId);
    setItems((prev) => [...prev, itemWithId]);
  };

  const removeItem = (id: string) => {
    console.log('Removing pantry item with id:', id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetPantry = () => {
    console.log('Resetting pantry');
    setItems([]);
  };

  return (
    <PantryContext.Provider value={{ items, addItem, removeItem, resetPantry }}>
      {children}
    </PantryContext.Provider>
  );
};
