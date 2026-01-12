import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyMagicLink, setToken } from '../services/auth';

function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('No verification token provided');
      return;
    }

    const verify = async () => {
      try {
        const response = await verifyMagicLink(token);
        setToken(response.access_token);
        setStatus('success');

        // Redirect to leaderboard after 2 seconds
        setTimeout(() => {
          navigate('/leaderboard');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.detail || 'Invalid or expired magic link');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <div className="loading">
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
                <h2 style={{ marginBottom: '10px' }}>Verifying...</h2>
                <p style={{ color: '#666' }}>Please wait while we log you in.</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ marginBottom: '10px', color: '#4CAF50' }}>Success!</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                You've been logged in successfully.
              </p>
              <p style={{ color: '#999' }}>Redirecting to leaderboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
              <h2 style={{ marginBottom: '10px', color: '#f44336' }}>Verification Failed</h2>
              <p style={{ color: '#666', marginBottom: '30px' }}>{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Request New Link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyPage;
