
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Gavel, 
  ClipboardList, 
  UserSquare2, 
  Menu, 
  X,
  LogOut,
  User as UserIcon,
  CircleDollarSign,
  Radio,
  MessageSquare,
  Camera,
  Save,
  Edit2,
  Building2,
  CreditCard,
  QrCode,
  CheckCircle2,
  Upload,
  Shield,
  Lock,
  Clock,
  Smartphone,
  Banknote
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// --- EDIT PROFILE MODAL (Embedded) ---
const EditProfileModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { user, updateCurrentUser, adminPaymentInfo, updateAdminPaymentInfo, showAlert } = useAppContext();
    const [name, setName] = useState(user?.name || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '');

    // ADMIN PAYMENT STATES
    const [bankName, setBankName] = useState('');
    const [accName, setAccName] = useState('');
    const [accNumber, setAccNumber] = useState('');
    const [promptPay, setPromptPay] = useState('');
    const [qrFile, setQrFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    
    // USER RECEIVING QR STATE
    const [userQrFile, setUserQrFile] = useState<File | null>(null);
    const [userQrPreview, setUserQrPreview] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setPreviewUrl(user.avatarUrl || '');
            if (user.role === 'USER') {
                setUserQrPreview(user.qrCodeUrl || null);
            }
        }
        if (user?.role === 'ADMIN' && adminPaymentInfo) {
            setBankName(adminPaymentInfo.bankName);
            setAccName(adminPaymentInfo.accountName);
            setAccNumber(adminPaymentInfo.accountNumber);
            setPromptPay(adminPaymentInfo.promptPayId || '');
            setQrPreview(adminPaymentInfo.qrCodeUrl);
        }
    }, [user, isOpen, adminPaymentInfo]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setQrFile(file);
            setQrPreview(URL.createObjectURL(file));
        }
    };

    const handleUserQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUserQrFile(file);
            setUserQrPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Update Profile (Name & Avatar)
            const finalAvatarUrl = avatarFile ? previewUrl : user?.avatarUrl;
            
            // 2. Prepare Profile Update Payload
            const updatePayload: any = {
                name,
                avatarUrl: finalAvatarUrl
            };

            // 3. If User, Handle QR Upload inside updateCurrentUser logic
            // Note: Currently updateCurrentUser in AuthContext calls API.AuthService.updateProfile.
            // We need to handle file upload before calling it, similar to register.
            // But for simplicity in this file, we pass the file to context if we modify context later,
            // or we depend on Context to handle it.
            // Let's modify context to accept qrFile for updateCurrentUser as well, or create a helper here.
            // Actually, updateCurrentUser in context only accepts Partial<User>.
            // We'll leverage the existing structure: Upload first, then update URL.
            
            // NOTE: Ideally this logic belongs in Context/Service, but doing here for speed without refactoring everything.
            // Wait, we can modify updateCurrentUser signature? No, let's keep it simple.
            
            // -- ADMIN LOGIC --
            if (user?.role === 'ADMIN') {
                const finalQrUrl = qrFile ? qrPreview : adminPaymentInfo.qrCodeUrl;
                await updateAdminPaymentInfo({
                    bankName,
                    accountName: accName,
                    accountNumber: accNumber,
                    promptPayId: promptPay,
                    qrCodeUrl: finalQrUrl
                }, qrFile); 
            } else if (user?.role === 'USER') {
                // -- USER QR LOGIC --
                // We need to upload the file if changed
                if (userQrFile) {
                    // We need a way to upload. We can use updateCurrentUser but it expects URL.
                    // So we must rely on Context or API to upload.
                    // Since we can't import API directly easily without breaking pattern (or we can),
                    // let's pass the file object to updateCurrentUser and let context handle it?
                    // No, context expects Partial<User>.
                    // Let's pass it as a special property if we modify types, or just let context handle the upload.
                    
                    // Actually, let's modify updateCurrentUser in AuthContext to accept an optional file.
                    // For now, let's assume we pass it in the payload and context handles it if it sees a File object?
                    // No, Type safety.
                    
                    // Workaround: We'll modify updateCurrentUser in AuthContext to accept `qrFile` as second argument.
                    // Check AuthContext.tsx changes.
                    await updateCurrentUser({ name, avatarUrl: finalAvatarUrl }, avatarFile, userQrFile);
                } else {
                    await updateCurrentUser({ name, avatarUrl: finalAvatarUrl }, avatarFile);
                }
            } else {
                // System Admin or fallback
                await updateCurrentUser({ name, avatarUrl: finalAvatarUrl }, avatarFile);
            }

            showAlert('บันทึกข้อมูลเรียบร้อยแล้ว', 'สำเร็จ', 'success');
            onClose();
        } catch(err) {
            console.error(err);
            showAlert('เกิดข้อผิดพลาดในการบันทึก', 'Error', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-slate-900 text-white p-6 relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                    <h3 className="text-xl font-bold">แก้ไขข้อมูลส่วนตัว</h3>
                    <p className="text-slate-400 text-sm">{user?.role === 'ADMIN' ? 'Administrator Setting' : 'Member Setting'}</p>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
                    {/* AVATAR & NAME */}
                    <div className="space-y-4">
                        <div className="flex flex-col items-center">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm bg-slate-200 relative">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <UserIcon size={32} />
                                        </div>
                                    )}
                                    
                                    {/* Overlay for visual cue */}
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <Camera className="text-white" size={24} />
                                    </div>

                                    {/* Real Input - z-index ensures it's clickable */}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">แตะเพื่อเปลี่ยนรูปโปรไฟล์</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1">ชื่อที่ใช้แสดง</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold placeholder:text-slate-400"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* USER RECEIVING QR CODE (For receiving money from Admin) */}
                    {user?.role === 'USER' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <QrCode size={16} className="text-emerald-600" /> QR Code รับเงิน (สำหรับให้ท้าวแชร์โอนคืน)
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-white rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group hover:border-emerald-500 transition-colors">
                                    {userQrPreview ? (
                                        <img src={userQrPreview} alt="QR Code" className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload className="text-slate-300 group-hover:text-emerald-500" size={24} />
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={handleUserQrChange}
                                    />
                                </div>
                                <div className="flex-1 text-xs text-slate-500">
                                    <p>อัปโหลดภาพ QR Code รับเงินของคุณ (พร้อมเพย์/บัญชีธนาคาร) เพื่อให้ท้าวแชร์สแกนโอนเงินคืนได้สะดวกเมื่อคุณเปียแชร์ได้</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADMIN PAYMENT SETTINGS (Only for Admin) */}
                    {user?.role === 'ADMIN' && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                            <h4 className="font-bold text-blue-900 flex items-center gap-2">
                                <Building2 size={18} /> ตั้งค่าบัญชีรับเงิน (สำหรับสมาชิก)
                            </h4>
                            
                            {/* QR Code Upload - FIXED CLICK AREA */}
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 bg-white rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center relative overflow-hidden group hover:border-blue-500 transition-colors">
                                    {qrPreview ? (
                                        <img src={qrPreview} alt="QR Code" className="w-full h-full object-cover" />
                                    ) : (
                                        <QrCode className="text-blue-300 group-hover:text-blue-500" size={32} />
                                    )}
                                    
                                    {/* Overlay Decoration (Pointer Events None) */}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] text-center p-1 pointer-events-none">
                                        <Upload size={16} className="mb-1"/>
                                        เปลี่ยน QR
                                    </div>

                                    {/* Real Input - High Z-Index to Ensure Clickability */}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={handleQrChange}
                                    />
                                </div>
                                <div className="flex-1">
                                     <p className="text-sm font-bold text-slate-700">QR Code รับเงิน (ภาพ)</p>
                                     <p className="text-xs text-slate-500">จิ้มที่กรอบสี่เหลี่ยมด้านซ้ายเพื่ออัปโหลดภาพ QR จากธนาคาร</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-blue-800 mb-1">ชื่อบัญชี</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-bold"
                                        placeholder="นายท้าวแชร์ ใจดี"
                                        value={accName}
                                        onChange={(e) => setAccName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">ชื่อธนาคาร</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                                        placeholder="เช่น KBANK"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 mb-1">เลขบัญชี (สำหรับ Copy)</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                                        placeholder="XXX-X-XXXXX"
                                        value={accNumber}
                                        onChange={(e) => setAccNumber(e.target.value)}
                                    />
                                </div>
                                {/* NEW PROMPTPAY INPUT FIELD */}
                                <div className="col-span-2 bg-white p-3 rounded-lg border border-blue-200">
                                    <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                                        <Smartphone size={12} /> PromptPay ID (สำหรับสร้าง QR อัตโนมัติ)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-blue-100 rounded-lg text-sm font-bold text-emerald-600 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-emerald-300/50"
                                        placeholder="เบอร์โทร (08x) หรือ เลขบัตร ปชช. (13 หลัก)"
                                        value={promptPay}
                                        onChange={(e) => setPromptPay(e.target.value)}
                                    />
                                    <p className="text-[10px] text-blue-400 mt-1">
                                        *กรอกเบอร์โทรหรือเลขบัตรประชาชนที่ผูกพร้อมเพย์ เพื่อให้ระบบสร้าง QR Code ใส่ยอดเงินให้อัตโนมัติ
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'กำลังบันทึก...' : <><Save size={20} /> บันทึกการเปลี่ยนแปลง</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false); // Modal State
  const { user, logout, members, transactions, circles, payouts } = useAppContext();

  // CALCULATE PENDING REQUESTS
  const pendingRequests = members.filter(m => m.status === 'PENDING').length;

  // CALCULATE PENDING TRANSACTIONS (WAITING_APPROVAL)
  // Filter only transactions belonging to circles visible to this user
  const myCircleIds = circles.map(c => c.id);
  const pendingTransactions = transactions.filter(t => 
      t.status === 'WAITING_APPROVAL' && myCircleIds.includes(t.circleId)
  ).length;

  // CALCULATE PENDING PAYOUTS (New Logic)
  // Counts rounds that are COMPLETED and have a winner, but DO NOT have a 'COMPLETED' payout record.
  const pendingPayoutsCount = circles.reduce((count, circle) => {
      // 1. Get rounds that should have been paid out
      const completedRounds = circle.rounds.filter(r => r.status === 'COMPLETED' && r.winnerId);
      
      // 2. Check if a payout record exists for these rounds
      const unpaidRounds = completedRounds.filter(r => {
          const payout = payouts.find(p => p.circleId === circle.id && p.roundNumber === r.roundNumber);
          // Pending if NO payout record exists OR status is PENDING
          return !payout || payout.status === 'PENDING';
      });

      return count + unpaidRounds.length;
  }, 0);

  // Define menu items based on Role
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'ภาพรวม (Dashboard)', path: '/' },
    { icon: Users, label: 'จัดการวงแชร์', path: '/circles' },
    { icon: Gavel, label: 'ศูนย์กลางการประมูล', path: '/bidding' },
    { icon: ClipboardList, label: 'ติดตามยอด', path: '/collection', badge: pendingTransactions },
    { icon: Banknote, label: 'การเงิน/จ่ายยอด (Payouts)', path: '/payouts', badge: pendingPayoutsCount }, // ADDED BADGE
    { icon: UserSquare2, label: 'ฐานข้อมูลสมาชิก', path: '/members', badge: pendingRequests }, 
    { icon: MessageSquare, label: 'ตั้งค่าข้อความ', path: '/scripts' }, 
  ];

  const userMenuItems = [
    { icon: LayoutDashboard, label: 'ภาพรวมของฉัน', path: '/' },
    { icon: CircleDollarSign, label: 'วงแชร์ของฉัน', path: '/my-circles' },
    { icon: Radio, label: 'ลานประมูล (Live)', path: '/live-auction' },
  ];

  const systemAdminMenuItems = [
    { icon: Shield, label: 'System Control', path: '/' },
  ];

  // Select which menu to display
  const menuItems = user?.role === 'SYSTEM_ADMIN' 
    ? systemAdminMenuItems 
    : user?.role === 'ADMIN' 
        ? adminMenuItems 
        : userMenuItems;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* PENDING LOCK SCREEN OVERLAY */}
      {user?.role === 'USER' && user?.status === 'PENDING' && (
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-500">
             <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-2 border-slate-100">
                 <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                     <Clock size={40} className="text-amber-500 animate-pulse" />
                     <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-amber-100">
                         <Lock size={16} className="text-amber-500" />
                     </div>
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">ข้อมูลอยู่ระหว่างการตรวจสอบ</h2>
                 <p className="text-slate-500 mb-6">
                     ขอบคุณที่สมัครสมาชิก! <br/>
                     ขณะนี้ข้อมูลของคุณถูกส่งไปยังท้าวแชร์เรียบร้อยแล้ว <br/>
                     <span className="font-bold text-slate-700">กรุณารอการอนุมัติเพื่อเริ่มใช้งาน</span>
                 </p>
                 
                 <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 border border-slate-200">
                     <p>ติดต่อท้าวแชร์หากรอนานเกินไป</p>
                 </div>

                 <button 
                     onClick={logout}
                     className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                 >
                     <LogOut size={18} /> ออกจากระบบ
                 </button>
             </div>
          </div>
      )}

      {/* Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl ${user?.status === 'PENDING' ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            ThaoPro
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {user?.role === 'SYSTEM_ADMIN' ? 'System Control Center' : user?.role === 'ADMIN' ? 'ระบบบริหารวงแชร์มืออาชีพ' : 'ระบบจัดการวงแชร์สำหรับสมาชิก'}
          </p>
        </div>
        
        {/* User Info (Clickable for Edit) */}
        <div 
            onClick={() => setIsEditProfileOpen(true)}
            className="px-6 py-4 bg-slate-800/50 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition-colors group relative"
            title="แก้ไขข้อมูลส่วนตัว"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden border-2 ${
             user?.role === 'SYSTEM_ADMIN' ? 'bg-red-600 border-red-500' :
             user?.role === 'ADMIN' ? 'bg-blue-500 border-blue-400' : 'bg-emerald-500 border-emerald-400'
          }`}>
            {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <UserIcon size={20} />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold truncate group-hover:text-blue-300 transition-colors">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate uppercase tracking-wider">{user?.role === 'SYSTEM_ADMIN' ? 'System Admin' : user?.role === 'ADMIN' ? 'Administrator' : 'Member'}</p>
          </div>
          <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
             <Edit2 size={14} />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item: any) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 p-3 rounded-xl transition-all relative ${
                  isActive
                    ? user?.role === 'SYSTEM_ADMIN'
                         ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                         : user?.role === 'ADMIN' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className={item.label.includes('Live') ? 'animate-pulse text-red-400' : ''} />
              <span className="font-medium flex-1">{item.label}</span>
              {/* Notification Badge */}
              {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {item.badge}
                  </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
           <button 
             onClick={logout}
             className="flex items-center space-x-2 text-slate-400 hover:text-red-400 w-full p-2 transition-colors"
           >
             <LogOut size={18} />
             <span>ออกจากระบบ</span>
           </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar Overlay */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${user?.status === 'PENDING' ? 'blur-sm pointer-events-none' : ''}`}>
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
          <h1 className="text-xl font-bold">ThaoPro</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 relative">
            <Menu size={24} />
            {(pendingRequests > 0 || pendingTransactions > 0 || pendingPayoutsCount > 0) && user?.role === 'ADMIN' && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
            )}
          </button>
        </header>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <nav className="absolute top-0 right-0 w-3/4 max-w-xs h-full bg-slate-900 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white">เมนูหลัก</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="text-white">
                  <X size={24} />
                </button>
              </div>

               {/* User Info Mobile */}
              <div 
                onClick={() => {
                    setIsSidebarOpen(false);
                    setIsEditProfileOpen(true);
                }}
                className="mb-6 px-3 py-4 bg-slate-800/50 rounded-xl flex items-center gap-3 border border-slate-700/50 cursor-pointer active:bg-slate-800"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden border-2 ${
                    user?.role === 'SYSTEM_ADMIN' ? 'bg-red-600 border-red-500' :
                    user?.role === 'ADMIN' ? 'bg-blue-500 border-blue-400' : 'bg-emerald-500 border-emerald-400'
                }`}>
                   {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={20} />
                    )}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.role === 'SYSTEM_ADMIN' ? 'System Admin' : user?.role === 'ADMIN' ? 'Administrator' : 'Member'}</p>
                </div>
                <Edit2 size={16} className="text-slate-500" />
              </div>

              <div className="space-y-3">
                {menuItems.map((item: any) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 p-3 rounded-lg transition-colors relative ${
                        isActive
                           ? user?.role === 'SYSTEM_ADMIN'
                             ? 'bg-red-600 text-white'
                             : user?.role === 'ADMIN' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-emerald-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <item.icon size={20} className={item.label.includes('Live') ? 'text-red-400' : ''} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                        </span>
                    )}
                  </NavLink>
                ))}
                
                <button 
                  onClick={() => {
                    logout();
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center space-x-3 p-3 rounded-lg transition-colors text-slate-300 hover:bg-slate-800 w-full"
                >
                   <LogOut size={20} />
                   <span>ออกจากระบบ</span>
                </button>
              </div>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* RENDER EDIT PROFILE MODAL */}
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </div>
  );
};

export default Layout;
