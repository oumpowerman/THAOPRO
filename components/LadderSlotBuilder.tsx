
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, User, Crown, GripVertical, ArrowUp, ArrowDown, Maximize2, Minimize2, X, Check } from 'lucide-react';
import { Member } from '../types';

interface LadderSlotBuilderProps {
    allMembers: Member[];
    currentUser: any;
    selectedMemberIds: string[];
    onSelectionChange: (ids: string[]) => void;
    slotInterests: { [key: number]: number };
    onInterestChange: (slot: number, value: number) => void;
}

export const LadderSlotBuilder: React.FC<LadderSlotBuilderProps> = ({
    allMembers,
    currentUser,
    selectedMemberIds,
    onSelectionChange,
    slotInterests,
    onInterestChange
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false); // State for Fullscreen mode

    // Ensure Slot 1 is always the current user (Thao) if list is empty
    useEffect(() => {
        if (selectedMemberIds.length === 0 && currentUser) {
            onSelectionChange([currentUser.id]);
        }
    }, [currentUser, selectedMemberIds.length]);

    // Helpers
    const getMemberDetails = (id: string) => {
        const member = allMembers.find(m => m.id === id);
        if (member) return member;
        if (currentUser && currentUser.id === id) return { ...currentUser, name: `${currentUser.name} (คุณ)`, role: 'ADMIN' };
        return null;
    };

    const handleAddMember = (id: string) => {
        onSelectionChange([...selectedMemberIds, id]);
    };

    const handleRemoveMember = (index: number) => {
        const newIds = [...selectedMemberIds];
        newIds.splice(index, 1);
        onSelectionChange(newIds);
    };

    // --- MOVE LOGIC (CLICK) ---
    const handleMoveMember = (index: number, direction: 'UP' | 'DOWN') => {
        const newIds = [...selectedMemberIds];
        const targetIndex = direction === 'UP' ? index - 1 : index + 1;

        if (index === 0) return; // Cannot move Thao
        if (targetIndex < 1) return; // Cannot move into Thao position
        if (targetIndex >= newIds.length) return; // Bounds check

        // Swap
        [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
        onSelectionChange(newIds);
    };

    // --- DRAG AND DROP LOGIC ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        
        if (draggedIndex === null) return;
        if (draggedIndex === targetIndex) return;

        // Constraint: Cannot move Slot 1 (Thao) AND Cannot drop onto Slot 1
        if (draggedIndex === 0 || targetIndex === 0) return;

        const newIds = [...selectedMemberIds];
        const [movedItem] = newIds.splice(draggedIndex, 1);
        newIds.splice(targetIndex, 0, movedItem);

        onSelectionChange(newIds);
        setDraggedIndex(null);
    };

    // Search Logic
    const availableMembers = allMembers.filter(m => 
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)) &&
        m.id !== currentUser?.id 
    );

    // --- RENDER CONTENT SECTIONS (Reusable) ---

    const renderSlotList = (maxHeightClass: string) => (
        <div className={`space-y-2 overflow-y-auto custom-scrollbar pr-1 ${maxHeightClass}`}>
            {selectedMemberIds.map((id, index) => {
                const member = getMemberDetails(id);
                const slotNum = index + 1;
                const isThao = slotNum === 1;
                const isLast = index === selectedMemberIds.length - 1;
                const isDragging = draggedIndex === index;

                return (
                    <div 
                        key={`${id}-${index}`}
                        draggable={!isThao}
                        onDragStart={(e) => !isThao && handleDragStart(e, index)}
                        onDragOver={(e) => !isThao && handleDragOver(e, index)}
                        onDrop={(e) => !isThao && handleDrop(e, index)}
                        className={`flex items-center gap-3 bg-white p-3 rounded-xl border transition-all duration-200 ${
                            isDragging 
                            ? 'opacity-50 border-blue-400 bg-blue-50 scale-95' 
                            : 'border-slate-200 shadow-sm hover:border-blue-300'
                        } ${!isThao ? 'cursor-move' : ''}`}
                    >
                        {/* Drag Handle or Slot Badge */}
                        <div className="flex items-center justify-center w-8 h-8 shrink-0">
                            {isThao ? (
                                <div className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm bg-blue-600 text-white shadow-md shadow-blue-200">
                                    1
                                </div>
                            ) : (
                                <div className="text-slate-300 hover:text-blue-500 transition-colors cursor-grab active:cursor-grabbing p-1">
                                    <GripVertical size={20} />
                                </div>
                            )}
                        </div>

                        {/* Slot Number (Small badge for non-thao) */}
                        {!isThao && (
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-bold shrink-0">
                                {slotNum}
                            </div>
                        )}

                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 select-none">
                            <div className="relative shrink-0">
                                <img src={member?.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover border border-slate-100" alt="" />
                                {isThao && (
                                    <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border border-white">
                                        <Crown size={10} />
                                    </div>
                                )}
                            </div>
                            <div className="truncate">
                                <p className={`text-sm font-bold truncate ${isThao ? 'text-blue-700' : 'text-slate-800'}`}>
                                    {member?.name || 'Unknown'}
                                </p>
                                <p className="text-[10px] text-slate-400">{member?.phone}</p>
                            </div>
                        </div>

                        {/* Interest Input */}
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                                {isThao ? '(ยกเว้น)' : 'ส่งงวดละ (บาท)'}
                            </span>
                            {isThao ? (
                                <div className="h-9 px-3 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-sm font-bold min-w-[80px]">
                                    -
                                </div>
                            ) : (
                                <div className="relative">
                                    <input 
                                        type="number"
                                        className="w-24 pl-3 pr-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-right focus:ring-2 focus:ring-blue-500 focus:outline-none text-blue-600 bg-white"
                                        placeholder="0"
                                        value={slotInterests[slotNum] || ''}
                                        onChange={(e) => onInterestChange(slotNum, Number(e.target.value))}
                                        onMouseDown={(e) => e.stopPropagation()} 
                                    />
                                </div>
                            )}
                        </div>

                        {/* Action Buttons (Move & Remove) */}
                        {!isThao && (
                            <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                                <div className="flex flex-col gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => handleMoveMember(index, 'UP')}
                                        disabled={index === 1} // Can't move into Thao spot
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors bg-white border border-slate-100 shadow-sm"
                                        title="ย้ายขึ้น"
                                        onMouseDown={(e) => e.stopPropagation()} 
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleMoveMember(index, 'DOWN')}
                                        disabled={isLast}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent transition-colors bg-white border border-slate-100 shadow-sm"
                                        title="ย้ายลง"
                                        onMouseDown={(e) => e.stopPropagation()} 
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveMember(index)}
                                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors ml-1"
                                    title="ลบออก"
                                    onMouseDown={(e) => e.stopPropagation()} 
                                    >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                        {isThao && <div className="w-[88px]"></div>}
                    </div>
                );
            })}
        </div>
    );

    const renderSearchSection = (maxHeightClass: string) => (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
            <label className="text-sm font-bold text-slate-700 mb-2 block">
                เลือกสมาชิกเข้าวง (กดเพื่อเพิ่ม)
            </label>
            
            <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="ค้นหาชื่อ หรือ เบอร์โทร..." 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-slate-50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 content-start ${maxHeightClass}`}>
                {availableMembers.length > 0 ? (
                    availableMembers.map(member => (
                        <div 
                            key={member.id}
                            onClick={() => handleAddMember(member.id)}
                            className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all group h-fit"
                        >
                            <img src={member.avatarUrl} className="w-8 h-8 rounded-full bg-slate-200 object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 truncate">{member.name}</p>
                                <p className="text-xs text-slate-400">{member.phone}</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <Plus size={14} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-4 text-slate-400 text-sm italic">
                        {searchTerm ? 'ไม่พบสมาชิกที่ค้นหา' : 'แสดงรายชื่อเมื่อค้นหา...'}
                    </div>
                )}
            </div>
        </div>
    );

    // --- MAIN RENDER ---

    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Full Screen Header */}
                <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ListOrderedIcon /> จัดลำดับมือและกำหนดยอดส่ง (Full Screen)
                        </h3>
                        <p className="text-slate-500 text-sm">รวม {selectedMemberIds.length} มือ</p>
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
                    {/* Left: Slots (Scrollable) */}
                    <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                         <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                             <h4 className="font-bold text-slate-700">รายการมือที่เลือก ({selectedMemberIds.length})</h4>
                             <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <GripVertical size={12} /> ลากเพื่อสลับตำแหน่ง
                             </p>
                         </div>
                         <div className="flex-1 overflow-hidden p-4 bg-slate-50/50">
                             {renderSlotList('h-full')}
                         </div>
                    </div>

                    {/* Right: Search (Scrollable) */}
                    <div className="lg:col-span-1 h-full">
                         {renderSearchSection('h-full')}
                    </div>
                </div>
            </div>
        );
    }

    // Default Compact Render
    return (
        <div className="space-y-6">
            {/* 1. ORDERED SLOT LIST (Compact) */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 relative group">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-bold text-blue-900 flex items-center gap-2">
                        <ListOrderedIcon /> จัดลำดับมือและกำหนดยอดส่ง
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold">
                            รวม {selectedMemberIds.length} มือ
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

                {renderSlotList('max-h-[350px]')}
                
                <div className="mt-2 text-right">
                    <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                        <GripVertical size={12} /> ลากหรือกดลูกศรเพื่อสลับตำแหน่ง (ยกเว้นท้าว)
                    </p>
                </div>
            </div>

            {/* 2. AVAILABLE MEMBERS SEARCH (Compact) */}
            {renderSearchSection('max-h-48')}
        </div>
    );
};

const ListOrderedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
);
