import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, type JSX } from 'react';
import LoginPage from './pages/Login';
import Dashboard from './pages/MainPage';
import api from './lib/axios';

/**
 * Backend-driven Protected Route
 * Validates session via /auth/me using HttpOnly cookies
 */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        // This request automatically includes HttpOnly cookies
        await api.get('/auth/me');
        setIsAuthenticated(true);
      } catch (err) {
        console.log('Session invalid or expired');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // While checking auth → show nothing or loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authenticated → allow route
  if (isAuthenticated) {
    return children;
  }

  // If not authenticated → redirect
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="bg-[#0f172a] min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate replace to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
