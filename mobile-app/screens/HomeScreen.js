import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Portal, Dialog, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useTerminal } from '../hooks/useTerminal';
import { useSessions } from '../hooks/useSessions';
import * as Haptics from 'expo-haptics';

import { C, MONO } from '../theme/theme';
import { CONNECTION_STATUS } from '../config/constants';
import StatusDashboard from '../components/ui/StatusDashboard';
import SectionHeader from '../components/ui/SectionHeader';
import LogStrip from '../components/ui/LogStrip';
import HostCard from '../components/host/HostCard';

export default function HomeScreen({ navigation }) {
  useDeepLinks();
  const insets = useSafeAreaInsets();
  const {
    serverIp,
    connect, status, reconnectAttempt,
    logs,
    recentHosts,
    setServerIp,
    sessionName,
  } = useTerminal();
  const { sessions, isRefreshing, fetchSessions } = useSessions();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('default');

  const connectedSession = status === CONNECTION_STATUS.CONNECTED ? sessionName : null;

  const isConnected = !!serverIp;

  useFocusEffect(
    useCallback(() => {
      if (serverIp) {
        fetchSessions();
      }
    }, [serverIp, fetchSessions])
  );

  const showDialog = () => {
    setNewSessionName('default');
    setDialogVisible(true);
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
        <StatusDashboard status={status} reconnectAttempt={reconnectAttempt} sessions={sessions} />

        <SectionHeader 
          title="HOSTS" 
          subtitle="./managed_endpoints" 
          rightElement={
            <TouchableOpacity onPress={() => navigation.navigate('ManageHosts')}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={C.primary} />
            </TouchableOpacity>
          }
        />

        <HostCard
          serverIp={serverIp}
          hostName={recentHosts.find(h => h.ip === serverIp)?.name}
          isActive={true}
          status={status}
          reconnectAttempt={reconnectAttempt}
          sessions={sessions}
          connectedSession={connectedSession}
          onConnect={handleConnectButton}
          onSessionPress={handleConnectSession}
          isSimplified={true}
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
            fontFamily: MONO,
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

      </Portal>
    </View>
  );
}
