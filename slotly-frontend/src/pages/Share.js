// src/pages/Share.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Share() {
  const navigate = useNavigate();

  // 用环境变量或当前站点作为前端基址
  const PUBLIC_BASE =
    process.env.REACT_APP_PUBLIC_BASE ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const [visibility, setVisibility] = useState('public');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  // 监听 storage，防止本页打开时用户名还没更新
  useEffect(() => {
    const handler = () => {
      setUsername(localStorage.getItem('username') || '');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // 根据登录状态和可见性生成分享链接
  const slug = isLoggedIn && username ? encodeURIComponent(username) : 'yourname';
  const shareUrl = `${PUBLIC_BASE}/${slug}?visibility=${visibility}`;

  const copyLink = () => {
    if (!isLoggedIn) {
      // 未登录 → 跳转到登录页面并带提示
      navigate('/login', {
        state: { from: '/share', reason: 'copy_requires_login', message: 'You need to log in first!' }
      });
      return;
    }

    navigator.clipboard.writeText(shareUrl)
      .then(() => alert('Link copied!'))
      .catch(() => alert('Failed to copy link.'));
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Share Your Schedule</h2>

      <div className="mb-6">
        <h3 className="font-medium mb-2">Who can see your schedule?</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
              className="mt-1 accent-blue-600"
            />
            <span>
              <strong>Public</strong>
              <p className="text-sm text-gray-500">
                Anyone with the link can see both the time slots and task names.
              </p>
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
              className="mt-1 accent-blue-600"
            />
            <span>
              <strong>Private</strong>
              <p className="text-sm text-gray-500">
                Only the time slots will be visible, task names will be hidden.
              </p>
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          id="shareLink"
          readOnly
          value={shareUrl}
          className="flex-1 border px-3 py-2 rounded bg-gray-100"
        />
        <button
          type="button"
          onClick={copyLink}
          className={`px-4 py-2 rounded text-white ${
            isLoggedIn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500'
          }`}
        >
          Copy
        </button>
      </div>
    </div>
  );
}
