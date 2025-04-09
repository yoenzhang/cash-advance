import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './GlobalHeader.css';

const GlobalHeader: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="global-header">
      <div className="global-header-content">
        <div className="logo">
          <Link to="/">Cash Advance Portal</Link>
        </div>
        
        {isAuthenticated && (
          <div className="user-navigation">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
            <Link to="/applications" className={`nav-link ${isActive('/applications')}`}>Applications</Link>
            <Link to="/insights" className={`nav-link ${isActive('/insights')}`}>Insights</Link>
            <Link to="/settings" className={`nav-link ${isActive('/settings')}`}>Settings</Link>
            <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default GlobalHeader; 