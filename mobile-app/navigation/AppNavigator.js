import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { IconButton } from 'react-native-paper';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TerminalScreen from '../screens/TerminalScreen';
import HostsScreen from '../screens/HostsScreen';
import SnippetsScreen from '../screens/SnippetsScreen';
import LogsScreen from '../screens/LogsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <IconButton
            icon="menu"
            onPress={() => navigation.toggleDrawer()}
          />
        ),
        drawerType: 'front',
        headerStyle: {
          backgroundColor: '#1e1e1e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Connect' }}
      />
      <Drawer.Screen 
        name="Terminal" 
        component={TerminalScreen} 
        options={{ 
          headerShown: false,
        }}
      />
      <Drawer.Screen 
        name="Hosts" 
        component={HostsScreen} 
        options={{ title: 'Manage Hosts' }}
      />
      <Drawer.Screen 
        name="Snippets" 
        component={SnippetsScreen} 
        options={{ title: 'Snippets' }}
      />
      <Drawer.Screen 
        name="Logs" 
        component={LogsScreen} 
        options={{ 
          title: 'System Logs',
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Drawer.Navigator>
  );
}
