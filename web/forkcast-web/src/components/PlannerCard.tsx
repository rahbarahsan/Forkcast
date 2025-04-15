import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Button,
  TouchableOpacity,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
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
  const { width, isMobile, isTablet, isDesktop, isLargeDesktop, isWeb } = useResponsive();

  const isLargeScreen = isDesktop || isLargeDesktop;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getImageSource = (img?: string) => {
    if (img && img.startsWith('http') && img !== FALLBACK_IMAGE_URL) {
      return { uri: img };
    }
    return { uri: FALLBACK_IMAGE_URL };
  };

  // Format date to be more readable
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <View
      style={[
        styles.card,
        isMobile && styles.cardSmall,
        isTablet && styles.cardMedium,
        (isDesktop || isLargeDesktop) && styles.cardLarge,
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          📅 {formatDate(startDate)} – {formatDate(endDate)}
        </Text>
        <Text style={styles.duration}>
          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
        </Text>
      </View>

      <View
        style={[
          styles.recipesContainer,
          (isTablet || isDesktop || isLargeDesktop) && {
            flexDirection: 'row',
            flexWrap: 'wrap',
          },
        ]}
      >
        {recipes.map((r) => {
          const isRemote = r.image && r.image.startsWith('http') && r.image !== FALLBACK_IMAGE_URL;
          const [loading, setLoading] = useState(isRemote);

          return (
            <View
              key={r.id}
              style={[
                styles.recipeRow,
                isLargeDesktop && { width: '33.33%', paddingRight: 8 },
                isDesktop && { width: '50%', paddingRight: 8 },
                isTablet && { width: '50%', paddingRight: 8 },
              ]}
            >
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
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => setShowDeleteConfirm(true)}>
          <Text style={styles.deleteButtonText}>🗑️ Delete Plan</Text>
        </TouchableOpacity>
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
    padding: 16,
    marginVertical: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSmall: {
    padding: 12,
  },
  cardMedium: {
    padding: 16,
  },
  cardLarge: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  recipesContainer: {
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
  },
  recipeText: {
    fontSize: 14,
    flexShrink: 1,
    color: '#333',
  },
  imageBox: {
    width: 50,
    height: 50,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  spinner: {
    position: 'absolute',
    zIndex: 1,
  },
  image: {
    width: 50,
    height: 50,
  },
  buttonContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: '600',
  },
});
