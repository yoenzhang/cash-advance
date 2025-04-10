import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { Link, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/app/context/AuthContext';
import { appColors } from '@/constants/appColors';

const GlobalHeader: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    // Navigate to login screen after logout
    router.replace('/login'); // Use replace to prevent going back to authenticated state
  };

  // Function to check if a link is active
  const isActive = (path: string) => {
    // Check if the current pathname starts with the link's path
    // This handles nested routes within tabs (e.g., /applications/details)
    return pathname.startsWith(path);
  };

  // Don't render the header if not authenticated
  if (!isAuthenticated) {
      return null;
  }

  return (
    // Use SafeAreaView to avoid notches/status bars
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          {/* Link logo back to dashboard */}
          <Link href="/dashboard">
              <Text style={styles.logoText}>Cash Advance</Text>
          </Link>
        </View>

        <View style={styles.navigationContainer}>
           {/* Navigation Links - Use Pressable for better styling control */}
            <Link href="/dashboard" asChild>
                <Pressable style={StyleSheet.flatten([
                    styles.navLink,
                    isActive('/dashboard') && styles.navLinkActive
                ])}>
                    <Text style={StyleSheet.flatten([
                        styles.navLinkText,
                        isActive('/dashboard') && styles.navLinkTextActive
                    ])}>Dashboard</Text>
                </Pressable>
            </Link>
             <Link href="/applications" asChild>
                 <Pressable style={StyleSheet.flatten([
                     styles.navLink,
                     isActive('/applications') && styles.navLinkActive
                 ])}>
                     <Text style={StyleSheet.flatten([
                         styles.navLinkText,
                         isActive('/applications') && styles.navLinkTextActive
                     ])}>Applications</Text>
                 </Pressable>
             </Link>
              <Link href="/insights" asChild>
                  <Pressable style={StyleSheet.flatten([
                      styles.navLink,
                      isActive('/insights') && styles.navLinkActive
                  ])}>
                      <Text style={StyleSheet.flatten([
                          styles.navLinkText,
                          isActive('/insights') && styles.navLinkTextActive
                      ])}>Insights</Text>
                  </Pressable>
              </Link>
               <Link href="/settings" asChild>
                   <Pressable style={StyleSheet.flatten([
                       styles.navLink,
                       isActive('/settings') && styles.navLinkActive
                   ])}>
                       <Text style={StyleSheet.flatten([
                           styles.navLinkText,
                           isActive('/settings') && styles.navLinkTextActive
                       ])}>Settings</Text>
                   </Pressable>
               </Link>

            <Pressable onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: appColors.dark, // Dark background for the header area
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    // Add bottom border if desired
    // borderBottomWidth: 1,
    // borderBottomColor: appColors.border,
    minHeight: Platform.OS === 'ios' ? 44 : 56, // Standard header height
  },
  logoContainer: {
    // Takes up remaining space if needed, or adjust flex properties
  },
  logoText: {
    color: appColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Adjust spacing as needed
    // gap: 10, // Use gap if supported, otherwise margin
  },
  navLink: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginHorizontal: 5, // Add spacing between links
      borderRadius: 4,
  },
  navLinkActive: {
      backgroundColor: appColors.primary, // Highlight active link
  },
  navLinkText: {
      color: appColors.lightGray,
      fontSize: 14,
  },
  navLinkTextActive: {
      color: appColors.white,
      fontWeight: '600',
  },
  logoutButton: {
      marginLeft: 15, // Space before logout button
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: appColors.danger,
      borderRadius: 4,
  },
  logoutButtonText: {
      color: appColors.white,
      fontSize: 14,
      fontWeight: '600',
  },
});

export default GlobalHeader; 