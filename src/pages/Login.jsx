import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        login(data.access_token, { username });
        navigate('/live');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 font-sans overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-500/10 rounded-2xl border border-sky-500/20 mb-6 shadow-[0_0_30px_rgba(14,165,233,0.1)]">
             <ShieldCheck className="text-sky-400" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Bioelectric <span className="text-sky-400">PINN</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase mt-2">
            Secure Neural Interface v0.1.0
          </p>
        </div>

        <div className="bg-[#131826]/80 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0e121d] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0e121d] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 py-3 px-4 rounded-xl text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2 group"
            >
              AUTHENTICATE
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs">
              Don't have an account? {' '}
              <Link to="/register" className="text-sky-400 font-bold hover:text-sky-300 transition-colors">
                Initialize Access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
