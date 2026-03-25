import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, List, FAB, Card, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTerminal } from '../hooks/useTerminal';

export default function SnippetsScreen() {
  const insets = useSafeAreaInsets();
  const { sendInput } = useTerminal();
  const snippets = [
    { label: 'System Update', command: 'sudo apt update && sudo apt upgrade -y' },
    { label: 'Check Logs', command: 'tail -f /var/log/syslog' },
    { label: 'Docker Status', command: 'docker ps -a' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}>
        {snippets.map((snippet, index) => (
          <Card key={index} style={styles.card}>
            <List.Item
              title={snippet.label}
              description={snippet.command}
              left={props => <List.Icon {...props} icon="code-tags" />}
              right={props => (
                <IconButton 
                  icon="play-circle" 
                  onPress={() => sendInput(snippet.command + '\n')} 
                />
              )}
            />
          </Card>
        ))}
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
  fab: { position: 'absolute', right: 16 }
});
