// Type definitions for window object in React Native Web
interface Window {
  innerWidth: number;
  innerHeight: number;
  addEventListener: (event: string, handler: () => void) => void;
  removeEventListener: (event: string, handler: () => void) => void;
}

declare var window: Window;
