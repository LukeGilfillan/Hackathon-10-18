import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const AuthComponent = ({ onAuthSuccess, onClose, isRequired = false }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isSignUp ? 'auth/signup/' : 'auth/signin/';
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Store session token in localStorage
        localStorage.setItem('session_token', data.user.session_token);
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('professor_profile', JSON.stringify(data.user.professor_profile));
        
        // Call the success callback with user data
        onAuthSuccess(data.user);
        
        // Close the auth component after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.detail || data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmail = async () => {
    if (!email) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.user_exists) {
          setIsSignUp(false); // User account exists, show sign in
          setSuccess('Account found! Please sign in to continue.');
        } else if (data.professor_exists) {
          setIsSignUp(true); // Professor profile exists but no user account, show sign up
          setSuccess('Professor profile found! Creating your account...');
        } else {
          setIsSignUp(true); // Neither exists, show sign up
          setSuccess('New user detected. We\'ll create your account and profile.');
        }
        setError(''); // Clear any previous errors
      }
    } catch (err) {
      // If check fails, default to sign up and show error
      setIsSignUp(true);
      setError('Unable to verify email. You can still proceed with sign up.');
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '10px',
      color: '#333',
    },
    subtitle: {
      fontSize: '1rem',
      textAlign: 'center',
      marginBottom: '30px',
      color: '#666',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#333',
    },
    input: {
      padding: '15px',
      border: '2px solid #e1e5e9',
      borderRadius: '10px',
      fontSize: '1rem',
      transition: 'border-color 0.3s ease',
    },
    inputFocused: {
      borderColor: '#667eea',
      outline: 'none',
    },
    button: {
      padding: '15px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    toggleButton: {
      background: 'none',
      border: 'none',
      color: '#667eea',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '1rem',
      marginTop: '10px',
    },
    error: {
      color: '#e74c3c',
      fontSize: '0.9rem',
      textAlign: 'center',
      padding: '10px',
      background: '#fdf2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca',
    },
    success: {
      color: '#27ae60',
      fontSize: '0.9rem',
      textAlign: 'center',
      padding: '10px',
      background: '#f0f9f0',
      borderRadius: '8px',
      border: '1px solid #c6f6d5',
    },
    closeButton: {
      position: 'absolute',
      top: '15px',
      right: '20px',
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#666',
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {!isRequired && (
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
        
        <h2 style={styles.title}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>
        <p style={styles.subtitle}>
          {isSignUp 
            ? 'Create your professor account to get personalized grant recommendations'
            : 'Welcome back! Sign in to access your grant recommendations'
          }
        </p>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleCheckEmail}
              style={styles.input}
              placeholder="your.email@university.edu"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
          >
            {isSignUp 
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
          <p>🔒 No password required - just your email!</p>
          <p>We'll automatically match you with existing professor profiles or create a new one.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;

