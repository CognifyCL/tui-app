import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { MONO } from '../theme/theme';
import HomeScreen from '../screens/HomeScreen';
import TerminalScreen from '../screens/TerminalScreen';
import SnippetsScreen from '../screens/SnippetsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HostsScreen from '../screens/HostsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const C = {
  bg: '#0e0e0e',
  tabBar: '#000000',
  activeBg: '#52fd2e',
  activeText: '#0e5b00',
  inactiveText: '#adaaaa',
  border: 'rgba(72,72,71,0.15)',
  primary: '#52fd2e',
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="ManageHosts" component={HostsScreen} />
    </HomeStack.Navigator>
  );
}

function KineticTabButton({ children, onPress, accessibilityState }) {
  const active = accessibilityState?.selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      {children}
    </TouchableOpacity>
  );
}

const sharedHeaderOptions = {
  headerStyle: { backgroundColor: C.bg },
  headerTitleStyle: {
    color: C.primary,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 16,
    fontFamily: MONO,
  },
  headerTitle: 'KINETIC_CONSOLE',
  headerLeft: () => (
    <MaterialCommunityIcons
      name="console"
      size={22}
      color={C.primary}
      style={{ marginLeft: 16 }}
    />
  ),
  headerRight: () => (
    <View style={styles.headerRight}>
      <MaterialCommunityIcons name="magnify" size={22} color={C.inactiveText} />
      <MaterialCommunityIcons
        name="dots-vertical"
        size={22}
        color={C.inactiveText}
        style={{ marginLeft: 4 }}
      />
    </View>
  ),
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...sharedHeaderOptions,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: C.activeText,
        tabBarInactiveTintColor: C.inactiveText,
        tabBarLabelStyle: {
          fontWeight: 'bold',
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontFamily: MONO,
        },
        tabBarButton: (props) => <KineticTabButton {...props} />,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Hosts: 'dns',
            Terminal: 'console',
            Snippets: 'code-tags',
            Settings: 'cog',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Hosts"
        component={HomeStackScreen}
        options={{ tabBarLabel: 'HOSTS' }}
      />
      <Tab.Screen
        name="Terminal"
        component={TerminalScreen}
        options={{ tabBarLabel: 'TERM', headerShown: false }}
      />
      <Tab.Screen
        name="Snippets"
        component={SnippetsScreen}
        options={{ tabBarLabel: 'SNIPS' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'SETT' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: C.activeBg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
});
s: 'center',
    marginRight: 12,
  },
});
