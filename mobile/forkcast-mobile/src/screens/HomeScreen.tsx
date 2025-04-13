// src/screens/HomeScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import screenStyles from '../styles/screenStyle';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to ForkCast</Text>
        <Text style={styles.tagline}>
          Your personal kitchen assistant for perfect meals every time
        </Text>
      </View>

      <View style={[styles.tilesContainer, isTablet && styles.tabletTiles]}>
        <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Discover')}>
          <Image
            source={require('../../assets/images/discover-icon.png')}
            style={styles.tileIcon}
            defaultSource={require('../../assets/images/placeholder.jpg')}
          />
          <Text style={styles.tileText}>🔍 Discover</Text>
          <Text style={styles.tileDescription}>Find new and trending recipes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => alert('Coming soon!')}>
          <Image
            source={require('../../assets/images/add-icon.png')}
            style={styles.tileIcon}
            defaultSource={require('../../assets/images/placeholder.jpg')}
          />
          <Text style={styles.tileText}>➕ Add Recipe</Text>
          <Text style={styles.tileDescription}>Create and save your recipes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Planner')}>
          <Image
            source={require('../../assets/images/plan-icon.png')}
            style={styles.tileIcon}
            defaultSource={require('../../assets/images/placeholder.jpg')}
          />
          <Text style={styles.tileText}>🕰️ Plan</Text>
          <Text style={styles.tileDescription}>Schedule your meals for the week</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Pantry')}>
          <Image
            source={require('../../assets/images/pantry-icon.png')}
            style={styles.tileIcon}
            defaultSource={require('../../assets/images/placeholder.jpg')}
          />
          <Text style={styles.tileText}>📦 Pantry</Text>
          <Text style={styles.tileDescription}>Manage your ingredients</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ForkCast - Making cooking easier</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  tabletTiles: {
    paddingHorizontal: 50,
  },
  tile: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 160,
    justifyContent: 'center',
  },
  tileIcon: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  tileText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  tileDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
});
