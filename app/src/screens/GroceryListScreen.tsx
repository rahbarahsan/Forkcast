import { quantities } from '../lib/quantities';
import { shareText, downloadText } from '../lib/export';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { GroceryList, useHousehold } from '../context/HouseholdContext';
import { api, json } from '../lib/api';
import { Button, CheckItem, Page, ui } from '../components/ui';
import { storage } from '../utils/storage';
import { StorePanel } from '../components/StorePanel';

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
  const [intelligence, setIntelligence] = useState('auto');
  const [revision, setRevision] = useState(0);
  const [evidence, setEvidence] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setList(null);
    api<GroceryList>('/grocery-list', {
      ...json('POST', { recipe_ids: ids, intelligence }),
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
  }, [key, pantry, intelligence, revision]);
  const text = list
    ? [
        'Forkcast shopping list',
        ...Object.entries(list.categorized).flatMap(([category, names]) => [
          '',
          category,
          ...names.map(
            (n) =>
              `${checked.includes(n) ? '[x]' : '[ ]'} ${n} - ${quantities(list.raw[n], category)}`,
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
        <Button
          title="Improve with my model"
          disabled={!ids.length}
          onPress={() => {
            setIntelligence('model');
            setRevision((n) => n + 1);
          }}
        />
        <Button
          title="Use offline interpretation"
          secondary
          onPress={() => setIntelligence('local')}
        />
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
            Interpretation: {list.method}. Compatible stock quantities are deducted; blank pantry
            quantities mean you have enough.
          </Text>
          {list.warnings?.map((warning) => (
            <Text key={warning} style={ui.error}>
              {warning}
            </Text>
          ))}
          {!!list.pantry_deductions?.length && (
            <View style={ui.card}>
              <Text style={ui.heading}>Already in your pantry</Text>
              {list.pantry_deductions.map((item, index) => (
                <Text key={index} style={ui.subtitle}>
                  {item.name} ·{' '}
                  {item.quantity ? `${item.quantity} ${item.unit} deducted` : item.note}
                </Text>
              ))}
            </View>
          )}
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
                    label={`${name} - ${quantities(list.raw[name], category)}`}
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
                    title={`Recipe evidence for ${name}`}
                    secondary
                    onPress={() => setEvidence(evidence === name ? null : name)}
                  />
                  {evidence === name && (
                    <View style={{ gap: 6 }}>
                      {list.items
                        ?.find((item) => item.name === name)
                        ?.sources.map((source, index) => (
                          <Text key={index} style={ui.subtitle}>
                            {source.recipe_title}: {source.line}
                          </Text>
                        ))}
                      {list.items
                        ?.find((item) => item.name === name)
                        ?.notes.map((note) => (
                          <Text key={note} style={ui.subtitle}>
                            {note}
                          </Text>
                        ))}
                    </View>
                  )}
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
          <StorePanel recipeIds={ids} />
        </>
      )}
    </Page>
  );
}
