import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useApplication } from '@/context/ApplicationContext';
import { ApplicationFormData } from '@/types/application';

// This corresponds to ApplicationForm in the web app
export default function NewApplicationScreen() {
  const router = useRouter();
  const { createApplication, actionLoading, error } = useApplication();

  // Use string for amount/tip initially to handle empty input better
  const [amountStr, setAmountStr] = useState('');
  const [tipStr, setTipStr] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expressDelivery, setExpressDelivery] = useState(false);
  
  const [validationErrors, setValidationErrors] = useState<{
    amount?: string;
    tip?: string;
    purpose?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { amount?: string; tip?: string; purpose?: string } = {};
    const amountNum = parseFloat(amountStr);
    const tipNum = parseFloat(tipStr || '0');

    if (isNaN(amountNum) || amountNum <= 0) {
      errors.amount = 'Amount must be a number greater than 0';
    }
    if (isNaN(tipNum) || tipNum < 0) {
        errors.tip = 'Tip must be a non-negative number';
    }
    if (!purpose.trim()) {
      errors.purpose = 'Purpose is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const formData: ApplicationFormData = {
      amount: parseFloat(amountStr),
      purpose: purpose.trim(),
      expressDelivery: expressDelivery,
      tip: parseFloat(tipStr || '0'),
    };

    try {
        await createApplication(formData);
        // Check if context has error after action, otherwise navigate back
        // NOTE: This assumes the context clears errors on new actions
        if (!error) { // Re-check error state from context *after* await
             Alert.alert("Success", "Application submitted successfully.", [
                 { text: "OK", onPress: () => router.back() }
             ]);
        } else {
             Alert.alert("Submission Failed", error || "Could not submit application.");
        }
    } catch (err) {
        // Error should be caught and set in context's performAction
        Alert.alert("Submission Error", "An unexpected error occurred.");
        console.error('Failed to create application:', err);
    }
  };

  // Function to clear validation error when user types
  const handleInputChange = (field: keyof typeof validationErrors) => {
    if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ title: 'New Application' }} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>New Cash Advance</Text>

        {/* Display general context error if any */}
        {error && !actionLoading && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount ($)</Text>
          <TextInput
            style={[styles.input, validationErrors.amount ? styles.inputError : null]}
            value={amountStr}
            onChangeText={(text) => { setAmountStr(text); handleInputChange('amount'); }}
            keyboardType="numeric"
            placeholder="Enter desired amount"
          />
          {validationErrors.amount && (
            <Text style={styles.validationErrorText}>{validationErrors.amount}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Purpose</Text>
          <TextInput
            style={[styles.input, styles.textArea, validationErrors.purpose ? styles.inputError : null]}
            value={purpose}
            onChangeText={(text) => { setPurpose(text); handleInputChange('purpose'); }}
            placeholder="Briefly describe the reason (e.g., Rent, Bills)"
            multiline
            numberOfLines={3}
          />
           {validationErrors.purpose && (
            <Text style={styles.validationErrorText}>{validationErrors.purpose}</Text>
          )}
        </View>

        <View style={styles.formGroupSwitch}>
          <Text style={styles.label}>Express Delivery?</Text>
          <Switch
            value={expressDelivery}
            onValueChange={setExpressDelivery}
          />
        </View>
        <Text style={styles.switchHelpText}>Additional fees may apply for express delivery.</Text>


        <View style={styles.formGroup}>
          <Text style={styles.label}>Tip ($) (Optional)</Text>
          <TextInput
            style={[styles.input, validationErrors.tip ? styles.inputError : null]}
            value={tipStr}
            onChangeText={(text) => { setTipStr(text); handleInputChange('tip'); }}
            keyboardType="numeric"
            placeholder="0.00"
          />
           {validationErrors.tip && (
            <Text style={styles.validationErrorText}>{validationErrors.tip}</Text>
          )}
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
            disabled={actionLoading}
          >
            <Text style={styles.buttonTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSubmit}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonTextPrimary}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  formGroup: {
    marginBottom: 15,
  },
   formGroupSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Less margin before help text
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
      borderColor: 'red',
  },
  textArea: {
    height: 80, // Adjust height for multiline
    textAlignVertical: 'top', // Align text to top in Android
    paddingTop: 10,
  },
  switchHelpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 15,
  },
  button: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  buttonTextSecondary: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 15,
      fontSize: 14,
  },
  validationErrorText: {
      color: 'red',
      fontSize: 12,
      marginTop: 4,
  },
}); 