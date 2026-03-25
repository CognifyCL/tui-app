import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, IconButton, FAB, Portal } from 'react-native-paper';
import { useTerminal } from '../hooks/useTerminal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

export default function TerminalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const { ws, status, addListener, sendInput, sendResize, windows, runTmuxCommand } = useTerminal();
  const [fabOpen, setFabOpen] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const toolbarHeightRef = useRef(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = addListener((data) => {
      if (webViewRef.current) {
        const escapedContent = JSON.stringify(data);
        webViewRef.current.injectJavaScript(`if(window.onTerminalData) window.onTerminalData(${escapedContent}); true;`);
      }
    });
    return unsubscribe;
  }, [addListener]);

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'input') {
        sendInput(data.content);
      } else if (data.type === 'resize') {
        sendResize(data.cols, data.rows);
      }
    } catch (e) {
      console.error(`Error parsing WebView message: ${e.message}`);
    }
  };

  const specialKeys = [
    { label: 'Esc', value: '\x1b' }, { label: 'Tab', value: '\t' }, { label: 'Prefix', value: '\x02' },
    { label: 'PgUp', value: '\x1b[5~' }, { label: 'PgDn', value: '\x1b[6~' }, { label: 'Home', value: '\x1b[H' },
    { label: 'End', value: '\x1b[F' }, { label: 'Del', value: '\x1b[3~' }, { label: '↑', value: '\x1b[A' },
    { label: '↓', value: '\x1b[B' }, { label: '←', value: '\x1b[D' }, { label: '→', value: '\x1b[C' },
    { label: 'F1', value: '\x1bOP' }, { label: 'F2', value: '\x1bOQ' }, { label: 'F3', value: '\x1bOR' },
  ];

  const sendKey = (val) => {
    sendInput(val);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <IconButton icon="menu" onPress={() => navigation.openDrawer()} />
        <Text style={styles.statusText}>{status}</Text>
        <IconButton icon="dots-vertical" onPress={() => {}} />
      </View>
      
      <View style={styles.terminalContainer}>
        <WebView
          ref={webViewRef}
          source={require('../assets/terminal.html')}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          style={styles.webview}
          backgroundColor="#000"
          keyboardDisplayRequiresUserAction={false}
          automaticallyAdjustContentInsets={false}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowFileAccess={true}
          mixedContentMode="always"
        />
      </View>

      {/* Window Switcher Footer (Phase 3.1, 3.2) */}
      {windows && windows.length > 0 && (
        <View style={styles.windowFooter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.windowContent}>
            {windows.map((w) => (
              <TouchableOpacity 
                key={w.id} 
                style={[styles.windowItem, w.active && styles.activeWindowItem]} 
                onPress={() => runTmuxCommand(`select-window -t ${w.id}`)}
              >
                <Text style={[styles.windowText, w.active && styles.activeWindowText]}>{w.id}: {w.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View
        style={[styles.toolbarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          toolbarHeightRef.current = h;
          setToolbarHeight(h);
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
          {specialKeys.map((k, i) => (
            <TouchableOpacity key={i} style={styles.keyButton} onPress={() => sendKey(k.value)}>
              <Text style={styles.keyText}>{k.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Action FAB Menu (Phase 3.3) */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          visible={isFocused}
          icon={fabOpen ? 'close' : 'console'}
          actions={[
            { icon: 'view-split-vertical', label: 'Split H', onPress: () => runTmuxCommand('split-window -h') },
            { icon: 'view-split-horizontal', label: 'Split V', onPress: () => runTmuxCommand('split-window -v') },
            { icon: 'arrow-expand-all', label: 'Zoom', onPress: () => runTmuxCommand('resize-pane -Z') },
            { icon: 'trash-can-outline', label: 'Kill Pane', onPress: () => runTmuxCommand('kill-pane') },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={{ backgroundColor: '#0f0' }}
          style={{ bottom: toolbarHeight + insets.bottom }}
        />
      </Portal>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  statusText: { color: '#0f0', fontSize: 12, fontWeight: 'bold' },
  terminalContainer: { flex: 1 },
  webview: { flex: 1 },
  windowFooter: { backgroundColor: '#1e1e1e', borderTopWidth: 1, borderTopColor: '#333' },
  windowContent: { padding: 4, flexDirection: 'row' },
  windowItem: { paddingVertical: 4, paddingHorizontal: 12, marginRight: 8, borderRadius: 12, backgroundColor: '#2a2a2a' },
  activeWindowItem: { backgroundColor: '#0f0' },
  windowText: { color: '#ccc', fontSize: 11, fontWeight: 'bold' },
  activeWindowText: { color: '#000' },
  toolbarContainer: { backgroundColor: '#1e1e1e', borderTopWidth: 1, borderTopColor: '#333' },
  toolbarContent: { padding: 8, flexDirection: 'row' },
  keyButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#333', borderRadius: 4, marginRight: 8, minWidth: 40, alignItems: 'center' },
  keyText: { color: '#0f0', fontSize: 12, fontWeight: 'bold' }
});
