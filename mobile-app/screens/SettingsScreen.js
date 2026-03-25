import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, List, Switch, Divider, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          right={() => <Switch value={isDarkMode} onValueChange={setIsDarkMode} />}
          left={props => <List.Icon {...props} icon="weather-night" />}
        />
        <Divider />
        <List.Subheader>General</List.Subheader>
        <List.Item
          title="Haptic Feedback"
          right={() => <Switch value={notifications} onValueChange={setNotifications} />}
          left={props => <List.Icon {...props} icon="vibrate" />}
        />
        <List.Item
          title="Log Level"
          description="Info"
          left={props => <List.Icon {...props} icon="text-box-search-outline" />}
          onPress={() => {}}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item title="Version" description="1.0.0-pro" />
        <List.Item 
          title="Clear Cache" 
          titleStyle={{ color: '#f44' }} 
          onPress={() => {}}
        />
      </List.Section>

      <View style={styles.footer}>
        <Button mode="outlined" onPress={() => {}}>RESET ALL SETTINGS</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16 },
  title: { fontWeight: 'bold' },
  footer: { padding: 16, marginTop: 20 }
});
