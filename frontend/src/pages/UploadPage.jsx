import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { logout } from '../services/auth';

function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError('');
      setSuccess(false);
    } else {
      setError('Please drop a CSV file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setStats(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload CSV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '40px' }}>
      {/* Header/Navbar */}
      <div style={{ background: '#1e88e5', color: 'white', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Upload eBird Data</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link to="/leaderboard" className="btn btn-primary">Leaderboard</Link>
            <Link to="/profile" className="btn btn-secondary">My Profile</Link>
            <button onClick={logout} className="btn" style={{ background: '#555' }}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '10px' }}>Upload Your eBird CSV</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Export your CSV from eBird and upload it here. Only observations from 2026 will be imported.
          </p>

          {error && (
            <div className="error">{error}</div>
          )}

          {success && stats ? (
            <div>
              <div className="success">
                <strong>Upload Successful!</strong>
                <p style={{ marginTop: '10px' }}>Your CSV has been processed.</p>
              </div>

              <div style={{ marginTop: '20px', background: '#f9f9f9', padding: '20px', borderRadius: '4px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Import Statistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                      {stats.species_count}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Species (2026)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#008CBA' }}>
                      {stats.imported}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Observations Imported</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                      {stats.duplicates}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Duplicates Skipped</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666' }}>
                      {stats.total_rows}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Total Rows</div>
                  </div>
                </div>

                {stats.date_range.earliest && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Date Range: {stats.date_range.earliest} to {stats.date_range.latest}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '30px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="btn btn-primary"
                >
                  View Leaderboard
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setFile(null);
                    setStats(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn btn-secondary"
                >
                  Upload Another
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  background: file ? '#e8f5e9' : '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                  {file ? '✅' : '📁'}
                </div>
                {file ? (
                  <>
                    <p style={{ fontWeight: '500', marginBottom: '5px' }}>{file.name}</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontWeight: '500', marginBottom: '10px' }}>
                      Drag & drop your CSV file here
                    </p>
                    <p style={{ fontSize: '14px', color: '#666' }}>or click to browse</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </>
          )}

          <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
            <strong style={{ display: 'block', marginBottom: '10px' }}>How to get your eBird CSV:</strong>
            <ol style={{ marginLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
              <li>Go to <a href="https://ebird.org/downloadMyData" target="_blank" rel="noopener noreferrer" style={{ color: '#008CBA' }}>ebird.org/downloadMyData</a></li>
              <li>Request your data download</li>
              <li>Check your email for the download link</li>
              <li>Download and extract the ZIP file</li>
              <li>Upload the "MyEBirdData.csv" file here</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadPage;
