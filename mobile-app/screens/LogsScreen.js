import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useTerminal } from '../hooks/useTerminal';
import LogViewer from '../components/LogViewer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const { logs, clearLogs } = useTerminal();

  return (
    <View style={styles.container}>
      <View style={styles.logContainer}>
         <LogViewer
            isVisible={true}
            logs={logs}
            onClose={() => {}}
            onClear={clearLogs}
            embedded={true}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#1e1e1e'
  },
  title: { color: '#fff', fontWeight: 'bold' },
  logContainer: { flex: 1 }
});
