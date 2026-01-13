import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { logout } from '../services/auth';
import SpeciesModal from '../components/SpeciesModal';

// New features list - update this when adding features, old ones auto-hide after 30 days
const NEW_FEATURES = [
  { date: '2026-01-12', text: 'Click any name to view their species list' },
  { date: '2026-01-12', text: 'Submit feature requests via the form below' },
  { date: '2026-01-12', text: 'Privacy: "Counts Only" now shows species but hides locations' },
];

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(2026);
  const [participants, setParticipants] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [featureRequest, setFeatureRequest] = useState('');
  const [featureEmail, setFeatureEmail] = useState('');
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [featureMessage, setFeatureMessage] = useState({ type: '', text: '' });

  // Filter features to show only those from last 30 days
  const recentFeatures = NEW_FEATURES.filter(f => {
    const daysOld = (new Date() - new Date(f.date)) / (1000 * 60 * 60 * 24);
    return daysOld <= 30;
  });

  useEffect(() => {
    fetchLeaderboard();
  }, [year]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/leaderboard?year=${year}`);
      setLeaderboard(response.data.leaderboard);
      setParticipants(response.data.participants);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#333';
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    if (featureRequest.trim().length < 10) {
      setFeatureMessage({ type: 'error', text: 'Please provide at least 10 characters.' });
      return;
    }

    setFeatureSubmitting(true);
    setFeatureMessage({ type: '', text: '' });

    try {
      await api.post('/feedback/feature-request', {
        suggestion: featureRequest.trim(),
        email: featureEmail.trim() || null,
      });
      setFeatureMessage({ type: 'success', text: 'Thank you! Your suggestion has been submitted.' });
      setFeatureRequest('');
      setFeatureEmail('');
    } catch (err) {
      setFeatureMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to submit. Please try again.',
      });
    } finally {
      setFeatureSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '40px' }}>
      {/* Header/Navbar */}
      <div style={{ background: '#667eea', color: 'white', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Nomadic Big Year 2026</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-primary">Upload CSV</Link>
            <Link to="/profile" className="btn btn-secondary">My Profile</Link>
            <button onClick={logout} className="btn" style={{ background: '#555' }}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        {/* New Features Collapsible */}
        {recentFeatures.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setFeaturesExpanded(!featuresExpanded)}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              <span>New Features ({recentFeatures.length})</span>
              <span style={{ fontSize: '12px' }}>{featuresExpanded ? '▼' : '▶'}</span>
            </button>
            {featuresExpanded && (
              <div style={{ padding: '15px 20px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {recentFeatures.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '8px', color: '#333' }}>
                      {feature.text}
                      <span style={{ color: '#999', fontSize: '12px', marginLeft: '10px' }}>
                        ({new Date(feature.date).toLocaleDateString()})
                      </span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee', fontSize: '13px', color: '#666' }}>
                  <strong>Privacy Levels:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li><strong>Public:</strong> Species list with dates and locations visible</li>
                    <li><strong>Counts Only:</strong> Species list visible, but locations hidden</li>
                    <li><strong>Private:</strong> Not shown on leaderboard</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ marginBottom: '5px' }}>Leaderboard</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {participants} participants • Ranked by species count in {year}
              </p>
            </div>
            <div>
              <label style={{ marginRight: '10px', fontWeight: '500' }}>Year:</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="error">{error}</div>
          )}

          {loading ? (
            <div className="loading">Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No participants yet. Be the first to upload your bird data!</p>
              <Link to="/upload" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                Upload CSV
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Name</th>
                    <th style={{ textAlign: 'right' }}>Species Count</th>
                    <th>Last Observation</th>
                    <th>Privacy</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.user_id}>
                      <td>
                        <strong style={{ fontSize: '18px', color: getRankColor(entry.rank) }}>
                          #{entry.rank}
                        </strong>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedUser(entry)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: '#667eea',
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                            fontSize: 'inherit',
                          }}
                          title="Click to view species list"
                        >
                          {entry.name}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '18px', color: '#4CAF50' }}>
                          {entry.species_count}
                        </strong>
                      </td>
                      <td>
                        {entry.last_observation_date
                          ? new Date(entry.last_observation_date).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          background: entry.privacy_level === 'public' ? '#e8f5e9' : '#fff3e0',
                          color: entry.privacy_level === 'public' ? '#2e7d32' : '#e65100',
                        }}>
                          {entry.privacy_level === 'public' ? 'Public' : 'Counts Only'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
          <p>Competition runs January 1 - December 31, 2026</p>
          <p style={{ marginTop: '10px' }}>
            Rankings update automatically when you upload your eBird CSV data.
          </p>
        </div>

        {/* Feature Request Form */}
        <div className="card" style={{ marginTop: '40px' }}>
          <h3 style={{ marginBottom: '15px' }}>Suggest a Feature</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Have an idea to improve the leaderboard? Let us know!
          </p>

          <form onSubmit={handleFeatureSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <textarea
                value={featureRequest}
                onChange={(e) => setFeatureRequest(e.target.value)}
                placeholder="Describe your feature idea... (minimum 10 characters)"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                value={featureEmail}
                onChange={(e) => setFeatureEmail(e.target.value)}
                placeholder="Your email (optional, for follow-up)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {featureMessage.text && (
              <div className={featureMessage.type} style={{ marginBottom: '15px' }}>
                {featureMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={featureSubmitting}
              className="btn btn-primary"
              style={{ opacity: featureSubmitting ? 0.7 : 1 }}
            >
              {featureSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </form>
        </div>
      </div>

      {/* Species Modal */}
      {selectedUser && (
        <SpeciesModal
          userId={selectedUser.user_id}
          userName={selectedUser.name}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

export default LeaderboardPage;
