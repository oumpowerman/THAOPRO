
import React from 'react';
import { User, Search, Filter, ArrowUpDown, LayoutGrid, List, Columns, UserPlus, Heart, Sparkles, Check, X, Phone } from 'lucide-react';
import { useMemberProfile } from '../hooks/useMemberProfile';
import { MemberCardGrid, MemberRowList } from '../components/member/MemberCards';
import { CreateMemberModal, MemberDetailModal, SlipViewerModal } from '../components/member/MemberModals';

const MemberProfile = () => {
  const {
      // State
      viewMode, setViewMode,
      searchTerm, setSearchTerm,
      filterRisk, setFilterRisk,
      sortBy, setSortBy,
      isCreateModalOpen, setIsCreateModalOpen,
      selectedMember, setSelectedMember,
      viewingSlip, setViewingSlip,
      
      // Data
      pendingMembers,
      filteredMembers,
      totalActiveMembers,
      transactions,
      circles,

      // Actions
      addMember,
      updateMember,
      handleApprove,
      handleReject,
      handleDeleteMember,
      showAlert,

      // Helpers
      getMemberStats,
      getWinningHistory,
      getMemberCircles,
      getRiskStatusBadge
  } = useMemberProfile();

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. FRIENDLY HEADER (Community Hub) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl mb-8 group">
          {/* Decorative Shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-pink-400/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Text Side */}
              <div className="text-center md:text-left text-white">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                      <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
                          <User size={28} className="text-white" />
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">ฐานข้อมูลสมาชิก</h2>
                  </div>
                  <p className="text-indigo-100 text-sm max-w-lg mb-6 leading-relaxed">
                      ศูนย์รวมข้อมูลชุมชนลูกแชร์ จัดการประวัติ ตรวจสอบเครดิต และอนุมัติสมาชิกใหม่อย่างเป็นระบบ
                  </p>
                  
                  {/* Quick Stats Pills */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <div className="px-4 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-2 border border-white/10">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          Active: {totalActiveMembers} คน
                      </div>
                      <div className="px-4 py-1.5 bg-black/20 backdrop-blur-sm rounded-full text-xs font-bold flex items-center gap-2 border border-white/10">
                          <Heart size={10} className="text-pink-300" fill="currentColor" />
                          Community
                      </div>
                  </div>
              </div>

              {/* Action Button */}
              <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group/btn relative flex items-center gap-3 bg-white text-indigo-600 px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-900/20 hover:shadow-xl hover:shadow-indigo-900/30 transition-all transform hover:-translate-y-1 active:scale-95"
              >
                  <div className="bg-indigo-100 p-1.5 rounded-lg group-hover/btn:bg-indigo-200 transition-colors">
                      <UserPlus size={20} />
                  </div>
                  <span className="font-bold text-lg">เพิ่มสมาชิก</span>
                  <Sparkles className="absolute top-2 right-2 text-amber-400 opacity-0 group-hover/btn:opacity-100 transition-opacity animate-pulse" size={12} />
              </button>
          </div>
      </div>
      
      {/* PENDING REQUESTS (Always at Top) */}
      {pendingMembers.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><UserPlus size={100} /></div>
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2 relative z-10">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                 คำขอเข้าร่วมใหม่ ({pendingMembers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative z-10">
                 {pendingMembers.map(member => (
                     <div 
                        key={member.id}
                        className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between border border-blue-100"
                     >
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedMember(member); }}>
                            <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                                <p className="text-xs text-slate-500">{member.phone}</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={(e) => handleReject(member.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ปฏิเสธ">
                                <X size={18} />
                            </button>
                            <button onClick={(e) => handleApprove(member.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="อนุมัติ">
                                <Check size={18} />
                            </button>
                        </div>
                     </div>
                 ))}
              </div>
          </div>
      )}

      {/* ADVANCED TOOLBAR */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2 sticky top-0 z-20">
          
          {/* Search */}
          <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                  placeholder="ค้นหาชื่อ หรือ เบอร์โทร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {/* Filters */}
              <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-100">
                  <Filter size={16} className="text-slate-400 ml-2" />
                  <select 
                      className="bg-transparent border-none text-sm font-bold text-slate-700 py-2.5 px-2 focus:ring-0 cursor-pointer"
                      value={filterRisk}
                      onChange={(e: any) => setFilterRisk(e.target.value)}
                  >
                      <option value="ALL">ความเสี่ยง: ทั้งหมด</option>
                      <option value="GOOD">สถานะดี (Good)</option>
                      <option value="MEDIUM">ปานกลาง (Medium)</option>
                      <option value="WATCHLIST">เฝ้าระวัง (Watchlist)</option>
                  </select>
              </div>

              {/* Sort */}
              <button 
                  onClick={() => setSortBy(prev => prev === 'NAME' ? 'CREDIT_SCORE' : 'NAME')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-colors whitespace-nowrap"
              >
                  <ArrowUpDown size={16} />
                  {sortBy === 'NAME' ? 'เรียงตามชื่อ' : 'เรียงตามคะแนน'}
              </button>

              {/* View Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                      onClick={() => setViewMode('GRID')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Grid View"
                  >
                      <LayoutGrid size={18} />
                  </button>
                  <button 
                      onClick={() => setViewMode('LIST')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="List View"
                  >
                      <List size={18} />
                  </button>
                  <button 
                      onClick={() => setViewMode('KANBAN')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'KANBAN' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Kanban View"
                  >
                      <Columns size={18} />
                  </button>
              </div>
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="min-h-[400px]">
          {filteredMembers.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                  <User size={48} className="mx-auto mb-4 opacity-20" />
                  <p>ไม่พบสมาชิกที่ค้นหา</p>
              </div>
          ) : (
              <>
                  {/* VIEW: GRID */}
                  {viewMode === 'GRID' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                          {filteredMembers.map(member => (
                              <MemberCardGrid 
                                key={member.id} 
                                member={member} 
                                onClick={() => setSelectedMember(member)}
                                getMemberStats={getMemberStats}
                                getRiskStatusBadge={getRiskStatusBadge}
                              />
                          ))}
                      </div>
                  )}

                  {/* VIEW: LIST */}
                  {viewMode === 'LIST' && (
                      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
                          {filteredMembers.map(member => (
                              <MemberRowList 
                                key={member.id} 
                                member={member} 
                                onClick={() => setSelectedMember(member)}
                                getMemberStats={getMemberStats}
                                getRiskStatusBadge={getRiskStatusBadge}
                              />
                          ))}
                      </div>
                  )}

                  {/* VIEW: KANBAN */}
                  {viewMode === 'KANBAN' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start animate-in fade-in slide-in-from-bottom-4">
                          {[
                              { id: 'GOOD', title: 'สถานะดี (Good)', color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
                              { id: 'MEDIUM', title: 'ปานกลาง (Medium)', color: 'bg-amber-50 border-amber-100', text: 'text-amber-700' },
                              { id: 'WATCHLIST', title: 'เฝ้าระวัง (Watchlist)', color: 'bg-red-50 border-red-100', text: 'text-red-700' }
                          ].map(col => (
                              <div key={col.id} className={`rounded-2xl border ${col.color} flex flex-col h-full`}>
                                  <div className={`p-4 font-bold ${col.text} flex justify-between items-center`}>
                                      {col.title}
                                      <span className="bg-white/50 px-2 py-0.5 rounded text-sm">
                                          {filteredMembers.filter(m => m.riskScore === col.id).length}
                                      </span>
                                  </div>
                                  <div className="p-3 space-y-3">
                                      {filteredMembers.filter(m => m.riskScore === col.id).map(member => (
                                          <div 
                                              key={member.id} 
                                              onClick={() => setSelectedMember(member)}
                                              className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
                                          >
                                              <img src={member.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="" />
                                              <div className="min-w-0">
                                                  <p className="font-bold text-slate-800 text-sm truncate">{member.name}</p>
                                                  <p className="text-xs text-slate-500">{member.phone}</p>
                                              </div>
                                          </div>
                                      ))}
                                      {filteredMembers.filter(m => m.riskScore === col.id).length === 0 && (
                                          <div className="text-center py-8 text-slate-400 text-xs italic">ไม่มีรายการ</div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </>
          )}
      </div>

      {/* --- MODALS --- */}
      
      <CreateMemberModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onAdd={addMember} 
      />

      <MemberDetailModal 
        member={selectedMember} 
        onClose={() => setSelectedMember(null)} 
        onUpdate={updateMember}
        onDelete={handleDeleteMember}
        getMemberStats={getMemberStats}
        getMemberCircles={getMemberCircles}
        getWinningHistory={getWinningHistory}
        getRiskStatusBadge={getRiskStatusBadge}
        transactions={transactions}
        circles={circles}
        showAlert={showAlert}
      />

      <SlipViewerModal 
        data={viewingSlip} 
        onClose={() => setViewingSlip(null)} 
      />

    </div>
  );
};

export default MemberProfile;
