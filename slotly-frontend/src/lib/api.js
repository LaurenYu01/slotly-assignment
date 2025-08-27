// src/lib/api.js
import axios from 'axios';

// ===== Storage keys =====
export const TOKEN_KEY = 'token';
export const USERNAME_KEY = 'username';

// ===== Base URL =====
const ENV_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/+$/, '');
const baseURL = ENV_BASE ? `${ENV_BASE}/api` : '/api';

// ===== Axios 实例 =====
const api = axios.create({
  baseURL,
  withCredentials: true,
});

// 每次请求自动带上 Authorization 头
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ===== API 方法 =====
export const signup = (username, email, password) =>
  api.post('/signup', { username, email, password }).then((r) => r.data);

export const login = async (email, password) => {
  const { data } = await api.post('/login', { email, password });
  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  if (data?.username) {
    localStorage.setItem(USERNAME_KEY, data.username);
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
};

export const getTasks = () => api.get('/tasks').then((r) => r.data);
export const saveTasks = (tasks) => api.post('/tasks', { tasks }).then((r) => r.data);
export const getTaskStats = () => api.get('/tasks/stats').then((r) => r.data);

export const createSchedule = (title, start_time, end_time) =>
  api.post('/schedule', { title, start_time, end_time }).then((r) => r.data);
export const getSchedule = () => api.get('/schedule').then((r) => r.data);

export default api;
