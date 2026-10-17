import React, { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Image, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, json } from '../lib/api';
import { Button, Field, ui } from './ui';

interface Configuration {
  provider: string;
  model: string;
  available: boolean;
  image_supported: boolean;
  note: string;
}
export function ExtractPanel<T>({
  task,
  onPreview,
}: {
  task: 'recipe' | 'pantry' | 'offers';
  onPreview: (data: T) => void;
}) {
  const focused = useIsFocused();
  const [config, setConfig] = useState<Configuration | null>(null);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController();
    void api<Configuration>('/models/config', { signal: controller.signal })
      .then(setConfig)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [focused]);
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>
        {task === 'recipe'
          ? 'Recipe Scout'
          : task === 'pantry'
            ? 'Photo pantry scan'
            : 'Flyer extraction'}
      </Text>
      <Text style={ui.subtitle}>
        {config?.available
          ? `${config.provider} · ${config.model}`
          : 'Optional: configure an API provider or a signed-in subscription CLI on the server.'}
      </Text>
      <Text style={ui.subtitle}>
        Paste recipe/video transcript text, a label list, or flyer details. Only submitted material
        is sent for extraction. Review the result before saving.
      </Text>
      {error && <Text style={ui.error}>{error}</Text>}
      <Field label={`Extraction text (${task})`} value={text} onChangeText={setText} multiline />
      {config?.image_supported && (
        <Button
          title="Choose image for extraction"
          secondary
          disabled={!config.available}
          onPress={async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              base64: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets[0]?.base64) {
              const asset = result.assets[0];
              setImage(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
            }
          }}
        />
      )}
      {image && (
        <>
          <Image
            source={{ uri: image }}
            style={{ height: 180, width: '100%', borderRadius: 12 }}
            accessibilityLabel="Selected extraction image"
          />
          <Button title="Remove selected image" secondary onPress={() => setImage(null)} />
        </>
      )}
      <Button
        title="Extract for review"
        disabled={!config?.available || (!text.trim() && !image)}
        onPress={async () =>
          onPreview(await api<T>('/extract', json('POST', { task, text, image })))
        }
      />
    </View>
  );
}
