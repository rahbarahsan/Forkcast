import React, { createContext, useState } from 'react';
import { PantryItem } from '../types';

interface PantryContextType {
  items: PantryItem[];
  addItem: (item: PantryItem) => void;
  resetPantry: () => void;
}

export const PantryContext = createContext<PantryContextType>({
  items: [],
  addItem: () => {},
  resetPantry: () => {},
});

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PantryItem[]>([]);

  const addItem = (item: PantryItem) => {
    setItems((prev) => [...prev, item]);
  };

  const resetPantry = () => {
    setItems([]);
  };

  return (
    <PantryContext.Provider value={{ items, addItem, resetPantry }}>
      {children}
    </PantryContext.Provider>
  );
};
