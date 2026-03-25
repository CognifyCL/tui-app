import React, { useContext } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { ThemeProvider, ThemeContext, kineticTheme } from './context/ThemeContext';
import { TerminalProvider } from './context/TerminalContext';
import AppNavigator from './navigation/AppNavigator';

function ThemedApp() {
  const { isLoaded } = useContext(ThemeContext);

  if (!isLoaded) return null;

  return (
    <PaperProvider theme={kineticTheme}>
      <TerminalProvider>
        <NavigationContainer theme={NavigationDarkTheme}>
          <AppNavigator />
        </NavigationContainer>
      </TerminalProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
