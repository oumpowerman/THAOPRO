
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface ScoreDeductionModalProps {
    isOpen: boolean;
    onClose: () => void;
    memberName: string;
    daysLate: number;
    onConfirm: (points: number) => void;
}

export const ScoreDeductionModal: React.FC<ScoreDeductionModalProps> = ({ isOpen, onClose, memberName, daysLate, onConfirm }) => {
    const [points, setPoints] = useState(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 p-6 text-center">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-orange-100 text-orange-600">
                    <Star size={32} fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">อนุมัติยอดล่าช้า</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    สมาชิก <strong>{memberName}</strong> ส่งยอดช้ากว่ากำหนด 
                    <span className="text-red-500 font-bold"> {daysLate} วัน</span> <br/>
                    (เทียบจากวันที่กดแจ้งโอนในระบบ)
                </p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">ระบุคะแนนจิตพิสัยที่ต้องการหัก</label>
                    <div className="flex items-center justify-center gap-3">
                        <button 
                            onClick={() => setPoints(Math.max(0, points - 1))}
                            className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-300"
                        >
                            -
                        </button>
                        <input 
                            type="number" 
                            className="w-16 text-center text-2xl font-bold bg-transparent focus:outline-none text-orange-600"
                            value={points}
                            onChange={(e) => setPoints(Number(e.target.value))}
                        />
                        <button 
                            onClick={() => setPoints(points + 1)}
                            className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-300"
                        >
                            +
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Default: 1 คะแนน</p>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={() => onConfirm(points)}
                        className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg"
                    >
                        ยืนยันหักคะแนน
                    </button>
                </div>
            </div>
        </div>
    );
};
