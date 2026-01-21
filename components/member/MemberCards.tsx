
import React from 'react';
import { Phone, ChevronRight, Star } from 'lucide-react';
import { Member } from '../../types';

// Helper types from hook (simplified)
interface MemberCardProps {
    member: Member;
    onClick: () => void;
    getMemberStats: (id: string) => { totalHands: number; wonCount: number };
    getRiskStatusBadge: (score: string) => any;
}

export const MemberCardGrid: React.FC<MemberCardProps> = ({ member, onClick, getMemberStats, getRiskStatusBadge }) => {
    const stats = getMemberStats(member.id);
    const risk = getRiskStatusBadge(member.riskScore);
    
    return (
      <div 
          onClick={onClick}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group h-full relative overflow-hidden"
      >
          <div className={`absolute top-0 right-0 w-16 h-16 ${risk.bgLight} rounded-bl-full -mr-8 -mt-8`}></div>
          
          <div className="relative">
              <img src={member.avatarUrl} alt={member.name} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-slate-50 group-hover:border-blue-100 transition-colors bg-slate-200" />
              <div className={`absolute bottom-3 right-0 px-2 py-0.5 rounded-full text-[10px] text-white font-bold shadow-sm border border-white ${risk.color}`}>
                  {risk.label}
              </div>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{member.name}</h3>
          <p className="text-slate-500 text-sm mb-4">{member.phone}</p>

          <div className="w-full grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Hand</p>
                  <p className="font-bold text-slate-800">{stats.totalHands}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Won</p>
                  <p className="font-bold text-slate-800">{stats.wonCount}</p>
              </div>
          </div>

          <div className="w-full bg-indigo-50 text-indigo-700 text-xs p-2 rounded-lg flex items-center justify-center gap-2 mb-2 font-bold mt-auto">
              <Star size={14} fill="currentColor" className="text-indigo-400"/>
              Credit: {member.creditScore || 100}
          </div>
      </div>
    );
};

export const MemberRowList: React.FC<MemberCardProps> = ({ member, onClick, getMemberStats, getRiskStatusBadge }) => {
    const stats = getMemberStats(member.id);
    const risk = getRiskStatusBadge(member.riskScore);

    return (
        <div 
          onClick={onClick}
          className="group bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
        >
            <div className="flex items-center gap-4 flex-1">
                <img src={member.avatarUrl} className="w-12 h-12 rounded-full bg-slate-200 object-cover" alt=""/>
                <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-600">{member.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={12} /> {member.phone}
                    </div>
                </div>
            </div>
            
            {/* Stats Columns */}
            <div className="hidden md:flex gap-8 items-center mr-8">
                <div className="text-center w-16">
                    <p className="text-[10px] text-slate-400">วงที่เล่น</p>
                    <p className="font-bold text-slate-700">{stats.totalHands}</p>
                </div>
                <div className="text-center w-16">
                    <p className="text-[10px] text-slate-400">Credit</p>
                    <p className="font-bold text-indigo-600">{member.creditScore || 100}</p>
                </div>
                <div className="w-24 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${risk.bgLight} ${risk.text}`}>
                        {risk.label}
                    </span>
                </div>
            </div>
            
            <ChevronRight className="text-slate-300 group-hover:text-blue-500" size={20} />
        </div>
    );
};
