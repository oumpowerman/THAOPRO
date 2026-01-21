
import React, { useState } from 'react';
import { X, AlertCircle, ScanLine, ExternalLink, RefreshCw, ThumbsDown, Check, ShieldCheck, Smartphone, CheckCircle2, Ban, TestTube, Zap, AlertTriangle, Clock } from 'lucide-react';
import { Transaction } from '../../../types';
import { verifySlipService, SlipVerificationResult } from '../../../lib/services/slipVerification';
import { APP_CONFIG } from '../../../lib/config';

interface ReviewData {
    tx: Transaction;
    memberName: string;
    amountExpected: number;
    avatarUrl?: string;
    daysLate?: number;
    fineAmount?: number;
}

interface ReviewSlipModalProps {
    isOpen: boolean;
    data: ReviewData | null;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
}

export const ReviewSlipModal: React.FC<ReviewSlipModalProps> = ({ isOpen, data, onClose, onApprove, onReject }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<SlipVerificationResult | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setScanResult(null);
            setIsScanning(false);
        }
    }, [isOpen, data]);

    const handleScanSlip = async () => {
        if (!data || !data.tx.slipUrl) return;
        setIsScanning(true);
        const result = await verifySlipService(data.tx.slipUrl, data.tx.amountPaid);
        setScanResult(result);
        setIsScanning(false);
    };

    if (!isOpen || !data) return null;

    const hasFine = data.fineAmount && data.fineAmount > 0;
    const isLate = data.daysLate && data.daysLate > 0;
    const totalNeeded = data.amountExpected + (data.fineAmount || 0);
    const isPaidEnough = data.tx.amountPaid >= totalNeeded - 1; // Tolerance 1 baht

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          
             <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                 <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 relative">
                    <div className="flex items-center gap-3">
                        <img src={data.avatarUrl || 'https://ui-avatars.com/api/?name=U'} alt="" className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600" />
                        <div>
                            <h3 className="font-bold text-sm">ตรวจสอบยอด: {data.memberName}</h3>
                            <p className="text-xs text-slate-300">แจ้งโอนเมื่อ: {data.tx.timestamp}</p>
                        </div>
                    </div>
                    
                    <div className={`absolute top-0 right-12 mt-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${APP_CONFIG.USE_REAL_SLIP_VERIFICATION ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {APP_CONFIG.USE_REAL_SLIP_VERIFICATION ? <Zap size={10} fill="currentColor"/> : <TestTube size={10} />}
                        {APP_CONFIG.USE_REAL_SLIP_VERIFICATION ? 'Real API' : 'Mock Mode'}
                    </div>

                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0">
                        <X size={20} />
                    </button>
                 </div>
                 
                 <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center relative min-h-[300px] overflow-auto">
                        {data.tx.slipUrl ? (
                            <>
                                <img src={data.tx.slipUrl} alt="Slip" className="max-w-full max-h-full rounded-lg shadow-md object-contain" />
                                {isScanning && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                                        <ScanLine className="text-blue-400 animate-pulse w-16 h-16 mb-2" />
                                        <p className="text-white font-bold animate-pulse">กำลังสแกนสลิปด้วย AI...</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                <AlertCircle size={48} className="opacity-20" />
                                <p className="text-sm">ไม่มีรูปสลิปแนบมา</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-100 flex flex-col shrink-0">
                        <div className="p-5 border-b border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">ยอดที่โอนมา</p>
                            <p className="text-3xl font-bold text-blue-600">฿{data.tx.amountPaid.toLocaleString()}</p>
                            
                            {/* LATE STATUS BADGE (Show always if late, even if fine is 0) */}
                            {isLate && (
                                <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-bold text-[11px] ${hasFine ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                                    <Clock size={12} />
                                    <span>ส่งยอดล่าช้า {data.daysLate} วัน</span>
                                </div>
                            )}

                            {/* FINE BREAKDOWN (Show only if money deduction exists) */}
                            {hasFine && (
                                <div className="mt-3 bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[11px]">
                                    <div className="flex justify-between text-slate-500 mb-1">
                                        <span>ยอดงวดปกติ:</span>
                                        <span>{data.amountExpected.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 font-bold border-t border-dashed border-slate-200 pt-1 mt-1">
                                        <span>+ ค่าปรับล่าช้า:</span>
                                        <span>{data.fineAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-200 mt-1.5 pt-1.5 flex justify-between font-black text-slate-900 text-xs">
                                        <span>รวมที่ควรได้รับ:</span>
                                        <span>{totalNeeded.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {!isPaidEnough && (
                                <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1 bg-red-50 p-1.5 rounded border border-red-100">
                                    <AlertTriangle size={10} /> ยอดเงินไม่ครบ (ขาด {Math.abs(totalNeeded - data.tx.amountPaid).toLocaleString()})
                                </p>
                            )}

                            {data.tx.slipUrl && (
                                <div className="mt-3 flex gap-2">
                                    <a href={data.tx.slipUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-[10px] font-bold underline flex items-center gap-1">
                                        <ExternalLink size={10} /> เปิดรูปสลิปขนาดเต็ม
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 p-5 bg-slate-50 overflow-y-auto">
                            {!scanResult ? (
                                <div className="text-center text-slate-400 py-4">
                                    <Smartphone size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">กดปุ่มสแกนด้านล่างเพื่อตรวจสลิป</p>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-xl border ${scanResult.isValid ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} animate-in slide-in-from-bottom-2`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {scanResult.isValid ? <ShieldCheck className="text-emerald-500" size={18}/> : <AlertCircle className="text-red-500" size={18}/>}
                                        <span className={`font-bold text-sm ${scanResult.isValid ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {scanResult.message}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-slate-600">
                                        <p>จาก: <strong>{scanResult.sender}</strong></p>
                                        <p>เข้า: <strong>{scanResult.receiver}</strong></p>
                                        <p>จำนวน: <strong>฿{scanResult.amount.toLocaleString()}</strong></p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 space-y-3 bg-white">
                            {data.tx.status === 'WAITING_APPROVAL' && (
                                <button onClick={handleScanSlip} disabled={isScanning || !data.tx.slipUrl} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                                    {isScanning ? <RefreshCw className="animate-spin" size={16} /> : <ScanLine size={16} />}
                                    {isScanning ? 'กำลังตรวจสอบ...' : `✨ ตรวจสลิปอัตโนมัติ`}
                                </button>
                            )}

                            {data.tx.status === 'WAITING_APPROVAL' ? (
                                <div className="flex gap-2">
                                    <button onClick={onReject} className="flex-1 py-2.5 border border-red-200 bg-white text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2">
                                        <ThumbsDown size={16} /> ปฏิเสธ
                                    </button>
                                    <button onClick={onApprove} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                                        <Check size={16} /> อนุมัติ
                                    </button>
                                </div>
                            ) : (
                                <div className={`text-center p-3 rounded-xl border font-bold flex items-center justify-center gap-2 ${data.tx.status === 'PAID' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    {data.tx.status === 'PAID' ? <CheckCircle2 size={18} /> : <Ban size={18} />}
                                    {data.tx.status === 'PAID' ? 'รายการนี้อนุมัติแล้ว' : 'รายการนี้ถูกปฏิเสธแล้ว'}
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
              </div>
        </div>
    );
};
