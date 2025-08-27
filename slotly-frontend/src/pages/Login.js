// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Login({ onLogin }) {
  // API 基址：生产在 .env.production 配置 REACT_APP_API_BASE
  const API = process.env.REACT_APP_API_BASE || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.signupSuccess) {
      setSuccessMsg('Account created successfully. Please log in.');
    }
    if (location.state?.message) {
      setInfoMsg(location.state.message);
    } else if (location.state?.reason === 'copy_requires_login') {
      setInfoMsg('You need to log in first');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Invalid email or password');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      setErrorMsg('');
      onLogin?.(data.username);
    } catch (err) {
      console.error('❌ Login error:', err.message);
      setErrorMsg('Invalid email or password');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        {infoMsg && <p className="text-blue-600 mb-2 text-center">{infoMsg}</p>}
        {successMsg && <p className="text-green-600 mb-2">{successMsg}</p>}
        {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Log In
        </button>
      </form>
    </div>
  );
}
