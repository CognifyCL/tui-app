import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Button,
  List,
  Portal,
  Dialog,
  TextInput,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { useTerminal } from '../hooks/useTerminal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveHost } from '../utils/url';
import { useLogger } from '../hooks/useLogger';
import * as Haptics from 'expo-haptics';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    serverIp,
    sessions, setSessions,
    isRefreshing, setIsRefreshing,
    connect, status,
  } = useTerminal();
  const { log } = useLogger();
  const autoFetchedRef = useRef(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('default');

  const connectedSession = status.startsWith('Connected: ')
    ? status.slice('Connected: '.length)
    : null;

  // Register the + header button
  const showDialog = useCallback(() => {
    setNewSessionName('default');
    setDialogVisible(true);
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="plus"
          onPress={showDialog}
          iconColor={theme.colors.onSurface}
        />
      ),
    });
  }, [navigation, showDialog, theme.colors.onSurface]);

  // Auto-fetch sessions once when serverIp becomes available
  useEffect(() => {
    if (serverIp && !autoFetchedRef.current) {
      autoFetchedRef.current = true;
      fetchSessions();
    }
  }, [serverIp]);

  const fetchSessions = async () => {
    if (!serverIp) {
      log('No host configured', 'error');
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

  const handleCreateSession = () => {
    setDialogVisible(false);
    connect(serverIp, newSessionName);
    navigation.navigate('Terminal');
  };

  const handleConnectSession = (name) => {
    Haptics.selectionAsync();
    connect(serverIp, name);
    navigation.navigate('Terminal');
  };

  // Empty state: no host configured
  if (!serverIp) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Text
          variant="bodyLarge"
          style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
        >
          No host configured. Add one in Hosts.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Hosts')}
          style={styles.emptyButton}
        >
          Go to Hosts
        </Button>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchSessions} />
        }
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              No active sessions. Create one with +
            </Text>
          </View>
        ) : (
          sessions.map((s, idx) => {
            const isActive = s.name === connectedSession;
            const descParts = [];
            if (s.attached) descParts.push('attached');
            descParts.push(`${s.windows} window${s.windows !== 1 ? 's' : ''}`);
            if (s.created) descParts.push(s.created);
            const description = descParts.join(' · ');
            return (
              <List.Item
                key={idx}
                title={s.name}
                description={description}
                titleStyle={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
                style={[
                  styles.sessionItem,
                  isActive && { backgroundColor: theme.colors.primaryContainer },
                ]}
                onPress={() => handleConnectSession(s.name)}
                left={(props) => (
                  <List.Icon {...props} icon="terminal" />
                )}
                right={(props) => (
                  <List.Icon
                    {...props}
                    icon={s.attached ? 'circle' : 'chevron-right'}
                    color={s.attached ? theme.colors.primary : undefined}
                  />
                )}
              />
            );
          })
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>New Session</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Session name"
              value={newSessionName}
              onChangeText={setNewSessionName}
              mode="outlined"
              autoFocus
              autoCapitalize="none"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateSession}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    minWidth: 160,
  },
  sessionItem: {
    paddingVertical: 4,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessionTitleActive: {
    fontWeight: '700',
  },
});
