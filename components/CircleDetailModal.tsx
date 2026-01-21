
import React, { useState, useMemo } from 'react';
import { X, Users, Clock, Gavel, ListOrdered, AlertCircle, PlayCircle, Trophy, Lock, Edit3, Check, Flag } from 'lucide-react';
import { ShareCircle, CircleStatus, BiddingType, SharePeriod, CircleMember } from '../types';
import { useAppContext } from '../context/AppContext';

interface CircleDetailModalProps {
    circle: ShareCircle;
    onClose: () => void;
    onStartCircle: (id: string) => void;
    onEdit?: () => void;
}

export const CircleDetailModal: React.FC<CircleDetailModalProps> = ({ circle, onClose, onStartCircle, onEdit }) => {
    const { members, user, updateCircleSlot, updateCircle } = useAppContext();
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Edit Form State (Keyed by slotNumber)
    const [editForms, setEditForms] = useState<{[key: number]: Partial<CircleMember>}>({});

    // Helper to get member info including Admin
    const getMemberInfo = (id: string) => {
        const foundMember = members.find(m => m.id === id);
        if (foundMember) return foundMember;
        if (user && user.id === id) {
            return {
                id: user.id,
                name: `${user.name} (ท้าวแชร์/คุณ)`,
                avatarUrl: user.avatarUrl,
                phone: user.username || '-'
            };
        }
        return null;
    };

    const getPeriodLabel = (p: SharePeriod) => {
        switch(p) {
            case SharePeriod.DAILY: return 'รายวัน';
            case SharePeriod.WEEKLY: return 'รายสัปดาห์';
            case SharePeriod.MONTHLY: return 'รายเดือน';
            default: return p;
        }
    };

    // Toggle Edit for a specific row
    const handleEditChange = (slotNumber: number, field: string, value: any) => {
        setEditForms(prev => ({
            ...prev,
            [slotNumber]: {
                ...prev[slotNumber],
                [field]: value
            }
        }));
    };

    const handleSaveSlot = async (slotNumber: number, originalMember: CircleMember) => {
        const updates = editForms[slotNumber];
        if (!updates) {
            alert('ไม่มีการเปลี่ยนแปลง');
            return;
        }
        
        if (window.confirm(`ยืนยันการบันทึกข้อมูลมือที่ ${slotNumber}?`)) {
            await updateCircleSlot(circle.id, slotNumber, updates);
            // Clear local edit state for this slot
            const newForms = { ...editForms };
            delete newForms[slotNumber];
            setEditForms(newForms);
            alert('บันทึกเรียบร้อย');
        }
    };

    const handleCloseCircle = async () => {
        if (window.confirm(`⚠️ ยืนยันการปิดวงแชร์ "${circle.name}"?\n\nสถานะจะเปลี่ยนเป็น "COMPLETED" และถือว่าการเล่นสิ้นสุดลงแล้ว`)) {
            await updateCircle(circle.id, { status: CircleStatus.COMPLETED });
            onClose(); // Close modal on completion
        }
    };

    // Prepare selectable members for dropdown
    const availableMembers = [...members];
    if(user && !members.some(m => m.id === user.id)) {
        availableMembers.push({ id: user.id, name: `${user.name} (ท้าว)`, role: 'ADMIN' } as any);
    }

    // --- SORTING LOGIC ---
    const displayRows = useMemo(() => {
        // 1. Get real members
        const realMembers = [...circle.members];

        // 2. Create placeholders for empty slots (if totalSlots > members.length)
        const existingSlots = realMembers.map(m => m.slotNumber);
        const emptySlots = [];
        for (let i = 1; i <= circle.totalSlots; i++) {
            if (!existingSlots.includes(i)) {
                emptySlots.push({
                    memberId: `empty-${i}`,
                    slotNumber: i,
                    status: 'ALIVE' as const, 
                    isEmpty: true
                });
            }
        }

        const allItems = [...realMembers, ...emptySlots];

        // 3. Sort
        return allItems.sort((a, b) => {
            // Rule 1: Thao (Slot 1) always first
            if (a.slotNumber === 1) return -1;
            if (b.slotNumber === 1) return 1;

            // Rule 2: Pid Ton (Fixed Last Hand) always last if ALIVE
            const aIsPid = (a as any).pidTonAmount && (a as any).pidTonAmount > 0;
            const bIsPid = (b as any).pidTonAmount && (b as any).pidTonAmount > 0;
            
            if (a.status === 'ALIVE' && b.status === 'ALIVE') {
                if (aIsPid && !bIsPid) return 1;
                if (!aIsPid && bIsPid) return -1;
            }

            // Rule 3: Dead (Won) before Alive (Waiting)
            // Note: For Fixed/Ladder, we prefer sorting by Slot Number naturally, but this logic keeps played hands on top for history
            // Let's keep it consistent: Played/Dead on top, Alive below.
            const aDead = a.status === 'DEAD';
            const bDead = b.status === 'DEAD';
            
            if (aDead && !bDead) return -1;
            if (!aDead && bDead) return 1;

            // Rule 4: If both Dead, sort by Won Round (History timeline)
            if (aDead && bDead) {
                return (a.wonRound || 0) - (b.wonRound || 0);
            }

            // Rule 5: If both Alive, sort by Slot Number (Original insertion order)
            return a.slotNumber - b.slotNumber;
        });
    }, [circle.members, circle.totalSlots]);


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                        {circle.status === CircleStatus.INITIALIZING ? (
                             <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">กำลังตั้งวง</span>
                        ) : circle.status === CircleStatus.SETUP_COMPLETE ? (
                             <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700">ตั้งวงสำเร็จ</span>
                        ) : circle.status === CircleStatus.COMPLETED ? (
                             <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300">จบวงแล้ว</span>
                        ) : (
                             <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">Active</span>
                        )}
                        <h3 className="text-2xl font-bold text-slate-800">{circle.name}</h3>
                    </div>
                    
                    <div className="flex gap-3 mt-2 text-sm text-slate-600">
                       <span className="flex items-center gap-1"><Users size={16}/> {circle.totalSlots} มือ</span>
                       <span className="flex items-center gap-1">
                           <Clock size={16}/> {getPeriodLabel(circle.period)} 
                           {circle.period === SharePeriod.DAILY && circle.periodInterval && circle.periodInterval > 1 ? ` (ทุก ${circle.periodInterval} วัน)` : ''}
                       </span>
                       <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200">
                          {circle.biddingType === BiddingType.FIXED ? <ListOrdered size={14}/> : <Gavel size={14}/>}
                          {circle.biddingType === BiddingType.FIXED ? 'ขั้นบันได' : 'ประมูล'}
                       </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                        <span>ขั้นต่ำ: <strong>{circle.minBid}</strong> บาท</span>
                        <span>ค่าดูแลท้าว: <strong>{circle.adminFee || 0}</strong> บาท</span>
                        <span>ค่าปรับล่าช้า: <strong>{circle.fineRate || 0}</strong> บาท/วัน</span>
                    </div>
                    {(circle.paymentWindowStart || circle.paymentWindowEnd) && (
                        <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block font-bold">
                            🕒 เวลาส่งยอด: {circle.paymentWindowStart || '00:00'} - {circle.paymentWindowEnd || '23:59'} น.
                        </div>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-2 sm:gap-3">
                     {circle.status !== CircleStatus.COMPLETED && (
                         <>
                             {onEdit && (
                                <button 
                                    onClick={onEdit}
                                    className="px-3 py-2 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2 text-sm font-bold transition-all transform active:scale-95 border border-white/10"
                                >
                                    <Edit3 size={16} />
                                    <span className="hidden sm:inline">แก้ไขวงแชร์</span>
                                </button>
                             )}

                             <button 
                                onClick={handleCloseCircle} 
                                className="px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 flex items-center gap-2 text-sm font-bold transition-all transform active:scale-95 border border-white/10"
                                title="ปิดวงแชร์เมื่อเล่นจบ"
                             >
                                <Flag size={16} fill="currentColor" />
                                <span className="hidden sm:inline">จบวง (Archive)</span>
                             </button>
                             <button 
                                onClick={() => setIsEditMode(!isEditMode)} 
                                className={`px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${isEditMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                             >
                                {isEditMode ? <Check size={16} /> : <ListOrdered size={16} />}
                                <span className="hidden sm:inline">{isEditMode ? 'เสร็จสิ้น' : 'แก้ไขข้อมูล'}</span>
                             </button>
                         </>
                     )}
                     <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                     </button>
                 </div>
              </div>

              {circle.status === CircleStatus.INITIALIZING && (
                  <div className="p-6 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-white rounded-full text-amber-500 shadow-sm">
                              <AlertCircle size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-amber-900">วงแชร์นี้ยังไม่ได้เริ่มเดิน (Pending)</h4>
                              <p className="text-sm text-amber-700">ตรวจสอบสมาชิกให้ครบถ้วน ({circle.members.length}/{circle.totalSlots}) ก่อนกดเริ่ม</p>
                          </div>
                      </div>
                      <button 
                         onClick={() => onStartCircle(circle.id)}
                         className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform hover:scale-105"
                      >
                          <PlayCircle size={20} />
                          เริ่มเดินวง (Start)
                      </button>
                  </div>
              )}

              <div className="p-6 overflow-y-auto">
                 <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Trophy className="text-amber-500" size={20} />
                    สถานะการเปียรายมือ (เรียงตามลำดับการเปีย)
                 </h4>

                 <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                       <thead className="bg-slate-100 text-slate-500 font-medium">
                          <tr>
                             <th className="px-4 py-4 text-left w-20">ลำดับที่</th>
                             <th className="px-4 py-4 text-left">สมาชิก</th>
                             <th className="px-4 py-4 text-center">สถานะ</th>
                             <th className="px-4 py-4 text-right">
                                {circle.biddingType === BiddingType.FIXED ? 'ยอดส่ง (Fixed)' : 'ดอกเบี้ย'}
                             </th>
                             <th className="px-4 py-4 text-center">งวดที่ชนะ</th>
                             {isEditMode && <th className="px-4 py-4 text-left">หมายเหตุ</th>}
                             {isEditMode && <th className="px-4 py-4 text-center w-20">Actions</th>}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {displayRows.map((member: any) => {
                               const slotNum = member.slotNumber;
                               
                               if (member.isEmpty) {
                                   return (
                                       <tr key={`empty-${slotNum}`} className="bg-slate-50/50">
                                           <td className="px-4 py-4"><span className="font-bold text-slate-400">{slotNum}</span></td>
                                           <td className="px-4 py-4 text-slate-400 italic">-- ว่าง --</td>
                                           <td colSpan={isEditMode ? 5 : 3} className="px-4 py-4 text-center text-slate-300">-</td>
                                       </tr>
                                   );
                               }

                               const edits = editForms[slotNum] || {};
                               const currentMemberId = edits.memberId || member.memberId;
                               const currentStatus = edits.status || member.status;
                               
                               // Determine which field to edit/display based on BiddingType
                               let currentAmount = 0;
                               let amountField = 'bidAmount'; // Default to auction
                               
                               if (circle.biddingType === BiddingType.FIXED) {
                                   amountField = 'fixedDueAmount';
                                   currentAmount = edits.fixedDueAmount !== undefined ? edits.fixedDueAmount : (member.fixedDueAmount || 0);
                               } else {
                                   currentAmount = edits.bidAmount !== undefined ? edits.bidAmount : (member.bidAmount || 0);
                               }

                               const currentNote = edits.note !== undefined ? edits.note : member.note;
                               const currentWonRound = edits.wonRound !== undefined ? edits.wonRound : member.wonRound;

                               const memberData = getMemberInfo(currentMemberId);
                               const isDead = currentStatus === 'DEAD';
                               const isPidTon = member.pidTonAmount && member.pidTonAmount > 0;
                               const isThao = member.slotNumber === 1;
                               
                               // --- MODIFIED ORDER DISPLAY LOGIC ---
                               let orderDisplay: string | number = '-';
                               if (circle.biddingType === BiddingType.FIXED) {
                                   // For Fixed/Ladder, Always show Slot Number as Order
                                   orderDisplay = member.slotNumber;
                               } else {
                                   // For Auction, show Won Round or Special Status
                                   if (isPidTon) orderDisplay = circle.totalSlots;
                                   else if (isDead) orderDisplay = (member.wonRound || 1);
                               }

                               if (isEditMode) {
                                   return (
                                       <tr key={`${member.memberId}-${slotNum}`} className="bg-blue-50/30">
                                           <td className="px-4 py-4 font-bold text-slate-700">{orderDisplay}</td>
                                           <td className="px-4 py-4">
                                               <select 
                                                   className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                                   value={currentMemberId}
                                                   onChange={(e) => handleEditChange(slotNum, 'memberId', e.target.value)}
                                               >
                                                   {availableMembers.map(m => (
                                                       <option key={m.id} value={m.id}>{m.name}</option>
                                                   ))}
                                               </select>
                                           </td>
                                           <td className="px-4 py-4 text-center">
                                               <select 
                                                   className={`p-2 border border-slate-300 rounded-lg text-sm font-bold ${currentStatus === 'DEAD' ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}
                                                   value={currentStatus}
                                                   onChange={(e) => handleEditChange(slotNum, 'status', e.target.value)}
                                               >
                                                   <option value="ALIVE">รอเปีย (Alive)</option>
                                                   <option value="DEAD">เปียแล้ว (Dead)</option>
                                               </select>
                                           </td>
                                           <td className="px-4 py-4 text-right">
                                               {/* Dynamic Input based on Type */}
                                               <input 
                                                   type="number" 
                                                   className="w-20 p-2 border border-slate-300 rounded-lg text-right"
                                                   value={currentAmount}
                                                   onChange={(e) => handleEditChange(slotNum, amountField, Number(e.target.value))}
                                               />
                                           </td>
                                           <td className="px-4 py-4 text-center">
                                               <input 
                                                   type="number" 
                                                   className="w-16 p-2 border border-slate-300 rounded-lg text-center"
                                                   value={currentWonRound || ''}
                                                   onChange={(e) => handleEditChange(slotNum, 'wonRound', Number(e.target.value))}
                                                   placeholder="-"
                                               />
                                           </td>
                                           <td className="px-4 py-4">
                                               <input 
                                                   type="text"
                                                   className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                                   value={currentNote || ''}
                                                   onChange={(e) => handleEditChange(slotNum, 'note', e.target.value)}
                                                   placeholder="หมายเหตุ..."
                                               />
                                           </td>
                                           <td className="px-4 py-4 text-center">
                                               {editForms[slotNum] ? (
                                                   <button 
                                                       onClick={() => handleSaveSlot(slotNum, member)}
                                                       className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                                                       title="บันทึก"
                                                   >
                                                       <Check size={16} />
                                                   </button>
                                               ) : (
                                                   <span className="text-slate-300">-</span>
                                               )}
                                           </td>
                                       </tr>
                                   );
                               }

                               let handBgClass = isDead ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700';
                               if (slotNum === 1) handBgClass = 'bg-blue-600 text-white';
                               if (isPidTon) handBgClass = 'bg-indigo-100 text-indigo-700';

                               const displayWonRound = isThao && isDead ? 1 : member.wonRound;

                               return (
                                  <tr key={`${member.memberId}-${slotNum}`} className={`transition-colors hover:bg-slate-50`}>
                                     <td className="px-4 py-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${handBgClass}`}>
                                            {orderDisplay}
                                        </div>
                                     </td>
                                     <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                           <img src={memberData?.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                                           <div>
                                              <p className={`font-semibold ${isDead ? 'text-slate-500' : 'text-slate-900'}`}>{memberData?.name}</p>
                                              {isPidTon && (
                                                  <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold mt-1">
                                                      <Lock size={10} /> ปิดต้น (฿{member.pidTonAmount?.toLocaleString()})
                                                  </span>
                                              )}
                                              {member.note && (
                                                  <p className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded inline-block mt-1 border border-amber-100">
                                                      📝 {member.note}
                                                  </p>
                                              )}
                                           </div>
                                        </div>
                                     </td>
                                     <td className="px-4 py-4 text-center">
                                        {isDead ? (
                                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                              เปียแล้ว
                                           </span>
                                        ) : (
                                           <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                               circle.biddingType === BiddingType.AUCTION 
                                               ? 'bg-slate-100 text-slate-600' 
                                               : 'bg-emerald-100 text-emerald-700' 
                                           }`}>
                                              {circle.status === CircleStatus.INITIALIZING 
                                                ? 'รอเริ่ม' 
                                                : circle.status === CircleStatus.COMPLETED
                                                    ? 'จบวงแล้ว'
                                                    : 'รอเปีย'}
                                           </span>
                                        )}
                                     </td>
                                     <td className="px-4 py-4 text-right font-bold text-slate-700">
                                        {/* Display Logic: Fixed vs Auction */}
                                        {circle.biddingType === BiddingType.FIXED ? (
                                            member.slotNumber === 1 ? 'ยกเว้น' : `฿${(member.fixedDueAmount || 0).toLocaleString()}`
                                        ) : (
                                            isDead ? `฿${(member.bidAmount ?? 0).toLocaleString()}` : '-'
                                        )}
                                     </td>
                                     <td className="px-4 py-4 text-center text-slate-500">
                                        {isDead ? `งวดที่ ${displayWonRound}` : '-'}
                                     </td>
                                  </tr>
                               );
                            })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </div>
    );
};
