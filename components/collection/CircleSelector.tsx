
import React, { useState, useRef, useEffect } from 'react';
import { CircleDollarSign, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';
import { ShareCircle } from '../../types';

interface CircleSelectorProps {
    trackableCircles: ShareCircle[];
    selectedCircleId: string;
    onSelectCircle: (id: string) => void;
}

export const CircleSelector: React.FC<CircleSelectorProps> = ({ trackableCircles, selectedCircleId, onSelectCircle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get the currently selected circle object
    const selectedCircle = trackableCircles.find(c => c.id === selectedCircleId);

    // Sync search term when selection changes externally
    useEffect(() => {
        if (selectedCircle) {
            setSearchTerm(selectedCircle.name);
        }
    }, [selectedCircleId, trackableCircles, selectedCircle]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Revert search term to selected circle name if closed without selection
                if (selectedCircle) setSearchTerm(selectedCircle.name);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedCircleId, trackableCircles, selectedCircle]);

    // --- LOGIC FIX: SMART FILTERING ---
    const filteredCircles = trackableCircles.filter(c => {
        // 1. If input is empty, show all
        if (!searchTerm.trim()) return true;
        
        // 2. If the text in input matches the currently selected circle exactly, 
        //    it means the user hasn't started typing a new search yet. Show ALL options.
        if (selectedCircle && searchTerm === selectedCircle.name) return true;

        // 3. Otherwise, filter by search term
        return c.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(true);
        // Optional: Auto-select text for easier replacement
        // inputRef.current?.select(); 
    };

    return (
        <div className="relative w-full z-30" ref={dropdownRef}>
            <div 
                className={`flex items-center justify-between w-full px-4 py-3 bg-white border-2 rounded-xl cursor-pointer transition-all shadow-sm ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-blue-100 hover:border-blue-300'}`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        // When opening, ensure text matches selection so "Show All" logic works
                        if (selectedCircle) setSearchTerm(selectedCircle.name);
                        setTimeout(() => inputRef.current?.focus(), 0);
                    }
                }}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className={`p-2 rounded-lg shrink-0 transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                        <CircleDollarSign size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                            เลือกวงแชร์ ({trackableCircles.length})
                        </span>
                        <input 
                            ref={inputRef}
                            type="text" 
                            className="font-bold text-slate-800 outline-none bg-transparent cursor-pointer w-full placeholder:text-slate-300 truncate text-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsOpen(true);
                            }}
                            onClick={handleInputClick}
                            placeholder="พิมพ์ชื่อเพื่อค้นหา..."
                            autoComplete="off"
                        />
                    </div>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} className="text-slate-400" />}
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 z-40 custom-scrollbar">
                    {filteredCircles.length > 0 ? (
                        filteredCircles.map(c => (
                            <div 
                                key={c.id}
                                className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 ${selectedCircleId === c.id ? 'bg-blue-50/50' : ''}`}
                                onClick={() => {
                                    onSelectCircle(c.id);
                                    setSearchTerm(c.name);
                                    setIsOpen(false);
                                }}
                            >
                                <div>
                                    <span className={`block font-bold text-sm ${selectedCircleId === c.id ? 'text-blue-700' : 'text-slate-700'}`}>{c.name}</span>
                                    <span className="text-[10px] text-slate-400">{c.totalSlots} มือ • {c.type === 'DOK_HAK' ? 'ดอกหัก' : 'ดอกตาม'}</span>
                                </div>
                                {selectedCircleId === c.id && <Check size={18} className="text-blue-600" />}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                            <Search size={24} className="opacity-20" />
                            <p>ไม่พบวงแชร์ที่ค้นหา</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
