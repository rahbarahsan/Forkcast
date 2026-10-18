import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { api, json } from '../lib/api';
import { Button, Field, ui } from './ui';

interface Store {
  id: string;
  name: string;
  distance_km: number;
  address: string;
  halal: string;
  url: string;
  directions_url: string;
}
interface Search {
  location: string;
  stores: Store[];
  source: string;
  fetched_at: string;
  note: string;
}
interface Comparison {
  currency: string;
  recommendation: string | null;
  reason: string;
  stores: {
    store: string;
    priced_lines: number;
    unpriced_lines: number;
    subtotal: number;
    complete: boolean;
  }[];
}
export function StorePanel({ recipeIds }: { recipeIds: string[] }) {
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('CAD');
  const [search, setSearch] = useState<Search | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Find your next grocery stop.</Text>
      <Text style={ui.subtitle}>
        Compare your recorded offers, or find real stores near a location you choose.
      </Text>
      <Field
        label="Shopping currency"
        value={currency}
        onChangeText={(value) => setCurrency(value.toUpperCase())}
      />
      <Button
        title="Suggest stores from my offers"
        disabled={!recipeIds.length || !/^[A-Z]{3}$/.test(currency)}
        secondary
        onPress={async () =>
          setComparison(
            await api<Comparison>(
              '/stores/recommend',
              json('POST', { recipe_ids: recipeIds, currency }),
            ),
          )
        }
      />
      {comparison && (
        <>
          <Text style={ui.text}>
            {comparison.recommendation
              ? `Best recorded coverage: ${comparison.recommendation}`
              : 'No comparable offers yet. Add flyer offers in Tools.'}
          </Text>
          {comparison.stores.map((store) => (
            <Text key={store.store} style={ui.text}>
              {store.store} · {store.priced_lines} priced lines · {store.unpriced_lines} unpriced ·{' '}
              {comparison.currency} {store.subtotal.toFixed(2)}{' '}
              {store.complete ? 'basket total' : 'partial subtotal'}
            </Text>
          ))}
          <Text style={ui.subtitle}>{comparison.reason}</Text>
        </>
      )}
      <Field
        label="City and country or postal code"
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. Scarborough, Toronto, Canada"
      />
      <Button
        title="Find nearby grocery stores"
        disabled={location.trim().length < 3}
        onPress={async () =>
          setSearch(await api<Search>('/stores/search', json('POST', { location })))
        }
      />
      <Text style={ui.subtitle}>
        This explicit search sends the location to OpenStreetMap services. Your pantry and recipes
        are not sent.
      </Text>
      {search && (
        <>
          <Text style={ui.text}>{search.location}</Text>
          {!search.stores.length && (
            <Text style={ui.text}>
              No mapped grocery stores found within 5 km. Try a nearby town or postal code.
            </Text>
          )}
          {search.stores.map((store) => (
            <View key={store.id} style={{ gap: 6, paddingVertical: 10 }}>
              <Text style={ui.heading}>{store.name}</Text>
              <Text style={ui.subtitle}>
                {store.distance_km} km · {store.address || 'Address not listed'}
              </Text>
              <Text style={ui.subtitle}>
                Halal map tag: {store.halal}. Confirm certification with the store.
              </Text>
              <View style={ui.row}>
                <Button
                  title={`Directions to ${store.name}`}
                  secondary
                  onPress={() => Linking.openURL(store.directions_url)}
                />
                <Button
                  title={`Map listing for ${store.name}`}
                  secondary
                  onPress={() => Linking.openURL(store.url)}
                />
              </View>
            </View>
          ))}
          <Text style={ui.subtitle}>{search.note}</Text>
          <Button
            title="© OpenStreetMap contributors"
            secondary
            onPress={() => Linking.openURL('https://www.openstreetmap.org/copyright')}
          />
          <Text style={ui.subtitle}>Retrieved {new Date(search.fetched_at).toLocaleString()}</Text>
        </>
      )}
    </View>
  );
}
