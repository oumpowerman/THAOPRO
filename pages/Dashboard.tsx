
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, Wallet, TrendingUp, Users, X, ArrowRight, ChevronRight, Clock, ShieldAlert, CheckCircle2, ChevronLeft, Calendar, CircleDollarSign, Activity, PieChart as PieChartIcon, ArrowUpRight, Search, Phone, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ShareType, CircleStatus, SharePeriod, BiddingType, ShareCircle } from '../types';
import { CircleDetailModal } from '../components/CircleDetailModal';
import { CircleFormModal } from '../components/CircleFormModal';
import { DashboardStatusGrid } from '../components/dashboard/DashboardStatusGrid';

const COLORS = ['#10B981', '#EF4444'];

const Dashboard = () => {
  const { circles, members, transactions, user } = useAppContext();
  
  // Modal States
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showAllCirclesModal, setShowAllCirclesModal] = useState(false);
  const [showAllMembersModal, setShowAllMembersModal] = useState(false);

  const [collectionCircleId, setCollectionCircleId] = useState<string | null>(null);
  const [viewingCircle, setViewingCircle] = useState<ShareCircle | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingCircleId, setEditingCircleId] = useState<string | null>(null);

  // Filter State for Members Modal
  const [memberSearch, setMemberSearch] = useState('');

  const runningCircles = circles.filter(c => 
      c.status !== CircleStatus.INITIALIZING && 
      c.status !== CircleStatus.COMPLETED
  );

  const totalMembers = members.length;
  const activeCirclesCount = runningCircles.length; 
  
  let aliveHands = 0;
  let deadHands = 0;
  runningCircles.forEach(c => {
    c.members.forEach(m => {
      if (m.status === 'ALIVE') aliveHands++;
      if (m.status === 'DEAD') deadHands++;
    });
  });

  const pieData = [
    { name: 'มือเป็น', value: aliveHands },
    { name: 'มือตาย', value: deadHands },
  ];

  // --- LOGIC 1: Expected Collection (ยอดที่ต้องเก็บ - Updated Logic) ---
  const duePayments = runningCircles.flatMap(circle => {
     // 1. Identify "Active Rounds" that need collection
     const roundsToCollect = circle.rounds.filter(r => {
        if (circle.biddingType === BiddingType.AUCTION) {
            // Auction: Only show rounds that are finalized (COLLECTING)
            return r.status === 'COLLECTING';
        } else {
            // Fixed: Show rounds that are OPEN/COLLECTING AND Due Date has arrived
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const rDate = new Date(r.date);
            return (r.status === 'OPEN' || r.status === 'COLLECTING') && rDate <= today;
        }
     });

     if (roundsToCollect.length === 0) return [];

     // 2. Iterate Rounds and Members
     return roundsToCollect.flatMap(round => {
         const membersToCollect = circle.members.filter(cm => {
             if (user && cm.memberId === user.id) return false;
             return true;
         });

         return membersToCollect.map(cm => {
            // Check if Paid for THIS round
            const hasPaid = transactions.some(t => 
                t.circleId === circle.id && 
                t.roundNumber === round.roundNumber &&
                t.memberId === cm.memberId && 
                (t.status === 'PAID' || t.status === 'WAITING_APPROVAL')
            );

            if (hasPaid) return null;

            let memberName = 'Unknown';
            let memberPhone = '';
            let memberAvatar = '';

            const memberProfile = members.find(m => m.id === cm.memberId);
            if (memberProfile) {
                memberName = memberProfile.name;
                memberPhone = memberProfile.phone;
                memberAvatar = memberProfile.avatarUrl;
            }

            let amount = 0;
            let note = `งวดที่ ${round.roundNumber}`;

            // FIXED (Ladder) Mode
            if (circle.biddingType === BiddingType.FIXED) {
                // Rule: Thao (Slot 1) and Winner (Slot == Round) pay 0
                if (cm.slotNumber === 1 || cm.slotNumber === round.roundNumber) amount = 0;
                else amount = cm.fixedDueAmount || 0;
            } 
            // AUCTION Mode
            else {
                // Rule: Thao (Slot 1) and Current Winner pay 0
                if (cm.slotNumber === 1 || cm.memberId === round.winnerId) amount = 0;
                else {
                    if (cm.status === 'DEAD') {
                        // Dead hand pays Principal + Bid (Dok Tam) OR Principal (Dok Hak)
                        if (circle.type === ShareType.DOK_TAM) {
                            amount = circle.principal + (cm.bidAmount || 0);
                            note += ' (ต้น+ดอก)';
                        } else {
                            amount = circle.principal;
                            note += ' (เต็ม)';
                        }
                    } else {
                        // Alive hand pays Principal OR Principal - Round Bid (Dok Hak)
                        if (circle.type === ShareType.DOK_HAK) {
                            amount = Math.max(0, circle.principal - (round.bidAmount || 0));
                            note += ' (หักดอก)';
                        } else {
                            amount = circle.principal;
                            note += ' (ส่งต้น)';
                        }
                    }
                }
            }

            // Special PID TON Case
            if (cm.pidTonAmount && cm.pidTonAmount > 0) {
                 // Pid Ton pays only on Round 1
                 if (round.roundNumber === 1) amount = cm.pidTonAmount;
                 else amount = 0;
            }

            if (amount <= 0) return null;

            return {
                id: `${circle.id}-${round.roundNumber}-${cm.memberId}`,
                circleId: circle.id,
                circleName: circle.name,
                memberId: cm.memberId,
                memberName: memberName,
                memberPhone: memberPhone,
                avatar: memberAvatar,
                amount: amount,
                status: cm.status,
                note: note,
                circleType: circle.type
            };
         }).filter(Boolean);
     });
  });

  const totalExpectedCollection = duePayments.reduce((sum, item: any) => sum + (item?.amount || 0), 0);

  const collectionByCircle = duePayments.reduce((acc: any, item: any) => {
      if (!acc[item.circleId]) {
          acc[item.circleId] = {
              id: item.circleId,
              name: item.circleName,
              totalAmount: 0,
              items: [],
              count: 0
          };
      }
      acc[item.circleId].totalAmount += item.amount;
      acc[item.circleId].count += 1;
      acc[item.circleId].items.push(item);
      return acc;
  }, {});

  const collectionCirclesList = Object.values(collectionByCircle);
  const selectedCircleCollection: any = collectionCircleId ? collectionByCircle[collectionCircleId] : null;

  // --- LOGIC 2: Overdue Payments (ค้างชำระ) ---
  const overdueList = runningCircles.flatMap(circle => {
      const today = new Date();
      today.setHours(0,0,0,0);

      // Find Rounds that are strictly in the PAST and NOT Completed (or Paid)
      const overdueRounds = circle.rounds.filter(r => {
          const rDate = new Date(r.date);
          rDate.setHours(0,0,0,0);
          return rDate < today && (r.status === 'OPEN' || r.status === 'COLLECTING');
      });

      if (overdueRounds.length === 0) return [];

      return overdueRounds.flatMap(round => {
          const membersToCheck = circle.members.filter(cm => {
             if (user && cm.memberId === user.id) return false;
             return true;
         });

          return membersToCheck.map(cm => {
              const hasPaid = transactions.some(t => 
                  t.circleId === circle.id && 
                  t.roundNumber === round.roundNumber &&
                  t.memberId === cm.memberId && 
                  t.status === 'PAID'
              );

              if (hasPaid) return null;

              let memberName = 'Unknown';
              let memberPhone = '';
              let memberAvatar = '';

              const memberProfile = members.find(m => m.id === cm.memberId);
              if (memberProfile) {
                  memberName = memberProfile.name;
                  memberPhone = memberProfile.phone;
                  memberAvatar = memberProfile.avatarUrl;
              }

              const rDate = new Date(round.date);
              const daysLate = Math.floor((today.getTime() - rDate.getTime()) / (1000 * 3600 * 24));
              
              // Simplified Amount for Overdue
              let amount = circle.biddingType === BiddingType.FIXED ? (cm.fixedDueAmount || 0) : circle.principal;
              
              if (cm.slotNumber === 1 || (circle.biddingType === BiddingType.FIXED && cm.slotNumber === round.roundNumber)) amount = 0;
              if (cm.pidTonAmount && round.roundNumber > 1) amount = 0;

              if (amount <= 0) return null;

              return {
                  id: `${circle.id}-${round.roundNumber}-${cm.memberId}-overdue`,
                  circleName: circle.name,
                  memberName: memberName,
                  memberPhone: memberPhone,
                  avatar: memberAvatar,
                  amount: amount,
                  daysLate: daysLate,
                  dueDate: round.date,
                  roundNumber: round.roundNumber
              };
          }).filter(Boolean);
      });
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO BANNER: COMMAND CENTER */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl transition-all hover:shadow-slate-900/40 group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
          
          <div className="relative z-10 p-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                  <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                          <Activity size={24} className="text-emerald-400" />
                      </div>
                      <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/30">
                          Financial Overview
                      </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                      สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">{user?.name || 'ท้าวแชร์'}</span>
                  </h2>
                  <p className="text-slate-400 text-lg font-light max-w-lg">
                      ภาพรวมสถานะการเงินและความเสี่ยงประจำวัน
                  </p>
              </div>
              <div className="flex items-center gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-xl transition-transform group-hover:scale-105 duration-500">
                  <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Today's Date</p>
                      <p className="text-white font-bold text-2xl font-serif">
                          {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-slate-500 text-sm">
                          {new Date().toLocaleDateString('th-TH', { year: 'numeric' })}
                      </p>
                  </div>
                  <div className="h-12 w-px bg-white/10"></div>
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                      <Calendar size={28} className="text-white" />
                  </div>
              </div>
          </div>
      </div>

      {/* 2. STATS GRID (Extracted Component) */}
      <DashboardStatusGrid 
          totalExpectedCollection={totalExpectedCollection}
          activeCirclesCount={activeCirclesCount}
          totalMembers={totalMembers}
          overdueCount={overdueList.length}
          onOpenCollection={() => { setCollectionCircleId(null); setShowCollectionModal(true); }}
          onOpenCircles={() => setShowAllCirclesModal(true)}
          onOpenMembers={() => setShowAllMembersModal(true)}
          onOpenOverdue={() => setShowOverdueModal(true)}
      />

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Chart (Left 1/3) */}
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 lg:col-span-1 flex flex-col relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-600 shadow-sm">
                  <PieChartIcon size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-800">วิเคราะห์ความเสี่ยง</h3>
          </div>
          
          <div className="flex-1 min-h-[300px] relative z-10">
            {aliveHands + deadHands > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                    <PieChartIcon size={48} className="opacity-20 mb-4" />
                    <p>ไม่มีข้อมูลวงแชร์</p>
                </div>
            )}
            
            {/* Center Text Overlay */}
            {aliveHands + deadHands > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800">{aliveHands + deadHands}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Hands</span>
                </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 relative z-10">
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                  <span className="text-sm font-bold text-slate-600">มือเป็น ({Math.round((aliveHands / (aliveHands + deadHands)) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                  <span className="text-sm font-bold text-slate-600">มือตาย ({Math.round((deadHands / (aliveHands + deadHands)) * 100)}%)</span>
              </div>
          </div>
        </div>

        {/* Bidding Schedule (Right 2/3) */}
        <div className="bg-white p-0 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100/50 rounded-2xl text-blue-600 shadow-sm">
                      <Calendar size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-xl text-slate-800">ตารางการเปียแชร์</h3>
                      <p className="text-slate-400 text-sm">ภาพรวมวงแชร์ทั้งหมดและสถานะ</p>
                  </div>
              </div>
              <button 
                onClick={() => setShowAllCirclesModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                  ดูทั้งหมด <ArrowUpRight size={16} />
              </button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 font-extrabold uppercase bg-slate-50/50 border-b border-slate-100 tracking-wider">
                <tr>
                  <th className="px-8 py-5">ชื่อวง</th>
                  <th className="px-4 py-5 text-center">งวดปัจจุบัน</th>
                  <th className="px-4 py-5 text-center">ประเภท</th>
                  <th className="px-4 py-5 text-center">ยอดวง (Total Pot)</th>
                  <th className="px-4 py-5 text-center">เหลือ</th>
                  <th className="px-4 py-5 text-center">วันที่เปีย</th>
                  <th className="px-8 py-5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {runningCircles.map((circle, idx) => {
                  const currentRound = circle.rounds.length;
                  const totalRounds = circle.totalSlots;
                  const remainingHands = circle.members.filter(m => m.status === 'ALIVE').length;
                  // Correct Total Pot Calculation
                  const totalPot = circle.principal * (circle.totalSlots - 1);

                  return (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => { setViewingCircle(circle); }}>
                      <td className="px-8 py-5 font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{circle.name}</td>
                      <td className="px-4 py-5 text-center">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">{currentRound} / {totalRounds}</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border shadow-sm ${circle.type === 'DOK_HAK' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                          {circle.type === 'DOK_HAK' ? 'ดอกหัก' : 'ดอกตาม'}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center font-black text-emerald-600 font-mono text-base tracking-tight">
                          ฿{totalPot.toLocaleString()}
                      </td>
                      <td className="px-4 py-5 text-center font-bold text-slate-600">{remainingHands}</td>
                      <td className="px-4 py-5 font-bold text-slate-600 text-center">
                          {new Date(circle.nextDueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                          </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODALS (RE-DESIGNED DRILL DOWN) --- */}

      {/* 1. Collection Modal (Expected) - Luxury Design */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowCollectionModal(false)} />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20 ring-1 ring-black/5">
                
                {/* Header */}
                <div className="p-8 pb-6 border-b border-slate-200/60 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        {collectionCircleId ? (
                             <button onClick={() => setCollectionCircleId(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><ChevronLeft size={28} /></button>
                        ) : <div className="p-3 bg-white/20 rounded-2xl shadow-inner border border-white/10"><Wallet size={28} /></div>}
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">{collectionCircleId && selectedCircleCollection ? selectedCircleCollection.name : 'ยอดที่ต้องเก็บ (Collection)'}</h3>
                            <p className="text-blue-100 text-sm font-medium mt-0.5">{collectionCircleId && selectedCircleCollection ? `ยอดรวมวงนี้: ฿${selectedCircleCollection.totalAmount.toLocaleString()}` : `รวมทั้งหมด: ฿${totalExpectedCollection.toLocaleString()}`}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCollectionModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"><X size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4 bg-slate-50/50 flex-1 custom-scrollbar">
                    {!collectionCircleId && (
                        <>
                           {collectionCirclesList.length > 0 ? collectionCirclesList.map((group: any) => (
                               <div key={group.id} onClick={() => setCollectionCircleId(group.id)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all cursor-pointer group">
                                   <div className="flex items-center gap-5">
                                       <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">{group.count}</div>
                                       <div>
                                           <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-lg">{group.name}</h4>
                                           <p className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg w-fit mt-1">รอเก็บ {group.count} คน</p>
                                       </div>
                                   </div>
                                   <div className="flex items-center gap-4">
                                       <p className="text-xl font-black text-slate-800">฿{group.totalAmount.toLocaleString()}</p>
                                       <div className="p-2 bg-slate-100 rounded-full group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 transition-colors">
                                           <ChevronRight size={20} />
                                       </div>
                                   </div>
                               </div>
                           )) : <div className="text-center py-20 text-slate-400"><CheckCircle2 size={64} className="mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">เยี่ยมมาก! ไม่มีรายการที่ต้องเก็บ</p></div>}
                        </>
                    )}

                    {collectionCircleId && selectedCircleCollection && (
                        <div className="space-y-3">
                            {selectedCircleCollection.items.map((item: any) => (
                                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.memberName}`} alt="" className="w-14 h-14 rounded-full border-4 border-slate-50 object-cover shadow-sm" />
                                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white"><Clock size={10} /></div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{item.memberName}</h4>
                                            <p className="text-xs text-slate-500 font-mono tracking-wide">{item.memberPhone}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold">{item.note}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Amount</p>
                                        <p className="text-2xl font-black text-blue-600">฿{item.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 2. Overdue Modal (Late Payments) - Luxury Design */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowOverdueModal(false)} />
            <div className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
                <div className="p-8 pb-6 border-b border-red-100 flex justify-between items-center bg-gradient-to-r from-rose-600 to-red-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl shadow-inner border border-white/10"><ShieldAlert size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-bold tracking-tight">รายการค้างชำระ (Overdue)</h3>
                            <p className="text-rose-100 text-sm font-medium mt-0.5">{overdueList.length} รายการที่เกินกำหนด</p>
                        </div>
                    </div>
                    <button onClick={() => setShowOverdueModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"><X size={24} /></button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4 bg-slate-50/50 flex-1 custom-scrollbar">
                    {overdueList.length > 0 ? overdueList.map((item: any) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex items-center justify-between hover:shadow-lg hover:border-red-300 transition-all group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                            <div className="flex items-center gap-5 pl-2">
                                <div className="relative">
                                    <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.memberName}`} alt="" className="w-14 h-14 rounded-full border-4 border-red-50 object-cover shadow-sm" />
                                    <div className="absolute -top-1 -right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border-2 border-white shadow-sm">!</div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-red-600 transition-colors">{item.memberName}</h4>
                                    <p className="text-xs text-slate-500 font-bold mb-1">{item.circleName} (งวด {item.roundNumber})</p>
                                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-bold border border-red-100 inline-flex items-center gap-1">
                                        <Clock size={10} /> ค้าง {item.daysLate} วัน
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 mb-1 font-bold uppercase">Outstanding</p>
                                <p className="text-2xl font-black text-red-600">฿{item.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 mt-1">ครบกำหนด: {new Date(item.dueDate).toLocaleDateString('th-TH')}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">เยี่ยมมาก!</h3>
                            <p className="text-slate-500">ไม่มียอดค้างชำระในขณะนี้</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 3. All Circles Modal - IMPROVED LAYOUT */}
      {showAllCirclesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowAllCirclesModal(false)} />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
                
                {/* Header */}
                <div className="p-8 pb-6 border-b border-slate-200 flex justify-between items-center bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Active Circles</h3>
                            <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                กำลังเดินอยู่ทั้งหมด {runningCircles.length} วง
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowAllCirclesModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors relative z-10 text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Table Content */}
                <div className="overflow-y-auto p-0 flex-1 custom-scrollbar bg-slate-50/30">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[11px] sticky top-0 shadow-sm z-10 tracking-wider">
                            <tr>
                                <th className="px-8 py-5 text-left w-[30%]">ชื่อวงแชร์</th>
                                <th className="px-4 py-5 text-center w-[12%]">ประเภท</th>
                                <th className="px-4 py-5 text-center w-[12%]">สมาชิก</th>
                                <th className="px-4 py-5 text-center w-[15%]">งวดปัจจุบัน</th>
                                <th className="px-4 py-5 text-center w-[18%]">ยอดวง (Total Pot)</th>
                                <th className="px-6 py-5 text-center w-[13%]">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {runningCircles.map((circle) => {
                                const currentRound = circle.rounds.length;
                                const totalPot = circle.principal * (circle.totalSlots - 1);
                                return (
                                    <tr key={circle.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer group h-20" onClick={() => { setViewingCircle(circle); setShowAllCirclesModal(false); }}>
                                        <td className="px-8 py-4">
                                            <div className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                                                {circle.name}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 font-medium">
                                                ID: {circle.id.slice(0,8)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold border shadow-sm ${circle.type === 'DOK_HAK' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                {circle.type === 'DOK_HAK' ? 'ดอกหัก' : 'ดอกตาม'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit mx-auto">
                                                <Users size={12} className="text-slate-400" />
                                                {circle.totalSlots}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-slate-700">
                                                    {currentRound} <span className="text-slate-400 text-xs font-medium">/ {circle.totalSlots}</span>
                                                </span>
                                                <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(currentRound/circle.totalSlots)*100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {/* CENTERED TOTAL POT COLUMN AS REQUESTED */}
                                            <div className="inline-block px-4 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <span className="font-black text-emerald-600 font-mono text-base tracking-tight block">
                                                    ฿{totalPot.toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white p-2.5 rounded-xl transition-all shadow-sm group-hover:scale-110">
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* 4. All Members Modal - Luxury Design */}
      {showAllMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setShowAllMembersModal(false)} />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
                <div className="p-8 pb-6 border-b border-purple-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-light.png')] opacity-10"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl shadow-inner border border-white/10"><Users size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">รายชื่อสมาชิก (Members)</h3>
                            <p className="text-purple-100 text-sm font-medium mt-0.5">ทั้งหมด {members.length} คน</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAllMembersModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-10"><X size={24} /></button>
                </div>

                <div className="p-6 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="ค้นหาสมาชิก (ชื่อ, เบอร์โทร)..." 
                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none shadow-sm font-medium text-slate-700 bg-white"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-3 bg-slate-50/50 flex-1 custom-scrollbar">
                    {members
                        .filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch))
                        .map((member) => (
                        <div key={member.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-purple-200 transition-all cursor-default group">
                            <div className="flex items-center gap-5">
                                <img src={member.avatarUrl} alt="" className="w-16 h-16 rounded-full border-4 border-slate-50 object-cover bg-slate-200 shadow-sm" />
                                <div>
                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition-colors">{member.name}</h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                        <Phone size={14} /> {member.phone}
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold">{member.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
                                    member.riskScore === 'GOOD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    member.riskScore === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                    {member.riskScore}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Risk Status</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Detail Modals (Existing) */}
      {viewingCircle && (
          <CircleDetailModal 
              circle={viewingCircle}
              onClose={() => setViewingCircle(null)}
              onStartCircle={() => alert("กรุณาไปที่หน้า 'จัดการวงแชร์' เพื่อเริ่มเดินวง")}
              onEdit={() => { setEditingCircleId(viewingCircle.id); setViewingCircle(null); setIsEditFormOpen(true); }}
          />
      )}
      {isEditFormOpen && <CircleFormModal onClose={() => setIsEditFormOpen(false)} editingCircleId={editingCircleId} onSuccess={() => setIsEditFormOpen(false)} />}
    </div>
  );
};

export default Dashboard;
