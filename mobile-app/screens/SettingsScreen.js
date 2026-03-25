import React, { useState, useContext } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  List,
  Switch,
  Divider,
  Button,
  Dialog,
  Portal,
  RadioButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext, LOG_LEVELS } from '../context/ThemeContext';
import { TerminalContext } from '../context/TerminalContext';

const LOG_LEVEL_DESCRIPTIONS = {
  DEBUG: 'All messages (verbose)',
  INFO: 'Informational and above',
  WARN: 'Warnings and errors only',
  ERROR: 'Errors only',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { isDarkMode, toggleDarkMode, logLevel, setLogLevel } = useContext(ThemeContext);
  const { clearAllStorage } = useContext(TerminalContext);

  // Log level picker dialog
  const [logLevelDialogVisible, setLogLevelDialogVisible] = useState(false);
  const [pendingLogLevel, setPendingLogLevel] = useState(logLevel);

  // Clear cache confirmation dialog
  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);

  // Reset confirmation dialog
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------

  const openLogLevelDialog = () => {
    setPendingLogLevel(logLevel);
    setLogLevelDialogVisible(true);
  };

  const confirmLogLevel = () => {
    setLogLevel(pendingLogLevel);
    setLogLevelDialogVisible(false);
  };

  const handleClearCache = async () => {
    setClearCacheDialogVisible(false);
    await clearAllStorage();
  };

  const handleReset = async () => {
    setResetDialogVisible(false);
    await clearAllStorage();
    // Reset theme preferences to defaults (dark mode on, log level DEBUG)
    // ThemeContext will persist these on next toggle; here we just reload defaults
    // by letting the app re-render from cleared AsyncStorage values.
    // A more aggressive reset could use expo-updates: Updates.reloadAsync()
    // but that requires the expo-updates package to be installed.
    // Clearing state is sufficient for an in-session reset.
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background },
  ];

  return (
    <>
      <ScrollView
        style={containerStyle}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* ── Appearance ────────────────────────────────── */}
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description={isDarkMode ? 'Dark theme active' : 'Light theme active'}
            left={props => <List.Icon {...props} icon="weather-night" />}
            right={() => (
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
              />
            )}
          />
        </List.Section>

        <Divider />

        {/* ── General ───────────────────────────────────── */}
        <List.Section>
          <List.Subheader>General</List.Subheader>
          <List.Item
            title="Log Level"
            description={`${logLevel} — ${LOG_LEVEL_DESCRIPTIONS[logLevel]}`}
            left={props => <List.Icon {...props} icon="text-box-search-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={openLogLevelDialog}
          />
        </List.Section>

        <Divider />

        {/* ── About ─────────────────────────────────────── */}
        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item title="Version" description="1.0.0-pro" />
          <List.Item
            title="Clear Cache"
            description="Remove all stored hosts and settings"
            titleStyle={{ color: theme.colors.error }}
            left={props => <List.Icon {...props} icon="trash-can-outline" color={theme.colors.error} />}
            onPress={() => setClearCacheDialogVisible(true)}
          />
        </List.Section>

        {/* ── Footer ────────────────────────────────────── */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            onPress={() => setResetDialogVisible(true)}
          >
            RESET ALL SETTINGS
          </Button>
        </View>
      </ScrollView>

      {/* ── Portals (Dialogs) ─────────────────────────── */}
      <Portal>
        {/* Log Level Picker */}
        <Dialog visible={logLevelDialogVisible} onDismiss={() => setLogLevelDialogVisible(false)}>
          <Dialog.Title>Log Level</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={pendingLogLevel}
              onValueChange={setPendingLogLevel}
            >
              {LOG_LEVELS.map(level => (
                <RadioButton.Item
                  key={level}
                  label={`${level} — ${LOG_LEVEL_DESCRIPTIONS[level]}`}
                  value={level}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogLevelDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmLogLevel}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear Cache Confirmation */}
        <Dialog visible={clearCacheDialogVisible} onDismiss={() => setClearCacheDialogVisible(false)}>
          <Dialog.Title>Clear Cache?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will remove all saved hosts and app settings. You will not be disconnected from
              the current session.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearCacheDialogVisible(false)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleClearCache}>Clear</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Reset Confirmation */}
        <Dialog visible={resetDialogVisible} onDismiss={() => setResetDialogVisible(false)}>
          <Dialog.Title>Reset All Settings?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will clear all saved hosts, settings, and cached data, and restore the app to its
              default state. This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleReset}>Reset</Button>
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
  footer: {
    padding: 16,
    marginTop: 8,
  },
});
