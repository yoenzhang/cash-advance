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
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { appColors as Colors } from '../../constants/appColors'; // Corrected path

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();

  const handleLogin = async () => {
    clearError(); // Clear previous errors
    const success = await login(email, password);
    if (!success) {
      // Error state is set in AuthContext, maybe show an Alert here too
      // Alert.alert('Login Failed', error || 'Please check your credentials.');
    } 
    // Navigation will be handled by the main navigator based on auth state
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
                    placeholderTextColor={Colors.gray}
                />
        
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor={Colors.gray}
                />
        
                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                    <ActivityIndicator color={Colors.white} />
                    ) : (
                    <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Login</Text>
                    )}
                </TouchableOpacity>
        
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.linkText}>Register here</Text>
                    </TouchableOpacity>
                </View>
            </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Add padding at the bottom
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    marginBottom: 15,
    color: Colors.dark,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonTextPrimary: {
    color: Colors.white,
  },
  footerContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.gray,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Light red background
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
    fontSize: 14,
  },
  activityIndicator: {
    color: Colors.white
  }
});

export default LoginScreen; 