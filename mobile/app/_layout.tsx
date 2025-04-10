import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { appColors } from '@/constants/appColors';
import GlobalHeader from './components/GlobalHeader';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Font loading state
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Add other fonts here if needed
  });

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync();
      // Navigate based on auth state AFTER fonts and auth check are done
      if (isAuthenticated) {
          // Explicitly navigate to the main app area (dashboard within tabs)
          router.replace('/dashboard'); // Navigate to the default tab screen
      } else {
          // Navigate to the login screen
          router.replace('/login');
      }
    }
  }, [fontsLoaded, authLoading, isAuthenticated, router]);

  // Show loading indicator until fonts AND auth check are complete
  if (!fontsLoaded || authLoading) {
     return (
         <View style={styles.loadingContainer}>
             <ActivityIndicator size="large" color={appColors.primary} />
         </View>
     );
  }

  // This component will render the appropriate stack based on auth state
  // Expo Router handles the actual screen rendering via <Slot /> or file structure
  return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* Wrap Header, Stack, and StatusBar */}
          <>
              <GlobalHeader />
              <Stack>
                {/* Define all screens unconditionally */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                 {/* Fallback for not found */}
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          </>
      </ThemeProvider>
  );
}


export default function RootLayout() {
  return (
    // Wrap the entire app with Auth and Application providers
    <AuthProvider>
      <ApplicationProvider>
        <RootLayoutNav />
      </ApplicationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Use hardcoded value for testing
    backgroundColor: '#f2f2f7', // Was appColors.lightGray 
  },
});
