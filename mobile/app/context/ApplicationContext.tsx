import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { applicationApi } from '../services/api';
import { CashAdvanceApplication, ApplicationFormData, DisbursementFormData, RepaymentFormData, ApplicationStatus } from '../types/application';
import { useAuth } from './AuthContext';

interface ApplicationContextType {
  applications: CashAdvanceApplication[];
  loading: boolean;
  error: string | null;
  selectedApplication: CashAdvanceApplication | null;
  fetchApplications: () => Promise<void>;
  getApplicationById: (id: string) => Promise<CashAdvanceApplication | null>; // Return null if not found or error
  createApplication: (data: ApplicationFormData) => Promise<CashAdvanceApplication | null>; // Return null on error
  cancelApplication: (id: string) => Promise<CashAdvanceApplication | null>; // Return null on error
  disburseFunds: (data: DisbursementFormData) => Promise<CashAdvanceApplication | null>; // Return null on error
  repayFunds: (data: RepaymentFormData) => Promise<CashAdvanceApplication | null>; // Return null on error
  clearError: () => void;
  clearSelectedApplication: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error('useApplication must be used within an ApplicationProvider');
  }
  return context;
};

interface ApplicationProviderProps {
  children: ReactNode;
}

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({ children }) => {
  const [applications, setApplications] = useState<CashAdvanceApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<CashAdvanceApplication | null>(null);
  const { user } = useAuth();

  // Fetch applications when user is authenticated
  useEffect(() => {
    if (user) {
      fetchApplications();
    }
    // Clear applications if user logs out
    if (!user) {
        setApplications([]);
        setSelectedApplication(null);
    }
  }, [user]);

  const handleError = (err: any, defaultMessage: string) => {
    const message = err.response?.data?.message || err.message || defaultMessage;
    setError(message);
    console.error(`${defaultMessage}:`, err);
    setLoading(false);
  };

  const fetchApplications = async () => {
    if (!user) return; // Don't fetch if not logged in
    try {
      setLoading(true);
      setError(null);
      const data = await applicationApi.getAllApplications();
      setApplications(data || []); // Ensure data is an array
    } catch (err) {
      handleError(err, 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getApplicationById = async (id: string): Promise<CashAdvanceApplication | null> => {
    if (!user) return null;
    try {
      setLoading(true);
      setError(null);
      const data = await applicationApi.getApplicationById(id);
      setSelectedApplication(data);
      setLoading(false);
      return data;
    } catch (err) {
      handleError(err, 'Failed to fetch application details');
      setSelectedApplication(null);
      return null;
    }
  };

  const createApplication = async (data: ApplicationFormData): Promise<CashAdvanceApplication | null> => {
    if (!user) return null;
    try {
      setLoading(true);
      setError(null);
      const newApplication = await applicationApi.createApplication(data);
      setApplications((prev) => [...prev, newApplication]);
      setLoading(false);
      return newApplication;
    } catch (err) {
      handleError(err, 'Failed to create application');
      throw err; // Re-throw to allow handling in the component
      // return null;
    }
  };

  const cancelApplication = async (id: string): Promise<CashAdvanceApplication | null> => {
    if (!user) return null;
    try {
      setLoading(true);
      setError(null);
      const updatedApplication = await applicationApi.cancelApplication(id);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? updatedApplication : app))
      );
      if (selectedApplication?.id === id) {
        setSelectedApplication(updatedApplication);
      }
      setLoading(false);
      return updatedApplication;
    } catch (err) {
      handleError(err, 'Failed to cancel application');
      throw err; // Re-throw
      // return null;
    }
  };

  const disburseFunds = async (data: DisbursementFormData): Promise<CashAdvanceApplication | null> => {
    if (!user) return null;
    try {
      setLoading(true);
      setError(null);
      const updatedApplication = await applicationApi.disburseFunds(data);
      setApplications((prev) =>
        prev.map((app) => (app.id === data.applicationId ? updatedApplication : app))
      );
      if (selectedApplication?.id === data.applicationId) {
        setSelectedApplication(updatedApplication);
      }
      setLoading(false);
      return updatedApplication;
    } catch (err) {
      handleError(err, 'Failed to disburse funds');
      throw err; // Re-throw
      // return null;
    }
  };

  const repayFunds = async (data: RepaymentFormData): Promise<CashAdvanceApplication | null> => {
    if (!user) return null;
    try {
      setLoading(true);
      setError(null);
      const updatedApplication = await applicationApi.repayFunds(data);
      setApplications((prev) =>
        prev.map((app) => (app.id === data.applicationId ? updatedApplication : app))
      );
      if (selectedApplication?.id === data.applicationId) {
        setSelectedApplication(updatedApplication);
      }
      setLoading(false);
      return updatedApplication;
    } catch (err) {
      handleError(err, 'Failed to repay funds');
      throw err; // Re-throw
      // return null;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearSelectedApplication = () => {
    setSelectedApplication(null);
  };

  const value = {
    applications,
    loading,
    error,
    selectedApplication,
    fetchApplications,
    getApplicationById,
    createApplication,
    cancelApplication,
    disburseFunds,
    repayFunds,
    clearError,
    clearSelectedApplication,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}; 