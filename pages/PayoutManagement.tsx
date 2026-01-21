
import React, { useState, useMemo } from 'react';
import { ShareCircle, Payout, CircleStatus, Transaction, BiddingType } from '../types';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, Clock, Upload, Filter, Wallet, ArrowRight, X, AlertCircle, TrendingUp, HandCoins, Search, History, Calendar, PlayCircle, Archive, Eye, FileText, QrCode, ClipboardCheck, ChevronRight, ArrowLeft, Users, AlertTriangle, ChevronLeft, Trophy, RefreshCw, ListFilter, Check } from 'lucide-react';
import { useCollectionLogic } from '../hooks/useCollectionLogic';
import { CollectionTable } from '../components/collection/CollectionTable';
import { calculateSharePayment } from '../lib/share-engine';

// --- THAO RECHECK MODAL ---
const ThaoCheckModal = ({
    circleId,
    roundNumber,
    onClose,
    onConfirm
}: {
    circleId: string,
    roundNumber: number,
    onClose: () => void,
    onConfirm: () => void
}) => {
    const { circles, members, transactions, payouts, user } = useAppContext();
    const { activeCircle, paymentData } = useCollectionLogic({
        circles, members, transactions, payouts, user,
        selectedCircleId: circleId,
        selectedRoundNum: roundNumber
    });

    const totalExpected = paymentData.reduce((sum, p) => sum + p.amountExpected, 0);
    const totalCollected = paymentData.reduce((sum, p) => sum + p.amountPaid, 0);
    const isComplete = totalCollected >= totalExpected && totalExpected > 0;
    const progress = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    const remainingAmount = Math.max(0, totalExpected - totalCollected);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">ตรวจสอบยอดรับ (ท้าวแชร์)</h3>
                    <p className="text-slate-500 text-sm mt-1">กรุณาตรวจสอบว่าลูกแชร์ส่งยอดครบถ้วนแล้วหรือยัง</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-500 font-bold">ความคืบหน้า</span>
                        <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-orange-500'}`}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 mb-4 overflow-hidden">
                        <div className={`h-3 rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-orange-400'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-400">ต้องเก็บทั้งหมด</p>
                            <p className="text-lg font-bold text-slate-800">฿{totalExpected.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-400">เก็บได้จริง</p>
                            <p className="text-lg font-bold text-emerald-600">฿{totalCollected.toLocaleString()}</p>
                        </div>
                    </div>

                    {!isComplete && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700 font-bold">
                                ยังขาดอีก ฿{remainingAmount.toLocaleString()} <br/>
                                กรุณาตามยอดให้ครบก่อนกดรับเงิน
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">
                        ยกเลิก
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={!isComplete}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                    >
                        ยืนยันรับยอดครบ
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- PENDING PAYOUTS SUMMARY LIST MODAL ---
const PendingSummaryModal = ({ 
    items, 
    onClose, 
    onPayClick 
}: { 
    items: any[], 
    onClose: () => void, 
    onPayClick: (item: any) => void 
}) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <HandCoins size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">รายการรอโอนทั้งหมด</h3>
                            <p className="text-orange-100 text-sm">รวม {items.length} รายการ</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
                    {items.length > 0 ? (
                        items.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                                        #{item.roundNumber}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{item.winnerName}</h4>
                                        <p className="text-xs text-slate-500">{item.circleName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
                                                {item.winnerBank} {item.winnerAcc}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">ยอดสุทธิ</p>
                                        <p className="text-lg font-bold text-blue-600">฿{item.netAmount.toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => { onClose(); onPayClick(item); }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all"
                                    >
                                        <Wallet size={14} /> โอนเงิน
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <CheckCircle2 size={48} className="mx-auto mb-2 opacity-20" />
                            <p>ไม่มีรายการรอโอน</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex justify-between items-center font-bold text-slate-700">
                        <span>ยอดรวมทั้งสิ้น</span>
                        <span className="text-xl text-orange-600">฿{items.reduce((sum, i) => sum + i.netAmount, 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Payout Detail Modal ---
const PayoutDetailModal = ({ circleId, roundNumber, onClose }: { circleId: string, roundNumber: number, onClose: () => void }) => {
    const { circles, members, transactions, payouts, user } = useAppContext();
    const { activeCircle, paymentData } = useCollectionLogic({
        circles, members, transactions, payouts, user,
        selectedCircleId: circleId,
        selectedRoundNum: roundNumber
    });

    const totalExpected = paymentData.reduce((sum, p) => sum + p.amountExpected, 0);
    const totalCollected = paymentData.reduce((sum, p) => sum + p.amountPaid, 0);
    const progress = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    const payersOnly = paymentData.filter(p => p.amountExpected > 0);
    const paidCount = payersOnly.filter(p => p.status === 'PAID' || p.status === 'PAYOUT_COMPLETED').length;
    const [viewingSlip, setViewingSlip] = useState<{url: string, title: string} | null>(null);

    const isLastRound = activeCircle && roundNumber === activeCircle.totalSlots;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-1">
                            {isLastRound ? (
                                <span className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm flex items-center gap-1.5 animate-in slide-in-from-left-2">
                                    <Trophy size={14} fill="currentColor" /> งวดที่ {roundNumber} (สุดท้าย)
                                </span>
                            ) : (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">งวดที่ {roundNumber}</span>
                            )}
                            <h3 className="text-xl font-bold text-slate-800">{activeCircle?.name}</h3>
                        </div>
                        <p className="text-sm text-slate-500">ตรวจสอบรายการรับยอดจากลูกแชร์</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 bg-white">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <p className="text-xs text-slate-500 mb-1">ยอดที่ต้องเก็บรวม</p>
                        <p className="text-xl font-bold text-slate-800">฿{totalExpected.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50">
                        <p className="text-xs text-emerald-600 mb-1">เก็บได้จริง</p>
                        <p className="text-xl font-bold text-emerald-700">฿{totalCollected.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-white flex flex-col justify-center">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-500">ความคืบหน้า ({paidCount}/{payersOnly.length})</span>
                            <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-0 bg-slate-50">
                    <CollectionTable 
                        data={paymentData}
                        biddingType={activeCircle?.biddingType!}
                        onManualPay={() => {}} 
                        onReview={(item) => {
                            if (item.latestTxObject?.slipUrl) setViewingSlip({ url: item.latestTxObject.slipUrl, title: `สลิปจาก ${item.name}` });
                            else alert('ไม่มีรูปสลิป');
                        }}
                    />
                </div>
                {viewingSlip && (
                    <div className="absolute inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4 rounded-2xl">
                        <div className="relative max-w-full max-h-full">
                            <button onClick={() => setViewingSlip(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-white/20 rounded-full p-2"><X size={20} /></button>
                            <img src={viewingSlip.url} alt="Slip" className="max-h-[70vh] rounded-lg shadow-2xl object-contain bg-black" />
                            <p className="text-white text-center mt-4 font-bold">{viewingSlip.title}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PayoutManagement = () => {
  const { circles, members, payouts, addPayout, updateCircle, user } = useAppContext(); 
  
  const [mainTab, setMainTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE'); 
  const [detailTab, setDetailTab] = useState<'PENDING' | 'COMPLETED'>('PENDING'); 
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null); 
  
  // History Filter & Pagination
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 15; 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); 
  const [filterType, setFilterType] = useState<'ALL' | 'AUCTION' | 'FIXED'>('ALL'); 

  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [showThaoCheckModal, setShowThaoCheckModal] = useState<any>(null);
  const [detailsModalData, setDetailsModalData] = useState<{circleId: string, roundNum: number} | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPendingSummary, setShowPendingSummary] = useState(false);

  // --- DATA PROCESSING ---
  const allPayouts = useMemo(() => {
      return circles.flatMap(circle => {
        return circle.rounds
            // CHANGE: Include COLLECTING status to show Pending Payouts while collecting money
            .filter(r => (r.status === 'COMPLETED' || r.status === 'COLLECTING') && r.winnerId)
            .map(r => {
                const winner = members.find(m => m.id === r.winnerId);
                let winnerName = user && user.id === r.winnerId ? `${user.name} (คุณ/ท้าวแชร์)` : (winner?.name || 'Unknown');
                let winnerBank = winner ? (winner.bankName || '-') : 'Admin Wallet';
                let winnerAcc = winner ? (winner.bankAccountNumber || '-') : '-';
                let winnerQr = winner ? winner.qrCodeUrl : user?.qrCodeUrl;

                const realTotalPot = circle.members.reduce((sum, m) => {
                    const result = calculateSharePayment(circle, m, r.roundNumber, r.winnerId, r.bidAmount, false);
                    return sum + (result.status === 'PID_TON_PAID' ? circle.principal : result.payAmount);
                }, 0);

                const adminFee = circle.adminFee || 0;
                const netAmount = Math.max(0, realTotalPot - adminFee);
                
                // If round is COLLECTING, it's PENDING payout. 
                // If COMPLETED, it might be PAID, unless manually set? 
                // We assume if status is COMPLETED, payout is done.
                // We also check existingPayout table for double confirmation.
                const existingPayout = payouts.find(p => p.circleId === circle.id && p.roundNumber === r.roundNumber);
                const isPaid = !!existingPayout; 

                return {
                    id: `${circle.id}-r${r.roundNumber}`,
                    circleId: circle.id,
                    circleName: circle.name,
                    circleStatus: circle.status,
                    totalSlots: circle.totalSlots,
                    memberCount: circle.members.length,
                    roundNumber: r.roundNumber,
                    winnerId: r.winnerId,
                    winnerName,
                    winnerBank,
                    winnerAcc,
                    winnerQr,
                    totalPot: realTotalPot,
                    adminFee,
                    netAmount,
                    date: r.date,
                    status: isPaid ? 'COMPLETED' : 'PENDING',
                    slipUrl: existingPayout?.slipUrl
                };
            });
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [circles, members, payouts, user]);

  const groupedCircles = useMemo(() => {
      const groups: Record<string, any> = {};
      allPayouts.forEach(p => {
          if (!groups[p.circleId]) {
              groups[p.circleId] = {
                  id: p.circleId,
                  name: p.circleName,
                  status: p.circleStatus,
                  totalSlots: p.totalSlots,
                  memberCount: p.memberCount,
                  items: [],
                  pendingCount: 0,
                  pendingAmount: 0,
                  completedCount: 0,
                  completedAmount: 0,
                  lastActionDate: p.date
              };
          }
          groups[p.circleId].items.push(p);
          if (p.status === 'PENDING') {
              groups[p.circleId].pendingCount++;
              groups[p.circleId].pendingAmount += p.netAmount;
          } else {
              groups[p.circleId].completedCount++;
              groups[p.circleId].completedAmount += p.netAmount;
          }
      });
      return Object.values(groups);
  }, [allPayouts]);

  const { activeGroups, historyGroups } = useMemo(() => {
      const active: any[] = [];
      const history: any[] = [];
      groupedCircles.forEach(g => {
          if (g.status !== CircleStatus.COMPLETED || g.pendingCount > 0) active.push(g);
          else history.push(g);
      });
      return { activeGroups: active, historyGroups: history };
  }, [groupedCircles]);

  // Aggregate All Pending Payouts for Modal
  const allGlobalPendingPayouts = useMemo(() => {
      return activeGroups.flatMap(g => g.items.filter((i: any) => i.status === 'PENDING'));
  }, [activeGroups]);

  const displayedGroups = useMemo(() => {
      let source = mainTab === 'ACTIVE' ? activeGroups : historyGroups;
      
      // Common Search
      if (searchTerm) {
          source = source.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // History Filters
      if (mainTab === 'HISTORY') {
          if (filterMonth) {
              source = source.filter(g => {
                  const circleInfo = circles.find(c => c.id === g.id);
                  return circleInfo && circleInfo.startDate.startsWith(filterMonth);
              });
          }
          if (filterType !== 'ALL') {
              source = source.filter(g => {
                  const circleInfo = circles.find(c => c.id === g.id);
                  return circleInfo && circleInfo.biddingType === filterType;
              });
          }
      }

      // Pagination 
      if (mainTab === 'HISTORY') {
          const startIndex = (historyPage - 1) * ITEMS_PER_PAGE;
          return source.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      }
      
      return source;
  }, [activeGroups, historyGroups, mainTab, searchTerm, historyPage, filterMonth, filterType, circles]);

  const filteredHistoryCount = useMemo(() => {
      let source = historyGroups;
      if (searchTerm) source = source.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (filterMonth) source = source.filter(g => {
          const circleInfo = circles.find(c => c.id === g.id);
          return circleInfo && circleInfo.startDate.startsWith(filterMonth);
      });
      if (filterType !== 'ALL') source = source.filter(g => {
          const circleInfo = circles.find(c => c.id === g.id);
          return circleInfo && circleInfo.biddingType === filterType;
      });
      return source.length;
  }, [historyGroups, searchTerm, filterMonth, filterType, circles]);
  
  const realTotalHistoryPages = Math.ceil(filteredHistoryCount / ITEMS_PER_PAGE);

  const detailItems = useMemo(() => {
      if (!selectedCircleId) return [];
      const group = groupedCircles.find(g => g.id === selectedCircleId);
      if (!group) return [];
      return group.items.filter((p: any) => p.status === detailTab);
  }, [groupedCircles, selectedCircleId, detailTab]);

  const selectedCircleInfo = groupedCircles.find(g => g.id === selectedCircleId);

  const handleResetFilters = () => {
      setSearchTerm('');
      setFilterMonth('');
      setFilterType('ALL');
      setHistoryPage(1);
  };

  // --- ACTIONS ---
  const handlePayClick = (payout: any) => {
      if (user && payout.winnerId === user.id) setShowThaoCheckModal(payout);
      else setSelectedPayout(payout);
  };

  const handleConfirmThaoPayout = async () => {
      if (!showThaoCheckModal) return;
      setIsSubmitting(true);
      await addPayout({
          circleId: showThaoCheckModal.circleId,
          roundNumber: showThaoCheckModal.roundNumber,
          winnerId: showThaoCheckModal.winnerId || '',
          amount: showThaoCheckModal.netAmount,
          adminFee: showThaoCheckModal.adminFee,
          slipFile: null
      });
      setIsSubmitting(false);
      checkCloseCircle(showThaoCheckModal.circleId, showThaoCheckModal.roundNumber);
      setShowThaoCheckModal(null);
  };

  const handleConfirmPayout = async () => {
      if (!selectedPayout) return;
      if (!slipFile) { alert('กรุณาอัปโหลดสลิป'); return; }
      setIsSubmitting(true);
      await addPayout({
          circleId: selectedPayout.circleId,
          roundNumber: selectedPayout.roundNumber,
          winnerId: selectedPayout.winnerId || '',
          amount: selectedPayout.netAmount,
          adminFee: selectedPayout.adminFee,
          slipFile: slipFile
      });
      setIsSubmitting(false);
      checkCloseCircle(selectedPayout.circleId, selectedPayout.roundNumber);
      setSelectedPayout(null);
      setSlipFile(null);
  };

  const checkCloseCircle = (circleId: string, roundNumber: number) => {
      const currentCircle = circles.find(c => c.id === circleId);
      if (currentCircle && roundNumber === currentCircle.totalSlots) {
           setTimeout(async () => {
               if(window.confirm(`ยอดงวดสุดท้ายครบแล้ว! \nคุณต้องการ "ปิดวง" (Archive) เลยหรือไม่?`)) {
                   await updateCircle(circleId, { status: CircleStatus.COMPLETED });
                   alert('ปิดวงเรียบร้อย!');
               }
           }, 100);
      }
  };

  return (
    <div className="space-y-6 pb-20">
        {!selectedCircleId ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                
                {/* Header Card */}
                <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <HandCoins className="text-orange-400" /> จัดการจ่ายเงิน (Payouts)
                        </h2>
                        <p className="text-slate-400 mt-2">ดูแลการโอนเงินคืนสมาชิก และตรวจสอบประวัติ</p>
                    </div>
                    
                    {/* Clickable Pending Summary Button (High Contrast White Card) */}
                    <button 
                        onClick={() => setShowPendingSummary(true)}
                        className="relative z-10 bg-white text-slate-800 px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-white/20 hover:scale-105 transition-all cursor-pointer group min-w-[240px] mt-4 md:mt-0 flex items-center justify-between gap-6 border-4 border-slate-800"
                    >
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1 group-hover:text-orange-600 transition-colors">ยอดรอโอนรวม (Active)</p>
                            <p className="text-3xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                                ฿{activeGroups.reduce((sum, g) => sum + g.pendingAmount, 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-slate-100 text-slate-400 p-3 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-all shadow-inner">
                            <ListFilter size={24} />
                        </div>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-6">
                    <div className="flex gap-4 w-full lg:w-auto">
                        <button onClick={() => { setMainTab('ACTIVE'); handleResetFilters(); }} className={`relative flex-1 lg:flex-none group px-6 py-4 rounded-2xl border transition-all duration-300 ease-out flex items-center gap-4 min-w-[200px] ${mainTab === 'ACTIVE' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-transparent shadow-lg shadow-blue-500/30 scale-105 z-10' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50'}`}>
                            <div className={`p-3 rounded-xl ${mainTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-500'}`}><PlayCircle size={24} /></div>
                            <div className="text-left"><p className={`text-xs font-bold uppercase tracking-wider ${mainTab === 'ACTIVE' ? 'text-blue-100' : 'text-slate-400'}`}>Current</p><p className={`text-lg font-bold ${mainTab === 'ACTIVE' ? 'text-white' : 'text-slate-700'}`}>วงที่กำลังเดิน</p></div>
                        </button>
                        <button onClick={() => { setMainTab('HISTORY'); handleResetFilters(); }} className={`relative flex-1 lg:flex-none group px-6 py-4 rounded-2xl border transition-all duration-300 ease-out flex items-center gap-4 min-w-[200px] ${mainTab === 'HISTORY' ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-transparent shadow-lg shadow-slate-500/30 scale-105 z-10' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50'}`}>
                            <div className={`p-3 rounded-xl ${mainTab === 'HISTORY' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}><Archive size={24} /></div>
                            <div className="text-left"><p className={`text-xs font-bold uppercase tracking-wider ${mainTab === 'HISTORY' ? 'text-slate-300' : 'text-slate-400'}`}>Archived</p><p className={`text-lg font-bold ${mainTab === 'HISTORY' ? 'text-white' : 'text-slate-700'}`}>ประวัติวงที่จบ</p></div>
                        </button>
                    </div>
                    
                    {/* Active Tab Search Only */}
                    {mainTab === 'ACTIVE' && (
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="text" placeholder="ค้นหาชื่อวง..." className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    )}
                </div>

                {/* HISTORY FILTER BAR */}
                {mainTab === 'HISTORY' && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 mb-1 block">ค้นหาชื่อวง</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="พิมพ์ชื่อวง..." 
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none text-sm"
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setHistoryPage(1); }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">ประจำเดือน (เริ่มเล่น)</label>
                                <input 
                                    type="month"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none text-sm bg-white"
                                    value={filterMonth}
                                    onChange={(e) => { setFilterMonth(e.target.value); setHistoryPage(1); }}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">ประเภท</label>
                                    <select 
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none text-sm bg-white"
                                        value={filterType}
                                        onChange={(e: any) => { setFilterType(e.target.value); setHistoryPage(1); }}
                                    >
                                        <option value="ALL">ทั้งหมด</option>
                                        <option value="AUCTION">ประมูล</option>
                                        <option value="FIXED">ขั้นบันได</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={handleResetFilters}
                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors mt-auto border border-slate-200"
                                    title="ล้างค่าการค้นหา"
                                >
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GRID CONTENT */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayedGroups.map(group => (
                        <div key={group.id} onClick={() => { setSelectedCircleId(group.id); setDetailTab(group.pendingCount > 0 ? 'PENDING' : 'COMPLETED'); }} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Wallet size={24} /></div>
                                    <div><h3 className="font-bold text-lg text-slate-800 line-clamp-1">{group.name}</h3><p className="text-xs text-slate-500">{group.memberCount} สมาชิก • {group.totalSlots} มือ</p></div>
                                </div>
                                {/* Pending Indicator / Complete Checkmark */}
                                {group.pendingCount > 0 ? (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse flex items-center gap-1">
                                        <AlertTriangle size={12} /> รอโอน {group.pendingCount}
                                    </span>
                                ) : (
                                    <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                                        <Check size={12} strokeWidth={3} /> จ่ายครบแล้ว
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100"><span className="text-slate-500">ยอดรอโอน</span><span className={`font-bold ${group.pendingAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>฿{group.pendingAmount.toLocaleString()}</span></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination for History */}
                {mainTab === 'HISTORY' && realTotalHistoryPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-2xl shadow-sm border border-slate-200 mt-4">
                        <button 
                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                            disabled={historyPage === 1}
                            className="p-2 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-200 transition-all"
                        >
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-600">
                            หน้า {historyPage} / {realTotalHistoryPages}
                        </span>
                        <button 
                            onClick={() => setHistoryPage(p => Math.min(realTotalHistoryPages, p + 1))}
                            disabled={historyPage === realTotalHistoryPages}
                            className="p-2 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-200 transition-all"
                        >
                            <ChevronRight size={20} className="text-slate-600" />
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={() => setSelectedCircleId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"><ArrowLeft size={24} /></button>
                        <div><h2 className="text-2xl font-bold text-slate-800">{selectedCircleInfo?.name}</h2><p className="text-sm text-slate-500">{selectedCircleInfo?.status === CircleStatus.COMPLETED ? 'วงนี้จบแล้ว (Archived)' : 'จัดการรายการโอนเงิน'}</p></div>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                        <button onClick={() => setDetailTab('PENDING')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${detailTab === 'PENDING' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}><Clock size={16} /> รอโอน ({selectedCircleInfo?.pendingCount || 0})</button>
                        <button onClick={() => setDetailTab('COMPLETED')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${detailTab === 'COMPLETED' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}><CheckCircle2 size={16} /> โอนแล้ว ({selectedCircleInfo?.completedCount || 0})</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {detailItems.map((p: any, idx: number) => {
                        const isFinal = p.roundNumber === p.totalSlots;
                        return (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className={`h-1.5 w-full ${isFinal ? 'bg-gradient-to-r from-amber-400 to-orange-500' : p.status === 'PENDING' ? 'bg-orange-400' : 'bg-emerald-500'}`}></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        {isFinal ? (
                                            <span className="inline-block bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-lg font-black mb-1 border border-amber-200">
                                                🏆 งวดที่ {p.roundNumber} (สุดท้าย)
                                            </span>
                                        ) : (
                                            <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold mb-1">งวดที่ {p.roundNumber}</span>
                                        )}
                                        <h3 className="font-bold text-lg text-slate-800">{p.winnerName}</h3>
                                    </div>
                                    {p.status === 'PENDING' && <div className="bg-orange-50 text-orange-600 p-1.5 rounded-lg animate-pulse"><AlertTriangle size={18} /></div>}
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl space-y-2 mb-4 border border-slate-100">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">ยอดรับสุทธิ</span><span className="font-medium text-slate-700">฿{p.totalPot.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">หักค่าดูแล</span><span className="font-bold text-red-500">-฿{p.adminFee.toLocaleString()}</span></div>
                                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold"><span className="text-slate-700">คงเหลือโอนคืน</span><span className="text-blue-600 text-lg">฿{p.netAmount.toLocaleString()}</span></div>
                                </div>
                                {p.status === 'PENDING' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setDetailsModalData({circleId: p.circleId, roundNum: p.roundNumber})} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors" title="ตรวจสอบยอดรับ"><Eye size={18} /></button>
                                        <button onClick={() => handlePayClick(p)} className={`flex-[2] py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg ${user && p.winnerId === user.id ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>{user && p.winnerId === user.id ? <ClipboardCheck size={18} /> : <Wallet size={18} />} {user && p.winnerId === user.id ? 'ตรวจสอบ & รับเงิน' : 'แจ้งโอนเงิน'}</button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <button disabled className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default border border-emerald-100"><CheckCircle2 size={18} /> โอนเรียบร้อย</button>
                                        <div className="flex justify-center gap-4 text-xs">
                                            <button onClick={() => setDetailsModalData({circleId: p.circleId, roundNum: p.roundNumber})} className="text-slate-500 hover:text-blue-600 flex items-center gap-1"><FileText size={12} /> ดูยอดรับ</button>
                                            {p.slipUrl && <a href={p.slipUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1"><ArrowRight size={12} /> ดูสลิป</a>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )}

        {/* MODALS */}
        {showPendingSummary && (
            <PendingSummaryModal 
                items={allGlobalPendingPayouts} 
                onClose={() => setShowPendingSummary(false)}
                onPayClick={handlePayClick}
            />
        )}

        {selectedPayout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPayout(null)} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-slate-800">แจ้งโอนเงินคืนสมาชิก</h3><button onClick={() => setSelectedPayout(null)}><X className="text-slate-400" /></button></div>
                    <div className="bg-blue-50 p-6 rounded-xl mb-6 text-center border border-blue-100">
                        <p className="text-sm text-slate-500 mb-1">ยอดเงินที่ต้องโอน</p>
                        <h2 className="text-4xl font-bold text-blue-600">฿{selectedPayout.netAmount.toLocaleString()}</h2>
                    </div>
                    <div className="space-y-4">
                        <label className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors group">
                            <input type="file" className="hidden" onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
                            {slipFile ? <div className="text-emerald-600 font-bold flex flex-col items-center"><CheckCircle2 size={32} className="mb-2" />{slipFile.name}</div> : <div className="text-slate-400 flex flex-col items-center group-hover:text-blue-500 transition-colors"><Upload size={32} className="mb-2" /><span>คลิกเพื่ออัปโหลดสลิป</span></div>}
                        </label>
                        <button onClick={handleConfirmPayout} disabled={isSubmitting || !slipFile} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20">{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการโอนเงิน'}</button>
                    </div>
                </div>
            </div>
        )}
        {showThaoCheckModal && <ThaoCheckModal circleId={showThaoCheckModal.circleId} roundNumber={showThaoCheckModal.roundNumber} onClose={() => setShowThaoCheckModal(null)} onConfirm={handleConfirmThaoPayout} />}
        {detailsModalData && <PayoutDetailModal circleId={detailsModalData.circleId} roundNumber={detailsModalData.roundNum} onClose={() => setDetailsModalData(null)} />}
    </div>
  );
};

export default PayoutManagement;
