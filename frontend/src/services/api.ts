import axios, { InternalAxiosRequestConfig } from 'axios';
import { CashAdvanceApplication, ApplicationFormData, DisbursementFormData, RepaymentFormData } from '../types/application';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: Error) => {
    return Promise.reject(error);
  }
);

// Application API endpoints
export const applicationApi = {
  // Get all applications for the current user
  getAllApplications: async (): Promise<CashAdvanceApplication[]> => {
    const response = await api.get('/applications');
    return response.data.data.applications;
  },

  // Get a single application by ID
  getApplicationById: async (id: string): Promise<CashAdvanceApplication> => {
    const response = await api.get(`/applications/${id}`);
    return response.data.data.application;
  },

  // Create a new application
  createApplication: async (data: ApplicationFormData): Promise<CashAdvanceApplication> => {
    const response = await api.post('/applications', data);
    return response.data.data.application;
  },

  // Cancel an application
  cancelApplication: async (id: string): Promise<CashAdvanceApplication> => {
    const response = await api.post(`/applications/${id}/cancel`);
    return response.data.data.application;
  },

  // Disburse funds for an application
  disburseFunds: async (data: DisbursementFormData): Promise<CashAdvanceApplication> => {
    const response = await api.post(`/applications/${data.applicationId}/disbursement`, {
      expressDelivery: data.expressDelivery,
      tip: data.tip,
    });
    return response.data.data.application;
  },

  // Repay funds for an application
  repayFunds: async (data: RepaymentFormData): Promise<CashAdvanceApplication> => {
    const response = await api.post(`/applications/${data.applicationId}/repayment`, {
      amount: data.amount,
    });
    return response.data.data.application;
  },
};

export default api; 