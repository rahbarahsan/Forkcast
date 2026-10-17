import React from 'react';
import heroImage from '../../assets/images/classic_french_coq_au_vin.jpg';
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
import { useHousehold } from '../context/HouseholdContext';
import { colors, serif, Button } from '../components/ui';
import { Reveal } from '../components/Reveal';
import { RecipeArtwork } from '../components/RecipeArtwork';

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { recipes, pantry, plans } = useHousehold();
  const { width } = useWindowDimensions();
  const compact = width < 800;
  const active = plans.find((plan) => plan.isActive);
  const navigate = (screen: keyof RootTabParamList) => navigation.navigate(screen);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{
        padding: compact ? 20 : 40,
        gap: 36,
        maxWidth: 1440,
        width: '100%',
        alignSelf: 'center',
        paddingBottom: 60,
      }}
    >
      <View style={styles.topline}>
        <Text style={styles.kicker}>A GOOD WEEK STARTS IN THE KITCHEN</Text>
        <Text style={styles.issue}>VOL. 01 / EVERYDAY GOOD FOOD</Text>
      </View>
      <Reveal style={[styles.hero, compact && { flexDirection: 'column', padding: 26 }]}>
        <View style={{ flex: 1.1, gap: 24, zIndex: 1 }}>
          <View style={styles.pill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>A little planning. More living.</Text>
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.title, { fontSize: compact ? 51 : 72, lineHeight: compact ? 56 : 76 }]}
          >
            Good food.{'\n'}Less{' '}
            <Text style={{ fontStyle: 'italic', color: '#ddecaa' }}>figuring{'\n'}it out.</Text>
          </Text>
          <Text style={styles.description}>
            Find a recipe you love. Make a plan that fits.{'\n'}Bring home just what you need.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explore recipes"
              onPress={() => navigate('Discover')}
              style={({ pressed }) => [
                styles.cta,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.ctaText}>Explore recipes</Text>
              <Ionicons name="arrow-forward" size={19} color="#203c2d" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open my meal plan"
              onPress={() => navigate('Planner')}
              style={styles.outlineCta}
            >
              <Text style={{ color: '#fff', fontSize: 13 }}>My meal plan ↗</Text>
            </Pressable>
          </View>
          <Text style={styles.smallPrint}>YOUR RECIPES. YOUR PANTRY. YOUR OWN LITTLE KITCHEN.</Text>
        </View>
        <View
          style={{
            flex: 1,
            minHeight: compact ? 310 : 420,
            width: compact ? '100%' : undefined,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={[styles.orbit, { width: compact ? 280 : 370, height: compact ? 280 : 370 }]}
          />
          <Image
            source={heroImage}
            accessibilityLabel="Slow-cooked chicken stew, serving inspiration"
            style={{
              width: compact ? 240 : 320,
              height: compact ? 240 : 320,
              borderRadius: 180,
              borderWidth: 12,
              borderColor: '#f5f0df',
              transform: [{ rotate: '-12deg' }],
            }}
          />
          <View style={styles.floatingNote}>
            <Ionicons name="leaf-outline" size={24} color={colors.green} />
            <View>
              <Text style={{ color: colors.ink, fontFamily: serif, fontSize: 20 }}>
                A fresher kind of week.
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                Made for the way you cook.
              </Text>
            </View>
          </View>
          <View style={styles.circleStamp}>
            <Text
              style={{
                color: colors.green,
                fontWeight: '700',
                fontSize: 11,
                textAlign: 'center',
                lineHeight: 17,
              }}
            >
              LESS WASTE{'\n'}MORE TASTE
            </Text>
          </View>
        </View>
      </Reveal>
      <View style={styles.stats}>
        {[
          { value: recipes.length, label: 'RECIPES TO MAKE YOUR OWN' },
          { value: pantry.length, label: 'THINGS ALREADY AT HOME' },
          { value: active?.recipeIds.length || 0, label: 'DISHES IN YOUR WEEK' },
        ].map((stat) => (
          <View key={stat.label} style={{ flex: 1, minWidth: 70, gap: 8 }}>
            <Text style={styles.statValue}>{String(stat.value).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
        }}
      >
        <View style={{ gap: 10 }}>
          <Text style={styles.kicker}>SOMETHING GOOD IS COOKING</Text>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Meet your next favorite.
          </Text>
        </View>
        <Button title="Browse the collection ↗" secondary onPress={() => navigate('Discover')} />
      </View>
      <View style={{ flexDirection: compact ? 'column' : 'row', gap: 18 }}>
        {recipes.slice(0, 3).map((recipe) => (
          <Pressable
            key={recipe.id}
            accessibilityRole="button"
            accessibilityLabel={'Discover ' + recipe.title}
            onPress={() => navigate('Discover')}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 12,
              gap: 14,
              borderWidth: 1,
              borderColor: colors.border,
              transform: [{ translateY: pressed ? -3 : 0 }],
            })}
          >
            <RecipeArtwork title={recipe.title} cuisine={recipe.cuisine} />
            <Text
              style={{
                fontSize: 10,
                color: colors.muted,
                letterSpacing: 1.5,
                paddingHorizontal: 8,
              }}
            >
              {recipe.cuisine.toUpperCase()}
            </Text>
            <Text
              style={{
                fontFamily: serif,
                fontSize: 23,
                color: colors.ink,
                paddingHorizontal: 8,
                paddingBottom: 12,
              }}
            >
              {recipe.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <View
        style={[styles.assistant, compact && { flexDirection: 'column', alignItems: 'flex-start' }]}
      >
        <View style={{ gap: 12, flex: 1 }}>
          <Text style={styles.kicker}>A SECOND PAIR OF HANDS</Text>
          <Text style={styles.sectionTitle}>
            What's for dinner?{'\n'}Let's figure it out together.
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 24 }}>
            Turn a passing idea into a meal plan, a pantry update, or a shopping list you can
            actually use.
          </Text>
        </View>
        <Button title="Talk to your kitchen assistant ↗" onPress={() => navigate('Assistant')} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          borderTopWidth: 1,
          borderColor: colors.border,
          paddingTop: 24,
        }}
      >
        <Text style={{ fontFamily: serif, fontSize: 28, color: colors.green }}>forkcast.</Text>
        <Text style={{ fontSize: 11, color: colors.muted }}>
          Made for good food and ordinary days.
        </Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  topline: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  kicker: { fontSize: 9, fontWeight: '600', letterSpacing: 2, color: colors.muted },
  issue: { fontSize: 9, letterSpacing: 1.4, color: colors.muted },
  hero: {
    backgroundColor: '#1d4031',
    borderRadius: 30,
    padding: 44,
    flexDirection: 'row',
    gap: 16,
    overflow: 'hidden',
  },
  pill: {
    borderWidth: 1,
    borderColor: '#68816b',
    borderRadius: 30,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dot: { width: 5, height: 5, borderRadius: 4, backgroundColor: '#ddecaa' },
  pillText: { color: '#e4ecd8', fontSize: 10 },
  title: { fontFamily: serif, color: '#faf7ed', letterSpacing: -3, fontWeight: '500' },
  description: { color: '#dae2d3', fontSize: 15, lineHeight: 25 },
  cta: {
    backgroundColor: '#ddecaa',
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 15,
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  ctaText: { fontSize: 13, fontWeight: '600', color: '#203c2d' },
  outlineCta: {
    borderWidth: 1,
    borderColor: '#728773',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    justifyContent: 'center',
  },
  smallPrint: { fontSize: 7, letterSpacing: 1.5, color: '#c1cfb4', marginTop: 6 },
  orbit: {
    position: 'absolute',
    borderRadius: 220,
    borderWidth: 1,
    borderColor: '#839966',
    transform: [{ rotate: '-20deg' }],
  },
  floatingNote: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    backgroundColor: '#f7f2e4',
    padding: 17,
    borderRadius: 16,
    gap: 14,
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 10px 20px #0b211a20',
  },
  circleStamp: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 88,
    height: 88,
    borderRadius: 50,
    backgroundColor: '#ddecaa',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 32,
  },
  statValue: { fontSize: 40, fontFamily: serif, color: colors.green },
  statLabel: { fontSize: 8, letterSpacing: 1.2, color: colors.muted, lineHeight: 14 },
  sectionTitle: { fontFamily: serif, fontSize: 35, color: colors.ink, letterSpacing: -1 },
  assistant: {
    backgroundColor: '#ebeedd',
    borderRadius: 24,
    padding: 30,
    flexDirection: 'row',
    gap: 30,
    alignItems: 'center',
  },
});
