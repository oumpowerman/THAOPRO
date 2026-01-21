
import React from 'react';
import { CheckCircle2, ListTodo, AlertTriangle, Layers } from 'lucide-react';

interface OverallStatProps {
    totalCollectedBills: number;
    totalExpectedBills: number;
    overallProgress: number;
    outstandingBills: number;
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
            className={`group relative p-5 rounded-2xl shadow-sm border transition-all cursor-pointer hover:shadow-md h-full flex flex-col justify-center overflow-hidden ${
                isComplete 
                ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-200' 
                : 'bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 border-purple-200'
            }`}
        >
            {/* Background Texture */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none opacity-50 ${isComplete ? 'bg-emerald-300' : 'bg-fuchsia-300'}`}></div>

            <div className="relative z-10 flex items-center justify-between gap-3">
                {/* Left Side: Outstanding */}
                <div className="flex flex-col justify-center">
                     <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-lg ${isComplete ? 'bg-emerald-200 text-emerald-800' : 'bg-white/60 text-purple-700 shadow-sm'}`}>
                            {isComplete ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                        </div>
                        <p className={`text-xs font-extrabold uppercase tracking-wide ${isComplete ? 'text-emerald-800' : 'text-purple-900'}`}>
                            {isComplete ? 'เก็บครบแล้ว (Completed)' : 'ค้างชำระ (Outstanding)'}
                        </p>
                     </div>
                     
                     <div className="flex items-baseline gap-2">
                        <span className={`text-6xl font-black tracking-tighter leading-none ${isComplete ? 'text-emerald-700' : 'text-purple-800'}`}>
                            {outstandingBills}
                        </span>
                        <span className={`text-base font-bold ${isComplete ? 'text-emerald-600' : 'text-purple-700'}`}>รายการ</span>
                     </div>
                </div>

                {/* Right Side: Progress Circle */}
                <div className="flex flex-col items-center justify-center shrink-0 pl-4 border-l border-black/5">
                     <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/5" />
                            <circle 
                                cx="32" cy="32" r="28" 
                                stroke="currentColor" 
                                strokeWidth="6" 
                                fill="transparent" 
                                strokeDasharray={175} 
                                strokeDashoffset={175 - (175 * overallProgress) / 100} 
                                className={`${isComplete ? 'text-emerald-600' : 'text-purple-600'} transition-all duration-1000 ease-out`} 
                                strokeLinecap="round" 
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-black ${isComplete ? 'text-emerald-800' : 'text-purple-800'}`}>
                                {Math.round(overallProgress)}%
                            </span>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold mt-1 uppercase tracking-wide whitespace-nowrap ${isComplete ? 'text-emerald-700' : 'text-purple-700'}`}>
                        {totalCollectedBills} / {totalExpectedBills} Bills
                    </span>
                </div>
            </div>
        </div>
    );
};

interface CurrentRoundStatProps {
    selectedRoundNum: number;
    paidCount: number;
    totalCount: number;
    progressPercent: number;
    collectedAmount: number; 
    expectedAmount: number; 
}

export const CurrentRoundStat: React.FC<CurrentRoundStatProps> = ({
    selectedRoundNum,
    paidCount,
    totalCount,
    progressPercent,
    collectedAmount,
    expectedAmount
}) => {
    return (
        <div className="bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100 p-5 rounded-2xl shadow-sm border border-blue-200 h-full flex flex-col justify-center relative overflow-hidden group">
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                {/* Top Row */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-bold w-fit border border-blue-200 shadow-sm">
                            <Layers size={14} /> งวดที่ {selectedRoundNum}
                        </span>
                        <span className="text-xs text-blue-800 font-bold mt-1 pl-1">ยอดเก็บได้ (Collected)</span>
                    </div>

                    <div className="flex flex-col items-end text-right">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-blue-900 tracking-tight leading-none">
                                ฿{collectedAmount.toLocaleString()}
                            </span>
                        </div>
                        <span className="text-xs text-blue-700 font-bold bg-blue-200/50 px-2 py-0.5 rounded">
                            เป้าหมาย {expectedAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Bottom Row: Compact Progress */}
                <div className="pt-1">
                    <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-blue-100">
                        <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_5px_rgba(37,99,235,0.3)]" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs font-bold mt-1.5 text-blue-800">
                         <span className="bg-white/50 px-2 rounded">จ่ายแล้ว {paidCount}/{totalCount} คน</span>
                         <span className="text-blue-700">{Math.round(progressPercent)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
