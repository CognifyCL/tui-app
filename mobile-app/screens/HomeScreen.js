import React from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, TextInput, Button, Card, Chip, ActivityIndicator, List, useTheme } from 'react-native-paper';
import { useTerminal } from '../hooks/useTerminal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveHost } from '../utils/url';
import { useLogger } from '../hooks/useLogger';
import * as Haptics from 'expo-haptics';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { 
    serverIp, setServerIp, 
    sessionName, setSessionName, 
    sessions, setSessions,
    isRefreshing, setIsRefreshing,
    recentHosts, connect, status
  } = useTerminal();
  const { log } = useLogger();

  const fetchSessions = async () => {
    if (!serverIp) {
      log('Please enter a host address first', 'error');
      return;
    }

    const { httpUrl } = resolveHost(serverIp);
    setIsRefreshing(true);
    log(`Fetching sessions from ${httpUrl}/sessions...`, 'info');
    
    try {
      const response = await fetch(`${httpUrl}/sessions`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSessions(data);
      log(`Fetched ${data.length} sessions`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      log(`Fetch error: ${error.message}`, 'error');
      setSessions([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConnect = () => {
    connect(serverIp, sessionName);
    navigation.navigate('Terminal');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchSessions} />
      }
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>🚀 TUI Manager</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Host Address"
              value={serverIp}
              onChangeText={setServerIp}
              mode="outlined"
              placeholder="e.g. 100.64.0.5"
              autoCapitalize="none"
              style={styles.input}
            />

            {recentHosts.length > 0 && (
              <View style={styles.historyContainer}>
                <Text variant="labelLarge" style={styles.label}>Recent Hosts:</Text>
                <View style={styles.hostChips}>
                  {recentHosts.map((h, i) => (
                    <Chip 
                      key={i} 
                      selected={serverIp === h.ip}
                      onPress={() => {
                        setServerIp(h.ip);
                        Haptics.selectionAsync();
                      }}
                      style={styles.chip}
                    >
                      {h.ip}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              label="Session Name"
              value={sessionName}
              onChangeText={setSessionName}
              mode="outlined"
              placeholder="default"
              autoCapitalize="none"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Available Sessions" subtitle="Pull to refresh" />
          <Card.Content>
            {isRefreshing && <ActivityIndicator animating={true} style={styles.loader} />}
            {sessions.length > 0 ? (
              sessions.map((s, idx) => (
                <List.Item
                  key={idx}
                  title={s}
                  onPress={() => {
                    setSessionName(s);
                    Haptics.selectionAsync();
                  }}
                  left={props => <List.Icon {...props} icon="terminal" />}
                  right={props => sessionName === s ? <List.Icon {...props} icon="check" color="#0f0" /> : null}
                />
              ))
            ) : (
              <Text style={[styles.noSessions, { color: theme.colors.onSurfaceVariant }]}>
                {serverIp ? "No active sessions found." : "Enter a host IP to discover sessions."}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={handleConnect} 
          style={styles.connectButton}
          contentStyle={styles.connectButtonContent}
        >
          CONNECT
        </Button>
        
        <Text style={[styles.status, { color: theme.colors.onSurfaceVariant }]}>Status: {status}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  card: { marginBottom: 16 },
  input: { marginBottom: 12 },
  label: { marginBottom: 8 },
  historyContainer: { marginBottom: 12 },
  hostChips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 8, marginBottom: 8 },
  loader: { marginVertical: 10 },
  noSessions: { textAlign: 'center', padding: 20, fontStyle: 'italic' },
  connectButton: { marginTop: 8, borderRadius: 8 },
  connectButtonContent: { paddingVertical: 8 },
  status: { marginTop: 16, textAlign: 'center', fontSize: 12 }
});
