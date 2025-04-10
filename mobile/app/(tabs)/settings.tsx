import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Switch, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/app/context/AuthContext'; // Assuming context path
import { appColors } from '@/constants/appColors'; // Assuming constants path
// import { updateUserSettings, updateUserPassword, requestCreditLimitIncrease } from '@/app/services/api'; // Assuming API service path

// Match the web version's type
interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  paymentReminders: boolean;
  theme: 'light' | 'dark' | 'system';
}

const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [creditLimit, setCreditLimit] = useState<number>(5000); // Mock initial value
  const [requestedLimit, setRequestedLimit] = useState<number>(5000); // Mock initial value
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    paymentReminders: true,
    theme: 'light'
  });
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);

  // Simulate fetching initial settings
  useEffect(() => {
    setLoading(true);
    // Simulate API call to fetch current limit and preferences
    setTimeout(() => {
        // Replace with actual fetch logic if API exists
        // Example: fetchUserSettings(user.id).then(data => { ... });
        setCreditLimit(5000); // Use mock data
        setRequestedLimit(5000);
        setPreferences({
            emailNotifications: true,
            smsNotifications: false,
            marketingEmails: false,
            paymentReminders: true,
            theme: 'light'
        }); // Use mock data
        setLoading(false);
    }, 500);
  }, [user]);

  // Clear message after a delay
  useEffect(() => {
      if (message) {
          const timer = setTimeout(() => setMessage(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [message]);

  const handleCreditLimitSubmit = async () => {
    if (requestedLimit < 1000 || requestedLimit > 10000) {
      setMessage({ text: 'Requested limit must be between $1,000 and $10,000', type: 'error' });
      return;
    }

    // Simulate API call
    setMessage({ text: 'Processing request...', type: 'success' });
    try {
      // await requestCreditLimitIncrease(user.id, requestedLimit); // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      setMessage({ text: 'Credit limit request submitted. Pending review.', type: 'success' });
    } catch (error) {
      console.error("Credit Limit Request Error:", error);
      setMessage({ text: 'Failed to submit request. Please try again.', type: 'error' });
    }
  };

  const handlePasswordSubmit = async () => {
    if (!currentPassword) {
      setMessage({ text: 'Please enter your current password', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    setMessage({ text: 'Updating password...', type: 'success' });
    try {
        // await updateUserPassword(user.id, currentPassword, newPassword); // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        setMessage({ text: 'Password updated successfully', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        console.error("Password Update Error:", error);
        // Use error message from API if available
        const errorMessage = error?.response?.data?.message || 'Failed to update password. Please check current password.';
        setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handlePreferencesSave = async () => {
    setMessage({ text: 'Saving preferences...', type: 'success' });
    try {
        // await updateUserSettings(user.id, preferences); // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        setMessage({ text: 'Preferences saved successfully', type: 'success' });
    } catch (error) {
        console.error("Preferences Save Error:", error);
        setMessage({ text: 'Failed to save preferences. Please try again.', type: 'error' });
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={appColors.primary} /><Text>Loading Settings...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Account Settings</Text>
      <Text style={styles.subtitle}>Manage your account preferences and security</Text>

      {message && (
        <View style={[styles.alert, message.type === 'success' ? styles.alertSuccess : styles.alertError]}>
          <Text style={styles.alertText}>{message.text}</Text>
        </View>
      )}

      {/* Credit Limit Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Credit Limit</Text>
        <Text style={styles.label}>Current Limit: ${creditLimit.toLocaleString()}</Text>
        <Text style={styles.label}>Requested Limit: ${requestedLimit.toLocaleString()}</Text>
        {/* Slider could be added here if desired, using a library */}
         <TextInput
            style={styles.input}
            value={String(requestedLimit)} // Use String for TextInput value
            onChangeText={(text) => setRequestedLimit(Number(text) || 0)} // Handle NaN
            keyboardType="numeric"
            placeholder="Enter desired limit (1000-10000)"
        />
        <Button title="Request New Limit" onPress={handleCreditLimitSubmit} color={appColors.primary} />
        <Text style={styles.hintText}>Requests are subject to review.</Text>
      </View>

      {/* Notification Preferences Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notification Preferences</Text>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Email Notifications</Text>
          <Switch
            trackColor={{ false: '#767577', true: appColors.primary }}
            thumbColor={preferences.emailNotifications ? appColors.white : '#f4f3f4'}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, emailNotifications: value }))}
            value={preferences.emailNotifications}
          />
        </View>
         <View style={styles.switchRow}>
          <Text style={styles.label}>SMS Notifications</Text>
          <Switch
            trackColor={{ false: '#767577', true: appColors.primary }}
            thumbColor={preferences.smsNotifications ? appColors.white : '#f4f3f4'}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, smsNotifications: value }))}
            value={preferences.smsNotifications}
          />
        </View>
         <View style={styles.switchRow}>
          <Text style={styles.label}>Marketing Emails</Text>
          <Switch
            trackColor={{ false: '#767577', true: appColors.primary }}
            thumbColor={preferences.marketingEmails ? appColors.white : '#f4f3f4'}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, marketingEmails: value }))}
            value={preferences.marketingEmails}
          />
        </View>
         <View style={styles.switchRow}>
          <Text style={styles.label}>Payment Reminders</Text>
          <Switch
            trackColor={{ false: '#767577', true: appColors.primary }}
            thumbColor={preferences.paymentReminders ? appColors.white : '#f4f3f4'}
            onValueChange={(value) => setPreferences(prev => ({ ...prev, paymentReminders: value }))}
            value={preferences.paymentReminders}
          />
        </View>
         <Button title="Save Preferences" onPress={handlePreferencesSave} color={appColors.primary} />
      </View>

       {/* Theme Selection Section */}
       <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <Text style={styles.label}>Theme</Text>
        <View style={styles.pickerContainer}>
            <Picker
                selectedValue={preferences.theme}
                onValueChange={(itemValue) => setPreferences(prev => ({ ...prev, theme: itemValue }))}
                style={styles.picker}
            >
                <Picker.Item label="Light" value="light" />
                <Picker.Item label="Dark" value="dark" />
                <Picker.Item label="System Default" value="system" />
            </Picker>
        </View>
         {/* Save button might go here or be combined with other saves */}
         {/* <Button title="Save Theme" onPress={handlePreferencesSave} color={appColors.primary} /> */}
      </View>

      {/* Change Password Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Change Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="New Password (min 8 chars)"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Button title="Update Password" onPress={handlePasswordSubmit} color={appColors.primary} />
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
      fontSize: 14,
      color: appColors.gray,
      marginBottom: 20,
  },
  alert: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  alertSuccess: {
    backgroundColor: '#d4edda', // Light green
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  alertError: {
    backgroundColor: '#f8d7da', // Light red
    borderColor: '#f5c6cb',
    borderWidth: 1,
  },
  alertText: {
    color: '#155724', // Dark green for success
    // Adjust color for error text if needed
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  hintText: {
      fontSize: 12,
      color: appColors.gray,
      marginTop: 8,
  },
  switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: appColors.lightGray,
  },
  pickerContainer: {
      borderWidth: 1,
      borderColor: appColors.border,
      borderRadius: 5,
      marginBottom: 15, // Match input margin
  },
  picker: {
     height: 50, // Standard height
     width: '100%',
     // backgroundColor: '#fff', // Can cause issues on Android, style container instead
  }
});

export default SettingsScreen; 