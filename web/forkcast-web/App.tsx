import AppNavigator from './src/navigation';
import { RecipesProvider } from './src/context/RecipesContext';
import { PantryProvider } from './src/context/PantryContext';

export default function App() {
  return (
    <PantryProvider>
      <RecipesProvider>
        <AppNavigator />
      </RecipesProvider>
    </PantryProvider>
  );
}
