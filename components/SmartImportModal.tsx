
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, User, ListOrdered } from 'lucide-react';
import { parseShareScript, ParsedShareData } from '../lib/scriptParser';
import { ShareType, BiddingType, SharePeriod } from '../types';

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (data: ParsedShareData) => void;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onApply }) => {
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedShareData | null>(null);

    // Auto-parse when text changes
    useEffect(() => {
        if (inputText.trim().length > 10) {
            const result = parseShareScript(inputText);
            setParsedData(result);
        } else {
            setParsedData(null);
        }
    }, [inputText]);

    if (!isOpen) return null;

    const handleApply = () => {
        if (parsedData) {
            onApply(parsedData);
            onClose();
        }
    };

    // Helper for displaying Enum values nicely
    const getTypeLabel = (t: ShareType) => t === ShareType.DOK_HAK ? 'ดอกหัก' : 'ดอกตาม';
    const getBidTypeLabel = (t: BiddingType) => t === BiddingType.FIXED ? 'ขั้นบันได (Fix/Ladder)' : 'ประมูล (Auction)';
    const getPeriodLabel = (p: SharePeriod, interval: number) => {
        if (p === SharePeriod.DAILY) return `รายวัน (ทุก ${interval} วัน)`;
        if (p === SharePeriod.WEEKLY) return 'รายสัปดาห์';
        return 'รายเดือน';
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* LEFT: Input Area */}
                <div className="flex-1 flex flex-col border-r border-slate-100">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Sparkles className="text-purple-600" /> Smart Script Import
                        </h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 p-4 flex flex-col">
                        <textarea 
                            className="flex-1 w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none font-mono text-sm leading-relaxed text-slate-700 placeholder:text-slate-300"
                            placeholder={`วางข้อความโพยของคุณที่นี่... \nตัวอย่าง:\n"เปิดวง น้องถุงทอง ต้น 1 แสน 20 มือ ดอกตาม ส่งรายวัน บิทขั้นต่ำ 50 ค่าดูแล 500 เริ่ม 15/10\nรายชื่อ:\n1. ท้าว\n2. พี่สมชาย 500\n3. พี่สมหญิง 550"`}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            autoFocus
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            * รองรับการอ่านรายชื่อและยอดขั้นบันได (เช่น "2. ชื่อ 500")
                        </p>
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="w-full md:w-[450px] bg-white flex flex-col">
                    <div className="p-6 bg-white border-b border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-1">ผลลัพธ์การวิเคราะห์</h4>
                        <p className="text-xs text-slate-400">ตรวจสอบข้อมูลก่อนนำไปใช้</p>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                        {parsedData ? (
                            <div className="space-y-4">
                                {/* Basic Info */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">ชื่อวง</span>
                                    <div className="text-lg font-bold text-slate-800 break-words">
                                        {parsedData.name || <span className="text-slate-300 italic">-- ไม่พบชื่อ --</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">ยอดวง (Total)</span>
                                        <div className="font-bold text-emerald-600">
                                            {parsedData.totalPot ? `฿${Number(parsedData.totalPot).toLocaleString()}` : '-'}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">จำนวนมือ</span>
                                        <div className="font-bold text-slate-800">
                                            {parsedData.targetSlots || '-'} มือ
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">ประเภท</span>
                                        <span className="font-bold text-slate-700">{getTypeLabel(parsedData.type)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">รูปแบบ</span>
                                        <span className={`font-bold ${parsedData.biddingType === BiddingType.FIXED ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {getBidTypeLabel(parsedData.biddingType)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">ระยะเวลา</span>
                                        <span className="font-bold text-blue-600">{getPeriodLabel(parsedData.period, parsedData.periodInterval)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">เริ่มวันที่</span>
                                        <span className="font-bold">{parsedData.startDate}</span>
                                    </div>
                                </div>

                                {/* Parsed Members List */}
                                {parsedData.members.length > 0 && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">พบรายชื่อ ({parsedData.members.length})</span>
                                            {parsedData.biddingType === BiddingType.FIXED && (
                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">Ladder Rates</span>
                                            )}
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {parsedData.members.map((m, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm p-1.5 hover:bg-slate-50 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 text-xs w-4">{idx + 1}.</span>
                                                        <span className="font-bold text-slate-700">{m.name}</span>
                                                    </div>
                                                    {m.amount && (
                                                        <span className="font-mono text-emerald-600 font-bold text-xs bg-emerald-50 px-1.5 rounded">
                                                            ฿{m.amount}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 border-t pt-2">
                                            * ระบบจะพยายามจับคู่ชื่อกับฐานข้อมูลสมาชิกที่มีอยู่
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center p-4">
                                <Wand2 size={48} className="mb-4 opacity-50" />
                                <p>พิมพ์หรือวางข้อความทางด้านซ้าย<br/>เพื่อดูผลลัพธ์ที่นี่</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white">
                        <button 
                            onClick={handleApply}
                            disabled={!parsedData || !parsedData.totalPot}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={18} />
                            ใช้ข้อมูลนี้ (Apply)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
