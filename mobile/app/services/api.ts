import axios, { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CashAdvanceApplication, ApplicationFormData, DisbursementFormData, RepaymentFormData } from '../types/application';
// Removed problematic import: import { SpendingData, RepaymentData, CategoryData } from '../app/(tabs)/insights';

// TODO: Replace with your actual backend URL or environment variable
const API_URL = 'http://localhost:3000/api'; // Ensure this points to your backend

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: Error) => {
    return Promise.reject(error);
  }
);

// Interface for the expected response from the insights endpoint
interface InsightsDataResponse {
  spending: any[]; // Placeholder type, ideally import from a shared types file
  repayment: any[]; // Placeholder type
  categories: any[]; // Placeholder type
  // Add any other fields returned by your insights API
}

// Application API endpoints
export const applicationApi = {
  // Get all applications for the current user
  getAllApplications: async (): Promise<CashAdvanceApplication[]> => {
    const response = await api.get('/applications');
    // Adjust based on your backend response structure
    return response.data.data.applications || response.data.applications || [];
  },

  // Get a single application by ID
  getApplicationById: async (id: string): Promise<CashAdvanceApplication> => {
    const response = await api.get(`/applications/${id}`);
    // Adjust based on your backend response structure
    return response.data.data.application || response.data.application;
  },

  // Create a new application
  createApplication: async (data: ApplicationFormData): Promise<CashAdvanceApplication> => {
    const response = await api.post('/applications', data);
    // Adjust based on your backend response structure
    return response.data.data.application || response.data.application;
  },

  // Cancel an application
  cancelApplication: async (id: string): Promise<CashAdvanceApplication> => {
    const response = await api.post(`/applications/${id}/cancel`);
    // Adjust based on your backend response structure
    return response.data.data.application || response.data.application;
  },

  // Disburse funds for an application
  disburseFunds: async (data: DisbursementFormData): Promise<CashAdvanceApplication> => {
    const response = await api.post(`/applications/${data.applicationId}/disbursement`, {
      expressDelivery: data.expressDelivery,
      tip: data.tip,
    });
    // Adjust based on your backend response structure
    return response.data.data.application || response.data.application;
  },

  // Repay funds for an application
  repayFunds: async (data: RepaymentFormData): Promise<CashAdvanceApplication> => {
    const response = await api.post(`/applications/${data.applicationId}/repayment`, {
      amount: data.amount,
    });
    // Adjust based on your backend response structure
    return response.data.data.application || response.data.application;
  },
};

// Insights API endpoint
export const fetchInsightsData = async (userId: string /* , startDate?: Date, endDate?: Date */): Promise<InsightsDataResponse> => {
  // TODO: Implement query parameters for user ID and date range if backend supports it
  // const params = { userId, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() };
  const response = await api.get('/insights'); // Basic call for now

  // Adjust based on your backend response structure
  // Ensure the response structure matches InsightsDataResponse
  const data = response.data.data || response.data;
  return {
    spending: data.spending || [],
    repayment: data.repayment || [],
    categories: data.categories || [],
  };
};

export default api; 