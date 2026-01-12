import api from './api';

export const requestMagicLink = async (email) => {
  const response = await api.post('/auth/request-magic-link', { email });
  return response.data;
};

export const verifyMagicLink = async (token) => {
  const response = await api.get(`/auth/verify?token=${token}`);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};
