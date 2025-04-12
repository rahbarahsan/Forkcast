import { View, Text } from 'react-native';
import screenStyles from '../styles/screenStyle';

export default function RecipesScreen() {
  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.heading}>📖 Recipes Screen</Text>
    </View>
  );
}
