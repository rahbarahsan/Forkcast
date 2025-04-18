import { StyleSheet } from 'react-native';
import { BREAKPOINTS, ScreenSize } from '../hooks/useResponsive';

// Define color palette for consistent styling
const COLORS = {
  primary: '#3498db',
  danger: '#E74C3C',
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  border: '#F0F0F0',
  borderDark: '#EFEFEF',
  text: {
    dark: '#333333',
    medium: '#666666',
    light: '#999999',
    white: '#FFFFFF',
  },
};

// Define typography for consistent text styling
const TYPOGRAPHY = {
  header: {
    fontSize: 22,
    fontWeight: 'bold' as const,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
  },
};

// Define spacing for consistent layout
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Create responsive styles based on screen size
const createResponsiveStyles = (screenSize: ScreenSize) => {
  // Adjust spacing and font sizes based on screen size
  const isSmallScreen = screenSize === 'xs' || screenSize === 'sm';
  const containerPadding = isSmallScreen ? SPACING.md : SPACING.lg;
  const itemPadding = isSmallScreen ? SPACING.sm : SPACING.md;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: containerPadding,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: containerPadding,
      paddingVertical: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    headerTitle: {
      ...TYPOGRAPHY.header,
      color: COLORS.text.dark,
    },
    headerActions: {
      flexDirection: 'row',
    },
    shareButton: {
      padding: SPACING.sm,
    },
    planSelectorContainer: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    planButton: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      marginHorizontal: SPACING.xs,
      borderRadius: 20,
      backgroundColor: COLORS.backgroundLight,
    },
    activePlanButton: {
      backgroundColor: COLORS.primary,
    },
    planButtonText: {
      ...TYPOGRAPHY.caption,
      color: COLORS.text.medium,
    },
    activePlanButtonText: {
      color: COLORS.text.white,
      fontWeight: '500',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...TYPOGRAPHY.title,
      color: COLORS.text.dark,
    },
    statLabel: {
      ...TYPOGRAPHY.small,
      color: COLORS.text.medium,
      marginTop: SPACING.xs,
    },
    categoryContainer: {
      marginVertical: SPACING.sm,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.borderDark,
    },
    categoryTitle: {
      ...TYPOGRAPHY.subtitle,
      color: COLORS.text.dark,
    },
    categoryCount: {
      ...TYPOGRAPHY.caption,
      color: COLORS.text.medium,
    },
    groceryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: COLORS.primary,
      marginRight: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    groceryText: {
      ...TYPOGRAPHY.body,
      color: COLORS.text.dark,
    },
    groceryTextCompleted: {
      textDecorationLine: 'line-through',
      color: COLORS.text.light,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: SPACING.lg,
      ...TYPOGRAPHY.body,
      color: COLORS.text.medium,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      ...TYPOGRAPHY.subtitle,
      color: COLORS.text.dark,
      marginTop: SPACING.lg,
    },
    emptySubtitle: {
      ...TYPOGRAPHY.caption,
      color: COLORS.text.medium,
      textAlign: 'center',
      marginTop: SPACING.sm,
      paddingHorizontal: SPACING.xxl,
    },
    clearButton: {
      padding: SPACING.lg,
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    clearButtonText: {
      ...TYPOGRAPHY.caption,
      color: COLORS.danger,
    },
  });
};

const baseStyles = createResponsiveStyles('md');

// Export both the base styles and a function to get responsive styles
export default {
  ...baseStyles,
  getResponsiveStyles: createResponsiveStyles,
};
