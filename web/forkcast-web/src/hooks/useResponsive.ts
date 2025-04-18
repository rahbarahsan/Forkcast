import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, Platform } from 'react-native';

// Define standard breakpoints for consistent responsive design
export const BREAKPOINTS = {
  xs: 0, // Extra small devices (phones, less than 576px)
  sm: 576, // Small devices (landscape phones, 576px and up)
  md: 768, // Medium devices (tablets, 768px and up)
  lg: 992, // Large devices (desktops, 992px and up)
  xl: 1200, // Extra large devices (large desktops, 1200px and up)
  xxl: 1400, // Extra extra large devices (larger desktops, 1400px and up)
};

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ResponsiveInfo {
  width: number;
  height: number;
  screenSize: ScreenSize;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isWeb: boolean;
}

/**
 * Custom hook for responsive design
 * Provides screen size information and responsive breakpoints
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Memoize the getScreenSize function to avoid recreating it on each render
  const getScreenSize = useCallback((width: number): ScreenSize => {
    if (width >= BREAKPOINTS.xxl) return 'xxl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }, []);

  const [screenSize, setScreenSize] = useState<ScreenSize>(getScreenSize(width));

  // Update screen size when dimensions change
  useEffect(() => {
    setScreenSize(getScreenSize(width));
  }, [width, getScreenSize]);

  // Add event listener for window resize on web
  useEffect(() => {
    // Only run this effect on web platform
    if (!isWeb) return;

    // In React Native Web, we can access window directly
    // but we need to check if it exists first
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setScreenSize(getScreenSize(window.innerWidth));
      };

      // Add event listener
      window.addEventListener('resize', handleResize);

      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isWeb, getScreenSize]);

  // Compute derived values once
  const derivedInfo = {
    width,
    height,
    screenSize,
    isMobile: screenSize === 'xs' || screenSize === 'sm',
    isTablet: screenSize === 'md' || screenSize === 'lg',
    isDesktop: screenSize === 'xl',
    isLargeDesktop: screenSize === 'xxl',
    isWeb,
  };

  return derivedInfo;
}
