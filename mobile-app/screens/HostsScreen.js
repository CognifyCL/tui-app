import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Text, List, IconButton, FAB, Card,
  Modal, Portal, TextInput, Button, Dialog
} from 'react-native-paper';
import { useTerminal } from '../hooks/useTerminal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMPTY_FORM = { name: '', ip: '' };

export default function HostsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { recentHosts, setServerIp, addHost, editHost, deleteHost } = useTerminal();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingIp, setEditingIp] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSelectHost = (ip) => {
    setServerIp(ip);
    navigation.navigate('Home');
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setEditingIp(null);
    setModalVisible(true);
  };

  const openEditModal = (host) => {
    setForm({ name: host.name || '', ip: host.ip });
    setEditingIp(host.ip);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.ip.trim()) return;
    if (editingIp) {
      await editHost(editingIp, { name: form.name.trim(), ip: form.ip.trim() });
    } else {
      await addHost({ name: form.name.trim(), ip: form.ip.trim() });
    }
    setModalVisible(false);
    setForm(EMPTY_FORM);
    setEditingIp(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteHost(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            {editingIp ? 'Edit Host' : 'Add Host'}
          </Text>
          <TextInput
            label="Name (optional)"
            value={form.name}
            onChangeText={(v) => setForm(f => ({ ...f, name: v }))}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Address (IP or hostname:port)"
            value={form.ip}
            onChangeText={(v) => setForm(f => ({ ...f, ip: v }))}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} disabled={!form.ip.trim()}>
              Save
            </Button>
          </View>
        </Modal>

        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Host</Dialog.Title>
          <Dialog.Content>
            <Text>Remove {deleteTarget} from the list?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onPress={handleConfirmDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>
        {recentHosts.length > 0 ? (
          recentHosts.map((host, index) => (
            <Card key={index} style={styles.card} onPress={() => handleSelectHost(host.ip)}>
              <List.Item
                title={host.name ? host.name : host.ip}
                description={host.name ? host.ip : `Last used: ${new Date(host.lastUsed).toLocaleString()}`}
                left={props => <List.Icon {...props} icon="server" />}
                right={() => (
                  <View style={styles.actions}>
                    <IconButton icon="pencil" onPress={() => openEditModal(host)} />
                    <IconButton icon="delete" onPress={() => setDeleteTarget(host.ip)} />
                  </View>
                )}
              />
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>No saved hosts yet.</Text>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={openAddModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { marginBottom: 12 },
  actions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontStyle: 'italic' },
  fab: { position: 'absolute', right: 16 },
  modal: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 8 },
  modalTitle: { marginBottom: 12 },
  input: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
