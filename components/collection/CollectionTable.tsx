
import React from 'react';
import { CheckCircle2, Clock, MoreHorizontal, DollarSign, ArrowRightLeft, Gavel, Trophy, Lock, Wallet } from 'lucide-react';
import { BiddingType } from '../../types';

// Helper Icon for Trophy/Winner
const TrophyIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
);

interface CollectionTableProps {
    data: any[];
    biddingType: BiddingType;
    onManualPay: (item: any) => void;
    onReview: (item: any) => void;
}

export const CollectionTable: React.FC<CollectionTableProps> = ({ data, biddingType, onManualPay, onReview }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left">สมาชิก</th>
                    <th className="px-6 py-4 text-left">ยอดที่ต้องชำระ</th>
                    <th className="px-6 py-4 text-left">จ่ายแล้ว</th>
                    <th className="px-6 py-4 text-left">คงเหลือ</th>
                    <th className="px-6 py-4 text-center">สถานะ</th>
                    <th className="px-6 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length > 0 ? (
                    data.map((p, idx) => {
                        const isAuction = biddingType === BiddingType.AUCTION;
                        let handLabel = '';
                        if (p.slotNumber === 1) {
                            handLabel = 'ท้าวแชร์ (Slot 1)';
                        } else if (isAuction) {
                            if (p.memberStatus === 'DEAD') {
                                handLabel = `มือที่ ${p.wonRound}`; 
                            } else {
                                handLabel = 'รอประมูล';
                            }
                        } else {
                            handLabel = `มือที่ ${p.slotNumber}`;
                        }

                        // Check for Special Closing Balance Transaction Pending
                        const isClosingPending = p.latestTxObject?.isClosingBalance && p.status === 'WAITING_APPROVAL';

                        return (
                      <tr key={idx} className={`transition-colors ${p.roundStatus === 'WINNER' ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} alt="" className="w-10 h-10 rounded-full object-cover bg-slate-200 border border-slate-100" />
                            <div>
                              <p className="font-semibold text-slate-900 flex items-center gap-2">
                                  {p.name}
                                  {p.roundStatus === 'WINNER' && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold">WINNER</span>}
                              </p>
                              <div className="flex gap-1">
                                  <span className={`text-xs ${isAuction && p.memberStatus !== 'DEAD' ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {handLabel}
                                  </span>
                                  {p.daysLate > 0 && (
                                      <span className="text-[10px] text-red-500 bg-red-50 px-1 rounded font-bold">
                                          Late {p.daysLate} วัน
                                      </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                            {p.slotNumber === 1 ? (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                    <CheckCircle2 size={12} /> ยกเว้น (ท้าวแชร์)
                                </span>
                            ) : p.roundStatus === 'WINNER' ? (
                                <span className="text-amber-600 font-black tracking-tight flex items-center gap-1">
                                    <TrophyIcon size={14} /> WINNER
                                </span>
                            ) : p.isPidTonPaid ? (
                                <div>
                                    <p>฿{p.amountPaid.toLocaleString()}</p>
                                    <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
                                        <Lock size={10} /> มือตาย (ปิดต้น)
                                    </p>
                                </div>
                            ) : isClosingPending ? (
                                <div>
                                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold animate-pulse">
                                        <Wallet size={12} /> ปิดยอดเหมา (Lump Sum)
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">รอตรวจสอบ...</p>
                                </div>
                            ) : p.showAmount ? (
                                <div>
                                    <p className={!isAuction ? 'text-blue-700' : 'text-slate-800'}>฿{p.amountExpected.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-normal">{p.note}</p>
                                    {p.fineAmount > 0 && (
                                        <p className="text-xs text-red-500">+ ค่าปรับ {p.fineAmount}</p>
                                    )}
                                </div>
                            ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs">
                                    <Gavel size={12} /> รอสรุปยอด
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">
                            {p.amountPaid > 0 ? `฿${p.amountPaid.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-red-500">
                            {/* Hide balance if Pid Ton Paid or amount hidden */}
                            {p.isPidTonPaid ? (
                                <span className="text-slate-400 font-normal">-</span>
                            ) : p.showAmount ? (
                                p.balanceRemaining > 0 ? `฿${p.balanceRemaining.toLocaleString()}` : '-'
                            ) : (
                                <span className="text-slate-400 font-normal">-</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.status === 'PAYOUT_COMPLETED' ? (
                             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                               <CheckCircle2 size={14} className="mr-1" /> รับเงินแล้ว
                             </span>
                          ) : p.status === 'WAITING_PAYOUT' ? (
                             <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 animate-pulse">
                               <ArrowRightLeft size={14} className="mr-1" /> รอรับเงิน
                             </span>
                          ) : p.status === 'PAID' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              <CheckCircle2 size={14} className="mr-1" /> 
                              {p.slotNumber === 1 ? 'ยกเว้น' : p.isPidTonPaid ? 'ปิดต้นแล้ว' : 'ครบแล้ว'}
                            </span>
                          ) : p.status === 'PARTIAL' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                              <DollarSign size={14} className="mr-1" /> จ่ายบางส่วน
                            </span>
                          ) : p.status === 'WAITING_APPROVAL' ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold animate-pulse cursor-pointer ${isClosingPending ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200' : 'bg-amber-100 text-amber-700'}`}>
                               <Clock size={14} className="mr-1" /> {isClosingPending ? 'รออนุมัติ (เหมา)' : 'รออนุมัติ'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                              <Clock size={14} className="mr-1" /> ยังไม่ชำระ
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                              {/* MANUAL PAY BUTTON (Hide for Winner, Thao, and PidTonPaid) */}
                              {p.roundStatus !== 'WINNER' && p.slotNumber !== 1 && !p.isPidTonPaid && (
                                <button 
                                    onClick={() => onManualPay(p)}
                                    className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    title="บันทึกยอด/ค่าปรับ"
                                >
                                    <DollarSign size={18} />
                                </button>
                              )}

                              {/* VIEW / APPROVE BUTTON */}
                              <button 
                                onClick={() => {
                                    if (p.latestTxObject) {
                                        onReview(p);
                                    } else {
                                        alert("ไม่มีรายการแจ้งโอนเข้ามา");
                                    }
                                }}
                                disabled={!p.latestTxObject}
                                className={`p-2 rounded-lg transition-colors ${p.latestTxObject ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                                title="ดูสลิป/จัดการ"
                              >
                                <MoreHorizontal size={18} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        ไม่พบข้อมูลตามเงื่อนไข
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
    );
};
