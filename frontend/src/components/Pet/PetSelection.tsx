import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PET_TYPES = [
  { 
    id: 'MAGE', 
    name: 'Pháp Sư Meo Meo', 
    emoji: '🧙‍♂️', 
    description: 'Cộng random 0–45 điểm cho chủ sở hữu mỗi ngày.',
    color: 'from-purple-500 to-indigo-600',
    skill: 'Lucky Score'
  },
  { 
    id: 'FAT', 
    name: 'Meow Béo', 
    emoji: '🍔', 
    description: 'Trừ random 1–70 điểm của đối thủ được chọn mỗi ngày.',
    color: 'from-orange-400 to-yellow-500',
    skill: 'Point Smash'
  },
  { 
    id: 'MESSI', 
    name: 'Messi', 
    emoji: '⚽', 
    description: 'Trừ 35% HP Pet của đối thủ được chọn mỗi ngày.',
    color: 'from-blue-400 to-cyan-500',
    skill: 'Power Shot'
  }
];

interface PetSelectionProps {
  onSelected: (pet: any) => void;
}

const PetSelection: React.FC<PetSelectionProps> = ({ onSelected }) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [petName, setPetName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = async () => {
    if (!selectedType || isSubmitting) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Đang triệu hồi Pet...');
    try {
      const response = await api.post('/pets/select', {
        type: selectedType,
        name: petName.trim() || undefined
      });
      toast.success(`Chào mừng ${response.data.name} gia nhập đội ngũ!`, { id: loadingToast });
      onSelected(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi chọn Pet', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black text-white mb-4 drop-shadow-lg"
        >
          Chọn Bạn Đồng Hành
        </motion.h1>
        <p className="text-slate-400 text-lg">Mỗi người chỉ được chọn một Pet duy nhất. Hãy cân nhắc kỹ năng của chúng!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {PET_TYPES.map((type: any) => (
          <motion.div
            key={type.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedType(type.id)}
            className={`
              relative cursor-pointer group p-6 rounded-[2.5rem] border-4 transition-all duration-300
              ${selectedType === type.id 
                ? `bg-white/10 border-indigo-500 shadow-2xl shadow-indigo-500/20` 
                : 'bg-white/5 border-transparent hover:border-white/20'}
            `}
          >
            {selectedType === type.id && (
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg z-20">
                <Check size={24} strokeWidth={4} />
              </div>
            )}
            
            <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center text-6xl mb-6 shadow-inner relative overflow-hidden`}>
              <span className="z-10">{type.emoji}</span>
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <h3 className="text-2xl font-black text-white text-center mb-2">{type.name}</h3>
            <div className="bg-white/10 rounded-full px-3 py-1 w-fit mx-auto mb-4">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-indigo-300">Skill: {type.skill}</span>
            </div>
            <p className="text-slate-400 text-sm text-center leading-relaxed">
              {type.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="max-w-md mx-auto bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10">
        <div className="mb-6">
          <label className="block text-slate-400 text-sm font-bold mb-2 ml-1">Đặt tên cho Pet của bạn (Tùy chọn)</label>
          <input
            type="text"
            placeholder="VD: Đại Đế Meo..."
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={handleSelect}
          disabled={!selectedType || isSubmitting}
          className={`
            w-full py-5 rounded-2xl font-black text-xl tracking-widest uppercase transition-all flex items-center justify-center gap-3
            ${selectedType && !isSubmitting
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
          `}
        >
          <Sparkles size={24} /> Bắt đầu hành trình
        </button>
      </div>
    </div>
  );
};

export default PetSelection;
