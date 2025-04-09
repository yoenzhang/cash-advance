import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApplication } from '../../context/ApplicationContext';
import { ApplicationStatus, DisbursementFormData, RepaymentFormData } from '../../types/application';
import './ApplicationDetails.css';

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    selectedApplication, 
    loading, 
    error, 
    getApplicationById, 
    cancelApplication, 
    disburseFunds, 
    repayFunds 
  } = useApplication();
  
  const [disbursementForm, setDisbursementForm] = useState<DisbursementFormData>({
    applicationId: id || '',
    expressDelivery: false,
    tip: 0,
  });
  
  const [repaymentForm, setRepaymentForm] = useState<RepaymentFormData>({
    applicationId: id || '',
    amount: 0,
  });
  
  const [showDisbursementForm, setShowDisbursementForm] = useState(false);
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getApplicationById(id);
    }
  }, [id]);

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

  const handleDisbursementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setDisbursementForm({
      ...disbursementForm,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0,
    });
  };

  const handleRepaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setRepaymentForm({
      ...repaymentForm,
      [name]: parseFloat(value) || 0,
    });
  };

  const handleCancelApplication = async () => {
    if (!id) return;
    
    try {
      setActionLoading(true);
      setActionError(null);
      await cancelApplication(id);
      setShowDisbursementForm(false);
      setShowRepaymentForm(false);
    } catch (err) {
      setActionError('Failed to cancel application');
      console.error('Error canceling application:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisburseFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      setActionError(null);
      await disburseFunds(disbursementForm);
      setShowDisbursementForm(false);
    } catch (err) {
      setActionError('Failed to disburse funds');
      console.error('Error disbursing funds:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepayFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      setActionError(null);
      await repayFunds(repaymentForm);
      setShowRepaymentForm(false);
    } catch (err) {
      setActionError('Failed to repay funds');
      console.error('Error repaying funds:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading application details...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!selectedApplication) {
    return <div className="error-container">Application not found</div>;
  }

  return (
    <div className="application-details-container">
      <div className="application-details-header">
        <h2>Application Details</h2>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/applications')}
        >
          Back to Applications
        </button>
      </div>
      
      {actionError && (
        <div className="error-message">
          {actionError}
        </div>
      )}
      
      <div className="application-details-card">
        <div className="application-details-section">
          <h3>Basic Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Application ID:</span>
              <span className="detail-value">{selectedApplication.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={getStatusBadgeClass(selectedApplication.status)}>
                {selectedApplication.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">{formatCurrency(selectedApplication.amount)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatDate(selectedApplication.createdAt)}</span>
            </div>
            {selectedApplication.disbursementDate && (
              <div className="detail-item">
                <span className="detail-label">Disbursed:</span>
                <span className="detail-value">{formatDate(selectedApplication.disbursementDate)}</span>
              </div>
            )}
            {selectedApplication.repaymentDate && (
              <div className="detail-item">
                <span className="detail-label">Repaid:</span>
                <span className="detail-value">{formatDate(selectedApplication.repaymentDate)}</span>
              </div>
            )}
            {selectedApplication.repaymentAmount !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Repaid Amount:</span>
                <span className="detail-value">{formatCurrency(selectedApplication.repaymentAmount)}</span>
              </div>
            )}
            {selectedApplication.remainingAmount !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Remaining Amount:</span>
                <span className="detail-value">{formatCurrency(selectedApplication.remainingAmount)}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Credit Limit:</span>
              <span className="detail-value">{formatCurrency(selectedApplication.creditLimit)}</span>
            </div>
          </div>
        </div>
        
        <div className="application-actions-section">
          <h3>Actions</h3>
          
          {selectedApplication.status === ApplicationStatus.PENDING && (
            <div className="action-buttons">
              <button 
                className="btn-secondary"
                onClick={handleCancelApplication}
                disabled={actionLoading}
              >
                Cancel Application
              </button>
            </div>
          )}
          
          {selectedApplication.status === ApplicationStatus.APPROVED && (
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={() => setShowDisbursementForm(true)}
                disabled={actionLoading}
              >
                Disburse Funds
              </button>
            </div>
          )}
          
          {selectedApplication.status === ApplicationStatus.DISBURSED && (
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={() => setShowRepaymentForm(true)}
                disabled={actionLoading}
              >
                Make Repayment
              </button>
            </div>
          )}
          
          {showDisbursementForm && (
            <div className="action-form">
              <h4>Disburse Funds</h4>
              <form onSubmit={handleDisburseFunds}>
                <div className="form-group checkbox-group">
                  <label htmlFor="expressDelivery">
                    <input
                      type="checkbox"
                      id="expressDelivery"
                      name="expressDelivery"
                      checked={disbursementForm.expressDelivery}
                      onChange={handleDisbursementChange}
                    />
                    Express Delivery (Additional fee may apply)
                  </label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="tip">Tip Amount ($) (Optional)</label>
                  <input
                    type="number"
                    id="tip"
                    name="tip"
                    value={disbursementForm.tip}
                    onChange={handleDisbursementChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowDisbursementForm(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Disbursement'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {showRepaymentForm && (
            <div className="action-form">
              <h4>Make Repayment</h4>
              <form onSubmit={handleRepayFunds}>
                <div className="form-group">
                  <label htmlFor="amount">Repayment Amount ($)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={repaymentForm.amount}
                    onChange={handleRepaymentChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowRepaymentForm(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Repayment'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails; 