import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, School, Book, IdCard, GraduationCap, MapPin, Calendar, Clock, CheckCircle, Edit3, Trash2, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const isMyProfile = currentUser?.id === id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/profiles/${id}`);
      setProfile(res.data);
      setEditData(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải trang cá nhân');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/profiles/me', editForm);
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      fetchProfile();
      refreshUser();
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:text-white">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] p-4 sm:p-10 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
             <div className="absolute -bottom-16 left-10">
                <div className="w-32 h-32 rounded-3xl bg-white dark:bg-slate-800 p-2 shadow-2xl border-4 border-white dark:border-slate-800">
                   <div className="w-full h-full rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">
                      <User size={64} />
                   </div>
                </div>
             </div>
          </div>
          
          <div className="pt-20 pb-10 px-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div>
                <h1 className="text-4xl font-black tracking-tight">{profile.name}</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{profile.badge} • Cấp bậc {profile.level}</p>
                <div className="flex gap-4 mt-4 text-sm text-slate-400 font-medium">
                   <span className="flex items-center gap-1.5"><Calendar size={14}/> Tham gia {new Date(profile.createdAt).toLocaleDateString()}</span>
                   <span className="flex items-center gap-1.5"><Book size={14}/> {profile.submissions?.length || 0} bài tập đã làm</span>
                </div>
             </div>
             {isMyProfile && (
               <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all">
                  <Edit3 size={18} /> {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa Profile'}
               </button>
             )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Left Info Column */}
           <div className="lg:col-span-4 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                 <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Thông tin cá nhân</h3>
                 
                 {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Họ tên</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold" value={editForm.name} onChange={(e) => setEditData({...editForm, name: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Tuổi</label>
                          <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold" value={editForm.age || ''} onChange={(e) => setEditData({...editForm, age: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Trường</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold" value={editForm.school || ''} onChange={(e) => setEditData({...editForm, school: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Lớp</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold" value={editForm.className || ''} onChange={(e) => setEditData({...editForm, className: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">MSSV</label>
                          <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold" value={editForm.studentId || ''} onChange={(e) => setEditData({...editForm, studentId: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Giới tính</label>
                          <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold" value={editForm.gender || ''} onChange={(e) => setEditData({...editForm, gender: e.target.value})}>
                             <option value="">Chọn...</option>
                             <option value="Nam">Nam</option>
                             <option value="Nữ">Nữ</option>
                             <option value="Khác">Khác</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Tiểu sử</label>
                          <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-medium" rows={3} value={editForm.bio || ''} onChange={(e) => setEditData({...editForm, bio: e.target.value})}></textarea>
                       </div>
                       <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/20">LƯU THAY ĐỔI</button>
                    </form>
                 ) : (
                    <div className="space-y-5">
                       <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><IdCard size={20}/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">MSSV</p><p className="font-bold">{profile.studentId || 'Chưa cập nhật'}</p></div>
                       </div>
                       <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><School size={20}/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">Trường</p><p className="font-bold">{profile.school || 'Chưa cập nhật'}</p></div>
                       </div>
                       <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center"><GraduationCap size={20}/></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase">Lớp</p><p className="font-bold">{profile.className || 'Chưa cập nhật'}</p></div>
                       </div>
                       <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                          <p className="text-xs font-medium italic">"{profile.bio || 'Hãy viết gì đó về bản thân bạn...'}"</p>
                       </div>
                    </div>
                 )}
              </motion.div>
           </div>

           {/* Right History Column */}
           <div className="lg:col-span-8 space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                 <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Lịch sử làm bài gần đây</h3>
                 <div className="space-y-4">
                    {profile.submissions?.map((s: any) => (
                       <div key={s.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-indigo-500/20 transition-all flex justify-between items-center group">
                          <div>
                             <h4 className="font-bold">{s.assignment?.title}</h4>
                             <p className="text-[10px] font-black text-indigo-500 uppercase">{s.assignment?.language}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-lg text-indigo-600">{s.score} <span className="text-[10px] text-slate-400">PTS</span></p>
                             <p className="text-[10px] font-bold text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                    ))}
                    {(!profile.submissions || profile.submissions.length === 0) && (
                       <p className="text-center py-10 text-slate-400 font-bold">Chưa có bài tập nào được hoàn thành.</p>
                    )}
                 </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
                 <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Bảng tin cá nhân</h3>
                 <div className="space-y-6">
                    {profile.posts?.map((p: any) => (
                       <div key={p.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl relative">
                          <p className="text-sm leading-relaxed">{p.content}</p>
                          <span className="block mt-4 text-[9px] font-black text-slate-400 uppercase">{new Date(p.createdAt).toLocaleString()}</span>
                       </div>
                    ))}
                    {(!profile.posts || profile.posts.length === 0) && (
                       <p className="text-center py-10 text-slate-400 font-bold italic">Chưa có bài đăng nào.</p>
                    )}
                 </div>
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
