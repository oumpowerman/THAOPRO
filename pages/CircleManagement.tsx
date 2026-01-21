
import React, { useState } from 'react';
import { Plus, Users, Calendar, Trash2, Edit3, Clock, CheckCircle2, Gavel, ListOrdered, Copy, PlayCircle, Flag, Trophy, LayoutGrid, List, Archive, Search, ChevronLeft, ChevronRight, Eye, RefreshCw, Sparkles, MoreHorizontal } from 'lucide-react';
import { ShareType, ShareCircle, SharePeriod, BiddingType, CircleStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import { CircleFormModal } from '../components/CircleFormModal';
import { CircleDetailModal } from '../components/CircleDetailModal';

const CircleManagement = () => {
  // Use new 'confirm' and 'alert' from context instead of showAlert
  const { circles, deleteCircle, updateCircle, startCircle, confirm, alert } = useAppContext();
  
  // UI View State
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID'); // New View Mode State
  
  // Archive Search & Pagination State
  const [archiveSearch, setArchiveSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // Format: YYYY-MM
  const [filterType, setFilterType] = useState<'ALL' | 'AUCTION' | 'FIXED'>('ALL'); // Filter by Bidding Type
  
  const [archivePage, setArchivePage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCircleId, setEditingCircleId] = useState<string | null>(null);
  const [viewingCircle, setViewingCircle] = useState<ShareCircle | null>(null);
  
  // Success Script Modal State
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [showStartSuccessModal, setShowStartSuccessModal] = useState(false);

  // --- DATA FILTERING ---
  const activeCirclesList = circles.filter(c => c.status !== CircleStatus.COMPLETED);
  const archivedCirclesList = circles.filter(c => c.status === CircleStatus.COMPLETED);

  // Filtered Archive List (Enhanced Logic)
  const displayedArchivedCircles = archivedCirclesList.filter(c => {
      const matchName = c.name.toLowerCase().includes(archiveSearch.toLowerCase());
      
      // Filter by Month (StartDate starts with YYYY-MM)
      const matchDate = filterMonth ? c.startDate.startsWith(filterMonth) : true;
      
      // Filter by Type
      let matchType = true;
      if (filterType === 'AUCTION') matchType = c.biddingType === BiddingType.AUCTION;
      if (filterType === 'FIXED') matchType = c.biddingType === BiddingType.FIXED;

      return matchName && matchDate && matchType;
  });

  // Pagination Logic
  const totalArchivePages = Math.ceil(displayedArchivedCircles.length / ITEMS_PER_PAGE);
  const paginatedArchivedCircles = displayedArchivedCircles.slice(
      (archivePage - 1) * ITEMS_PER_PAGE,
      archivePage * ITEMS_PER_PAGE
  );

  // --- HANDLERS ---

  const handleOpenCreate = () => {
      setEditingCircleId(null);
      setIsFormOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, circle: ShareCircle) => {
      e.stopPropagation(); 
      setEditingCircleId(circle.id);
      setIsFormOpen(true);
  };

  // REFACTORED: Using Global Confirm Dialog
  const handleDeleteClick = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isConfirmed = await confirm(
        `คุณต้องการลบวงแชร์ "${name}" ใช่หรือไม่?\nข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบถาวร`,
        'ยืนยันการลบ',
        'warning',
        'ลบวงแชร์',
        'ยกเลิก'
    );

    if (isConfirmed) {
        await deleteCircle(id);
        if (viewingCircle?.id === id) setViewingCircle(null);
        await alert('ลบวงแชร์เรียบร้อยแล้ว', 'สำเร็จ', 'success');
    }
  };

  // REFACTORED: Using Global Confirm Dialog
  const handleStartCircle = async (id: string) => {
      const circle = circles.find(c => c.id === id);
      if (!circle) return;

      if (circle.members.length < circle.totalSlots) {
          await alert(`⚠️ ไม่สามารถเริ่มเดินวงได้!\nสมาชิกไม่ครบ ${circle.totalSlots} คน`, 'แจ้งเตือน', 'error');
          return;
      }

      const isConfirmed = await confirm(
          'สถานะจะเปลี่ยนเป็น "ตั้งวงสำเร็จ" และเริ่มนับงวดแรกทันที',
          'ยืนยันการเริ่มเดินวงแชร์?',
          'confirm',
          'เริ่มเดินวง'
      );

      if(isConfirmed) {
          await startCircle(id);
          setViewingCircle(prev => prev ? { ...prev, status: CircleStatus.SETUP_COMPLETE } : null);
          setShowStartSuccessModal(true);
      }
  };

  // REFACTORED: Using Global Confirm Dialog
  const handleCloseCircle = async (e: React.MouseEvent, circle: ShareCircle) => {
      e.stopPropagation();
      
      const isConfirmed = await confirm(
          `วง "${circle.name}" จะถูกย้ายไปที่ประวัติ (History) และถือว่าสิ้นสุดการเล่นแล้ว`,
          'ยืนยันการ "ปิดวงแชร์" (Archive)?',
          'warning',
          'ปิดวงแชร์'
      );

      if (isConfirmed) {
          await updateCircle(circle.id, { status: CircleStatus.COMPLETED });
          await alert('ปิดวงแชร์เรียบร้อยแล้ว', 'สำเร็จ', 'success');
      }
  };

  const handleScriptSuccess = (script: string) => {
      setScriptContent(script);
      setShowScriptModal(true);
  };

  // REFACTORED: Using Global Alert
  const copyToClipboard = async () => {
    navigator.clipboard.writeText(scriptContent);
    await alert('คัดลอกข้อความเรียบร้อย!', 'สำเร็จ', 'success');
  };

  const resetFilters = () => {
      setArchiveSearch('');
      setFilterMonth('');
      setFilterType('ALL');
      setArchivePage(1);
  };

  const getPeriodLabel = (p: SharePeriod) => {
    switch(p) {
        case SharePeriod.DAILY: return 'รายวัน';
        case SharePeriod.WEEKLY: return 'รายสัปดาห์';
        case SharePeriod.MONTHLY: return 'รายเดือน';
        default: return p;
    }
  };

  // Helper to calculate End Date
  const calculateEndDate = (startDate: string, period: SharePeriod, totalSlots: number) => {
      if (!startDate) return '-';
      const start = new Date(startDate);
      // Interval = totalSlots - 1 (Because Round 1 is on Start Date)
      const intervals = Math.max(0, totalSlots - 1);
      
      const endDate = new Date(start);
      if (period === SharePeriod.DAILY) endDate.setDate(start.getDate() + intervals);
      if (period === SharePeriod.WEEKLY) endDate.setDate(start.getDate() + (intervals * 7));
      if (period === SharePeriod.MONTHLY) endDate.setMonth(start.getMonth() + intervals);
      
      return endDate.toLocaleDateString('th-TH');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. COMMAND CENTER BANNER (Unified Header) */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl transition-all hover:shadow-slate-900/20 group">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-blue-500/30 transition-colors duration-500"></div>
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 gap-8">
              
              {/* Left: Text & Info */}
              <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                          <Users className="text-blue-300" size={24} />
                      </div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">จัดการวงแชร์</h2>
                  </div>
                  <p className="text-slate-300 text-sm mb-6 max-w-lg mx-auto md:mx-0 leading-relaxed">
                      ศูนย์กลางการควบคุมวงแชร์ทั้งหมดของคุณ ดูสถานะ สร้างวงใหม่ และจัดการสมาชิกได้อย่างมีประสิทธิภาพในที่เดียว
                  </p>
                  
                  {/* Quick Stats Pill */}
                  <div className="inline-flex items-center gap-4 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                          <span className="text-xs font-bold text-slate-200">Active: <span className="text-white text-sm">{activeCirclesList.length}</span></span>
                      </div>
                      <div className="w-px h-4 bg-white/10"></div>
                      <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-200">Finished: <span className="text-white text-sm">{archivedCirclesList.length}</span></span>
                      </div>
                  </div>
              </div>

              {/* Right: The Power Button */}
              <button 
                  onClick={handleOpenCreate}
                  className="group/btn relative flex items-center gap-4 bg-white text-slate-900 pl-6 pr-8 py-4 rounded-2xl shadow-lg shadow-white/5 hover:shadow-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95"
              >
                  <div className="relative">
                      <div className="absolute inset-0 bg-blue-600 blur opacity-20 rounded-full group-hover/btn:opacity-40 transition-opacity"></div>
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-full relative z-10 border border-blue-100 group-hover/btn:rotate-90 transition-transform duration-500">
                          <Plus size={24} strokeWidth={3} />
                      </div>
                  </div>
                  <div className="text-left">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Start New</span>
                      <span className="block text-xl font-bold text-slate-900 leading-none">สร้างวงแชร์ใหม่</span>
                  </div>
                  <Sparkles className="absolute top-3 right-3 text-amber-400 opacity-0 group-hover/btn:opacity-100 transition-opacity animate-pulse" size={16} />
              </button>
          </div>
      </div>

      {/* CONTROLS BAR (Tabs + View Toggle + Filters) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* TAB SWITCHER */}
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 w-full md:w-auto">
              <button 
                  onClick={() => { setActiveTab('ACTIVE'); resetFilters(); }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none justify-center ${activeTab === 'ACTIVE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                  <LayoutGrid size={18} /> วงที่กำลังเดิน <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{activeCirclesList.length}</span>
              </button>
              <button 
                  onClick={() => { setActiveTab('ARCHIVED'); setArchivePage(1); }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex-1 md:flex-none justify-center ${activeTab === 'ARCHIVED' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                  <List size={18} /> ประวัติวงที่จบ <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'ARCHIVED' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{archivedCirclesList.length}</span>
              </button>
          </div>

          {/* RIGHT TOOLS */}
          <div className="flex items-center gap-3 w-full md:w-auto">
              
              {/* VIEW MODE TOGGLE */}
              <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                  <button 
                      onClick={() => setViewMode('GRID')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Grid View"
                  >
                      <LayoutGrid size={20} />
                  </button>
                  <button 
                      onClick={() => setViewMode('LIST')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="List View"
                  >
                      <List size={20} />
                  </button>
              </div>

              {/* FILTER BAR (Visible only for Archived or when needed) */}
              {activeTab === 'ARCHIVED' && (
                  <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="ค้นหาชื่อวง..." 
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none text-sm shadow-sm"
                          value={archiveSearch}
                          onChange={(e) => { setArchiveSearch(e.target.value); setArchivePage(1); }}
                      />
                  </div>
              )}
          </div>
      </div>

      {/* CONTENT: ACTIVE CIRCLES */}
      {activeTab === 'ACTIVE' && (
          <>
            {activeCirclesList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in-95">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <LayoutGrid size={32} className="text-slate-300" />
                   </div>
                   <p className="text-slate-400">ยังไม่มีวงแชร์ที่กำลังเดินอยู่</p>
                   <button onClick={handleOpenCreate} className="text-blue-600 font-bold hover:underline mt-2">สร้างวงแรกเลย</button>
                </div>
            ) : viewMode === 'GRID' ? (
                // --- GRID VIEW (Active) ---
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                  {activeCirclesList.map((circle) => {
                    const aliveCount = circle.members.filter(m => m.status === 'ALIVE').length;
                    const deadCount = circle.members.filter(m => m.status === 'DEAD').length;
                    const isInitializing = circle.status === CircleStatus.INITIALIZING;
                    const isSetupComplete = circle.status === CircleStatus.SETUP_COMPLETE;
                    const isCompleted = circle.status === CircleStatus.COMPLETED;
                    
                    const currentRoundNumber = circle.rounds.length;
                    const isLastRound = !isCompleted && !isInitializing && currentRoundNumber >= circle.totalSlots;

                    const payingSlots = Math.max(0, circle.totalSlots - 1);
                    const totalPotDisplay = circle.principal * payingSlots;
                    const endDateDisplay = calculateEndDate(circle.startDate, circle.period, circle.totalSlots);
                    
                    return (
                      <div 
                        key={circle.id} 
                        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col"
                        onClick={() => setViewingCircle(circle)}
                      >
                        <div className="p-6 border-b border-slate-50 flex-1">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            {/* Left: Title & Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                  {isInitializing ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">กำลังตั้งวง</span>
                                  ) : isSetupComplete ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white border border-emerald-700 uppercase">ตั้งวงสำเร็จ</span>
                                  ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">Active</span>
                                  )}
                              </div>
                              <h3 className="text-xl font-bold text-slate-800 truncate">{circle.name}</h3>
                              <div className="flex flex-wrap gap-2 mt-2">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${circle.type === ShareType.DOK_HAK ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                   {circle.type === ShareType.DOK_HAK ? 'ดอกหัก' : 'ดอกตาม'}
                                 </span>
                                 <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${circle.biddingType === BiddingType.FIXED ? 'bg-slate-100 text-slate-700' : 'bg-red-50 text-red-700'}`}>
                                   {circle.biddingType === BiddingType.FIXED ? <ListOrdered size={12}/> : <Gavel size={12}/>}
                                   {circle.biddingType === BiddingType.FIXED ? 'ขั้นบันได' : 'ประมูล'}
                                 </span>
                                 <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">{getPeriodLabel(circle.period)}</span>
                              </div>
                            </div>

                            {/* Right: Actions & Pot */}
                            <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                                <div className="flex gap-2">
                                   {isLastRound && (
                                       <button
                                           onClick={(e) => handleCloseCircle(e, circle)}
                                           className="px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-2 hover:scale-105 transition-transform animate-pulse font-bold text-xs whitespace-nowrap"
                                           title="กดเพื่อปิดวงและย้ายเข้าประวัติ"
                                       >
                                           <Flag size={14} fill="currentColor" /> จบวง (Final)
                                       </button>
                                   )}

                                   <button 
                                        onClick={(e) => handleOpenEdit(e, circle)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                                        title="แก้ไขข้อมูลวงแชร์"
                                        >
                                        <Edit3 size={18} />
                                    </button>

                                   <button 
                                        onClick={(e) => handleDeleteClick(circle.id, circle.name, e)}
                                        className="p-2 bg-white text-slate-400 border border-slate-200 rounded-xl hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                        title="ลบวงแชร์"
                                        >
                                        <Trash2 size={18} />
                                    </button>

                                </div>
                                
                                <div className="text-right mt-2 sm:mt-0">
                                  <p className="text-sm text-slate-500">ยอดวง</p>
                                  <p className="text-xl font-bold text-slate-900">฿{totalPotDisplay.toLocaleString()}</p>
                                  <p className="text-xs text-slate-400 mt-1 hidden sm:block">มือละ ฿{circle.principal.toLocaleString()}</p>
                                </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Users size={18} /></div>
                            <div><p className="text-xs text-slate-500">สมาชิก</p><p className="font-semibold text-slate-800">{circle.members.length} / {circle.totalSlots}</p></div>
                          </div>
                           <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Calendar size={18} /></div>
                            <div><p className="text-xs text-slate-500">งวดถัดไป</p><p className="font-semibold text-slate-800">{new Date(circle.nextDueDate).toLocaleDateString('th-TH')}</p></div>
                          </div>
                          {/* End Date */}
                          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><Flag size={18} /></div>
                            <div><p className="text-xs text-slate-500">จบวงวันที่ (โดยประมาณ)</p><p className="font-semibold text-slate-800">{endDateDisplay}</p></div>
                          </div>
                        </div>

                        <div className="px-6 pb-6">
                          <div className="flex justify-between text-xs mb-2">
                              <span className="text-red-500 font-medium">เปียแล้ว {deadCount}</span>
                              <span className="text-emerald-500 font-medium">ยังไม่เปีย {aliveCount}</span>
                          </div>
                          <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden flex">
                              <div className="bg-red-400 h-2.5" style={{ width: `${circle.totalSlots > 0 ? (deadCount / circle.totalSlots) * 100 : 0}%` }}></div>
                          </div>
                        </div>

                        {isInitializing && (
                             <div className="bg-amber-50 p-4 border-t border-amber-100 text-center text-amber-700 text-sm font-bold flex items-center justify-center gap-2 mt-auto">
                                 <Clock size={16} /> รอเริ่มเดินวง (Setting Up)
                             </div>
                        )}
                        {/* Only show Ready To Run if NOT in Last Round */}
                        {isSetupComplete && !isLastRound && (
                             <div className="bg-emerald-600 p-4 border-t border-emerald-700 text-center text-white text-sm font-bold flex items-center justify-center gap-2 mt-auto">
                                 <CheckCircle2 size={16} /> ตั้งวงสำเร็จ (Ready to Run)
                             </div>
                        )}
                        {isLastRound && (
                             <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 border-t border-red-600 text-center text-white text-sm font-bold flex items-center justify-center gap-2 animate-pulse mt-auto">
                                 <Trophy size={16} fill="currentColor" /> เข้าสู่รอบสุดท้าย (Final Round)
                             </div>
                        )}
                      </div>
                    );
                  })}
                </div>
            ) : (
                // --- LIST VIEW (Active) ---
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold">ชื่อวงแชร์</th>
                                    <th className="px-6 py-4 font-bold text-center">ประเภท</th>
                                    <th className="px-6 py-4 font-bold text-center">ความคืบหน้า</th>
                                    <th className="px-6 py-4 font-bold text-right">ยอดวง (Pot)</th>
                                    <th className="px-6 py-4 font-bold text-center">งวดถัดไป</th>
                                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeCirclesList.map((circle) => {
                                    const deadCount = circle.members.filter(m => m.status === 'DEAD').length;
                                    const isInitializing = circle.status === CircleStatus.INITIALIZING;
                                    const isSetupComplete = circle.status === CircleStatus.SETUP_COMPLETE;
                                    
                                    const payingSlots = Math.max(0, circle.totalSlots - 1);
                                    const totalPotDisplay = circle.principal * payingSlots;
                                    const currentRoundNumber = circle.rounds.length;
                                    const isLastRound = currentRoundNumber >= circle.totalSlots;

                                    return (
                                        <tr key={circle.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setViewingCircle(circle)}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-base">{circle.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {isInitializing ? (
                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">Pending</span>
                                                        ) : isSetupComplete ? (
                                                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">Running</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">Active</span>
                                                        )}
                                                        {isLastRound && (
                                                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200 animate-pulse">Final Round</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${circle.type === ShareType.DOK_HAK ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                                        {circle.type === ShareType.DOK_HAK ? 'ดอกหัก' : 'ดอกตาม'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">{circle.biddingType === BiddingType.FIXED ? 'ขั้นบันได' : 'ประมูล'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="w-full max-w-[120px] mx-auto">
                                                    <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500">
                                                        <span>{deadCount}</span>
                                                        <span>{circle.totalSlots}</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(deadCount / circle.totalSlots) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-bold text-slate-800">฿{totalPotDisplay.toLocaleString()}</div>
                                                <div className="text-xs text-slate-400">@{circle.principal.toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-slate-700">{new Date(circle.nextDueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">{getPeriodLabel(circle.period)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    {isInitializing && (
                                                        <button 
                                                            onClick={() => handleStartCircle(circle.id)}
                                                            className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
                                                            title="เริ่มเดินวง"
                                                        >
                                                            <PlayCircle size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {isLastRound && (
                                                        <button
                                                            onClick={(e) => handleCloseCircle(e, circle)}
                                                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors animate-pulse"
                                                            title="จบวง (Archive)"
                                                        >
                                                            <Flag size={16} fill="currentColor" />
                                                        </button>
                                                    )}

                                                    <button 
                                                        onClick={(e) => handleOpenEdit(e, circle)}
                                                        className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors border border-blue-100"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={(e) => handleDeleteClick(circle.id, circle.name, e)}
                                                        className="p-1.5 text-slate-400 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </>
      )}

      {/* CONTENT: ARCHIVED CIRCLES (LIST VIEW) */}
      {activeTab === 'ARCHIVED' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4">
              {viewMode === 'LIST' ? (
                  <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase">
                          <tr>
                              <th className="px-6 py-4 text-left">ชื่อวงแชร์</th>
                              <th className="px-6 py-4 text-center">ประเภท</th>
                              <th className="px-6 py-4 text-center">จำนวนมือ</th>
                              <th className="px-6 py-4 text-right">ยอดวง (Total Pot)</th>
                              <th className="px-6 py-4 text-right">ดอกผลรวม</th>
                              <th className="px-6 py-4 text-center">วันที่เริ่ม - จบ</th>
                              <th className="px-6 py-4 text-center">จัดการ</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {paginatedArchivedCircles.length > 0 ? paginatedArchivedCircles.map(circle => {
                              const payingSlots = Math.max(0, circle.totalSlots - 1);
                              const totalPotDisplay = circle.principal * payingSlots;
                              const totalInterest = circle.rounds.reduce((sum, r) => sum + (r.bidAmount || 0), 0);
                              const endDate = calculateEndDate(circle.startDate, circle.period, circle.totalSlots);

                              return (
                                  <tr key={circle.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewingCircle(circle)}>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                                  <Archive size={16} />
                                              </div>
                                              <span className="font-bold text-slate-800">{circle.name}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <span className={`px-2 py-1 rounded text-xs font-bold ${circle.type === ShareType.DOK_HAK ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                              {circle.type === ShareType.DOK_HAK ? 'ดอกหัก' : 'ดอกตาม'}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-center text-slate-600">
                                          {circle.totalSlots} มือ
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                                          ฿{totalPotDisplay.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-right font-bold text-amber-600">
                                          +฿{totalInterest.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-center text-xs text-slate-500">
                                          {new Date(circle.startDate).toLocaleDateString('th-TH')} - {endDate}
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                          <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                              <button 
                                                  onClick={() => setViewingCircle(circle)}
                                                  className="p-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                                                  title="ดูรายละเอียด"
                                              >
                                                  <Eye size={16} />
                                              </button>
                                              <button 
                                                  onClick={(e) => handleDeleteClick(circle.id, circle.name, e)}
                                                  className="group p-2 text-slate-400 border border-slate-200 rounded-lg hover:bg-gradient-to-br hover:from-rose-500 hover:to-red-600 hover:text-white hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-red-500/20"
                                                  title="ลบถาวร"
                                              >
                                                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              );
                          }) : (
                              <tr>
                                  <td colSpan={7} className="py-12 text-center text-slate-400">
                                      {archiveSearch || filterMonth || filterType !== 'ALL' ? 'ไม่พบข้อมูลตามเงื่อนไขการกรอง' : 'ยังไม่มีประวัติวงที่จบการเล่น'}
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              ) : (
                  // --- ARCHIVED GRID VIEW ---
                  <div className="p-6 bg-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedArchivedCircles.length > 0 ? paginatedArchivedCircles.map(circle => {
                              const payingSlots = Math.max(0, circle.totalSlots - 1);
                              const totalPotDisplay = circle.principal * payingSlots;
                              const endDate = calculateEndDate(circle.startDate, circle.period, circle.totalSlots);
                              
                              return (
                                  <div 
                                      key={circle.id} 
                                      onClick={() => setViewingCircle(circle)}
                                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all group"
                                  >
                                      <div className="flex justify-between items-start mb-3">
                                          <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-slate-200 transition-colors">
                                              <Archive size={20} />
                                          </div>
                                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold uppercase">Archived</span>
                                      </div>
                                      <h4 className="font-bold text-slate-800 text-lg mb-1 truncate">{circle.name}</h4>
                                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                          <span>{circle.totalSlots} มือ</span>
                                          <span>•</span>
                                          <span>{getPeriodLabel(circle.period)}</span>
                                      </div>
                                      <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                                          <div>
                                              <p className="text-[10px] text-slate-400 uppercase font-bold">สิ้นสุดเมื่อ</p>
                                              <p className="text-sm font-bold text-slate-600">{endDate}</p>
                                          </div>
                                          <div className="text-right">
                                              <p className="text-[10px] text-slate-400 uppercase font-bold">ยอดวง</p>
                                              <p className="text-lg font-bold text-slate-800">฿{totalPotDisplay.toLocaleString()}</p>
                                          </div>
                                      </div>
                                  </div>
                              );
                          }) : (
                              <div className="col-span-full py-12 text-center text-slate-400">
                                  {archiveSearch || filterMonth || filterType !== 'ALL' ? 'ไม่พบข้อมูลตามเงื่อนไขการกรอง' : 'ยังไม่มีประวัติวงที่จบการเล่น'}
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* Pagination Controls (Common) */}
              {totalArchivePages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                      <button 
                          onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                          disabled={archivePage === 1}
                          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-200 transition-all"
                      >
                          <ChevronLeft size={20} className="text-slate-600" />
                      </button>
                      <span className="text-sm font-bold text-slate-600">
                          หน้า {archivePage} / {totalArchivePages}
                      </span>
                      <button 
                          onClick={() => setArchivePage(p => Math.min(totalArchivePages, p + 1))}
                          disabled={archivePage === totalArchivePages}
                          className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-slate-200 transition-all"
                      >
                          <ChevronRight size={20} className="text-slate-600" />
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* --- MODALS --- */}

      {/* Form Modal (Create/Edit) */}
      {isFormOpen && (
          <CircleFormModal 
              onClose={() => setIsFormOpen(false)} 
              editingCircleId={editingCircleId} 
              onSuccess={handleScriptSuccess}
          />
      )}

      {/* Detail View Modal */}
      {viewingCircle && (
          <CircleDetailModal 
              circle={viewingCircle} 
              onClose={() => setViewingCircle(null)} 
              onStartCircle={handleStartCircle}
              onEdit={() => {
                  setEditingCircleId(viewingCircle.id);
                  setViewingCircle(null);
                  setIsFormOpen(true);
              }}
          />
      )}

      {/* Script Success Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowScriptModal(false)} />
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 p-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">สร้างวงแชร์สำเร็จ!</h3>
                    <p className="text-slate-500 text-sm">คัดลอกข้อความด้านล่างเพื่อแจ้งสมาชิก</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 relative group max-h-[300px] overflow-y-auto">
                    <pre className="text-slate-800 font-medium whitespace-pre-wrap font-sans text-sm leading-relaxed">{scriptContent}</pre>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowScriptModal(false)} className="flex-1 py-3 text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-50">ปิด</button>
                    <button onClick={copyToClipboard} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"><Copy size={18} /> คัดลอก</button>
                </div>
           </div>
        </div>
      )}

      {/* Start Success Modal */}
      {showStartSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStartSuccessModal(false)} />
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-300 p-8 text-center border-2 border-emerald-50">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-in zoom-in spin-in-180 duration-500">
                    <PlayCircle size={40} className="text-emerald-600 fill-emerald-600 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">เริ่มเดินวงสำเร็จ!</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    สถานะวงแชร์ถูกเปลี่ยนเป็น<br/>
                    <span className="text-emerald-600 font-bold">"ตั้งวงสำเร็จ (Setup Complete)"</span><br/>
                    และเริ่มนับงวดแรกเรียบร้อยแล้ว
                </p>
                <button onClick={() => setShowStartSuccessModal(false)} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg transition-all">รับทราบ</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CircleManagement;
