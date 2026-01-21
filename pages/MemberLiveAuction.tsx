
import React, { useState, useEffect } from 'react';
import { Radio, Clock, Crown, ArrowUp, Zap, UserX, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MemberLiveAuction = () => {
  const { auctionSession, placeLiveBid, user, circles, joinAuctionRoom, leaveAuctionRoom } = useAppContext();
  const [myBid, setMyBid] = useState<number | ''>('');

  // Auto Join/Leave Room
  useEffect(() => {
     if (auctionSession && user) {
         joinAuctionRoom();
     }
     return () => {
         leaveAuctionRoom();
     };
  }, [auctionSession?.status]); // Re-run if status changes or init

  // 1. Check if there is a session
  if (!auctionSession) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
           <Radio size={48} className="text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-700">ยังไม่มีการเปิดประมูล</h2>
        <p className="text-slate-500 mt-2 max-w-md">
           ท้าวแชร์ยังไม่ได้เปิดห้องประมูลสำหรับวงแชร์ใดๆ <br/>กรุณารอการแจ้งเตือน หรือกลับมาตรวจสอบภายหลัง
        </p>
      </div>
    );
  }

  // 2. Check if user is a member of this circle
  const activeCircle = circles.find(c => c.id === auctionSession.circleId);
  const isMember = activeCircle?.members.some(m => m.memberId === user?.memberId);

  if (!isMember) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center p-4">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <UserX size={48} className="text-red-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">คุณไม่ได้อยู่ในวงแชร์นี้</h2>
            <p className="text-slate-500 mt-2">
                กำลังมีการประมูลวง "{auctionSession.circleName}" <br/>แต่คุณไม่ได้เป็นสมาชิกในวงนี้ จึงไม่สามารถเข้าร่วมได้
            </p>
        </div>
      );
  }

  // 3. Main Auction Interface
  const currentHigh = auctionSession.highestBid || 0;
  const quickBids = [50, 100, 200, 500];

  const handleSubmitBid = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (myBid && Number(myBid) > currentHigh) {
        placeLiveBid(Number(myBid));
        setMyBid('');
    }
  };

  const handleQuickBid = (addAmount: number) => {
    placeLiveBid(currentHigh + addAmount);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
       {/* Header Card */}
       <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500 opacity-10 rounded-full -mr-16 -mt-16 animate-pulse"></div>
          
          <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold mb-4 text-red-300 animate-pulse">
                  <Radio size={14} /> LIVE AUCTION ROOM
              </div>
              <h1 className="text-3xl font-bold mb-2">{auctionSession.circleName}</h1>
              <p className="text-slate-400">งวดที่ {auctionSession.roundNumber} • ประจำวันที่ {new Date().toLocaleDateString('th-TH')}</p>
          </div>
       </div>

       {/* Status & Timer */}
       {auctionSession.status === 'WAITING' ? (
           <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
               <div className="inline-block p-4 bg-amber-50 rounded-full text-amber-500 mb-4 animate-bounce">
                   <Clock size={40} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800 mb-2">กำลังรอท้าวแชร์เริ่มเกม...</h2>
               <p className="text-slate-500">กรุณาเตรียมตัวให้พร้อม ระบบจะเริ่มนับถอยหลังเมื่อท้าวแชร์กด Start</p>
               <p className="text-xs text-emerald-600 mt-4 font-bold flex items-center justify-center gap-1">
                   <CheckCircle2 size={12}/> คุณอยู่ในห้องแล้ว (Waiting)
               </p>
           </div>
       ) : auctionSession.status === 'FINISHED' ? (
           <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
               <div className="inline-block p-4 bg-emerald-50 rounded-full text-emerald-500 mb-4">
                   <CheckCircle2 size={48} />
               </div>
               <h2 className="text-2xl font-bold text-slate-800 mb-2">จบการประมูลแล้ว!</h2>
               <p className="text-slate-500 mb-6">ผู้ชนะในรอบนี้คือ</p>
               
               <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl inline-block w-full max-w-sm">
                   <Crown size={32} className="text-amber-500 mx-auto mb-2" />
                   <p className="text-xl font-bold text-slate-900">{auctionSession.bidHistory[0]?.userName || '-'}</p>
                   <p className="text-emerald-600 font-bold text-lg">ที่ยอด ฿{auctionSession.highestBid.toLocaleString()}</p>
               </div>
           </div>
       ) : (
           /* LIVE STATE */
           <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Timer Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                         <Info size={10} /> รีเซ็ตทุกการบิท
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 mt-2">TIME LEFT</p>
                      <div className={`text-6xl font-black font-mono tracking-tighter ${auctionSession.timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                          {auctionSession.timeLeft}
                      </div>
                      <p className="text-slate-400 text-xs">วินาที</p>
                  </div>

                  {/* Current Bid Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                          <Crown size={64} className="text-amber-500" />
                      </div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">HIGHEST BID</p>
                      <div className="text-5xl font-bold text-emerald-600 mb-1">
                          ฿{currentHigh.toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                          ผู้นำ: <span className="font-bold text-slate-700">{auctionSession.bidHistory[0]?.userName === user?.name ? 'คุณ (You)' : auctionSession.bidHistory[0]?.userName || '-'}</span>
                      </p>
                  </div>
              </div>

              {/* Bidding Controls */}
              <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-red-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Zap size={20} className="text-red-500" /> เสนอราคา (Place Bid)
                    </h3>
                    <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full animate-pulse">
                        *บิทแล้วเวลารีเซ็ตเป็น 60s
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                      {/* Manual Input */}
                      <form onSubmit={handleSubmitBid} className="flex gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">฿</span>
                            <input 
                                type="number" 
                                className="w-full pl-10 pr-4 py-4 border-2 border-slate-200 rounded-xl font-bold text-2xl text-slate-800 focus:ring-4 focus:ring-red-100 focus:border-red-500 focus:outline-none transition-all"
                                placeholder={`${currentHigh + 10}`}
                                value={myBid}
                                onChange={(e) => setMyBid(Number(e.target.value))}
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!myBid || Number(myBid) <= currentHigh}
                            className="bg-red-600 text-white px-8 rounded-xl font-bold text-lg shadow-lg shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            บิท!
                        </button>
                      </form>

                      {/* Quick Buttons */}
                      <div className="grid grid-cols-4 gap-3">
                        {quickBids.map(amt => (
                            <button 
                                key={amt}
                                onClick={() => handleQuickBid(amt)}
                                className="py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                            >
                                <ArrowUp size={16} className="text-emerald-500" />
                                +{amt}
                            </button>
                        ))}
                      </div>
                  </div>
              </div>

              {/* Bid History */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4">ประวัติการเสนอราคา (Live Feed)</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {auctionSession.bidHistory.length === 0 ? (
                          <div className="text-center py-8 text-slate-300">
                              ยังไม่มีใครเสนอราคา เป็นคนแรกเลย!
                          </div>
                      ) : (
                          auctionSession.bidHistory.map((bid, idx) => (
                              <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${idx === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${idx === 0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                          #{idx + 1}
                                      </div>
                                      <div>
                                          <p className={`font-bold text-sm ${bid.userName === user?.name ? 'text-blue-600' : 'text-slate-800'}`}>
                                              {bid.userName} {bid.userName === user?.name && '(คุณ)'}
                                          </p>
                                          <p className="text-[10px] text-slate-400">{new Date(bid.timestamp).toLocaleTimeString()}</p>
                                      </div>
                                  </div>
                                  <div className="font-bold text-slate-700">
                                      ฿{bid.amount.toLocaleString()}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
           </>
       )}
    </div>
  );
};

export default MemberLiveAuction;
