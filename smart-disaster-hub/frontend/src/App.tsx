import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Contact from './components/Contact';
import AIChat from './components/AIChat';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        
        {/* Admin Routes - Separate from user routes */}
        <Route 
          path="/admin/login" 
          element={!user ? <AdminLogin /> : <Navigate to="/admin" />} 
        />
        <Route 
          path="/admin" 
          element={user ? <AdminDashboard /> : <Navigate to="/admin/login" />} 
        />
        
        {/* User Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/dashboard" />} 
        />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      
      {/* AI Chat Assistant - Available on all pages when user is logged in */}
      {user && <AIChat />}
    </BrowserRouter>
  );
}

export default App;
