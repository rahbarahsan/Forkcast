import AppNavigator from './src/navigation/index';
import { RecipesProvider } from './src/context/RecipesContext';
import { PantryProvider } from './src/context/PantryContext';
import { PlannerProvider } from './src/context/PlannerContext';

export default function App() {
  return (
    <PantryProvider>
      <RecipesProvider>
        <PlannerProvider>
          <AppNavigator />
        </PlannerProvider>
      </RecipesProvider>
    </PantryProvider>
  );
}
