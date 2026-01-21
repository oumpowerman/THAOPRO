
import React, { useState } from 'react';
import { CalendarClock, QrCode, Clock, CheckCircle2, Radio, Zap, CircleDollarSign, Ban, Crown, AlertCircle, Wallet, Trophy, FileText, X, Info, Calendar, Users, ListOrdered, Gavel, DollarSign, History, ChevronRight, Eye, ImageIcon, TrendingUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ShareType, BiddingType, SharePeriod, ShareCircle, Transaction } from '../types';
import { PaymentModal, PaymentData } from '../components/member/PaymentModal';
import { LiveBiddingModal } from '../components/member/LiveBiddingModal';
import { MemberWelcomeCard, MemberGoldProgress } from '../components/member/MemberRewardCard';
import { useMemberDashboardLogic } from '../hooks/useMemberDashboardLogic';
import { formatErrorMessage } from '../lib/errorHandler';

const MemberDashboard = () => {
  const { 
      user, 
      myCircles, 
      myActiveAuction, 
      totalPrincipal, 
      totalPoints, 
      activeCount, 
      upcomingPayments, 
      currentUserAvatar, 
      creditScore,
      auctionSession,
      submitPayment,
  } = useMemberDashboardLogic();

  // Access Context directly
  const { submitClosingBalance: contextSubmitClosing, payouts, transactions, alert } = useAppContext();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [showBiddingModal, setShowBiddingModal] = useState(false);
  
  // Slip Viewer State
  const [viewingSlip, setViewingSlip] = useState<{url: string, title: string} | null>(null);

  // Circle Detail Modal State
  const [viewingCircleDetail, setViewingCircleDetail] = useState<ShareCircle | null>(null);

  // New: Transaction History Modal State
  const [historyCircle, setHistoryCircle] = useState<ShareCircle | null>(null);

  const handleOpenPayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentModalOpen(true);
  };

  const handleOpenClosingBalance = (circle: any, hand: any, e: React.MouseEvent) => {
      e.stopPropagation();
      const bidInterest = hand.bidAmount || 0;
      let fixedPerRound = circle.principal;
      
      if (circle.type === ShareType.DOK_TAM) {
          fixedPerRound += bidInterest;
      }
      
      const sortedRounds = [...circle.rounds].sort((a: any, b: any) => a.roundNumber - b.roundNumber);
      const currentRoundObj = sortedRounds.find((r: any) => r.status === 'OPEN' || r.status === 'COLLECTING') || sortedRounds[sortedRounds.length - 1];
      
      let startRound = currentRoundObj ? currentRoundObj.roundNumber : 1;
      const roundsLeft = (circle.totalSlots - startRound) + 1;
      
      if (roundsLeft <= 0) {
          alert("ไม่มีงวดคงเหลือให้ปิดยอด", "แจ้งเตือน", "error");
          return;
      }

      const totalLumpSum = fixedPerRound * roundsLeft;

      setSelectedPayment({
          id: `closing-${circle.id}`,
          circleId: circle.id, // Explicitly pass circleId for organizer lookup
          circleName: circle.name,
          targetRound: startRound,
          amount: totalLumpSum,
          handCount: 1,
          isClosingBalance: true,
          totalRounds: circle.totalSlots,
          fixedRatePerRound: fixedPerRound
      });
      setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (file: File | null) => {
    if (selectedPayment) {
        try {
            if (selectedPayment.isClosingBalance && contextSubmitClosing) {
                 // Clean the ID if it has 'closing-' prefix, though the function might handle it
                 const realCircleId = selectedPayment.circleId || selectedPayment.id.replace('closing-', '');
                 await contextSubmitClosing(realCircleId, selectedPayment.targetRound, selectedPayment.amount, file);
                 await alert('ส่งยอดปิดเหมาเรียบร้อย! กรุณารอท้าวแชร์อนุมัติ', 'สำเร็จ', 'success');
            } else {
                 const cId = selectedPayment.circleId || (selectedPayment as any).id.split('-r')[0]; // Fallback parsing
                 await submitPayment(cId, selectedPayment.targetRound, selectedPayment.amount, file);
                 await alert('ส่งหลักฐานการโอนเรียบร้อยแล้ว \nสถานะจะเปลี่ยนเป็น "รออนุมัติ"', 'สำเร็จ', 'success');
            }
        } catch (e) {
            const errorMsg = formatErrorMessage(e);
            if (errorMsg.includes('policy')) {
                await alert('ไม่สามารถอัปโหลดสลิปได้ (ติดสิทธิ์การเข้าถึง) \nกรุณาแจ้งท้าวแชร์ให้แก้ไขระบบ', 'เกิดข้อผิดพลาด', 'error');
            } else {
                await alert(errorMsg, 'ส่งยอดไม่สำเร็จ', 'error');
            }
            throw e; 
        }
    }
  };

  // Helper to check payout slip (Receiving Money)
  const handleViewPayoutSlip = async (circleId: string, roundNum: number, winnerId: string) => {
      const payoutInfo = payouts.find(p => p.circleId === circleId && p.roundNumber === roundNum && p.winnerId === winnerId);
      
      if (payoutInfo && payoutInfo.slipUrl) {
          setViewingSlip({ url: payoutInfo.slipUrl, title: `สลิปเงินเข้า งวดที่ ${roundNum}` });
      } else {
          await alert("⏳ ท้าวกำลังดำเนินการส่งแชร์ให้ โปรดรอสักครู่...", "ยังไม่ได้รับยอด", 'info');
      }
  };

  const getPeriodLabel = (p: SharePeriod) => {
        switch(p) {
            case SharePeriod.DAILY: return 'รายวัน';
            case SharePeriod.WEEKLY: return 'รายสัปดาห์';
            case SharePeriod.MONTHLY: return 'รายเดือน';
            default: return p;
        }
  };

  // Helper to filter transactions for history modal
  const getCircleTransactions = (circleId: string) => {
      if (!user) return [];
      return transactions
          .filter(t => t.circleId === circleId && t.memberId === user.id)
          .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());
  };

  return (
    <div className="space-y-6 pb-12">
       
       {/* MAIN GRID LAYOUT */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN (2/3) */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* 1. Welcome Card */}
             <MemberWelcomeCard 
                 user={user} 
                 activeCount={activeCount} 
                 totalPrincipal={totalPrincipal} 
                 totalPoints={totalPoints}
                 currentUserAvatar={currentUserAvatar}
                 creditScore={creditScore}
             />

             {/* 2. LIVE AUCTION ALERT */}
             {myActiveAuction && (
               <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-1 bg-red-600 shadow-lg shadow-red-600/30 animate-in slide-in-from-top-4">
                   <div className="bg-red-600 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full animate-pulse relative">
                                <Radio size={24} />
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 border-2 border-red-600 rounded-full"></span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">กำลังเปิดประมูล: {myActiveAuction.name}</h3>
                                    <span className="bg-white text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                                </div>
                                <p className="text-red-100 text-sm mt-1 flex items-center gap-3">
                                    <span>⏱️ เหลือ {auctionSession?.timeLeft} วินาที</span>
                                    <span>💰 สูงสุด ฿{auctionSession?.highestBid.toLocaleString()}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowBiddingModal(true)}
                            className="w-full sm:w-auto px-6 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm transform hover:scale-105 active:scale-95"
                        >
                            <Zap size={18} fill="currentColor" /> เข้าร่วมบิท
                        </button>
                   </div>
               </div>
             )}

             {/* 3. Upcoming Payments */}
             <div className="flex items-center justify-between pt-2">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <CalendarClock className="text-emerald-600" />
                   กำหนดชำระเร็วๆ นี้
                </h3>
                {upcomingPayments.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                        {upcomingPayments.length} รายการ
                    </span>
                )}
             </div>

             {upcomingPayments.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                   {upcomingPayments.map((payment, idx) => (
                      <div key={payment.id} className="p-5 border-b border-slate-50 last:border-0 flex flex-col sm:flex-row justify-between items-center hover:bg-slate-50 transition-colors gap-4 relative">
                         {payment.isOverdue && (
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                         )}
                         <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold border shrink-0 ${payment.isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                               <span className="text-xl leading-none">{new Date(payment.dueDate || new Date()).getDate()}</span>
                               <span className="text-[10px] uppercase">{new Date(payment.dueDate || new Date()).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                   <h4 className="font-bold text-slate-800 text-lg">{payment.circleName}</h4>
                                   {payment.isOverdue && (
                                       <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                           <AlertCircle size={10} /> ค้างจ่าย
                                       </span>
                                   )}
                               </div>
                               <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">งวดที่ {payment.targetRound}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${payment.type === ShareType.DOK_HAK ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'}`}>
                                     {payment.type === ShareType.DOK_HAK ? 'ดอกหัก' : 'ดอกตาม'}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                            <div className="text-right">
                               <p className="text-xs text-slate-500 mb-0.5">ยอดที่ต้องชำระ</p>
                               <p className={`font-bold text-xl ${payment.isOverdue ? 'text-red-600' : 'text-slate-900'}`}>฿{payment.amount.toLocaleString()}</p>
                            </div>
                            {payment.txStatus === 'PENDING' ? (
                                <button 
                                   onClick={() => handleOpenPayment(payment)}
                                   className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 hover:-translate-y-0.5"
                                >
                                   <QrCode size={18} /> แจ้งโอน
                                </button>
                            ) : payment.txStatus === 'WAITING_APPROVAL' ? (
                                <button disabled className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 cursor-wait border border-amber-200">
                                    <Clock size={16} /> รอตรวจสอบ
                                </button>
                            ) : payment.txStatus === 'REJECTED' ? (
                                <button onClick={() => handleOpenPayment(payment)} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-200">
                                    <Ban size={16} /> แจ้งใหม่
                                </button>
                            ) : (
                                <button disabled className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200">
                                    <CheckCircle2 size={16} /> ชำระแล้ว
                                </button>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="bg-white p-12 rounded-3xl text-center text-slate-400 border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                       <CheckCircle2 size={32} className="opacity-30" />
                   </div>
                   <p>ไม่มีรายการที่ต้องชำระเร็วๆ นี้</p>
                </div>
             )}

             {/* 4. My Circles List */}
             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-4">
                <CircleDollarSign className="text-blue-600" />
                วงแชร์ของฉัน
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCircles.map(circle => {
                   const myHands = circle.members.filter(m => m.memberId === user?.memberId);
                   const deadHands = myHands.filter(h => h.status === 'DEAD');
                   
                   // Calculate "Circle Value" (Principal * (TotalSlots - 1))
                   // Because Thao (Slot 1) doesn't pay principal into the pot
                   const circleValue = circle.principal * (circle.totalSlots - 1);

                   // Find current round
                   const sortedRounds = [...circle.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
                   const currentRoundObj = sortedRounds.find(r => r.status === 'OPEN' || r.status === 'COLLECTING') || sortedRounds[sortedRounds.length - 1];
                   const currentRoundNum = currentRoundObj ? currentRoundObj.roundNumber : 1;

                   return (
                      <div key={circle.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                         <div className="flex flex-col gap-3 mb-4">
                            <div className="flex items-start justify-between gap-2">
                                {/* Left Side: Name + Icons + Stats Badges */}
                                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate max-w-full sm:max-w-[150px]">
                                        {circle.name}
                                    </h4>
                                    
                                    {/* Info & History Icons */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setViewingCircleDetail(circle); }}
                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                                            title="รายละเอียดวง"
                                        >
                                            <Info size={16} strokeWidth={2.5} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setHistoryCircle(circle); }}
                                            className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all border border-amber-100 shadow-sm"
                                            title="ประวัติการโอนเงิน"
                                        >
                                            <History size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {/* NEW: Stats Badges (Circle Value & Hand Count) */}
                                    <div className="flex items-center gap-1.5 ml-1">
                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md font-bold whitespace-nowrap">
                                            ค่าวง ฿{circleValue.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-md font-bold whitespace-nowrap">
                                            เล่น {myHands.length} มือ
                                        </span>
                                    </div>
                                </div>

                                {/* Right Side: Close Balance Button */}
                                {deadHands.length > 0 && (
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {deadHands.map((dh, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={(e) => handleOpenClosingBalance(circle, dh, e)}
                                                className="py-1.5 px-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full shadow-sm hover:shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 transition-all text-[10px] font-bold border border-white/20 whitespace-nowrap"
                                            >
                                                <Wallet size={12} className="text-white" />
                                                ปิดยอด (มือ {dh.slotNumber})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                         </div>

                         {/* NEW: Prominent Stats Section (Current Round / Total Slots) */}
                         <div className="grid grid-cols-2 gap-3 mb-4">
                             <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                                 <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">งวดปัจจุบัน</span>
                                 <div className="flex items-baseline gap-1">
                                     <span className="text-2xl font-black text-blue-700 leading-none">#{currentRoundNum}</span>
                                 </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">จำนวนมือทั้งหมด</span>
                                 <div className="flex items-baseline gap-1">
                                     <span className="text-xl font-bold text-slate-600 leading-none">{circle.totalSlots}</span>
                                     <span className="text-[10px] text-slate-400 font-medium">มือ</span>
                                 </div>
                             </div>
                         </div>
                         
                         {/* Hands List */}
                         <div className="space-y-3 mb-3">
                             {myHands.map((hand, hIdx) => {
                                 const isAuction = circle.biddingType === BiddingType.AUCTION;
                                 const isAlive = hand.status === 'ALIVE';
                                 const isPidTon = hand.pidTonAmount && hand.pidTonAmount > 0;
                                 const isThaoHand = hand.slotNumber === 1;
                                 const isDead = hand.status === 'DEAD';

                                 let displayLabel = `มือที่ ${hand.slotNumber}`;
                                 if (isThaoHand) displayLabel = "ท้าวแชร์ (Slot 1)";
                                 else if (isAuction && isAlive && !isPidTon) displayLabel = "รอประมูล";

                                 return (
                                     <div key={hIdx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                         <div className="flex justify-between items-start text-xs">
                                             <span className={`font-medium ${displayLabel === 'รอประมูล' ? 'text-amber-600' : 'text-slate-600'}`}>
                                                {displayLabel}
                                             </span>
                                             <div className="flex gap-2">
                                                 {isDead ? (
                                                     <span className="font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px]">
                                                         เปียแล้ว
                                                     </span>
                                                 ) : isThaoHand ? (
                                                     <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">
                                                         ท้าวแชร์
                                                     </span>
                                                 ) : isPidTon ? (
                                                     <span className="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 text-[10px]">
                                                         ปิดต้น (฿{hand.pidTonAmount?.toLocaleString()})
                                                     </span>
                                                 ) : (
                                                     <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-600">
                                                         รอเปีย
                                                     </span>
                                                 )}
                                             </div>
                                         </div>

                                         {/* Winner Info & View Slip Button */}
                                         {isDead && (
                                             <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] flex items-center justify-between">
                                                 <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                                                     <Trophy size={12} />
                                                     ชนะงวดที่ {hand.wonRound}
                                                 </div>
                                                 <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Check slip logic with alert
                                                        if (user) handleViewPayoutSlip(circle.id, hand.wonRound!, user.id);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200"
                                                 >
                                                     <FileText size={12} /> ดูสลิปรับเงิน
                                                 </button>
                                             </div>
                                         )}
                                     </div>
                                 );
                             })}
                         </div>

                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                             <div 
                                className="bg-blue-500 h-full rounded-full" 
                                style={{ width: `${(circle.members.filter(m => m.status === 'DEAD').length / circle.totalSlots) * 100}%` }}
                             ></div>
                         </div>
                         <p className="text-[10px] text-right text-slate-400">Progress: {Math.round((circle.members.filter(m => m.status === 'DEAD').length / circle.totalSlots) * 100)}%</p>
                      </div>
                   )
                })}
             </div>
          </div>

          {/* RIGHT COLUMN (1/3) */}
          <div className="lg:col-span-1">
              <div className="sticky top-6">
                  <MemberGoldProgress totalPoints={totalPoints} />
              </div>
          </div>
       </div>

       {/* --- MODALS --- */}
       
       <PaymentModal 
          isOpen={paymentModalOpen} 
          onClose={() => setPaymentModalOpen(false)}
          paymentData={selectedPayment!}
          onSubmit={handlePaymentSubmit}
       />

       {showBiddingModal && (
           <LiveBiddingModal onClose={() => setShowBiddingModal(false)} />
       )}

       {/* View Slip Modal */}
       {viewingSlip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setViewingSlip(null)}>
              <div className="relative max-w-lg w-full max-h-[90vh] flex flex-col items-center">
                  <button onClick={() => setViewingSlip(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-white/20 p-2 rounded-full">
                      <X size={20} />
                  </button>
                  <img src={viewingSlip.url} alt="Slip" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black" />
                  <div className="mt-4 text-white text-center">
                      <p className="font-bold text-lg">{viewingSlip.title}</p>
                  </div>
              </div>
          </div>
       )}

       {/* Circle Detail Modal */}
       {viewingCircleDetail && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingCircleDetail(null)}>
               <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 p-6">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                           <Info size={24} className="text-blue-500" />
                           รายละเอียดวงแชร์
                       </h3>
                       <button onClick={() => setViewingCircleDetail(null)} className="text-slate-400 hover:text-slate-600">
                           <X size={24} />
                       </button>
                   </div>
                   
                   <div className="space-y-4">
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <p className="text-sm text-slate-500 mb-1">ชื่อวง</p>
                           <p className="text-lg font-bold text-slate-800">{viewingCircleDetail.name}</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <p className="text-sm text-slate-500 mb-1">เงินต้น</p>
                               <p className="text-lg font-bold text-blue-600">฿{viewingCircleDetail.principal.toLocaleString()}</p>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <p className="text-sm text-slate-500 mb-1">จำนวนมือ</p>
                               <p className="text-lg font-bold text-slate-800">{viewingCircleDetail.totalSlots} มือ</p>
                           </div>
                       </div>

                       <div className="bg-white border-2 border-slate-100 p-4 rounded-xl">
                           <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700">
                               <Gavel size={16} />
                               รูปแบบ: {viewingCircleDetail.biddingType === BiddingType.AUCTION ? 'ประมูลดอก' : 'ขั้นบันได'}
                           </div>
                           <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700">
                               <Clock size={16} />
                               ส่ง: {getPeriodLabel(viewingCircleDetail.period)}
                           </div>
                           <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                               <Calendar size={16} />
                               เริ่ม: {new Date(viewingCircleDetail.startDate).toLocaleDateString('th-TH')}
                           </div>
                       </div>

                       {viewingCircleDetail.biddingType === BiddingType.AUCTION && (
                           <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg justify-center">
                               <span>ขั้นต่ำ: <strong>{viewingCircleDetail.minBid}</strong></span>
                               <span>เพิ่มทีละ: <strong>{viewingCircleDetail.bidStep}</strong></span>
                           </div>
                       )}
                   </div>

                   <button 
                       onClick={() => setViewingCircleDetail(null)}
                       className="w-full mt-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                   >
                       ปิดหน้าต่าง
                   </button>
               </div>
           </div>
       )}

       {/* Transaction History Modal */}
       {historyCircle && (
           <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryCircle(null)}>
               <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                   <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
                       <div className="flex items-center gap-3">
                           <div className="p-2 bg-white/20 rounded-lg">
                               <History size={24} />
                           </div>
                           <div>
                               <h3 className="text-xl font-bold">ประวัติการโอนเงิน (History)</h3>
                               <p className="text-indigo-100 text-sm max-w-[200px] truncate">
                                   {historyCircle.name}
                               </p>
                           </div>
                       </div>
                       <button onClick={() => setHistoryCircle(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                           <X size={24} />
                       </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                       {(() => {
                           const circleTx = getCircleTransactions(historyCircle.id);
                           if (circleTx.length === 0) {
                               return (
                                   <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                                       <History size={48} className="opacity-20 mb-2" />
                                       <p>ยังไม่มีประวัติการโอนในวงนี้</p>
                                   </div>
                               );
                           }
                           return (
                               <div className="space-y-3">
                                   {circleTx.map(tx => (
                                       <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
                                           {/* Slip Thumbnail */}
                                           {tx.slipUrl ? (
                                               <div 
                                                   className="relative group cursor-pointer shrink-0"
                                                   onClick={() => setViewingSlip({ url: tx.slipUrl!, title: `สลิปงวดที่ ${tx.roundNumber}` })}
                                               >
                                                   <img 
                                                       src={tx.slipUrl} 
                                                       alt="Slip" 
                                                       className="w-16 h-20 object-cover rounded-lg border border-slate-200 shadow-sm group-hover:opacity-90 transition-opacity bg-slate-100" 
                                                   />
                                                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                                       <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                   </div>
                                               </div>
                                           ) : (
                                               <div className="w-16 h-20 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
                                                   <ImageIcon size={24} />
                                               </div>
                                           )}

                                           <div className="flex-1 min-w-0 py-1">
                                               <div className="flex justify-between items-start mb-1">
                                                   <div className="flex items-center gap-2">
                                                       <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">
                                                           งวดที่ {tx.roundNumber}
                                                       </span>
                                                       <span className="text-[10px] text-slate-400">
                                                           {tx.timestamp}
                                                       </span>
                                                   </div>
                                                   {tx.status === 'WAITING_APPROVAL' ? (
                                                       <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-100">
                                                           รอตรวจสอบ
                                                       </span>
                                                   ) : tx.status === 'PAID' ? (
                                                       <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100">
                                                           เรียบร้อย
                                                       </span>
                                                   ) : (
                                                       <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-100">
                                                           ถูกปฏิเสธ
                                                       </span>
                                                   )}
                                               </div>
                                               
                                               <div className="flex items-baseline gap-1 mb-1">
                                                   <span className="text-xs text-slate-500 font-bold">ยอดโอน:</span>
                                                   <span className="font-bold text-lg text-slate-800">
                                                       ฿{tx.amountPaid.toLocaleString()}
                                                   </span>
                                               </div>

                                               {tx.isClosingBalance && (
                                                   <p className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded inline-block">
                                                       ⚡ ปิดยอดเหมาจ่าย (Lump Sum)
                                                   </p>
                                               )}
                                               {tx.note && (
                                                   <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                                       Note: {tx.note}
                                                   </p>
                                               )}
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           );
                       })()}
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default MemberDashboard;
