import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useApplication } from '@/app/context/ApplicationContext';
import { CashAdvanceApplication, ApplicationFormData } from '@/app/types/application';
import { appColors } from '@/constants/appColors';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import StatusBadge from '@/app/components/StatusBadge';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
  }
};

const ApplicationsScreen = () => {
  const { applications, loading, error: contextError, fetchApplications, createApplication, loading: contextLoading, clearError: clearContextError } = useApplication();
  const router = useRouter();
  const params = useLocalSearchParams<{ openApplyForm?: string }>();

  // State to toggle between list and form view
  const [isApplying, setIsApplying] = useState(false);
  console.log('ApplicationsScreen Rendered - isApplying:', isApplying); // Log state

  // Form state and logic (moved directly here)
  const [formData, setFormData] = useState<ApplicationFormData>({
    amount: '',
    purpose: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string | undefined }>({});

  const handleFormChange = (field: keyof ApplicationFormData, value: string | number | boolean) => {
    // Ensure amount and tip are handled as strings until submission
    const processedValue = (field === 'amount')
        ? value.toString().replace(/[^0-9.]/g, '') // Allow only numbers and decimal
        : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string | undefined } = {};
    const numericAmount = parseFloat(formData.amount as string);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    if (!formData.purpose.trim()) {
      errors.purpose = 'Purpose is required';
    }

    setValidationErrors(errors);
    return Object.values(errors).every(err => err === undefined);
  };

  const resetForm = () => {
    setFormData({ amount: '', purpose: '' });
    setValidationErrors({});
    clearContextError();
  };

  const handleSubmit = async () => {
    clearContextError();
    setValidationErrors({});
    if (!validateForm()) {
        Alert.alert('Validation Error', 'Please check the form fields.');
      return;
    }
    // Ensure amount is parsed correctly before sending
    const finalData: ApplicationFormData = {
        amount: parseFloat(formData.amount as string) || 0,
        purpose: formData.purpose,
    };
    try {
      const newApplication = await createApplication(finalData);
      if (newApplication) {
          Alert.alert('Success', 'Application submitted successfully!');
          resetForm();
          setIsApplying(false); // Go back to list view on success
          // Navigate after setting state back
          router.push(`/applications/${newApplication.id}`);
      }
    } catch (err) {
      console.error('Failed to create application:', err);
      // Error is shown via contextError state
    }
  };
  // --- End form logic ---

  useEffect(() => {
    // Fetch applications initially
    fetchApplications();
  }, []);

  useEffect(() => {
    // Handle deep linking parameter to open form
    console.log('Checking params.openApplyForm:', params.openApplyForm);
    if (params.openApplyForm === 'true') {
      console.log('Param detected, calling handleNewApplication');
      // Use setTimeout to ensure state update happens after initial render if needed
      setTimeout(() => {
          if (!isApplying) { // Only trigger if not already applying
             handleNewApplication();
          }
          // Clear the param after handling? Optional.
          // router.setParams({ openApplyForm: undefined });
      }, 0);
    }
  }, [params.openApplyForm]);

  // Navigation handlers
  const handleViewDetails = (id: string) => {
    router.push(`/applications/${id}`);
  };

  // Function to switch to the apply form view
  const handleNewApplication = () => {
     resetForm(); // Reset form when showing it
     setIsApplying(true);
  };

  // Function to switch back to the list view
  const handleCancelApplication = () => {
      resetForm();
      setIsApplying(false);
  };

  // --- Render functions ---

  const renderApplicationItem = ({ item }: { item: CashAdvanceApplication }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item.id)} style={styles.itemContainer}>
        <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>ID:</Text>
            <Text style={styles.itemValue}>{item.id.substring(0, 8)}...</Text>
        </View>
         <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Amount:</Text>
            <Text style={[styles.itemValue, styles.amountValue]}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Created:</Text>
            <Text style={styles.itemValue}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={styles.itemRow}>
             <Text style={styles.itemLabel}>Status:</Text>
             <StatusBadge status={item.status} />
        </View>
         <Text style={styles.detailsIndicator}>View Details &rarr;</Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>You don't have any cash advance applications yet.</Text>
      {/* Button now calls handleNewApplication - KEEP this button here */}
      <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleNewApplication}>
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Apply Now</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
        {/* Configure Header Dynamically */}
        <Stack.Screen
             options={{
                 title: isApplying ? 'New Application' : 'Cash Advance Applications', // Update title
                 headerShown: true, // Make sure header is shown
                 headerBackVisible: false, // Hide default back button
                 headerLeft: isApplying ? () => (
                     // Add a Cancel button for the form view in the header
                     <TouchableOpacity onPress={handleCancelApplication} style={{ marginLeft: 15 }}>
                         <Text style={styles.headerButtonText}>Cancel</Text>
                     </TouchableOpacity>
                 ) : undefined, // No headerLeft for list view
                 // Remove headerRight entirely
                 headerRight: undefined,
             }}
         />

      {isApplying ? (
          // --- Render Application Form ---
           <KeyboardAvoidingView
               behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
               style={{ flex: 1 }}
           >
              <ScrollView
                  contentContainerStyle={styles.formContainer}
                  keyboardShouldPersistTaps="handled"
              >
                   {/* Context Error Display */}
                   {contextError && (
                        <View style={styles.formContextErrorContainer}>
                            <Text style={styles.formErrorText}>{contextError}</Text>
                       </View>
                    )}

                   {/* Amount Field */}
                   <View style={styles.formGroup}>
                       <Text style={styles.formInputLabel}>Amount ($)</Text>
                       <TextInput
                            style={[styles.formInput, validationErrors.amount ? styles.formInputError : null]}
                            placeholder="e.g., 500.00"
                            value={formData.amount.toString()} // Keep as string for input
                            onChangeText={(text) => handleFormChange('amount', text)}
                            keyboardType="numeric"
                            placeholderTextColor={appColors.gray}
                       />
                       {validationErrors.amount && (
                           <Text style={styles.formValidationErrorText}>{validationErrors.amount}</Text>
                       )}
                   </View>

                   {/* Purpose Field */}
                   <View style={styles.formGroup}>
                       <Text style={styles.formInputLabel}>Purpose</Text>
                       <TextInput
                            style={[
                                styles.formInput,
                                styles.formInputTextArea, // Style for multi-line
                                validationErrors.purpose ? styles.formInputError : null
                            ]}
                            value={formData.purpose}
                            onChangeText={(text) => handleFormChange('purpose', text)}
                            placeholder="E.g., Emergency car repair, utility bill"
                            multiline
                            numberOfLines={3}
                            placeholderTextColor={appColors.gray}
                       />
                       {validationErrors.purpose && (
                           <Text style={styles.formValidationErrorText}>{validationErrors.purpose}</Text>
                       )}
                   </View>

                   {/* Form Actions */}
                   <View style={styles.formActions}>
                       {/* Cancel button moved to headerLeft */}
                       <TouchableOpacity
                           style={[styles.button, styles.buttonPrimary, styles.formActionButton]}
                           onPress={handleSubmit}
                           disabled={contextLoading}
                       >
                           <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                               {contextLoading ? 'Submitting...' : 'Submit Application'}
                           </Text>
                       </TouchableOpacity>
                   </View>
              </ScrollView>
           </KeyboardAvoidingView>
      ) : (
          // --- Render Application List View ---
          <View style={styles.listViewContainer}>
             {/* In-Page Header Area */}
             <View style={styles.listHeaderContainer}>
                <View style={styles.listHeaderRow}>
                    {/* Add Back button if needed, e.g., if this wasn't in tabs */}
                    {/* <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>{'< Back'}</Text>
                    </TouchableOpacity> */}
                    <Text style={styles.listTitle}>Your Cash Advance Applications</Text>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, styles.newAppButton]}
                        onPress={handleNewApplication} // Trigger form view
                        disabled={contextLoading || loading} // Disable if loading anything
                    >
                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>New Application</Text>
                    </TouchableOpacity>
                </View>
             </View>

            {/* Conditional Rendering for List/Empty/Error */}
             {loading && applications.length === 0 ? ( // Initial load indicator
                <View style={styles.centeredMessageContainer}>
                     <ActivityIndicator size="large" color={appColors.primary} />
                </View>
            ) : contextError && applications.length === 0 ? ( // Error only if list is empty
                 <View style={styles.centeredMessageContainer}>
                     <Text style={styles.errorText}>Error: {contextError}</Text>
                     <TouchableOpacity style={[styles.button, styles.buttonOutline, {marginTop: 15}]} onPress={fetchApplications} disabled={loading}>
                         <Text style={[styles.buttonText, styles.buttonTextOutline]}>Retry</Text>
                     </TouchableOpacity>
                </View>
            ) : applications.length === 0 ? (
                 renderEmptyList() // Use the empty list component (which also has an apply button)
            ) : (
                // Render the actual list
                <FlatList
                  data={[...applications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())} // Sort by most recent
                  renderItem={renderApplicationItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContentContainer}
                  ListHeaderComponent={contextError ? ( // Show error above list if list has items
                      <View style={styles.listErrorContainer}>
                          <Text style={styles.errorText}>Error refreshing: {contextError}</Text>
                      </View>
                   ) : null}
                  refreshing={loading} // Show refresh indicator during fetch
                  onRefresh={fetchApplications} // Allow pull-to-refresh
                />
            )}
         </View>
      )}
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.lightGray, // Use lightGray for background
  },
  headerButtonText: { // Style for header text buttons
      color: appColors.primary,
      fontSize: 16,
      fontWeight: '500',
  },
  // Containers
  listViewContainer: {
    flex: 1,
  },
  centeredMessageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  listContentContainer: { // Padding for the FlatList items themselves
      paddingHorizontal: 15,
      paddingBottom: 20, // Space at the bottom of the scroll
  },
  listHeaderContainer: { // Container for the title and "New Application" button
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: appColors.white, // Or a slightly different header background
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
    marginBottom: 10, // Space between header and list items
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listErrorContainer: { // Container for error message shown above the list
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: appColors.ultraLightGray, // Use a light background
      borderWidth: 1, // Add border
      borderColor: appColors.danger, // Danger color border
      borderRadius: 4, // Add rounding
      marginBottom: 10,
  },
  emptyContainer: { // Style for when the list is empty
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 30,
  },
  formContainer: { // Padding for the form ScrollView
    padding: 20,
    paddingBottom: 50,
  },
  formGroup: {
    marginBottom: 20,
  },
  formActions: {
    marginTop: 20,
    // Removed justifyContent: 'flex-end' if only one button
  },
   formContextErrorContainer: {
       backgroundColor: appColors.ultraLightGray, // Use a light background
       borderWidth: 1, // Add border
       borderColor: appColors.danger, // Danger color border
       padding: 15,
       borderRadius: 8,
       marginBottom: 20,
   },

  // Text Elements
  listTitle: {
    fontSize: 20, // Slightly smaller title
    fontWeight: '600', // Bolder
    color: appColors.dark,
    flexShrink: 1, // Allow shrinking if button is wide
    marginRight: 10,
  },
  itemLabel: {
    fontSize: 14,
    color: appColors.gray,
    fontWeight: '500',
  },
  itemValue: {
    fontSize: 14,
    color: appColors.dark,
    fontWeight: '500',
    textAlign: 'right',
  },
  amountValue: {
      fontWeight: 'bold',
      color: appColors.dark, // Ensure dark color
  },
  detailsIndicator: {
      marginTop: 8, // More space
      textAlign: 'right',
      fontSize: 13, // Slightly larger
      color: appColors.primary,
      fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: appColors.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
      fontSize: 14,
      color: appColors.danger,
      textAlign: 'center',
  },
  formInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: appColors.dark,
  },
  formValidationErrorText: {
    color: appColors.danger,
    fontSize: 13,
    marginTop: 5,
  },
  formErrorText: { // For context error display
       color: appColors.danger,
       fontSize: 14,
       fontWeight: 'bold',
  },

  // Input Elements
  formInput: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: appColors.white,
    color: appColors.dark,
  },
  formInputTextArea: {
      minHeight: 80,
      textAlignVertical: 'top',
  },
  formInputError: {
    borderColor: appColors.danger,
  },

  // Buttons
  button: {
    borderRadius: 8,
    paddingVertical: 10, // Standard vertical padding
    paddingHorizontal: 16, // Standard horizontal padding
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: appColors.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, // Slightly thicker border
    borderColor: appColors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: appColors.white,
  },
  buttonTextOutline: {
    color: appColors.primary,
  },
  newAppButton: { // Specific style for the header button
     paddingVertical: 8,
     paddingHorizontal: 12,
     marginLeft: 'auto', // Push to the right
  },
  formActionButton: { // Style for the submit button in form
      // Use default button padding or customize
  },
  backButton: { // Style if using an in-page back button
      paddingRight: 10,
  },
  backButtonText: {
      fontSize: 16,
      color: appColors.primary,
      fontWeight: '500',
  },

  // List Items
  itemContainer: {
    backgroundColor: appColors.white,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appColors.border,
    // Added subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Vertically align items in a row
    marginBottom: 8,
  },
});

export default ApplicationsScreen;