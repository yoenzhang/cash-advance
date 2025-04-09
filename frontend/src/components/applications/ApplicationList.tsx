import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../../context/ApplicationContext';
import { ApplicationStatus } from '../../types/application';
import './ApplicationList.css';

const ApplicationList: React.FC = () => {
  const { applications, loading, error, fetchApplications } = useApplication();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return 'status-badge status-pending';
      case ApplicationStatus.APPROVED:
        return 'status-badge status-approved';
      case ApplicationStatus.REJECTED:
        return 'status-badge status-rejected';
      case ApplicationStatus.DISBURSED:
        return 'status-badge status-disbursed';
      case ApplicationStatus.REPAID:
        return 'status-badge status-repaid';
      case ApplicationStatus.CANCELLED:
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/applications/${id}`);
  };

  if (loading) {
    return <div className="loading-container">Loading applications...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="application-list-container">
      <div className="application-list-header">
        <div className="header-left">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
          <h2>Your Cash Advance Applications</h2>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/applications/new')}
        >
          New Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any cash advance applications yet.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/applications/new')}
          >
            Apply Now
          </button>
        </div>
      ) : (
        <div className="application-table-container">
          <table className="application-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.id.substring(0, 8)}...</td>
                  <td>{formatCurrency(application.amount)}</td>
                  <td>
                    <span className={getStatusBadgeClass(application.status)}>
                      {application.status}
                    </span>
                  </td>
                  <td>{formatDate(application.createdAt)}</td>
                  <td>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleViewDetails(application.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApplicationList; 