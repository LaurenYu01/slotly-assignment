// src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup as apiSignup } from '../lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('lauren_demo1');
  const [email, setEmail] = useState('lauren_demo1@example.com');
  const [password, setPassword] = useState('DemoPass123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setOk('');

    try {
      const data = await apiSignup(username.trim(), email.trim(), password);
      // 成功注册后，引导去登录页（也可以选择这里自动登录）
      setOk('Signup success. Redirecting to login…');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Signup failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Signup</h2>
      <p className="text-sm text-gray-500 mb-6">
        创建一个新账户。若你已在后端手动创建过 demo 用户，此处可以直接去 <b>Login</b>。
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      {ok && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">
          {ok}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-700">Username</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your name"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Email</span>
          <input
            type="email"
            className="mt-1 w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Password</span>
          <input
            type="password"
            className="mt-1 w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
