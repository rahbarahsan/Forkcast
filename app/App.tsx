import AppNavigator from './src/navigation/index';
import { AuthProvider } from './src/context/AuthContext';
import { RecipesProvider } from './src/context/RecipesContext';
import { PantryProvider } from './src/context/PantryContext';
import { PlannerProvider } from './src/context/PlannerContext';

export default function App() {
  return (
    // AuthProvider is outermost: the pantry and planner providers read the
    // session to decide whether to persist to Supabase or stay in memory.
    <AuthProvider>
      <PantryProvider>
        <RecipesProvider>
          <PlannerProvider>
            <AppNavigator />
          </PlannerProvider>
        </RecipesProvider>
      </PantryProvider>
    </AuthProvider>
  );
}
