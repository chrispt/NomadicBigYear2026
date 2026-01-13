import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import api from '../services/api';

// Icon components for How It Works section
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

const BinocularsIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M11 6H9V4h2v2zm4-2h-2v2h2V4zM9 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm5.5-6.5L19 6c0-1.1-.9-2-2-2h-2v2h2v.5l-1 1c-.5-.3-1.1-.5-1.7-.5h-.5v2h.5c.8 0 1.5.7 1.5 1.5V13h-2.2c-.3-.6-.9-1-1.5-1H12c-.6 0-1.2.4-1.5 1H8.3v-2.5c0-.8.7-1.5 1.5-1.5H10V7h-.5c-.6 0-1.2.2-1.7.5l-1-1V6h2V4H7c-1.1 0-2 .9-2 2l-1.5 1.5c-.3.3-.5.7-.5 1.2V16c0 2.2 1.8 4 4 4 1.1 0 2-.5 2.7-1.2.5.1 1 .2 1.5.2h3.6c.5 0 1-.1 1.5-.2.7.8 1.7 1.2 2.7 1.2 2.2 0 4-1.8 4-4V8.7c0-.5-.2-.9-.5-1.2zM7 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

// Social icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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

  const steps = [
    { icon: <EmailIcon />, title: 'Sign Up', description: 'Create an account with just your email. No password needed!' },
    { icon: <BinocularsIcon />, title: 'Bird', description: 'Go birding as you travel and log your sightings in eBird.' },
    { icon: <UploadIcon />, title: 'Upload', description: 'Export your eBird data as CSV and upload it here monthly.' },
    { icon: <TrophyIcon />, title: 'Compete', description: 'Watch your ranking climb on the leaderboard!' }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <div style={{
        backgroundImage: 'url(/images/hero-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '60px 20px 50px',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 0
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title" style={{
            fontSize: '56px',
            marginBottom: '16px',
            fontWeight: '700',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Nomadic Big Year 2026
          </h1>
          <p className="hero-subtitle" style={{
            fontSize: '24px',
            marginBottom: '40px',
            opacity: 0.95,
            fontWeight: '300',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}>
            A birding competition for full-time RVers
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/leaderboard" className="btn btn-hero-primary">
              View Leaderboard
            </Link>
            <Link to="/login" className="btn btn-hero-secondary">
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ textAlign: 'center', minWidth: '180px', flex: '1', maxWidth: '220px' }}>
                  <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto 12px' }} />
                  <div className="skeleton" style={{ width: '80%', height: '20px', margin: '0 auto 8px' }} />
                  <div className="skeleton" style={{ width: '50%', height: '32px', margin: '0 auto 4px' }} />
                  <div className="skeleton" style={{ width: '40%', height: '14px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          ) : topBirders.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {topBirders.map((birder, index) => (
                <div
                  key={birder.user_id}
                  className="card card-hover"
                  style={{
                    textAlign: 'center',
                    minWidth: '180px',
                    flex: '1',
                    maxWidth: '220px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    fontSize: '36px',
                    marginBottom: '8px'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '18px', color: '#333' }}>
                    {birder.name}
                  </div>
                  <div style={{ color: '#1e88e5', fontSize: '28px', fontWeight: '700' }}>
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
            <Link to="/leaderboard" style={{ color: '#1565c0', fontWeight: '500', fontSize: '16px' }}>
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
          <h2 style={{ textAlign: 'center', marginBottom: '50px', color: '#333' }}>
            How It Works
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '30px'
          }}>
            {steps.map((step, index) => (
              <div
                key={step.title}
                style={{
                  textAlign: 'center',
                  opacity: 0,
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  animationDelay: `${index * 0.15}s`,
                  width: '200px'
                }}
              >
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  backgroundColor: '#1e88e5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 15px rgba(30, 136, 229, 0.3)'
                }}>
                  {step.icon}
                </div>
                <h3 style={{ marginBottom: '8px', color: '#333', fontSize: '18px' }}>{step.title}</h3>
                <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Who Can Participate */}
      <div style={{ padding: '60px 20px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
            Who Can Participate?
          </h2>
          <div className="card card-hover" style={{ maxWidth: '600px', margin: '0 auto' }}>
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
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <div className="card card-hover" style={{ flex: '0 0 300px' }}>
              <h3 style={{ marginBottom: '10px', color: '#1e88e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📅</span> Dates
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                January 1 - December 31, 2026. All observations must fall within this year.
              </p>
            </div>
            <div className="card card-hover" style={{ flex: '0 0 300px' }}>
              <h3 style={{ marginBottom: '10px', color: '#1e88e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🐦</span> Countable Species
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Only wild birds count. Hybrids, domestics, and unidentified birds are excluded.
              </p>
            </div>
            <div className="card card-hover" style={{ flex: '0 0 300px' }}>
              <h3 style={{ marginBottom: '10px', color: '#1e88e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏆</span> Scoring
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Each species counts once, no matter how many times you see it during the year.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Our Community */}
      <div style={{ padding: '60px 20px', backgroundColor: 'white' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: '#333' }}>
            Join Our Community
          </h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Connect with fellow nomadic birders, share sightings, and get tips!
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://www.facebook.com/groups/nomadicbigyear2026"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-social btn-facebook"
            >
              <FacebookIcon /> Facebook Group
            </a>
            <a
              href="https://chat.whatsapp.com/KIurDiZQoC04kevRfDmp3d"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-social btn-whatsapp"
            >
              <WhatsAppIcon /> WhatsApp Chat
            </a>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{
        backgroundColor: '#1e88e5',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '20px' }}>Ready to Join?</h2>
        <p style={{ marginBottom: '30px', opacity: 0.95 }}>
          Sign up today and start tracking your 2026 Big Year!
        </p>
        <Link
          to={authenticated ? "/upload" : "/login"}
          className="btn btn-cta"
        >
          {authenticated ? "Upload Your Data" : "Get Started"}
        </Link>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#1a1a2e',
        padding: '30px 20px',
        textAlign: 'center',
        color: '#999',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link to="/leaderboard" style={{ color: '#999' }}>Leaderboard</Link>
          <Link to="/login" style={{ color: '#999' }}>Sign In</Link>
          <a
            href="https://www.facebook.com/groups/nomadicbigyear2026"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#999' }}
          >
            Facebook
          </a>
        </div>
        <p>Built for the nomadic birding community</p>
      </div>
    </div>
  );
}

export default HomePage;
