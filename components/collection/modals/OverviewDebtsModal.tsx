
import React from 'react';
import { X, History, ShieldCheck } from 'lucide-react';
import { ShareCircle } from '../../../types';

interface OverviewDebtsModalProps {
    isOpen: boolean;
    onClose: () => void;
    circle: ShareCircle | undefined;
    historicalDebts: any[];
}

export const OverviewDebtsModal: React.FC<OverviewDebtsModalProps> = ({ isOpen, onClose, circle, historicalDebts }) => {
    if (!isOpen || !circle) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <History size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">สรุปยอดค้าง (Outstanding)</h3>
                            <p className="text-indigo-100 text-sm">
                                {circle.name} • ทั้งหมด {historicalDebts.length} รายการ
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {historicalDebts.length > 0 ? (
                        <div className="space-y-4">
                            {/* Group by Round */}
                            {Array.from(new Set(historicalDebts.map(d => d.roundNumber))).map(roundNum => {
                                const debtsInRound = historicalDebts.filter(d => d.roundNumber === roundNum);
                                return (
                                    <div key={roundNum} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                            <span className="font-bold text-slate-700 text-sm">งวดที่ {roundNum}</span>
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                                                ค้าง {debtsInRound.length} คน
                                            </span>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {debtsInRound.map((debt, idx) => (
                                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                    <div className="flex items-center gap-3">
                                                        <img src={debt.memberAvatar || "https://ui-avatars.com/api/?name=U"} className="w-10 h-10 rounded-full bg-slate-200" alt=""/>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{debt.memberName}</p>
                                                            <p className="text-xs text-slate-500">
                                                                ต้องจ่าย: ฿{debt.amountExpected.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-red-600 font-bold text-sm">ขาด ฿{debt.shortage.toLocaleString()}</p>
                                                        <p className="text-xs text-emerald-600">จ่ายแล้ว ฿{debt.amountPaid.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck size={40} className="text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่มียอดค้างชำระ</h3>
                            <p className="text-sm">สมาชิกทุกคนจ่ายครบถ้วนในทุกงวดที่ผ่านมา</p>
                        </div>
                    )}
                </div>
                
                {historicalDebts.length > 0 && (
                    <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-600">รวมยอดค้างทั้งหมด</span>
                            <span className="text-red-600 text-lg">
                                ฿{historicalDebts.reduce((sum, d) => sum + d.shortage, 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
