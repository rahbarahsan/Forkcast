import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';

type Mode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const { user, signIn, signUp, signOut, initializing } = useAuth();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError('Enter both an email address and a password.');
      return;
    }
    // Supabase rejects shorter passwords server-side; catching it here avoids a
    // pointless round trip and gives a clearer message.
    if (mode === 'signUp' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setNotice('Check your inbox to confirm your address, then sign in.');
      setMode('signIn');
      setPassword('');
    }
  };

  if (initializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#E07A5F" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.card}>
          <Text style={styles.heading}>You are signed in</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.subtle}>
            Your pantry and meal plans are saved to your account and will be here next time.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={signOut}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.heading}>{mode === 'signIn' ? 'Welcome back' : 'Create an account'}</Text>
          <Text style={styles.subtle}>
            {mode === 'signIn'
              ? 'Sign in to keep your pantry and plans across devices.'
              : 'Sign up to save your pantry and meal plans.'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#B0A79F"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!busy}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#B0A79F"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
            editable={!busy}
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <TouchableOpacity
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{mode === 'signIn' ? 'Sign in' : 'Sign up'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
              setNotice(null);
            }}
            disabled={busy}
          >
            <Text style={styles.switchText}>
              {mode === 'signIn'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.guestNote}>
            You can keep using Forkcast without an account — signing in only adds saving across
            devices.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#3D405B', marginBottom: 6 },
  subtle: { fontSize: 14, color: '#7A736C', marginBottom: 20, lineHeight: 20 },
  email: { fontSize: 16, fontWeight: '600', color: '#3D405B', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E8E0D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#3D405B',
    backgroundColor: '#FDFBF8',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#E07A5F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E07A5F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: { color: '#E07A5F', fontSize: 16, fontWeight: '600' },
  switchText: { color: '#E07A5F', fontSize: 14, textAlign: 'center', marginTop: 16 },
  error: { color: '#C1442E', fontSize: 14, marginBottom: 10 },
  notice: { color: '#2A7F62', fontSize: 14, marginBottom: 10 },
  guestNote: {
    fontSize: 12,
    color: '#9A928B',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 17,
  },
});
