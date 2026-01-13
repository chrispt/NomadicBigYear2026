import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { logout } from '../services/auth';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/user/me');
      setProfile(response.data);
      setName(response.data.name);
      setPrivacyLevel(response.data.privacy_level);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await api.patch('/user/me', {
        name: name !== profile.name ? name : undefined,
        privacy_level: privacyLevel !== profile.privacy_level ? privacyLevel : undefined,
      });
      await fetchProfile();
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '40px' }}>
      {/* Header/Navbar */}
      <div style={{ background: '#1e88e5', color: 'white', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>My Profile</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/leaderboard" className="btn btn-primary">Leaderboard</Link>
            <Link to="/upload" className="btn btn-secondary">Upload CSV</Link>
            <button onClick={logout} className="btn" style={{ background: '#555' }}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        {error && (
          <div className="error">{error}</div>
        )}

        {loading ? (
          <div className="loading">Loading profile...</div>
        ) : profile ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Profile Info Card */}
            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>Profile Information</h2>

              {editing ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="privacy" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Privacy Level
                    </label>
                    <select
                      id="privacy"
                      value={privacyLevel}
                      onChange={(e) => setPrivacyLevel(e.target.value)}
                      className="form-input"
                    >
                      <option value="public">Public - Show all details</option>
                      <option value="counts_only">Counts Only - Hide observation details</option>
                      <option value="private">Private - Don't show on leaderboard</option>
                    </select>
                    <p style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}>
                      {privacyLevel === 'public' && 'Other users can see your full observation details'}
                      {privacyLevel === 'counts_only' && 'Only your species count appears on leaderboard'}
                      {privacyLevel === 'private' && 'You won\'t appear on the public leaderboard'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => {
                      setEditing(false);
                      setName(profile.name);
                      setPrivacyLevel(profile.privacy_level);
                    }} className="btn btn-secondary">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Name</div>
                    <div style={{ fontSize: '18px', fontWeight: '500' }}>{profile.name}</div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Email</div>
                    <div style={{ fontSize: '16px' }}>{profile.email}</div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Privacy Level</div>
                    <div style={{ fontSize: '16px', fontWeight: '500' }}>
                      {profile.privacy_level === 'public' && '🌐 Public'}
                      {profile.privacy_level === 'counts_only' && '📊 Counts Only'}
                      {profile.privacy_level === 'private' && '🔒 Private'}
                    </div>
                  </div>

                  <button onClick={() => setEditing(true)} className="btn btn-primary">
                    Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Statistics Card */}
            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>2026 Statistics</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {profile.stats.species_count}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Species</div>
                </div>

                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#008CBA' }}>
                    {profile.stats.total_observations}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Observations</div>
                </div>

                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#FF9800' }}>
                    {profile.stats.states_visited}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>States Visited</div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: '#666' }}>
                    {profile.stats.last_upload
                      ? new Date(profile.stats.last_upload).toLocaleDateString()
                      : 'Never'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Last Upload</div>
                </div>
              </div>

              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProfilePage;
