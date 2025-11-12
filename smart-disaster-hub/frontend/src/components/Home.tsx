import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Users, MapPin, Bell, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 sm:p-2 rounded-lg shadow-lg">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                DisasterAlert
              </span>
            </div>
            <div className="hidden lg:flex space-x-6 xl:space-x-8">
              <a href="#home" className="text-gray-700 hover:text-emerald-600 font-semibold transition-all duration-200 hover:scale-105">HOME</a>
              <Link to="/dashboard" className="text-gray-700 hover:text-emerald-600 font-semibold transition-all duration-200 hover:scale-105">DASHBOARD</Link>
              <a href="#features" className="text-gray-700 hover:text-emerald-600 font-semibold transition-all duration-200 hover:scale-105">FEATURES</a>
              <Link to="/contact" className="text-gray-700 hover:text-emerald-600 font-semibold transition-all duration-200 hover:scale-105">CONTACT</Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="hidden sm:inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm rounded-full hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold transition-all duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg font-semibold transition-all duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:shadow-xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 transform -skew-y-3"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 md:w-72 md:h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 md:w-72 md:h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 md:w-72 md:h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-emerald-100 rounded-full shadow-lg animate-bounce-slow">
              <p className="text-xs sm:text-sm text-emerald-700 font-semibold flex items-center space-x-2">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
                <span>✨ Live Monitoring Active</span>
              </p>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Early Alerts, Smart Coordination
              <span className="block mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-gradient">
                Saving Lives with Technology
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
              A comprehensive disaster management system that connects citizens, rescuers, 
              and authorities in real-time during emergencies.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-base sm:text-lg font-semibold hover:shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center justify-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>View Dashboard</span>
                </span>
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-full text-base sm:text-lg font-semibold hover:bg-emerald-50 hover:shadow-lg transition-all duration-300"
              >
                <span className="flex items-center justify-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Report Disaster</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 sm:mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-red-100 animate-fade-in">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">1,247</div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Alerts Sent to Communities</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-emerald-100 animate-fade-in animation-delay-100">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">8,943</div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Lives Saved</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-blue-100 animate-fade-in animation-delay-200 sm:col-span-2 md:col-span-1">
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">24/7</div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Monitoring Active</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white via-gray-50 to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
            <div className="inline-block mb-4 px-4 py-2 bg-emerald-100 rounded-full">
              <p className="text-emerald-700 font-semibold text-sm">✨ Powerful Features</p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose DisasterAlert?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Advanced technology for comprehensive disaster management and community safety</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-red-100 animate-slide-up">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Real-Time Alerts</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Instant notifications about disasters in your area with severity levels and safety instructions.</p>
            </div>
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-blue-100 animate-slide-up animation-delay-100">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Interactive Maps</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Visual representation of disaster zones with geolocation tracking and safe route guidance.</p>
            </div>
            <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-emerald-100 animate-slide-up animation-delay-200 md:col-span-2 lg:col-span-1">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Community Coordination</h3>
              <p className="text-gray-600">Connect with neighbors, report your status, and coordinate rescue efforts effectively.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Stay Safe?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of users who trust DisasterAlert for real-time emergency updates.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-emerald-600 rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold text-white">DisasterAlert</span>
              </div>
              <p className="text-sm">Saving lives through technology and real-time coordination.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition">Home</a></li>
                <li><Link to="/dashboard" className="hover:text-emerald-400 transition">Dashboard</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Alerts</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-emerald-400 transition">Contact Us</Link></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Emergency Help</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Report Issue</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Emergency</h4>
              <p className="text-sm mb-2">24/7 Hotline:</p>
              <p className="text-2xl font-bold text-emerald-400">911</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 DisasterAlert. All rights reserved.</p>
            <p className="mt-2 text-xs text-gray-600">
              <Link to="/admin/login" className="hover:text-gray-500 transition">
                Administrator Access
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
