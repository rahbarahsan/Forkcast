// The sign-in UI is shared between web and mobile; see AuthScreen.tsx.
// This file is kept so the platform-suffixed import path still resolves, and as
// the place to put web-only sign-in behaviour if it is ever needed.
export { default } from './AuthScreen';
