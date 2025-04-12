import { View, Text } from 'react-native';
import screenStyles from '../styles/screenStyle';

export default function GroceryListScreen() {
  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.heading}>🛒 Grocery List Screen</Text>
    </View>
  );
}
