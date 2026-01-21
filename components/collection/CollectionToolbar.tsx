
import React from 'react';
import { Clock, Search, ChevronDown, Gavel, ChevronLeft, ChevronRight } from 'lucide-react';
import { ShareCircle } from '../../types';

interface CollectionToolbarProps {
    filter: string;
    onFilterChange: (filter: string) => void;
    activeCircle: ShareCircle | undefined;
    selectedRoundNum: number;
    onRoundChange: (round: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    winnerInfo?: { name: string; bid: number } | null;
    visibleRounds?: any[]; // New Prop
}

export const CollectionToolbar: React.FC<CollectionToolbarProps> = ({
    filter,
    onFilterChange,
    activeCircle,
    selectedRoundNum,
    onRoundChange,
    searchTerm,
    onSearchChange,
    winnerInfo,
    visibleRounds
}) => {
    // If visibleRounds provided, use it. Otherwise fallback to all.
    const roundsToDisplay = visibleRounds || (activeCircle ? activeCircle.rounds : []);
    
    // Find index of current selection in the displayed list to handle Next/Prev
    const currentIndex = roundsToDisplay.findIndex((r: any) => r.roundNumber === selectedRoundNum);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < roundsToDisplay.length - 1;

    const handlePrev = () => {
        if (hasPrev) onRoundChange(roundsToDisplay[currentIndex - 1].roundNumber);
    };

    const handleNext = () => {
        if (hasNext) onRoundChange(roundsToDisplay[currentIndex + 1].roundNumber);
    };

    return (
        <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-3 pb-3 border-b border-slate-200">
            {/* Left Side: Tabs + Winner Info */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: 'ALL', label: 'ทั้งหมด' }, 
                        { id: 'WAITING_APPROVAL', label: 'รออนุมัติ' },
                        { id: 'PARTIAL', label: 'ค้างบางส่วน' },
                        { id: 'PAID', label: 'ครบแล้ว' },
                        { id: 'PENDING', label: 'ยังไม่จ่าย' }
                    ].map((tab) => (
                        <button 
                            key={tab.id}
                            onClick={() => onFilterChange(tab.id)}
                            className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all whitespace-nowrap ${
                                filter === tab.id 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* WINNER INFO */}
                {winnerInfo && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in slide-in-from-left-2">
                        <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full">
                            <Gavel size={14} />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-emerald-600 font-bold uppercase">ผู้ชนะงวดนี้</span>
                            <span className="text-xs font-bold text-slate-800">
                                {winnerInfo.name} <span className="text-emerald-600">(฿{winnerInfo.bid.toLocaleString()})</span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side: Round Navigation + Search */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                
                {/* ROUND NAVIGATION CONTROLS */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handlePrev}
                        disabled={!hasPrev || !activeCircle}
                        className="p-2.5 rounded-xl border-2 border-blue-100 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="งวดก่อนหน้า"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={18} />
                        <select 
                            className="pl-10 pr-10 py-2.5 border-2 border-blue-100 rounded-xl bg-white text-blue-700 font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:border-blue-300 transition-colors shadow-sm min-w-[160px]"
                            value={selectedRoundNum}
                            onChange={(e) => onRoundChange(Number(e.target.value))}
                            disabled={!activeCircle}
                        >
                            {roundsToDisplay.length > 0 ? roundsToDisplay.map((r: any) => (
                                <option key={r.roundNumber} value={r.roundNumber}>
                                    งวดที่ {r.roundNumber} {r.status === 'OPEN' ? '(รอเปีย)' : ''}
                                </option>
                            )) : <option value="">No Active Rounds</option>}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                    </div>

                    <button 
                        onClick={handleNext}
                        disabled={!hasNext || !activeCircle}
                        className="p-2.5 rounded-xl border-2 border-blue-100 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title="งวดถัดไป"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full lg:w-56 hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="ค้นหารายชื่อ..." 
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm" 
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};
