import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api'; // Assuming your adapted api service is here

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>; // Returns true on success
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>; // Returns true on success
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>; // Function to check auth status on app load
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  // Function to check if the user is already logged in (e.g., on app startup)
  const checkAuthStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Validate token with the backend
        // Use the same interceptor logic as in the web version, if applicable,
        // or make a dedicated endpoint call like `/auth/me`
        // For simplicity, we'll call a dedicated endpoint here
        const response = await api.get('/auth/me'); // Make sure this endpoint exists in your backend

        if (response.data && response.data.data?.user) {
          setUser(response.data.data.user);
        } else {
          // Invalid token
          await AsyncStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Error checking auth status:', err);
      // If token validation fails, clear token and user state
      await AsyncStorage.removeItem('token');
      setUser(null);
      // Optionally set an error message, but often not needed on initial load failure
      // setError('Failed to verify login status.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, data } = response.data;

      if (token && data?.user) {
        await AsyncStorage.setItem('token', token);
        setUser(data.user);
        setIsLoading(false);
        return true; // Indicate success
      } else {
        throw new Error(response.data.message || 'Login failed: Invalid response from server');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'An unknown error occurred during login.';
      setError(message);
      console.error('Login error:', err);
      setIsLoading(false);
      return false; // Indicate failure
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password, firstName, lastName });
      const { token, data } = response.data;

      if (token && data?.user) {
        await AsyncStorage.setItem('token', token);
        setUser(data.user);
        setIsLoading(false);
        return true; // Indicate success
      } else {
        throw new Error(response.data.message || 'Registration failed: Invalid response from server');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'An unknown error occurred during registration.';
      setError(message);
      console.error('Registration error:', err);
      setIsLoading(false);
      return false; // Indicate failure
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
      // Optional: Call a backend logout endpoint if necessary
      // await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
      // Decide if you want to show an error to the user on logout failure
      setError('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
      setError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading: isLoading,
        error,
        login,
        register,
        logout,
        checkAuthStatus,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 