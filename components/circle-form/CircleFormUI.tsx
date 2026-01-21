
import React from 'react';
import { ShareType, BiddingType, SharePeriod } from '../../types';
import { Calendar, Settings, AlertTriangle, Clock, Calculator } from 'lucide-react';

interface CircleFormUIProps {
    formData: any;
    setFormData: (data: any) => void;
    calculatedPrincipalPerSlot: number;
}

export const CircleFormUI: React.FC<CircleFormUIProps> = ({ formData, setFormData, calculatedPrincipalPerSlot }) => {
    
    // Handler when Bidding Type changes
    const handleBiddingTypeChange = (newType: BiddingType) => {
        const updates: any = { biddingType: newType };
        // If switching to FIXED, force type to DOK_TAM (Standard Ladder logic)
        if (newType === BiddingType.FIXED) {
            updates.type = ShareType.DOK_TAM;
        }
        setFormData({ ...formData, ...updates });
    };

    return (
        <div className="space-y-6">
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-black mb-1">ชื่อวงแชร์ <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black placeholder:text-slate-400"
                        placeholder="เช่น วงเศรษฐี, วงเพื่อนรัก"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-black mb-1">ยอดรวมทั้งวง (Total Pot) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input
                            type="number"
                            required
                            className="w-full pl-4 pr-16 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black placeholder:text-slate-400 text-lg font-bold"
                            placeholder="เช่น 50000"
                            value={formData.totalPot}
                            onChange={(e) => setFormData({...formData, totalPot: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-3 text-slate-400 text-xs font-bold">THB</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Calculator size={12} />
                        เฉลี่ยส่งมือละ: <strong>{calculatedPrincipalPerSlot.toLocaleString()}</strong> บาท 
                        <span className="text-slate-400 font-normal">(คิดจาก {formData.targetSlots > 1 ? formData.targetSlots - 1 : 0} มือ ไม่รวมท้าว)</span>
                    </p>
                </div>
            </div>

            {/* 2. Type & Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-black mb-1">รูปแบบการเล่น <span className="text-red-500">*</span></label>
                    <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black"
                        value={formData.biddingType}
                        onChange={(e) => handleBiddingTypeChange(e.target.value as BiddingType)}
                    >
                        <option value={BiddingType.AUCTION}>แข่งกันบิท (ประมูล)</option>
                        <option value={BiddingType.FIXED}>ขั้นบันได (Fixed)</option>
                    </select>
                </div>

                {/* Hide ShareType Dropdown if Fixed/Ladder is selected */}
                {formData.biddingType !== BiddingType.FIXED && (
                    <div>
                        <label className="block text-sm font-bold text-black mb-1">ประเภทแชร์ <span className="text-red-500">*</span></label>
                        <select 
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black"
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value as ShareType})}
                        >
                            <option value={ShareType.DOK_HAK}>ดอกหัก</option>
                            <option value={ShareType.DOK_TAM}>ดอกตาม</option>
                        </select>
                    </div>
                )}

                <div className={formData.biddingType === BiddingType.FIXED ? "md:col-span-2" : ""}>
                    <label className="block text-sm font-bold text-black mb-1">ระยะเวลา <span className="text-red-500">*</span></label>
                    <select 
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black"
                        value={formData.period}
                        onChange={(e) => setFormData({...formData, period: e.target.value as SharePeriod})}
                    >
                        <option value={SharePeriod.DAILY}>รายวัน</option>
                        <option value={SharePeriod.WEEKLY}>รายสัปดาห์</option>
                        <option value={SharePeriod.MONTHLY}>รายเดือน</option>
                    </select>
                </div>
            </div>

            {/* 2.5 Period Interval (Visible only for Daily) */}
            {formData.period === SharePeriod.DAILY && (
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 animate-in slide-in-from-top-2 flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-bold text-orange-900">ระยะห่าง (จำนวนวัน)</label>
                        <p className="text-[10px] text-orange-700">เช่น ใส่ 2 = เปียวันเว้นวัน (2 วันครั้ง)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number"
                            min="1"
                            className="w-20 px-3 py-2 border border-orange-300 rounded-lg text-sm bg-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={formData.periodInterval}
                            onChange={(e) => setFormData({...formData, periodInterval: Math.max(1, Number(e.target.value))})}
                        />
                        <span className="text-sm text-orange-800 font-bold">วัน/งวด</span>
                    </div>
                </div>
            )}

            {/* 3. Settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Settings size={16} /> ตั้งค่าวงแชร์ (Settings)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">เริ่มเปียงวดแรกวันที่ <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                            <input
                            type="date"
                            required
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Admin Fee */}
                    <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">ค่าดูแลท้าว (Admin Fee)</label>
                         <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">฿</span>
                            <input
                                type="number"
                                className="w-full pl-7 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm font-bold"
                                placeholder="0"
                                value={formData.adminFee}
                                onChange={(e) => setFormData({...formData, adminFee: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Late Fine */}
                    <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                         <label className="block text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> ค่าปรับล่าช้า (ต่อวัน)
                         </label>
                         <div className="relative">
                            <span className="absolute left-3 top-2 text-red-400 font-bold text-xs">฿</span>
                            <input
                                type="number"
                                className="w-full pl-7 pr-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none bg-white text-sm font-bold text-red-600"
                                placeholder="0"
                                value={formData.fineRate}
                                onChange={(e) => setFormData({...formData, fineRate: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    {/* Payment Window */}
                    <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                        <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1">
                            <Clock size={12} /> ช่วงเวลาส่งยอด
                        </label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="time"
                                className="flex-1 px-2 py-2 border border-indigo-200 rounded-lg text-xs bg-white focus:outline-none"
                                value={formData.paymentWindowStart}
                                onChange={(e) => setFormData({...formData, paymentWindowStart: e.target.value})}
                            />
                            <span className="text-xs text-indigo-400">-</span>
                            <input 
                                type="time"
                                className="flex-1 px-2 py-2 border border-indigo-200 rounded-lg text-xs bg-white focus:outline-none"
                                value={formData.paymentWindowEnd}
                                onChange={(e) => setFormData({...formData, paymentWindowEnd: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
