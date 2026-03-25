import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, useTheme } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { TerminalProvider } from './context/TerminalContext';
import AppNavigator from './navigation/AppNavigator';

function Main() {
  const theme = useTheme();
  const navigationTheme = theme.dark ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <NavigationContainer theme={navigationTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TerminalProvider>
        <PaperProvider theme={MD3DarkTheme}>
          <Main />
        </PaperProvider>
      </TerminalProvider>
    </SafeAreaProvider>
  );
}
