import { Link } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

function HomePage() {
  const authenticated = isAuthenticated();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container" style={{ padding: '60px 20px', color: 'white' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>
          Nomadic Big Year 2026
        </h1>
        <p style={{ fontSize: '24px', textAlign: 'center', marginBottom: '40px', opacity: 0.9 }}>
          Full-time RV Community Birding Competition
        </p>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '20px', color: '#333' }}>Welcome!</h2>
          <p style={{ marginBottom: '20px', color: '#666', lineHeight: '1.6' }}>
            Track your bird sightings throughout 2026 and compete with your fellow RVers.
            Upload your eBird CSV data monthly and watch your ranking on the leaderboard!
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {authenticated ? (
              <>
                <Link to="/leaderboard" className="btn btn-primary">
                  View Leaderboard
                </Link>
                <Link to="/upload" className="btn btn-secondary">
                  Upload CSV
                </Link>
                <Link to="/profile" className="btn btn-secondary">
                  My Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Log In
                </Link>
                <Link to="/leaderboard" className="btn btn-secondary">
                  View Leaderboard
                </Link>
              </>
            )}
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '60px auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '10px', color: '#4CAF50' }}>Upload eBird Data</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Export your CSV from eBird and upload monthly to track your progress.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '10px', color: '#008CBA' }}>Auto Leaderboard</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Rankings update automatically based on unique species count for 2026.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '10px', color: '#f44336' }}>Privacy Controls</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Choose whether to share full details or just your species count.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.8 }}>
          <p>Competition runs January 1 - December 31, 2026</p>
          <p style={{ marginTop: '10px' }}>Goal: Log the most unique bird species while traveling in your RV!</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
