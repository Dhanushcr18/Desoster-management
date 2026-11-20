import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Shield, Truck, MapPin } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/dashboard', label: 'Disaster Alerts', icon: <Bell size={16} /> },
    { to: '/resilience', label: 'Supply Resilience', icon: <Truck size={16} />, highlight: true },
    { to: '/routes', label: 'Road Status', icon: <MapPin size={16} /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Smart Disaster Hub</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                Resilience AI
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Climate & Global Supply Platform</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : link.highlight
                    ? 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-900'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info / Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                title="Logout"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
