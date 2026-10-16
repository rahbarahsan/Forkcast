import { ExtractPanel } from '../components/ExtractPanel';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useHousehold } from '../context/HouseholdContext';
import { api, json } from '../lib/api';
import { Button, DeleteButton, Field, Page, ui } from '../components/ui';
export default function PantryScreen() {
  const { pantry, mutate } = useHousehold();
  const [scan, setScan] = useState('');
  const [preview, setPreview] = useState<{ name: string; quantity: string }[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <Page
      title="Start with your pantry"
      description="Ingredients here are excluded from your shopping list. Amounts are a reminder; they are not subtracted from recipe quantities."
    >
      <View style={ui.card}>
        <Field label="Ingredient name" value={name} onChangeText={setName} disabled={saving} />
        <Field
          label="Quantity and unit"
          value={quantity}
          onChangeText={setQuantity}
          disabled={saving}
        />
        <Button
          title={editing ? 'Save pantry changes' : 'Add pantry item'}
          disabled={saving || !name.trim()}
          onPress={async () => {
            setSaving(true);
            try {
              await mutate(editing ? '/pantry/' + editing : '/pantry', editing ? 'PUT' : 'POST', {
                name,
                quantity,
              });
              setEditing(null);
              setName('');
              setQuantity('');
            } finally {
              setSaving(false);
            }
          }}
        />
        {editing && (
          <Button
            title="Cancel pantry edit"
            secondary
            disabled={saving}
            onPress={() => {
              setEditing(null);
              setName('');
              setQuantity('');
            }}
          />
        )}
      </View>
      <ExtractPanel
        task="pantry"
        onPreview={(data: { items: typeof preview }) => setPreview(data.items)}
      />
      <View style={ui.card}>
        <Text style={ui.heading}>Scan pantry text</Text>
        <Text style={ui.subtitle}>
          Paste a label list, receipt, or OCR text. Review the names and amounts before adding.
        </Text>
        <Field
          label="Pantry scan text"
          value={scan}
          onChangeText={setScan}
          multiline
          placeholder="2 kg rice\n3 tomatoes"
        />
        <Button
          title="Preview pantry scan"
          secondary
          disabled={!scan.trim()}
          onPress={async () =>
            setPreview(
              (await api<{ items: typeof preview }>('/import/pantry', json('POST', { text: scan })))
                .items,
            )
          }
        />
        {preview.map((item, index) => (
          <View key={index} style={ui.card}>
            <Field
              label={`Scanned ingredient ${index + 1}`}
              value={item.name}
              onChangeText={(name) =>
                setPreview((items) => items.map((p, i) => (i === index ? { ...p, name } : p)))
              }
            />
            <Field
              label={`Scanned quantity ${index + 1}`}
              value={item.quantity}
              onChangeText={(quantity) =>
                setPreview((items) => items.map((p, i) => (i === index ? { ...p, quantity } : p)))
              }
            />
            <Button
              title="Discard scanned item"
              secondary
              onPress={() => setPreview((items) => items.filter((_, i) => i !== index))}
            />
          </View>
        ))}
        {!!preview.length && (
          <Button
            title="Add reviewed pantry items"
            onPress={async () => {
              await mutate('/pantry/batch', 'POST', { items: preview });
              setPreview([]);
              setScan('');
            }}
          />
        )}
      </View>
      {!pantry.length && (
        <Text style={ui.subtitle}>Your pantry is empty. Add what you already have.</Text>
      )}
      {pantry.map((item) => (
        <View key={item.id} style={ui.card}>
          <Text style={ui.heading}>{item.name}</Text>
          <Text style={ui.text}>{item.quantity}</Text>
          <Button
            title="Edit pantry item"
            secondary
            disabled={saving}
            onPress={() => {
              setEditing(item.id);
              setName(item.name);
              setQuantity(item.quantity);
            }}
          />
          <DeleteButton
            title="Remove item"
            onDelete={() => mutate('/pantry/' + item.id, 'DELETE')}
          />
        </View>
      ))}
    </Page>
  );
}
