import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Checklist from './pages/Checklist';
import Share from './pages/Share';
import Login from './pages/Login';
import Signup from './pages/Signup';

import { TOKEN_KEY, USERNAME_KEY, logout as apiLogout } from './lib/api';

function MainApp() {
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem('currentTab') || 'dashboard'; // 从 localStorage 读取
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState(localStorage.getItem(USERNAME_KEY) || '');
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    localStorage.setItem('currentTab', currentTab); // 切换 tab 时保存
  }, [currentTab]);

  const handleLogout = () => {
    apiLogout();
    setIsLoggedIn(false);
    setUsername('');
    navigate('/login');
  };

  const handleLogin = (loggedInUsername) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername || '');
    setCurrentTab('dashboard');
    navigate('/');
  };

  const handleLogoClick = () => {
    setCurrentTab('dashboard');
    if (isAuthPage || location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="flex justify-between items-center px-6 py-4 bg-white shadow">
        <div>
          <Link to="/" onClick={handleLogoClick}>
            <h1 className="text-3xl font-bold text-blue-600">Slotly</h1>
          </Link>
          <p className="text-sm text-gray-500">
            make your time manageable, shareable, and bookable.
          </p>
        </div>
        <div className="space-x-4">
          {isLoggedIn ? (
            <>
              <span className="text-blue-600 font-semibold">{username}</span>
              <button onClick={handleLogout} className="text-blue-600 hover:underline">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
              <Link to="/signup" className="text-blue-600 hover:underline">Signup</Link>
            </>
          )}
        </div>
      </div>

      {!isAuthPage && (
        <>
          <div className="flex justify-start space-x-8 bg-white py-3 shadow-sm px-6">
            <button
              className={`text-lg font-medium ${currentTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`text-lg font-medium ${currentTab === 'checklist' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setCurrentTab('checklist')}
            >
              Checklist
            </button>
            <button
              className={`text-lg font-medium ${currentTab === 'share' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              onClick={() => setCurrentTab('share')}
            >
              Share
            </button>
          </div>

          <div className="p-6">
            <div style={{ display: currentTab === 'dashboard' ? 'block' : 'none' }}>
              <Dashboard />
            </div>
            <div style={{ display: currentTab === 'checklist' ? 'block' : 'none' }}>
              <Checklist />
            </div>
            <div style={{ display: currentTab === 'share' ? 'block' : 'none' }}>
              <Share />
            </div>
          </div>
        </>
      )}

      <Routes>
        <Route path="/" element={<></>} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
