import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, List, IconButton, FAB, Card } from 'react-native-paper';
import { useTerminal } from '../hooks/useTerminal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HostsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { recentHosts, setServerIp } = useTerminal();

  const handleSelectHost = (ip) => {
    setServerIp(ip);
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>
        {recentHosts.length > 0 ? (
          recentHosts.map((host, index) => (
            <Card key={index} style={styles.card} onPress={() => handleSelectHost(host.ip)}>
              <List.Item
                title={host.ip}
                description={`Last used: ${new Date(host.lastUsed).toLocaleString()}`}
                left={props => <List.Icon {...props} icon="server" />}
                right={props => (
                  <View style={styles.actions}>
                    <IconButton icon="pencil" onPress={() => {}} />
                    <IconButton icon="delete" onPress={() => {}} />
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
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { marginBottom: 20, fontWeight: 'bold' },
  card: { marginBottom: 12 },
  actions: { flexDirection: 'row' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontStyle: 'italic' },
  fab: { position: 'absolute', right: 16 }
});
