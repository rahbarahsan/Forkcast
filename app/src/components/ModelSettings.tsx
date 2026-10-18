import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api, json } from '../lib/api';
import { Button, Field, ui } from './ui';

interface Configuration {
  provider: string;
  model: string;
  available: boolean;
  environment_managed: boolean;
  choices: { provider: string; ready: boolean }[];
}
export function ModelSettings() {
  const [config, setConfig] = useState<Configuration | null>(null);
  const [model, setModel] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Configuration>('/models/config')
      .then((value) => {
        setConfig(value);
        setModel(value.model === 'CLI default' ? '' : value.model);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Your kitchen assistant</Text>
      <Text style={ui.subtitle}>
        {config?.available
          ? `Connected through ${config.provider}.`
          : 'Connect a subscription or an API provider to use the assistant and ingredient interpretation.'}
      </Text>
      <Text style={ui.subtitle}>
        Selected recipes, pantry, plans and your conversation are sent to your chosen provider.
        Personal records stay out of the shared dataset.
      </Text>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      <Button
        title={open ? 'Hide model settings' : 'Model settings'}
        secondary
        onPress={() => setOpen(!open)}
      />
      {open && config && (
        <>
          <Field
            label="Model name (optional for subscriptions)"
            value={model}
            onChangeText={setModel}
            disabled={config.environment_managed}
          />
          {config.environment_managed ? (
            <Text style={ui.text}>
              The server environment manages this installation’s provider.
            </Text>
          ) : (
            <View style={ui.row}>
              {config.choices.map((choice) => (
                <Button
                  key={choice.provider}
                  title={choice.provider === 'none' ? 'Work offline' : `Use ${choice.provider}`}
                  secondary={choice.provider !== config.provider}
                  disabled={!choice.ready}
                  onPress={async () =>
                    setConfig(
                      await api<Configuration>(
                        '/models/config',
                        json('PUT', { provider: choice.provider, model }),
                      ),
                    )
                  }
                />
              ))}
            </View>
          )}
          <Text style={ui.subtitle}>
            Subscription modes use your signed-in local CLI. API keys stay in server environment
            variables: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY. API modes also require
            a model name.
          </Text>
        </>
      )}
    </View>
  );
}
