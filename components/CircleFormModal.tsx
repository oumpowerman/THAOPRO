
import React, { useState, useEffect } from 'react';
import { X, Crown, MessageSquarePlus, Loader2, Sparkles } from 'lucide-react';
import { ShareCircle, ShareType, SharePeriod, BiddingType, CircleMember, CircleStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import { AlertModal } from './AlertModal';
import { formatErrorMessage } from '../lib/errorHandler';
import { SmartImportModal } from './SmartImportModal';
import { ParsedShareData } from '../lib/scriptParser';
import { LadderSlotBuilder } from './LadderSlotBuilder';
import { CircleFormUI } from './circle-form/CircleFormUI';
import { MemberSelector } from './circle-form/MemberSelector';

interface CircleFormModalProps {
    onClose: () => void;
    editingCircleId: string | null;
    onSuccess: (script: string) => void;
}

export const CircleFormModal: React.FC<CircleFormModalProps> = ({ onClose, editingCircleId, onSuccess }) => {
    const { members, user, addCircle, updateCircle, scriptTemplate, circles, showAlert } = useAppContext();

    // --- FORM STATE ---
    const [formData, setFormData] = useState({
        name: '',
        totalPot: '' as number | '',
        targetSlots: 10,
        type: ShareType.DOK_TAM, 
        biddingType: BiddingType.AUCTION,
        period: SharePeriod.MONTHLY,
        periodInterval: 1, 
        minBid: '' as number | '',
        bidStep: '' as number | '',
        adminFee: '' as number | '', 
        fineRate: '' as number | '', 
        startDate: new Date().toISOString().split('T')[0],
        paymentWindowStart: '15:00',
        paymentWindowEnd: '18:00', 
        selectedMemberIds: [] as string[],
        isPidTon: false,
        pidTonMemberId: '',
        pidTonFee: '' as number | '' 
    });

    // Ladder Interest/Fixed Amount State (Key: Slot Number, Value: Amount)
    const [slotAmounts, setSlotAmounts] = useState<{[key: number]: number}>({});

    // Search & UI State
    const [memberSearch, setMemberSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSmartImport, setShowSmartImport] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    // --- COMPUTED VALUES ---
    const calculatedPrincipalPerSlot = (formData.totalPot && formData.targetSlots > 1) 
      ? Math.floor(Number(formData.totalPot) / (formData.targetSlots - 1)) 
      : 0;

    const calculatedTotalPidTon = formData.isPidTon 
        ? (calculatedPrincipalPerSlot * (formData.targetSlots - 1)) + (Number(formData.pidTonFee) || 0)
        : 0;

    // --- EFFECTS ---

    // 1. Auto-Calculate target slots in Fixed Mode based on list length
    useEffect(() => {
        if (formData.biddingType === BiddingType.FIXED) {
            if (formData.selectedMemberIds.length > 0) {
                setFormData(prev => ({ ...prev, targetSlots: prev.selectedMemberIds.length }));
            }
        }
    }, [formData.selectedMemberIds.length, formData.biddingType]);

    // 2. Load Data if Edit Mode
    useEffect(() => {
        if (editingCircleId) {
            const circle = circles.find(c => c.id === editingCircleId);
            if (circle) {
                // Recover Slot Amounts for Ladder Mode
                // Prefer fixedDueAmount if available, else use bidAmount (legacy)
                const amounts: {[key: number]: number} = {};
                circle.members.forEach(m => {
                    amounts[m.slotNumber] = m.fixedDueAmount || m.bidAmount || 0;
                });

                // In FIXED mode, we must ensure order is preserved by Slot Number
                const sortedMembers = [...circle.members].sort((a,b) => a.slotNumber - b.slotNumber);
                const lastMember = sortedMembers[sortedMembers.length - 1];
                
                const hasPidTon = lastMember && (lastMember.pidTonAmount !== undefined && lastMember.pidTonAmount > 0);
                
                let existingFee = '' as number | '';
                if (hasPidTon) {
                    const principalTotal = circle.principal * (circle.totalSlots - 1);
                    existingFee = (lastMember.pidTonAmount || 0) - principalTotal;
                }

                const calculatedTotalPot = circle.principal * (circle.totalSlots - 1);

                setFormData({
                    name: circle.name,
                    totalPot: calculatedTotalPot,
                    targetSlots: circle.totalSlots,
                    type: circle.type,
                    biddingType: circle.biddingType,
                    period: circle.period,
                    periodInterval: circle.periodInterval || 1, 
                    minBid: circle.minBid || '',
                    bidStep: circle.bidStep || '',
                    adminFee: circle.adminFee || '', 
                    fineRate: circle.fineRate || '', 
                    startDate: circle.startDate,
                    paymentWindowStart: circle.paymentWindowStart || '15:00',
                    paymentWindowEnd: circle.paymentWindowEnd || '18:00',
                    selectedMemberIds: sortedMembers.map(m => m.memberId),
                    isPidTon: !!hasPidTon,
                    pidTonMemberId: hasPidTon ? lastMember.memberId : '',
                    pidTonFee: existingFee
                });
                setSlotAmounts(amounts);
            }
        } else {
            if (user) {
                setFormData(prev => ({ ...prev, selectedMemberIds: [user.id] }));
            }
        }
    }, [editingCircleId, circles, user]);

    // --- SMART IMPORT LOGIC ---
    const handleSmartImportApply = (data: ParsedShareData) => {
        // 1. Basic Fields
        const newData = {
            name: data.name,
            totalPot: data.totalPot,
            targetSlots: data.targetSlots,
            type: data.type,
            biddingType: data.biddingType,
            period: data.period,
            periodInterval: data.periodInterval,
            minBid: data.minBid,
            bidStep: data.bidStep,
            adminFee: data.adminFee,
            startDate: data.startDate || new Date().toISOString().split('T')[0]
        };

        // 2. Member Matching & Interest Mapping
        let matchedMemberIds: string[] = [];
        const newAmounts: {[key: number]: number} = {};

        // Always keep Thao (Current User) as #1 if not editing
        if (!editingCircleId && user) {
            matchedMemberIds.push(user.id);
        }

        // Map parsed members to existing DB members (Fuzzy matching)
        data.members.forEach((pm, idx) => {
            const cleanParsedName = pm.name.toLowerCase().replace(/\s/g, '');
            // Try EXACT match first
            let found = members.find(m => m.name.toLowerCase().replace(/\s/g, '') === cleanParsedName);
            // Try Partial match
            if (!found) {
                found = members.find(m => {
                    const dbName = m.name.toLowerCase().replace(/\s/g, '');
                    return dbName.includes(cleanParsedName) || cleanParsedName.includes(dbName);
                });
            }

            if (found) {
                if (!matchedMemberIds.includes(found.id)) {
                    matchedMemberIds.push(found.id);
                    // For Ladder mode, map amounts to slots
                    if (data.biddingType === BiddingType.FIXED && pm.amount) {
                        const currentSlot = matchedMemberIds.length; 
                        newAmounts[currentSlot] = pm.amount;
                    }
                }
            }
        });

        setFormData(prev => ({
            ...prev,
            ...newData,
            selectedMemberIds: matchedMemberIds.length > 0 ? matchedMemberIds : prev.selectedMemberIds
        }));
        
        if (Object.keys(newAmounts).length > 0) {
            setSlotAmounts(newAmounts);
        }
        
        if (matchedMemberIds.length > 1) {
            showAlert(`จับคู่สมาชิกได้ ${matchedMemberIds.length - 1} คนจากข้อความ`, 'Import สำเร็จ', 'success');
        }
    };

    // --- MEMBER HELPERS ---
    const getSelectableMembers = () => {
        const adminMember = user ? {
            id: user.id,
            name: `${user.name} (ท้าวแชร์/คุณ)`,
            avatarUrl: user.avatarUrl,
            phone: user.username || '-'
        } : null;

        const isAdminInList = members.some(m => m.id === user?.id);
        let list = [...members];
        if (adminMember && !isAdminInList) {
            list = [adminMember as any, ...members];
        } else if (isAdminInList) {
            list = members.map(m => m.id === user?.id ? { ...m, name: `${m.name} (ท้าวแชร์)` } : m);
        }
        return list;
    };

    const selectableMembers = getSelectableMembers();
    const filteredMembers = selectableMembers.filter(m => 
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.phone.includes(memberSearch)
    );

    const getSelectedUniqueMembers = () => {
        const uniqueIds = Array.from(new Set(formData.selectedMemberIds));
        return uniqueIds.map(id => selectableMembers.find(m => m.id === id)).filter(Boolean);
    };

    const addMemberSelection = (id: string) => {
        setFormData(prev => {
          if (prev.selectedMemberIds.length >= prev.targetSlots && prev.biddingType !== BiddingType.FIXED) {
            showAlert(`ไม่สามารถเพิ่มสมาชิกได้เกินจำนวนมือที่กำหนด (${prev.targetSlots} มือ)`, 'แจ้งเตือน', 'error');
            return prev;
          }
          return { ...prev, selectedMemberIds: [...prev.selectedMemberIds, id] };
        });
    };

    const removeMemberSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData(prev => {
            const idx = prev.selectedMemberIds.lastIndexOf(id);
            if (idx > -1) {
                const newIds = [...prev.selectedMemberIds];
                newIds.splice(idx, 1);
                let newPidTonId = prev.pidTonMemberId;
                if (prev.pidTonMemberId === id && !newIds.includes(id)) {
                    newPidTonId = ''; 
                }
                return { ...prev, selectedMemberIds: newIds, pidTonMemberId: newPidTonId };
            }
            return prev;
        });
    };

    const getSelectionCount = (id: string) => {
        return formData.selectedMemberIds.filter(mid => mid === id).length;
    };

    // --- SCRIPT GENERATION ---
    const getPeriodLabel = (p: SharePeriod) => {
        switch(p) {
            case SharePeriod.DAILY: return 'รายวัน';
            case SharePeriod.WEEKLY: return 'รายสัปดาห์';
            case SharePeriod.MONTHLY: return 'รายเดือน';
            default: return p;
        }
    };

    const createScript = () => {
        let periodText = getPeriodLabel(formData.period);
        if (formData.period === SharePeriod.DAILY && formData.periodInterval > 1) {
            periodText = `ทุก ${formData.periodInterval} วัน`;
        }

        const principalVal = (Number(formData.totalPot) / (formData.targetSlots - 1)) || 0;
        const principalText = Math.floor(principalVal).toLocaleString();
        const circleName = formData.name || 'ยังไม่ระบุชื่อ';
        const typeText = formData.biddingType === BiddingType.AUCTION ? 'ประมูลดอก' : 'ขั้นบันได (Fixed)';
        const minBidText = formData.minBid ? Number(formData.minBid).toLocaleString() : '0';
        const bidStepText = formData.bidStep ? Number(formData.bidStep).toLocaleString() : '0';

        let tempSelectedIds = [...formData.selectedMemberIds];
        
        // Ensure Admin is first in display if not editing
        if (!editingCircleId && user && formData.biddingType === BiddingType.AUCTION) {
             const adminIndex = tempSelectedIds.indexOf(user.id);
             if (adminIndex > -1) {
                 tempSelectedIds.splice(adminIndex, 1);
                 tempSelectedIds.unshift(user.id);
             }
        }

        let membersListStr = '';
        let currentScriptSlot = 1;

        for (const mid of tempSelectedIds) {
            const memberObj = selectableMembers.find(m => m.id === mid);
            const memberName = memberObj?.name || '...';
            
            let suffix = '';
            let interestInfo = '';
            if (formData.biddingType === BiddingType.FIXED) {
                const amount = slotAmounts[currentScriptSlot] || 0;
                interestInfo = ` (ส่ง ฿${amount.toLocaleString()})`;
            }

            if (currentScriptSlot === 1) {
                suffix = ' (ท้าวแชร์/รับงวดแรก)';
                interestInfo = '';
            } else if (formData.isPidTon && currentScriptSlot === formData.targetSlots && mid === formData.pidTonMemberId) {
                 suffix = ` (ปิดต้น จ่ายเหมา ฿${calculatedTotalPidTon.toLocaleString()})`;
                 interestInfo = '';
            }

            membersListStr += `${currentScriptSlot}. ${memberName}${suffix}${interestInfo}\n`;
            currentScriptSlot++;
        }

        const gaps = formData.targetSlots - tempSelectedIds.length;
        for (let i = 0; i < gaps; i++) {
            membersListStr += `${currentScriptSlot}. ......${''}\n`;
            currentScriptSlot++;
        }
        
        let script = scriptTemplate;
        script = script.replace(/{name}/g, circleName);
        script = script.replace(/{principal}/g, principalText);
        script = script.replace(/{period}/g, periodText);
        script = script.replace(/{biddingType}/g, typeText);
        script = script.replace(/{minBid}/g, minBidText);
        script = script.replace(/{bidStep}/g, bidStepText);
        script = script.replace(/{members}/g, membersListStr.trim());

        return script;
    };

    const handleGenerateScript = () => {
        const script = createScript();
        onSuccess(script); 
    };

    // --- EXECUTE SUBMIT (CORE LOGIC) ---
    const executeSubmit = async () => {
        if (isSubmitting) return;
        
        const { name, totalPot, targetSlots, type, biddingType, minBid, bidStep, period, periodInterval, startDate, selectedMemberIds, adminFee, fineRate, isPidTon, pidTonMemberId, paymentWindowStart, paymentWindowEnd } = formData;
        
        const principalPerSlot = Math.floor(Number(totalPot) / (targetSlots - 1));

        const membersPayload: CircleMember[] = [];
        let finalSelectedIds = [...selectedMemberIds];

        // In AUCTION mode, verify admin is first.
        if (!editingCircleId && user && biddingType === BiddingType.AUCTION) {
            const adminIndex = finalSelectedIds.indexOf(user.id);
            if (adminIndex > -1) {
                finalSelectedIds.splice(adminIndex, 1);
                finalSelectedIds.unshift(user.id);
            }
        }

        // --- FIXED/LADDER PAYLOAD BUILDER ---
        if (biddingType === BiddingType.FIXED) {
            finalSelectedIds.forEach((mid, index) => {
                const currentSlot = index + 1;
                const existingCircle = editingCircleId ? circles.find(c => c.id === editingCircleId) : null;
                const existingMember = existingCircle ? existingCircle.members.find(m => m.slotNumber === currentSlot) : null;
                const payAmount = (currentSlot === 1) ? 0 : (slotAmounts[currentSlot] || principalPerSlot);

                let status: 'ALIVE' | 'DEAD' = 'ALIVE';
                if (currentSlot === 1) {
                    status = (existingCircle && existingCircle.status === CircleStatus.SETUP_COMPLETE && existingMember) 
                        ? existingMember.status 
                        : 'ALIVE'; 
                } else {
                    status = existingMember ? existingMember.status : 'ALIVE';
                }

                membersPayload.push({
                    memberId: mid,
                    slotNumber: currentSlot,
                    status: status,
                    wonRound: existingMember ? existingMember.wonRound : undefined,
                    bidAmount: 0, // Legacy support, set 0
                    fixedDueAmount: payAmount // Save specific fixed amount here
                });
            });
        } 
        // --- AUCTION PAYLOAD BUILDER ---
        else {
            let currentSlot = 1;
            let pidTonUserForLastSlot = '';
            if (isPidTon && pidTonMemberId) {
                 pidTonUserForLastSlot = pidTonMemberId;
                 const idx = finalSelectedIds.lastIndexOf(pidTonUserForLastSlot);
                 if (idx > -1) {
                     finalSelectedIds.splice(idx, 1);
                 }
            }

            // Slot 1 (Thao)
            const slot1User = finalSelectedIds.shift(); 
            if (slot1User) {
                const existingCircle = editingCircleId ? circles.find(c => c.id === editingCircleId) : null;
                const existingMember = existingCircle ? existingCircle.members.find(m => m.slotNumber === 1) : null;
                let thaoStatus: 'ALIVE' | 'DEAD' = 'ALIVE';
                if (existingCircle && existingCircle.status === CircleStatus.SETUP_COMPLETE && existingMember) {
                    thaoStatus = existingMember.status;
                }
                membersPayload.push({
                    memberId: slot1User,
                    slotNumber: 1,
                    status: thaoStatus,
                    wonRound: existingMember ? existingMember.wonRound : undefined,
                    bidAmount: 0, 
                });
                currentSlot++;
            }

            // Other Slots
            finalSelectedIds.forEach((mid) => {
                if (currentSlot > targetSlots) return; 
                const existingCircle = editingCircleId ? circles.find(c => c.id === editingCircleId) : null;
                const existingMember = existingCircle ? existingCircle.members.find(m => m.slotNumber === currentSlot) : null;
                membersPayload.push({
                    memberId: mid,
                    slotNumber: currentSlot,
                    status: existingMember ? existingMember.status : 'ALIVE',
                    wonRound: existingMember ? existingMember.wonRound : undefined,
                    bidAmount: existingMember ? existingMember.bidAmount : 0
                });
                currentSlot++;
            });

            if (isPidTon && pidTonUserForLastSlot) {
                 while (currentSlot < targetSlots) {
                     currentSlot++;
                 }
                 membersPayload.push({
                    memberId: pidTonUserForLastSlot,
                    slotNumber: targetSlots,
                    status: 'ALIVE',
                    bidAmount: 0,
                    pidTonAmount: calculatedTotalPidTon 
                });
            }
        }

        const start = new Date(startDate);
        let nextDate = new Date(start);
        const interval = periodInterval > 0 ? periodInterval : 1;

        if (period === SharePeriod.DAILY) nextDate.setDate(start.getDate() + (1 * interval));
        if (period === SharePeriod.WEEKLY) nextDate.setDate(start.getDate() + (7 * interval));
        if (period === SharePeriod.MONTHLY) nextDate.setMonth(start.getMonth() + (1 * interval));

        const roundsPayload = [
            { roundNumber: 1, date: startDate, status: 'OPEN', bidAmount: 0, totalPot: 0 }
        ];

        setIsSubmitting(true);
        try {
            if (editingCircleId) {
                await updateCircle(editingCircleId, {
                    name,
                    principal: principalPerSlot,
                    totalSlots: targetSlots,
                    type,
                    biddingType,
                    minBid: Number(minBid) || 0,
                    bidStep: Number(bidStep) || 0,
                    adminFee: Number(adminFee) || 0,
                    fineRate: Number(fineRate) || 0,
                    period,
                    periodInterval: interval,
                    paymentWindowStart, 
                    paymentWindowEnd,   
                    members: membersPayload
                });
                showAlert('บันทึกการแก้ไขเรียบร้อย', 'สำเร็จ', 'success');
                onClose();
            } else {
                const newCircle: ShareCircle = {
                    id: `c-${Date.now()}`,
                    name,
                    principal: principalPerSlot,
                    totalSlots: targetSlots,
                    type,
                    biddingType,
                    status: CircleStatus.INITIALIZING, 
                    minBid: Number(minBid) || 0,
                    bidStep: Number(bidStep) || 0,
                    adminFee: Number(adminFee) || 0,
                    fineRate: Number(fineRate) || 0,
                    period,
                    periodInterval: interval,
                    startDate,
                    nextDueDate: nextDate.toISOString().split('T')[0], 
                    paymentWindowStart, 
                    paymentWindowEnd,   
                    members: membersPayload,
                    createdBy: user?.id,
                    rounds: roundsPayload as any
                };

                await addCircle(newCircle);
                onSuccess(createScript()); 
                onClose();
            }
        } catch (error) {
            showAlert(formatErrorMessage(error), 'เกิดข้อผิดพลาด', 'error');
        } finally {
            setIsSubmitting(false);
            setConfirmModal(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, totalPot, targetSlots, biddingType, minBid, bidStep, startDate, selectedMemberIds, isPidTon, pidTonMemberId } = formData;
        
        if (!name) return showAlert('กรุณาระบุชื่อวงแชร์', 'ข้อมูลไม่ครบ', 'error');
        if (!totalPot || Number(totalPot) <= 0) return showAlert('กรุณาระบุยอดรวมทั้งวง', 'ข้อมูลไม่ครบ', 'error');
        if (!targetSlots || Number(targetSlots) <= 1) return showAlert('กรุณาระบุจำนวนมือ (ต้องมากกว่า 1)', 'ข้อมูลไม่ครบ', 'error');
        if (!startDate) return showAlert('กรุณาระบุวันที่เริ่ม', 'ข้อมูลไม่ครบ', 'error');

        if (biddingType === BiddingType.FIXED) {
             if (selectedMemberIds.length < 2) {
                 return showAlert('กรุณาเพิ่มสมาชิกในตารางขั้นบันไดอย่างน้อย 2 คน', 'ข้อมูลไม่ครบ', 'error');
             }
        }

        if (biddingType === BiddingType.AUCTION) {
            if (minBid === '' || Number(minBid) < 0) {
                return showAlert('กรุณาระบุ "บิทขั้นต่ำ" (ใส่ 0 ได้)', 'ข้อมูลไม่ครบ', 'error');
            }
            if (bidStep === '' || Number(bidStep) <= 0) {
                return showAlert('กรุณาระบุ "บิทเพิ่มทีละ" (ต้องมากกว่า 0)', 'ข้อมูลไม่ครบ', 'error');
            }
        }

        if (isPidTon) {
            if (!pidTonMemberId) return showAlert('กรุณาเลือกสมาชิกที่จะเป็น "มือปิดต้น"', 'ข้อมูลไม่ครบ', 'error');
        }

        setConfirmModal({
            isOpen: true,
            title: editingCircleId ? 'ยืนยันการแก้ไขข้อมูล' : 'ยืนยันการสร้างวงแชร์',
            message: editingCircleId 
                ? 'คุณต้องการบันทึกการเปลี่ยนแปลงใช่หรือไม่?' 
                : `คุณกำลังจะสร้างวง "${name}"\nจำนวน ${targetSlots} มือ ยอดรวม ${Number(totalPot).toLocaleString()} บาท\n\nยืนยันหรือไม่?`,
            onConfirm: executeSubmit
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white text-black rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-black">{editingCircleId ? 'แก้ไขข้อมูลวงแชร์' : 'สร้างวงแชร์ใหม่'}</h3>
                  <button 
                    type="button"
                    onClick={() => setShowSmartImport(true)}
                    className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors animate-pulse"
                  >
                      <Sparkles size={14} /> Import from Text
                  </button>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!editingCircleId && (
                  <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 items-start">
                      <div className="p-2 bg-indigo-100 rounded-full text-indigo-600 mt-1">
                          <Crown size={20} />
                      </div>
                      <div>
                          <h4 className="font-bold text-indigo-900 text-sm">ระบบแชร์ท้าว (Thao First)</h4>
                          <p className="text-xs text-indigo-700 mt-1">
                              มือที่ 1 จะถูกล็อคให้ "ท้าวแชร์" (คุณ) โดยอัตโนมัติ <br/>
                              สถานะมือที่ 1 จะเป็น <strong>"รอเริ่มเดินวง"</strong> และจะเปลี่ยนเป็น <strong>"เปียแล้ว (ดอก 0)"</strong> เมื่อกดเริ่มเดินวง
                          </p>
                      </div>
                  </div>
              )}

              <form id="circle-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Basic Info & Settings (Refactored Component) */}
                <CircleFormUI 
                    formData={formData} 
                    setFormData={setFormData}
                    calculatedPrincipalPerSlot={calculatedPrincipalPerSlot}
                />

                {/* --- CONDITIONAL UI: LADDER vs AUCTION --- */}
                
                {formData.biddingType === BiddingType.FIXED ? (
                    // *** LADDER UI ***
                    <LadderSlotBuilder 
                        allMembers={members}
                        currentUser={user}
                        selectedMemberIds={formData.selectedMemberIds}
                        onSelectionChange={(newIds) => setFormData({ ...formData, selectedMemberIds: newIds })}
                        slotInterests={slotAmounts} // Pass amounts instead of interests
                        onInterestChange={(slot, val) => setSlotAmounts(prev => ({ ...prev, [slot]: val }))}
                    />
                ) : (
                    // *** AUCTION UI ***
                    <>
                        {/* Auction Specific Settings */}
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">บิทขั้นต่ำ <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black"
                                    placeholder="0"
                                    value={formData.minBid}
                                    onChange={(e) => setFormData({...formData, minBid: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">บิทเพิ่มทีละ <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black"
                                    placeholder="10"
                                    value={formData.bidStep}
                                    onChange={(e) => setFormData({...formData, bidStep: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                        {/* Number of Slots Input (Only in Auction) */}
                        <div>
                            <label className="block text-sm font-bold text-black mb-1">จำนวนมือ (คน) <span className="text-red-500">*</span></label>
                            <input
                            type="number"
                            min="2"
                            required
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-black placeholder:text-slate-400"
                            value={formData.targetSlots}
                            onChange={(e) => {
                                const newSlots = Number(e.target.value);
                                if (newSlots < formData.selectedMemberIds.length) {
                                    showAlert("จำนวนมือต้องไม่น้อยกว่าสมาชิกที่เลือกไว้", "แจ้งเตือน", "error");
                                    return;
                                }
                                setFormData({...formData, targetSlots: newSlots});
                            }}
                            />
                        </div>

                        {/* Member Selector (Refactored Component) */}
                        <MemberSelector 
                            formData={formData}
                            setFormData={setFormData}
                            filteredMembers={filteredMembers}
                            memberSearch={memberSearch}
                            setMemberSearch={setMemberSearch}
                            addMemberSelection={addMemberSelection}
                            removeMemberSelection={removeMemberSelection}
                            getSelectionCount={getSelectionCount}
                            getSelectedUniqueMembers={getSelectedUniqueMembers}
                            calculatedTotalPidTon={calculatedTotalPidTon}
                            user={user}
                        />
                    </>
                )}

              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-2xl">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-black font-bold hover:bg-white transition-colors disabled:opacity-50">
                ยกเลิก
              </button>
              <button type="button" onClick={handleGenerateScript} disabled={isSubmitting} className="px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" title="สร้างข้อความแจ้งสมาชิก">
                 <MessageSquarePlus size={20} />
              </button>
              <button 
                type="submit" 
                form="circle-form" 
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>กำลังบันทึก...</span>
                    </>
                ) : (
                    <span>{editingCircleId ? 'บันทึกการแก้ไข' : 'สร้างวงแชร์'}</span>
                )}
              </button>
            </div>
          </div>

          {/* Confirmation Modal */}
          {confirmModal && (
              <AlertModal 
                  isOpen={confirmModal.isOpen}
                  title={confirmModal.title}
                  message={confirmModal.message}
                  onClose={() => setConfirmModal(null)}
                  onConfirm={confirmModal.onConfirm}
                  type="confirm"
                  confirmText="ยืนยัน"
                  cancelText="ยกเลิก"
              />
          )}

          {/* Smart Import Modal */}
          <SmartImportModal 
              isOpen={showSmartImport} 
              onClose={() => setShowSmartImport(false)}
              onApply={handleSmartImportApply}
          />
        </div>
    );
};
