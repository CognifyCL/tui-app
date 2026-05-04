import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Dialog, Portal, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext, LOG_LEVELS } from '../context/ThemeContext';
import { useTerminal } from '../hooks/useTerminal';
import { C, MONO } from '../theme/theme.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
const FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18];

const LOG_LEVEL_COLORS = {
  INFO: C.muted,
  DEBUG: C.muted,
  WARN: C.warn,
  ERROR: C.error,
};

function formatTimestamp(ts) {
  if (!ts) return '--:--:--';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

function SectionSubtitle({ children }) {
  return (
    <Text style={styles.sectionSubtitle}>{children}</Text>
  );
}

function SegmentButton({ label, active, onPress, activeStyle }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.segmentBtn,
        active ? activeStyle : { backgroundColor: C.surfaceHigh },
      ]}
    >
      <Text
        style={[
          styles.segmentBtnText,
          { color: active ? activeStyle.color : C.muted },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {
    isDarkMode,
    toggleDarkMode,
    logLevel,
    setLogLevel,
    fontSize,
    setFontSize,
  } = useThemeContext();

  const { logs, sendInput, clearLogs } = useTerminal();

  // Dialog visibility
  const [fontSizeDialogVisible, setFontSizeDialogVisible] = useState(false);
  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  // Decorative session persistence toggle
  const [sessionPersistence, setSessionPersistence] = useState(true);

  // Command input (decorative)
  const [commandText, setCommandText] = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleClearCache = async () => {
    setClearCacheDialogVisible(false);
    await clearLogs();
  };

  const handleReset = async () => {
    setResetDialogVisible(false);
    await clearLogs();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleCommandSubmit = () => {
    if (commandText.trim()) {
      sendInput(commandText.trim() + '\n');
      setCommandText('');
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const visibleLogs = logs ? logs.slice(-8) : [];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ── Page header ──────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>SYSTEM_PREFERENCES</Text>
          <Text style={styles.versionBadge}>V1.0.0-STABLE</Text>
        </View>

        {/* ── UI_MODE ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel>UI_MODE</SectionLabel>
          <SectionSubtitle>Dark System Default</SectionSubtitle>
          <Text style={styles.sectionDesc}>
            Synchronizes the terminal interface with system-level visual parameters.
          </Text>
          <View style={styles.segmentRow}>
            <SegmentButton
              label="DARK"
              active={isDarkMode}
              onPress={() => !isDarkMode && toggleDarkMode()}
              activeStyle={{ backgroundColor: C.primary, color: C.onPrimary }}
            />
            <SegmentButton
              label="LIGHT"
              active={!isDarkMode}
              onPress={() => isDarkMode && toggleDarkMode()}
              activeStyle={{ backgroundColor: C.primary, color: C.onPrimary }}
            />
          </View>
        </View>

        {/* ── LOG_VERBOSITY ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel>LOG_VERBOSITY</SectionLabel>
          <View style={styles.segmentRow}>
            {LOG_LEVELS.map(level => (
              <SegmentButton
                key={level}
                label={level}
                active={logLevel === level}
                onPress={() => setLogLevel(level)}
                activeStyle={{
                  backgroundColor: C.warnContainer,
                  color: C.warn,
                }}
              />
            ))}
          </View>
        </View>

        {/* ── STORAGE_MANAGEMENT ────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel>STORAGE_MANAGEMENT</SectionLabel>
          <SectionSubtitle>Cache: —</SectionSubtitle>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <TouchableOpacity
            style={styles.clearCacheBtn}
            onPress={() => setClearCacheDialogVisible(true)}
          >
            <Text style={styles.clearCacheBtnText}>CLEAR CACHE</Text>
          </TouchableOpacity>
        </View>

        {/* ── SESSION_PERSISTANCE ───────────────────────────────────── */}
        <View style={[styles.section, styles.sectionRow]}>
          <View style={{ flex: 1 }}>
            <SectionLabel>SESSION_PERSISTANCE</SectionLabel>
          </View>
          <TouchableOpacity
            onPress={() => setSessionPersistence(v => !v)}
            style={[
              styles.toggleTrack,
              { backgroundColor: sessionPersistence ? C.primary : C.surfaceHigh },
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  transform: [{ translateX: sessionPersistence ? 16 : 0 }],
                  backgroundColor: sessionPersistence ? C.onPrimary : C.muted,
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* ── LIVE_LOG_STREAM ───────────────────────────────────────── */}
        <View style={[styles.section, { padding: 0 }]}>
          {/* Header row */}
          <View style={styles.logHeader}>
            <View style={styles.logDots}>
              <View style={[styles.dot, { backgroundColor: C.error }]} />
              <View style={[styles.dot, { backgroundColor: C.warn }]} />
              <View style={[styles.dot, { backgroundColor: C.primary }]} />
            </View>
            <Text style={styles.logHeaderLabel}>LIVE_LOG_STREAM</Text>
            <View style={styles.logHeaderRight}>
              <View style={styles.activeDot} />
              <Text style={styles.activeLabel}>ACTIVE</Text>
              <MaterialCommunityIcons
                name="download-outline"
                size={14}
                color={C.muted}
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>

          {/* Log entries */}
          <View style={styles.logBody}>
            {visibleLogs.length === 0 ? (
              <Text style={styles.logEmpty}>-- no log entries --</Text>
            ) : (
              visibleLogs.map((entry, idx) => {
                const level = (entry.type || 'INFO').toUpperCase();
                const color = LOG_LEVEL_COLORS[level] || C.muted;
                const isDebug = level === 'DEBUG';
                return (
                  <Text
                    key={idx}
                    style={[
                      styles.logLine,
                      { color },
                      isDebug && { fontStyle: 'italic' },
                    ]}
                    numberOfLines={1}
                  >
                    {formatTimestamp(entry.timestamp)}{'  '}
                    {'[' + level + ']'}{'  '}
                    {entry.message || ''}
                  </Text>
                );
              })
            )}
          </View>
        </View>

        {/* ── RESET ALL SETTINGS ───────────────────────────────────── */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setResetDialogVisible(true)}
        >
          <Text style={styles.resetBtnText}>RESET ALL SETTINGS</Text>
        </TouchableOpacity>

        {/* ── FONT SIZE ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.section, styles.sectionRow]}
          onPress={() => setFontSizeDialogVisible(true)}
        >
          <SectionLabel>FONT_SIZE</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.sectionSubtitle}>{fontSize}pt</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={C.muted} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Command input (fixed bottom) ─────────────────────────────────── */}
      <View style={[styles.commandBar, { paddingBottom: insets.bottom || 12 }]}>
        <Text style={styles.commandPrefix}>λ</Text>
        <TextInput
          style={styles.commandInput}
          placeholder="Enter command..."
          placeholderTextColor={C.outline}
          value={commandText}
          onChangeText={setCommandText}
          onSubmitEditing={handleCommandSubmit}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={handleCommandSubmit}>
          <Text style={styles.commandSuffix}>⌘</Text>
        </TouchableOpacity>
      </View>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <Portal>
        {/* Font Size Picker */}
        <Dialog
          visible={fontSizeDialogVisible}
          onDismiss={() => setFontSizeDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>
            <Text style={styles.dialogTitle}>FONT_SIZE</Text>
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.fontSizeRow}>
              {FONT_SIZE_OPTIONS.map(size => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeBtn,
                    fontSize === size && styles.fontSizeBtnActive,
                  ]}
                  onPress={() => {
                    setFontSize(size);
                    setFontSizeDialogVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.fontSizeBtnText,
                      fontSize === size && styles.fontSizeBtnTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={C.muted} onPress={() => setFontSizeDialogVisible(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear Cache Confirmation */}
        <Dialog
          visible={clearCacheDialogVisible}
          onDismiss={() => setClearCacheDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>
            <Text style={styles.dialogTitle}>CLEAR CACHE?</Text>
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogBody}>
              This will remove all saved hosts and app settings. You will not be
              disconnected from the current session.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={C.muted} onPress={() => setClearCacheDialogVisible(false)}>
              Cancel
            </Button>
            <Button textColor={C.error} onPress={handleClearCache}>
              Clear
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Reset Confirmation */}
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>
            <Text style={styles.dialogTitle}>RESET ALL SETTINGS?</Text>
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogBody}>
              This will clear all saved data and disconnect your active session.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={C.muted} onPress={() => setResetDialogVisible(false)}>
              Cancel
            </Button>
            <Button textColor={C.error} onPress={handleReset}>
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: C.primary,
    textTransform: 'uppercase',
  },
  versionBadge: {
    fontSize: 9,
    color: C.muted,
    fontFamily: MONO,
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    backgroundColor: C.surface,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: C.primary,
    marginBottom: 4,
    fontFamily: MONO,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: C.muted,
    marginBottom: 4,
    fontFamily: MONO,
  },
  sectionDesc: {
    fontSize: 10,
    color: C.muted,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 15,
  },

  // Segment buttons
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: MONO,
  },

  // Progress bar
  progressBar: {
    height: 4,
    backgroundColor: C.outline,
    marginBottom: 12,
  },
  progressFill: {
    width: '30%',
    height: '100%',
    backgroundColor: C.primary,
  },

  // Clear cache button
  clearCacheBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.errorContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearCacheBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: C.error,
    fontFamily: MONO,
  },

  // Session persistence toggle
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  // Live log stream
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.outline,
  },
  logDots: {
    flexDirection: 'row',
    gap: 5,
    marginRight: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  logHeaderLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: C.muted,
    fontFamily: MONO,
  },
  logHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  activeLabel: {
    fontSize: 9,
    color: C.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: MONO,
  },
  logBody: {
    height: 280,
    backgroundColor: C.bg,
    padding: 10,
  },
  logLine: {
    fontSize: 11,
    fontFamily: MONO,
    lineHeight: 18,
  },
  logEmpty: {
    fontSize: 11,
    fontFamily: MONO,
    color: C.outline,
    fontStyle: 'italic',
  },

  // Reset button
  resetBtn: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.error,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: C.error,
    fontFamily: MONO,
  },

  // Command bar
  commandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.outline,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  commandPrefix: {
    fontSize: 16,
    color: C.primary,
    fontFamily: MONO,
    fontWeight: 'bold',
  },
  commandInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    fontFamily: MONO,
    paddingVertical: 4,
  },
  commandSuffix: {
    fontSize: 16,
    color: C.muted,
    fontFamily: MONO,
  },

  // Dialogs
  dialog: {
    backgroundColor: C.surface,
    borderRadius: 0,
  },
  dialogTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: C.primary,
    fontFamily: MONO,
  },
  dialogBody: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 18,
  },

  // Font size picker
  fontSizeRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
  },
  fontSizeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.outline,
    backgroundColor: C.surfaceHigh,
  },
  fontSizeBtnActive: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  fontSizeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: C.muted,
    fontFamily: MONO,
  },
  fontSizeBtnTextActive: {
    color: C.onPrimary,
  },
});
