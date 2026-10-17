import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, DeleteButton, Field, Page, ui } from '../components/ui';
import { ModelSettings } from '../components/ModelSettings';
import { useHousehold } from '../context/HouseholdContext';
import { api, json } from '../lib/api';

interface TaskWrite {
  kind: string;
  data: { name?: string; title?: string; quantity?: string; recipeIds?: string[] };
}
interface Message {
  role: string;
  text: string;
  task_id?: string;
  status?: string;
  writes?: TaskWrite[];
  results?: {
    tool: string;
    result: {
      raw?: Record<string, Record<string, number>>;
      warnings?: string[];
      recommendation?: string;
      reason?: string;
      recipe?: { title: string };
    };
  }[];
}
interface Conversation {
  id: string;
  messages: Message[];
}

export default function AssistantScreen() {
  const { refresh, recipes } = useHousehold();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [current, setCurrent] = useState<Conversation | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  async function load() {
    const rows = await api<Conversation[]>('/conversations');
    setConversations(rows);
    return rows;
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function resolve(id: string, action: string) {
    await api(`/tasks/${id}/${action}`, json('POST'));
    await refresh();
    const rows = await load();
    setCurrent(rows.find((row) => row.id === current?.id) || null);
  }
  return (
    <Page
      title="A little help in the kitchen."
      description="Tell me what you want to get done. Review prepared changes, then put them to work."
    >
      <ModelSettings />
      <View style={ui.row}>
        <Button
          title="New conversation"
          secondary
          onPress={() => {
            setCurrent(null);
            setText('');
          }}
        />
        {conversations.slice(0, 4).map((conversation, index) => (
          <Button
            key={conversation.id}
            title={`Conversation ${index + 1}`}
            secondary
            onPress={() => setCurrent(conversation)}
          />
        ))}
      </View>
      {error && (
        <Text accessibilityRole="alert" style={ui.error}>
          {error}
        </Text>
      )}
      {!current && (
        <View style={ui.card}>
          <Text style={ui.heading}>What’s on your mind?</Text>
          {[
            'Plan three halal dinners using what’s in my pantry.',
            'Add 500 g rice and 4 eggs to my pantry.',
            'Compare stores for my active meal plan.',
          ].map((prompt) => (
            <Button key={prompt} title={prompt} secondary onPress={() => setText(prompt)} />
          ))}
        </View>
      )}
      {current?.messages.map((message, index) => (
        <View
          key={index}
          style={[
            ui.card,
            message.role === 'user' && { backgroundColor: '#eee8dc', marginLeft: 24 },
          ]}
        >
          <Text style={ui.label}>{message.role === 'user' ? 'YOU' : 'FORKCAST'}</Text>
          <Text style={ui.text}>{message.text}</Text>
          {message.results?.map((entry, resultIndex) => (
            <View key={resultIndex} style={{ gap: 8 }}>
              <Text style={ui.heading}>{entry.tool.replaceAll('_', ' ')}</Text>
              {entry.result.raw &&
                Object.entries(entry.result.raw).map(([name, units]) => (
                  <Text key={name} style={ui.text}>
                    {name} ·{' '}
                    {Object.entries(units)
                      .map(([unit, quantity]) =>
                        quantity ? `${quantity} ${unit}` : 'check amount',
                      )
                      .join(' + ')}
                  </Text>
                ))}
              {entry.result.recommendation && (
                <Text style={ui.text}>Best recorded coverage: {entry.result.recommendation}</Text>
              )}
              {entry.result.reason && <Text style={ui.subtitle}>{entry.result.reason}</Text>}
              {entry.result.recipe && (
                <Text style={ui.text}>Recipe preview: {entry.result.recipe.title}</Text>
              )}
              {entry.result.warnings?.map((warning) => (
                <Text key={warning} style={ui.subtitle}>
                  {warning}
                </Text>
              ))}
            </View>
          ))}
          {!!message.writes?.length && (
            <>
              <Text style={ui.heading}>Review changes</Text>
              {message.writes.map((write, i) => (
                <View key={i} style={{ gap: 4 }}>
                  <Text style={ui.text}>
                    {write.kind === 'plan'
                      ? 'Create meal plan'
                      : write.kind === 'recipe'
                        ? 'Save imported recipe'
                        : 'Add pantry stock'}
                    : {write.data.name || write.data.title} {write.data.quantity || ''}
                  </Text>
                  {write.data.recipeIds?.map((id) => (
                    <Text key={id} style={ui.subtitle}>
                      {recipes.find((recipe) => recipe.id === id)?.title || id}
                    </Text>
                  ))}
                </View>
              ))}
              {message.status === 'pending' && message.task_id ? (
                <View style={ui.row}>
                  <Button
                    title="Apply prepared changes"
                    onPress={() => resolve(message.task_id!, 'apply')}
                  />
                  <Button
                    title="Discard prepared changes"
                    secondary
                    onPress={() => resolve(message.task_id!, 'cancel')}
                  />
                </View>
              ) : (
                <Text style={ui.chip}>{message.status}</Text>
              )}
            </>
          )}
        </View>
      ))}
      <View style={ui.card}>
        <Field
          label="Message your kitchen assistant"
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Plan dinner, organize my pantry, or build my shopping list…"
        />
        <Button
          title="Send message"
          disabled={!text.trim()}
          onPress={async () => {
            const conversation = await api<Conversation>(
              '/chat',
              json('POST', { message: text, conversation_id: current?.id }),
            );
            setCurrent(conversation);
            setText('');
            await load();
          }}
        />
        <Text style={ui.subtitle}>
          Changes wait for Apply. Previews expire after one hour and must be refreshed if your
          kitchen changes.
        </Text>
      </View>
      {current && (
        <DeleteButton
          title="Delete conversation"
          onDelete={async () => {
            await api(`/conversations/${current.id}`, json('DELETE'));
            setCurrent(null);
            await load();
          }}
        />
      )}
    </Page>
  );
}
