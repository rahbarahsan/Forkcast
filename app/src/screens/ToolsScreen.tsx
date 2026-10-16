import { ExtractPanel } from '../components/ExtractPanel';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useHousehold } from '../context/HouseholdContext';
import { api, json } from '../lib/api';
import { Button, DeleteButton, Field, Page, ui } from '../components/ui';

interface Offer {
  id: string;
  name: string;
  store: string;
  price: number;
  quantity: number;
  unit: string;
  currency: string;
  valid_until?: string;
}
interface Comparison {
  currency: string;
  total: number;
  items: {
    name: string;
    store: string;
    packs: number;
    cost: number;
    required: number;
    unit: string;
  }[];
  unpriced: { name: string; unit: string }[];
  method: string;
}
export default function ToolsScreen() {
  const { plans, selected } = useHousehold();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');
  const [currency, setCurrency] = useState('CAD');
  const [expiry, setExpiry] = useState('');
  const [result, setResult] = useState<Comparison | null>(null);
  const [loadError, setLoadError] = useState('');
  const [preview, setPreview] = useState('');
  useEffect(() => {
    void api<Offer[]>('/offers')
      .then(setOffers)
      .catch((e) => setLoadError(e.message));
  }, []);
  return (
    <Page
      title="Kitchen tools"
      description="Record real flyer prices and compare the packs you need. Offers stay in your local database."
    >
      {loadError && <Text style={ui.error}>{loadError}</Text>}
      <ExtractPanel
        task="offers"
        onPreview={(data: { items: Offer[] }) => setPreview(JSON.stringify(data, null, 2))}
      />
      {preview && (
        <View style={ui.card}>
          <Text style={ui.heading}>Review extracted offers</Text>
          <Field label="Offer preview JSON" value={preview} onChangeText={setPreview} multiline />
          <Button
            title="Save reviewed offers"
            onPress={async () => {
              await api('/offers/batch', json('POST', JSON.parse(preview)));
              setOffers(await api('/offers'));
              setPreview('');
            }}
          />
          <Button title="Discard extracted offers" secondary onPress={() => setPreview('')} />
        </View>
      )}
      <View style={ui.card}>
        <Text style={ui.heading}>Add a flyer offer</Text>
        <Field label="Offer ingredient" value={name} onChangeText={setName} />
        <Field label="Store" value={store} onChangeText={setStore} />
        <Field label="Pack price" value={price} onChangeText={setPrice} />
        <Field label="Pack quantity" value={quantity} onChangeText={setQuantity} />
        <Text style={ui.label}>Pack unit</Text>
        <View style={ui.row}>
          {['g', 'kg', 'ml', 'l', 'pcs', 'clove'].map((value) => (
            <Button
              key={value}
              title={value}
              secondary={unit !== value}
              onPress={() => setUnit(value)}
            />
          ))}
        </View>
        <Field
          label="Currency (three-letter code)"
          value={currency}
          onChangeText={(s) => setCurrency(s.toUpperCase())}
        />
        <Field label="Valid until (YYYY-MM-DD, optional)" value={expiry} onChangeText={setExpiry} />
        <Button
          title="Save offer"
          disabled={
            !name.trim() || !store.trim() || !(Number(price) > 0) || !(Number(quantity) > 0)
          }
          onPress={async () => {
            await api(
              '/offers',
              json('POST', {
                name,
                store,
                price: Number(price),
                quantity: Number(quantity),
                unit,
                currency,
                valid_until: expiry || null,
              }),
            );
            setOffers(await api('/offers'));
            setName('');
            setPrice('');
            setQuantity('');
            setResult(null);
          }}
        />
      </View>
      {offers.map((offer) => (
        <View key={offer.id} style={ui.card}>
          <Text style={ui.heading}>
            {offer.name} · {offer.store}
          </Text>
          <Text style={ui.text}>
            {offer.currency} {offer.price.toFixed(2)} / {offer.quantity} {offer.unit}
            {offer.valid_until ? ` · until ${offer.valid_until}` : ''}
          </Text>
          <DeleteButton
            title="Remove offer"
            onDelete={async () => {
              await api('/offers/' + offer.id, json('DELETE'));
              setOffers(await api('/offers'));
              setResult(null);
            }}
          />
        </View>
      ))}
      <View style={ui.card}>
        <Text style={ui.heading}>Compare your shopping trip</Text>
        <Text style={ui.subtitle}>
          Uses your active plan, or selected recipes when there is no active plan. Your pantry is
          excluded. Prices in other currencies and expired offers are skipped.
        </Text>
        <Button
          title="Compare recorded offers"
          onPress={async () =>
            setResult(
              await api(
                '/optimize',
                json('POST', {
                  recipe_ids: plans.find((p) => p.isActive)?.recipeIds || selected,
                  currency,
                }),
              ),
            )
          }
        />
        {result && (
          <>
            <Text style={ui.heading}>
              {result.currency} {result.total.toFixed(2)} priced subtotal
            </Text>
            {result.items.map((item) => (
              <Text key={item.name + item.unit} style={ui.text}>
                {item.name}: {item.packs} pack(s) at {item.store} · {result.currency}{' '}
                {item.cost.toFixed(2)} (need {item.required} {item.unit})
              </Text>
            ))}
            {!!result.unpriced.length && (
              <Text style={ui.error}>
                Not priced: {result.unpriced.map((i) => i.name + ' (' + i.unit + ')').join(', ')}.
                This subtotal does not cover the whole list.
              </Text>
            )}
            <Text style={ui.subtitle}>{result.method}</Text>
          </>
        )}
      </View>
    </Page>
  );
}
