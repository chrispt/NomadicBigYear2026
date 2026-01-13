import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import api from '../services/api';

function HomePage() {
  const authenticated = isAuthenticated();
  const [topBirders, setTopBirders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);

  useEffect(() => {
    fetchTopBirders();
  }, []);

  const fetchTopBirders = async () => {
    try {
      const response = await api.get('/leaderboard?year=2026');
      setTopBirders(response.data.leaderboard.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch leaders:', err);
    } finally {
      setLoadingLeaders(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '80px 20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '52px', marginBottom: '16px', fontWeight: '700' }}>
            Nomadic Big Year 2026
          </h1>
          <p style={{ fontSize: '24px', marginBottom: '40px', opacity: 0.9 }}>
            A birding competition for full-time RVers
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/leaderboard"
              className="btn"
              style={{
                backgroundColor: 'white',
                color: '#667eea',
                fontSize: '18px',
                padding: '14px 32px',
                fontWeight: '600'
              }}
            >
              View Leaderboard
            </Link>
            <Link
              to="/login"
              className="btn"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                fontSize: '18px',
                padding: '12px 32px',
                fontWeight: '600'
              }}
            >
              Join the Competition
            </Link>
          </div>
        </div>
      </div>

      {/* Current Leaders Preview */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '60px 20px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            Current Leaders
          </h2>

          {loadingLeaders ? (
            <div style={{ textAlign: 'center', color: '#666' }}>Loading...</div>
          ) : topBirders.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {topBirders.map((birder, index) => (
                <div
                  key={birder.user_id}
                  className="card"
                  style={{
                    textAlign: 'center',
                    minWidth: '180px',
                    flex: '1',
                    maxWidth: '220px'
                  }}
                >
                  <div style={{
                    fontSize: '32px',
                    marginBottom: '8px',
                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '18px', color: '#333' }}>
                    {birder.name}
                  </div>
                  <div style={{ color: '#667eea', fontSize: '24px', fontWeight: '700' }}>
                    {birder.species_count}
                  </div>
                  <div style={{ color: '#999', fontSize: '14px' }}>species</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666' }}>
              No participants yet. Be the first to join!
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link to="/leaderboard" style={{ color: '#667eea', fontWeight: '500' }}>
              View Full Leaderboard →
            </Link>
          </div>
        </div>
      </div>

      {/* What is a Big Year */}
      <div style={{ padding: '60px 20px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
            What is a Big Year?
          </h2>
          <p style={{
            textAlign: 'center',
            color: '#666',
            lineHeight: '1.8',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            A Big Year is a personal challenge to see as many bird species as possible
            within a single calendar year. Birders across North America have been
            doing Big Years for decades, and now full-time RVers have a unique
            advantage: the freedom to follow the birds wherever they go!
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '60px 20px' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '40px', color: '#333' }}>
            How It Works
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 auto 16px'
              }}>1</div>
              <h3 style={{ marginBottom: '8px', color: '#333' }}>Sign Up</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Create an account with just your email. No password needed!
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 auto 16px'
              }}>2</div>
              <h3 style={{ marginBottom: '8px', color: '#333' }}>Bird</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Go birding as you travel and log your sightings in eBird.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 auto 16px'
              }}>3</div>
              <h3 style={{ marginBottom: '8px', color: '#333' }}>Upload</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Export your eBird data as CSV and upload it here monthly.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 auto 16px'
              }}>4</div>
              <h3 style={{ marginBottom: '8px', color: '#333' }}>Compete</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Watch your ranking climb on the leaderboard!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Who Can Participate */}
      <div style={{ padding: '60px 20px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
            Who Can Participate?
          </h2>
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <ul style={{
              color: '#666',
              lineHeight: '2',
              fontSize: '16px',
              paddingLeft: '20px'
            }}>
              <li>Full-time RVers and van lifers</li>
              <li>Nomads traveling across the country</li>
              <li>Anyone living life on the road!</li>
            </ul>
            <p style={{
              marginTop: '20px',
              color: '#999',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              This is a community competition based on the honor system.
              We trust that all participants are full-time travelers.
            </p>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '60px 20px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
            Competition Rules
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div className="card">
              <h3 style={{ marginBottom: '10px', color: '#667eea' }}>Dates</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                January 1 - December 31, 2026. All observations must fall within this year.
              </p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '10px', color: '#667eea' }}>Countable Species</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Only wild birds count. Hybrids, domestics, and unidentified birds are excluded.
              </p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '10px', color: '#667eea' }}>Scoring</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Each species counts once, no matter how many times you see it during the year.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{
        backgroundColor: '#667eea',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Ready to Join?</h2>
        <p style={{ marginBottom: '30px', opacity: 0.9 }}>
          Sign up today and start tracking your 2026 Big Year!
        </p>
        <Link
          to={authenticated ? "/upload" : "/login"}
          className="btn"
          style={{
            backgroundColor: 'white',
            color: '#667eea',
            fontSize: '18px',
            padding: '14px 32px',
            fontWeight: '600'
          }}
        >
          {authenticated ? "Upload Your Data" : "Get Started"}
        </Link>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#333',
        padding: '30px 20px',
        textAlign: 'center',
        color: '#999',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <Link to="/leaderboard" style={{ color: '#999', marginRight: '20px' }}>Leaderboard</Link>
          <Link to="/login" style={{ color: '#999' }}>Sign In</Link>
        </div>
        <p>Built for the nomadic birding community</p>
      </div>
    </div>
  );
}

export default HomePage;
