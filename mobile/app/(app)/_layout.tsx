import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, View, Text, useColorScheme } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons'; // Assuming installed

// Helper component for icons
function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Colors for tabs (can be customized)
  const activeColor = colorScheme === 'dark' ? '#fff' : '#007bff';
  const inactiveColor = colorScheme === 'dark' ? '#888' : '#888';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        // Disable the header for all screens in the tab navigator.
        // Headers can be added within individual screens using <Stack.Screen> if needed
        headerShown: false, 
         tabBarStyle: {
             backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
             borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
         }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        // This will route to the index file -> /applications === /applications/index
        name="applications/index" 
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
       {/* Hide other application routes from tabs */}
      <Tabs.Screen name="applications/new" options={{ href: null }} />
      <Tabs.Screen name="applications/[id]" options={{ href: null }} />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
} 