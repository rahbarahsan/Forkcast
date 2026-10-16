import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootTabParamList } from '../navigation';

const tools: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof RootTabParamList;
  step: string;
}[] = [
  {
    title: 'Find your next favorite',
    description: 'Explore recipes and choose what sounds good this week.',
    icon: 'restaurant-outline',
    screen: 'Discover',
    step: '01 / DISCOVER',
  },
  {
    title: 'Make room for good food',
    description: 'Bring your recipes together in a plan that works for you.',
    icon: 'calendar-outline',
    screen: 'Planner',
    step: '02 / PLAN',
  },
  {
    title: 'Start with what you have',
    description: 'Keep track of your pantry and skip ingredients you already own.',
    icon: 'file-tray-stacked-outline',
    screen: 'Pantry',
    step: '03 / CHECK',
  },
  {
    title: 'One trip. One clear list.',
    description: 'Combine ingredients from your recipes, organized by aisle.',
    icon: 'basket-outline',
    screen: 'Groceries',
    step: '04 / SHOP',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { width } = useWindowDimensions();
  const compact = width < 700;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Ionicons name="leaf" size={22} color="#fff" />
        </View>
        <Text style={styles.brand}>Forkcast</Text>
        <Text style={styles.brandNote}>A little planning. A lot less waste.</Text>
      </View>

      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>GOOD FOOD STARTS HERE</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>
            Your week,{'\n'}a little fresher.
          </Text>
          <Text style={styles.subtitle}>
            Recipes you love. A plan that fits. A shopping list that brings it all together.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore recipes"
            onPress={() => navigation.navigate('Discover')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryLabel}>Explore recipes</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open my meal plan"
            onPress={() => navigation.navigate('Planner')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLabel}>Open my meal plan</Text>
            <Ionicons name="arrow-forward" size={17} color="#245544" />
          </Pressable>
        </View>
        <View style={[styles.heroVisual, compact && styles.heroVisualCompact]}>
          <Image
            source={require('../../assets/images/classic_french_coq_au_vin.jpg')}
            accessibilityLabel="A bowl of chicken stew, ready to serve"
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageCaption}>
            <View style={styles.captionIcon}>
              <Ionicons name="checkmark" size={20} color="#245544" />
            </View>
            <View style={styles.captionCopy}>
              <Text style={styles.captionTitle}>Less figuring out. More cooking.</Text>
              <Text style={styles.captionText}>Turn a few recipes into one sensible list.</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.eyebrow}>FROM INSPIRATION TO YOUR KITCHEN</Text>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          A simpler way to feed your week.
        </Text>
      </View>
      <View style={styles.grid}>
        {tools.map((tool) => (
          <Pressable
            key={tool.screen}
            accessibilityRole="button"
            accessibilityLabel={tool.title + '. ' + tool.description}
            onPress={() => navigation.navigate(tool.screen)}
            style={({ pressed }) => [
              styles.card,
              { width: compact ? '100%' : '48.5%' },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.step}>{tool.step}</Text>
              <Ionicons name={tool.icon} size={26} color="#245544" />
            </View>
            <Text style={styles.cardTitle}>{tool.title}</Text>
            <Text style={styles.cardDescription}>{tool.description}</Text>
            <Ionicons name="arrow-forward" size={20} color="#245544" style={styles.cardArrow} />
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        <Ionicons name="leaf-outline" size={18} color="#53665b" />
        <Text style={styles.footerText}>
          Your kitchen stays on this installation. Recipes, pantry, and plans save automatically.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f8f2' },
  content: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 24, paddingBottom: 40 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#245544',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 23, fontWeight: '700', color: '#1e342a', letterSpacing: -0.7 },
  brandNote: { flexGrow: 1, color: '#53665b', fontSize: 13, textAlign: 'right' },
  hero: {
    flexDirection: 'row',
    backgroundColor: '#e9eddf',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 44,
  },
  heroCompact: { flexDirection: 'column' },
  heroCopy: { flex: 1, padding: 32, justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: '#47634f' },
  title: {
    fontSize: 54,
    lineHeight: 59,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#1e342a',
    marginTop: 18,
    marginBottom: 18,
  },
  titleCompact: { fontSize: 40, lineHeight: 46, letterSpacing: -1.3 },
  subtitle: { fontSize: 16, lineHeight: 25, color: '#465c4e', maxWidth: 390, marginBottom: 26 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#245544',
    borderRadius: 12,
    padding: 16,
    alignSelf: 'flex-start',
    minHeight: 50,
  },
  primaryLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    alignSelf: 'flex-start',
    minHeight: 48,
  },
  secondaryLabel: { color: '#245544', fontWeight: '600', fontSize: 14 },
  pressed: { opacity: 0.75 },
  heroVisual: { flex: 1, minHeight: 430, backgroundColor: '#d9dfcf' },
  heroVisualCompact: { flex: undefined, minHeight: 280 },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imageCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 18,
    marginTop: 'auto',
    padding: 16,
    backgroundColor: '#fffdf6',
    borderRadius: 16,
  },
  captionIcon: { padding: 8, backgroundColor: '#e9eddf', borderRadius: 24 },
  captionCopy: { flex: 1 },
  captionTitle: { color: '#1e342a', fontWeight: '600', fontSize: 14, marginBottom: 4 },
  captionText: { color: '#53665b', fontSize: 12, lineHeight: 18 },
  sectionHeading: { marginBottom: 24 },
  sectionTitle: {
    color: '#1e342a',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.7,
    marginTop: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e5d9',
    minHeight: 205,
  },
  cardHovered: { backgroundColor: '#f0f3e9', borderColor: '#8da58c' },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  step: { fontSize: 10, fontWeight: '600', letterSpacing: 1.3, color: '#53665b' },
  cardTitle: {
    color: '#1e342a',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  cardDescription: { color: '#53665b', fontSize: 14, lineHeight: 22, paddingRight: 24 },
  cardArrow: { alignSelf: 'flex-end', marginTop: 14 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
  },
  footerText: { flexShrink: 1, color: '#53665b', fontSize: 12, lineHeight: 20 },
});
