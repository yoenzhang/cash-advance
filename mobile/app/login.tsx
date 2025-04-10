import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router'; // Use useRouter for navigation
import { useAuth } from './context/AuthContext'; // Adjusted path
import { appColors } from '@/constants/appColors'; // Use correct alias path

const LoginScreen = () => { // Removed navigation prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();
  const router = useRouter(); // Get router instance

  // Define styles INSIDE the component
  // Use useMemo to prevent recreating styles on every render, mitigating performance hit
  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      // Use hardcoded value for testing
      backgroundColor: '#f2f2f7', // Was appColors.lightGray 
    },
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    innerContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: appColors.dark,
      textAlign: 'center',
      marginBottom: 30,
    },
    input: {
      backgroundColor: appColors.white,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: appColors.border,
      fontSize: 16,
      marginBottom: 15,
      color: appColors.dark,
    },
    button: {
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    buttonPrimary: {
      backgroundColor: appColors.primary,
    },
    buttonDisabled: {
      backgroundColor: appColors.gray,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    buttonTextPrimary: {
      color: appColors.white,
    },
    footerContainer: {
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      color: appColors.gray,
      fontSize: 14,
    },
    linkText: {
      color: appColors.primary,
      fontWeight: 'bold',
      fontSize: 14,
    },
    errorContainer: {
      backgroundColor: appColors.danger + '20',
      padding: 10,
      borderRadius: 8,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: appColors.danger,
    },
    errorText: {
      color: appColors.danger,
      textAlign: 'center',
      fontSize: 14,
    },
    activityIndicator: {
      color: appColors.white
    }
  }), []); // Empty dependency array means styles are created once per component instance

  const handleLogin = async () => {
    clearError(); // Clear previous errors
    const success = await login(email, password);
    // Navigation is handled by the root layout based on auth state change
    // No explicit navigation needed here upon success
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <Text style={styles.title}>Login</Text>

                {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={appColors.gray}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={appColors.gray}
                />

                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                    <ActivityIndicator color={appColors.white} />
                    ) : (
                    <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Login</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    {/* Use router.push for navigation */}
                    <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.linkText}>Register here</Text>
                    </TouchableOpacity>
                </View>
            </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Remove the StyleSheet.create call from outside the component
// const styles = StyleSheet.create({ ... });

export default LoginScreen; 