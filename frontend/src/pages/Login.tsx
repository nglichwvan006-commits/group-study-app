import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, Mail, Lock, ShieldCheck, UserPlus, X, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Support Modal State
  const [showSupport, setShowSupport] = useState(false);
  const [supportData, setSupportData] = useState({ name: '', email: '', message: '' });
  const [supportHistory, setSupportHistory] = useState<any[]>([]);
  const [isCheckingHistory, setIsCheckingHistory] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const endpoint = isLoginView ? '/auth/login' : '/auth/register';
    const payload = isLoginView 
      ? { email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password, name: formData.name };

    try {
      const response = await api.post(endpoint, payload);
      login(response.data.accessToken, response.data.refreshToken, response.data.user);
      toast.success(isLoginView ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
      toast.error(err.response?.data?.message || 'Lỗi xác thực');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      alert("Lỗi: Chưa cấu hình địa chỉ Backend (VITE_API_URL). Vui lòng kiểm tra lại Vercel.");
      return;
    }
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Đang gửi tin nhắn...');
    try {
      await api.post('/support', supportData);
      toast.success('Đã gửi tin nhắn đến Admin! Bạn có thể kiểm tra phản hồi sau bằng Email này.', { id: loadingToast });
      setSupportData({ ...supportData, message: '' });
      fetchSupportHistory();
    } catch (error) {
      toast.error('Lỗi khi gửi tin nhắn', { id: loadingToast });
    }
  };

  const fetchSupportHistory = async () => {
    if (!supportData.email) return;
    setIsCheckingHistory(true);
    try {
      const res = await api.get(`/support/check?email=${supportData.email}`);
      setSupportHistory(res.data);
    } catch (error) {
      console.error('Error fetching support history');
    } finally {
      setIsCheckingHistory(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 p-4 sm:p-8 relative overflow-hidden transition-colors duration-500">
      
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-purple-300/30 dark:bg-purple-900/20 blur-3xl"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-indigo-300/30 dark:bg-indigo-900/20 blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full z-10"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/50 p-8 sm:p-10 space-y-8">
          
          <div className="text-center space-y-2">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 overflow-hidden"
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-4">Gõ Thủng Bàn Phím</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {isLoginView ? 'Chào mừng bạn quay trở lại' : 'Gia nhập cộng đồng học tập'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode='wait'>
              {!isLoginView && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Họ tên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserPlus className="text-slate-400" size={18} />
                    </div>
                    <input
                      type="text"
                      required={!isLoginView}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Nguyễn Văn A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-slate-400" size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="member@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-slate-400" size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xử lý...
                </span>
              ) : (
                <>{isLoginView ? <><LogIn size={20} /> Đăng nhập</> : <><UserPlus size={20} /> Đăng ký tài khoản</>}</>
              )}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline underline-offset-4"
            >
              {isLoginView ? 'Bạn chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập tại đây'}
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">Chỉ dành cho Admin</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Đăng nhập Google (Admin)
          </button>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-4">Liên hệ hỗ trợ</p>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="mailto:nglich.wvan006@gmail.com"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-all group"
              >
                <Mail className="text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Gửi Email</span>
              </a>
              <button 
                onClick={() => setShowSupport(true)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all group"
              >
                <ShieldCheck className="text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase">Nhắn Admin</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-4 font-medium italic">Email: nglich.wvan006@gmail.com</p>
          </div>
        </div>
      </motion.div>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Trung tâm hỗ trợ</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gửi tin nhắn trực tiếp cho Admin</p>
                </div>
                <button onClick={() => setShowSupport(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2 text-left">
                <form onSubmit={handleSendSupport} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Tên của bạn</label>
                      <input 
                        type="text" 
                        placeholder="VD: Nguyễn Văn A" 
                        required 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" 
                        value={supportData.name} 
                        onChange={(e) => setSupportData({ ...supportData, name: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Email liên hệ</label>
                      <input 
                        type="email" 
                        placeholder="email@example.com" 
                        required 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm" 
                        value={supportData.email} 
                        onChange={(e) => setSupportData({ ...supportData, email: e.target.value })}
                        onBlur={fetchSupportHistory}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Nội dung cần hỗ trợ</label>
                    <textarea 
                      placeholder="Chào Admin, mình gặp lỗi..." 
                      required 
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm" 
                      value={supportData.message} 
                      onChange={(e) => setSupportData({ ...supportData, message: e.target.value })} 
                    />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
                    <Send size={18} /> GỬI TIN NHẮN
                  </button>
                </form>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-slate-500 tracking-tighter">Lịch sử phản hồi</h4>
                    {isCheckingHistory && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                  
                  {supportHistory.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <MessageCircle className="mx-auto mb-2 text-slate-300" size={32} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">Nhập Email để xem phản hồi từ Admin</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supportHistory.map((h) => (
                        <div key={h.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                          <div className="flex justify-between items-start">
                             <p className="text-xs font-bold text-slate-700 dark:text-slate-300">"{h.message}"</p>
                             <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(h.createdAt).toLocaleDateString()}</span>
                          </div>
                          {h.reply ? (
                            <div className="pl-4 border-l-2 border-indigo-500 pt-1">
                              <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Admin phản hồi:</p>
                              <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-lg">
                                {h.reply}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1 italic">
                              <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div> Đang chờ xử lý...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
