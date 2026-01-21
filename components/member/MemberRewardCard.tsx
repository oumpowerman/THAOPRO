
import React from 'react';
import { Gift, Award, Check, Star, Lock, Crown } from 'lucide-react';
import { User } from '../../types';

interface MemberRewardProps {
    user?: User | null;
    activeCount?: number;
    totalPrincipal?: number;
    totalPoints: number;
    // New props for merged profile status
    currentUserAvatar?: string;
    creditScore?: number;
}

// 1. Welcome Section (Merged with Profile Status)
export const MemberWelcomeCard: React.FC<MemberRewardProps> = ({ 
    user, 
    activeCount, 
    totalPrincipal, 
    totalPoints,
    currentUserAvatar,
    creditScore = 100
}) => {
    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                
                {/* LEFT: User Profile & Credit Score */}
                <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 w-full md:w-auto shrink-0">
                    <div className="relative">
                        <img 
                            src={currentUserAvatar || "https://ui-avatars.com/api/?name=User"} 
                            alt="Profile" 
                            className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover bg-white" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-orange-500">
                            <Check size={10} strokeWidth={4} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight">{user?.name}</h2>
                        <p className="text-orange-100 text-xs mb-1.5">{user?.memberId || 'Member'}</p>
                        
                        {/* Credit Score Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold flex items-center gap-1"><Star size={10} fill="currentColor"/> Credit Score</span>
                                <span className="font-bold bg-white/20 px-1.5 rounded">{creditScore}</span>
                            </div>
                            <div className="w-32 h-1.5 bg-black/20 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${creditScore > 80 ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                                    style={{ width: `${Math.min(100, creditScore)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Welcome Message & Stats */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-orange-100 text-sm">ยินดีต้อนรับสู่ ThaoPro</p>
                            <h1 className="text-2xl font-bold">ระบบออมเงินยุคใหม่</h1>
                        </div>
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm hidden md:block">
                            <Crown size={24} className="text-white" />
                        </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm border border-white/10 flex flex-col justify-center text-center md:text-left">
                            <p className="text-orange-100 text-[10px] mb-0.5">วงที่เล่น</p>
                            <p className="text-lg font-bold leading-tight">{activeCount} <span className="text-[10px] font-normal opacity-80">วง</span></p>
                        </div>
                        <div className="bg-white/10 rounded-xl px-3 py-2 backdrop-blur-sm border border-white/10 flex flex-col justify-center text-center md:text-left">
                            <p className="text-orange-100 text-[10px] mb-0.5">เงินต้นรวม</p>
                            <p className="text-lg font-bold leading-tight">฿{(totalPrincipal || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-3 py-2 backdrop-blur-sm border border-white/30 flex flex-col justify-center relative overflow-hidden group text-center md:text-left">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <p className="text-white text-[10px] uppercase font-bold tracking-wider mb-0.5">Points</p>
                            <p className="text-lg font-black leading-tight text-white flex items-center justify-center md:justify-start gap-1">
                                {totalPoints} <Gift size={12} />
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 2. Gold Progress Section (Full Height Version)
export const MemberGoldProgress: React.FC<MemberRewardProps> = ({ totalPoints }) => {
    const REWARDS = [
      { points: 50, label: 'ทอง 1 ปิ๊ป (ขนม)' },
      { points: 200, label: 'ทอง 1 กรัม' },
      { points: 300, label: 'ทอง 1 สลึง' },
      { points: 400, label: 'ทอง 2 สลึง' },
      { points: 550, label: 'ทอง 3 สลึง' },
      { points: 600, label: 'ทอง 1 บาท' },
      { points: 1000, label: 'ทอง 2 บาท (Big Bonus)' },
    ];

    const nextRewardIndex = REWARDS.findIndex(r => totalPoints < r.points);
    const nextReward = nextRewardIndex !== -1 ? REWARDS[nextRewardIndex] : null;
    
    let progressPercent = 0;
    if (nextReward) {
        const prevPoints = nextRewardIndex > 0 ? REWARDS[nextRewardIndex - 1].points : 0;
        progressPercent = Math.min(100, Math.max(0, ((totalPoints - prevPoints) / (nextReward.points - prevPoints)) * 100));
    } else if (totalPoints >= 1000) {
        progressPercent = 100;
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full min-h-[500px] flex flex-col relative overflow-hidden">
             {/* Header */}
             <div className="flex flex-col items-center mb-6 text-center">
                 <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                    <Award className="text-amber-500" size={32} />
                 </div>
                 <h4 className="font-bold text-slate-800 text-lg">เส้นทางสู่ทองคำ</h4>
                 <p className="text-xs text-slate-400">สะสมยอด 1,000 บาท = 1 คะแนน</p>
             </div>

             {/* Current Status Box */}
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 mb-6 text-white shadow-lg relative overflow-hidden shrink-0">
                <div className="absolute right-0 top-0 p-3 opacity-10"><Crown size={64}/></div>
                <div className="flex justify-between items-end mb-2 relative z-10">
                    <div>
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Target</p>
                        <p className="text-sm font-bold">{nextReward ? nextReward.label : 'Max Level!'}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-amber-400">{totalPoints}</span>
                        <span className="text-[10px] text-slate-400 ml-1">Pts</span>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-right mt-1 text-slate-400">{Math.round(progressPercent)}% ถึงเป้าหมาย</p>
                </div>
             </div>

             {/* Vertical Timeline */}
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                 <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                 <div className="space-y-6 relative">
                    {REWARDS.map((reward, index) => {
                        const isUnlocked = totalPoints >= reward.points;
                        const isNext = nextReward && nextReward.points === reward.points;
                        return (
                            <div key={index} className={`flex items-center gap-4 ${isUnlocked ? 'opacity-100' : isNext ? 'opacity-100' : 'opacity-50 blur-[0.5px] hover:blur-0 transition-all'}`}>
                                <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 shrink-0 transition-all
                                    ${isUnlocked 
                                        ? 'bg-emerald-500 border-white text-white shadow-md scale-90' 
                                        : isNext 
                                            ? 'bg-white border-amber-400 text-amber-500 shadow-lg ring-4 ring-amber-50 scale-110'
                                            : 'bg-slate-50 border-white text-slate-300'
                                    }`}>
                                    {isUnlocked ? <Check size={16} strokeWidth={4} /> : isNext ? <Star size={18} fill="currentColor" /> : <Lock size={14} />}
                                </div>
                                <div className={`flex-1 p-3 rounded-xl border transition-all ${isNext ? 'bg-white border-amber-200 shadow-sm translate-x-1' : 'border-transparent hover:bg-slate-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm font-bold ${isUnlocked ? 'text-emerald-700' : isNext ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {reward.label}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {reward.points} Pts
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                 </div>
             </div>
        </div>
    );
};
