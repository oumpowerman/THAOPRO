
import React, { useState, useEffect, useRef } from 'react';
import { ShareType, CircleStatus, BiddingType } from '../types';
import { Calculator, Save, AlertTriangle, Radio, Play, Pause, Timer, Gavel, User, Crown, XCircle, Users, Activity, Info, Star, Search, Lock, Zap, MousePointer2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { calculateSharePayment } from '../lib/share-engine';

const BiddingSystem = () => {
  const { circles, members, recordBid, openAuctionRoom, startAuctionTimer, auctionSession, closeAuctionRoom, user, showAlert } = useAppContext();
  const navigate = useNavigate();
  
  // Tabs: 'MANUAL' (Old Calculator) | 'LIVE' (New Real-time)
  const [mode, setMode] = useState<'MANUAL' | 'LIVE'>('MANUAL');

  // FILTER: Only show active circles
  // Condition 1: Status is not INITIALIZING and not COMPLETED
  // Condition 2 (New): The Last round is NOT 'COMPLETED'. If the last round is completed, the game is over.
  const biddingCircles = circles.filter(c => {
      // Basic Status Check
      if (c.status === CircleStatus.INITIALIZING || c.status === CircleStatus.COMPLETED) return false;

      // Check if physically completed all rounds
      // Sort rounds to be sure we check the last one
      const sortedRounds = [...c.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
      const lastRound = sortedRounds[sortedRounds.length - 1];
      
      // If we have reached the total slots AND the last round is marked as COMPLETED, hide it.
      if (sortedRounds.length >= c.totalSlots && lastRound.status === 'COMPLETED') {
          return false;
      }

      return true;
  });

  // Common State
  const [selectedCircleId, setSelectedCircleId] = useState('');
  
  // Manual Mode State
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [bidderId, setBidderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidderSearch, setBidderSearch] = useState(''); // New: Search for bidder

  // Live Mode State
  const [timerDuration, setTimerDuration] = useState(60);

  useEffect(() => {
    // Auto-select first available circle if selection is empty or invalid
    if (biddingCircles.length > 0) {
        const currentSelectionExists = biddingCircles.some(c => c.id === selectedCircleId);
        if (!selectedCircleId || !currentSelectionExists) {
            setSelectedCircleId(biddingCircles[0].id);
        }
    } else {
      setSelectedCircleId('');
    }
  }, [biddingCircles, selectedCircleId]);

  const circle = biddingCircles.find(c => c.id === selectedCircleId);
  
  // Filter ALIVE members AND exclude Pid Ton (because they don't bid normally, unless it's the last round logic)
  const aliveMembers = circle ? circle.members.filter(m => m.status === 'ALIVE' && (!m.pidTonAmount || m.pidTonAmount <= 0)) : [];

  // Determine the correct round number for Bidding
  const currentBiddingRound = React.useMemo(() => {
      if (!circle || circle.rounds.length === 0) return 1;
      
      // Ensure rounds are sorted (Safety)
      const sortedRounds = [...circle.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
      const lastRound = sortedRounds[sortedRounds.length - 1];
      
      // Logic 1: If the last existing round is OPEN, that is the current round.
      if (lastRound.status === 'OPEN') {
          return lastRound.roundNumber;
      }
      
      // Logic 2: If the last round is COMPLETED, the current round is the next one.
      return lastRound.roundNumber + 1;
  }, [circle]);

  // Check if it is literally the first round of the circle
  const isFirstRound = currentBiddingRound === 1;
  
  // Check if it is the LAST ROUND and if there is a PID TON member
  const pidTonMember = circle?.members.find(m => m.pidTonAmount && m.pidTonAmount > 0);
  const isLastRound = circle && currentBiddingRound === circle.totalSlots;

  useEffect(() => {
      if (circle) {
          // Special Logic for Last Round with Pid Ton
          if (isLastRound && pidTonMember) {
              setBidderId(pidTonMember.memberId);
              // Pid Ton usually doesn't pay interest in the last round (already paid fee)
              // or acts as Fixed 0. Set default to 0 for convenience.
              setBidAmount(0);
          } else {
              // Reset if switching circles
              setBidderId('');
              
              const onlyOneLeft = aliveMembers.length === 1;

              // Logic for default bid: 0 if first round, last round, or only 1 player remaining. Otherwise minBid.
              if (isFirstRound || isLastRound || onlyOneLeft) {
                  setBidAmount(0);
              } else if (circle.biddingType === BiddingType.AUCTION) {
                  setBidAmount(circle.minBid || 0);
              } else {
                  setBidAmount(0);
              }
          }
      }
  }, [selectedCircleId, circle, isFirstRound, isLastRound, pidTonMember, aliveMembers.length]);

  const getMemberInfo = (id: string) => {
      const foundMember = members.find(m => m.id === id);
      if (foundMember) return foundMember;
      if (user && user.id === id) {
          return {
              id: user.id,
              name: `${user.name} (คุณ)`,
              avatarUrl: user.avatarUrl,
              phone: user.username
          };
      }
      return null;
  };

  // --- CENTRALIZED CALCULATION LOGIC (Unified for Manual & Live) ---
  const calculateResult = () => {
    let finalBid = 0;
    let finalBidderId = '';

    // Step 1: Resolve Inputs based on Mode
    if (mode === 'MANUAL') {
        if (!bidAmount && bidAmount !== 0) return null;
        finalBid = Number(bidAmount);
        finalBidderId = bidderId;
    } else {
        // LIVE MODE: Auto-fetch from session
        if (!auctionSession) return null;
        finalBid = auctionSession.highestBid;
        finalBidderId = auctionSession.winnerId || '';
    }

    if (!finalBidderId || !circle) return null;

    let totalPot = 0;
    
    // Use the calculated currentBiddingRound
    const nextRoundNumber = currentBiddingRound;

    const memberDetails = circle.members.map(cm => {
      const memberInfo = getMemberInfo(cm.memberId);
      
      // CALL SHARED ENGINE
      const calculation = calculateSharePayment(
          circle,
          cm,
          nextRoundNumber,
          finalBidderId, // Pass the proposed winner ID
          finalBid,      // Pass the proposed bid
          false          // Not an open round check, this is a finalization check
      );

      const payAmount = calculation.payAmount;
      const note = calculation.note;
      
      // Accumulate Pot (Only exclude Winner and Thao from paying into pot, handled by payAmount=0)
      totalPot += payAmount;

      return {
        ...cm,
        name: memberInfo?.name || 'Unknown',
        avatarUrl: memberInfo?.avatarUrl,
        payAmount,
        note,
        isWinner: cm.memberId === finalBidderId
      };
    });

    return { memberDetails, totalPot, finalBid, finalBidderId };
  };

  const manualCalculation = calculateResult();

  const handleConfirmBidding = (type: 'MANUAL' | 'LIVE') => {
    const calc = manualCalculation;

    if (!circle || !calc || !calc.finalBidderId) return;

    if (circle.biddingType === BiddingType.AUCTION && !isFirstRound && !isLastRound) {
        if (calc.finalBid < circle.minBid) {
            showAlert(`ยอดบิทต่ำเกินไป! \n\nขั้นต่ำสำหรับวงนี้คือ: ${circle.minBid.toLocaleString()} บาท`, 'แจ้งเตือน', 'error');
            return;
        }
    }
    
    const winnerName = getMemberInfo(calc.finalBidderId)?.name;
    const confirmMsg = `ยืนยันบันทึกผลการเปีย?\n\nวง: ${circle.name}\nงวดที่: ${currentBiddingRound}\nผู้ชนะ: ${winnerName}\nดอกเบี้ย: ${calc.finalBid} บาท\nยอดรับสุทธิ: ฿${calc.totalPot.toLocaleString()}`;

    if (window.confirm(confirmMsg)) {
        setIsSubmitting(true);
        setTimeout(() => {
            // Find slot number for the winner
            const winnerMember = circle.members.find(m => m.memberId === calc.finalBidderId);
            const winnerSlot = winnerMember ? winnerMember.slotNumber : 0;

            // Determine if completed (Last round)
            const isCompleted = currentBiddingRound === circle.totalSlots;

            recordBid(circle.id, currentBiddingRound, calc.finalBidderId, calc.finalBid, calc.totalPot);
            
            if(type === 'LIVE') closeAuctionRoom();
            showAlert('บันทึกเรียบร้อย! ' + (isCompleted ? 'จบวงแล้ว' : 'งวดใหม่ถูกสร้างแล้ว'), 'สำเร็จ', 'success');
            setIsSubmitting(false);
            if(type === 'MANUAL') {
               if (circle.biddingType === BiddingType.AUCTION) {
                   setBidAmount(circle.minBid || 0);
               } else {
                   setBidAmount('');
               }
               setBidderId('');
               setBidderSearch('');
            }
            navigate('/');
        }, 1000);
    }
  };

  const handleOpenRoom = () => {
      if(!selectedCircleId) return;
      openAuctionRoom(selectedCircleId);
  };

  const handleStartTimer = () => {
      startAuctionTimer(timerDuration);
  };

  const isBidValid = circle && (
      circle.biddingType !== BiddingType.AUCTION || 
      isFirstRound || 
      isLastRound ||
      aliveMembers.length === 1 || // Valid if only one player remains (auto-win logic allows 0 bid)
      (Number(bidAmount) >= circle.minBid)
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* --- NEW HEADER DESIGN: TRUSTWORTHY COMMAND CENTER --- */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl p-8 mb-8 group">
           {/* Abstract Background Effects */}
           <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-colors duration-700 ${mode === 'LIVE' ? 'bg-red-600/10' : 'bg-indigo-600/10'}`}></div>
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-slate-800/50 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              
              {/* Title Section */}
              <div className="flex-1 text-center md:text-left">
                 <h2 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-3 tracking-tight">
                    <div className={`p-2 rounded-xl backdrop-blur-sm border ${mode === 'LIVE' ? 'bg-red-500/20 border-red-500/30' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        {mode === 'LIVE' ? <Zap size={24} className="text-red-400" fill="currentColor"/> : <Gavel size={24} className="text-amber-400" />}
                    </div>
                    {mode === 'LIVE' ? 'ห้องประมูลสด (Live Center)' : 'ศูนย์กลางการประมูล'}
                 </h2>
                 <p className="text-slate-400 mt-2 text-sm max-w-lg">
                    {mode === 'LIVE' 
                        ? 'ควบคุมการประมูลแบบเรียลไทม์ สร้างห้อง จับเวลา และประกาศผู้ชนะ' 
                        : 'ระบบคำนวณยอดดอกเบี้ยและบันทึกผลการเปียแชร์อย่างแม่นยำและโปร่งใส'
                    }
                 </p>
              </div>

              {/* Mode Switcher (The Control Panel) */}
              <div className="bg-slate-950/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex shadow-inner">
                 <button 
                    onClick={() => setMode('MANUAL')}
                    className={`relative px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                        mode === 'MANUAL' 
                        ? 'bg-white text-slate-900 shadow-lg scale-105' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                 >
                    <Calculator size={18} className={mode === 'MANUAL' ? 'text-indigo-600' : ''} />
                    ระบบคำนวณ
                 </button>
                 
                 <button 
                    onClick={() => setMode('LIVE')}
                    className={`relative px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                        mode === 'LIVE' 
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/50 scale-105' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                 >
                    {mode === 'LIVE' && (
                        <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                    <Radio size={18} />
                    Live Bidding
                 </button>
              </div>
           </div>
           
           {/* Bottom Info Bar */}
           <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-6 text-xs font-medium text-slate-500">
               <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-slate-300">Active Circles: <span className="text-white">{biddingCircles.length}</span></span>
               </div>
               <div className="flex items-center gap-2">
                   <MousePointer2 size={12} />
                   <span className="text-slate-400">Select a circle below to begin</span>
               </div>
           </div>
      </div>

      {mode === 'MANUAL' ? (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                    ตั้งค่าการเปีย <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm">งวดที่ {currentBiddingRound}</span>
                </h3>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">เลือกวงแชร์</label>
                    <select 
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={selectedCircleId}
                    onChange={(e) => {
                        setSelectedCircleId(e.target.value);
                        setBidderId('');
                        setBidderSearch('');
                    }}
                    >
                    {biddingCircles.length > 0 ? (
                        biddingCircles.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))
                    ) : (
                        <option value="" disabled>ไม่มีวงแชร์ที่พร้อมประมูล</option>
                    )}
                    </select>
                </div>
                {circle ? (
                <>
                    {(isFirstRound || aliveMembers.length === 1) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <Star className="text-amber-500 shrink-0 mt-0.5" size={16} />
                            <div className="text-xs text-amber-800">
                                <span className="font-bold">
                                    {isFirstRound ? 'งวดแรก (มือท้าว)' : 'เหลือผู้เล่นคนเดียว'} :
                                </span> ไม่จำกัดขั้นต่ำ สามารถใส่ดอกเบี้ย 0 บาทได้
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ผู้เสนอราคา (ผู้เปีย)</label>
                        
                        {/* PID TON LOCK LOGIC */}
                        {isLastRound && pidTonMember ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between animate-in fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-indigo-900">งวดสุดท้าย (ปิดต้น)</p>
                                        <p className="text-xs text-indigo-700">
                                            ล็อคสิทธิ์ให้: <span className="font-bold">{getMemberInfo(pidTonMember.memberId)?.name}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Search Box */}
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                    <input 
                                        type="text"
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ค้นหาชื่อ..."
                                        value={bidderSearch}
                                        onChange={(e) => setBidderSearch(e.target.value)}
                                    />
                                </div>

                                <select 
                                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={bidderId}
                                onChange={(e) => setBidderId(e.target.value)}
                                >
                                <option value="">-- เลือกผู้เปีย --</option>
                                {aliveMembers
                                    .filter(m => {
                                        const member = getMemberInfo(m.memberId);
                                        const name = member?.name || '';
                                        return name.toLowerCase().includes(bidderSearch.toLowerCase());
                                    })
                                    .map(m => {
                                        const member = getMemberInfo(m.memberId);
                                        const label = circle.biddingType === BiddingType.FIXED 
                                            ? `${member?.name || 'Unknown'} (มือที่ ${m.slotNumber})` 
                                            : `${member?.name || 'Unknown'}`;
                                        
                                        return <option key={m.memberId} value={m.memberId}>{label}</option>
                                })}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">*ไม่แสดงรายชื่อคนปิดต้น (ยกเว้นงวดสุดท้าย)</p>
                            </>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ยอดดอกเบี้ย (บาท)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                className={`w-full p-3 pl-10 border rounded-xl bg-white text-slate-900 focus:ring-2 focus:outline-none text-lg font-bold ${!isBidValid ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:ring-blue-500'}`}
                                placeholder="0.00"
                                value={bidAmount}
                                min={circle.biddingType === BiddingType.AUCTION && !isFirstRound && !isLastRound && aliveMembers.length > 1 ? circle.minBid : 0}
                                step={circle.bidStep}
                                onChange={(e) => setBidAmount(Number(e.target.value))}
                            />
                            <DollarSign size={18} className={`absolute left-3 top-4 ${!isBidValid ? 'text-red-400' : 'text-slate-400'}`} />
                        </div>
                        
                        {circle.biddingType === BiddingType.AUCTION && (
                            <div className="mt-2 flex justify-between text-xs text-slate-500">
                                <span>ขั้นต่ำ: <strong>{isFirstRound || isLastRound || aliveMembers.length === 1 ? 'ไม่กำหนด' : circle.minBid}</strong></span>
                                <span>เพิ่มทีละ: <strong>{circle.bidStep}</strong></span>
                            </div>
                        )}
                        {!isBidValid && (
                            <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                                <AlertTriangle size={12} /> ยอดดอกเบี้ยต่ำกว่าขั้นต่ำที่กำหนด ({circle.minBid})
                            </p>
                        )}
                    </div>
                </>
                ) : (
                    <div className="p-4 bg-slate-50 text-center text-slate-400 rounded-xl">
                        {biddingCircles.length === 0 ? "ไม่มีวงแชร์ที่พร้อมประมูล" : "กรุณาเลือกวงแชร์"}
                    </div>
                )}
                </div>
            </div>
            </div>

            <div className="lg:col-span-2">
            {manualCalculation && circle ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 z-0"></div>
                    <div className="relative z-10">
                    <p className="text-slate-500 mb-1 font-medium">ยอดเงินรวมที่ผู้เปียจะได้รับ (สุทธิ)</p>
                    <h3 className="text-4xl font-bold text-emerald-600">฿{manualCalculation.totalPot.toLocaleString()}</h3>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right relative z-10">
                        <p className="text-sm text-slate-500">ดอกเบี้ย: <span className="text-slate-900 font-bold">{Number(bidAmount).toLocaleString()}</span> บาท</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-800 flex justify-between items-center">
                        <span>รายละเอียดการจ่ายเงิน</span>
                        <span className="text-xs text-slate-500 font-normal">งวดที่ {currentBiddingRound}</span>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-left text-slate-500 bg-slate-50/50">
                            <th className="px-6 py-3">สมาชิก</th>
                            <th className="px-6 py-3 text-right">ยอดที่ต้องจ่าย</th>
                            <th className="px-6 py-3">หมายเหตุ</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {manualCalculation.memberDetails.map((item, idx) => (
                            <tr key={idx} className={item.isWinner ? 'bg-emerald-50' : 'hover:bg-slate-50'}>
                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                    <img src={item.avatarUrl} alt="avatar" />
                                </div>
                                <div>
                                    <p>{item.name}</p>
                                    {item.isWinner && <p className="text-[10px] text-emerald-600 font-bold">(ผู้ชนะ)</p>}
                                </div>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${item.payAmount === 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                                ฿{item.payAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-xs">
                                {item.note}
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>

                <button 
                    onClick={() => handleConfirmBidding('MANUAL')}
                    disabled={isSubmitting || !isBidValid}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 font-bold text-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isSubmitting ? 'กำลังบันทึก...' : (
                        <>
                            <Save size={24} />
                            <span>{isLastRound ? 'ยืนยันและปิดวง (Final)' : 'ยืนยันและบันทึกผล'}</span>
                        </>
                    )}
                </button>
                </div>
            ) : (
                <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-12">
                <Calculator size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">กรุณาเลือกผู้เปียและใส่ยอดดอกเบี้ย</p>
                </div>
            )}
            </div>
         </div>
      ) : (
         /* LIVE AUCTION UI (unchanged) */
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                {!auctionSession ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                            <Radio className="text-red-500" /> เปิดห้องประมูล <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm ml-auto">งวดที่ {currentBiddingRound}</span>
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">เลือกวงแชร์ที่จะประมูล</label>
                                <select 
                                    className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    value={selectedCircleId}
                                    onChange={(e) => setSelectedCircleId(e.target.value)}
                                >
                                    {biddingCircles.length > 0 ? (
                                        biddingCircles.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>ไม่มีวงแชร์ที่พร้อมประมูล</option>
                                    )}
                                </select>
                            </div>
                            <button 
                                onClick={handleOpenRoom}
                                disabled={biddingCircles.length === 0}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play size={18} /> สร้างห้องรอ
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-red-100 relative overflow-hidden">
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                            auctionSession.status === 'WAITING' ? 'bg-amber-100 text-amber-700' :
                            auctionSession.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                            {auctionSession.status === 'WAITING' ? 'รอเริ่มเกม' : auctionSession.status === 'LIVE' ? 'LIVE NOW' : 'จบการประมูล'}
                        </div>

                        <h3 className="font-bold text-lg mb-1 text-slate-800">{auctionSession.circleName}</h3>
                        <p className="text-sm text-slate-500 mb-6">งวดที่ {auctionSession.roundNumber}</p>

                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl mb-6 relative">
                            {auctionSession.status === 'LIVE' && (
                                <div className="absolute top-2 right-2 text-[10px] text-red-500 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
                                    <Info size={10} /> รีเซ็ตทุกการบิท
                                </div>
                            )}
                            <Timer size={40} className={`mb-2 ${auctionSession.status === 'LIVE' ? 'text-red-600' : 'text-slate-400'}`} />
                            <div className="text-5xl font-mono font-bold text-slate-800">
                                {auctionSession.timeLeft} <span className="text-lg font-sans font-normal text-slate-400">วินาที</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <Users size={16} /> ผู้เข้าร่วม ({auctionSession.participants.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {auctionSession.participants.length > 0 ? (
                                    auctionSession.participants.map(p => (
                                        <div key={p.id} className="relative group cursor-help">
                                            <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full border border-slate-200" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap">
                                                {p.name}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400">ยังไม่มีสมาชิกเข้ามาในห้อง</p>
                                )}
                            </div>
                        </div>

                        {auctionSession.status === 'WAITING' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">ตั้งเวลาถอยหลัง (วินาที)</label>
                                <div className="flex gap-2">
                                    {[30, 60, 90].map(sec => (
                                        <button 
                                            key={sec}
                                            onClick={() => setTimerDuration(sec)}
                                            className={`flex-1 py-2 rounded-lg border font-bold text-sm transition-colors ${
                                                timerDuration === sec 
                                                ? 'bg-red-50 border-red-500 text-red-600' 
                                                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                                            }`}
                                        >
                                            {sec}s
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleStartTimer}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 mt-4"
                                >
                                    <Play size={20} fill="currentColor" /> เริ่มจับเวลา (Start)
                                </button>
                            </div>
                        )}

                        {auctionSession.status === 'LIVE' && (
                             <button className="w-full py-4 bg-slate-200 text-slate-400 rounded-xl font-bold cursor-not-allowed">
                                 กำลังประมูล...
                             </button>
                        )}

                        {auctionSession.status === 'FINISHED' && (
                            <div className="space-y-3">
                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                    <Crown size={32} className="text-amber-500 mx-auto mb-2" />
                                    <p className="text-sm text-emerald-800">ผู้ชนะคือ</p>
                                    <p className="text-xl font-bold text-emerald-700">
                                        {auctionSession.bidHistory[0]?.userName || 'ไม่มีผู้ประมูล'}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">฿{auctionSession.highestBid.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={closeAuctionRoom} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold hover:bg-slate-50">ยกเลิก</button>
                                    <button onClick={() => handleConfirmBidding('LIVE')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700">บันทึกผล</button>
                                </div>
                            </div>
                        )}

                         {auctionSession.status !== 'FINISHED' && (
                             <button onClick={closeAuctionRoom} className="w-full mt-4 text-xs text-slate-400 hover:text-red-500 flex items-center justify-center gap-1">
                                <XCircle size={14} /> ปิดห้อง (Force Close)
                             </button>
                         )}
                    </div>
                )}
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full min-h-[500px] flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" /> กระดานประมูลสด (Live Feed)
                    </h3>
                    
                    {!auctionSession ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                             <Radio size={64} className="mb-4 opacity-20" />
                             <p>รอเปิดห้องประมูล</p>
                         </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                             <div className="mb-6 p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white text-center shadow-xl">
                                 <p className="text-slate-400 text-sm mb-1">ยอดบิทสูงสุดปัจจุบัน (Highest Bid)</p>
                                 <div key={auctionSession.highestBid} className="text-5xl font-bold text-emerald-400 animate-in zoom-in duration-300">
                                     ฿{auctionSession.highestBid.toLocaleString()}
                                 </div>
                                 <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                                     <Crown size={16} className="text-amber-400" />
                                     โดย: <span className="font-bold">{auctionSession.bidHistory[0]?.userName || '-'}</span>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-white/10 flex justify-center gap-4 text-xs text-slate-400">
                                     <span>ขั้นต่ำ: {auctionSession.minBid}</span>
                                     <span>ขั้นบันได: {auctionSession.bidStep}</span>
                                 </div>
                             </div>

                             <div className="flex-1 overflow-y-auto max-h-[400px] space-y-2 pr-2">
                                 {auctionSession.bidHistory.length === 0 ? (
                                     <div className="text-center py-10 text-slate-400 text-sm">ยังไม่มีใครเสนอราคา</div>
                                 ) : (
                                     auctionSession.bidHistory.map((bid, idx) => (
                                         <div key={idx} className={`flex items-center justify-between p-4 rounded-xl ${idx === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
                                             <div className="flex items-center gap-3">
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                     #{idx + 1}
                                                 </div>
                                                 <div>
                                                     <p className="font-bold text-slate-800">{bid.userName}</p>
                                                     <p className="text-[10px] text-slate-500">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                                                 </div>
                                             </div>
                                             <div className="font-bold text-lg text-slate-700">
                                                 ฿{bid.amount.toLocaleString()}
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                        </div>
                    )}
                </div>
            </div>
         </div>
      )}

    </div>
  );
};

const DollarSign = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);

export default BiddingSystem;
