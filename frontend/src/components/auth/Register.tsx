import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .required('Last name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register: React.FC = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleSubmit = async (values: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
    confirmPassword: string;
  }) => {
    try {
      setRegisterError(null);
      const { confirmPassword, ...registerData } = values;
      await register(registerData.email, registerData.password, registerData.firstName, registerData.lastName);
      navigate('/dashboard');
    } catch (err: any) {
      setRegisterError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create an Account</h2>
        
        {registerError && <div className="error-message">{registerError}</div>}
        
        <Formik
          initialValues={{ 
            firstName: '', 
            lastName: '', 
            email: '', 
            password: '', 
            confirmPassword: '' 
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <Field
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Enter your first name"
                    className="form-control"
                  />
                  <ErrorMessage name="firstName" component="div" className="error-text" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <Field
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Enter your last name"
                    className="form-control"
                  />
                  <ErrorMessage name="lastName" component="div" className="error-text" />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="form-control"
                />
                <ErrorMessage name="email" component="div" className="error-text" />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  className="form-control"
                />
                <ErrorMessage name="password" component="div" className="error-text" />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  className="form-control"
                />
                <ErrorMessage name="confirmPassword" component="div" className="error-text" />
              </div>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting || loading}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </Form>
          )}
        </Formik>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 