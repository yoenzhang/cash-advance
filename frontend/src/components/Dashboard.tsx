import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApplication } from '../context/ApplicationContext';
import { ApplicationStatus } from '../types/application';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { applications, loading } = useApplication();
  const navigate = useNavigate();

  const getApplicationCountByStatus = (status: ApplicationStatus) => {
    return applications.filter(app => app.status === status).length;
  };

  const getTotalOutstandingAmount = () => {
    const disbursedApplications = applications.filter(app => app.status === ApplicationStatus.DISBURSED);
    return disbursedApplications.reduce((total, app) => total + app.amount, 0);
  };

  const getTotalRepaidAmount = () => {
    const repaidApplications = applications.filter(app => app.status === ApplicationStatus.REPAID);
    return repaidApplications.reduce((total, app) => total + app.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleViewApplications = () => {
    navigate('/applications');
  };

  const handleNewApplication = () => {
    navigate('/applications/new');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <h1>Welcome, {user?.firstName}!</h1>
        <p className="subtitle">Your financial dashboard at a glance</p>
      </div>
      
      <div className="dashboard-overview">
        <div className="card overview-card">
          <div className="overview-icon">💰</div>
          <div className="overview-details">
            <h2>Cash Balance</h2>
            <div className="overview-amount">{formatCurrency(getTotalRepaidAmount() - getTotalOutstandingAmount())}</div>
            <div className="overview-trend positive">
              <span className="trend-icon">↗</span> 12% from last month
            </div>
          </div>
        </div>
        
        <div className="card overview-card">
          <div className="overview-icon">⚖️</div>
          <div className="overview-details">
            <h2>Outstanding</h2>
            <div className="overview-amount">{formatCurrency(getTotalOutstandingAmount())}</div>
            <div className="overview-trend negative">
              <span className="trend-icon">↘</span> 5% from last month
            </div>
          </div>
        </div>
        
        <div className="card overview-card">
          <div className="overview-icon">📈</div>
          <div className="overview-details">
            <h2>Available Credit</h2>
            <div className="overview-amount">{formatCurrency(5000 - getTotalOutstandingAmount())}</div>
            <div className="overview-trend neutral">
              <span className="trend-icon">→</span> No change
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <button 
          className="btn btn-primary action-button"
          onClick={handleNewApplication}
        >
          <span className="action-icon">+</span>
          Apply for Cash Advance
        </button>
        
        <button 
          className="btn btn-outline action-button"
          onClick={handleViewApplications}
        >
          <span className="action-icon">📋</span>
          View Applications
        </button>
      </div>
      
      <div className="dashboard-grid">
        <div className="card application-summary-card">
          <h2>Application Summary</h2>
          {loading ? (
            <div className="loading">Loading application data...</div>
          ) : (
            <>
              <div className="summary-overview">
                <div className="summary-total">
                  <div className="summary-total-number">{applications.length}</div>
                  <div className="summary-total-label">Total Applications</div>
                </div>
                <div className="summary-status-grid">
                  <div className="status-item">
                    <div className="status-count">{getApplicationCountByStatus(ApplicationStatus.PENDING)}</div>
                    <div className="status-label">Pending</div>
                  </div>
                  <div className="status-item">
                    <div className="status-count">{getApplicationCountByStatus(ApplicationStatus.APPROVED)}</div>
                    <div className="status-label">Approved</div>
                  </div>
                  <div className="status-item">
                    <div className="status-count">{getApplicationCountByStatus(ApplicationStatus.DISBURSED)}</div>
                    <div className="status-label">Outstanding</div>
                  </div>
                  <div className="status-item">
                    <div className="status-count">{getApplicationCountByStatus(ApplicationStatus.REPAID)}</div>
                    <div className="status-label">Repaid</div>
                  </div>
                  <div className="status-item">
                    <div className="status-count">{getApplicationCountByStatus(ApplicationStatus.CANCELLED)}</div>
                    <div className="status-label">Cancelled</div>
                  </div>
                  <div className="status-item">
                    <div className="status-count">{getApplicationCountByStatus(ApplicationStatus.REJECTED)}</div>
                    <div className="status-label">Rejected</div>
                  </div>
                </div>
              </div>
              <div className="view-all-applications">
                <button className="btn btn-outline btn-sm" onClick={handleViewApplications}>
                  View All Applications
                </button>
              </div>
            </>
          )}
        </div>
        
        <div className="card recent-activity-card">
          <h2>Recent Activity</h2>
          {applications.length > 0 ? (
            <div className="activity-list">
              {applications.slice(0, 3).map((app, index) => (
                <div className="activity-item" key={index}>
                  <div className="activity-icon">
                    {app.status === ApplicationStatus.APPROVED ? '✅' : 
                     app.status === ApplicationStatus.DISBURSED ? '💵' :
                     app.status === ApplicationStatus.REPAID ? '✓' :
                     app.status === ApplicationStatus.REJECTED ? '❌' : '⏳'}
                  </div>
                  <div className="activity-details">
                    <div className="activity-title">
                      Cash Advance {app.status === ApplicationStatus.APPROVED ? 'Approved' : 
                                   app.status === ApplicationStatus.DISBURSED ? 'Disbursed' :
                                   app.status === ApplicationStatus.REPAID ? 'Repaid' :
                                   app.status === ApplicationStatus.REJECTED ? 'Rejected' : 'Pending'}
                    </div>
                    <div className="activity-amount">{formatCurrency(app.amount)}</div>
                    <div className="activity-date">
                      {new Date(app.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No recent activities to display.</p>
              <button className="btn btn-primary btn-sm" onClick={handleNewApplication}>
                Apply for your first cash advance
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="card insights-teaser">
        <div className="insights-teaser-content">
          <h2>Dive Deeper Into Your Finances</h2>
          <p>View detailed insights about your spending patterns and repayment history.</p>
          <button className="btn btn-primary" onClick={() => navigate('/insights')}>
            View Insights
          </button>
        </div>
        <div className="insights-teaser-image">
          📊
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 