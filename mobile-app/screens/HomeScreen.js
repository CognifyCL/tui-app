import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StyleSheet,
} from 'react-native';
import { Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTerminal } from '../hooks/useTerminal';
import { resolveHost } from '../utils/url';
import { useLogger } from '../hooks/useLogger';
import * as Haptics from 'expo-haptics';

const C = {
  bg: '#0e0e0e',
  surface: '#131313',
  surfaceHigh: '#20201f',
  primary: '#52fd2e',
  onPrimary: '#0e5b00',
  muted: '#adaaaa',
  outline: '#484847',
  error: '#ff7351',
  warn: '#eba300',
};

const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function StatusDashboard({ isConnected, sessions }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
      {/* SYSTEM STATUS */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          padding: 12,
          borderLeftWidth: 2,
          borderLeftColor: C.primary,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 6,
          }}
        >
          SYSTEM STATUS
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: isConnected ? C.primary : C.error,
            }}
          />
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: isConnected ? C.primary : C.error,
              fontWeight: '700',
            }}
          >
            {isConnected ? 'UPLINK_STABLE' : 'DISCONNECTED'}
          </Text>
        </View>
      </View>

      {/* ACTIVE SESSIONS */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          padding: 12,
          marginLeft: 1,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 4,
          }}
        >
          ACTIVE SESSIONS
        </Text>
        <Text>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 20,
              color: C.primary,
              fontWeight: '700',
            }}
          >
            {sessions.length}
          </Text>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: C.muted,
            }}
          >
            {' TOTAL'}
          </Text>
        </Text>
      </View>

      {/* LATENCY */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          padding: 12,
          marginLeft: 1,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 4,
          }}
        >
          LATENCY
        </Text>
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 20,
            color: C.muted,
            fontWeight: '700',
          }}
        >
          —
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(72,72,71,0.15)',
      }}
    >
      <Text
        style={{
          fontWeight: '700',
          fontSize: 22,
          letterSpacing: -0.5,
          textTransform: 'uppercase',
          color: '#ffffff',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: C.muted,
          opacity: 0.7,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function SessionRow({ session, connectedSession, onPress }) {
  const isActive = session.name === connectedSession;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 2,
        gap: 10,
      }}
    >
      <MaterialCommunityIcons
        name="console"
        size={16}
        color={isActive ? C.primary : C.muted}
      />
      <Text
        style={{
          fontFamily: MONO,
          fontSize: 13,
          color: isActive ? C.primary : '#e0e0e0',
          flex: 1,
        }}
      >
        {session.name}
      </Text>
      {session.attached && (
        <View
          style={{
            backgroundColor: 'rgba(82,253,46,0.12)',
            paddingHorizontal: 5,
            paddingVertical: 2,
            borderRadius: 2,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              color: C.primary,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            ATT
          </Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={14} color={C.muted} />
    </TouchableOpacity>
  );
}

function HostCard({ serverIp, sessions, connectedSession, onConnect, onSessionPress, onNoHost, navigation }) {
  if (!serverIp) {
    return (
      <View
        style={{
          backgroundColor: C.surface,
          padding: 24,
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          style={{
            color: C.muted,
            fontSize: 13,
            fontFamily: MONO,
          }}
        >
          No hosts configured
        </Text>
        <TouchableOpacity
          onPress={onNoHost}
          activeOpacity={0.7}
          style={{
            backgroundColor: C.surfaceHigh,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: C.outline,
          }}
        >
          <Text
            style={{
              color: C.primary,
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Add Host
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderLeftWidth: 4,
        borderLeftColor: C.primary,
        marginBottom: 12,
      }}
    >
      {/* Card header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          gap: 12,
        }}
      >
        {/* Icon container */}
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: 'rgba(82,253,46,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
          }}
        >
          <MaterialCommunityIcons name="dns" size={20} color={C.primary} />
        </View>

        {/* Host info */}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 16,
                textTransform: 'uppercase',
                color: C.primary,
                letterSpacing: 0.5,
              }}
            >
              {serverIp.split(':')[0]}
            </Text>
            <View
              style={{
                backgroundColor: '#34e507',
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 2,
              }}
            >
              <Text
                style={{
                  color: '#0e5b00',
                  fontSize: 8,
                  fontWeight: '700',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                ACTIVE
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: C.muted,
            }}
          >
            {serverIp}
          </Text>
        </View>

        {/* CONNECT button */}
        <TouchableOpacity
          onPress={onConnect}
          activeOpacity={0.7}
          style={{
            backgroundColor: C.surfaceHigh,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderWidth: 1,
            borderColor: C.outline,
          }}
        >
          <Text
            style={{
              color: C.primary,
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            CONNECT
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions section */}
      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            opacity: 0.6,
            marginBottom: 8,
          }}
        >
          ATTACHED TMUX SESSIONS
        </Text>

        {sessions.length === 0 ? (
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: C.muted,
              opacity: 0.5,
              paddingVertical: 8,
            }}
          >
            No active sessions. Create one with +
          </Text>
        ) : (
          sessions.map((s, idx) => (
            <SessionRow
              key={idx}
              session={s}
              connectedSession={connectedSession}
              onPress={() => onSessionPress(s.name)}
            />
          ))
        )}
      </View>
    </View>
  );
}

function LogStrip({ logs }) {
  const last3 = logs.slice(-3);

  const levelStyle = (level) => {
    if (level === 'error') return { color: C.error };
    if (level === 'warn') return { color: C.warn };
    return { color: C.primary };
  };

  const levelPrefix = (level) => {
    if (level === 'error') return '[ERR]';
    if (level === 'warn') return '[WARN]';
    return '[OK]';
  };

  return (
    <View
      style={{
        backgroundColor: '#000',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(72,72,71,0.4)',
      }}
    >
      {last3.length === 0 ? (
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: C.muted,
            opacity: 0.4,
          }}
        >
          {'// no log entries'}
        </Text>
      ) : (
        last3.map((entry, idx) => (
          <View key={idx} style={{ flexDirection: 'row', gap: 6 }}>
            <Text
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: '700',
                ...levelStyle(entry.level),
              }}
            >
              {levelPrefix(entry.level)}
            </Text>
            <Text
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: C.muted,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {entry.message}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    serverIp,
    sessions, setSessions,
    isRefreshing, setIsRefreshing,
    connect, status,
    logs,
  } = useTerminal();
  const { log } = useLogger();
  const autoFetchedRef = useRef(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('default');

  const connectedSession = status.startsWith('Connected: ')
    ? status.slice('Connected: '.length)
    : null;

  const isConnected = !!serverIp;

  const showDialog = useCallback(() => {
    setNewSessionName('default');
    setDialogVisible(true);
  }, []);

  // Remove header right — FAB replaces it
  useEffect(() => {
    navigation.setOptions({ headerRight: () => null });
  }, [navigation]);

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

  const handleConnectButton = () => {
    if (sessions.length > 0) {
      handleConnectSession(sessions[0].name);
    } else {
      showDialog();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 14,
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchSessions}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        <StatusDashboard isConnected={isConnected} sessions={sessions} />

        <SectionHeader title="HOSTS" subtitle="./managed_endpoints" />

        <HostCard
          serverIp={serverIp}
          sessions={sessions}
          connectedSession={connectedSession}
          onConnect={handleConnectButton}
          onSessionPress={handleConnectSession}
          onNoHost={() => navigation.navigate('Hosts')}
          navigation={navigation}
        />
      </ScrollView>

      {/* Log strip — fixed above tab bar */}
      <View style={{ paddingBottom: insets.bottom }}>
        <LogStrip logs={logs ?? []} />
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={showDialog}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 64,
          right: 16,
          width: 48,
          height: 48,
          backgroundColor: C.primary,
          borderRadius: 4,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 6,
          shadowColor: C.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}
      >
        <Text
          style={{
            color: C.onPrimary,
            fontSize: 28,
            fontWeight: '700',
            lineHeight: 32,
          }}
        >
          +
        </Text>
      </TouchableOpacity>

      {/* New session dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={{ backgroundColor: C.surface }}
        >
          <Dialog.Title style={{ color: C.primary, fontFamily: MONO, letterSpacing: 1 }}>
            NEW SESSION
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Session name"
              value={newSessionName}
              onChangeText={setNewSessionName}
              mode="outlined"
              autoFocus
              autoCapitalize="none"
              style={{ fontFamily: MONO, backgroundColor: C.surfaceHigh }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={C.muted}
              onPress={() => setDialogVisible(false)}
            >
              Cancel
            </Button>
            <Button textColor={C.primary} onPress={handleCreateSession}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
