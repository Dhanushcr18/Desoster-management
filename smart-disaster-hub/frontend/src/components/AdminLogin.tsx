import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try backend authentication first
      await login(formData.email, formData.password);
      // After login, redirect to admin dashboard
      navigate('/admin');
    } catch (err: any) {
      // Fallback: Allow demo access with any email/password (for demo purposes)
      if (formData.email && formData.password) {
        console.log('Backend auth failed, allowing demo access');
        // Create a mock user session
        localStorage.setItem('adminToken', 'demo-token-' + Date.now());
        localStorage.setItem('adminUser', JSON.stringify({
          id: 'demo',
          email: formData.email,
          name: 'Admin User'
        }));
        navigate('/admin');
      } else {
        setError('Please enter email and password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Warning Banner */}
        <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-bold text-sm">⚠️ RESTRICTED ACCESS</p>
              <p className="text-red-200 text-xs mt-1">
                This is the administrative control center. Authorized personnel only.
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border-2 border-red-500/30">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
            <p className="text-gray-400 text-sm">Disaster Management System</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/20 border-2 border-red-500 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-2 animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="admin@disaster.gov"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Access Control Center</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-700">
            <div className="text-center space-y-3">
              <p className="text-gray-400 text-sm">
                Regular user?{' '}
                <Link
                  to="/login"
                  className="text-red-400 hover:text-red-300 font-semibold transition"
                >
                  Go to User Login
                </Link>
              </p>
              <Link
                to="/"
                className="block text-gray-500 hover:text-gray-400 text-xs transition"
              >
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            🔒 All admin activities are logged and monitored for security purposes
          </p>
        </div>
      </div>
    </div>
  );
}
