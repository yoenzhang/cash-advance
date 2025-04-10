import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useApplication } from '@/context/ApplicationContext';
import { ApplicationStatus, CashAdvanceApplication } from '@/types/application';
import { useRouter, Stack } from 'expo-router';

// Re-use or import helpers from Dashboard/utils
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// --- ApplicationItem Component ---
interface ApplicationItemProps {
  item: CashAdvanceApplication;
  onPress: (id: string) => void;
}

const ApplicationItem: React.FC<ApplicationItemProps> = ({ item, onPress }) => {
  const getStatusStyle = (status: ApplicationStatus) => {
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

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={() => onPress(item.id)}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemId}>ID: {item.id.substring(0, 8)}...</Text>
        <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.itemDate}>Created: {formatDate(item.createdAt)}</Text>
      </View>
      <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );
};

// --- Main Application List Screen ---
export default function ApplicationsIndexScreen() {
  const { applications, loading, fetchApplications } = useApplication();
  const router = useRouter();

  // Optionally add pull-to-refresh
  // const [isRefreshing, setIsRefreshing] = useState(false);
  // const onRefresh = async () => {
  //   setIsRefreshing(true);
  //   await fetchApplications();
  //   setIsRefreshing(false);
  // };

  const handleViewDetails = (id: string) => {
    router.push(`./${id}`); // Navigate to details screen relative to current path
  };

  const handleNewApplication = () => {
    router.push('./new'); // Navigate to new application screen
  };

  // Render header for FlatList
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Your Applications</Text>
      <TouchableOpacity style={styles.newButton} onPress={handleNewApplication}>
        <Text style={styles.newButtonText}>+ New Application</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state component
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No applications found.</Text>
      <TouchableOpacity style={[styles.newButton, { marginTop: 15 }]} onPress={handleNewApplication}>
        <Text style={styles.newButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
        {/* Configure screen header */}
        <Stack.Screen options={{ title: 'Applications' }} />
        <FlatList
            data={applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())} // Sort by most recent
            renderItem={({ item }) => <ApplicationItem item={item} onPress={handleViewDetails} />}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContentContainer}
            // Optional Pull-to-refresh
            // refreshing={isRefreshing}
            // onRefresh={onRefresh}
        />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  listContentContainer: {
      paddingBottom: 20,
  },
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  newButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 50, // Push down from header
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  // List Item
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 13,
    color: '#666',
  },
  // Status Badge
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 80, // Ensure badges have some width
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  statusPending: { backgroundColor: '#ffc107' }, // Yellow
  statusApproved: { backgroundColor: '#28a745' }, // Green
  statusRejected: { backgroundColor: '#dc3545' }, // Red
  statusDisbursed: { backgroundColor: '#17a2b8' }, // Teal
  statusRepaid: { backgroundColor: '#6c757d' }, // Gray
  statusCancelled: { backgroundColor: '#adb5bd' }, // Light Gray
  statusDefault: { backgroundColor: '#6c757d' }, // Default Gray
});
