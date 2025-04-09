import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  paymentReminders: boolean;
  theme: 'light' | 'dark' | 'system';
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [creditLimit, setCreditLimit] = useState<number>(5000);
  const [requestedLimit, setRequestedLimit] = useState<number>(5000);
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    paymentReminders: true,
    theme: 'light'
  });
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    // This would normally fetch data from an API
    // For demo purposes, we'll set some sample data
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCreditLimit(5000);
      setRequestedLimit(5000);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setRequestedLimit(value);
    }
  };

  const handleCreditLimitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate request
    if (requestedLimit < 1000) {
      setMessage({
        text: 'Credit limit cannot be less than $1,000',
        type: 'error'
      });
      return;
    }
    
    if (requestedLimit > 10000) {
      setMessage({
        text: 'Credit limit cannot exceed $10,000',
        type: 'error'
      });
      return;
    }
    
    // This would normally send a request to the API
    // For demo purposes, we'll just update the state
    setMessage({
      text: 'Credit limit update request submitted successfully. Pending review.',
      type: 'success'
    });
    
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: checked
    });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'light' | 'dark' | 'system';
    setPreferences({
      ...preferences,
      theme: value
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (!currentPassword) {
      setMessage({
        text: 'Please enter your current password',
        type: 'error'
      });
      return;
    }
    
    if (newPassword.length < 8) {
      setMessage({
        text: 'New password must be at least 8 characters long',
        type: 'error'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage({
        text: 'New passwords do not match',
        type: 'error'
      });
      return;
    }
    
    // This would normally send a request to the API
    // For demo purposes, we'll just show a success message
    setMessage({
      text: 'Password updated successfully',
      type: 'success'
    });
    
    // Clear password fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  const savePreferences = () => {
    // This would normally send a request to the API
    // For demo purposes, we'll just show a success message
    setMessage({
      text: 'Preferences saved successfully',
      type: 'success'
    });
    
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <h1>Account Settings</h1>
      <p className="subtitle">Manage your account preferences and credit limit</p>
      
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}
      
      <div className="settings-grid">
        <div className="card credit-limit-section">
          <h2>Credit Limit</h2>
          <p className="mb-3">Adjust your credit limit based on your financial needs.</p>
          
          <form onSubmit={handleCreditLimitSubmit}>
            <div className="form-group">
              <label className="form-label">Current Credit Limit</label>
              <div className="current-limit">${creditLimit.toLocaleString()}</div>
            </div>
            
            <div className="form-group">
              <label htmlFor="requestedLimit" className="form-label">
                Requested Credit Limit
              </label>
              <input
                type="range"
                id="requestedLimit"
                min="1000"
                max="10000"
                step="500"
                value={requestedLimit}
                onChange={handleCreditLimitChange}
                className="range-slider"
              />
              <div className="range-value">${requestedLimit.toLocaleString()}</div>
            </div>
            
            <button type="submit" className="btn btn-primary mt-3">
              Request New Limit
            </button>
            <p className="hint-text mt-2">
              Note: Limit increase requests are subject to review and approval.
            </p>
          </form>
        </div>
      
        <div className="card notification-section">
          <h2>Notification Preferences</h2>
          <p className="mb-3">Control how and when you receive notifications.</p>
          
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={preferences.emailNotifications}
                onChange={handlePreferenceChange}
              />
              <label htmlFor="emailNotifications">Email Notifications</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="smsNotifications"
                name="smsNotifications"
                checked={preferences.smsNotifications}
                onChange={handlePreferenceChange}
              />
              <label htmlFor="smsNotifications">SMS Notifications</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="paymentReminders"
                name="paymentReminders"
                checked={preferences.paymentReminders}
                onChange={handlePreferenceChange}
              />
              <label htmlFor="paymentReminders">Payment Reminders</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="marketingEmails"
                name="marketingEmails"
                checked={preferences.marketingEmails}
                onChange={handlePreferenceChange}
              />
              <label htmlFor="marketingEmails">Marketing Emails</label>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="theme" className="form-label">
              Application Theme
            </label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={handleThemeChange}
              className="form-control"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
          
          <button className="btn btn-primary mt-3" onClick={savePreferences}>
            Save Preferences
          </button>
        </div>
      </div>
      
      <div className="card password-section mt-4">
        <h2>Change Password</h2>
        <p className="mb-3">Update your password to maintain account security.</p>
        
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword" className="form-label">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword" className="form-label">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control"
            />
          </div>
          
          <button type="submit" className="btn btn-primary mt-3">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings; 