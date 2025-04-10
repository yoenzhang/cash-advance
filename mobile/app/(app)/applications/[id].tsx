import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useApplication } from '@/context/ApplicationContext';
import { ApplicationStatus, DisbursementFormData, RepaymentFormData } from '@/types/application';

// Re-use or import helpers
const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { return 'Invalid Date'; }
};

// This corresponds to ApplicationDetails in the web app
export default function ApplicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    selectedApplication,
    loading,
    error,
    getApplicationById,
    cancelApplication,
    disburseFunds,
    repayFunds,
    actionLoading, // Loading state for actions
  } = useApplication();

  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);

  // State for Disbursement Form
  const [disburseForm, setDisburseForm] = useState<DisbursementFormData>({
    applicationId: id || '',
    expressDelivery: selectedApplication?.expressDelivery || false,
    tip: selectedApplication?.tip || 0,
  });

  // State for Repayment Form
  const [repayForm, setRepayForm] = useState<RepaymentFormData>({
    applicationId: id || '',
    amount: 0,
  });

  useEffect(() => {
    if (id) {
      getApplicationById(id);
    } else {
      // Handle case where ID is missing, maybe redirect
      console.error("Application ID is missing!");
      if(router.canGoBack()) router.back();
    }
  }, [id]);

  // Update form defaults if selectedApplication changes
  useEffect(() => {
    if (selectedApplication) {
        setDisburseForm(prev => ({ 
            ...prev, 
            applicationId: selectedApplication.id, 
            expressDelivery: selectedApplication.expressDelivery || false,
            tip: selectedApplication.tip || 0 
        }));
        setRepayForm(prev => ({ 
            ...prev, 
            applicationId: selectedApplication.id, 
            // Pre-fill with remaining amount, but allow user to change
            amount: selectedApplication.remainingAmount ?? selectedApplication.amount ?? 0 
        }));
    }
  }, [selectedApplication]);

  const handleCancel = async () => {
    if (!id) return;
    Alert.alert(
        "Cancel Application",
        "Are you sure you want to cancel this application?",
        [
            { text: "No", style: "cancel" },
            { text: "Yes", onPress: () => cancelApplication(id), style: "destructive" }
        ]
    );
  };

  const handleDisburse = async () => {
    await disburseFunds(disburseForm);
    setShowDisburseModal(false); // Close modal on success/failure (context handles error state)
  };

  const handleRepay = async () => {
      if (repayForm.amount <= 0) {
          Alert.alert("Invalid Amount", "Please enter a repayment amount greater than zero.");
          return;
      }
    await repayFunds(repayForm);
    setShowRepayModal(false);
  };

  const getStatusStyle = (status: ApplicationStatus | undefined) => {
     if (!status) return styles.statusDefault;
    switch (status) {
      case ApplicationStatus.PENDING: return styles.statusPending;
      case ApplicationStatus.APPROVED: return styles.statusApproved;
      case ApplicationStatus.REJECTED: return styles.statusRejected;
      case ApplicationStatus.DISBURSED: return styles.statusDisbursed;
      case ApplicationStatus.REPAID: return styles.statusRepaid;
      case ApplicationStatus.CANCELLED: return styles.statusCancelled;
      default: return styles.statusDefault;
    }
  };

  if (loading && !selectedApplication) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error && !selectedApplication) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }

  if (!selectedApplication) {
    // Should ideally not happen if loading/error handled, but as a fallback
    return <View style={styles.centered}><Text>Application not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Application ${id?.substring(0, 6)}...` }} />

      {/* Display general fetch error if present */}
      {error && <Text style={[styles.errorText, { margin: 15 }]}>{error}</Text>}

      <View style={styles.card}>
        {/* Basic Info Section */}
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>ID:</Text>
          <Text style={styles.detailValue}>{selectedApplication.id}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View style={[styles.statusBadge, getStatusStyle(selectedApplication.status)]}>
             <Text style={styles.statusText}>{selectedApplication.status}</Text>
           </View>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(selectedApplication.amount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{formatDate(selectedApplication.createdAt)}</Text>
        </View>
         <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Updated:</Text>
          <Text style={styles.detailValue}>{formatDate(selectedApplication.updatedAt)}</Text>
        </View>

         {/* Financial Details Section */}
         <Text style={styles.sectionTitle}>Financials</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Credit Limit:</Text>
            <Text style={styles.detailValue}>{formatCurrency(selectedApplication.creditLimit)}</Text>
          </View>
         {selectedApplication.disbursementDate && (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Disbursed On:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedApplication.disbursementDate)}</Text>
            </View>
         )}
         {selectedApplication.repaymentAmount !== undefined && (
           <View style={styles.detailRow}>
             <Text style={styles.detailLabel}>Total Repaid:</Text>
             <Text style={styles.detailValue}>{formatCurrency(selectedApplication.repaymentAmount)}</Text>
           </View>
         )}
          {selectedApplication.remainingAmount !== undefined && (
           <View style={styles.detailRow}>
             <Text style={styles.detailLabel}>Remaining Balance:</Text>
             <Text style={styles.detailValue}>{formatCurrency(selectedApplication.remainingAmount)}</Text>
           </View>
         )}
         {selectedApplication.repaymentDate && (
           <View style={styles.detailRow}>
             <Text style={styles.detailLabel}>Fully Repaid On:</Text>
             <Text style={styles.detailValue}>{formatDate(selectedApplication.repaymentDate)}</Text>
           </View>
         )}
          {selectedApplication.tip !== undefined && selectedApplication.tip > 0 && (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tip Added:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedApplication.tip)}</Text>
            </View>
         )}
           {selectedApplication.expressDelivery && (
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery:</Text>
                <Text style={styles.detailValue}>Express</Text>
            </View>
         )}
      </View>

      {/* Actions Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {selectedApplication.status === ApplicationStatus.PENDING && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, actionLoading && styles.buttonDisabled]}
            onPress={handleCancel}
            disabled={actionLoading}
          >
             {actionLoading ? <ActivityIndicator color="#007bff" /> : <Text style={styles.buttonTextSecondary}>Cancel Application</Text>}
          </TouchableOpacity>
        )}

        {selectedApplication.status === ApplicationStatus.APPROVED && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, actionLoading && styles.buttonDisabled]}
            onPress={() => setShowDisburseModal(true)}
            disabled={actionLoading}
          >
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Disburse Funds</Text>}
          </TouchableOpacity>
        )}

        {selectedApplication.status === ApplicationStatus.DISBURSED && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, actionLoading && styles.buttonDisabled]}
            onPress={() => setShowRepayModal(true)}
            disabled={actionLoading}
          >
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Make Repayment</Text>}
          </TouchableOpacity>
        )}

        {/* Add message if no actions available */}
        {[ApplicationStatus.REPAID, ApplicationStatus.REJECTED, ApplicationStatus.CANCELLED].includes(selectedApplication.status) && (
            <Text style={styles.noActionsText}>No further actions available for this application.</Text>
        )}
      </View>

      {/* --- Modals --- */} 

      {/* Disbursement Modal */}
      <Modal
        visible={showDisburseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDisburseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Disburse Funds</Text>
            <View style={styles.switchRow}>
                <Text style={styles.modalLabel}>Express Delivery?</Text>
                <Switch
                    value={disburseForm.expressDelivery}
                    onValueChange={(value) => setDisburseForm({ ...disburseForm, expressDelivery: value })}
                />
            </View>
            <Text style={styles.modalLabel}>Tip Amount (Optional)</Text>
            <TextInput
              style={styles.input}
              value={disburseForm.tip.toString()}
              onChangeText={(text) => setDisburseForm({ ...disburseForm, tip: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholder="0.00"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, {flex: 1}] }
                onPress={() => setShowDisburseModal(false)}
                disabled={actionLoading}
              >
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, {flex: 1}] }
                onPress={handleDisburse}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Repayment Modal */}
      <Modal
        visible={showRepayModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRepayModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Make Repayment</Text>
            <Text style={styles.modalLabel}>Repayment Amount</Text>
            <TextInput
              style={styles.input}
              value={repayForm.amount.toString()}
              onChangeText={(text) => setRepayForm({ ...repayForm, amount: parseFloat(text) || 0 })}
              keyboardType="numeric"
              placeholder="Enter amount"
            />
             <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, {flex: 1}] }
                onPress={() => setShowRepayModal(false)}
                disabled={actionLoading}
              >
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, {flex: 1}] }
                onPress={handleRepay}
                disabled={actionLoading}
              >
                 {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonTextPrimary}>Confirm Repayment</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
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
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#555',
    marginRight: 10,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flexShrink: 1, // Allow value text to shrink
  },
  // Status Badge Styles (copied from list)
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  statusPending: { backgroundColor: '#ffc107' },
  statusApproved: { backgroundColor: '#28a745' },
  statusRejected: { backgroundColor: '#dc3545' },
  statusDisbursed: { backgroundColor: '#17a2b8' },
  statusRepaid: { backgroundColor: '#6c757d' },
  statusCancelled: { backgroundColor: '#adb5bd' },
  statusDefault: { backgroundColor: '#6c757d' },
  // Button Styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    minHeight: 44, // Ensure minimum tap target size
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
  buttonSecondary: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  buttonTextSecondary: {
    color: '#007bff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  noActionsText: {
      textAlign: 'center',
      color: '#666',
      marginTop: 15,
      fontStyle: 'italic'
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30, // Add padding for bottom safe area / buttons
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
      fontSize: 14,
      color: '#555',
      marginBottom: 5,
      marginTop: 10,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
      marginTop: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 14,
  },
}); 