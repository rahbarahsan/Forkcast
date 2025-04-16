import React, { createContext, useState, useContext } from 'react';
import { PantryItem } from '../types';

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

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PantryItem[]>([]);

  const addItem = (item: PantryItem) => {
    setItems((prev) => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetPantry = () => {
    setItems([]);
  };

  return (
    <PantryContext.Provider value={{ items, addItem, removeItem, resetPantry }}>
      {children}
    </PantryContext.Provider>
  );
};
