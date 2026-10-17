import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { serif } from './ui';

const palettes = [
  ['#ebe8d8', '#6f7c40'],
  ['#eee1d4', '#ad5f3e'],
  ['#e5e9dd', '#486e50'],
  ['#eee5da', '#9c7045'],
];
export function RecipeArtwork({ title, cuisine }: { title: string; cuisine: string }) {
  const seed = [...title].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const [background, accent] = palettes[seed % palettes.length];
  return (
    <View
      style={[styles.art, { backgroundColor: background }]}
      accessibilityLabel={cuisine + ' recipe illustration'}
    >
      <Text style={[styles.word, { color: accent }]}>{cuisine.split(' ')[0]}</Text>
      <View style={styles.plate}>
        {Array.from({ length: 9 }, (_, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              width: 19 + (index % 3) * 6,
              height: 14 + (index % 2) * 8,
              borderRadius: index % 2 ? 6 : 20,
              backgroundColor: [accent, '#d89e57', '#92a367'][index % 3],
              top: 28 + ((index * 29) % 90),
              left: 24 + ((index * 43) % 92),
              transform: [{ rotate: String(index * 38) + 'deg' }],
            }}
          />
        ))}
        <Ionicons
          name="leaf"
          size={48}
          color="#547246"
          style={{ position: 'absolute', bottom: 20, right: 20, transform: [{ rotate: '30deg' }] }}
        />
      </View>
      <Text style={styles.label}>KITCHEN SKETCH / {String(seed % 100).padStart(2, '0')}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  art: {
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    position: 'absolute',
    left: 18,
    top: 18,
    fontSize: 25,
    fontFamily: serif,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  plate: {
    width: 174,
    height: 174,
    borderRadius: 100,
    backgroundColor: '#faf8f0',
    borderWidth: 10,
    borderColor: '#f4f0e5',
    transform: [{ rotate: '-15deg' }],
    marginTop: 20,
    marginLeft: 50,
    boxShadow: '0px 12px 20px #162b1a15',
  },
  label: {
    position: 'absolute',
    bottom: 12,
    left: 18,
    fontSize: 8,
    letterSpacing: 2,
    color: '#43513b',
  },
});
