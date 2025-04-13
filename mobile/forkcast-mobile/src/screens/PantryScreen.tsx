// src/screens/PantryScreen.tsx
import React, { useState, useContext } from 'react';
import { View, TextInput, Button, Text, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import screenStyles from '../styles/screenStyle';
import { PantryContext } from '../context/PantryContext';

const unitOptions = ['pcs', 'g', 'kg', 'ml', 'litre', 'tbsp', 'tsp', 'cup', 'cloves'];

export default function PantryScreen() {
  const { items, addItem, resetPantry } = useContext(PantryContext);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');

  const handleAdd = () => {
    if (name.trim() && quantity.trim()) {
      const finalQuantity = `${quantity} ${unit}`;
      addItem({ name: name.trim(), quantity: finalQuantity });
      setName('');
      setQuantity('');
      setUnit('pcs');
    }
  };

  return (
    <View style={screenStyles.container}>
      <TextInput
        placeholder="Ingredient"
        value={name}
        onChangeText={setName}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      <Text style={{ fontWeight: 'bold' }}>Quantity </Text>
      <TextInput
        placeholder="e.g. 0.5,1"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />

      <Text style={{ fontWeight: 'bold' }}>Unit</Text>
      <Picker selectedValue={unit} onValueChange={(val) => setUnit(val)}>
        {unitOptions.map((u) => (
          <Picker.Item label={u} value={u} key={u} />
        ))}
      </Picker>

      <Button title="Add to Pantry" onPress={handleAdd} />
      <Button title="Reset Pantry" onPress={resetPantry} color="red" />

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        renderItem={({ item }) => (
          <Text>
            {item.name} - {item.quantity}
          </Text>
        )}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
