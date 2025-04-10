import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack } from 'expo-router';
import Slider from '@react-native-community/slider';

// Types (Consider moving to types/settings.ts)
interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  paymentReminders: boolean;
  theme: 'light' | 'dark' | 'system';
}

export default function SettingsScreen() {
  const [loading, setLoading] = useState<boolean>(false); // Combined loading state for simplicity
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Credit Limit State
  const [currentLimit, setCurrentLimit] = useState<number>(5000); // Simulate fetched limit
  const [requestedLimit, setRequestedLimit] = useState<number>(5000);

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    paymentReminders: true,
    theme: 'light',
  });

  // Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // --- Handlers ---

  const displayMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    // Auto-clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleCreditLimitSubmit = () => {
    if (requestedLimit < 1000 || requestedLimit > 10000) {
      displayMessage('Requested limit must be between $1,000 and $10,000.', 'error');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      displayMessage('Credit limit update request submitted.', 'success');
      setLoading(false);
    }, 800);
  };

  const handlePreferenceToggle = (key: keyof UserPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

   const handleThemeChange = (value: UserPreferences['theme']) => {
    setPreferences(prev => ({ ...prev, theme: value }));
  };

  const savePreferences = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      displayMessage('Preferences saved successfully.', 'success');
      setLoading(false);
    }, 800);
  };

  const handlePasswordSubmit = () => {
    if (!currentPassword) {
      displayMessage('Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      displayMessage('New password must be at least 8 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      displayMessage('New passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      displayMessage('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, 800);
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Text style={styles.pageTitle}>Account Settings</Text>

      {/* Message Display */}
      {message && (
        <View style={[styles.messageBox, message.type === 'success' ? styles.messageSuccess : styles.messageError]}>
            <Text style={styles.messageText}>{message.text}</Text>
        </View>
      )}

      {/* Credit Limit Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Credit Limit</Text>
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Current Limit:</Text>
            <Text style={styles.settingValue}>${currentLimit.toLocaleString()}</Text>
        </View>
        <Text style={[styles.settingLabel, { marginTop: 15, marginBottom: 5 }]}>Request New Limit:</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={1000}
          maximumValue={10000}
          step={500}
          value={requestedLimit}
          onValueChange={setRequestedLimit}
          minimumTrackTintColor="#007bff"
          maximumTrackTintColor="#d3d3d3"
          thumbTintColor="#007bff"
        />
        <Text style={styles.sliderValue}>${requestedLimit.toLocaleString()}</Text>
        <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, {marginTop: 10}] }
            onPress={handleCreditLimitSubmit}
            disabled={loading}
        >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Request New Limit</Text>}
        </TouchableOpacity>
         <Text style={styles.hintText}>Limit increase requests are subject to review.</Text>
      </View>

      {/* Notification Preferences Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Switch value={preferences.emailNotifications} onValueChange={(v) => handlePreferenceToggle('emailNotifications', v)} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>SMS Notifications</Text>
          <Switch value={preferences.smsNotifications} onValueChange={(v) => handlePreferenceToggle('smsNotifications', v)} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Payment Reminders</Text>
          <Switch value={preferences.paymentReminders} onValueChange={(v) => handlePreferenceToggle('paymentReminders', v)} />
        </View>
         <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Marketing Emails</Text>
          <Switch value={preferences.marketingEmails} onValueChange={(v) => handlePreferenceToggle('marketingEmails', v)} />
        </View>
      </View>

      {/* Theme Section */}
       <View style={styles.card}>
         <Text style={styles.sectionTitle}>Appearance</Text>
         <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Theme</Text>
             <View style={styles.themeButtonsContainer}>
                 {(['light', 'dark', 'system'] as UserPreferences['theme'][]).map(theme => (
                     <TouchableOpacity
                        key={theme}
                        style={[styles.themeButton, preferences.theme === theme && styles.themeButtonActive]}
                        onPress={() => handleThemeChange(theme)}
                     >
                         <Text style={[styles.themeButtonText, preferences.theme === theme && styles.themeButtonTextActive]}>
                             {theme.charAt(0).toUpperCase() + theme.slice(1)}
                         </Text>
                     </TouchableOpacity>
                 ))}
             </View>
         </View>
       </View>

       {/* Save Preferences Button */}
        <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, styles.saveButton]}
            onPress={savePreferences}
            disabled={loading}
        >
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Save Preferences</Text>}
        </TouchableOpacity>

      {/* Change Password Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Change Password</Text>
         <View style={styles.formGroup}>
            <Text style={styles.settingLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter your current password"
            />
        </View>
         <View style={styles.formGroup}>
            <Text style={styles.settingLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password (min 8 chars)"
            />
        </View>
         <View style={styles.formGroup}>
            <Text style={styles.settingLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
            />
        </View>
         <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, {marginTop: 10}] }
            onPress={handlePasswordSubmit}
            disabled={loading}
        >
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Update Password</Text>}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
   messageBox: {
      marginHorizontal: 15,
      marginTop: 10,
      padding: 10,
      borderRadius: 6,
  },
  messageSuccess: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      borderWidth: 1,
  },
  messageError: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      borderWidth: 1,
  },
  messageText: {
      fontSize: 14,
      textAlign: 'center',
      color: '#155724', // Adjust color based on type if needed
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    flexShrink: 1, // Allow label to shrink if needed
    marginRight: 10,
  },
  settingValue: {
      fontSize: 15,
      color: '#555',
      fontWeight: '500',
  },
  sliderValue: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginTop: 5,
  },
  hintText: {
      fontSize: 12,
      color: '#666',
      marginTop: 8,
      textAlign: 'center',
  },
   themeButtonsContainer: {
       flexDirection: 'row',
   },
   themeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#007bff',
        marginLeft: 8,
   },
   themeButtonActive: {
        backgroundColor: '#007bff',
   },
   themeButtonText: {
        color: '#007bff',
        fontSize: 13,
   },
   themeButtonTextActive: {
        color: '#fff',
   },
   saveButton: {
       marginHorizontal: 15,
       marginTop: 15,
       marginBottom: 5,
   },
   formGroup: {
       marginBottom: 15,
   },
   input: {
       height: 45,
       borderColor: '#ccc',
       borderWidth: 1,
       borderRadius: 4,
       paddingHorizontal: 10,
       fontSize: 16,
       backgroundColor: '#fff',
       marginTop: 5,
   },
   // Button Styles (re-use/adapt from other screens if desired)
   button: {
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       paddingVertical: 12,
       borderRadius: 8,
       minHeight: 44,
   },
   buttonPrimary: {
       backgroundColor: '#007bff',
   },
   buttonTextPrimary: {
       color: '#fff',
       fontSize: 15,
       fontWeight: 'bold',
       textAlign: 'center',
   },
}); 