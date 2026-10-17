import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { RecipeRow } from '../context/HouseholdContext';
import { api, json } from '../lib/api';
import { Button, Field, ui } from './ui';

interface VideoPreview {
  recipe: Partial<RecipeRow> | null;
  source_url: string;
  title: string;
  author: string;
  text: string;
  warnings: string[];
}

export function YouTubePanel({ onPreview }: { onPreview: (recipe: Partial<RecipeRow>) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<VideoPreview | null>(null);
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>From your watchlist to your table.</Text>
      <Text style={ui.subtitle}>
        Bring a cooking video into your collection. Review the recipe before saving.
      </Text>
      <Button
        title={open ? 'Close video import' : 'Import from YouTube'}
        secondary
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Field
            label="YouTube video URL"
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          <Field
            label="Video transcript or description (optional fallback)"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Button
            title="Fetch video recipe"
            disabled={!url.trim()}
            onPress={async () => {
              setResult(null);
              const preview = await api<VideoPreview>(
                '/import/youtube',
                json('POST', { url, pasted_text: text }),
              );
              setResult(preview);
              if (preview.recipe) onPreview(preview.recipe);
            }}
          />
          <Text style={ui.subtitle}>
            Fetching needs internet. Free-form captions need your configured model. No video is
            downloaded.
          </Text>
          {result && (
            <>
              <Text style={ui.heading}>{result.title || 'Video import review'}</Text>
              {result.warnings.map((warning) => (
                <Text key={warning} style={ui.subtitle}>
                  {warning}
                </Text>
              ))}
              {result.text && (
                <Button
                  title="Use fetched text as fallback"
                  secondary
                  onPress={() => setText(result.text)}
                />
              )}
              <Button
                title="Open original video"
                secondary
                onPress={() => Linking.openURL(result.source_url)}
              />
              {result.recipe && (
                <Text style={ui.text}>
                  Recipe loaded into the editor below. Check the quantities, then choose Save
                  recipe.
                </Text>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}
