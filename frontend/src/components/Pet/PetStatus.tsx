import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Zap, Skull } from 'lucide-react';

interface PetStatusProps {
  pet: any;
  isAttacking?: boolean;
}

const PetStatus: React.FC<PetStatusProps> = ({ pet, isAttacking }) => {
  const isDead = pet.status === 'DEAD' || pet.hp <= 0;
  
  const getPetEmoji = () => {
    switch (pet.type) {
      case 'MAGE': return '🧙‍♂️';
      case 'FAT': return '🍔';
      case 'MESSI': return '⚽';
      default: return '🐱';
    }
  };

  const getPetColor = () => {
    switch (pet.type) {
      case 'MAGE': return 'from-purple-500 to-indigo-600';
      case 'FAT': return 'from-orange-400 to-yellow-500';
      case 'MESSI': return 'from-blue-400 to-cyan-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

  return (
    <div className={`relative flex flex-col items-center p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl ${isDead ? 'grayscale' : ''}`}>
      {/* Pet Avatar & Animation */}
      <motion.div
        animate={isDead ? {} : (isAttacking ? { x: [0, 20, -20, 0], scale: [1, 1.1, 1] } : { y: [0, -10, 0] })}
        transition={isAttacking ? { duration: 0.3 } : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`w-40 h-40 rounded-full bg-gradient-to-br ${getPetColor()} flex items-center justify-center text-7xl shadow-inner relative`}
      >
        <span className="z-10">{getPetEmoji()}</span>
        {!isDead && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-white blur-xl"
          />
        )}
        {isDead && <Skull className="absolute top-0 right-0 text-red-500 w-10 h-10" />}
      </motion.div>

      <h2 className="mt-6 text-3xl font-black text-white drop-shadow-lg">{pet.name}</h2>
      <p className="text-white/70 font-medium tracking-widest uppercase text-sm mb-4">{pet.type === 'MAGE' ? 'Pháp Sư Meo Meo' : pet.type === 'FAT' ? 'Meow Béo' : 'Messi'}</p>

      {/* HP Bar */}
      <div className="w-full space-y-1">
        <div className="flex justify-between items-center text-xs font-bold text-white/80 px-1">
          <div className="flex items-center gap-1"><Heart size={12} className="text-red-400 fill-red-400" /> HP</div>
          <span>{pet.hp} / {pet.maxHp}</span>
        </div>
        <div className="h-4 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(pet.hp / pet.maxHp) * 100}%` }}
            className={`h-full bg-gradient-to-r ${pet.hp > 300 ? 'from-green-400 to-emerald-500' : 'from-red-500 to-orange-500'}`}
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className={`mt-4 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isDead ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
        {isDead ? 'Cần hồi sinh' : 'Đang hoạt động'}
      </div>
    </div>
  );
};

export default PetStatus;
