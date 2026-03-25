import React, { useContext } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { TerminalProvider } from './context/TerminalContext';
import AppNavigator from './navigation/AppNavigator';

function ThemedApp() {
  const { isDarkMode, isLoaded } = useContext(ThemeContext);

  // Don't render until theme preference is loaded from AsyncStorage
  // to avoid a flash of wrong theme on startup
  if (!isLoaded) return null;

  const paperTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const navigationTheme = isDarkMode ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <TerminalProvider>
        <NavigationContainer theme={navigationTheme}>
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
