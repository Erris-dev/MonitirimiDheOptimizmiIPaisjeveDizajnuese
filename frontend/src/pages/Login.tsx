import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /**
   * 🔐 Auto-redirect if already authenticated
   * This prevents logged-in users from seeing login page
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        await api.get('/auth/me'); // Cookie validated by backend
        navigate('/dashboard');
      } catch {
        // Not authenticated — stay on login
      }
    };

    checkSession();
  }, [navigate]);

  /**
   * 📧 Email/Password Login
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/login', { email, password });

      // No localStorage.
      // Backend already set HttpOnly cookies.
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Connection error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔵 Google OAuth Login
   */
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost/api/auth/google/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 overflow-hidden relative">
      
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 p-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
        
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to continue to SerenePulse
          </p>
        </div>

        {/* Email Form */}
        <form className="mt-8 space-y-5" onSubmit={handleEmailLogin}>
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20 animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 
                     0 0 5.373 0 12h4zm2 
                     5.291A7.962 7.962 0 
                     014 12H0c0 3.042 
                     1.135 5.824 3 
                     7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 bg-slate-900 text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full inline-flex justify-center items-center py-3 px-4 bg-white hover:bg-gray-100 border border-transparent rounded-lg text-sm font-semibold text-gray-900 transition-colors"
        >
          <img
            className="h-5 w-5 mr-3"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
          />
          Sign in with Google
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
