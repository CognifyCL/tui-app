import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, FAB, Portal, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTerminal } from '../hooks/useTerminal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useThemeContext } from '../context/ThemeContext';
import { C, MONO } from '../theme/theme.js';
import terminalHtml from '../assets/terminal.html';

export default function TerminalScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const {
    ws,
    status,
    addListener,
    sendInput,
    sendResize,
    windows,
    runTmuxCommand,
    disconnect,
    serverIp,
    sessionName,
  } = useTerminal();
  const { isDarkMode, fontSize } = useThemeContext();
  const [fabOpen, setFabOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const toolbarHeightRef = useRef(0);
  const isFocused = useIsFocused();

  // Terminal data bridge
  useEffect(() => {
    const unsubscribe = addListener((data) => {
      if (webViewRef.current) {
        const escapedContent = JSON.stringify(data);
        webViewRef.current.injectJavaScript(
          `if(window.onTerminalData) window.onTerminalData(${escapedContent}); true;`
        );
      }
    });
    return unsubscribe;
  }, [addListener]);

  // Keyboard height tracking
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Theme injection
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setTerminalTheme(${isDarkMode}); true;`);
    }
  }, [isDarkMode]);

  // Font size injection
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setFontSize(${fontSize}); true;`);
    }
  }, [fontSize]);

  const handleWebViewLoad = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.setTerminalTheme(${isDarkMode}); window.setFontSize(${fontSize}); true;`
      );
    }
  };

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
    { label: 'Esc', value: '\x1b' },
    { label: 'Tab', value: '\t' },
    { label: 'Prefix', value: '\x02' },
    { label: 'PgUp', value: '\x1b[5~' },
    { label: 'PgDn', value: '\x1b[6~' },
    { label: 'Home', value: '\x1b[H' },
    { label: 'End', value: '\x1b[F' },
    { label: 'Del', value: '\x1b[3~' },
    { label: '↑', value: '\x1b[A' },
    { label: '↓', value: '\x1b[B' },
    { label: '←', value: '\x1b[D' },
    { label: '→', value: '\x1b[C' },
    { label: 'F1', value: '\x1bOP' },
    { label: 'F2', value: '\x1bOQ' },
    { label: 'F3', value: '\x1bOR' },
  ];

  const sendKey = (val) => sendInput(val);

  const activeWindow = windows && windows.find((w) => w.active === true);
  const activeWindowLabel = activeWindow ? `${activeWindow.id}:${activeWindow.name}` : '—';

  const hasWindows = windows && windows.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: keyboardHeight }]}>
      {/* ── App Header ── */}
      <View style={styles.header}>
        {/* Left: icon + title */}
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="console" size={20} color={C.primary} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>KINETIC_CONSOLE</Text>
        </View>

        {/* Right: search + menu */}
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => {}} style={styles.headerIconBtn}>
            <MaterialCommunityIcons name="magnify" size={20} color={C.muted} />
          </TouchableOpacity>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIconBtn}>
                <MaterialCommunityIcons name="dots-vertical" size={20} color={C.muted} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              leadingIcon="power-plug-off"
              onPress={() => {
                setMenuVisible(false);
                disconnect();
              }}
              title="Disconnect"
            />
            <Menu.Item
              leadingIcon="content-copy"
              onPress={() => {
                setMenuVisible(false);
                webViewRef.current?.injectJavaScript(
                  'window.copyLastOutput && window.copyLastOutput(); true;'
                );
              }}
              title="Copy last output"
            />
            <Menu.Item
              leadingIcon="delete-sweep"
              onPress={() => {
                setMenuVisible(false);
                webViewRef.current?.injectJavaScript('term.clear(); true;');
              }}
              title="Clear terminal"
            />
            <Menu.Item
              leadingIcon="plus-box-outline"
              onPress={() => {
                setMenuVisible(false);
                runTmuxCommand('new-window');
              }}
              title="New window"
            />
          </Menu>
        </View>
      </View>

      {/* ── Window Tabs Bar ── */}
      {hasWindows && (
        <View style={styles.tabsBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {windows.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.tab, w.active && styles.tabActive]}
                onPress={() => runTmuxCommand(`select-window -t ${w.id}`)}
              >
                <Text style={[styles.tabText, w.active && styles.tabTextActive]}>
                  {`${w.id}:${w.name.toUpperCase()}`}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (windows.length > 1) runTmuxCommand(`kill-window -t ${w.id}`);
                  }}
                  style={styles.tabClose}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.tabCloseText, w.active && styles.tabCloseTextActive]}>×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {/* New window button */}
            <TouchableOpacity
              style={styles.tabNew}
              onPress={() => runTmuxCommand('new-window')}
            >
              <Text style={styles.tabNewText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── Terminal WebView ── */}
      <View style={styles.terminalContainer}>
        <WebView
          ref={webViewRef}
          source={terminalHtml}
          originWhitelist={['*']}
          onMessage={handleWebViewMessage}
          onLoad={handleWebViewLoad}
          style={styles.webview}
          backgroundColor={C.bg}
          keyboardDisplayRequiresUserAction={false}
          automaticallyAdjustContentInsets={false}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowFileAccess={true}
          mixedContentMode="always"
        />
      </View>

      {/* ── Special Keys Toolbar ── */}
      <View
        style={[styles.toolbar, { paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 8) }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          toolbarHeightRef.current = h;
          setToolbarHeight(h);
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {specialKeys.map((k, i) => (
            <TouchableOpacity key={i} style={styles.keyButton} onPress={() => sendKey(k.value)}>
              <Text style={styles.keyText}>{k.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Action FAB ── */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          visible={isFocused}
          icon={fabOpen ? 'close' : 'console'}
          actions={[
            {
              icon: 'plus-box-outline',
              label: 'New Window',
              onPress: () => runTmuxCommand('new-window'),
            },
            {
              icon: 'arrow-expand-all',
              label: 'Zoom',
              onPress: () => runTmuxCommand('resize-pane -Z'),
            },
            {
              icon: 'trash-can-outline',
              label: 'Kill Window',
              onPress: () => {
                if (windows && windows.length > 1) {
                  const active = windows.find(w => w.active);
                  if (active) runTmuxCommand(`kill-window -t ${active.id}`);
                }
              },
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={{ backgroundColor: C.primary }}
          style={{ bottom: toolbarHeight + (keyboardHeight > 0 ? 8 : insets.bottom) }}
        />
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ──
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: C.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    color: C.primary,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 4,
  },

  // ── Window Tabs ──
  tabsBar: {
    height: 44,
    backgroundColor: C.bg,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 2,
    height: 32,
    alignSelf: 'center',
  },
  tabActive: {
    backgroundColor: C.primary,
  },
  tabText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: C.onPrimary,
  },
  tabClose: {
    marginLeft: 6,
  },
  tabCloseText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  tabCloseTextActive: {
    color: C.onPrimary,
  },
  tabNew: {
    backgroundColor: C.surface,
    borderRadius: 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    alignSelf: 'center',
  },
  tabNewText: {
    color: C.muted,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },

  // ── Terminal ──
  terminalContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },

  // ── Info Bar ──
  infoBar: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  infoText: {
    color: C.muted,
    fontSize: 10,
    fontFamily: MONO,
  },

  // ── Toolbar ──
  toolbar: {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.outlineFaint,
  },
  toolbarContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  keyButton: {
    backgroundColor: C.surface,
    borderRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  keyText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: MONO,
  },
});
