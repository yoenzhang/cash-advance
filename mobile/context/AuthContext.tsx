import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '@/types/application'; // Import User type

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null; // Add user state
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // User state

  // Simulate checking auth status and fetching user on app load
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Replace with actual async check (e.g., reading token from storage)
        await new Promise(resolve => setTimeout(resolve, 1000));
        const foundToken = false; // Simulate not finding token initially
        if (foundToken) {
          // If token found, fetch user data
          // const userData = await fetchUserDataAPI(); // Replace with actual API call
          const simulatedUserData: User = {
            id: '123',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe'
          };
          setUser(simulatedUserData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async () => {
    setIsLoading(true);
    console.log("Logging in...");
    try {
      // Placeholder for actual login API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // On successful login, API should return user data
      const simulatedUserData: User = {
        id: '123',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User'
      };
      setUser(simulatedUserData);
      setIsAuthenticated(true);
      console.log("Logged in.");
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      setIsAuthenticated(false);
      // Re-throw or handle error display
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    console.log("Logging out...");
    try {
      // Placeholder for actual logout logic (e.g., clear token, call API)
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      setIsAuthenticated(false);
      console.log("Logged out.");
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle error if needed
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Add user to the context value
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 