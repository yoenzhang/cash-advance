import React, { useMemo } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useApplication } from '@/context/ApplicationContext';
import { ApplicationStatus, CashAdvanceApplication } from '@/types/application';
import { Link, useRouter } from 'expo-router';

// --- Helper Functions (Consider moving to utils file) ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Consider making this dynamic if needed
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// --- Dashboard Component ---

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { applications, loading } = useApplication();
  const router = useRouter();

  // Memoize calculations to avoid re-computing on every render
  const summaryData = useMemo(() => {
    const getCount = (status: ApplicationStatus) =>
      applications.filter((app) => app.status === status).length;

    const outstandingApps = applications.filter(
      (app) => app.status === ApplicationStatus.DISBURSED
    );
    const repaidApps = applications.filter(
      (app) => app.status === ApplicationStatus.REPAID
    );

    const totalOutstanding = outstandingApps.reduce((sum, app) => sum + app.amount, 0);
    const totalRepaid = repaidApps.reduce((sum, app) => sum + app.amount, 0);
    // Assuming a fixed credit limit for simplicity, fetch from user/config later
    const creditLimit = 5000; 

    return {
      pendingCount: getCount(ApplicationStatus.PENDING),
      approvedCount: getCount(ApplicationStatus.APPROVED),
      disbursedCount: outstandingApps.length,
      repaidCount: repaidApps.length,
      cancelledCount: getCount(ApplicationStatus.CANCELLED),
      rejectedCount: getCount(ApplicationStatus.REJECTED),
      totalOutstanding,
      totalRepaid,
      cashBalance: totalRepaid - totalOutstanding,
      availableCredit: creditLimit - totalOutstanding,
      totalApplications: applications.length,
      recentApplications: applications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    };
  }, [applications]);

  const handleNavigation = (path: string) => {
    router.push(path as any); // Using `as any` to bypass potential typed route issues
  };

  const getStatusIcon = (status: ApplicationStatus) => {
      switch (status) {
          case ApplicationStatus.APPROVED: return '✅';
          case ApplicationStatus.DISBURSED: return '💵';
          case ApplicationStatus.REPAID: return '✓';
          case ApplicationStatus.REJECTED: return '❌';
          case ApplicationStatus.PENDING: return '⏳';
          case ApplicationStatus.CANCELLED: return '🚫';
          default: return '❓';
      }
  };

  const getStatusText = (status: ApplicationStatus) => {
      // Simple mapping, can be expanded
      return status.charAt(0) + status.slice(1).toLowerCase();
  };

  if (loading) {
    // Show a loading indicator centered on the screen
    return (
      <View style={styles.centered}> 
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.pageContainer}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome, {user?.firstName || 'User'}!</Text>
        <Text style={styles.welcomeSubtitle}>Your financial dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Cash Balance</Text>
          <Text style={styles.overviewAmount}>{formatCurrency(summaryData.cashBalance)}</Text>
          {/* Trend indicators can be added later */}
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Outstanding</Text>
          <Text style={styles.overviewAmount}>{formatCurrency(summaryData.totalOutstanding)}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Available Credit</Text>
          <Text style={styles.overviewAmount}>{formatCurrency(summaryData.availableCredit)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => handleNavigation('/(app)/applications/new')}>
          <Text style={styles.actionButtonTextPrimary}>+ Apply for Cash Advance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonOutline} onPress={() => handleNavigation('/(app)/applications')}>
          <Text style={styles.actionButtonTextOutline}>📋 View Applications</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Grid */}
      <View style={styles.gridContainer}>
        {/* Application Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Application Summary</Text>
          <View style={styles.summaryOverview}>
            <Text style={styles.summaryTotal}>{summaryData.totalApplications} Total</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}><Text style={styles.statusCount}>{summaryData.pendingCount}</Text><Text style={styles.statusLabel}>Pending</Text></View>
              <View style={styles.statusItem}><Text style={styles.statusCount}>{summaryData.approvedCount}</Text><Text style={styles.statusLabel}>Approved</Text></View>
              <View style={styles.statusItem}><Text style={styles.statusCount}>{summaryData.disbursedCount}</Text><Text style={styles.statusLabel}>Outstanding</Text></View>
              <View style={styles.statusItem}><Text style={styles.statusCount}>{summaryData.repaidCount}</Text><Text style={styles.statusLabel}>Repaid</Text></View>
              <View style={styles.statusItem}><Text style={styles.statusCount}>{summaryData.cancelledCount}</Text><Text style={styles.statusLabel}>Cancelled</Text></View>
              <View style={styles.statusItem}><Text style={styles.statusCount}>{summaryData.rejectedCount}</Text><Text style={styles.statusLabel}>Rejected</Text></View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewAllButton} onPress={() => handleNavigation('/(app)/applications')}>
            <Text style={styles.viewAllButtonText}>View All Applications</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {summaryData.recentApplications.length > 0 ? (
            <View style={styles.activityList}>
              {summaryData.recentApplications.map((app) => (
                <View style={styles.activityItem} key={app.id}>
                  <Text style={styles.activityIcon}>{getStatusIcon(app.status)}</Text>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityTitle}>Cash Advance {getStatusText(app.status)}</Text>
                    <Text style={styles.activityAmount}>{formatCurrency(app.amount)}</Text>
                  </View>
                  <Text style={styles.activityDate}>{formatDate(app.createdAt)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text>No recent activities.</Text>
              <TouchableOpacity style={[styles.actionButtonPrimary, {marginTop: 15}]} onPress={() => handleNavigation('/(app)/applications/new')}>
                 <Text style={styles.actionButtonTextPrimary}>Apply for first advance</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Insights Teaser */}
      <View style={styles.insightsTeaserCard}>
         <Text style={styles.insightsIcon}>📊</Text>
         <View style={styles.insightsContent}>
             <Text style={styles.insightsTitle}>Dive Deeper Into Your Finances</Text>
             <Text style={styles.insightsText}>View detailed insights and trends.</Text>
             <TouchableOpacity style={styles.insightsButton} onPress={() => handleNavigation('/(app)/insights')}>
                 <Text style={styles.insightsButtonText}>View Insights</Text>
             </TouchableOpacity>
         </View>
      </View>

    </ScrollView>
  );
}

// --- Styles (Consider moving to separate files or a theme) ---

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: { // For loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  // Welcome Section
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff', // White background for header section
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 8,
  },
  logoutButtonText: {
      color: '#007bff',
      fontSize: 14,
      fontWeight: '500',
  },
  // Overview Cards
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center', // Center content
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  overviewAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginVertical: 15,
    gap: 15,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionButtonOutline: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  actionButtonTextOutline: {
    color: '#007bff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Grid & Cards
  gridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  // Application Summary Card
  summaryOverview: {
    // Add styles if needed, maybe flexDirection row
  },
  summaryTotal: {
      fontSize: 16,
      fontWeight: '600',
      color: '#555',
      marginBottom: 15,
      textAlign: 'center'
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statusItem: {
    width: '30%', // Adjust for 3 columns
    alignItems: 'center',
    marginBottom: 15,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  viewAllButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 20,
  },
  viewAllButtonText: {
    color: '#007bff',
    fontSize: 13,
    fontWeight: '500',
  },
  // Recent Activity Card
  activityList: {
    // Styles for the list container
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  activityAmount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
  },
  // Insights Teaser Card
  insightsTeaserCard: {
    backgroundColor: '#e7f3ff', // Light blue background
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsIcon: {
      fontSize: 40,
      marginRight: 20,
  },
  insightsContent: {
      flex: 1,
  },
  insightsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0056b3',
      marginBottom: 5,
  },
  insightsText: {
      fontSize: 14,
      color: '#0056b3',
      marginBottom: 10,
  },
  insightsButton: {
      backgroundColor: '#007bff',
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      alignSelf: 'flex-start',
  },
  insightsButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
  },
}); 