// src/pages/Login.jsx
import React, { useState } from 'react';
import { login as apiLogin, USERNAME_KEY } from '../lib/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('lauren_demo1@example.com'); // 便于你直接测试
  const [password, setPassword] = useState('DemoPass123!');        // 便于你直接测试
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const data = await apiLogin(email.trim(), password);
      // 成功后，api.js 已经把 token/username 存入 localStorage
      // 这里触发上层 App 的登录回调，刷新头部和路由
      if (typeof onLogin === 'function') onLogin();
    } catch (err) {
      // 后端 401/404 会走这里
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Login failed';
      setError(msg);
      // 小提示：检查 localStorage 的 username 是否已被后端返回
      // console.debug('username in LS:', localStorage.getItem(USERNAME_KEY));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Login</h2>
      <p className="text-sm text-gray-500 mb-6">
        使用你刚在后端创建的账号登录（我们已为你预填了 demo 账号，直接点 <b>Sign in</b> 即可验证）。
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
