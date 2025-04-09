import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';
import GlobalHeader from './components/GlobalHeader';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import ApplicationList from './components/applications/ApplicationList';
import ApplicationForm from './components/applications/ApplicationForm';
import ApplicationDetails from './components/applications/ApplicationDetails';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import CSS
import './App.css';
import './components/auth/Auth.css';
import './components/Dashboard.css';
import './components/applications/ApplicationList.css';
import './components/applications/ApplicationForm.css';
import './components/applications/ApplicationDetails.css';
import './pages/Pages.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ApplicationProvider>
          <div className="App">
            <GlobalHeader />
            <div className="page-container">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/applications" element={<ApplicationList />} />
                  <Route path="/applications/new" element={<ApplicationForm />} />
                  <Route path="/applications/:id" element={<ApplicationDetails />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
                
                {/* Redirect root to dashboard or login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </ApplicationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
