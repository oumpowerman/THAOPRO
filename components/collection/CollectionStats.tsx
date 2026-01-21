
import React from 'react';
import { ExternalLink, Layers, ArrowRight, TrendingUp, Wallet, CheckCircle2, AlertTriangle, ListTodo } from 'lucide-react';

interface OverallStatProps {
    totalCollectedBills: number; // Changed from completedRoundsCount
    totalExpectedBills: number;  // Changed from totalRounds
    overallProgress: number;
    outstandingBills: number;    // Changed from remainingRounds
    onShowOverview: () => void;
}

export const OverallStat: React.FC<OverallStatProps> = ({
    totalCollectedBills,
    totalExpectedBills,
    overallProgress,
    outstandingBills,
    onShowOverview
}) => {
    const isComplete = outstandingBills === 0;

    return (
        <div 
            onClick={onShowOverview}
            className="h-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold flex items-center gap-2 text-slate-700 text-sm">
                    <ListTodo size={18} className="text-purple-600" />
                    ภาพรวมเก็บยอด
                </h3>
                <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-purple-50 transition-colors">
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">บิลคงเหลือ (Outstanding)</span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-black leading-none ${isComplete ? 'text-emerald-500' : 'text-red-500'}`}>
                            {outstandingBills}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">รายการ</span>
                    </div>
                </div>
                
                <div className="text-right">
                    {isComplete ? (
                        <div className="flex flex-col items-end text-emerald-600">
                            <CheckCircle2 size={28} />
                            <span className="text-[10px] font-bold mt-1">ครบถ้วน</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 mb-1">ความสำเร็จ</span>
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                {/* Circular Progress Mock */}
                                <svg className="transform -rotate-90 w-12 h-12">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125} strokeDashoffset={125 - (125 * overallProgress) / 100} className="text-purple-500" />
                                </svg>
                                <span className="absolute text-[10px] font-bold text-purple-600">{Math.round(overallProgress)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">เก็บแล้ว {totalCollectedBills} / {totalExpectedBills}</span>
                <span className="text-slate-400 text-[10px] group-hover:text-purple-500 transition-colors">แตะเพื่อดูรายละเอียด</span>
            </div>
        </div>
    );
};

interface CurrentRoundStatProps {
    selectedRoundNum: number;
    paidCount: number;
    totalCount: number;
    progressPercent: number;
}

export const CurrentRoundStat: React.FC<CurrentRoundStatProps> = ({
    selectedRoundNum,
    paidCount,
    totalCount,
    progressPercent
}) => {
    return (
        <div className="h-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-blue-500" />
                    ยอดที่เปียในงวดนี้ <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">งวดที่ {selectedRoundNum}</span>
                </h3>
                <span className="text-sm font-extrabold text-blue-600">{paidCount} / {totalCount}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-1">
                <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                ></div>
            </div>
            <p className="text-[10px] text-slate-400 text-right">สมาชิกจ่ายแล้ว {Math.round(progressPercent)}%</p>
        </div>
    );
};
