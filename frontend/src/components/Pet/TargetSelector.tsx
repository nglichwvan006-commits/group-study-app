import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Shield, Sword } from 'lucide-react';
import api from '../../services/api';

interface TargetSelectorProps {
  onSelect: (targetId: string) => void;
  onClose: () => void;
  petType: string;
}

const TargetSelector: React.FC<TargetSelectorProps> = ({ onSelect, onClose, petType }) => {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await api.get('/pets/targets');
      setTargets(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTargets = targets.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <Sword className="text-red-500" /> Chọn Mục Tiêu
            </h3>
            <p className="text-slate-500 text-sm mt-1">Kỹ năng của {petType === 'FAT' ? 'Meow Béo' : 'Messi'} đang sẵn sàng</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm đối thủ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)
            ) : filteredTargets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 italic">Không tìm thấy ai phù hợp...</div>
            ) : filteredTargets.map((target: any) => (
              <motion.div
                key={target.id}
                whileHover={{ scale: 1.02, x: 5 }}
                onClick={() => onSelect(target.id)}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gradient-to-br ${target.pet ? 'from-indigo-500 to-purple-600' : 'from-slate-700 to-slate-800'}`}>
                    {target.pet ? (target.pet.type === 'MAGE' ? '🧙‍♂️' : target.pet.type === 'FAT' ? '🍔' : '⚽') : '👤'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{target.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-yellow-500 font-bold">{target.totalPoints} pts</span>
                      {target.pet && (
                        <span className="flex items-center gap-1 text-red-400 font-medium">
                          <Shield size={10} /> {target.pet.hp} HP
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                  Tấn công
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TargetSelector;
