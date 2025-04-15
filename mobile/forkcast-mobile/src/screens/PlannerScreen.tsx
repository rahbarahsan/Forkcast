// src/screens/PlannerScreen.tsx
import React, { useContext, useState } from 'react';
import { View, Text, FlatList, Button, TouchableOpacity, Platform } from 'react-native';
import { createElement } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecipesContext } from '../context/RecipesContext';
import fallbackRecipes from '../data/fallbackRecipes';
import screenStyles from '../styles/screenStyle';
import PlannerCard from '../components/PlannerCard';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import { useRecipes } from '../hooks/useRecipes';

export default function PlannerScreen() {
  const { selectedIds } = useContext(RecipesContext);
  const { recipes } = useRecipes();
  const selected = recipes.filter((r) => selectedIds.has(r.id));

  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);

  const [showAlert, setShowAlert] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAddPlan = () => {
    if (selected.length === 0) {
      setShowAlert(true);
      return;
    }
    setShowConfirm(true);
  };

  const renderHeader = () => (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        📅 Select Planning Dates
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        {/* Start Date */}
        <View>
          <Text>Start Date:</Text>
          {Platform.OS === 'web' ? (
            <View style={webDateInputStyle}>
              {createElement('input', {
                type: 'date',
                value: startDate.toISOString().substring(0, 10),
                onChange: (e: any) => setStartDate(new Date(e.target.value)),
                style: {
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                },
              })}
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                <Text style={dateTextStyle}>{startDate.toDateString()}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* End Date */}
        <View>
          <Text>End Date:</Text>
          {Platform.OS === 'web' ? (
            <View style={webDateInputStyle}>
              {createElement('input', {
                type: 'date',
                value: endDate.toISOString().substring(0, 10),
                onChange: (e: any) => setEndDate(new Date(e.target.value)),
                style: {
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                },
              })}
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                <Text style={dateTextStyle}>{endDate.toDateString()}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(e, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 8 }}>
        📝 Selected Recipes ({selected.length})
      </Text>

      {selected.length === 0 ? (
        <Text>No recipes selected yet.</Text>
      ) : (
        selected.map((item) => (
          <View key={item.id} style={recipeCardStyle}>
            <Text style={{ fontWeight: 'bold' }}>🍽 {item.title}</Text>
            <Text>{item.ingredients.length} ingredients</Text>
          </View>
        ))
      )}

      <View style={{ marginVertical: 10 }}>
        <Button title="➕ Add to Plan" onPress={handleAddPlan} />
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 10 }}>
        📖 Your Meal Plans
      </Text>
    </View>
  );

  return (
    <>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlannerCard
            id={item.id}
            startDate={item.startDate}
            endDate={item.endDate}
            recipes={item.recipes}
            onDelete={(id) => setPlans(plans.filter((plan) => plan.id !== id))}
          />
        )}
        contentContainerStyle={screenStyles.container}
      />

      <AlertDialog
        visible={showAlert}
        message="Please select recipes from Discover first."
        onClose={() => setShowAlert(false)}
      />

      <ConfirmDialog
        visible={showConfirm}
        message={`Add ${selected.length} recipes from ${startDate.toDateString()} to ${endDate.toDateString()}?`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setPlans([
            ...plans,
            {
              id: Date.now().toString(),
              recipes: selected,
              startDate,
              endDate,
            },
          ]);
          setShowConfirm(false);
        }}
      />
    </>
  );
}

const webDateInputStyle = {
  padding: 8,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
  borderColor: '#ccc',
  borderWidth: 1,
  width: 160,
  marginTop: 4,
};

const dateTextStyle = {
  padding: 8,
  backgroundColor: '#e0e0e0',
  borderRadius: 5,
  marginTop: 4,
};

const recipeCardStyle = {
  padding: 10,
  backgroundColor: '#fafafa',
  borderRadius: 8,
  marginVertical: 5,
  borderColor: '#eee',
  borderWidth: 1,
};
