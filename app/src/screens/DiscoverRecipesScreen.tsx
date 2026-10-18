import { ExtractPanel } from '../components/ExtractPanel';
import { YouTubePanel } from '../components/YouTubePanel';
import React, { useEffect, useState } from 'react';
import { Linking, Text, useWindowDimensions, View } from 'react-native';
import { RecipeRow, useHousehold } from '../context/HouseholdContext';
import { api, json } from '../lib/api';
import { Button, DeleteButton, Field, Page, ui } from '../components/ui';
import { RecipePhoto } from '../components/RecipePhoto';

export default function DiscoverScreen() {
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState('');
  const { recipes, pantry, selected, setSelected, mutate } = useHousehold();
  const [query, setQuery] = useState('');
  const [suggested, setSuggested] = useState<
    { recipe_id: string; coverage: number; available: string[]; missing: string[] }[]
  >([]);
  const [pantryFirst, setPantryFirst] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    api<typeof suggested>('/suggestions', { signal: controller.signal })
      .then(setSuggested)
      .catch(() => {});
    return () => controller.abort();
  }, [recipes, pantry]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [cuisine, setCuisine] = useState('Home cooking');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prep, setPrep] = useState('');
  const [cook, setCook] = useState('');
  const [importText, setImportText] = useState('');
  const [provenance, setProvenance] = useState<Partial<RecipeRow>>({});
  const loadForm = (recipe: Partial<RecipeRow>) => {
    setProvenance({
      image: recipe.image || 'placeholder',
      source_url: recipe.source_url || '',
      source_name: recipe.source_name || '',
      halal_notes: recipe.halal_notes || '',
      source_notes: recipe.source_notes || '',
      servings: recipe.servings || 4,
    });
    setTitle(recipe.title || '');
    setCuisine(recipe.cuisine || 'Home cooking');
    setIngredients(recipe.ingredients?.join('\n') || '');
    setInstructions(recipe.instructions || '');
    setPrep(recipe.prep_time || '');
    setCook(recipe.cook_time || '');
    setShowForm(true);
  };
  return (
    <Page
      title="Your recipe collection"
      description="Pick a few favorites, then build a plan. Everything you add is saved locally."
    >
      <YouTubePanel
        onPreview={(recipe) => {
          setEditing(null);
          loadForm(recipe);
        }}
      />
      <ExtractPanel
        task="recipe"
        onPreview={(recipe: Partial<RecipeRow>) => {
          setEditing(null);
          loadForm(recipe);
        }}
      />
      <View style={ui.row}>
        <Button
          title="Add recipe"
          onPress={() => {
            setEditing(null);
            loadForm({});
          }}
        />
        <Button
          title="Import recipe"
          secondary
          onPress={() => {
            setEditing(null);
            setShowForm(true);
          }}
        />
      </View>
      {showForm && (
        <View style={ui.card}>
          <Text style={ui.heading}>{editing ? 'Edit your recipe' : 'Add to your kitchen'}</Text>
          <Field
            label="Paste recipe text or JSON (optional)"
            value={importText}
            onChangeText={setImportText}
            multiline
            placeholder="Title, Ingredients, Instructions"
          />
          <Button
            title="Preview import"
            secondary
            disabled={!importText.trim()}
            onPress={async () =>
              loadForm(await api<RecipeRow>('/import/recipe', json('POST', { text: importText })))
            }
          />
          <Field label="Recipe title" value={title} onChangeText={setTitle} />
          <Field label="Cuisine" value={cuisine} onChangeText={setCuisine} />
          <Field
            label="Ingredients (one per line)"
            value={ingredients}
            onChangeText={setIngredients}
            multiline
          />
          <Field
            label="Instructions"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
          <Field label="Prep time" value={prep} onChangeText={setPrep} />
          <Field label="Cook time" value={cook} onChangeText={setCook} />
          <View style={ui.row}>
            <Button
              title="Save recipe"
              disabled={!title.trim() || !ingredients.trim() || !instructions.trim()}
              onPress={async () => {
                await mutate(
                  editing ? '/recipes/' + editing : '/recipes',
                  editing ? 'PUT' : 'POST',
                  {
                    ...provenance,
                    title,
                    cuisine,
                    ingredients: ingredients
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    instructions,
                    prep_time: prep,
                    cook_time: cook,
                  },
                );
                setShowForm(false);
                setImportText('');
              }}
            />
            <Button title="Cancel editing" secondary onPress={() => setShowForm(false)} />
          </View>
        </View>
      )}
      <Field label="Search recipes or ingredients" value={query} onChangeText={setQuery} />
      <View style={ui.row}>
        <Text style={ui.subtitle}>{selected.length} selected</Text>
        <Button
          title={pantryFirst ? 'Sort by title' : 'Suggest from my pantry'}
          secondary
          onPress={() => setPantryFirst(!pantryFirst)}
        />
      </View>
      <View style={ui.row}>
        <Button
          title="All cuisines"
          secondary={!!cuisineFilter}
          onPress={() => setCuisineFilter('')}
        />
        {[...new Set(recipes.map((recipe) => recipe.cuisine))].sort().map((cuisine) => (
          <Button
            key={cuisine}
            title={cuisine}
            secondary={cuisineFilter !== cuisine}
            onPress={() => setCuisineFilter(cuisineFilter === cuisine ? '' : cuisine)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' }}>
        {[...recipes]
          .sort((a, b) =>
            pantryFirst
              ? (suggested.find((s) => s.recipe_id === b.id)?.coverage || 0) -
                (suggested.find((s) => s.recipe_id === a.id)?.coverage || 0)
              : a.title.localeCompare(b.title),
          )
          .filter(
            (r) =>
              (!cuisineFilter || r.cuisine === cuisineFilter) &&
              (r.title + r.cuisine + r.ingredients.join(' '))
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((recipe) => (
            <View
              key={recipe.id}
              style={[ui.card, { width: width >= 1050 ? '48.6%' : '100%', minWidth: 0 }]}
            >
              <RecipePhoto title={recipe.title} cuisine={recipe.cuisine} image={recipe.image} />
              <Text style={ui.heading}>{recipe.title}</Text>
              <Text style={ui.subtitle}>
                {suggested.find((s) => s.recipe_id === recipe.id)?.available.length || 0}{' '}
                ingredients already in your pantry
              </Text>
              <Text style={ui.subtitle}>
                {recipe.cuisine} - Prep {recipe.prep_time || 'not specified'} - Cook{' '}
                {recipe.cook_time || 'not specified'}
              </Text>
              <Button
                title={selected.includes(recipe.id) ? 'Remove from selection' : 'Select recipe'}
                secondary={selected.includes(recipe.id)}
                onPress={() =>
                  setSelected((ids) =>
                    ids.includes(recipe.id)
                      ? ids.filter((id) => id !== recipe.id)
                      : [...ids, recipe.id],
                  )
                }
              />
              <Button
                title={expanded === recipe.id ? 'Close recipe details' : 'View recipe details'}
                secondary
                onPress={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
              />
              {expanded === recipe.id && (
                <>
                  <Text style={ui.heading}>Ingredients · serves {recipe.servings || 4}</Text>
                  <Text style={ui.text}>{recipe.ingredients.join('\n')}</Text>
                  <Text style={ui.heading}>Make it</Text>
                  <Text style={ui.text}>{recipe.instructions}</Text>
                  {!!recipe.halal_notes && <Text style={ui.chip}>{recipe.halal_notes}</Text>}
                  {!!recipe.source_notes && <Text style={ui.subtitle}>{recipe.source_notes}</Text>}
                  {!!recipe.source_url && (
                    <Button
                      title={'Original recipe · ' + (recipe.source_name || 'publisher')}
                      secondary
                      onPress={() => Linking.openURL(recipe.source_url!)}
                    />
                  )}
                </>
              )}
              <View style={ui.row}>
                <Button
                  title="Edit recipe"
                  secondary
                  onPress={() => {
                    setEditing(recipe.id);
                    loadForm(recipe);
                  }}
                />
                {recipe.source === 'personal' && (
                  <DeleteButton
                    title="Delete personal recipe"
                    onDelete={() => mutate('/recipes/' + recipe.id, 'DELETE')}
                  />
                )}
              </View>
            </View>
          ))}
      </View>
    </Page>
  );
}
