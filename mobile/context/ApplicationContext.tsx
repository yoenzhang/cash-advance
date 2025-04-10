import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import {
  CashAdvanceApplication,
  ApplicationStatus,
  DisbursementFormData, // Import form data types
  RepaymentFormData,
  ApplicationFormData // Import type for creation
} from '@/types/application';
import { useAuth } from './AuthContext';

interface ApplicationContextType {
  applications: CashAdvanceApplication[];
  selectedApplication: CashAdvanceApplication | null; // Add state for selected app
  loading: boolean;
  actionLoading: boolean; // Add state for action loading (disburse, repay, etc.)
  error: string | null; // Add error state for fetch/actions
  fetchApplications: () => Promise<void>;
  getApplicationById: (id: string) => Promise<void>; // Add function to get by ID
  cancelApplication: (id: string) => Promise<void>; // Placeholder for cancel
  disburseFunds: (data: DisbursementFormData) => Promise<void>; // Placeholder for disburse
  repayFunds: (data: RepaymentFormData) => Promise<void>; // Placeholder for repay
  createApplication: (data: ApplicationFormData) => Promise<void>; // Add create function
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

// Keep simulation data generator for initial list load
const generateSimulatedApplications = (): CashAdvanceApplication[] => {
  const statuses = Object.values(ApplicationStatus);
  const now = Date.now();
  return Array.from({ length: 8 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = new Date(now - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    let disbursementDate: string | undefined;
    let repaymentDate: string | undefined;
    let repaymentAmount: number | undefined;
    let remainingAmount: number | undefined;
    const amount = Math.floor(Math.random() * 901) + 100; 

    if (status === ApplicationStatus.DISBURSED || status === ApplicationStatus.REPAID) {
      disbursementDate = new Date(createdAt.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000).toISOString();
      remainingAmount = amount; // Simplified: assume full amount remaining initially
    }
    if (status === ApplicationStatus.REPAID) {
      repaymentDate = new Date(new Date(disbursementDate!).getTime() + Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000).toISOString();
      repaymentAmount = amount; // Simplified: assume full amount repaid
      remainingAmount = 0;
    }

    return {
      id: `app-${i + 1}`,
      amount: amount,
      status: status,
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.floor(Math.random() * 5) * 60 * 60 * 1000).toISOString(),
      disbursementDate,
      repaymentDate,
      repaymentAmount,
      remainingAmount,
      creditLimit: 5000, // Example fixed limit
      expressDelivery: Math.random() > 0.8, // Randomly add express
      tip: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0, // Random tip
    };
  });
};

export const ApplicationProvider = ({ children }: { children: ReactNode }) => {
  const [applications, setApplications] = useState<CashAdvanceApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CashAdvanceApplication | null>(null);
  const [loading, setLoading] = useState(false); // Loading for list/details fetch
  const [actionLoading, setActionLoading] = useState(false); // Loading for specific actions
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // --- Fetching Logic ---
  const fetchApplications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    console.log("Fetching applications...");
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const simulatedData = generateSimulatedApplications();
      setApplications(simulatedData);
      console.log("Applications fetched.");
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError('Failed to load applications.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getApplicationById = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    setLoading(true); // Use main loading indicator for fetching detail
    setError(null);
    setSelectedApplication(null); // Clear previous selection
    console.log(`Fetching application by ID: ${id}...`);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Simulate finding the application from the already fetched list or a separate API call
      const foundApp = applications.find(app => app.id === id) || 
                       generateSimulatedApplications().find(app => app.id === id); // Fallback simulation
      if (foundApp) {
         // Simulate adding more details if needed for the details view
         const detailedApp = { 
             ...foundApp, 
             creditLimit: foundApp.creditLimit || 5000, // Ensure credit limit exists
             remainingAmount: foundApp.status === ApplicationStatus.DISBURSED ? 
                              foundApp.amount - (foundApp.repaymentAmount || 0) : 
                              (foundApp.status === ApplicationStatus.REPAID ? 0 : undefined),
         };
        setSelectedApplication(detailedApp);
      } else {
        setError(`Application with ID ${id} not found.`);
      }
    } catch (err) {
      console.error(`Failed to fetch application ${id}:`, err);
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, applications]); // Depend on applications list

  // Fetch list initially when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    } else {
      setApplications([]); // Clear list on logout
      setSelectedApplication(null); // Clear selection on logout
    }
  }, [isAuthenticated, fetchApplications]);

  // --- Action Logic (Placeholders) ---
  const performAction = async <T,>(action: () => Promise<T>, errorMessage: string): Promise<T | null> => {
    setActionLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
      const result = await action();
      return result;
    } catch (err) {
      console.error(errorMessage, err);
      setError(errorMessage);
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  const cancelApplication = async (id: string) => {
    await performAction(async () => {
      console.log(`Simulating cancel application ${id}`);
      // Update local state to reflect cancellation
      setSelectedApplication(prev => prev && prev.id === id ? { ...prev, status: ApplicationStatus.CANCELLED } : prev);
      setApplications(prevApps => 
          prevApps.map(app => app.id === id ? { ...app, status: ApplicationStatus.CANCELLED } : app)
      );
    }, 'Failed to cancel application');
  };

  const disburseFunds = async (data: DisbursementFormData) => {
    await performAction(async () => {
      console.log(`Simulating disburse funds for ${data.applicationId}`, data);
      setSelectedApplication(prev => 
          prev && prev.id === data.applicationId ? { 
              ...prev, 
              status: ApplicationStatus.DISBURSED, 
              disbursementDate: new Date().toISOString(),
              expressDelivery: data.expressDelivery,
              tip: data.tip,
              remainingAmount: prev.amount, // Assume full amount remaining initially
          } : prev
      );
      setApplications(prevApps => 
        prevApps.map(app => app.id === data.applicationId ? { 
            ...app, 
            status: ApplicationStatus.DISBURSED, 
            disbursementDate: new Date().toISOString(),
            expressDelivery: data.expressDelivery,
            tip: data.tip,
            remainingAmount: app.amount, 
        } : app)
      );
    }, 'Failed to disburse funds');
  };

  const repayFunds = async (data: RepaymentFormData) => {
    await performAction(async () => {
      console.log(`Simulating repay funds for ${data.applicationId}`, data);
      // Simulate full repayment for simplicity
      setSelectedApplication(prev => 
          prev && prev.id === data.applicationId ? { 
              ...prev, 
              status: ApplicationStatus.REPAID, 
              repaymentDate: new Date().toISOString(),
              repaymentAmount: (prev.repaymentAmount || 0) + data.amount, // Accumulate repayment
              remainingAmount: Math.max(0, (prev.remainingAmount || prev.amount) - data.amount),
          } : prev
      );
       setApplications(prevApps => 
        prevApps.map(app => app.id === data.applicationId ? { 
            ...app, 
            status: ApplicationStatus.REPAID, 
            repaymentDate: new Date().toISOString(),
            repaymentAmount: (app.repaymentAmount || 0) + data.amount,
            remainingAmount: Math.max(0, (app.remainingAmount || app.amount) - data.amount),
        } : app)
      );
    }, 'Failed to repay funds');
  };

  // Placeholder for creating a new application
  const createApplication = async (data: ApplicationFormData) => {
    await performAction(async () => {
        console.log("Simulating create application", data);
        const newApp: CashAdvanceApplication = {
            id: `app-${Date.now()}`, // Simple unique ID
            ...data,
            status: ApplicationStatus.PENDING, // Initial status
            createdAt: new Date().toISOString(),
        };
        // Add the new application to the beginning of the list
        setApplications(prevApps => [newApp, ...prevApps]);
    }, 'Failed to create application');
  };

  return (
    <ApplicationContext.Provider value={{
      applications,
      selectedApplication,
      loading,
      actionLoading,
      error,
      fetchApplications,
      getApplicationById,
      cancelApplication,
      disburseFunds,
      repayFunds,
      createApplication, // Provide create function
    }}>
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = (): ApplicationContextType => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
}; 