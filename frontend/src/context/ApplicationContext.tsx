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
  getApplicationById: (id: string) => Promise<void>;
  createApplication: (data: ApplicationFormData) => Promise<void>;
  cancelApplication: (id: string) => Promise<void>;
  disburseFunds: (data: DisbursementFormData) => Promise<void>;
  repayFunds: (data: RepaymentFormData) => Promise<void>;
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
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await applicationApi.getAllApplications();
      setApplications(data);
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getApplicationById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await applicationApi.getApplicationById(id);
      setSelectedApplication(data);
    } catch (err) {
      setError('Failed to fetch application details');
      console.error('Error fetching application details:', err);
    } finally {
      setLoading(false);
    }
  };

  const createApplication = async (data: ApplicationFormData) => {
    try {
      setLoading(true);
      setError(null);
      const newApplication = await applicationApi.createApplication(data);
      setApplications((prev) => [...prev, newApplication]);
    } catch (err) {
      setError('Failed to create application');
      console.error('Error creating application:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelApplication = async (id: string) => {
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
    } catch (err) {
      setError('Failed to cancel application');
      console.error('Error canceling application:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disburseFunds = async (data: DisbursementFormData) => {
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
    } catch (err) {
      setError('Failed to disburse funds');
      console.error('Error disbursing funds:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const repayFunds = async (data: RepaymentFormData) => {
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
    } catch (err) {
      setError('Failed to repay funds');
      console.error('Error repaying funds:', err);
      throw err;
    } finally {
      setLoading(false);
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