import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ApplicationProvider } from '@/context/ApplicationContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Main layout component handling auth redirection
function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (!isLoading && loaded) {
      SplashScreen.hideAsync();
      const inAuthGroup = segments[0] === '(auth)';
      const inAppGroup = segments[0] === '(app)';

      if (isAuthenticated && !inAppGroup) {
        router.replace('/(app)/dashboard');
      } else if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [isLoading, loaded, isAuthenticated, segments, router]);

  if (isLoading || !loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

// Root layout wrapping the app with context providers
export default function RootLayout() {
  return (
    <AuthProvider>
      <ApplicationProvider>
        <MainLayout />
      </ApplicationProvider>
    </AuthProvider>
  );
}
