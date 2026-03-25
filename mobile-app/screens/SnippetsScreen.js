import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Text, List, FAB, Card, IconButton,
  Modal, Portal, TextInput, Button, Dialog, useTheme
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTerminal } from '../hooks/useTerminal';

const STORAGE_KEY = '@cognifycl/snippets';
const EMPTY_FORM = { label: '', command: '' };

const DEFAULT_SNIPPETS = [
  { id: '1', label: 'System Update', command: 'sudo apt update && sudo apt upgrade -y' },
  { id: '2', label: 'Check Logs', command: 'tail -f /var/log/syslog' },
  { id: '3', label: 'Docker Status', command: 'docker ps -a' },
];

export default function SnippetsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { sendInput } = useTerminal();

  const [snippets, setSnippets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSnippets(JSON.parse(data));
      } else {
        setSnippets(DEFAULT_SNIPPETS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SNIPPETS));
      }
    } catch (_) {
      setSnippets(DEFAULT_SNIPPETS);
    }
  };

  const persist = async (updated) => {
    setSnippets(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.command.trim()) return;
    const newSnippet = {
      id: Date.now().toString(),
      label: form.label.trim(),
      command: form.command.trim(),
    };
    await persist([...snippets, newSnippet]);
    setModalVisible(false);
    setForm(EMPTY_FORM);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await persist(snippets.filter(s => s.id !== deleteTarget));
      setDeleteTarget(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>Add Snippet</Text>
          <TextInput
            label="Name"
            value={form.label}
            onChangeText={(v) => setForm(f => ({ ...f, label: v }))}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Command"
            value={form.command}
            onChangeText={(v) => setForm(f => ({ ...f, command: v }))}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!form.label.trim() || !form.command.trim()}
            >
              Save
            </Button>
          </View>
        </Modal>

        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Snippet</Dialog.Title>
          <Dialog.Content>
            <Text>Remove this snippet?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onPress={handleConfirmDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>
        {snippets.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No snippets yet.</Text>
        ) : (
          snippets.map((snippet) => (
            <Card key={snippet.id} style={styles.card}>
              <List.Item
                title={snippet.label}
                description={snippet.command}
                left={props => <List.Icon {...props} icon="code-tags" />}
                right={() => (
                  <View style={styles.actions}>
                    <IconButton
                      icon="play-circle"
                      onPress={() => sendInput(snippet.command + '\n')}
                    />
                    <IconButton
                      icon="delete"
                      onPress={() => setDeleteTarget(snippet.id)}
                    />
                  </View>
                )}
              />
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => {
          setForm(EMPTY_FORM);
          setModalVisible(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { marginBottom: 12 },
  actions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  fab: { position: 'absolute', right: 16 },
  modal: { margin: 20, padding: 20, borderRadius: 8 },
  modalTitle: { marginBottom: 12 },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
