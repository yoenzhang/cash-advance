import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApplication } from '../../context/ApplicationContext';
import { ApplicationFormData } from '../../types/application';
import './ApplicationForm.css';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const { createApplication, loading, error } = useApplication();
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    amount: 0,
    expressDelivery: false,
    tip: 0,
    purpose: '',
  });
  
  const [touched, setTouched] = useState({
    amount: false,
    tip: false
  });

  const [validationErrors, setValidationErrors] = useState<{
    amount?: string;
    tip?: string;
    purpose?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    
    if (name === 'amount' || name === 'tip') {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    if ((name === 'amount' || name === 'tip') && value === '') {
      setFormData({
        ...formData,
        [name]: '' as any
      });
    } else {
      setFormData({
        ...formData,
        [name]: isCheckbox 
          ? (e.target as HTMLInputElement).checked 
          : type === 'number' 
            ? parseFloat(value) || 0 
            : value,
      });
    }
    
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors({
        ...validationErrors,
        [name]: undefined,
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: {
      amount?: string;
      tip?: string;
      purpose?: string;
    } = {};
    
    if (formData.amount === '' || (typeof formData.amount === 'number' && formData.amount <= 0)) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (formData.tip === '' || (typeof formData.tip === 'number' && formData.tip < 0)) {
      errors.tip = 'Tip cannot be negative';
    }
    
    if (!formData.purpose.trim()) {
      errors.purpose = 'Purpose is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalFormData = {
      ...formData,
      amount: typeof formData.amount === 'string' ? 0 : formData.amount,
      tip: typeof formData.tip === 'string' ? 0 : formData.tip
    };
    
    setFormData(finalFormData);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await createApplication(finalFormData);
      navigate('/applications');
    } catch (err) {
      console.error('Failed to create application:', err);
    }
  };

  return (
    <div className="application-form-container">
      <h2>New Cash Advance Application</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-group">
          <label htmlFor="amount">Amount ($)</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount === '' ? '' : formData.amount}
            onChange={handleChange}
            onFocus={() => {
              if (!touched.amount) {
                setFormData({...formData, amount: '' as any});
                setTouched(prev => ({...prev, amount: true}));
              }
            }}
            min="0"
            step="0.01"
            className={validationErrors.amount ? 'error' : ''}
            required
          />
          {validationErrors.amount && (
            <div className="validation-error">{validationErrors.amount}</div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="purpose">Purpose</label>
          <textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            className={validationErrors.purpose ? 'error' : ''}
            required
          />
          {validationErrors.purpose && (
            <div className="validation-error">{validationErrors.purpose}</div>
          )}
        </div>
        
        <div className="form-group checkbox-group">
          <label htmlFor="expressDelivery">
            <input
              type="checkbox"
              id="expressDelivery"
              name="expressDelivery"
              checked={formData.expressDelivery}
              onChange={handleChange}
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
            value={formData.tip === '' ? '' : formData.tip}
            onChange={handleChange}
            onFocus={() => {
              if (!touched.tip) {
                setFormData({...formData, tip: '' as any});
                setTouched(prev => ({...prev, tip: true}));
              }
            }}
            min="0"
            step="0.01"
            className={validationErrors.tip ? 'error' : ''}
          />
          {validationErrors.tip && (
            <div className="validation-error">{validationErrors.tip}</div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate('/applications')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm; 