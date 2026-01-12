import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './services/auth';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import VerifyPage from './pages/VerifyPage';
import LeaderboardPage from './pages/LeaderboardPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';

// Component for protected routes
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route
          path="/leaderboard"
          element={
            <PrivateRoute>
              <LeaderboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <UploadPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
