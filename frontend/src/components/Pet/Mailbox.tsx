import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, Trash2, Bell, Clock, Inbox } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Mailbox: React.FC = () => {
  const [mails, setMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMails();
  }, []);

  const fetchMails = async () => {
    try {
      const response = await api.get('/mailbox');
      setMails(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await api.patch(`/mailbox/${id}/read`);
      setMails(mails.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/mailbox/${id}`);
      setMails(mails.filter(m => m.id !== id));
      toast.success('Đã xóa thư');
    } catch (error) {
      toast.error('Lỗi khi xóa thư');
    }
  };

  const handleReadAll = async () => {
    if (mails.every(m => m.isRead)) return;
    try {
      await api.patch('/mailbox/read-all');
      setMails(mails.map(m => ({ ...m, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Lỗi khi cập nhật');
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[600px]">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
            <Inbox size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Hòm Thư</h3>
            <p className="text-slate-500 text-sm">Cập nhật hoạt động của Pet</p>
          </div>
        </div>
        <button 
          onClick={handleReadAll}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <CheckCircle size={14} /> Đọc tất cả
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)
        ) : mails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
            <Mail size={48} strokeWidth={1} className="opacity-20" />
            <p className="italic">Hộp thư đang trống...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {mails.map((mail) => (
              <motion.div
                key={mail.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => !mail.isRead && handleRead(mail.id)}
                className={`
                  relative group p-5 rounded-2xl border transition-all duration-300
                  ${mail.isRead 
                    ? 'bg-transparent border-white/5 opacity-60' 
                    : 'bg-white/5 border-indigo-500/30 shadow-lg shadow-indigo-500/5'}
                `}
              >
                {!mail.isRead && (
                  <div className="absolute top-4 left-4 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
                )}
                
                <div className="flex justify-between items-start mb-2 ml-4">
                  <h4 className={`font-black tracking-tight ${mail.isRead ? 'text-slate-400' : 'text-white'}`}>
                    {mail.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase">
                      <Clock size={10} /> {formatDistanceToNow(new Date(mail.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(mail.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed ml-4 ${mail.isRead ? 'text-slate-500' : 'text-slate-300'}`}>
                  {mail.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Mailbox;
