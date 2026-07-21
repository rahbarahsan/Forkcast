import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type AlertDialogProps = {
  visible: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
};

export default function AlertDialog({
  visible,
  title = 'Alert',
  message,
  buttonText = 'OK',
  onClose,
}: AlertDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.okButton} onPress={onClose}>
            <Text style={styles.okText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  okButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  okText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
