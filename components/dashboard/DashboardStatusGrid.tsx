
import React from 'react';
import { Wallet, TrendingUp, Users, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface DashboardStatusGridProps {
    totalExpectedCollection: number;
    activeCirclesCount: number;
    totalMembers: number;
    overdueCount: number;
    onOpenCollection: () => void;
    onOpenCircles: () => void;
    onOpenMembers: () => void;
    onOpenOverdue: () => void;
}

export const DashboardStatusGrid: React.FC<DashboardStatusGridProps> = ({
    totalExpectedCollection,
    activeCirclesCount,
    totalMembers,
    overdueCount,
    onOpenCollection,
    onOpenCircles,
    onOpenMembers,
    onOpenOverdue
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Collection */}
            <div 
                onClick={onOpenCollection}
                className="group relative bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 rounded-[2rem] p-6 shadow-2xl shadow-blue-900/20 cursor-pointer overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-blue-600/30"
            >
                {/* Texture */}
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:rotate-12 group-hover:scale-110">
                    <Wallet size={100} />
                </div>
                
                <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                                <Wallet size={24} className="text-white" />
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md border border-white/10 animate-pulse">
                                LIVE
                            </div>
                        </div>
                        <p className="text-blue-100 text-sm font-medium tracking-wide">ยอดที่ต้องเก็บ (Expected)</p>
                        <h3 className="text-4xl font-black text-white tracking-tight mt-1 drop-shadow-sm">
                            ฿{totalExpectedCollection.toLocaleString()}
                        </h3>
                    </div>
                    <div className="flex items-center text-white/70 text-xs font-medium gap-2 group-hover:text-white transition-colors">
                        <span>ดูรายการทั้งหมด</span>
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-blue-600 transition-all">
                            <ArrowRight size={10} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Card 2: Active Circles */}
            <div 
                onClick={onOpenCircles}
                className="group bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-100 cursor-pointer hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                
                <div className="relative z-10">
                    <div className="p-3 bg-emerald-100/50 text-emerald-600 rounded-2xl w-fit mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <TrendingUp size={24} />
                    </div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Active Circles</p>
                    <h3 className="text-4xl font-black text-slate-800 mt-1 flex items-baseline gap-2">
                        {activeCirclesCount} <span className="text-lg text-slate-400 font-medium">วง</span>
                    </h3>
                </div>
            </div>

            {/* Card 3: Total Members */}
            <div 
                onClick={onOpenMembers}
                className="group bg-white rounded-[2rem] p-6 shadow-lg shadow-slate-200/50 border border-slate-100 cursor-pointer hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>

                <div className="relative z-10">
                    <div className="p-3 bg-purple-100/50 text-purple-600 rounded-2xl w-fit mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Users size={24} />
                    </div>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Members</p>
                    <h3 className="text-4xl font-black text-slate-800 mt-1 flex items-baseline gap-2">
                        {totalMembers} <span className="text-lg text-slate-400 font-medium">คน</span>
                    </h3>
                </div>
            </div>

            {/* Card 4: Overdue */}
            <div 
                onClick={onOpenOverdue}
                className={`group rounded-[2rem] p-6 shadow-lg cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    overdueCount > 0 
                    ? 'bg-white border-2 border-red-100 hover:border-red-300 hover:shadow-red-500/20' 
                    : 'bg-white border border-slate-100 hover:border-emerald-300 hover:shadow-emerald-500/10'
                }`}
            >
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700 ${overdueCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}></div>

                <div className="relative z-10">
                    <div className={`p-3 rounded-2xl w-fit mb-6 transition-all duration-300 shadow-sm ${
                        overdueCount > 0 
                        ? 'bg-red-100/50 text-red-600 group-hover:bg-red-600 group-hover:text-white' 
                        : 'bg-emerald-100/50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}>
                        {overdueCount > 0 ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-wider ${overdueCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>Overdue Items</p>
                    <h3 className={`text-4xl font-black mt-1 flex items-baseline gap-2 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {overdueCount} <span className={`text-lg font-medium ${overdueCount > 0 ? 'text-red-300' : 'text-slate-400'}`}>รายการ</span>
                    </h3>
                </div>
            </div>
        </div>
    );
};
