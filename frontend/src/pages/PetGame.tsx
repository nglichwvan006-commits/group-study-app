import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, ShieldAlert, Sparkles, ChevronLeft, Target, Award } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

import PetStatus from '../components/Pet/PetStatus';
import DailyQuiz from '../components/Pet/DailyQuiz';
import Mailbox from '../components/Pet/Mailbox';
import PetSelection from '../components/Pet/PetSelection';
import TargetSelector from '../components/Pet/TargetSelector';

const PetGame: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pet, setPet] = useState<any>(location.state?.pet || null);
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(!location.state?.pet);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, []);

  const fetchGameData = async () => {
    // If we already have pet from state, we can still fetch to sync, but don't show full screen loader
    if (!pet) setLoading(true);
    
    try {
      // Fetch pet independently
      const petRes = await api.get('/pets/me');
      setPet(petRes.data);
      
      // Fetch quiz independently
      try {
        const quizRes = await api.get('/quizzes/today');
        setQuizData(quizRes.data);
      } catch (quizError) {
        console.warn('Daily quiz not found or error');
        setQuizData(null);
      }
    } catch (error: any) {
      console.error('Error fetching pet data');
      if (error.response?.status !== 401) {
        toast.error('Không thể tải dữ liệu Pet. Vui lòng kiểm tra kết nối.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseSkill = async (targetUserId?: string) => {
    if (!pet) return;
    
    if (pet.type !== 'MAGE' && !targetUserId) {
      setShowTargetSelector(true);
      return;
    }

    setIsAttacking(true);
    const loadingToast = toast.loading('Đang thi triển kỹ năng...');
    try {
      const response = await api.post('/pets/use-skill', { targetUserId });
      toast.success(response.data.message, { id: loadingToast, duration: 4000 });
      
      // Update pet state (lastSkillUsedAt)
      setPet((prev: any) => ({ ...prev, lastSkillUsedAt: new Date().toISOString() }));
      setShowTargetSelector(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi dùng kỹ năng', { id: loadingToast });
    } finally {
      setTimeout(() => setIsAttacking(false), 500);
    }
  };

  const handleRevive = async () => {
    const loadingToast = toast.loading('Đang thực hiện hồi sinh...');
    try {
      const response = await api.post('/pets/revive');
      toast.success(response.data.message, { id: loadingToast });
      fetchGameData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi hồi sinh', { id: loadingToast });
    }
  };

  if (loading && !pet) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
        />
        <p className="text-indigo-400 font-black tracking-widest uppercase animate-pulse">Đang tải dữ liệu Pet...</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <PetSelection onSelected={(newPet: any) => setPet(newPet)} />
      </div>
    );
  }

  const isDead = pet.status === 'DEAD' || pet.hp <= 0;
  const canUseSkill = !isDead && (!pet.lastSkillUsedAt || new Date(pet.lastSkillUsedAt).toDateString() !== new Date().toDateString());

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <ChevronLeft size={20} /> Quay lại Dashboard
          </button>
          <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-lg">
            <Award className="text-yellow-500" size={20} />
            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              PET GAME ALPHA
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: Pet & Actions */}
          <div className="lg:col-span-5 space-y-8">
            <PetStatus pet={pet} isAttacking={isAttacking} />

            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={!canUseSkill}
                onClick={() => handleUseSkill()}
                className={`
                  p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3
                  ${canUseSkill 
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-400 shadow-xl shadow-indigo-600/30 hover:scale-[1.05] active:scale-95' 
                    : 'bg-white/5 border-white/5 text-slate-500 opacity-50 cursor-not-allowed'}
                `}
              >
                <Zap size={32} className={canUseSkill ? 'text-yellow-400 fill-yellow-400' : ''} />
                <span className="font-black uppercase tracking-widest text-sm">Dùng Kỹ Năng</span>
                {!canUseSkill && !isDead && <span className="text-[10px] opacity-60">Hồi chiêu: Ngày mai</span>}
              </button>

              <button
                disabled={!isDead}
                onClick={handleRevive}
                className={`
                  p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3
                  ${isDead 
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400 shadow-xl shadow-emerald-600/30 hover:scale-[1.05] active:scale-95' 
                    : 'bg-white/5 border-white/5 text-slate-500 opacity-50 cursor-not-allowed'}
                `}
              >
                <RotateCcw size={32} className={isDead ? 'text-white' : ''} />
                <span className="font-black uppercase tracking-widest text-sm">Hồi Sinh</span>
              </button>
            </div>

            {isDead && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 p-6 rounded-3xl flex items-start gap-4"
              >
                <ShieldAlert className="text-red-500 shrink-0" size={24} />
                <div>
                  <h4 className="font-bold text-red-400">Pet đã kiệt sức!</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Hãy hoàn thành ít nhất <span className="text-white font-bold">3 bài tập C++ Medium</span> để hồi sinh đồng đội của bạn.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: Quiz & Mailbox */}
          <div className="lg:col-span-7 space-y-8">
            <DailyQuiz 
              quizData={quizData || { quiz: null, answered: false, result: null }} 
              onAnswered={(res: any) => {
                setQuizData({ ...quizData, answered: true, result: res });
                // Update HP in pet UI
                setPet((prev: any) => ({
                  ...prev,
                  hp: Math.max(0, Math.min(prev.maxHp, prev.hp + (res.isCorrect ? 50 : -50))),
                  status: (prev.hp + (res.isCorrect ? 50 : -50)) <= 0 ? 'DEAD' : 'ALIVE'
                }));
              }} 
            />
            
            <Mailbox />
          </div>
        </div>
      </div>

      {/* Target Selector Modal */}
      <AnimatePresence>
        {showTargetSelector && (
          <TargetSelector 
            petType={pet.type}
            onClose={() => setShowTargetSelector(false)}
            onSelect={(targetId: any) => handleUseSkill(targetId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PetGame;
