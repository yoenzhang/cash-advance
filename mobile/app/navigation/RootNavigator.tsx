import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { appColors as colors } from '../../constants/appColors';

// Define stack param lists for type checking
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Create separate stacks for Auth and App flows
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="Login" component={LoginScreen} />
    <AuthStackNav.Screen name="Register" component={RegisterScreen} />
  </AuthStackNav.Navigator>
);

const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show a loading indicator while checking auth status
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Render null when authenticated for now, let Expo Router handle it */}
      {isAuthenticated ? null : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray, // Or your app's background color
  },
});

export default RootNavigator; 