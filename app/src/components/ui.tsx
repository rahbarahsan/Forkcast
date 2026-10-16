import React, { useState } from 'react';
import { useBusy } from '../lib/BusyContext';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export const colors = {
  ink: '#1e342a',
  green: '#245544',
  muted: '#53665b',
  border: '#dce3d6',
  paper: '#f7f8f2',
};
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: 24,
    gap: 18,
    paddingBottom: 60,
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.ink, letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  heading: { fontSize: 20, fontWeight: '600', color: colors.ink },
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
  chip: { color: colors.green, backgroundColor: '#e9eddf', padding: 8, borderRadius: 8 },
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
          padding: 12,
          minHeight: 46,
          borderRadius: 10,
          backgroundColor: secondary ? '#e9eddf' : colors.green,
          opacity: disabled || busy || pressed ? 0.6 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {busy ? (
          <ActivityIndicator color={secondary ? colors.green : '#fff'} />
        ) : (
          <Text style={{ color: secondary ? colors.green : '#fff', fontWeight: '600' }}>
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
