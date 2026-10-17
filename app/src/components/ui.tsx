import React, { useState } from 'react';
import { useBusy } from '../lib/BusyContext';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export const colors = {
  ink: '#1c3027',
  green: '#234d3c',
  muted: '#59685e',
  border: '#e3e5da',
  paper: '#f8f7f1',
  lime: '#ddecaa',
  clay: '#e6af96',
};
export const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, Times New Roman, serif',
});
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    padding: 24,
    gap: 22,
    paddingBottom: 60,
  },
  title: {
    fontSize: 40,
    fontFamily: serif,
    fontWeight: '500',
    color: colors.ink,
    letterSpacing: -1.4,
    maxWidth: 800,
  },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  heading: {
    fontSize: 24,
    fontFamily: serif,
    fontWeight: '500',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#aebdad',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: '#fff',
    minHeight: 46,
  },
  text: { color: colors.ink, fontSize: 15, lineHeight: 23 },
  error: { color: '#9d2a1d', backgroundColor: '#fff0eb', padding: 12, borderRadius: 10 },
  chip: {
    color: colors.green,
    backgroundColor: '#eef1e5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    fontSize: 12,
    alignSelf: 'flex-start',
  },
});

export function Page({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12 }}>
        <View style={{ width: 22, height: 1, backgroundColor: colors.green }} />
        <Text style={{ fontSize: 10, letterSpacing: 2.5, color: colors.muted, fontWeight: '600' }}>
          THE EVERYDAY KITCHEN
        </Text>
      </View>
      <Text accessibilityRole="header" style={ui.title}>
        {title}
      </Text>
      {description && <Text style={ui.subtitle}>{description}</Text>}
      {children}
    </ScrollView>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void | Promise<unknown>;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const writing = useBusy();
  const [error, setError] = useState<string | null>(null);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || busy || writing }}
        disabled={disabled || busy || writing}
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await onPress();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Please try again');
          } finally {
            setBusy(false);
          }
        }}
        style={({ pressed }) => ({
          paddingVertical: 13,
          paddingHorizontal: 20,
          minHeight: 46,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: secondary ? colors.border : colors.green,
          backgroundColor: secondary ? '#f2f3e9' : colors.green,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: disabled || busy || pressed ? 0.6 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {busy ? (
          <ActivityIndicator color={secondary ? colors.green : '#fff'} />
        ) : (
          <Text
            style={{ color: secondary ? colors.green : '#fff', fontWeight: '600', fontSize: 13 }}
          >
            {title}
          </Text>
        )}
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  const writing = useBusy();
  return (
    <View>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={!disabled && !writing}
        accessibilityState={{ disabled: disabled || writing }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        style={[ui.input, multiline && { minHeight: 110, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function CheckItem({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked, disabled: busy }}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setError('');
          try {
            await onToggle();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save checkoff');
          } finally {
            setBusy(false);
          }
        }}
        style={{
          minHeight: 48,
          padding: 12,
          backgroundColor: checked ? '#e9eddf' : '#f7f8f2',
          borderRadius: 10,
        }}
      >
        <Text style={[ui.text, checked && { textDecorationLine: 'line-through' }]}>
          {checked ? '[x] ' : '[ ] '}
          {label}
        </Text>
      </Pressable>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

export function DeleteButton({
  title,
  onDelete,
}: {
  title: string;
  onDelete: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button title={title} secondary onPress={() => setOpen(true)} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#0008',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View style={[ui.card, { width: '100%', maxWidth: 420 }]} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={ui.heading}>
              {title}?
            </Text>
            <Text style={ui.text}>
              This removes the saved record from your kitchen. A deleted catalog override restores
              the original recipe.
            </Text>
            <Button
              title="Confirm deletion"
              onPress={async () => {
                await onDelete();
                setOpen(false);
              }}
            />
            <Button title="Keep it" secondary onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}
