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
import { useAuth } from '../context/AuthContext';
import { appColors as Colors } from '../../constants/appColors';

const RegisterScreen = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, loading, error, clearError } = useAuth();

  const handleRegister = async () => {
    clearError(); // Clear previous errors
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    const success = await register(email, password, firstName, lastName);
    if (!success) {
        // Error is handled in AuthContext
        // Alert.alert('Registration Failed', error || 'Please check your details and try again.');
    }
     // Navigation will be handled by the main navigator based on auth state
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
                        placeholderTextColor={Colors.gray}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                        placeholderTextColor={Colors.gray}
                    />
            
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

                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholderTextColor={Colors.gray}
                    />
            
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                        <ActivityIndicator color={Colors.white} />
                        ) : (
                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Register</Text>
                        )}
                    </TouchableOpacity>
            
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Login here</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Using similar styles to LoginScreen for consistency
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
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
    color: Colors.white,
  }
});

export default RegisterScreen; 