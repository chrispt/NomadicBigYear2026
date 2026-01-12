import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { logout } from '../services/auth';

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(2026);
  const [participants, setParticipants] = useState(0);

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
                        <strong>{entry.name}</strong>
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
      </div>
    </div>
  );
}

export default LeaderboardPage;
