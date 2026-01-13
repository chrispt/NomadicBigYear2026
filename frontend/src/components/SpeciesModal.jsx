import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

function SpeciesModal({ userId, userName, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  // Fetch data once on mount
  useEffect(() => {
    fetchSpecies();
  }, [userId]);

  const fetchSpecies = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/leaderboard/${userId}/species`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load species list');
    } finally {
      setLoading(false);
    }
  };

  // Client-side sorting for better performance (no re-fetch needed)
  const sortedSpecies = useMemo(() => {
    if (!data?.species) return [];
    return [...data.species].sort((a, b) => {
      if (sortBy === 'name') {
        return a.common_name.localeCompare(b.common_name);
      } else {
        // Sort by date (newest first)
        return new Date(b.first_observation_date) - new Date(a.first_observation_date);
      }
    });
  }, [data?.species, sortBy]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Modal overlay click handler (close on backdrop click)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="species-modal-title"
      onClick={handleOverlayClick}
      style={{
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
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 id="species-modal-title" style={{ margin: 0 }}>{userName}'s Species List</h2>
            {data && (
              <p style={{ color: '#666', fontSize: '14px', marginTop: '5px', marginBottom: 0 }}>
                {data.species_count} species in 2026
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              padding: '0 5px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflow: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading species...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
              {error}
            </div>
          ) : (
            <>
              {/* Sort controls */}
              <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Sort by:</span>
                <button
                  onClick={() => setSortBy('name')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: sortBy === 'name' ? '#4a7c59' : 'white',
                    color: sortBy === 'name' ? 'white' : '#333',
                  }}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: sortBy === 'date' ? '#4a7c59' : 'white',
                    color: sortBy === 'date' ? 'white' : '#333',
                  }}
                >
                  Date
                </button>
              </div>

              {/* Privacy message if applicable */}
              {data.message && (
                <div style={{
                  padding: '10px 15px',
                  marginBottom: '15px',
                  background: '#fff3e0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#e65100',
                }}>
                  {data.message}
                </div>
              )}

              {/* Species table */}
              {sortedSpecies.length > 0 ? (
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'left' }}>#</th>
                      <th style={{ textAlign: 'left' }}>Species</th>
                      <th style={{ textAlign: 'left' }}>First Seen</th>
                      {data.privacy_level === 'public' && (
                        <th style={{ textAlign: 'left' }}>State</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSpecies.map((species, index) => (
                      <tr key={species.scientific_name}>
                        <td style={{ color: '#999' }}>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{species.common_name}</div>
                          <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                            {species.scientific_name}
                          </div>
                        </td>
                        <td>
                          {new Date(species.first_observation_date).toLocaleDateString()}
                        </td>
                        {data.privacy_level === 'public' && (
                          <td>{species.state_province || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No species recorded yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpeciesModal;
