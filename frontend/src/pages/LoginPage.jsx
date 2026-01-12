import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestMagicLink } from '../services/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await requestMagicLink(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '10px', color: '#333' }}>Log In</h1>
          <p style={{ marginBottom: '30px', color: '#666' }}>
            Enter your email to receive a magic login link.
          </p>

          {error && (
            <div className="error">{error}</div>
          )}

          {success ? (
            <div>
              <div className="success">
                <strong>Check your email!</strong>
                <p style={{ marginTop: '10px' }}>
                  We've sent a login link to <strong>{email}</strong>.
                  Click the link to log in.
                </p>
              </div>
              <p style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
                The link will expire in 15 minutes.
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '20px' }}
              >
                Send Another Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#008CBA', textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
