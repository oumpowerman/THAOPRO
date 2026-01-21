
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, Wallet, TrendingUp, Users, X, ArrowRight, ChevronRight, Clock, ShieldAlert, CheckCircle2, ChevronLeft, Calendar, CircleDollarSign, Activity, PieChart as PieChartIcon, ArrowUpRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ShareType, CircleStatus, SharePeriod, BiddingType, ShareCircle } from '../types';
import { CircleDetailModal } from '../components/CircleDetailModal';
import { CircleFormModal } from '../components/CircleFormModal';

const COLORS = ['#10B981', '#EF4444'];

const Dashboard = () => {
  const { circles, members, transactions, user } = useAppContext();
  
  // Modal States
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showAllCirclesModal, setShowAllCirclesModal] = useState(false);
  const [showAllMembersModal, setShowAllMembersModal] = useState(false);

  // Drill-down State for Collection Modal
  const [collectionCircleId, setCollectionCircleId] = useState<string | null>(null);

  // Circle Detail Modal State
  const [viewingCircle, setViewingCircle] = useState<ShareCircle | null>(null);
  
  // Edit Form State (Added to enable editing from Dashboard)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingCircleId, setEditingCircleId] = useState<string | null>(null);

  // --- FILTERED DATA (Exclude INITIALIZING and COMPLETED circles) ---
  // Fix: Previously only excluded INITIALIZING. Now excluding COMPLETED as well.
  const runningCircles = circles.filter(c => 
      c.status !== CircleStatus.INITIALIZING && 
      c.status !== CircleStatus.COMPLETED
  );

  // Derived stats from real context data
  const totalMembers = members.length;
  const activeCirclesCount = runningCircles.length; // Count only running circles
  
  // Calculate alive vs dead hands across all running circles
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

  // --- LOGIC 1: Expected Collection (ยอดที่ต้องเก็บ) ---
  const duePayments = runningCircles.flatMap(circle => {
     // Filter out Thao/Admin from the collection list
     const membersToCollect = circle.members.filter(cm => {
         if (user && cm.memberId === user.id) return false;
         return true;
     });

     return membersToCollect.map(cm => {
        let memberName = 'Unknown';
        let memberPhone = '';
        let memberAvatar = '';

        const memberProfile = members.find(m => m.id === cm.memberId);
        
        if (memberProfile) {
            memberName = memberProfile.name;
            memberPhone = memberProfile.phone;
            memberAvatar = memberProfile.avatarUrl;
        }

        let amount = circle.principal;
        let note = '';
        
        if (cm.status === 'DEAD') {
            if (circle.type === ShareType.DOK_TAM) {
                amount += (cm.bidAmount || 0);
                note = 'ต้น + ดอกตาม';
            } else {
                note = 'จ่ายเต็ม (มือตาย)';
            }
        } else {
             note = 'เงินต้น (รอหักดอก)';
        }

        return {
            id: `${circle.id}-${cm.memberId}`,
            circleId: circle.id, // Added for grouping
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
     });
  });

  const totalExpectedCollection = duePayments.reduce((sum, item) => sum + item.amount, 0);

  // Group Payments by Circle for Drill-down View
  const collectionByCircle = duePayments.reduce((acc: any, item) => {
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
      const dueDate = new Date(circle.nextDueDate);
      const today = new Date();
      // Reset time for fair comparison
      today.setHours(0,0,0,0);
      dueDate.setHours(0,0,0,0);

      // If due date is in the future, nobody is overdue yet (simplified logic)
      if (dueDate >= today) return [];

      // Filter out Thao/Admin from Overdue list as well
      const membersToCheck = circle.members.filter(cm => {
         if (user && cm.memberId === user.id) return false;
         return true;
      });

      return membersToCheck.map(cm => {
          // Check if this member has PAID for this circle
          const hasPaid = transactions.some(t => 
              t.circleId === circle.id && 
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

          const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
          
          let amount = circle.principal;
          if (cm.status === 'DEAD' && circle.type === ShareType.DOK_TAM) {
              amount += (cm.bidAmount || 0);
          }

          return {
              id: `${circle.id}-${cm.memberId}-overdue`,
              circleName: circle.name,
              memberName: memberName,
              memberPhone: memberPhone,
              avatar: memberAvatar,
              amount: amount,
              daysLate: daysLate,
              dueDate: circle.nextDueDate
          };
      }).filter(Boolean); // Remove nulls
  });

  // Helpers for displaying Enums nicely
  const getCircleTypeLabel = (type: ShareType) => type === ShareType.DOK_HAK ? 'ดอกหัก' : 'ดอกตาม';
  const getPeriodLabel = (p: SharePeriod) => {
      switch(p) {
          case SharePeriod.DAILY: return 'รายวัน';
          case SharePeriod.WEEKLY: return 'รายสัปดาห์';
          case SharePeriod.MONTHLY: return 'รายเดือน';
          default: return p;
      }
  };

  const getRiskColor = (score: string) => {
      switch(score) {
          case 'GOOD': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
          case 'WATCHLIST': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. HERO BANNER: COMMAND CENTER */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
          
          <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                          <Activity size={20} className="text-emerald-400" />
                      </div>
                      <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Financial Overview</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">สวัสดี, ท้าวแชร์มืออาชีพ</h2>
                  <p className="text-slate-400 mt-2 max-w-lg">
                      ติดตามสถานะการเงิน ยอดค้างชำระ และภาพรวมความเสี่ยงของวงแชร์ทั้งหมดได้ที่นี่
                  </p>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold">วันนี้</p>
                      <p className="text-white font-bold text-lg">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="h-10 w-px bg-white/10"></div>
                  <Calendar size={32} className="text-white/80" />
              </div>
          </div>
      </div>

      {/* 2. STATS GRID (PREMIUM CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Collection (Hero Card) */}
        <div 
            onClick={() => {
                setCollectionCircleId(null); 
                setShowCollectionModal(true);
            }}
            className="group relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 shadow-xl shadow-blue-900/20 cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={80} />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                <div>
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm w-fit">
                            <Wallet size={24} className="text-white" />
                        </div>
                        <div className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-sm">
                            Real-time
                        </div>
                    </div>
                    <p className="text-blue-100 text-sm font-medium mt-4">ยอดที่ต้องเก็บ (รวม)</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight mt-1">฿{totalExpectedCollection.toLocaleString()}</h3>
                </div>
                <div className="mt-4 flex items-center text-white/80 text-xs gap-1 group-hover:text-white transition-colors">
                    <span>แตะเพื่อดูรายละเอียด</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>

        {/* Card 2: Active Circles */}
        <div 
            onClick={() => setShowAllCirclesModal(true)}
            className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-200 hover:shadow-lg transition-all relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <TrendingUp size={24} />
                </div>
                <p className="text-slate-500 text-sm font-medium">วงแชร์ที่เดินอยู่</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeCirclesCount} <span className="text-lg text-slate-400 font-normal">วง</span></h3>
                <p className="text-xs text-emerald-600 mt-4 font-bold flex items-center gap-1">
                    สถานะ Active <CheckCircle2 size={12} />
                </p>
            </div>
        </div>

        {/* Card 3: Total Members */}
        <div 
            onClick={() => setShowAllMembersModal(true)}
            className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:border-purple-200 hover:shadow-lg transition-all relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl w-fit mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Users size={24} />
                </div>
                <p className="text-slate-500 text-sm font-medium">สมาชิกทั้งหมด</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalMembers} <span className="text-lg text-slate-400 font-normal">คน</span></h3>
                <p className="text-xs text-purple-600 mt-4 font-bold flex items-center gap-1">
                    ดูรายชื่อ <ChevronRight size={12} />
                </p>
            </div>
        </div>

        {/* Card 4: Overdue (Dynamic Style) */}
        <div 
            onClick={() => setShowOverdueModal(true)}
            className={`group rounded-3xl p-6 shadow-sm border cursor-pointer transition-all relative overflow-hidden ${
                overdueList.length > 0 
                ? 'bg-white border-red-100 hover:border-red-300 hover:shadow-red-100' 
                : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-emerald-50'
            }`}
        >
            <div className={`absolute right-0 top-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${overdueList.length > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}></div>
            <div className="relative z-10">
                <div className={`p-2 rounded-xl w-fit mb-4 transition-colors ${overdueList.length > 0 ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'}`}>
                    {overdueList.length > 0 ? <ShieldAlert size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <p className="text-slate-500 text-sm font-medium">ค้างชำระเกินกำหนด</p>
                <h3 className={`text-3xl font-bold mt-1 ${overdueList.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {overdueList.length} <span className="text-lg text-slate-400 font-normal">รายการ</span>
                </h3>
                <p className={`text-xs mt-4 font-bold flex items-center gap-1 ${overdueList.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {overdueList.length > 0 ? 'จัดการด่วน!' : 'ไม่มีรายการค้าง'}
                </p>
            </div>
        </div>

      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Chart (Left 1/3) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <PieChartIcon size={20} />
              </div>
              <h3 className="font-bold text-lg text-slate-800">วิเคราะห์ความเสี่ยง</h3>
          </div>
          
          <div className="flex-1 min-h-[250px] relative">
            {aliveHands + deadHands > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                    <PieChartIcon size={48} className="opacity-20 mb-2" />
                    <p>ไม่มีข้อมูลวงแชร์</p>
                </div>
            )}
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{aliveHands + deadHands}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Hands</span>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                <span className="text-sm font-bold text-slate-600">มือเป็น ({aliveHands})</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
                <span className="text-sm font-bold text-slate-600">มือตาย ({deadHands})</span>
            </div>
          </div>
        </div>

        {/* Bidding Schedule (Right 2/3) */}
        <div className="bg-white p-0 rounded-3xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <Calendar size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">ตารางการเปียแชร์</h3>
              </div>
              <button 
                onClick={() => setShowAllCirclesModal(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                  ดูทั้งหมด <ArrowUpRight size={14} />
              </button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 font-bold uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-[25%]">ชื่อวง</th>
                  <th className="px-4 py-4 text-center w-[12%]">งวดปัจจุบัน</th>
                  <th className="px-4 py-4 text-center w-[13%]">ประเภท</th>
                  <th className="px-4 py-4 text-right w-[15%]">ยอดดอกรวม</th>
                  <th className="px-4 py-4 text-center w-[10%]">เหลือ (มือ)</th>
                  <th className="px-4 py-4 w-[13%]">วันที่เปีย</th>
                  <th className="px-6 py-4 text-center w-[12%]">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {runningCircles.length > 0 ? runningCircles.map((circle, idx) => {
                  const currentRound = circle.rounds.length;
                  const totalRounds = circle.totalSlots;
                  
                  const totalInterest = circle.rounds
                      .filter(r => r.status === 'COMPLETED')
                      .reduce((sum, r) => sum + r.bidAmount, 0);

                  const remainingHands = circle.members.filter(m => m.status === 'ALIVE').length;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                          {circle.name}
                      </td>
                      <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                              {currentRound} / {totalRounds}
                          </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${circle.type === 'DOK_HAK' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                          {circle.type === 'DOK_HAK' ? 'ดอกหัก' : 'ดอกตาม'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-700 font-mono">
                          ฿{totalInterest.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs mx-auto border border-slate-200">
                              {remainingHands}
                          </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-600">
                          {new Date(circle.nextDueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Active
                          </span>
                      </td>
                    </tr>
                  );
                }) : (
                    <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            <CircleDollarSign size={48} className="mx-auto mb-2 opacity-20" />
                            <p>ไม่มีข้อมูลวงแชร์ที่กำลังเดินอยู่</p>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODALS (Re-styled Headers) --- */}

      {/* MODAL 1: Collections with Drill Down */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCollectionModal(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header changes based on view level */}
                <div className="p-6 border-b border-blue-500/10 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div className="flex items-center gap-3">
                        {collectionCircleId ? (
                             <button 
                                onClick={() => setCollectionCircleId(null)} 
                                className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                             >
                                 <ChevronLeft size={24} />
                             </button>
                        ) : (
                             <div className="p-2 bg-white/20 rounded-xl"><Wallet size={24} /></div>
                        )}
                        
                        <div>
                            <h3 className="text-xl font-bold">
                                {collectionCircleId && selectedCircleCollection 
                                    ? selectedCircleCollection.name 
                                    : 'ยอดที่ต้องเก็บ (Expected Collection)'}
                            </h3>
                            <p className="text-blue-100 text-sm opacity-90">
                                {collectionCircleId && selectedCircleCollection 
                                    ? `ยอดรวมวงนี้: ฿${selectedCircleCollection.totalAmount.toLocaleString()}` 
                                    : `รวมทั้งหมด: ฿${totalExpectedCollection.toLocaleString()}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowCollectionModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 flex-1">
                    {/* LEVEL 1: LIST CIRCLES */}
                    {!collectionCircleId && (
                        <>
                           {collectionCirclesList.length > 0 ? (
                               collectionCirclesList.map((group: any) => (
                                   <div 
                                      key={group.id} 
                                      onClick={() => setCollectionCircleId(group.id)}
                                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                   >
                                       <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                               {group.count}
                                           </div>
                                           <div>
                                               <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-lg">{group.name}</h4>
                                               <p className="text-xs text-slate-500 font-medium">รอเก็บ {group.count} คน</p>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-3">
                                            <p className="text-lg font-bold text-slate-800">฿{group.totalAmount.toLocaleString()}</p>
                                            <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" size={20} />
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="text-center py-20 text-slate-400">
                                   <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                                   <p>ไม่มีรายการที่ต้องเก็บ</p>
                               </div>
                           )}
                        </>
                    )}

                    {/* LEVEL 2: LIST MEMBERS IN CIRCLE */}
                    {collectionCircleId && selectedCircleCollection && (
                        <>
                            {selectedCircleCollection.items.map((item: any) => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.memberName}`} alt="" className="w-12 h-12 rounded-full border-2 border-slate-100 object-cover" />
                                        <div>
                                            <h4 className="font-bold text-slate-800">{item.memberName}</h4>
                                            <p className="text-xs text-slate-500 font-mono">{item.memberPhone}</p>
                                            <div className="flex gap-2 mt-1.5">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.status === 'DEAD' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    {item.status === 'DEAD' ? 'มือตาย' : 'มือเป็น'}
                                                </span>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                                    {item.note}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-600">฿{item.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* MODAL 2: All Circles List */}
      {showAllCirclesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAllCirclesModal(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-6 flex justify-between items-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl"><CircleDollarSign size={24} /></div>
                          <div>
                              <h3 className="text-xl font-bold">วงแชร์ทั้งหมด</h3>
                              <p className="text-emerald-100 text-sm opacity-90">Active Circles: {activeCirclesCount}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAllCirclesModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 flex-1">
                      {runningCircles.length > 0 ? runningCircles.map((circle) => (
                          <div 
                            key={circle.id} 
                            onClick={() => setViewingCircle(circle)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group cursor-pointer hover:border-emerald-300"
                          >
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-lg text-slate-800 group-hover:text-emerald-600 transition-colors">{circle.name}</h4>
                                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                                          Active
                                      </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 font-medium">
                                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"><Users size={12}/> {circle.members.length}/{circle.totalSlots} คน</span>
                                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"><Calendar size={12}/> {getPeriodLabel(circle.period)}</span>
                                      <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">{getCircleTypeLabel(circle.type)}</span>
                                  </div>
                              </div>
                              <div className="text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0 flex flex-row sm:flex-col justify-between items-center sm:items-end">
                                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">เงินต้นรวม</span>
                                  <span className="text-xl font-bold text-emerald-600">฿{(circle.principal*(totalMembers-1)).toLocaleString()}</span>
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-20 text-slate-400">ไม่มีข้อมูลวงแชร์ที่กำลังเดินอยู่</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL 3: All Members List */}
      {showAllMembersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAllMembersModal(false)} />
              <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-6 flex justify-between items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-xl"><Users size={24} /></div>
                          <div>
                              <h3 className="text-xl font-bold">สมาชิกทั้งหมด</h3>
                              <p className="text-purple-100 text-sm opacity-90">Total Members: {totalMembers}</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAllMembersModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 flex-1">
                      {members.filter(m => m.role !== 'ADMIN').length > 0 ? members.filter(m => m.role !== 'ADMIN').map((member) => (
                          <div key={member.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="relative">
                                      <img src={member.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 bg-slate-200" />
                                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                          member.status === 'ACTIVE' ? 'bg-emerald-500' : 
                                          member.status === 'PENDING' ? 'bg-amber-400' : 'bg-red-500'
                                      }`}></div>
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-800">{member.name}</h4>
                                      <p className="text-sm text-slate-500 font-mono">{member.phone}</p>
                                  </div>
                              </div>
                              <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRiskColor(member.riskScore)}`}>
                                  {member.riskScore}
                              </div>
                          </div>
                      )) : (
                          <div className="text-center py-20 text-slate-400">ไม่มีสมาชิกในระบบ</div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL 4: Overdue Details */}
      {showOverdueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOverdueModal(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                {/* Red Header for Urgency */}
                <div className="p-6 flex justify-between items-center bg-gradient-to-r from-red-600 to-red-500 text-white">
                    <div>
                        <div className="flex items-center gap-2">
                           <ShieldAlert size={24} className="animate-pulse" />
                           <h3 className="text-xl font-bold">รายการค้างชำระ (Overdue)</h3>
                        </div>
                        <p className="text-red-100 text-sm mt-1 opacity-90">จำนวน: {overdueList.length} รายการ</p>
                    </div>
                    <button onClick={() => setShowOverdueModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-3 bg-red-50/30 flex-1">
                    {overdueList.length > 0 ? overdueList.map((item: any) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 group-hover:w-2 transition-all"></div>
                            <div className="flex items-center gap-3 pl-3">
                                <img src={item.avatar || `https://ui-avatars.com/api/?name=${item.memberName}`} alt="" className="w-12 h-12 rounded-full border-2 border-red-50 object-cover" />
                                <div>
                                    <h4 className="font-bold text-slate-900">{item.memberName}</h4>
                                    <p className="text-xs text-slate-500">{item.circleName}</p>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                         <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">
                                            <Clock size={10} />
                                            เกินกำหนด {item.daysLate} วัน
                                         </span>
                                         {item.memberPhone && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                                {item.memberPhone}
                                            </span>
                                         )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-red-600">฿{item.amount.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 mt-1">ครบกำหนด: {new Date(item.dueDate).toLocaleDateString('th-TH')}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
                             <CheckCircle2 size={64} className="text-emerald-400 mb-4 opacity-50" />
                             <p className="text-xl font-bold text-slate-600">ไม่มีรายการค้างชำระ</p>
                             <p className="text-sm">ลูกแชร์ของคุณชำระเงินตรงเวลาทุกคน</p>
                        </div>
                    )}
                </div>
                
                {overdueList.length > 0 && (
                     <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
                        <button className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
                            <ShieldAlert size={18} />
                            ส่งแจ้งเตือนทวงหนี้ (รายบุคคล)
                        </button>
                     </div>
                )}
            </div>
        </div>
      )}

      {/* Circle Detail Modal */}
      {viewingCircle && (
          <CircleDetailModal 
              circle={viewingCircle}
              onClose={() => setViewingCircle(null)}
              onStartCircle={() => alert("กรุณาไปที่หน้า 'จัดการวงแชร์' เพื่อเริ่มเดินวง")}
              onEdit={() => {
                  setEditingCircleId(viewingCircle.id);
                  setViewingCircle(null);
                  setIsEditFormOpen(true);
              }}
          />
      )}

      {/* Edit Form Modal */}
      {isEditFormOpen && (
          <CircleFormModal 
              onClose={() => setIsEditFormOpen(false)} 
              editingCircleId={editingCircleId} 
              onSuccess={() => setIsEditFormOpen(false)}
          />
      )}
    </div>
  );
};

export default Dashboard;
