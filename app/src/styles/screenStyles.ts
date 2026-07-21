import { StyleSheet } from 'react-native';
import { BREAKPOINTS } from '../hooks/useResponsive';

// Common responsive styles that can be used across screens
const screenStyles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },

  // Responsive container styles
  containerMobile: {
    width: '100%',
    padding: 10,
  },
  containerTablet: {
    width: '90%',
    maxWidth: 768,
    alignSelf: 'center',
    padding: 16,
  },
  containerDesktop: {
    width: '85%',
    maxWidth: 1200,
    alignSelf: 'center',
    padding: 20,
  },
  containerLargeDesktop: {
    width: '80%',
    maxWidth: 1400,
    alignSelf: 'center',
    padding: 24,
  },

  // Text styles
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headingMobile: {
    fontSize: 18,
  },
  headingTablet: {
    fontSize: 22,
  },
  headingDesktop: {
    fontSize: 24,
  },
  headingLargeDesktop: {
    fontSize: 28,
  },

  // Grid layouts
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemMobile: {
    width: '100%',
    marginBottom: 16,
  },
  gridItemMobileLandscape: {
    width: '48%',
    marginBottom: 16,
  },
  gridItemTablet: {
    width: '48%',
    marginBottom: 20,
  },
  gridItemDesktop: {
    width: '31%',
    marginBottom: 24,
  },
  gridItemLargeDesktop: {
    width: '23%',
    marginBottom: 30,
  },

  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Section styles
  section: {
    marginBottom: 24,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});

export default screenStyles;
