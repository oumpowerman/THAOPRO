
import React, { useState } from 'react';
import { BellRing, ChevronRight, Clock, ChevronDown, ChevronUp, LayoutGrid, List, X, CheckCircle2 } from 'lucide-react';
import { Transaction, ShareCircle, Member } from '../../types';

interface PendingBannerProps {
    transactions: Transaction[];
    circles: ShareCircle[];
    members: Member[];
    onReview: (tx: Transaction) => void;
}

export const PendingBanner: React.FC<PendingBannerProps> = ({ transactions, circles, members, onReview }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');

    if (transactions.length === 0) return null;

    // --- COLLAPSED STATE (Notification Bar) ---
    if (!isExpanded) {
        return (
            <div 
                onClick={() => setIsExpanded(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between mb-6 animate-in slide-in-from-top-2 group relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                
                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/20 relative">
                        <BellRing size={18} className="animate-pulse" />
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-orange-500 rounded-full"></span>
                    </div>
                    <div>
                        <p className="font-bold text-sm">มี {transactions.length} รายการรอตรวจสอบ</p>
                        <p className="text-[10px] text-orange-100 opacity-90">แตะเพื่อดูรายละเอียดและอนุมัติ</p>
                    </div>
                </div>
                <div className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30 transition-colors">
                    <ChevronDown size={16} />
                </div>
            </div>
        );
    }

    // --- EXPANDED STATE ---
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden mb-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Expanded Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex justify-between items-center shadow-sm relative">
                <div className="flex items-center gap-3" onClick={() => setIsExpanded(false)}>
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/20 cursor-pointer">
                        <BellRing size={20} />
                    </div>
                    <div className="cursor-pointer">
                        <h3 className="font-bold text-base leading-tight">
                            รายการรอตรวจสอบ ({transactions.length})
                        </h3>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-black/20 p-1 rounded-lg backdrop-blur-sm">
                        <button 
                            onClick={() => setViewMode('GRID')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'GRID' ? 'bg-white text-orange-600 shadow' : 'text-white/70 hover:text-white'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('LIST')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'LIST' ? 'bg-white text-orange-600 shadow' : 'text-white/70 hover:text-white'}`}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className="p-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-white transition-colors"
                        title="ย่อเก็บ"
                    >
                        <ChevronUp size={20} />
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 bg-orange-50/30 max-h-[400px] overflow-y-auto custom-scrollbar">
                {viewMode === 'GRID' ? (
                    // --- GRID VIEW ---
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x">
                        {transactions.map((tx) => {
                            const txCircle = circles.find(c => c.id === tx.circleId);
                            const txMember = members.find(m => m.id === tx.memberId);
                            return (
                                <div 
                                    key={tx.id}
                                    onClick={() => onReview(tx)} 
                                    className="min-w-[240px] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer snap-start group flex flex-col"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <img 
                                            src={txMember?.avatarUrl || `https://ui-avatars.com/api/?name=${txMember?.name}`} 
                                            className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover" 
                                            alt="" 
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 text-sm truncate">{txMember?.name}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{txCircle?.name}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <span className="font-bold text-blue-600 text-lg">
                                            ฿{tx.amountPaid.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-orange-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold bg-orange-50 px-2 py-1 rounded-lg">
                                            ตรวจสอบ <ChevronRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // --- LIST VIEW ---
                    <div className="space-y-2">
                        {transactions.map((tx) => {
                            const txCircle = circles.find(c => c.id === tx.circleId);
                            const txMember = members.find(m => m.id === tx.memberId);
                            return (
                                <div 
                                    key={tx.id}
                                    onClick={() => onReview(tx)}
                                    className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img 
                                                src={txMember?.avatarUrl || `https://ui-avatars.com/api/?name=${txMember?.name}`} 
                                                className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover" 
                                                alt="" 
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                <Clock size={12} className="text-amber-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-800 text-sm">{txMember?.name || 'Unknown'}</p>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                                                    งวดที่ {tx.roundNumber}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <span>{txCircle?.name}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>{tx.timestamp}</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-600 text-base">
                                            ฿{tx.amountPaid.toLocaleString()}
                                        </span>
                                        <div className="bg-orange-50 p-2 rounded-lg text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
