import { useEffect, useState } from 'react';
import fallbackRecipes from '../data/fallbackRecipes';

export function useRecipes() {
  const [recipes, setRecipes] = useState(fallbackRecipes);
  const [isFallback, setIsFallback] = useState(true);

  const BACKEND_URL = 'https://forkcast-backend.onrender.com/api/recipes';

  useEffect(() => {
    try {
      const validatedURL = new URL(BACKEND_URL).toString();
      console.log('🌐 Fetching from:', validatedURL);

      fetch(validatedURL)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map((r) => ({
              ...r,
              ingredients: Array.isArray(r.ingredients)
                ? r.ingredients
                : typeof r.ingredients === 'string'
                  ? r.ingredients.split(';').map((i: string) => i.trim())
                  : [],
            }));
            setRecipes(normalized);
            setIsFallback(false);
          } else {
            fallbackLoad();
          }
        })
        .catch((err) => {
          console.error('❌ Fetch failed:', err.message);
          fallbackLoad();
        });
    } catch (e) {
      console.error('❌ URL validation failed:', BACKEND_URL, e);
      fallbackLoad();
    }
  }, []);

  function fallbackLoad() {
    setRecipes(
      fallbackRecipes.map((r) => ({
        ...r,
        title: `Fb: ${r.title}`,
      })),
    );
    setIsFallback(true);
  }

  return { recipes, isFallback };
}
