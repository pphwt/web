import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Brain, Eye, EyeOff, CheckCircle2, XCircle, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState(null);
  const { login } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const pageClass = isDarkMode
    ? 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,_#07111f_0%,_#0b1220_100%)] text-white'
    : 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_30%),linear-gradient(180deg,_#f7fbff_0%,_#edf5fb_100%)] text-slate-900';

  const shellClass = isDarkMode
    ? 'border-white/10 bg-[#0b1220]/90 shadow-[0_30px_80px_rgba(0,0,0,0.45)]'
    : 'border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]';

  const leftPanelClass = isDarkMode
    ? 'bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 text-white'
    : 'bg-gradient-to-br from-sky-500 via-cyan-500 to-sky-600 text-white';

  const rightPanelClass = isDarkMode ? 'bg-slate-950' : 'bg-white';
  const titleClass = isDarkMode ? 'text-white' : 'text-slate-900';
  const bodyTextClass = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const fieldLabelClass = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const baseInputClass = isDarkMode
    ? 'auth-input w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15'
    : 'auth-input w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15';
  const usernameInputClass = baseInputClass;
  const passwordInputClass = `${baseInputClass} pr-12`;
  const themeToggleClass = isDarkMode
    ? 'border-white/10 bg-slate-950/80 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.28)] hover:bg-slate-900/90'
    : 'border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50';
  const themeToggleBadgeClass = isDarkMode
    ? 'border-white/10 bg-white/5 text-slate-100'
    : 'border-slate-200 bg-slate-50 text-slate-700';
  const linkClass = isDarkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800';
  const modalBackdropClass = isDarkMode ? 'bg-slate-900/60 backdrop-blur-sm' : 'bg-slate-200/40 backdrop-blur-sm';
  const modalCardClass = isDarkMode
    ? 'border-white/10 bg-slate-950/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
    : 'border-slate-200 bg-white text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.12)]';
  const modalMessageClass = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const modalRetryClass = isDarkMode
    ? 'w-full rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98]'
    : 'w-full rounded-2xl bg-sky-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98]';
  const modalSuccessPanelClass = isDarkMode
    ? 'flex items-center justify-center gap-2.5 rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-3 text-sm text-sky-200'
    : 'flex items-center justify-center gap-2.5 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setModalState(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': '69420' },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        login(data.access_token, { username });
        setModalState({
          type: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          message: 'กำลังพาไปยังหน้าหลักของระบบ กรุณารอสักครู่',
        });
        window.setTimeout(() => navigate('/page/overview'), 1500);
      } else {
        let detail = 'Invalid username or password';

        try {
          const payload = await response.json();
          detail = payload?.detail || detail;
        } catch {
          // Keep the fallback message when the body is not JSON.
        }

        setError(detail);
        setModalState({
          type: 'error',
          title: response.status >= 500 ? 'ระบบขัดข้องชั่วคราว' : 'เข้าสู่ระบบไม่สำเร็จ',
          message:
            response.status >= 500
              ? 'เซิร์ฟเวอร์ไม่ตอบสนองหรือเชื่อมต่อบริการภายนอกไม่ได้ กรุณาลองใหม่อีกครั้งในภายหลัง'
              : detail === 'Invalid username or password'
                ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
                : detail,
        });
      }
    } catch (error) {
      setError('Connection failed');
      setModalState({
        type: 'error',
        title: 'เชื่อมต่อไม่ได้',
        message: error?.message
          ? 'ไม่สามารถติดต่อ API ได้ กรุณาตรวจสอบเครือข่ายหรือเซิร์ฟเวอร์'
          : 'ไม่สามารถติดต่อ API ได้ กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${pageClass} flex items-center justify-center p-4 sm:p-6 overflow-hidden`}>
      <AnimatePresence>
        {modalState && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          >
            <div className={`absolute inset-0 ${modalBackdropClass}`} />

            <motion.div
              key="modal-card"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`relative w-full max-w-sm overflow-hidden rounded-[20px] border ${modalCardClass} backdrop-blur-2xl`}
            >
              <div className="p-7 text-center">
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border ${modalState.type === 'success' ? 'border-sky-400/20 bg-sky-400/10 text-sky-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}`}>
                  {modalState.type === 'success'
                    ? <CheckCircle2 size={30} strokeWidth={1.75} />
                    : <XCircle size={30} strokeWidth={1.75} />
                  }
                </div>

                <h3 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{modalState.title}</h3>
                <p className={`mt-3 text-sm leading-7 ${modalMessageClass}`}>{modalState.message}</p>

                <div className="mt-6">
                  {modalState.type === 'success' ? (
                    <div className={modalSuccessPanelClass}>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-sky-300 shrink-0" />
                      กำลังเตรียมหน้าถัดไป...
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalState(null)}
                      className={modalRetryClass}
                    >
                      ลองใหม่
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`relative w-full max-w-[1080px] overflow-hidden rounded-[28px] border ${shellClass} backdrop-blur-xl`}>
        <button
          type="button"
          onClick={toggleTheme}
          className={`absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition ${themeToggleClass}`}
          aria-label={isDarkMode ? 'สลับเป็น Light Theme' : 'สลับเป็น Dark Theme'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          {isDarkMode ? 'Light Theme' : 'Dark Theme'}
        </button>
        <div className="grid min-h-[680px] lg:grid-cols-[1.02fr_0.98fr]">
          {/* Left Panel - Branding */}
          <div className={`hidden lg:flex flex-col justify-between ${leftPanelClass} p-10 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_30%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
                <Brain size={18} />
                Bioelectric PINN
              </div>
              <div className="mt-16 max-w-md">
                <h2 className="text-4xl font-bold leading-tight">เข้าสู่ระบบสำหรับงานวิเคราะห์สัญญาณประสาทอย่างปลอดภัย</h2>
                <p className="mt-5 text-base leading-7 text-white/85">
                  เข้าสู่แพลตฟอร์มเพื่อเฝ้าดูสัญญาณ ตรวจสอบรายงาน และจัดการงานวินิจฉัยผู้ป่วยได้ในที่เดียว
                </p>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/15 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 border border-white/20">
                  <Brain size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Bioelectric</p>
                  <p className="text-sm text-white/80">ระบบวินิจฉัยประสาทขั้นสูง</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className={`flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 ${rightPanelClass}`}>
            <div className="w-full max-w-md">
              <div className="lg:hidden mb-8">
                <div className={`inline-flex items-center gap-3 rounded-full px-4 py-2 border ${themeToggleBadgeClass}`}>
                  <Brain size={18} />
                  Bioelectric PINN
                </div>
              </div>

              <div className="mb-6 pt-10">
                <div>
                  <h2 className={`text-3xl font-bold ${titleClass}`}>เข้าสู่ระบบ</h2>
                  <p className={`mt-2 text-sm ${bodyTextClass}`}>กรอกข้อมูลเพื่อเข้าสู่ระบบบัญชีของคุณ</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`mb-2 block text-sm font-medium ${fieldLabelClass}`}>ชื่อผู้ใช้</label>
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="example@email.com"
                    className={usernameInputClass}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className={`block text-sm font-medium ${fieldLabelClass}`}>รหัสผ่าน</label>
                    <a href="#" className={`text-sm font-medium ${linkClass}`}>
                      ลืมรหัสผ่าน?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className={passwordInputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition ${isDarkMode ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={`rounded-xl border px-4 py-3 text-sm ${isDarkMode ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-700'}`}>
                    {error === 'Invalid username or password' ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' : 'เชื่อมต่อไม่สำเร็จ'}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : (
                    'เข้าสู่ระบบ'
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
