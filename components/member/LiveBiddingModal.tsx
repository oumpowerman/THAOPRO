
import React, { useState } from 'react';
import { X, Radio, Info, Crown, Clock, Zap, ArrowUp } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const LiveBiddingModal = ({ onClose }: { onClose: () => void }) => {
    const { auctionSession, placeLiveBid, user } = useAppContext();
    const [myBid, setMyBid] = useState<number | ''>('');
    const currentHigh = auctionSession?.highestBid || 0;
    const quickBids = [50, 100, 200, 500];

    const handleSubmitBid = (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        if(myBid && myBid > currentHigh) {
            placeLiveBid(Number(myBid));
            setMyBid(''); 
        }
    };

    const handleQuickBid = (addAmount: number) => {
        placeLiveBid(currentHigh + addAmount);
    };

    if (!auctionSession) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-red-600 text-white text-center relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                    <div className="inline-flex items-center gap-2 bg-red-800/30 px-3 py-1 rounded-full text-xs font-bold mb-2 animate-pulse">
                        <Radio size={12} /> LIVE AUCTION
                    </div>
                    <h3 className="text-xl font-bold">{auctionSession.circleName}</h3>
                    <p className="text-red-100 text-sm">งวดที่ {auctionSession.roundNumber}</p>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center mb-8">
                        <div className={`text-6xl font-black font-mono tracking-tighter ${auctionSession.timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
                            {auctionSession.timeLeft}
                        </div>
                        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">SECONDS LEFT</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center mb-6">
                        <p className="text-slate-500 text-xs mb-1">ราคาบิทสูงสุดปัจจุบัน</p>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">
                            ฿{currentHigh.toLocaleString()}
                        </div>
                        {auctionSession.bidHistory.length > 0 && (
                             <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                                <Crown size={14} className="text-amber-500" />
                                <span>ผู้นำ: {auctionSession.bidHistory[0].userName === user?.name ? 'คุณ (You)' : auctionSession.bidHistory[0].userName}</span>
                            </div>
                        )}
                    </div>
                    {auctionSession.status === 'LIVE' ? (
                        <div className="space-y-4">
                            <form onSubmit={handleSubmitBid} className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-3 text-slate-400 font-bold">฿</span>
                                    <input 
                                        type="number" 
                                        className="w-full pl-8 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                                        placeholder={`${currentHigh + 10}`}
                                        value={myBid}
                                        onChange={(e) => setMyBid(Number(e.target.value))}
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={!myBid || Number(myBid) <= currentHigh}
                                    className="bg-red-600 text-white px-6 rounded-xl font-bold shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:shadow-none"
                                >
                                    บิทเลย!
                                </button>
                            </form>
                            <div className="grid grid-cols-4 gap-2">
                                {quickBids.map(amt => (
                                    <button 
                                        key={amt}
                                        onClick={() => handleQuickBid(amt)}
                                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-colors"
                                    >
                                        <ArrowUp size={12} />
                                        +{amt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : auctionSession.status === 'WAITING' ? (
                        <div className="text-center py-8 text-slate-400">
                            <Clock size={48} className="mx-auto mb-2 opacity-20" />
                            <p>รอท้าวแชร์เริ่มจับเวลา...</p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                             <div className="inline-flex p-4 bg-emerald-100 rounded-full text-emerald-600 mb-4">
                                <Crown size={32} />
                             </div>
                             <h4 className="text-xl font-bold text-slate-800">จบการประมูล!</h4>
                             <p className="text-slate-500">ผู้ชนะคือ: {auctionSession.bidHistory[0]?.userName || '-'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
