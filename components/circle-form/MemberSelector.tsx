
import React, { useState } from 'react';
import { Search, Lock, UserCheck, DollarSign, Minus, Maximize2, Check, User as UserIcon, Crown, Trash2, Plus, Users } from 'lucide-react';
import { Member } from '../../types';

interface MemberSelectorProps {
    formData: any;
    setFormData: (data: any) => void;
    filteredMembers: Member[];
    memberSearch: string;
    setMemberSearch: (term: string) => void;
    addMemberSelection: (id: string) => void;
    removeMemberSelection: (id: string, e: React.MouseEvent) => void;
    getSelectionCount: (id: string) => number;
    getSelectedUniqueMembers: () => Member[];
    calculatedTotalPidTon: number;
    user: any;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
    formData,
    setFormData,
    filteredMembers,
    memberSearch,
    setMemberSearch,
    addMemberSelection,
    removeMemberSelection,
    getSelectionCount,
    getSelectedUniqueMembers,
    calculatedTotalPidTon,
    user
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleRemoveAtIndex = (index: number) => {
        const newIds = [...formData.selectedMemberIds];
        const removedId = newIds[index];
        newIds.splice(index, 1);
        
        let newPidTonId = formData.pidTonMemberId;
        // If removed member was Pid Ton and no longer exists in list, clear it
        if (removedId === formData.pidTonMemberId && !newIds.includes(removedId)) {
             newPidTonId = '';
        }

        setFormData({ ...formData, selectedMemberIds: newIds, pidTonMemberId: newPidTonId });
    };

    // Safe Map Creation with Explicit Typing
    const uniqueMembers = getSelectedUniqueMembers() || [];
    const uniqueMap = new Map<string, Member>(uniqueMembers.map(m => [m.id, m]));

    const renderSelectedList = (maxHeightClass: string) => (
        <div className={`space-y-2 overflow-y-auto custom-scrollbar pr-1 ${maxHeightClass}`}>
            {formData.selectedMemberIds.map((id: string, index: number) => {
                // 1. Try to get member from the map
                let memberData = uniqueMap.get(id);
                
                // 2. Fallback: If not in map, check if it is the current user (Thao/Admin)
                if (!memberData && user && user.id === id) {
                    memberData = {
                        id: user.id,
                        name: user.name,
                        phone: user.username || '',
                        avatarUrl: user.avatarUrl || '',
                        status: 'ACTIVE',
                        riskScore: 'GOOD'
                    } as Member;
                }

                // 3. Prepare Display Variables (Safe Access)
                const displayAvatar = memberData?.avatarUrl || `https://ui-avatars.com/api/?name=${memberData?.name || 'Unk'}`;
                const displayName = memberData?.name || 'Unknown';
                const displayPhone = memberData?.phone || '-';

                const slotNum = index + 1;
                const isThao = user && id === user.id && slotNum === 1;

                return (
                    <div key={`${id}-${index}`} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 ${isThao ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {slotNum}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <img src={displayAvatar} className="w-10 h-10 rounded-full bg-slate-200 object-cover border border-slate-100" alt="" />
                            <div className="truncate">
                                <p className={`text-sm font-bold truncate ${isThao ? 'text-blue-700' : 'text-slate-800'}`}>
                                    {displayName} {isThao && '(ท้าว)'}
                                </p>
                                <p className="text-[10px] text-slate-400">{displayPhone}</p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleRemoveAtIndex(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบออก"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                );
            })}
            {formData.selectedMemberIds.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                    ยังไม่มีสมาชิกที่เลือก
                </div>
            )}
        </div>
    );

    const renderAvailableList = (maxHeightClass: string) => (
        <div className={`grid grid-cols-1 gap-2 overflow-y-auto p-1 pt-2 content-start ${maxHeightClass}`}>
            {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                    const count = getSelectionCount(member.id);
                    const isSelected = count > 0;
                    const isAdmin = member.id === user?.id;
                    const isPidTonUser = formData.isPidTon && member.id === formData.pidTonMemberId;

                    return (
                        <div 
                            key={member.id}
                            onClick={() => addMemberSelection(member.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${
                                isPidTonUser 
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                : isSelected
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                    : 'border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs ${
                                    isPidTonUser
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 bg-white text-slate-400'
                                }`}>
                                    {isPidTonUser ? <Lock size={12}/> : (count > 0 ? `x${count}` : '+')}
                                </div>
                                <img src={member.avatarUrl} className="w-8 h-8 rounded-full shrink-0" alt="" />
                                <div className="min-w-0">
                                    <span className={`text-sm font-bold truncate block ${isAdmin ? 'text-blue-700' : 'text-black'}`}>
                                        {member.name}
                                    </span>
                                    {isPidTonUser ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-indigo-600 font-bold">
                                                มือปิดต้น (Slot {formData.targetSlots})
                                            </span>
                                            <span className="text-[10px] text-indigo-500">
                                                เหมาจ่าย: ฿{calculatedTotalPidTon.toLocaleString()}
                                            </span>
                                        </div>
                                    ) : isSelected && (
                                        <span className="text-[10px] text-blue-600 font-bold block">
                                            เล่น {count} มือ
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isAdmin && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded whitespace-nowrap">ท้าวแชร์</span>}
                                {isSelected && (
                                    <button 
                                        onClick={(e) => removeMemberSelection(member.id, e)}
                                        className="p-1 bg-white border border-slate-300 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-colors"
                                        title="ลดจำนวนมือ"
                                    >
                                        <Minus size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-4 text-slate-400 text-sm">ไม่พบสมาชิกที่ค้นหา</div>
            )}
        </div>
    );

    // --- FULL SCREEN RENDER ---
    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Full Screen Header */}
                <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users /> เลือกสมาชิกเข้าวง (Full Screen)
                        </h3>
                        <p className="text-slate-500 text-sm">
                            เลือกแล้ว {formData.selectedMemberIds.length} / {formData.targetSlots} มือ
                        </p>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setIsExpanded(false)} 
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                         >
                             <Check size={18} /> ยืนยัน / ย่อกลับ
                         </button>
                    </div>
                </div>

                {/* Full Screen Content Grid */}
                <div className="flex-1 overflow-hidden p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Selected Slots */}
                    <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                         <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                             <h4 className="font-bold text-slate-700">รายการที่เลือก ({formData.selectedMemberIds.length})</h4>
                             <p className="text-[10px] text-slate-400">
                                เรียงตามลำดับการเพิ่ม
                             </p>
                         </div>
                         <div className="flex-1 overflow-hidden p-4 bg-slate-50/50">
                             {renderSelectedList('h-full')}
                         </div>
                    </div>

                    {/* Right: Search & Add */}
                    <div className="lg:col-span-1 h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                         <div className="p-4 bg-white border-b border-slate-100">
                             {/* PID TON OPTION REPEATED HERE FOR ACCESSIBILITY */}
                             <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        id="pidTonCheckFull"
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                        checked={formData.isPidTon}
                                        onChange={(e) => setFormData({ ...formData, isPidTon: e.target.checked, pidTonMemberId: e.target.checked ? formData.pidTonMemberId : '', pidTonFee: '' })}
                                    />
                                    <label htmlFor="pidTonCheckFull" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2">
                                        <Lock size={16} className={formData.isPidTon ? 'text-blue-600' : 'text-slate-400'} />
                                        ปิดต้น
                                    </label>
                                </div>
                                {formData.isPidTon && (
                                    <div className="mt-3 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <UserCheck size={14} className="absolute left-2 top-2.5 text-slate-400" />
                                                <select 
                                                    className="w-full pl-7 pr-2 py-2 border border-blue-300 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-bold"
                                                    value={formData.pidTonMemberId}
                                                    onChange={(e) => setFormData({ ...formData, pidTonMemberId: e.target.value })}
                                                >
                                                    <option value="">-- เลือก --</option>
                                                    {getSelectedUniqueMembers().map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="relative">
                                                <DollarSign size={14} className="absolute left-2 top-2.5 text-slate-400" />
                                                <input
                                                    type="number"
                                                    className="w-full pl-7 pr-2 py-2 border border-blue-300 rounded-lg text-xs focus:outline-none bg-white text-slate-800 font-bold"
                                                    placeholder="Fee"
                                                    value={formData.pidTonFee}
                                                    onChange={(e) => setFormData({ ...formData, pidTonFee: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                             </div>

                             <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อ..."
                                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    autoFocus
                                />
                             </div>
                         </div>
                         <div className="flex-1 overflow-hidden">
                             {renderAvailableList('h-full')}
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- DEFAULT COMPACT RENDER ---
    return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-black">
                  เลือกสมาชิกเข้าวง ({formData.selectedMemberIds.length} / {formData.targetSlots})
                </label>
                <div className="flex items-center gap-2">
                    <span className={`text-xs ${formData.selectedMemberIds.length === formData.targetSlots ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
                    {formData.selectedMemberIds.length === formData.targetSlots ? 'ครบแล้ว' : 'ไม่จำเป็นต้องครบ'}
                    </span>
                    <button 
                        type="button"
                        onClick={() => setIsExpanded(true)}
                        className="p-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1 text-[10px] font-bold"
                        title="ขยายเต็มจอ"
                    >
                        <Maximize2 size={14} /> ขยาย
                    </button>
                </div>
            </div>
            
            {/* PID TON OPTION */}
            <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="pidTonCheck"
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        checked={formData.isPidTon}
                        onChange={(e) => setFormData({ ...formData, isPidTon: e.target.checked, pidTonMemberId: e.target.checked ? formData.pidTonMemberId : '', pidTonFee: '' })}
                    />
                    <label htmlFor="pidTonCheck" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-2">
                        <Lock size={16} className={formData.isPidTon ? 'text-blue-600' : 'text-slate-400'} />
                        ปิดต้น (ล็อคมือสุดท้าย + จ่ายเหมา)
                    </label>
                </div>
                {formData.isPidTon && (
                    <div className="mt-3 animate-in slide-in-from-top-2 space-y-3">
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                            สมาชิกปิดต้นจะจ่าย "เงินต้นรวม + ค่าดูแล" ทั้งหมดในงวดแรก และไม่ต้องจ่ายอีกในงวดถัดไป
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <UserCheck size={16} className="absolute left-3 top-3 text-slate-400" />
                                <select 
                                    className="w-full pl-9 pr-4 py-2.5 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white text-slate-800"
                                    value={formData.pidTonMemberId}
                                    onChange={(e) => setFormData({ ...formData, pidTonMemberId: e.target.value })}
                                >
                                    <option value="">-- เลือกคนปิดต้น --</option>
                                    {getSelectedUniqueMembers().map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="number"
                                    className="w-full pl-9 pr-4 py-2.5 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold bg-white text-slate-800"
                                    placeholder="ค่าดูแลบริหาร (Fee)"
                                    value={formData.pidTonFee}
                                    onChange={(e) => setFormData({ ...formData, pidTonFee: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="text-right text-xs font-bold text-slate-700">
                            รวมจ่ายงวดแรก: ฿{calculatedTotalPidTon.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
            
            {/* MEMBER SEARCH */}
            <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="ค้นหาสมาชิก (ชื่อ หรือ เบอร์โทร)..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                />
            </div>

            {renderAvailableList('max-h-60 border-t border-slate-100')}
        </div>
    );
};
