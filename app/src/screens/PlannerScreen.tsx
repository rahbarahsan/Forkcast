import { shareText } from '../lib/export';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useHousehold } from '../context/HouseholdContext';
import { Button, DeleteButton, Field, Page, ui } from '../components/ui';
export function PlannerScreen() {
  const { plans, recipes, selected, setSelected, mutate } = useHousehold();
  const [name, setName] = useState('This week');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Page
      title="A plan for your week"
      description="Select recipes in the collection, then save them together. Your active plan feeds the grocery list."
    >
      <View style={ui.card}>
        <Field label="Plan name" value={name} onChangeText={setName} />
        <Field label="Start date (YYYY-MM-DD, optional)" value={start} onChangeText={setStart} />
        <Field label="End date (YYYY-MM-DD, optional)" value={end} onChangeText={setEnd} />
        <Text style={ui.text}>{selected.length} selected recipes</Text>
        <Button
          title={editing ? 'Save plan changes' : 'Save meal plan'}
          disabled={!selected.length || !name.trim()}
          onPress={async () => {
            await mutate(editing ? '/plans/' + editing : '/plans', editing ? 'PUT' : 'POST', {
              name,
              recipeIds: selected,
              startDate: start || null,
              endDate: end || null,
              isActive: editing ? Boolean(plans.find((p) => p.id === editing)?.isActive) : false,
            });
            setEditing(null);
          }}
        />
        {editing && (
          <Button
            title="Cancel plan edit"
            secondary
            onPress={() => {
              setEditing(null);
              setName('This week');
              setStart('');
              setEnd('');
            }}
          />
        )}
      </View>
      {!plans.length && (
        <Text style={ui.subtitle}>No plans yet. Choose recipes to get started.</Text>
      )}
      {plans.map((plan) => (
        <View key={plan.id} style={ui.card}>
          <Text style={ui.heading}>
            {plan.name}
            {plan.isActive ? ' - Active' : ''}
          </Text>
          <Text style={ui.subtitle}>
            {[plan.startDate, plan.endDate].filter(Boolean).join(' to ')}
          </Text>
          {plan.recipeIds.map((id) => (
            <Text key={id} style={ui.text}>
              {recipes.find((r) => r.id === id)?.title || 'Recipe removed'}
            </Text>
          ))}
          <View style={ui.row}>
            <Button
              title="Edit plan"
              secondary
              onPress={() => {
                setEditing(plan.id);
                setName(plan.name || 'Meal plan');
                setStart(plan.startDate || '');
                setEnd(plan.endDate || '');
                setSelected(plan.recipeIds);
              }}
            />
            <Button
              title="Use this plan"
              secondary
              disabled={plan.isActive}
              onPress={() => mutate('/plans/active', 'PUT', { id: plan.id })}
            />
            <Button
              title="Share plan"
              secondary
              onPress={async () => {
                await shareText(
                  plan.name || 'Meal plan',
                  `${plan.name}\n${plan.recipeIds
                    .map((id) => {
                      const recipe = recipes.find((r) => r.id === id);
                      return recipe
                        ? `${recipe.title}\nIngredients\n${recipe.ingredients.join('\n')}\nInstructions\n${recipe.instructions}`
                        : null;
                    })
                    .filter(Boolean)
                    .join('\n')}`,
                );
              }}
            />
            <DeleteButton
              title="Delete plan"
              onDelete={() => mutate('/plans/' + plan.id, 'DELETE')}
            />
          </View>
        </View>
      ))}
    </Page>
  );
}
