
import React, { useState, useEffect } from 'react';
import { ListOrdered, Wand2, ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface LadderInterestSetupProps {
    totalSlots: number;
    values: { [key: number]: number };
    onChange: (values: { [key: number]: number }) => void;
    defaultPrincipal: number;
}

export const LadderInterestSetup: React.FC<LadderInterestSetupProps> = ({ totalSlots, values, onChange, defaultPrincipal }) => {
    // Local state for the generator tools
    const [startAmount, setStartAmount] = useState<number | ''>(defaultPrincipal);
    const [stepAmount, setStepAmount] = useState<number | ''>(10);
    const [direction, setDirection] = useState<'DESC' | 'ASC' | 'CONST'>('ASC');

    // Auto-generate logic
    const handleGenerate = () => {
        const start = Number(startAmount) || 0;
        const step = Number(stepAmount) || 0;
        const newAmounts: { [key: number]: number } = {};

        // Slot 1 is always Thao (0 interest usually, handled by logic but we set 0 for UI)
        newAmounts[1] = 0;

        for (let i = 2; i <= totalSlots; i++) {
            if (direction === 'CONST') {
                newAmounts[i] = start;
            } else if (direction === 'ASC') {
                // Example: Start 1000, Step 10 -> 1000, 1010, 1020...
                newAmounts[i] = start + ((i - 2) * step);
            } else {
                // Example: Start 1000, Step 10 -> 1000, 990, 980... (Min 0)
                newAmounts[i] = Math.max(0, start - ((i - 2) * step));
            }
        }
        onChange(newAmounts);
    };

    // Handle manual input change for a specific slot
    const handleSlotChange = (slot: number, val: string) => {
        const numVal = parseFloat(val);
        const newAmounts = { ...values };
        if (isNaN(numVal)) {
            delete newAmounts[slot]; 
        } else {
            newAmounts[slot] = numVal;
        }
        onChange(newAmounts);
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <ListOrdered size={18} /> กำหนดยอดส่งแต่ละมือ (Fixed Amount)
                </label>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">
                    {totalSlots} มือ
                </span>
            </div>

            <div className="text-xs text-blue-600 mb-3 bg-white/50 p-2 rounded border border-blue-100">
                ℹ️ ระบุ <strong>"ยอดรวมที่ต้องจ่ายต่องวด"</strong> ของแต่ละมือได้เลย (ระบบจะใช้ยอดนี้ไปเก็บเงินจริง)
            </div>

            {/* Generator Tools */}
            <div className="bg-white p-3 rounded-lg border border-blue-100 mb-4 shadow-sm">
                <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">ตัวช่วยคำนวณ (Auto Generator)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">เริ่มที่ (Start)</label>
                        <div className="relative">
                            <span className="absolute left-2 top-1.5 text-slate-400 text-xs">฿</span>
                            <input 
                                type="number" 
                                className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                                placeholder="1000" 
                                value={startAmount} 
                                onChange={(e) => setStartAmount(Number(e.target.value))} 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ทีละ (Step)</label>
                        <input 
                            type="number" 
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
                            placeholder="10" 
                            value={stepAmount} 
                            onChange={(e) => setStepAmount(Number(e.target.value))} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">ทิศทาง</label>
                        <div className="relative">
                            <select 
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm appearance-none bg-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer" 
                                value={direction} 
                                onChange={(e: any) => setDirection(e.target.value)}
                            >
                                <option value="ASC">เพิ่มขึ้น (Asc)</option>
                                <option value="DESC">ลดลง (Desc)</option>
                                <option value="CONST">คงที่ (Constant)</option>
                            </select>
                            <div className="absolute right-2 top-2 pointer-events-none text-slate-400">
                                {direction === 'DESC' && <ArrowDown size={14} />}
                                {direction === 'ASC' && <ArrowUp size={14} />}
                                {direction === 'CONST' && <Minus size={14} />}
                            </div>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleGenerate}
                        className="bg-blue-600 text-white py-1.5 px-3 rounded text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-1 transition-colors shadow-sm"
                    >
                        <Wand2 size={14} /> Auto-Fill
                    </button>
                </div>
            </div>

            {/* Slots Table */}
            <div className="max-h-60 overflow-y-auto border border-blue-100 rounded-lg shadow-inner custom-scrollbar">
                <table className="w-full text-sm bg-white">
                    <thead className="bg-blue-100 text-blue-800 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-2 text-left w-24">งวดที่</th>
                            <th className="px-4 py-2 text-left">ยอดส่งต่องวด (บาท)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                        {Array.from({ length: totalSlots }, (_, i) => i + 1).map(slot => (
                            <tr key={slot} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2 font-bold text-slate-600">
                                    {slot === 1 ? (
                                        <span className="flex items-center gap-1 text-blue-600">1 <span className="text-[10px] bg-blue-100 px-1 rounded">ท้าว</span></span>
                                    ) : slot}
                                </td>
                                <td className="px-4 py-2">
                                    {slot === 1 ? (
                                        <span className="text-xs text-slate-400 font-bold block py-1.5">0 (ยกเว้น)</span>
                                    ) : (
                                        <input 
                                            type="number"
                                            className="w-full p-1.5 border border-slate-200 rounded text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            value={values[slot] !== undefined ? values[slot] : ''}
                                            onChange={(e) => handleSlotChange(slot, e.target.value)}
                                            placeholder="0"
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] text-blue-400 mt-2 text-right">* สามารถแก้ไขตัวเลขรายช่องได้ตามต้องการ</p>
        </div>
    );
};
