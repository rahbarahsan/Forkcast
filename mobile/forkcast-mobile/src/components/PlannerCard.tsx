// src/components/PlannerCard.tsx
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import ConfirmDialog from './ConfirmDialog';

type PlannerCardProps = {
  id: string;
  startDate: Date;
  endDate: Date;
  recipes: { id: string; title: string }[];
  onDelete: (id: string) => void;
};

export default function PlannerCard({
  id,
  startDate,
  endDate,
  recipes,
  onDelete,
}: PlannerCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <View
      style={{
        padding: 10,
        marginVertical: 10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
      }}
    >
      <Text style={{ fontWeight: 'bold' }}>
        📅 {startDate.toDateString()} – {endDate.toDateString()}
      </Text>
      {recipes.map((r) => (
        <Text key={r.id}>🍽 {r.title}</Text>
      ))}

      <View style={{ marginTop: 10 }}>
        <Button title="🗑️ Delete Plan" onPress={() => setShowDeleteConfirm(true)} color="#C62828" />
      </View>

      <ConfirmDialog
        visible={showDeleteConfirm}
        message={`Delete plan from ${startDate.toDateString()} to ${endDate.toDateString()}?`}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(id);
          setShowDeleteConfirm(false);
        }}
      />
    </View>
  );
}
