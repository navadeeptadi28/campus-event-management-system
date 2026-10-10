import axios from 'axios';
export const API_URL=import.meta.env.VITE_API_URL||'http://localhost:5000/api';
const api=axios.create({baseURL:API_URL});
api.interceptors.request.use(c=>{
  const t=sessionStorage.getItem('cem_token');
  if(t)c.headers.Authorization=`Bearer ${t}`;
  return c;
});
api.interceptors.response.use(r=>r,e=>{
  if(e.response?.status===401){sessionStorage.removeItem('cem_token');}
  return Promise.reject(e);
});
export default api;
