import api from './axios';

export const getPost = () => api.get('/posts');

export const storePost = (data) => api.post('/posts', data);