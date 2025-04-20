import React, { createContext, useState } from 'react';

interface RecipeContextType {
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  setSelectedIds: (ids: Set<string>) => void;
}

export const RecipesContext = createContext<RecipeContextType>({
  selectedIds: new Set(),
  toggleSelection: () => {},
  setSelectedIds: () => {},
});

export const RecipesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (newSet.size >= 15) return newSet; // hidden limit
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <RecipesContext.Provider value={{ selectedIds, toggleSelection, setSelectedIds }}>
      {children}
    </RecipesContext.Provider>
  );
};
