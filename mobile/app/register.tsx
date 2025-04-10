import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router'; // Use useRouter for navigation
import { useAuth } from './context/AuthContext'; // Adjusted path
import { appColors } from '@/constants/appColors'; // Use correct alias path

const RegisterScreen = () => { // Removed navigation prop
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading, error, clearError } = useAuth();
  const router = useRouter(); // Get router instance

  const handleRegister = async () => {
    clearError();
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const success = await register(email, password, firstName, lastName);
    // Navigation is handled by the root layout based on auth state change
    // No explicit navigation needed here upon success
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                <View style={styles.innerContainer}>
                    <Text style={styles.title}>Register</Text>

                    {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                        placeholderTextColor={appColors.gray}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        placeholderTextColor={appColors.gray}
                    />

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

                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholderTextColor={appColors.gray}
                    />

                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                        <ActivityIndicator color={appColors.white} />
                        ) : (
                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Register</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                         {/* Use router.push for navigation */}
                        <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.linkText}>Login here</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles remain the same as LoginScreen
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.lightGray,
  },
  container: {
    flex: 1,
  },
   scrollContentContainer: {
       flexGrow: 1,
       justifyContent: 'center',
   },
  innerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20, // Add vertical padding
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
    backgroundColor: appColors.danger + '20', // Light red background
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
      color: appColors.white,
  }
});

export default RegisterScreen; 