// src/screens/PlannerScreen.tsx

import React, { useContext, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecipesContext } from '../context/RecipesContext';
import fallbackRecipes from '../data/fallbackRecipes';
import screenStyles from '../styles/screenStyle';

export default function PlannerScreen() {
  const { selectedIds } = useContext(RecipesContext);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const selected = fallbackRecipes.filter((r) => selectedIds.has(r.id));

  return (
    <View style={screenStyles.container}>
      <Button
        title={`Change Date: ${selectedDate.toDateString()}`}
        onPress={() => setShowPicker(true)}
      />

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <Text style={{ marginTop: 16, fontWeight: 'bold' }}>
        Planned Recipes for {selectedDate.toDateString()}
      </Text>

      {selected.length === 0 ? (
        <Text>No recipes selected for this timeframe.</Text>
      ) : (
        <FlatList
          data={selected}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text>🍽 {item.title}</Text>}
        />
      )}
    </View>
  );
}
