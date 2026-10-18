import { shareText } from '../lib/export';
import React from 'react';
import { Text, View } from 'react-native';
import { useHousehold } from '../context/HouseholdContext';
import { Button, DeleteButton, Page, ui } from '../components/ui';
export default function HistoryScreen() {
  const { history, mutate } = useHousehold();
  return (
    <Page
      title="Your kitchen history"
      description="Saved shopping lists keep a snapshot, even when your recipes or pantry change."
    >
      {!history.length && <Text style={ui.text}>Save a grocery list to see it here.</Text>}
      {history.map((entry) => (
        <View key={entry.id} style={ui.card}>
          <Text style={ui.heading}>{entry.name}</Text>
          <Text style={ui.subtitle}>
            {new Date(entry.created_at).toLocaleString()} - {entry.checked.length} collected
          </Text>
          {Object.entries(entry.grocery_list.categorized).map(([category, names]) => (
            <View key={category}>
              <Text style={ui.label}>{category}</Text>
              <Text style={ui.text}>
                {names
                  .map((name) => (entry.checked.includes(name) ? '[x] ' : '') + name)
                  .join(', ')}
              </Text>
            </View>
          ))}
          <View style={ui.row}>
            <Button
              title="Share saved list"
              secondary
              onPress={async () => {
                await shareText(
                  entry.name,
                  entry.name + '\n' + Object.keys(entry.grocery_list.raw).join('\n'),
                );
              }}
            />
            <DeleteButton
              title="Delete saved list"
              onDelete={() => mutate('/history/' + entry.id, 'DELETE')}
            />
          </View>
        </View>
      ))}
    </Page>
  );
}
