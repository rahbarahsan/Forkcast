import React from 'react';
import { Text, View } from 'react-native';
import AppNavigator from './src/navigation';
import { HouseholdProvider, useHousehold } from './src/context/HouseholdContext';
import { Button, ui } from './src/components/ui';

function Content() {
  const { error, loading, refresh } = useHousehold();
  if (loading)
    return (
      <View style={ui.content}>
        <Text>Opening your kitchen?</Text>
      </View>
    );
  if (error)
    return (
      <View style={ui.content}>
        <Text style={ui.title}>Connect to your kitchen</Text>
        <Text style={ui.text}>Start the local Forkcast backend on port 8000, then try again.</Text>
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
        <Button title="Try again" onPress={refresh} />
      </View>
    );
  return <AppNavigator />;
}
export default function App() {
  return (
    <HouseholdProvider>
      <Content />
    </HouseholdProvider>
  );
}
