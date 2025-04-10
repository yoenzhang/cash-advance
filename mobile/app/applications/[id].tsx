import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    TextInput,
    Switch,
    SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useApplication } from '@/app/context/ApplicationContext';
import { ApplicationStatus, DisbursementFormData, RepaymentFormData } from '@/app/types/application';
import { appColors } from '@/constants/appColors';
import StatusBadge from '@/app/components/StatusBadge';

// --- Helper Functions (reuse or move to utils) ---
const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
  } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
  }
};

// --- Main Component ---
const ApplicationDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    selectedApplication,
    loading: contextLoading,
    error: contextError,
    getApplicationById,
    clearSelectedApplication,
    cancelApplication,
    disburseFunds,
    repayFunds,
    clearError: clearAppContextError
  } = useApplication();

  const [showDisbursementForm, setShowDisbursementForm] = useState(false);
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form States
  const [disbursementForm, setDisbursementForm] = useState<Omit<DisbursementFormData, 'applicationId'>>({ expressDelivery: false, tip: 0 });
  const [repaymentForm, setRepaymentForm] = useState<Omit<RepaymentFormData, 'applicationId'>>({ amount: 0 });

  useEffect(() => {
    if (id) {
      clearAppContextError(); // Clear potential errors from list view
      getApplicationById(id);
    } 
    // Clear selected application when the screen is left
    return () => {
        clearSelectedApplication();
    }
  }, [id]);

   // Update form default amount when application loads
   useEffect(() => {
    if (selectedApplication?.status === ApplicationStatus.DISBURSED && selectedApplication?.remainingAmount) {
      setRepaymentForm(prev => ({ ...prev, amount: selectedApplication.remainingAmount ?? 0 }));
    } 
    if (selectedApplication?.status === ApplicationStatus.APPROVED) {
        setDisbursementForm(prev => ({ ...prev, tip: selectedApplication.tip ?? 0, expressDelivery: selectedApplication.expressDelivery ?? false }))
    }
  }, [selectedApplication]);

  const handleFormChange = (formSetter: Function, field: string, value: any) => {
      formSetter((prev: any) => ({ ...prev, [field]: value }));
  }

  // --- Action Handlers ---
  const handleCancel = async () => {
    if (!id) return;
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this application?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            setActionError(null);
            try {
              await cancelApplication(id);
              // Application context updates the selectedApplication, no need to fetch again
              // Optionally navigate back or show success message
              Alert.alert('Success', 'Application cancelled.');
            } catch (err: any) {
              setActionError(err.message || 'Failed to cancel application');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

 const handleDisburse = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await disburseFunds({ ...disbursementForm, applicationId: id });
      setShowDisbursementForm(false);
      Alert.alert('Success', 'Funds disbursement initiated.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to disburse funds');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!id || !selectedApplication?.remainingAmount) return;
    // Basic validation
    if (repaymentForm.amount <= 0 || repaymentForm.amount > selectedApplication.remainingAmount) {
        Alert.alert('Invalid Amount', `Please enter an amount between $0.01 and ${formatCurrency(selectedApplication.remainingAmount)}.`);
        return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      await repayFunds({ ...repaymentForm, applicationId: id });
      setShowRepaymentForm(false);
      Alert.alert('Success', 'Repayment submitted.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit repayment');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Render Logic ---
  if (contextLoading) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
         <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color={appColors.primary} />
      </SafeAreaView>
    );
  }

  if (contextError || !selectedApplication) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
         <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>{contextError || 'Application not found.'}</Text>
         <TouchableOpacity style={[styles.button, styles.buttonOutline, { marginTop: 15 }]} onPress={() => router.back()}>
             <Text style={[styles.buttonText, styles.buttonTextOutline]}>Go Back</Text>
         </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Render Helper for Detail Items ---
  const DetailItem = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
      value || value === 0 ? (
          <View style={styles.detailItemContainer}>
              <Text style={styles.detailLabel}>{label}:</Text>
              {typeof value === 'string' ? <Text style={styles.detailValue}>{value}</Text> : value}
          </View>
      ) : null
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: `Application ${id?.substring(0, 6) ?? ''}...`,
          // headerBackTitle: 'Back', // Optional: customize back button text
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Action Error Display */}
        {actionError && (
            <View style={styles.actionErrorContainer}>
                <Text style={styles.actionErrorText}>{actionError}</Text>
            </View>
        )}

        {/* Basic Info Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <DetailItem label="Application ID" value={selectedApplication.id} />
          <DetailItem label="Status" value={<StatusBadge status={selectedApplication.status} />} />
          <DetailItem label="Amount Requested" value={formatCurrency(selectedApplication.amount)} />
          <DetailItem label="Created At" value={formatDate(selectedApplication.createdAt)} />
          <DetailItem label="Last Updated" value={formatDate(selectedApplication.updatedAt)} />
          <DetailItem label="Credit Limit" value={formatCurrency(selectedApplication.creditLimit)} />
           {/* Show fields conditionally based on what makes sense for the status */} 
           <DetailItem label="Disbursement Date" value={formatDate(selectedApplication.disbursementDate)} />
           <DetailItem label="Repayment Date" value={formatDate(selectedApplication.repaymentDate)} />
           <DetailItem label="Repaid Amount" value={formatCurrency(selectedApplication.repaymentAmount)} />
           <DetailItem label="Remaining Amount" value={formatCurrency(selectedApplication.remainingAmount)} />
           <DetailItem label="Express Delivery" value={selectedApplication.expressDelivery ? 'Yes' : 'No'} />
           <DetailItem label="Tip Amount" value={formatCurrency(selectedApplication.tip)} />
        </View>

        {/* Actions Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Actions</Text>

          {/* Cancel Action */}
          {selectedApplication.status === ApplicationStatus.PENDING && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, { marginBottom: 15 }, actionLoading && styles.buttonDisabled ]}
              onPress={handleCancel}
              disabled={actionLoading}
            >
               {actionLoading ? <ActivityIndicator color={appColors.primary} /> : <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel Application</Text>}
            </TouchableOpacity>
          )}

          {/* Disburse Action & Form */}
          {selectedApplication.status === ApplicationStatus.APPROVED && (
             <View style={styles.actionBlock}>
                {!showDisbursementForm ? (
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, actionLoading && styles.buttonDisabled ]}
                        onPress={() => {setShowDisbursementForm(true); setActionError(null); /* Reset tip/express */ }} // Reset form state if needed
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator color={appColors.white} /> : <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Disburse Funds</Text>}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Confirm Disbursement</Text>
                         <View style={styles.switchContainer}>
                            <Text style={styles.inputLabel}>Express Delivery?</Text>
                            <Switch
                                trackColor={{ false: appColors.gray, true: appColors.primary }}
                                thumbColor={appColors.white}
                                ios_backgroundColor={appColors.mediumGray}
                                onValueChange={(value) => handleFormChange(setDisbursementForm, 'expressDelivery', value)}
                                value={disbursementForm.expressDelivery}
                            />
                        </View>
                         <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Tip Amount (Optional):</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={disbursementForm.tip?.toString() ?? '0'}
                                onChangeText={(text) => handleFormChange(setDisbursementForm, 'tip', parseFloat(text) || 0)}
                                keyboardType="numeric"
                                placeholderTextColor={appColors.gray}
                            />
                        </View>
                        <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary, { flex: 1 }, actionLoading && styles.buttonDisabled]}
                                onPress={() => setShowDisbursementForm(false)}
                                disabled={actionLoading}
                            >
                                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
                            </TouchableOpacity>
                             <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary, { flex: 1 }, actionLoading && styles.buttonDisabled]}
                                onPress={handleDisburse}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator color={appColors.white} /> : <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Confirm</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
             </View>
          )}

           {/* Repay Action & Form */}
          {selectedApplication.status === ApplicationStatus.DISBURSED && (
             <View style={styles.actionBlock}>
                 {!showRepaymentForm ? (
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, actionLoading && styles.buttonDisabled ]}
                        onPress={() => {setShowRepaymentForm(true); setActionError(null); /* Reset amount */ setRepaymentForm({amount: selectedApplication.remainingAmount ?? 0})}}
                        disabled={actionLoading}
                    >
                       {actionLoading ? <ActivityIndicator color={appColors.white} /> : <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Repay Funds</Text>}
                    </TouchableOpacity>
                  ) : (
                      <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>Submit Repayment</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>Amount to Repay:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={formatCurrency(selectedApplication.remainingAmount)}
                                value={repaymentForm.amount?.toString() ?? ''}
                                onChangeText={(text) => handleFormChange(setRepaymentForm, 'amount', parseFloat(text) || 0)}
                                keyboardType="numeric"
                                placeholderTextColor={appColors.gray}
                            />
                            <Text style={styles.inputHelpText}>Max: {formatCurrency(selectedApplication.remainingAmount)}</Text>
                        </View>
                         <View style={styles.formActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary, { flex: 1 }, actionLoading && styles.buttonDisabled ]}
                                onPress={() => setShowRepaymentForm(false)}
                                disabled={actionLoading}
                            >
                                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
                            </TouchableOpacity>
                             <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary, { flex: 1 }, actionLoading && styles.buttonDisabled]}
                                onPress={handleRepay}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator color={appColors.white} /> : <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Submit Payment</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                  )
                 }
             </View>
          )}

           {/* Message for other statuses */}
            {![ApplicationStatus.PENDING, ApplicationStatus.APPROVED, ApplicationStatus.DISBURSED].includes(selectedApplication.status) && (
                <Text style={styles.noActionsText}>No further actions available for this application status.</Text>
            )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.lightGray,
  },
   safeAreaLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: appColors.lightGray,
      padding: 20,
  },
  container: {
    padding: 15,
  },
  sectionContainer: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColors.dark,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: appColors.lightGray,
    paddingBottom: 8,
  },
  detailItemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
      flexWrap: 'wrap', // Allow wrapping for long values
  },
  detailLabel: {
    fontSize: 14,
    color: appColors.gray,
    fontWeight: '500',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: appColors.dark,
    textAlign: 'right',
    flexShrink: 1, // Allow text to shrink
  },
   actionErrorContainer: {
       backgroundColor: appColors.danger + '20', // light red
       padding: 10,
       borderRadius: 8,
       marginBottom: 15,
       borderWidth: 1,
       borderColor: appColors.danger,
   },
   actionErrorText: {
       color: appColors.danger,
       fontSize: 14,
       textAlign: 'center',
   },
  actionBlock: {
      marginBottom: 15, 
  },
  formContainer: {
      marginTop: 10,
      padding: 15,
      backgroundColor: appColors.lightGray,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: appColors.mediumGray,
  },
  formTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: appColors.dark,
      marginBottom: 15,
  },
  formGroup: {
      marginBottom: 15,
  },
  inputLabel: {
      fontSize: 14,
      color: appColors.gray,
      marginBottom: 5,
      fontWeight: '500',
  },
  input: {
      backgroundColor: appColors.white,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: appColors.border,
      fontSize: 14,
      color: appColors.dark,
  },
   inputHelpText: {
       fontSize: 12,
       color: appColors.gray,
       marginTop: 4,
   },
  switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
      paddingVertical: 5,
  },
  formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 10,
  },
  noActionsText: {
      fontSize: 14,
      color: appColors.gray,
      textAlign: 'center',
      paddingVertical: 10,
  },
   errorText: {
       fontSize: 14,
       color: appColors.danger,
       textAlign: 'center',
       paddingHorizontal: 20,
   },
  // -- Reusable Button Styles --
   button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonPrimary: {
        backgroundColor: appColors.primary,
    },
    buttonSecondary: {
         backgroundColor: appColors.lightGray,
         borderWidth: 1,
         borderColor: appColors.mediumGray,
    },
    buttonOutline: {
        backgroundColor: appColors.white,
        borderWidth: 1,
        borderColor: appColors.primary,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    buttonTextPrimary: {
        color: appColors.white,
    },
    buttonTextSecondary: {
        color: appColors.dark,
    },
    buttonTextOutline: {
        color: appColors.primary,
    },
  // --- Reused Badge Styles (Referenced by StatusBadge - Keep or move fully) ---
  badgeBase: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start' },
  badgeTextBase: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  badgePending:   { backgroundColor: '#FFF3E0' }, badgeTextPending: { color: '#F57C00' },
  badgeApproved:  { backgroundColor: '#E8F5E9' }, badgeTextApproved:{ color: '#388E3C' },
  badgeRejected:  { backgroundColor: '#FFEBEE' }, badgeTextRejected:{ color: '#D32F2F' },
  badgeDisbursed: { backgroundColor: '#E3F2FD' }, badgeTextDisbursed:{ color: '#1976D2' },
  badgeRepaid:    { backgroundColor: '#E8F5E9' }, badgeTextRepaid:  { color: '#388E3C' },
  badgeCancelled: { backgroundColor: '#F5F5F5' }, badgeTextCancelled:{ color: '#757575' },
});

export default ApplicationDetailsScreen; 