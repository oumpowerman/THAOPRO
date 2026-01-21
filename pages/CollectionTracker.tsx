
import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, ArrowLeft, ChevronRight, Users, Clock, Calendar, RefreshCcw, LayoutGrid, List, Wallet, TrendingUp, PieChart, ShieldCheck, ClipboardCheck, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Transaction, TransactionStatus, CircleStatus, SharePeriod, ShareType, BiddingType } from '../types';
import { AlertModal } from '../components/AlertModal';
import { useCollectionLogic } from '../hooks/useCollectionLogic';
import { PendingBanner } from '../components/collection/PendingBanner';
import { CollectionTable } from '../components/collection/CollectionTable';
import { ReviewSlipModal } from '../components/collection/modals/ReviewSlipModal';
import { calculateSharePayment } from '../lib/share-engine';

// Import Refactored Components
import { OverallStat, CurrentRoundStat } from '../components/collection/CollectionStats';
import { CollectionToolbar } from '../components/collection/CollectionToolbar';
import { ManualPayModal } from '../components/collection/modals/ManualPayModal';
import { OverviewDebtsModal } from '../components/collection/modals/OverviewDebtsModal';
import { ScoreDeductionModal } from '../components/collection/modals/ScoreDeductionModal';
import { CircleSelector } from '../components/collection/CircleSelector';
import { CollectionHeader } from '../components/collection/CollectionHeader';

const CollectionTracker = () => {
  const { circles, members, transactions, payouts, approveTransaction, rejectTransaction, createTransaction, user, showAlert } = useAppContext();
  const [selectedCircleId, setSelectedCircleId] = useState<string>('');
  // Initialize as 0 to indicate "calculating" state
  const [selectedRoundNum, setSelectedRoundNum] = useState<number>(0);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // VIEW MODE STATE
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Review Modal State
  const [reviewingTx, setReviewingTx] = useState<{
      tx: Transaction, 
      memberName: string, 
      amountExpected: number,
      avatarUrl?: string,
      daysLate?: number,    
      fineAmount?: number   
  } | null>(null);

  // Manual Payment/Fine Modal State
  const [showManualPay, setShowManualPay] = useState<any>(null);

  // SCORE DEDUCTION MODAL STATE
  const [scoreDeductionState, setScoreDeductionState] = useState<{
      isOpen: boolean;
      txId: string;
      daysLate: number;
      memberName: string;
  } | null>(null);

  // CONFIRMATION MODAL STATE
  const [confirmState, setConfirmState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
  } | null>(null);

  // OVERVIEW MODAL STATE
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  // FILTER: Show all circles except COMPLETED and INITIALIZING (Trackable)
  const trackableCircles = circles.filter(c => 
      c.status !== CircleStatus.INITIALIZING && 
      c.status !== CircleStatus.COMPLETED
  );

  const activeCircle = trackableCircles.find(c => c.id === selectedCircleId);

  // --- ROUND VISIBILITY LOGIC (Fixed) ---
  const visibleRounds = useMemo(() => {
      if (!activeCircle) return [];
      
      const sorted = [...activeCircle.rounds].sort((a,b) => a.roundNumber - b.roundNumber);
      
      return sorted.filter(r => {
          // Always show rounds that are active or collecting, regardless of date
          if (r.status === 'COLLECTING' || r.status === 'OPEN') return true;
          
          // For completed rounds, show them
          if (r.status === 'COMPLETED') return true;

          // Fallback date check (for future rounds that are NOT open yet)
          const today = new Date();
          today.setHours(23,59,59,999);
          const rDate = new Date(r.date);
          return rDate <= today;
      });
  }, [activeCircle]);

  // SMART ROUND SELECTION: Calculate correct round on Circle Change
  useEffect(() => {
      if (activeCircle && activeCircle.rounds.length > 0) {
          // Sort rounds to ensure we check in order
          const sortedRounds = [...activeCircle.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
          
          // Priority 1: Rounds currently 'COLLECTING' (Approved winner, collecting money)
          let targetRound = sortedRounds.find(r => r.status === 'COLLECTING');
          
          // Priority 2: If no collecting round, logic for displaying the most relevant round
          if (!targetRound) {
              const lastRound = sortedRounds[sortedRounds.length - 1];
              
              // If the latest round is OPEN (Waiting for bid) and it's NOT the first round,
              // we usually want to see the PREVIOUS round (History/Completed) because OPEN rounds have no money to collect yet.
              if (lastRound.status === 'OPEN' && lastRound.roundNumber > 1) {
                  // Fallback to previous round (Round - 1)
                  targetRound = sortedRounds.find(r => r.roundNumber === lastRound.roundNumber - 1);
              } 
              
              // If we still don't have a target (e.g., Round 1 is OPEN, or logic failed), default to the last available round
              if (!targetRound) {
                  targetRound = lastRound;
              }
          }

          if (targetRound) {
              setSelectedRoundNum(targetRound.roundNumber);
          } else {
              setSelectedRoundNum(1);
          }
      } else {
          setSelectedRoundNum(0); // Reset if no circle
      }
  }, [activeCircle]); // Depend on activeCircle object to catch updates

  // USE CUSTOM HOOK FOR LOGIC
  // Pass 1 if 0 to prevent crashes, but we will hide UI if 0
  const { paymentData } = useCollectionLogic({
      circles, members, transactions, payouts, user, selectedCircleId, selectedRoundNum: selectedRoundNum || 1
  });

  // --- FIX: Global Pending Transactions for Banner (Sync with Sidebar) ---
  const allMyCircleIds = circles.map(c => c.id);
  const globalPendingTxs = transactions.filter(t => 
      t.status === 'WAITING_APPROVAL' && allMyCircleIds.includes(t.circleId)
  );

  // --- CALCULATE HISTORICAL DEBTS (For Overview Modal) ---
  const historicalDebts = useMemo(() => {
      if (!activeCircle) return [];
      const debts: any[] = [];

      visibleRounds.forEach(round => {
          activeCircle.members.forEach(member => {
              const txs = transactions.filter(t => 
                  t.circleId === activeCircle.id && 
                  t.roundNumber === round.roundNumber && 
                  t.memberId === member.memberId &&
                  t.status === 'PAID'
              );
              const paidAmount = txs.reduce((sum, t) => sum + t.amountPaid, 0);

              const calc = calculateSharePayment(
                  activeCircle,
                  member,
                  round.roundNumber,
                  round.winnerId,
                  round.bidAmount,
                  round.status === 'OPEN'
              );

              let expected = calc.payAmount;
              if (calc.status === 'PID_TON_PAID') expected = 0;

              if (expected > 0 && paidAmount < expected - 1) {
                  const memberProfile = members.find(m => m.id === member.memberId);
                  debts.push({
                      roundNumber: round.roundNumber,
                      memberId: member.memberId,
                      memberName: memberProfile?.name || 'Unknown',
                      memberAvatar: memberProfile?.avatarUrl,
                      amountExpected: expected,
                      amountPaid: paidAmount,
                      shortage: expected - paidAmount,
                      status: calc.status 
                  });
              }
          });
      });

      return debts.sort((a, b) => a.roundNumber - b.roundNumber);
  }, [activeCircle, visibleRounds, transactions, members]);


  // --- ACTIONS ---

  const handleOpenGlobalReview = (tx: Transaction) => {
      const txMember = members.find(m => m.id === tx.memberId);
      setReviewingTx({
          tx: tx,
          memberName: txMember?.name || 'Unknown',
          amountExpected: tx.amountExpected,
          avatarUrl: txMember?.avatarUrl,
          daysLate: 0,
          fineAmount: 0
      });
  };

  const handleApprove = async () => {
      if(reviewingTx) {
          const memberPaymentData = paymentData.find(p => p.memberId === reviewingTx.tx.memberId);
          const isLate = memberPaymentData && memberPaymentData.daysLate > 0;

          if (isLate && !reviewingTx.tx.id.startsWith('temp-')) {
              setScoreDeductionState({
                  isOpen: true,
                  txId: reviewingTx.tx.id,
                  daysLate: memberPaymentData.daysLate,
                  memberName: reviewingTx.memberName
              });
              return;
          }

          if (reviewingTx.tx.id.startsWith('temp-')) {
             const realTx: Transaction = {
                 ...reviewingTx.tx,
                 id: `tx-admin-${Date.now()}`,
                 status: 'PAID' as TransactionStatus,
                 timestamp: new Date().toLocaleTimeString()
             };
             await createTransaction(realTx);
          } else {
             await approveTransaction(reviewingTx.tx.id);
          }
          setReviewingTx(null);
      }
  };

  const handleConfirmScoreDeduction = async (points: number) => {
      if (scoreDeductionState) {
          await approveTransaction(scoreDeductionState.txId, points);
          setScoreDeductionState(null);
          setReviewingTx(null);
          showAlert(`อนุมัติและหักคะแนน ${points} แต้มเรียบร้อย`, 'สำเร็จ', 'success');
      }
  };

  const handleReject = async () => {
      if(reviewingTx) {
          const reason = "System not found / ตรวจไม่พบยอด";
          if (reviewingTx.tx.id.startsWith('temp-')) {
             const realTx: Transaction = {
                 ...reviewingTx.tx,
                 id: `tx-admin-${Date.now()}`,
                 status: 'REJECTED' as TransactionStatus,
                 rejectReason: reason,
                 timestamp: new Date().toLocaleTimeString()
             };
             await createTransaction(realTx);
          } else {
             await rejectTransaction(reviewingTx.tx.id, reason);
          }
          setReviewingTx(null);
      }
  };

  const handleManualSubmit = (amount: number, note: string, isFine: boolean) => {
      if (!showManualPay || !activeCircle) return;

      const memberName = showManualPay.name;
      const typeLabel = isFine ? 'ค่าปรับล่าช้า' : 'ชำระเงินปกติ';

      setConfirmState({
          isOpen: true,
          title: 'ยืนยันการบันทึกยอด (Manual)',
          message: `สมาชิก: ${memberName}\nประเภท: ${typeLabel}\nยอดเงิน: ฿${amount.toLocaleString()}\n\nคุณตรวจสอบว่าได้รับเงินจริงแล้วใช่หรือไม่?`,
          onConfirm: async () => {
              const newTx: Transaction = {
                  id: `tx-manual-${Date.now()}`,
                  circleId: activeCircle.id,
                  roundNumber: selectedRoundNum,
                  memberId: showManualPay.memberId,
                  amountExpected: showManualPay.amountExpected,
                  amountPaid: amount,
                  status: 'PAID',
                  timestamp: new Date().toLocaleString('th-TH'),
                  note: note || (isFine ? 'ค่าปรับล่าช้า' : 'ชำระเงินสด/โอน (Admin บันทึก)'),
                  isFine: isFine
              };

              await createTransaction(newTx);
              setConfirmState(null);
              setShowManualPay(null);
              showAlert('บันทึกยอดชำระเรียบร้อย', 'สำเร็จ', 'success');
          }
      });
  };

  // Processing Filtered Data for Display
  const filteredData = paymentData.filter(item => {
    const matchesFilter = filter === 'ALL' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
      const getScore = (item: typeof paymentData[0]) => {
          const status = item.status as string; 
          if (status === 'WAITING_PAYOUT') return 0;
          if (status === 'WAITING_APPROVAL') return 1;
          if (item.daysLate > 0 && status !== 'PAID' && item.roundStatus !== 'WINNER') return 2;
          if (status === 'PENDING') return 3;
          if (status === 'PARTIAL') return 4;
          if (status === 'PAID') return 5;
          if (status === 'PAYOUT_COMPLETED') return 6;
          return 7;
      };
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      if (scoreA !== scoreB) {
          return scoreA - scoreB;
      }
      return a.slotNumber - b.slotNumber;
  });

  // Calculate Stats for Current Round
  const currentRoundPayers = paymentData.filter(p => p.amountExpected > 0);
  
  // Headcount Stats (for Text Display)
  const paidCount = currentRoundPayers.filter(p => (p.status as string) === 'PAID' || (p.status as string) === 'PAYOUT_COMPLETED').length;
  const totalCount = currentRoundPayers.length;
  
  // Financial Stats (for Progress Bar)
  const collectedAmountRound = currentRoundPayers.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const expectedAmountRound = currentRoundPayers.reduce((sum, p) => sum + (p.amountExpected || 0), 0);
  
  // Progress Percent based on AMOUNT
  const progressPercent = expectedAmountRound > 0 ? (collectedAmountRound / expectedAmountRound) * 100 : 0;

  // --- UPDATED LOGIC: Total Stats based on VISIBLE ROUNDS ONLY ---
  const { totalCollectedBills, totalExpectedBills } = useMemo(() => {
      if (!activeCircle) return { totalCollectedBills: 0, totalExpectedBills: 1 };

      let collected = 0;
      let expected = 0;

      visibleRounds.forEach(round => {
          activeCircle.members.forEach(member => {
              const calc = calculateSharePayment(
                  activeCircle,
                  member,
                  round.roundNumber,
                  round.winnerId,
                  round.bidAmount,
                  round.status === 'OPEN'
              );
              if (calc.payAmount <= 0) return;
              
              expected++;
              
              const hasPaid = transactions.some(t => 
                  t.circleId === activeCircle.id &&
                  t.roundNumber === round.roundNumber &&
                  t.memberId === member.memberId &&
                  t.status === 'PAID'
              );
              if (hasPaid) collected++;
          });
      });

      return { totalCollectedBills: collected, totalExpectedBills: expected };
  }, [activeCircle, transactions, visibleRounds]);

  const overallProgress = totalExpectedBills > 0 ? (totalCollectedBills / totalExpectedBills) * 100 : 0;
  const outstandingBills = Math.max(0, totalExpectedBills - totalCollectedBills);
  
  // Calculate Winner Info for Toolbar
  let winnerInfo = null;
  if (activeCircle && selectedRoundNum > 0) {
      const roundData = activeCircle.rounds.find(r => r.roundNumber === selectedRoundNum);
      if (roundData && roundData.winnerId) {
          const winner = members.find(m => m.id === roundData.winnerId);
          const winnerName = winner 
             ? winner.name 
             : (user && user.id === roundData.winnerId ? `${user.name} (คุณ/ท้าวแชร์)` : 'Unknown');
          winnerInfo = { name: winnerName, bid: roundData.bidAmount };
      }
  }

  const getPeriodLabel = (p: SharePeriod) => {
        switch(p) {
            case SharePeriod.DAILY: return 'รายวัน';
            case SharePeriod.WEEKLY: return 'รายสัปดาห์';
            case SharePeriod.MONTHLY: return 'รายเดือน';
            default: return p;
        }
  };

  // --- VIEW: LANDING PAGE (NO SELECTED CIRCLE) ---
  if (!activeCircle) {
      return (
          <div className="space-y-6 pb-20 animate-in fade-in duration-300">
              
              <PendingBanner 
                  transactions={globalPendingTxs} 
                  circles={circles} 
                  members={members} 
                  onReview={handleOpenGlobalReview} 
              />

              {/* MODERN HEADER BANNER */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl mb-6">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                          <div className="flex items-center gap-3 mb-2">
                              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                  <ClipboardCheck size={32} className="text-blue-300" />
                              </div>
                              <div>
                                  <h2 className="text-3xl font-bold tracking-tight text-white">ติดตามยอด (Collection)</h2>
                                  <p className="text-blue-200 text-sm">ตรวจสอบสถานะการโอนเงินและอนุมัติสลิป</p>
                              </div>
                          </div>
                      </div>

                      {/* View Mode Toggle (Styled) */}
                      <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                          <button 
                              onClick={() => setViewMode('GRID')}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                          >
                              <LayoutGrid size={18} /> Grid
                          </button>
                          <button 
                              onClick={() => setViewMode('LIST')}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                          >
                              <List size={18} /> List
                          </button>
                      </div>
                  </div>
              </div>

              {trackableCircles.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <AlertCircle size={48} className="mb-4 opacity-50" />
                      <p className="text-lg">ไม่พบข้อมูลวงแชร์ที่กำลังเดินอยู่</p>
                      <p className="text-sm">กรุณาสร้างและเริ่มเดินวงแชร์ก่อนเริ่มติดตามยอด</p>
                  </div>
              ) : (
                  <>
                    {/* --- GRID VIEW --- */}
                    {viewMode === 'GRID' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trackableCircles.map((circle) => {
                                const currentRound = circle.rounds.length;
                                const deadCount = circle.members.filter(m => m.status === 'DEAD').length;
                                const progress = (deadCount / circle.totalSlots) * 100;
                                const isDokHak = circle.type === ShareType.DOK_HAK;

                                return (
                                    <div 
                                        key={circle.id}
                                        onClick={() => { setSelectedCircleId(circle.id); setSelectedRoundNum(0); }}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 cursor-pointer transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                                    >
                                        {/* Status Stripe */}
                                        <div className={`h-1.5 w-full ${isDokHak ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}></div>
                                        
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2.5 rounded-xl text-white shadow-md ${isDokHak ? 'bg-orange-500' : 'bg-indigo-500'}`}>
                                                    <Users size={20} />
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide ${isDokHak ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        {isDokHak ? 'ดอกหัก' : 'ดอกตาม'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide border ${circle.biddingType === BiddingType.FIXED ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                        {circle.biddingType === BiddingType.FIXED ? 'ขั้นบันได' : 'ประมูล'}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors mb-1 truncate">
                                                {circle.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium mb-4">
                                                {circle.totalSlots} มือ • {getPeriodLabel(circle.period)}
                                            </p>

                                            {/* Progress Section */}
                                            <div className="mt-auto">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-xs font-bold text-slate-500">ความคืบหน้า</span>
                                                    <span className="text-xs font-bold text-blue-600">{Math.round(progress)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${isDokHak ? 'bg-orange-400' : 'bg-indigo-400'}`} style={{ width: `${progress}%` }}></div>
                                                </div>

                                                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock size={12} /> งวด {currentRound}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-400 uppercase font-bold">เงินต้น</p>
                                                        <p className="font-bold text-slate-800">฿{circle.principal.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors pointer-events-none"></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* --- LIST VIEW --- */}
                    {viewMode === 'LIST' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left">ชื่อวงแชร์</th>
                                        <th className="px-6 py-4 text-center">ประเภท</th>
                                        <th className="px-6 py-4 text-center">งวดปัจจุบัน</th>
                                        <th className="px-6 py-4 text-center">สถานะการเก็บ</th>
                                        <th className="px-6 py-4 text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {trackableCircles.map((circle) => {
                                        const currentRound = circle.rounds.length;
                                        // Simple stats for list view (Approximation for performance)
                                        const deadCount = circle.members.filter(m => m.status === 'DEAD').length;
                                        const totalSlots = circle.totalSlots;
                                        const progress = (deadCount / totalSlots) * 100;

                                        return (
                                            <tr 
                                                key={circle.id} 
                                                onClick={() => { setSelectedCircleId(circle.id); setSelectedRoundNum(0); }}
                                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                                                        {circle.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                                        <Calendar size={12} /> {getPeriodLabel(circle.period)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${circle.type === 'DOK_HAK' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                                                            {circle.type === 'DOK_HAK' ? 'ดอกหัก' : 'ดอกตาม'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {circle.biddingType === BiddingType.FIXED ? 'ขั้นบันได' : 'ประมูล'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700">
                                                    {currentRound} / {circle.totalSlots}
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="w-full max-w-[100px] mx-auto">
                                                        <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500">
                                                            <span>เปียแล้ว {Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                  </>
              )}

              {/* Modals needed for Banner review */}
              <ReviewSlipModal 
                  isOpen={!!reviewingTx} 
                  data={reviewingTx} 
                  onClose={() => setReviewingTx(null)}
                  onApprove={handleApprove}
                  onReject={handleReject}
              />
              <ScoreDeductionModal 
                  isOpen={!!scoreDeductionState}
                  onClose={() => setScoreDeductionState(null)}
                  memberName={scoreDeductionState?.memberName || ''}
                  daysLate={scoreDeductionState?.daysLate || 0}
                  onConfirm={handleConfirmScoreDeduction}
              />
          </div>
      );
  }

  // --- LOADING STATE (When Round Not Calculated) ---
  if (selectedRoundNum === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
              <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
              <p className="font-bold text-lg text-slate-600">กำลังโหลดข้อมูล...</p>
              <p className="text-xs">Calculating active round</p>
          </div>
      );
  }

  // --- VIEW: DETAIL PAGE (SELECTED CIRCLE) ---
  return (
    <div className="space-y-6 pb-20 animate-in slide-in-from-right-4 duration-300">
       
       {/* DETAIL HEADER WITH BACK BUTTON */}
       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between sticky top-0 z-20">
           <div className="flex items-center gap-4">
               <button 
                   onClick={() => setSelectedCircleId('')}
                   className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-800"
               >
                   <ArrowLeft size={24} />
                   <span className="hidden sm:inline font-bold text-sm">เปลี่ยนวง</span>
               </button>
               <div>
                   <h2 className="text-xl font-bold text-slate-800">{activeCircle.name}</h2>
                   <p className="text-xs text-slate-500 flex items-center gap-2">
                       {activeCircle.totalSlots} มือ • {getPeriodLabel(activeCircle.period)} • 
                       <span className={`px-1.5 py-0.5 rounded font-bold ${activeCircle.biddingType === BiddingType.FIXED ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                           {activeCircle.biddingType === BiddingType.FIXED ? 'ขั้นบันได' : 'ประมูล'}
                       </span>
                   </p>
               </div>
           </div>
           
           {/* Explicit Clear Button */}
           <button 
               onClick={() => setSelectedCircleId('')}
               className="p-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors flex items-center gap-1.5"
               title="เคลียร์การเลือก/กลับหน้ารวม"
           >
               <RefreshCcw size={16} />
               <span className="text-xs font-bold hidden sm:inline">เคลียร์วงแชร์</span>
           </button>
       </div>

       {/* STATS LAYOUT (REFACTORED UI) */}
       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           <CurrentRoundStat 
               selectedRoundNum={selectedRoundNum}
               paidCount={paidCount}
               totalCount={totalCount}
               progressPercent={progressPercent}
               collectedAmount={collectedAmountRound}
               expectedAmount={expectedAmountRound}
           />

           <OverallStat 
                totalCollectedBills={totalCollectedBills}
                totalExpectedBills={totalExpectedBills}
                overallProgress={overallProgress}
                outstandingBills={outstandingBills}
                onShowOverview={() => setShowOverviewModal(true)}
           />
       </div>

       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
              <CollectionToolbar 
                  filter={filter}
                  onFilterChange={setFilter}
                  activeCircle={activeCircle}
                  selectedRoundNum={selectedRoundNum}
                  onRoundChange={setSelectedRoundNum}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  winnerInfo={winnerInfo}
                  visibleRounds={visibleRounds} // PASS VISIBLE ROUNDS
              />
          </div>

          <div className="p-0">
              <CollectionTable 
                 data={filteredData} 
                 biddingType={activeCircle.biddingType}
                 onManualPay={setShowManualPay}
                 onReview={(p) => {
                     if (p.latestTxObject) {
                         setReviewingTx({ 
                             tx: p.latestTxObject, 
                             memberName: p.name, 
                             amountExpected: p.amountExpected, 
                             avatarUrl: p.avatar,
                             daysLate: p.daysLate, 
                             fineAmount: p.fineAmount 
                         });
                     } else {
                         showAlert("ไม่มีรายการแจ้งโอนเข้ามา", "แจ้งเตือน", 'info');
                     }
                 }}
              />
          </div>
       </div>

      {/* --- MODALS --- */}
      <OverviewDebtsModal 
          isOpen={showOverviewModal}
          onClose={() => setShowOverviewModal(false)}
          circle={activeCircle}
          historicalDebts={historicalDebts}
      />

      <ManualPayModal 
          isOpen={!!showManualPay}
          onClose={() => setShowManualPay(null)}
          data={showManualPay}
          roundNumber={selectedRoundNum}
          onConfirm={handleManualSubmit}
      />

      <AlertModal 
          isOpen={!!confirmState}
          onClose={() => setConfirmState(null)}
          title={confirmState?.title}
          message={confirmState?.message || ''}
          onConfirm={confirmState?.onConfirm}
          type="confirm"
          confirmText="ยืนยันบันทึก"
          cancelText="ยกเลิก"
      />

      <ScoreDeductionModal 
          isOpen={!!scoreDeductionState}
          onClose={() => setScoreDeductionState(null)}
          memberName={scoreDeductionState?.memberName || ''}
          daysLate={scoreDeductionState?.daysLate || 0}
          onConfirm={handleConfirmScoreDeduction}
      />

      <ReviewSlipModal 
          isOpen={!!reviewingTx} 
          data={reviewingTx} 
          onClose={() => setReviewingTx(null)}
          onApprove={handleApprove}
          onReject={handleReject}
      />
    </div>
  );
};

export default CollectionTracker;
