import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApplicationStatus } from '@/app/types/application';
import { appColors } from '@/constants/appColors';

interface StatusBadgeProps {
    status: ApplicationStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    // Determine the specific styles based on status
    let specificBadgeStyle = {};
    let specificTextStyle = {};

    switch (status) {
        case ApplicationStatus.PENDING:   specificBadgeStyle = styles.badgePending; specificTextStyle = styles.badgeTextPending; break;
        case ApplicationStatus.APPROVED:  specificBadgeStyle = styles.badgeApproved; specificTextStyle = styles.badgeTextApproved; break;
        case ApplicationStatus.REJECTED:  specificBadgeStyle = styles.badgeRejected; specificTextStyle = styles.badgeTextRejected; break;
        case ApplicationStatus.DISBURSED: specificBadgeStyle = styles.badgeDisbursed; specificTextStyle = styles.badgeTextDisbursed; break;
        case ApplicationStatus.REPAID:    specificBadgeStyle = styles.badgeRepaid; specificTextStyle = styles.badgeTextRepaid; break;
        case ApplicationStatus.CANCELLED: specificBadgeStyle = styles.badgeCancelled; specificTextStyle = styles.badgeTextCancelled; break;
    }

    return (
        <View style={[styles.badgeBase, specificBadgeStyle]}> 
            <Text style={[styles.badgeTextBase, specificTextStyle]}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
  badgeBase: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start', 
  },
  badgeTextBase: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  // Specific Badge Colors (Background and Text)
  badgePending:   { backgroundColor: '#FFF3E0' }, // Light Orange
  badgeTextPending: { color: '#F57C00' },      // Orange
  badgeApproved:  { backgroundColor: '#E8F5E9' }, // Light Green
  badgeTextApproved:{ color: '#388E3C' },      // Green
  badgeRejected:  { backgroundColor: '#FFEBEE' }, // Light Red
  badgeTextRejected:{ color: '#D32F2F' },      // Red
  badgeDisbursed: { backgroundColor: '#E3F2FD' }, // Light Blue
  badgeTextDisbursed:{ color: '#1976D2' },      // Blue
  badgeRepaid:    { backgroundColor: '#E8F5E9' }, // Light Green (same as approved)
  badgeTextRepaid:  { color: '#388E3C' },      // Green
  badgeCancelled: { backgroundColor: '#F5F5F5' }, // Light Gray
  badgeTextCancelled:{ color: '#757575' },      // Gray
});

export default StatusBadge; // Optional: export default if preferred 