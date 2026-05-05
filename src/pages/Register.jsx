import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Mail, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const data = await response.json();
        // Handle FastAPI validation errors (array) vs custom errors (string)
        const errorMessage = Array.isArray(data.detail) 
          ? `${data.detail[0].loc.join('.')}: ${data.detail[0].msg}`
          : (data.detail || 'Registration failed');
        setError(errorMessage);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
             <UserPlus className="text-emerald-400" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Initialize <span className="text-emerald-400">Identity</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase mt-2">
            Create Neural Profile v0.1.0
          </p>
        </div>

        <div className="bg-[#131826]/80 backdrop-blur-2xl border border-white/5 p-10 rounded-[2.5rem] shadow-2xl">
          {success ? (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <ArrowRight className="text-white" size={40} />
               </div>
               <h2 className="text-xl font-bold text-white mb-2">Registration Complete</h2>
               <p className="text-slate-500 text-sm">Redirecting to Login Interface...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-[#0e121d] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Username</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input 
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-[#0e121d] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                    placeholder="Choose username"
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
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#0e121d] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
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
                className="w-full bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
              >
                CREATE PROFILE
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-slate-500 text-xs">
                Already have a profile? {' '}
                <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                  Login Access
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
