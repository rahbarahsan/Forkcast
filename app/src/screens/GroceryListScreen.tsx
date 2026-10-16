import { shareText, downloadText } from '../lib/export';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { GroceryList, useHousehold } from '../context/HouseholdContext';
import { api, json } from '../lib/api';
import { Button, CheckItem, Page, ui } from '../components/ui';
import { storage } from '../utils/storage';

interface Insight {
  name: string;
  lookup: { canonical: string; category: string; synonyms: string } | null;
  recipes: { id: string; title: string; lines: string[] }[];
  quantity_note: string;
}
export default function GroceryScreen() {
  const { plans, pantry, selected, mutate } = useHousehold();
  const [mode, setMode] = useState('active');
  const [insight, setInsight] = useState<Insight | null>(null);
  const active = plans.find((p) => p.isActive);
  const ids = useMemo(
    () =>
      mode === 'selected'
        ? selected
        : mode === 'all'
          ? [...new Set(plans.flatMap((p) => p.recipeIds))]
          : active?.recipeIds || [],
    [mode, selected, plans],
  );
  const key = JSON.stringify([...ids].sort());
  const [list, setList] = useState<GroceryList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setList(null);
    api<GroceryList>('/grocery-list', {
      ...json('POST', { recipe_ids: ids }),
      signal: controller.signal,
    })
      .then(async (data) => {
        const saved = await storage.getItem('forkcast:checklist:' + key);
        if (!controller.signal.aborted) {
          setList(data);
          setChecked(saved ? JSON.parse(saved).filter((name: string) => name in data.raw) : []);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [key, pantry]);
  const text = list
    ? [
        'Forkcast shopping list',
        ...Object.entries(list.categorized).flatMap(([category, names]) => [
          '',
          category,
          ...names.map(
            (n) =>
              `${checked.includes(n) ? '[x]' : '[ ]'} ${n} - ${Object.entries(list.raw[n])
                .map(([u, q]) => (q ? `${q} ${u}` : 'to taste'))
                .join(' + ')}`,
          ),
        ]),
      ].join('\n')
    : '';
  return (
    <Page
      title="One sensible shopping list"
      description="Choose your active plan, all plans, or the recipes currently selected in your collection."
    >
      <View style={ui.row}>
        {[
          ['active', 'Active plan'],
          ['all', 'All plans'],
          ['selected', 'Selected recipes'],
        ].map(([value, label]) => (
          <Button
            key={value}
            title={label}
            secondary={mode !== value}
            onPress={() => setMode(value)}
          />
        ))}
      </View>
      {insight && (
        <View style={ui.card}>
          <Text style={ui.heading}>Ingredient: {insight.name}</Text>
          <Text style={ui.text}>Category: {insight.lookup?.category || 'Other'}</Text>
          <Text style={ui.text}>Known names: {insight.lookup?.synonyms || insight.name}</Text>
          {insight.recipes.map((recipe) => (
            <Text key={recipe.id} style={ui.text}>
              {recipe.title}: {recipe.lines.join('; ')}
            </Text>
          ))}
          <Text style={ui.subtitle}>{insight.quantity_note}</Text>
          <Button title="Close ingredient insights" secondary onPress={() => setInsight(null)} />
        </View>
      )}
      {loading && <Text style={ui.subtitle}>Preparing your list...</Text>}
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {list && (
        <>
          <Text style={ui.subtitle}>
            {checked.length}/{Object.keys(list.raw).length} collected - {ids.length} recipes
          </Text>
          {!Object.keys(list.raw).length && (
            <Text style={ui.text}>
              Nothing to buy. Choose recipes or a plan, or check whether your pantry covers
              everything.
            </Text>
          )}
          {Object.entries(list.categorized).map(([category, names]) => (
            <View key={category} style={ui.card}>
              <Text style={ui.heading}>{category}</Text>
              {names.map((name) => (
                <View key={name} style={{ gap: 6 }}>
                  <CheckItem
                    label={`${name} - ${Object.entries(list.raw[name])
                      .map(([u, q]) => (q ? `${q} ${u}` : 'to taste'))
                      .join(' + ')}`}
                    checked={checked.includes(name)}
                    onToggle={async () => {
                      const next = checked.includes(name)
                        ? checked.filter((n) => n !== name)
                        : [...checked, name];
                      await storage.setItem('forkcast:checklist:' + key, JSON.stringify(next));
                      setChecked(next);
                    }}
                  />
                  <Button
                    title={`Insights for ${name}`}
                    secondary
                    onPress={async () =>
                      setInsight(await api<Insight>('/ingredients/' + encodeURIComponent(name)))
                    }
                  />
                </View>
              ))}
            </View>
          ))}
          {!!Object.keys(list.raw).length && (
            <View style={ui.row}>
              <Button
                title="Share grocery list"
                onPress={async () => {
                  await shareText('Forkcast shopping list', text);
                }}
              />
              <Button
                title="Export grocery list"
                secondary
                onPress={() => downloadText('forkcast-groceries.txt', text)}
              />
              <Button
                title="Save to history"
                secondary
                onPress={() =>
                  mutate('/history', 'POST', {
                    name: active?.name || 'Shopping list',
                    recipe_ids: ids,
                    checked,
                    grocery_list: list,
                  })
                }
              />
            </View>
          )}
        </>
      )}
    </Page>
  );
}
