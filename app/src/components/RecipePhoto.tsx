import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { recipePhotos } from '../data/recipePhotos';
import { RecipeArtwork } from './RecipeArtwork';
import { colors } from './ui';

export function RecipePhoto({
  title,
  cuisine,
  image,
}: {
  title: string;
  cuisine: string;
  image: string;
}) {
  const photo = recipePhotos[image];
  const [failedSource, setFailedSource] = useState<number | null>(null);
  if (!photo || failedSource === photo.source) {
    return <RecipeArtwork title={title} cuisine={cuisine} />;
  }
  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <Image
          source={photo.source}
          accessibilityLabel={photo.description + '. Serving suggestion for ' + title}
          resizeMode="cover"
          style={styles.image}
          onError={() => setFailedSource(photo.source)}
        />
        <Text style={styles.badge}>SERVING SUGGESTION</Text>
      </View>
      {!!photo.note && <Text style={styles.credit}>{photo.note}</Text>}
      <Text style={styles.credit}>
        Photo:{' '}
        <Text
          accessibilityRole="link"
          onPress={(event) => {
            event.stopPropagation();
            void Linking.openURL(photo.pageUrl);
          }}
          style={styles.link}
        >
          {photo.author}
        </Text>
        {' · '}
        <Text
          accessibilityRole="link"
          onPress={(event) => {
            event.stopPropagation();
            void Linking.openURL(photo.licenseUrl);
          }}
          style={styles.link}
        >
          {photo.license}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7 },
  frame: { height: 230, borderRadius: 18, overflow: 'hidden', backgroundColor: '#ebe8d8' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#172c20d9',
    color: '#fff',
    fontSize: 9,
    letterSpacing: 1.2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  credit: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  link: { textDecorationLine: 'underline' },
});
