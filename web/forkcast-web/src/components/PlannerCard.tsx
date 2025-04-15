import React, { useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Button } from 'react-native';
import ConfirmDialog from './ConfirmDialog';

type PlannerCardProps = {
  id: string;
  startDate: Date;
  endDate: Date;
  recipes: { id: string; title: string; image?: string }[]; // include image field
  onDelete: (id: string) => void;
};

// Hosted fallback image from Supabase
const FALLBACK_IMAGE_URL =
  'https://pmhjdiniwseslpczkokw.supabase.co/storage/v1/object/sign/recipes/placeholder.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkMTYwZTY4LWZhNTktNDc5Zi05MjE3LTA4NmM2YTA4YTcyNSJ9.eyJ1cmwiOiJyZWNpcGVzL3BsYWNlaG9sZGVyLmpwZyIsImlhdCI6MTc0NDY5MDAzNywiZXhwIjoxNzc2MjI2MDM3fQ.49V_5VD7hyH_0QKDcFiTnEaxv4bMdEJk7Ipw-tO_1dA';

export default function PlannerCard({
  id,
  startDate,
  endDate,
  recipes,
  onDelete,
}: PlannerCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getImageSource = (img?: string) => {
    if (img && img.startsWith('http') && img !== FALLBACK_IMAGE_URL) {
      return { uri: img };
    }
    return { uri: FALLBACK_IMAGE_URL };
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        📅 {startDate.toDateString()} – {endDate.toDateString()}
      </Text>

      {recipes.map((r) => {
        const isRemote = r.image && r.image.startsWith('http') && r.image !== FALLBACK_IMAGE_URL;
        const [loading, setLoading] = useState(isRemote);

        return (
          <View key={r.id} style={styles.recipeRow}>
            <View style={styles.imageBox}>
              {isRemote && loading && (
                <ActivityIndicator size="small" color="#999" style={styles.spinner} />
              )}
              <Image
                source={getImageSource(r.image)}
                style={styles.image}
                resizeMode="cover"
                onLoadEnd={() => setLoading(false)}
              />
            </View>
            <Text style={styles.recipeText}>🍽 {r.title}</Text>
          </View>
        );
      })}

      <View style={{ marginTop: 10 }}>
        <Button title="🗑️ Delete Plan" onPress={() => setShowDeleteConfirm(true)} color="#C62828" />
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        message={`Delete plan from ${startDate.toDateString()} to ${endDate.toDateString()}?`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(id);
          setShowDeleteConfirm(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    marginVertical: 10,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recipeText: {
    fontSize: 14,
    flexShrink: 1,
  },
  imageBox: {
    width: 40,
    height: 40,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    position: 'absolute',
    zIndex: 1,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
});
