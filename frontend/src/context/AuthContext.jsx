import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api';

const C=createContext(null);
const TOKEN_KEY='cem_token';

export function AuthProvider({children}){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    // sessionStorage is intentionally used so Student and Admin can be logged in
    // independently in two tabs of the same browser.
    localStorage.removeItem(TOKEN_KEY);
    const token=sessionStorage.getItem(TOKEN_KEY);
    if(!token){setLoading(false);return;}
    api.get('/auth/me')
      .then(r=>setUser(r.data.user))
      .catch(()=>{sessionStorage.removeItem(TOKEN_KEY);setUser(null);})
      .finally(()=>setLoading(false));
  },[]);

  const login=async(email,password,role)=>{
    const r=await api.post('/auth/login',{email:email.trim().toLowerCase(),password,role});
    sessionStorage.setItem(TOKEN_KEY,r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout=()=>{sessionStorage.removeItem(TOKEN_KEY);setUser(null);};
  return <C.Provider value={{user,loading,login,logout}}>{children}</C.Provider>;
}
export const useAuth=()=>useContext(C);
