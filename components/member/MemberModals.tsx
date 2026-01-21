
import React, { useState, useRef } from 'react';
import { X, User, Camera, Save, Edit, Trash2, TrendingUp, Trophy, FileText, ShieldCheck, MapPin, CreditCard, Image as ImageIcon, Building2, CheckCircle2, Clock, ExternalLink, Star, ChevronDown, Wallet } from 'lucide-react';
import { Member, MemberStatus, ShareCircle, Transaction } from '../../types';

// --- CREATE MEMBER MODAL ---
interface CreateMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (member: Member) => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newIdCard, setNewIdCard] = useState('');
    const [newIdCardImage, setNewIdCardImage] = useState<File | null>(null);
    const [newBankName, setNewBankName] = useState('');
    const [newBankAccount, setNewBankAccount] = useState('');
    const [newBookbankImage, setNewBookbankImage] = useState<File | null>(null);
    const [newRiskScore, setNewRiskScore] = useState<'GOOD' | 'MEDIUM' | 'WATCHLIST'>('GOOD');
    const [newAvatarImage, setNewAvatarImage] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName || !newMemberPhone) return;

        const idCardUrl = newIdCardImage ? URL.createObjectURL(newIdCardImage) : undefined;
        const bookbankUrl = newBookbankImage ? URL.createObjectURL(newBookbankImage) : undefined;
        const avatarUrl = newAvatarImage ? URL.createObjectURL(newAvatarImage) : `https://ui-avatars.com/api/?name=${encodeURIComponent(newMemberName)}&background=random`;

        const newMember: Member = {
            id: `m-${Date.now()}`,
            name: newMemberName,
            phone: newMemberPhone,
            riskScore: newRiskScore,
            status: MemberStatus.ACTIVE,
            avatarUrl: avatarUrl,
            address: newAddress,
            idCardNumber: newIdCard,
            idCardImageUrl: idCardUrl,
            bankName: newBankName,
            bankAccountNumber: newBankAccount,
            bookbankImageUrl: bookbankUrl
        };

        onAdd(newMember);
        onClose();
        
        // Reset form
        setNewMemberName('');
        setNewMemberPhone('');
        setNewAddress('');
        setNewIdCard('');
        setNewIdCardImage(null);
        setNewBankName('');
        setNewBankAccount('');
        setNewBookbankImage(null);
        setNewRiskScore('GOOD');
        setNewAvatarImage(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative bg-white text-black rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">เพิ่มสมาชิกใหม่ (Manual)</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center mb-6">
                  <label className="block text-sm font-bold text-slate-800 mb-2">รูปโปรไฟล์</label>
                  <div className="relative group cursor-pointer border-2 border-dashed border-slate-300 rounded-full p-1 hover:border-blue-500 transition-colors">
                      <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden relative">
                          {newAvatarImage ? (
                              <img src={URL.createObjectURL(newAvatarImage)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <User size={32} />
                              </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Camera className="text-white" size={24} />
                          </div>
                      </div>
                      <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => setNewAvatarImage(e.target.files?.[0] || null)}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1">ชื่อ-นามสกุล</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 font-medium"
                        placeholder="ระบุชื่อสมาชิก"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 bg-white text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 font-medium"
                      placeholder="08X-XXX-XXXX"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value)}
                    />
                  </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-300 bg-white text-slate-700 rounded-xl font-bold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 rounded-xl text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
    );
};

// --- SLIP VIEWER MODAL ---
interface SlipViewerModalProps {
    data: {url: string, title: string, amount?: number, date?: string} | null;
    onClose: () => void;
}

export const SlipViewerModal: React.FC<SlipViewerModalProps> = ({ data, onClose }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
            <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
                <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-gray-300">
                    <X size={32} />
                </button>
                <img src={data.url} alt="Slip" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-black" />
                <div className="mt-4 text-white text-center">
                    <p className="font-bold text-lg">{data.title}</p>
                    {data.amount && <p className="text-emerald-400 font-bold text-xl">฿{data.amount.toLocaleString()}</p>}
                    {data.date && <p className="text-sm text-gray-400">{data.date}</p>}
                </div>
            </div>
        </div>
    );
};

// --- MEMBER DETAIL MODAL ---
interface MemberDetailModalProps {
    member: Member | null;
    onClose: () => void;
    onUpdate: (id: string, data: Partial<Member>) => Promise<void>;
    onDelete: (member: Member) => void;
    
    // Data props
    getMemberStats: (id: string) => any;
    getMemberCircles: (id: string) => ShareCircle[];
    getWinningHistory: (id: string) => any[];
    transactions: Transaction[];
    circles: ShareCircle[];
    getRiskStatusBadge: (score: string) => any;
    showAlert: (msg: string, title?: string, type?: 'success'|'error') => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ 
    member, onClose, onUpdate, onDelete, 
    getMemberStats, getMemberCircles, getWinningHistory, transactions, circles, getRiskStatusBadge, showAlert 
}) => {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WINNING_HISTORY' | 'PAYMENTS' | 'DOCUMENTS'>('OVERVIEW');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Member>>({});
    const [expandedCircleId, setExpandedCircleId] = useState<string | null>(null);
    const detailFileInputRef = useRef<HTMLInputElement>(null);
    const [viewingSlip, setViewingSlip] = useState<{url: string, title: string, amount?: number, date?: string} | null>(null);

    if (!member) return null;

    const handleStartEdit = () => {
        setEditForm({
            name: member.name,
            phone: member.phone,
            address: member.address,
            idCardNumber: member.idCardNumber,
            bankName: member.bankName,
            bankAccountNumber: member.bankAccountNumber,
            riskScore: member.riskScore,
            creditScore: member.creditScore
        });
        setIsEditing(true);
        setActiveTab('DOCUMENTS');
    };

    const handleSaveEdit = async () => {
        if(!member || !editForm.name) return;
        await onUpdate(member.id, editForm);
        // We assume parent updates state, but for smoother UX we could optimistically update if we had local state
        // Here we rely on parent re-render.
        setIsEditing(false);
        showAlert('บันทึกข้อมูลเรียบร้อย', 'สำเร็จ', 'success');
    };

    const handleDetailAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (member && e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newUrl = URL.createObjectURL(file);
            await onUpdate(member.id, { avatarUrl: newUrl });
            showAlert('อัปเดตรูปโปรไฟล์เรียบร้อย', 'สำเร็จ', 'success');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Header Profile */}
                <div className={`p-6 text-white flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 ${member.status === MemberStatus.PENDING ? 'bg-blue-900' : 'bg-slate-900'}`}>
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                        <div className="relative group cursor-pointer" onClick={() => detailFileInputRef.current?.click()}>
                             <img src={member.avatarUrl} alt="" className="w-16 h-16 rounded-full border-2 border-slate-700 bg-slate-800 object-cover" />
                             {member.status !== MemberStatus.PENDING && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={16} />
                                </div>
                             )}
                             <input 
                                ref={detailFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleDetailAvatarChange}
                                disabled={member.status === MemberStatus.PENDING}
                             />
                             {/* RISK SCORE BADGE (View Only) */}
                             {!isEditing && (() => {
                                    const risk = getRiskStatusBadge(member.riskScore);
                                    return (
                                        <div className={`absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-900 ${risk.color}`}>
                                            {risk.label}
                                        </div>
                                    );
                                })()
                             }
                        </div>
                        
                        <div className="flex-1">
                            {/* NAME */}
                            {isEditing ? (
                                <div className="mb-2">
                                    <input 
                                        className="text-2xl font-bold bg-white/10 border border-white/20 rounded px-2 py-1 w-full text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        placeholder="ชื่อ-นามสกุล"
                                    />
                                </div>
                            ) : (
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    {member.name}
                                    {member.status === MemberStatus.PENDING && (
                                        <span className="bg-white text-blue-900 text-xs px-2 py-1 rounded-full font-bold">New Applicant</span>
                                    )}
                                </h3>
                            )}

                            {/* PHONE */}
                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                                {isEditing ? (
                                    <input 
                                        className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-white w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        placeholder="เบอร์โทร"
                                    />
                                ) : (
                                    <span>{member.phone}</span>
                                )}
                                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                <span className={`${member.status === 'ACTIVE' ? 'text-emerald-400' : member.status === 'PENDING' ? 'text-blue-300' : 'text-red-400'}`}>
                                    {member.status === 'ACTIVE' ? 'สถานะปกติ' : member.status === 'PENDING' ? 'รออนุมัติ' : 'เฝ้าระวัง'}
                                </span>
                            </div>
                            
                            {/* CREDIT SCORE BADGE DISPLAY (Only View) */}
                            {!isEditing && (
                                <div className="mt-2 flex items-center gap-2 text-indigo-300 text-xs font-bold">
                                    <Star size={12} fill="currentColor"/>
                                    Credit Score: {member.creditScore || 100}
                                </div>
                            )}

                            {/* RISK & CREDIT SCORE EDIT CONTROL */}
                            {isEditing && (
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Risk Status</label>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setEditForm({...editForm, riskScore: 'GOOD'})}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all border ${editForm.riskScore === 'GOOD' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                                            >
                                                สถานะดี
                                            </button>
                                            <button 
                                                onClick={() => setEditForm({...editForm, riskScore: 'MEDIUM'})}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all border ${editForm.riskScore === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                                            >
                                                ปานกลาง
                                            </button>
                                            <button 
                                                onClick={() => setEditForm({...editForm, riskScore: 'WATCHLIST'})}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all border ${editForm.riskScore === 'WATCHLIST' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                                            >
                                                เฝ้าระวัง
                                            </button>
                                        </div>
                                    </div>
                                    {/* CREDIT SCORE INPUT */}
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Credit Score (คะแนนความประพฤติ)</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white w-20 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={editForm.creditScore || 100}
                                                onChange={(e) => setEditForm({...editForm, creditScore: Number(e.target.value)})}
                                            />
                                            <span className="text-xs text-slate-500">(Default: 100)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ADDRESS PREVIEW (Not editable here, see documents) */}
                            {!isEditing && member.address && (
                                <p className="text-xs text-slate-500 mt-1 max-w-md truncate">{member.address}</p>
                            )}
                        </div>
                    </div>

                    {/* TOP RIGHT ACTIONS */}
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-colors">
                                    <X size={16} /> ยกเลิก
                                </button>
                                <button onClick={handleSaveEdit} className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-colors shadow-lg">
                                    <Save size={16} /> บันทึก
                                </button>
                            </>
                        ) : member.status !== MemberStatus.PENDING ? (
                            <>
                                <button onClick={handleStartEdit} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-colors" title="แก้ไขข้อมูล">
                                    <Edit size={16} /> แก้ไข
                                </button>
                                <button onClick={() => onDelete(member)} className="p-2 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-colors" title="ลบสมาชิก">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        ) : null}
                        
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 ml-2">
                            <X size={24} />
                        </button>
                    </div>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10 overflow-x-auto">
                    {/* Only show relevant tabs for PENDING members */}
                    {member.status !== MemberStatus.PENDING && (
                        <>
                            <button 
                                onClick={() => setActiveTab('OVERVIEW')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap px-4 ${activeTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <TrendingUp size={16} /> ภาพรวม
                            </button>
                            <button 
                                onClick={() => setActiveTab('WINNING_HISTORY')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap px-4 ${activeTab === 'WINNING_HISTORY' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Trophy size={16} /> ประวัติการเปีย
                            </button>
                            <button 
                                onClick={() => setActiveTab('PAYMENTS')}
                                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap px-4 ${activeTab === 'PAYMENTS' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <FileText size={16} /> ประวัติโอน
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => setActiveTab('DOCUMENTS')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap px-4 ${activeTab === 'DOCUMENTS' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                        <ShieldCheck size={16} /> เอกสาร (KYC)
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'OVERVIEW' && member.status !== MemberStatus.PENDING && (
                        <div className="space-y-6">
                            {(() => {
                                const stats = getMemberStats(member.id);
                                return (
                                    <>
                                        {/* Stats Cards */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-xs text-slate-500 mb-1">เงินต้นหมุนเวียน</p>
                                                <p className="text-xl font-bold text-slate-800">฿{stats.totalPrincipal.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-xs text-slate-500 mb-1">มือที่ถืออยู่</p>
                                                <p className="text-xl font-bold text-blue-600">{stats.totalHands} มือ</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-xs text-slate-500 mb-1">ดอกที่จ่ายไปแล้ว</p>
                                                <p className="text-xl font-bold text-orange-500">฿{stats.totalBidsPaid.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Circles List */}
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2 mt-4">
                                            <Wallet size={20} className="text-slate-400" />
                                            วงแชร์ที่เล่นอยู่
                                        </h4>
                                        <div className="space-y-3">
                                            {getMemberCircles(member.id).map(circle => {
                                                const memberInfo = circle.members.find(m => m.memberId === member.id);
                                                const isExpanded = expandedCircleId === circle.id;
                                                
                                                if (!memberInfo) return null;

                                                return (
                                                    <div key={circle.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                        <div 
                                                            onClick={() => setExpandedCircleId(isExpanded ? null : circle.id)}
                                                            className="p-4 flex items-center justify-between cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${memberInfo.status === 'DEAD' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                                    <Wallet size={20} />
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-bold text-slate-800">{circle.name}</h5>
                                                                    <p className="text-xs text-slate-500">
                                                                        มือที่ {memberInfo.slotNumber} • 
                                                                        <span className={`ml-1 font-bold ${memberInfo.status === 'DEAD' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                            {memberInfo.status === 'DEAD' ? 'เปียแล้ว' : 'รอเปีย'}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-slate-800">฿{circle.principal.toLocaleString()}</p>
                                                                <ChevronDown size={16} className={`text-slate-400 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </div>
                                                        </div>
                                                        
                                                        {isExpanded && (
                                                            <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">ประเภท</span>
                                                                    <span className="font-medium">{circle.type === 'DOK_HAK' ? 'ดอกหัก' : 'ดอกตาม'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-500">งวดถัดไป</span>
                                                                    <span className="font-medium">{new Date(circle.nextDueDate).toLocaleDateString('th-TH')}</span>
                                                                </div>
                                                                {memberInfo.status === 'DEAD' && (
                                                                    <div className="flex justify-between text-red-600 font-bold bg-red-50 p-2 rounded">
                                                                        <span>ดอกที่ประมูลได้</span>
                                                                        <span>฿{memberInfo.bidAmount?.toLocaleString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* TAB: WINNING HISTORY */}
                    {activeTab === 'WINNING_HISTORY' && member.status !== MemberStatus.PENDING && (
                        <div className="space-y-4">
                            {(() => {
                                const wins = getWinningHistory(member.id);
                                if (wins.length === 0) {
                                    return <div className="text-center py-12 text-slate-400">ยังไม่เคยเปียแชร์</div>;
                                }
                                return wins.map((win, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-amber-50 text-amber-500 rounded-full">
                                                <Trophy size={20} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800">{win.circleName}</h5>
                                                <p className="text-xs text-slate-500">
                                                    งวดที่ {win.roundNumber} • {new Date(win.date).toLocaleDateString('th-TH')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">ยอดรับสุทธิ</p>
                                            <p className="font-bold text-emerald-600 text-lg">฿{win.totalPot.toLocaleString()}</p>
                                            <p className="text-xs text-orange-500 font-medium">ดอกเบี้ย ฿{win.bidAmount}</p>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {/* TAB: PAYMENTS (Transaction History) */}
                    {activeTab === 'PAYMENTS' && member.status !== MemberStatus.PENDING && (
                        <div className="space-y-4">
                            {transactions.filter(t => t.memberId === member.id).length === 0 ? (
                                <div className="text-center py-12 text-slate-400">ไม่มีประวัติการโอนเงิน</div>
                            ) : (
                                transactions
                                    .filter(t => t.memberId === member.id)
                                    .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
                                    .map(tx => {
                                        const circle = circles.find(c => c.id === tx.circleId);
                                        return (
                                            <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${tx.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {tx.status === 'PAID' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-800">{circle?.name || 'Unknown Circle'}</h5>
                                                        <p className="text-xs text-slate-500">งวดที่ {tx.roundNumber} • {tx.timestamp}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                    <span className={`font-bold ${tx.status === 'PAID' ? 'text-slate-800' : 'text-slate-400'}`}>
                                                        ฿{tx.amountPaid.toLocaleString()}
                                                    </span>
                                                    {tx.slipUrl && (
                                                        <button 
                                                            onClick={() => setViewingSlip({url: tx.slipUrl!, title: `สลิปงวดที่ ${tx.roundNumber}`, amount: tx.amountPaid, date: tx.timestamp})}
                                                            className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                                                        >
                                                            <ExternalLink size={12} /> ดูสลิป
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    )}

                    {/* TAB: DOCUMENTS (KYC) - Editable */}
                    {activeTab === 'DOCUMENTS' && (
                        <div className="space-y-6">
                            {/* Address Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <MapPin className="text-blue-500" size={20} /> ที่อยู่ปัจจุบัน
                                </h4>
                                {isEditing ? (
                                    <textarea 
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-24"
                                        value={editForm.address || ''}
                                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                        placeholder="ระบุที่อยู่..."
                                    />
                                ) : (
                                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl text-sm">
                                        {member.address || 'ยังไม่ได้ระบุข้อมูล'}
                                    </p>
                                )}
                            </div>

                            {/* ID Card */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="text-blue-500" size={20} /> บัตรประชาชน
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">เลขบัตรประชาชน</label>
                                        {isEditing ? (
                                            <input 
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                                value={editForm.idCardNumber || ''}
                                                onChange={(e) => setEditForm({...editForm, idCardNumber: e.target.value})}
                                            />
                                        ) : (
                                            <p className="font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded-lg inline-block border border-slate-200">
                                                {member.idCardNumber || '-'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">รูปถ่ายบัตร</label>
                                        {member.idCardImageUrl ? (
                                            <div className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 inline-block">
                                                <img 
                                                    src={member.idCardImageUrl} 
                                                    alt="ID Card" 
                                                    className="h-48 object-cover hover:scale-105 transition-transform duration-300"
                                                    onClick={() => setViewingSlip({url: member.idCardImageUrl!, title: 'บัตรประชาชน'})}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                                    <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                                                <ImageIcon size={32} className="mb-2 opacity-50" />
                                                <span className="text-sm">ไม่มีรูปภาพ</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Account */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Building2 className="text-blue-500" size={20} /> บัญชีรับเงิน
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">ธนาคาร</label>
                                        {isEditing ? (
                                            <input 
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={editForm.bankName || ''}
                                                onChange={(e) => setEditForm({...editForm, bankName: e.target.value})}
                                            />
                                        ) : (
                                            <p className="font-bold text-slate-700">{member.bankName || '-'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">เลขบัญชี</label>
                                        {isEditing ? (
                                            <input 
                                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                                value={editForm.bankAccountNumber || ''}
                                                onChange={(e) => setEditForm({...editForm, bankAccountNumber: e.target.value})}
                                            />
                                        ) : (
                                            <p className="font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded-lg inline-block border border-slate-200">
                                                {member.bankAccountNumber || '-'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {member.bookbankImageUrl && (
                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">รูปหน้าสมุด</label>
                                        <img 
                                            src={member.bookbankImageUrl} 
                                            alt="Bookbank" 
                                            className="h-32 rounded-xl border border-slate-200 cursor-pointer hover:opacity-90"
                                            onClick={() => setViewingSlip({url: member.bookbankImageUrl!, title: 'หน้าสมุดบัญชี'})}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Nested Slip Viewer for Documents Tab */}
                <SlipViewerModal data={viewingSlip} onClose={() => setViewingSlip(null)} />
            </div>
        </div>
    );
};
