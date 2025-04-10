import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router'; // Corrected useRouter import
import { useAuth } from '@/app/context/AuthContext'; // Corrected context path
import { useApplication } from '@/app/context/ApplicationContext';
import { ApplicationStatus, CashAdvanceApplication } from '@/app/types/application';
import { appColors } from '@/constants/appColors'; // Use correct alias path

// Helper function (keep or move to utils)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const DashboardScreen = () => { // Remove navigation prop
  const { user } = useAuth();
  const { applications, loading: appLoading } = useApplication();
  const router = useRouter(); // Get router instance

  // Data calculations remain the same...
   const getApplicationCountByStatus = (status: ApplicationStatus) => {
    return applications.filter(app => app.status === status).length;
  };

  const getTotalOutstandingAmount = () => {
    return applications
      .filter(app => app.status === ApplicationStatus.DISBURSED)
      .reduce((total, app) => total + app.amount, 0);
  };

  const getTotalRepaidAmount = () => {
    return applications
      .filter(app => app.status === ApplicationStatus.REPAID)
      .reduce((total, app) => total + app.amount, 0);
  };

  const cashBalance = getTotalRepaidAmount() - getTotalOutstandingAmount();
  const outstandingAmount = getTotalOutstandingAmount();
  const creditLimit = 5000;
  const availableCredit = creditLimit - outstandingAmount;

  // --- Event Handlers using useRouter ---
  const handleViewApplications = () => {
    router.push('/(tabs)/applications'); // Navigate to applications tab
  };

  const handleNewApplication = () => {
    // Decide where this goes - maybe a modal or a dedicated screen?
    // For now, let's assume a screen within the tabs stack
    router.push('/(tabs)/apply'); // Navigate to apply screen/tab
  };

  const handleViewInsights = () => {
    router.push('/(tabs)/insights'); // Navigate to insights tab
  }

  // Render functions remain the same...
   const renderOverviewCard = (icon: string, title: string, amount: number, trendText: string, trendType: 'positive' | 'negative' | 'neutral') => {
    const trendTextStyle = styles[`trend_text_${trendType}`];
    const trendIconStyle = styles[`trend_icon_${trendType}`];
    return (
        <View style={styles.overviewCard}>
          <View style={styles.overviewIconContainer}>
              <Text style={styles.overviewIcon}>{icon}</Text>
          </View>
          <View style={styles.overviewDetails}>
            <Text style={styles.overviewTitle}>{title}</Text>
            <Text style={styles.overviewAmount}>{formatCurrency(amount)}</Text>
            <View style={styles.overviewTrend}>
                <Text style={[styles.trendIcon, trendIconStyle]}>
                    {trendType === 'positive' ? '↗' : trendType === 'negative' ? '↘' : '→'}
                </Text>
                <Text style={trendTextStyle}>{trendText}</Text>
            </View>
          </View>
        </View>
      );
  }

  const renderStatusItem = (status: ApplicationStatus, label: string) => (
      <View style={styles.statusItem} key={status}>
        <Text style={styles.statusCount}>{getApplicationCountByStatus(status)}</Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
  );

  const renderActivityItem = (app: CashAdvanceApplication) => {
      let icon = '⏳';
      let titleAction = 'Pending';
      switch (app.status) {
          case ApplicationStatus.APPROVED: icon = '✅'; titleAction = 'Approved'; break;
          case ApplicationStatus.DISBURSED: icon = '💵'; titleAction = 'Disbursed'; break;
          case ApplicationStatus.REPAID: icon = '✓'; titleAction = 'Repaid'; break;
          case ApplicationStatus.REJECTED: icon = '❌'; titleAction = 'Rejected'; break;
          case ApplicationStatus.CANCELLED: icon = '🚫'; titleAction = 'Cancelled'; break;
      }
      return (
          <View style={styles.activityItem} key={app.id}>
            <Text style={styles.activityIcon}>{icon}</Text>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Cash Advance {titleAction}</Text>
              <Text style={styles.activityAmount}>{formatCurrency(app.amount)}</Text>
            </View>
             <Text style={styles.activityDate}>
                {new Date(app.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })}
            </Text>
          </View>
      );
  }

  // Main return remains largely the same...
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, {user?.firstName || 'User'}!</Text>
          <Text style={styles.welcomeSubtitle}>Your financial dashboard at a glance</Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          {renderOverviewCard('💰', 'Cash Balance', cashBalance, '12% from last month', 'positive')}
          {renderOverviewCard('⚖️', 'Outstanding', outstandingAmount, '5% from last month', 'negative')}
          {renderOverviewCard('📈', 'Available Credit', availableCredit, 'No change', 'neutral')}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleNewApplication}>
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>+ Apply for Cash Advance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={handleViewApplications}>
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>📋 View Applications</Text>
          </TouchableOpacity>
        </View>

        {/* Application Summary & Recent Activity */}
        <View style={styles.gridSection}>
            {/* Application Summary Card */}
            <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.cardTitle}>Application Summary</Text>
                {appLoading ? (
                    <ActivityIndicator size="large" color={appColors.primary} style={styles.loadingIndicator}/>
                ) : (
                <>
                    <View style={styles.summaryOverview}>
                        <View style={styles.summaryTotal}>
                            <Text style={styles.summaryTotalNumber}>{applications.length}</Text>
                            <Text style={styles.summaryTotalLabel}>Total Applications</Text>
                        </View>
                        <View style={styles.summaryStatusGrid}>
                            {renderStatusItem(ApplicationStatus.PENDING, 'Pending')}
                            {renderStatusItem(ApplicationStatus.APPROVED, 'Approved')}
                            {renderStatusItem(ApplicationStatus.DISBURSED, 'Outstanding')}
                            {renderStatusItem(ApplicationStatus.REPAID, 'Repaid')}
                            {renderStatusItem(ApplicationStatus.CANCELLED, 'Cancelled')}
                            {renderStatusItem(ApplicationStatus.REJECTED, 'Rejected')}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline, styles.buttonSmall, styles.viewAllButton]}
                        onPress={handleViewApplications}
                    >
                        <Text style={[styles.buttonText, styles.buttonTextOutline, styles.buttonTextSmall]}>View All Applications</Text>
                    </TouchableOpacity>
                </>
                )}
            </View>

            {/* Recent Activity Card */}
            <View style={[styles.card, styles.activityCard]}>
                <Text style={styles.cardTitle}>Recent Activity</Text>
                {appLoading ? (
                     <ActivityIndicator size="small" color={appColors.primary} style={styles.loadingIndicator} />
                 ) : applications.length > 0 ? (
                    <View style={styles.activityList}>
                        {applications.slice(0, 3).map(renderActivityItem)}
                    </View>
                ) : (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No recent activities to display.</Text>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonPrimary, styles.buttonSmall]}
                            onPress={handleNewApplication}
                        >
                            <Text style={[styles.buttonText, styles.buttonTextPrimary, styles.buttonTextSmall]}>Apply for your first cash advance</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>

         {/* Insights Teaser */}
         <TouchableOpacity style={[styles.card, styles.insightsTeaser]} onPress={handleViewInsights}>
            <View style={styles.insightsContent}>
                <Text style={styles.insightsTitle}>Dive Deeper Into Your Finances</Text>
                <Text style={styles.insightsText}>View detailed insights about your spending patterns and repayment history.</Text>
                 <View style={[styles.button, styles.buttonPrimary, styles.buttonSmall, { alignSelf: 'flex-start'}]}>
                    <Text style={[styles.buttonText, styles.buttonTextPrimary, styles.buttonTextSmall]}>View Insights</Text>
                </View>
            </View>
            <Text style={styles.insightsEmoji}>📊</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain the same...
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.lightGray,
  },
  container: {
    flex: 1,
  },
   contentContainer: {
     padding: 15,
   },
  welcomeSection: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: appColors.dark,
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: appColors.gray,
  },
  overviewSection: {
    marginBottom: 20,
    flexDirection: Dimensions.get('window').width > 700 ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 15,
  },
  overviewCard: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minWidth: Dimensions.get('window').width > 700 ? 150 : undefined,
  },
  overviewIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
  },
  overviewIcon: {
    fontSize: 24,
  },
  overviewDetails: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 14,
    color: appColors.gray,
    marginBottom: 5,
  },
  overviewAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appColors.dark,
    marginBottom: 3,
  },
  overviewTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendIcon: {
      fontWeight: 'bold',
      fontSize: 12,
  },
  trend_text_positive: { color: appColors.secondary, fontSize: 12 },
  trend_icon_positive: { color: appColors.secondary },
  trend_text_negative: { color: appColors.danger, fontSize: 12 },
  trend_icon_negative: { color: appColors.danger },
  trend_text_neutral: { color: appColors.gray, fontSize: 12 },
  trend_icon_neutral: { color: appColors.gray },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: appColors.primary,
  },
  buttonOutline: {
    backgroundColor: appColors.white,
    borderWidth: 1,
    borderColor: appColors.primary,
  },
   buttonSmall: {
       paddingVertical: 8,
       paddingHorizontal: 15,
   },
   buttonText: {
       fontSize: 16,
       fontWeight: '500',
   },
   buttonTextSmall: {
       fontSize: 14,
   },
  buttonTextPrimary: {
    color: appColors.white,
  },
  buttonTextOutline: {
    color: appColors.primary,
  },
  gridSection: {
    flexDirection: Dimensions.get('window').width > 800 ? 'row' : 'column',
    gap: 15,
    marginBottom: 20,
  },
  card: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColors.dark,
    marginBottom: 15,
  },
  summaryCard: {},
  activityCard: {},
  loadingIndicator: {
      marginTop: 20,
      marginBottom: 20,
  },
  summaryOverview: {
      flexDirection: 'row',
      marginBottom: 15,
      alignItems: 'flex-start'
  },
  summaryTotal: {
      alignItems: 'center',
      marginRight: 20,
      paddingRight: 20,
      borderRightWidth: 1,
      borderRightColor: appColors.lightGray,
  },
  summaryTotalNumber: {
      fontSize: 30,
      fontWeight: 'bold',
      color: appColors.primary,
  },
  summaryTotalLabel: {
      fontSize: 14,
      color: appColors.gray,
      marginTop: 2,
  },
  summaryStatusGrid: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
  },
  statusItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 10,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColors.dark,
  },
  statusLabel: {
    fontSize: 12,
    color: appColors.gray,
    marginTop: 2,
    textAlign: 'center'
  },
  viewAllButton: {
      marginTop: 10,
      alignSelf: 'center',
      flex: 0
  },
  activityList: {
      gap: 15,
  },
  activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: appColors.lightGray,
  },
   activityIcon: {
       fontSize: 18,
       width: 30,
       textAlign: 'center',
   },
   activityDetails: {
       flex: 1,
   },
   activityTitle: {
       fontSize: 14,
       fontWeight: '500',
       color: appColors.dark,
       marginBottom: 2,
   },
   activityAmount: {
       fontSize: 14,
       color: appColors.gray,
   },
   activityDate: {
       fontSize: 12,
       color: appColors.gray,
       marginLeft: 'auto',
   },
   emptyStateContainer: {
       alignItems: 'center',
       paddingVertical: 20,
   },
   emptyStateText: {
       color: appColors.gray,
       marginBottom: 15,
       fontSize: 14,
   },
   insightsTeaser: {
       flexDirection: 'row',
       alignItems: 'center',
       backgroundColor: appColors.primary,
       padding: 20,
       gap: 15,
   },
   insightsContent: {
       flex: 1,
   },
   insightsTitle: {
       fontSize: 18,
       fontWeight: 'bold',
       color: appColors.white,
       marginBottom: 5,
   },
   insightsText: {
       fontSize: 14,
       color: 'rgba(255, 255, 255, 0.9)',
       marginBottom: 15,
   },
   insightsEmoji: {
       fontSize: 40,
   },
});

export default DashboardScreen; 